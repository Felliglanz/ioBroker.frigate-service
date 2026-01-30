'use strict';

function parseTimeString(timeString) {
  if (!timeString || typeof timeString !== 'string') return null;
  const parts = timeString.split(':');
  if (parts.length < 2) return null;
  const h = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  return h * 60 + m;
}

async function isAstroWindowActive(adapter, startId, endId) {
  const now = new Date();
  const currentTime = now.getHours() * 60 + now.getMinutes();

  const [startSt, endSt] = await Promise.all([
    adapter.getForeignStateAsync(startId),
    adapter.getForeignStateAsync(endId),
  ]);
  const start = parseTimeString(startSt && startSt.val !== undefined ? String(startSt.val) : '');
  const endOrig = parseTimeString(endSt && endSt.val !== undefined ? String(endSt.val) : '');
  if (start === null || endOrig === null) return false;

  let end = endOrig;
  if (start > endOrig) end = endOrig + 1440;

  let adjustedCurrent = currentTime;
  if (start > endOrig && currentTime < start) adjustedCurrent = currentTime + 1440;
  return adjustedCurrent >= start && adjustedCurrent < end;
}

async function anyPersonDetected(adapter, zoneIds) {
  if (!Array.isArray(zoneIds) || !zoneIds.length) return false;
  const states = await Promise.all(zoneIds.map(id => adapter.getForeignStateAsync(id)));
  for (const st of states) {
    const v = st && st.val !== undefined ? Number(st.val) : 0;
    if (Number.isFinite(v) && v > 0) return true;
  }
  return false;
}

async function evaluateDeviceItem(adapter, item, timers) {
  const nextTimers = timers || { offTimer: null, safetyTimer: null };
  const lampId = item.device && item.device.targetStateId ? String(item.device.targetStateId) : '';
  if (!lampId) return nextTimers;

  const zones = Array.isArray(item.zones) ? item.zones : [];
  const person = await anyPersonDetected(adapter, zones);

  const timeMode = item.time && item.time.mode ? String(item.time.mode) : 'astroWindow';
  let timeOk = true;
  if (timeMode === 'astroWindow') {
    const startId = item.time && item.time.startStateId ? String(item.time.startStateId) : '';
    const endId = item.time && item.time.endStateId ? String(item.time.endStateId) : '';
    if (startId && endId) {
      timeOk = await isAstroWindowActive(adapter, startId, endId);
    } else {
      timeOk = false;
    }
  }

  const shouldBeOn = person && timeOk;
  const lampSt = await adapter.getForeignStateAsync(lampId).catch(() => null);
  const lampIsOn = lampSt && lampSt.val === true;

  const ensureOffTimerCleared = () => {
    if (nextTimers.offTimer) {
      clearTimeout(nextTimers.offTimer);
      nextTimers.offTimer = null;
    }
  };

  if (shouldBeOn) {
    if (!lampIsOn) {
      await adapter.setForeignStateAsync(lampId, true).catch(e => adapter.log.warn(`Failed to turn on ${lampId}: ${e}`));
    }
    ensureOffTimerCleared();
  } else {
    // If no person at all -> delayed off
    if (!person) {
      const offDelayMs = Math.max(0, Number(item.device && item.device.offDelayMs) || 0);
      if (!nextTimers.offTimer && offDelayMs > 0) {
        nextTimers.offTimer = setTimeout(async () => {
          nextTimers.offTimer = null;
          const personNow = await anyPersonDetected(adapter, zones);
          if (!personNow) {
            await adapter.setForeignStateAsync(lampId, false).catch(e => adapter.log.warn(`Failed to turn off ${lampId}: ${e}`));
          }
        }, offDelayMs);
      }
      if (offDelayMs === 0) {
        await adapter.setForeignStateAsync(lampId, false).catch(e => adapter.log.warn(`Failed to turn off ${lampId}: ${e}`));
      }
    }
  }

  // Safety interval (per item)
  const safetyIntervalMs = Math.max(0, Number(item.device && item.device.safetyCheckIntervalMs) || 0);
  if (!nextTimers.safetyTimer && safetyIntervalMs > 0) {
    nextTimers.safetyTimer = setInterval(async () => {
      try {
        const personNow = await anyPersonDetected(adapter, zones);
        let timeOkNow = true;
        if (timeMode === 'astroWindow') {
          const startId = item.time && item.time.startStateId ? String(item.time.startStateId) : '';
          const endId = item.time && item.time.endStateId ? String(item.time.endStateId) : '';
          timeOkNow = startId && endId ? await isAstroWindowActive(adapter, startId, endId) : false;
        }
        const shouldBeOnNow = personNow && timeOkNow;
        const lampStNow = await adapter.getForeignStateAsync(lampId).catch(() => null);
        const lampOnNow = lampStNow && lampStNow.val === true;
        if (lampOnNow && !shouldBeOnNow) {
          await adapter.setForeignStateAsync(lampId, false).catch(() => {});
          ensureOffTimerCleared();
        }
      } catch {
        // ignore
      }
    }, safetyIntervalMs);
  }

  return nextTimers;
}

module.exports = {
  evaluateDeviceItem,
};
