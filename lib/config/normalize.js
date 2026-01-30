'use strict';

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function asString(value, fallback = '') {
  return value === undefined || value === null ? fallback : String(value);
}

function asNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function asBool(value, fallback = false) {
  if (value === true || value === false) return value;
  if (value === 'true') return true;
  if (value === 'false') return false;
  return fallback;
}

function normalizeConfig(native) {
  const cfg = native && typeof native === 'object' ? native : {};

  const cameras = asArray(cfg.cameras)
    .filter(c => c && typeof c === 'object')
    .map(c => ({ id: asString(c.id).trim(), name: asString(c.name).trim() }))
    .filter(c => !!c.id);

  const notifyTargets = asArray(cfg.notifyTargets)
    .filter(t => t && typeof t === 'object')
    .map(t => ({
      id: asString(t.id).trim(),
      name: asString(t.name).trim(),
      type: asString(t.type || 'discordWebhook').trim(),
      webhookUrl: asString(t.webhookUrl).trim(),
      botToken: asString(t.botToken).trim(),
      chatId: asString(t.chatId).trim(),
    }))
    .filter(t => !!t.id);

  const items = asArray(cfg.items)
    .filter(it => it && typeof it === 'object')
    .map(it => {
      const kind = asString(it.kind || 'notify');
      const filter = it.filter && typeof it.filter === 'object' ? it.filter : {};
      const notify = it.notify && typeof it.notify === 'object' ? it.notify : {};
      const device = it.device && typeof it.device === 'object' ? it.device : {};
      const time = it.time && typeof it.time === 'object' ? it.time : {};

      return {
        enabled: asBool(it.enabled, false),
        name: asString(it.name).trim(),
        kind: kind === 'device' ? 'device' : 'notify',
        cameras: asArray(it.cameras)
          .filter(c => c && typeof c === 'object')
          .map(c => ({
            cameraId: asString(c.cameraId).trim(),
            targetId: asString(c.targetId).trim(),
            comment: asString(c.comment).trim(),
          }))
          .filter(c => !!c.cameraId),
        filter: {
          types: asArray(filter.types).map(s => asString(s).trim()).filter(Boolean),
          label: asString(filter.label || 'person').trim(),
          subLabel: asString(filter.subLabel || '').trim(),
          enteredZones: asArray(filter.enteredZones).map(z => asString(z).trim()).filter(Boolean),
          minScore: asNumber(filter.minScore, 0.8),
          throttleMs: Math.max(0, asNumber(filter.throttleMs, 30000)),
          dedupeTtlMs: Math.max(0, asNumber(filter.dedupeTtlMs, 10 * 60 * 1000)),
        },
        notify: {
          targetId: asString(notify.targetId).trim(),
          mediaMode: asString(notify.mediaMode || 'clipFirst').trim(),
          clipPaddingSeconds: Math.max(0, asNumber(notify.clipPaddingSeconds, 0)),
          clipInitialDelayMs: Math.max(0, asNumber(notify.clipInitialDelayMs, 5000)),
          clipFetchRetries: Math.max(0, asNumber(notify.clipFetchRetries, 3)),
          clipFetchRetryDelayMs: Math.max(0, asNumber(notify.clipFetchRetryDelayMs, 2000)),
          clipFallbackToSnapshot: asBool(notify.clipFallbackToSnapshot, true),
          maxUploadMb: Math.max(1, asNumber(notify.maxUploadMb, 8)),
        },
        device: {
          targetStateId: asString(device.targetStateId).trim(),
          offDelayMs: Math.max(0, asNumber(device.offDelayMs, 30000)),
          safetyCheckIntervalMs: Math.max(0, asNumber(device.safetyCheckIntervalMs, 60000)),
        },
        zones: asArray(it.zones).map(z => asString(z).trim()).filter(Boolean),
        time: {
          mode: asString(time.mode || 'astroWindow').trim(),
          startStateId: asString(time.startStateId || 'javascript.0.variables.astro.goldenHour').trim(),
          endStateId: asString(time.endStateId || 'javascript.0.variables.astro.goldenHourEnd').trim(),
        },
      };
    });

  return {
    frigateInstance: asString(cfg.frigateInstance || 'frigate.0').trim() || 'frigate.0',
    frigateBaseUrl: asString(cfg.frigateBaseUrl || '').trim(),
    frigateAuthType: asString(cfg.frigateAuthType || 'none').trim(),
    frigateAuthUsername: asString(cfg.frigateAuthUsername || '').trim(),
    frigateAuthPassword: asString(cfg.frigateAuthPassword || ''),
    frigateAuthBearerToken: asString(cfg.frigateAuthBearerToken || ''),

    cameras,
    notifyTargets,
    items,
  };
}

module.exports = {
  normalizeConfig,
};
