'use strict';

const utils = require('@iobroker/adapter-core');
const { normalizeConfig } = require('./lib/config/normalize');
const { migrateNotifyTargetSecrets } = require('./lib/config/secrets');
const { createFrigateAdapterEventSource } = require('./lib/frigate/adapterEventSource');
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
