'use strict';

async function createInfoStates(adapter) {
  await adapter.setObjectNotExistsAsync('info.status', {
    type: 'state',
    common: { name: 'Status', type: 'string', role: 'text', read: true, write: false },
    native: {},
  });
  await adapter.setObjectNotExistsAsync('info.lastError', {
    type: 'state',
    common: { name: 'Last Error', type: 'string', role: 'text', read: true, write: false },
    native: {},
  });

  await adapter.setObjectNotExistsAsync('info.discoveredCameras', {
    type: 'state',
    common: { name: 'Discovered cameras (JSON)', type: 'string', role: 'json', read: true, write: false },
    native: {},
  });
}

module.exports = {
  createInfoStates,
};
