'use strict';

function createDeviceZonesWatcher(adapter, config, engine) {
  const deviceItems = (config.items || []).filter(it => it && it.kind === 'device' && it.enabled);
  const zoneIds = new Set();
  const timeIds = new Set();
  const deviceTargetIds = new Set();

  for (const it of deviceItems) {
    for (const z of it.zones || []) zoneIds.add(String(z));
    if (it.time && it.time.mode === 'astroWindow') {
      if (it.time.startStateId) timeIds.add(String(it.time.startStateId));
      if (it.time.endStateId) timeIds.add(String(it.time.endStateId));
    }
    if (it.device && it.device.targetStateId) deviceTargetIds.add(String(it.device.targetStateId));
  }

  const subscribed = new Set();
  let scheduledEval = null;
  let stateChangeHandler = null;

  const scheduleEval = () => {
    if (scheduledEval) return;
    scheduledEval = setTimeout(async () => {
      scheduledEval = null;
      await engine.evaluateDeviceItems();
    }, 100);
  };

  return {
    async start() {
      for (const id of zoneIds) {
        subscribed.add(id);
        adapter.subscribeForeignStates(id);
      }
      for (const id of timeIds) {
        subscribed.add(id);
        adapter.subscribeForeignStates(id);
      }
      for (const id of deviceTargetIds) {
        subscribed.add(id);
        adapter.subscribeForeignStates(id);
      }

      stateChangeHandler = (id, state) => {
        if (!state) return;
        if (subscribed.has(id)) {
          scheduleEval();
        }
      };
      adapter.on('stateChange', stateChangeHandler);

      // Initial sync
      await engine.evaluateDeviceItems();
    },
    async stop() {
      if (scheduledEval) {
        clearTimeout(scheduledEval);
        scheduledEval = null;
      }
      if (stateChangeHandler) {
        adapter.off('stateChange', stateChangeHandler);
        stateChangeHandler = null;
      }
      for (const id of subscribed) {
        adapter.unsubscribeForeignStates(id);
      }
      subscribed.clear();
    },
  };
}

module.exports = {
  createDeviceZonesWatcher,
};
