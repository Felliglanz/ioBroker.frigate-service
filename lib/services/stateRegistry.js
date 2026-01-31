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

  // Cleanup: Remove deprecated discoveredCameras state
  try {
    await adapter.delObjectAsync('info.discoveredCameras');
  } catch {
    // ignore if already deleted
  }
}

module.exports = {
  createInfoStates,
};
