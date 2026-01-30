'use strict';

const utils = require('@iobroker/adapter-core');
const { normalizeConfig } = require('./lib/config/normalize');
const { migrateNotifyTargetSecrets } = require('./lib/config/secrets');
const { createFrigateAdapterEventSource } = require('./lib/frigate/adapterEventSource');
const { discoverCamerasFromFrigateAdapter, mergeCameras } = require('./lib/frigate/cameraDiscovery');
const { createDeviceZonesWatcher } = require('./lib/frigate/deviceZonesWatcher');
const { createRuleEngine } = require('./lib/engine/ruleEngine');
const stateRegistry = require('./lib/services/stateRegistry');

class FrigateService extends utils.Adapter {
  constructor(options = {}) {
    super({
      ...options,
      name: 'frigate-service',
    });

    this.isUnloading = false;
    this.runtime = {
      config: null,
      engine: null,
      frigateEvents: null,
      zonesWatcher: null,
    };

    this.on('ready', this.onReady.bind(this));
    this.on('message', this.onMessage.bind(this));
    this.on('unload', this.onUnload.bind(this));
  }

  async onMessage(obj) {
    if (!obj || !obj.command) return;

    if (obj.command === 'discoverCameras') {
      const respond = payload => {
        if (obj.callback) {
          this.sendTo(obj.from, obj.command, payload, obj.callback);
        }
      };

      try {
        const data = (obj.message && typeof obj.message === 'object') ? obj.message : {};
        const requestedInstances = Array.isArray(data.instances) ? data.instances.map(s => String(s).trim()).filter(Boolean) : null;

        let instances = requestedInstances;
        if (!instances || !instances.length) {
          const found = [];
          const instObjects = await this.getForeignObjectsAsync('system.adapter.frigate.*');
          for (const [id, o] of Object.entries(instObjects || {})) {
            if (!o || o.type !== 'instance') continue;
            const m = String(id).match(/^system\.adapter\.frigate\.(\d+)$/);
            if (!m) continue;
            found.push(`frigate.${m[1]}`);
          }
          instances = found.length ? found : [String(this.config.frigateInstance || 'frigate.0')];
        }

        const results = [];
        for (const inst of instances) {
          const cameras = await discoverCamerasFromFrigateAdapter(this, inst);
          results.push({ instance: inst, cameras });
        }

        respond({ ok: true, instances: results });
      } catch (e) {
        respond({ ok: false, error: e && e.message ? e.message : String(e) });
      }
    }
  }

  async onReady() {
    this.isUnloading = false;
    await stateRegistry.createInfoStates(this);

    // Ensure sensitive target secrets are encrypted at rest in the instance object.
    try {
      const mig = await migrateNotifyTargetSecrets(this);
      if (mig && mig.changed) {
        this.log.info('Encrypted notification target secrets in config (migration)');
      }
    } catch (e) {
      this.log.debug(`Secret migration failed: ${e && e.message ? e.message : e}`);
    }

    const config = normalizeConfig(this.config);

    // Optional: discover cameras from Frigate adapter object tree.
    try {
      const discovered = await discoverCamerasFromFrigateAdapter(this, config.frigateInstance);
      if (discovered.length) {
        config.cameras = mergeCameras(config.cameras, discovered);
        await this.setStateAsync('info.discoveredCameras', JSON.stringify(discovered), true);
        this.log.info(`Discovered ${discovered.length} camera(s) from ${config.frigateInstance}: ${discovered.map(c => c.id).join(', ')}`);
      } else {
        await this.setStateAsync('info.discoveredCameras', '[]', true);
      }
    } catch (e) {
      await this.setStateAsync('info.discoveredCameras', '[]', true).catch(() => {});
      this.log.debug(`Camera discovery failed: ${e && e.message ? e.message : e}`);
    }

    this.runtime.config = config;

    const engine = createRuleEngine(this, config);
    this.runtime.engine = engine;

    // Event source: Frigate adapter states -> FrigateEvent
    this.runtime.frigateEvents = createFrigateAdapterEventSource(this, config, engine);
    await this.runtime.frigateEvents.start();

    // Device items based on zone states + time condition
    this.runtime.zonesWatcher = createDeviceZonesWatcher(this, config, engine);
    await this.runtime.zonesWatcher.start();

    await this.setStateAsync('info.status', 'ok', true);
    this.log.info('Adapter started successfully');
  }

  async onUnload(callback) {
    try {
      this.isUnloading = true;
      await this.setStateAsync('info.status', 'stopping', true).catch(() => {});

      if (this.runtime.frigateEvents) {
        await this.runtime.frigateEvents.stop().catch(() => {});
      }
      if (this.runtime.zonesWatcher) {
        await this.runtime.zonesWatcher.stop().catch(() => {});
      }
      if (this.runtime.engine) {
        await this.runtime.engine.stop().catch(() => {});
      }
      callback();
    } catch (e) {
      callback();
    }
  }
}

if (require.main !== module) {
  module.exports = options => new FrigateService(options);
} else {
  (() => new FrigateService())();
}
