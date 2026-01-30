'use strict';

// Very small smoke test that validates the module graph loads in plain Node.js.
// This does NOT start ioBroker.

const { normalizeConfig } = require('../lib/config/normalize');
const { createMediaFetcher } = require('../lib/media/frigateMedia');

function main() {
  const cfg = normalizeConfig({
    frigateInstance: 'frigate.0',
    cameras: [{ id: 'einfahrt', name: 'Einfahrt' }],
    notifyTargets: [{ id: 'discord', name: 'Discord', type: 'discordWebhook', webhookUrl: '' }],
    items: [],
  });

  // eslint-disable-next-line no-console
  console.log('[smoke] normalize ok:', !!cfg);

  // Media fetcher requires global fetch (Node 18+)
  if (typeof fetch !== 'function') {
    throw new Error('global fetch not available');
  }
  const dummyAdapter = { log: { warn: () => {} } };
  createMediaFetcher(dummyAdapter, cfg);
  // eslint-disable-next-line no-console
  console.log('[smoke] media fetcher ok');
}

main();
