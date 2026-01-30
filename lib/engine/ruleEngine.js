'use strict';

const { createMediaFetcher } = require('../media/frigateMedia');
const { sendDiscordWebhook } = require('../providers/discord');
const { sendTelegram } = require('../providers/telegram');
const { evaluateDeviceItem } = require('../rules/deviceRule');
const { decryptIfNeeded } = require('../config/secrets');

function createRuleEngine(adapter, config) {
  const media = createMediaFetcher(adapter, config);

  const runtime = {
    lastSentByItemCamera: new Map(), // key: itemIndex|camera -> ts
    sentEventIdsByItem: new Map(), // key: itemIndex|eventId -> ts
    deviceTimers: new Map(), // key: itemIndex -> { offTimer, safetyTimer }
  };

  const getItemIndex = item => {
    const idx = (config.items || []).indexOf(item);
    return idx >= 0 ? idx : 0;
  };

  const wasSent = (itemIndex, eventId, ttlMs) => {
    const key = `${itemIndex}|${eventId}`;
    const last = runtime.sentEventIdsByItem.get(key) || 0;
    return last && Date.now() - last < ttlMs;
  };

  const markSent = (itemIndex, eventId) => {
    const key = `${itemIndex}|${eventId}`;
    runtime.sentEventIdsByItem.set(key, Date.now());
  };

  const shouldThrottle = (itemIndex, camera, throttleMs) => {
    const key = `${itemIndex}|${camera}`;
    const last = runtime.lastSentByItemCamera.get(key) || 0;
    const now = Date.now();
    if (now - last < throttleMs) return true;
    runtime.lastSentByItemCamera.set(key, now);
    return false;
  };

  const findTarget = targetId => {
    const targets = Array.isArray(config.notifyTargets) ? config.notifyTargets : [];
    return targets.find(t => t && t.id === targetId) || null;
  };

  const resolveCameraTarget = (item, camera) => {
    const cams = Array.isArray(item.cameras) ? item.cameras : [];
    const row = cams.find(c => c && c.cameraId === camera) || null;
    const targetId = (row && row.targetId) ? String(row.targetId) : String(item.notify && item.notify.targetId ? item.notify.targetId : '');
    const comment = row && row.comment ? String(row.comment) : '';
    return { targetId, comment };
  };

  const cameraMatchesItem = (item, camera) => {
    const cams = Array.isArray(item.cameras) ? item.cameras : [];
    if (!cams.length) return true;
    return cams.some(c => c && c.cameraId === camera);
  };

  const toDisplayName = cameraKey => {
    const cams = Array.isArray(config.cameras) ? config.cameras : [];
    const found = cams.find(c => c && c.id === cameraKey);
    if (found && found.name) return String(found.name);
    const raw = String(cameraKey || '').trim();
    if (!raw) return '';
    // best-effort prettify: "einfahrt" -> "Einfahrt", "front_door" -> "Front Door"
    return raw
      .replace(/[_-]+/g, ' ')
      .replace(/\s+/g, ' ')
      .split(' ')
      .map(w => w ? (w[0].toUpperCase() + w.slice(1)) : w)
      .join(' ');
  };

  async function handleFrigateEvent(ev) {
    const items = Array.isArray(config.items) ? config.items : [];
    for (const item of items) {
      if (!item || !item.enabled) continue;
      if (item.kind !== 'notify') continue;

      if (!ev || !ev.eventId || !ev.camera) continue;
      if (!cameraMatchesItem(item, ev.camera)) continue;

      const types = Array.isArray(item.filter && item.filter.types) ? item.filter.types : [];
      if (types.length && !types.includes(ev.type)) continue;
      const label = item.filter && item.filter.label ? String(item.filter.label) : '';
      if (label && ev.label !== label) continue;

      const subLabelFilter = item.filter && item.filter.subLabel ? String(item.filter.subLabel) : '';
      if (subLabelFilter) {
        const evSub = ev && ev.subLabel ? String(ev.subLabel) : '';
        if (evSub !== subLabelFilter) continue;
      }

      const enteredZonesFilter = Array.isArray(item.filter && item.filter.enteredZones) ? item.filter.enteredZones : [];
      if (enteredZonesFilter.length) {
        const evZones = Array.isArray(ev && ev.enteredZones) ? ev.enteredZones : [];
        const set = new Set(evZones.map(z => String(z)));
        const ok = enteredZonesFilter.some(z => set.has(String(z)));
        if (!ok) continue;
      }

      const minScore = item.filter && item.filter.minScore !== undefined ? Number(item.filter.minScore) : 0;
      if (!Number.isFinite(ev.score) || ev.score < minScore) continue;

      const itemIndex = getItemIndex(item);
      const throttleMs = Number(item.filter && item.filter.throttleMs) || 0;
      if (throttleMs > 0 && shouldThrottle(itemIndex, ev.camera, throttleMs)) continue;

      const ttlMs = Number(item.filter && item.filter.dedupeTtlMs) || 0;
      if (ttlMs > 0 && wasSent(itemIndex, ev.eventId, ttlMs)) continue;

      const { targetId, comment } = resolveCameraTarget(item, ev.camera);
      const target = findTarget(targetId);
      if (!target) {
        adapter.log.warn(`Notify item '${item.name || itemIndex}' has no valid target selected (targetId='${targetId}')`);
        continue;
      }

      const cameraName = toDisplayName(ev.camera);
      const content = [comment, `Person erkannt: ${cameraName}`].filter(Boolean).join(' ');

      // Media selection
      const mediaMode = item.notify && item.notify.mediaMode ? String(item.notify.mediaMode) : 'clipFirst';
      const clipPadding = Number(item.notify && item.notify.clipPaddingSeconds) || 0;
      const clipInitialDelayMs = Number(item.notify && item.notify.clipInitialDelayMs) || 0;
      const clipFetchRetries = Number(item.notify && item.notify.clipFetchRetries) || 0;
      const clipFetchRetryDelayMs = Number(item.notify && item.notify.clipFetchRetryDelayMs) || 0;
      const clipFallbackToSnapshot = item.notify && item.notify.clipFallbackToSnapshot !== false;
      const maxUploadMb = Number(item.notify && item.notify.maxUploadMb) || 8;
      const maxUploadBytes = Math.floor(Math.max(1, maxUploadMb) * 1024 * 1024 * 0.94);

      let attachment = null;
      if (mediaMode === 'clipFirst') {
        if (clipInitialDelayMs > 0) await new Promise(r => setTimeout(r, clipInitialDelayMs));
        const clip = await media.fetchClipWithRetries(ev.eventId, { paddingSeconds: clipPadding, maxBytes: maxUploadBytes, retries: clipFetchRetries, retryDelayMs: clipFetchRetryDelayMs });
        if (clip && clip.status === 'ok' && clip.buffer) {
          attachment = { buffer: clip.buffer, filename: `${ev.camera}_clip.mp4`, contentType: 'video/mp4' };
        } else if (clipFallbackToSnapshot) {
          const snap = await media.fetchSnapshot(ev.eventId, { maxBytes: maxUploadBytes });
          if (snap && snap.buffer) {
            attachment = { buffer: snap.buffer, filename: `${ev.camera}_snapshot.jpg`, contentType: 'image/jpeg' };
          }
        }
      } else {
        const snap = await media.fetchSnapshot(ev.eventId, { maxBytes: maxUploadBytes });
        if (snap && snap.buffer) {
          attachment = { buffer: snap.buffer, filename: `${ev.camera}_snapshot.jpg`, contentType: 'image/jpeg' };
        }
      }

      if (!attachment) {
        adapter.log.warn(`No media available for eventId=${ev.eventId} camera=${ev.camera}`);
        continue;
      }

      try {
        if (target.type === 'discordWebhook') {
          const fields = [
            { name: 'Kamera', value: String(cameraName), inline: true },
            { name: 'Score', value: Number.isFinite(ev.score) ? ev.score.toFixed(3) : 'n/a', inline: true },
            { name: 'Event', value: String(ev.eventId), inline: false },
            ev.subLabel ? { name: 'Sub-Label', value: String(ev.subLabel), inline: true } : null,
            Array.isArray(ev.enteredZones) && ev.enteredZones.length
              ? { name: 'Entered zones', value: ev.enteredZones.map(z => String(z)).join(', '), inline: false }
              : null,
          ].filter(Boolean);

          await sendDiscordWebhook({
            webhookUrl: decryptIfNeeded(adapter, target.webhookUrl),
            content,
            embed: {
              title: `Person erkannt – ${cameraName}`,
              fields,
            },
            attachment,
          });
        } else if (target.type === 'telegramBot') {
          await sendTelegram({
            botToken: decryptIfNeeded(adapter, target.botToken),
            chatId: target.chatId,
            caption: content,
            attachment,
          });
        } else {
          adapter.log.warn(`Unknown target type '${target.type}' for targetId='${targetId}'`);
          continue;
        }
      } catch (e) {
        adapter.log.error(`Send failed: ${e && e.stack ? e.stack : e}`);
        await adapter.setStateAsync('info.lastError', String(e && e.message ? e.message : e), true).catch(() => {});
        continue;
      }

      markSent(itemIndex, ev.eventId);
    }
  }

  async function evaluateDeviceItems() {
    const items = Array.isArray(config.items) ? config.items : [];
    for (let idx = 0; idx < items.length; idx++) {
      const item = items[idx];
      if (!item || !item.enabled) continue;
      if (item.kind !== 'device') continue;
      const timers = runtime.deviceTimers.get(idx) || { offTimer: null, safetyTimer: null };
      const next = await evaluateDeviceItem(adapter, item, timers);
      runtime.deviceTimers.set(idx, next);
    }
  }

  return {
    async handleFrigateEvent(ev) {
      return handleFrigateEvent(ev);
    },
    async evaluateDeviceItems() {
      return evaluateDeviceItems();
    },
    async stop() {
      for (const timers of runtime.deviceTimers.values()) {
        if (timers && timers.offTimer) clearTimeout(timers.offTimer);
        if (timers && timers.safetyTimer) clearInterval(timers.safetyTimer);
      }
      runtime.deviceTimers.clear();
    },
  };
}

module.exports = {
  createRuleEngine,
};
