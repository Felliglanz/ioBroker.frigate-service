'use strict';

function uniqById(cameras) {
  const seen = new Set();
  const out = [];
  for (const c of cameras || []) {
    if (!c || !c.id) continue;
    const id = String(c.id).trim();
    if (!id || seen.has(id)) continue;
    seen.add(id);
    out.push({ id, name: c.name ? String(c.name).trim() : id });
  }
  return out;
}

function extractCameraId(prefix, objectId) {
  const marker = `${prefix}.cameras.`;
  if (!objectId || !objectId.startsWith(marker)) return null;
  const rest = objectId.slice(marker.length);
  // Expect "<cameraId>" or "<cameraId>.<something>"; we take first segment.
  const cameraId = rest.split('.')[0];
  return cameraId ? String(cameraId) : null;
}

async function discoverCamerasFromFrigateAdapter(adapter, frigateInstance) {
  const prefix = String(frigateInstance || 'frigate.0').trim() || 'frigate.0';
  const discovered = [];

  // Heuristic 1: camera channels under frigate.X.cameras.<cameraId>
  try {
    const channels = await adapter.getForeignObjectsAsync(`${prefix}.cameras.*`, 'channel');
    for (const [id, obj] of Object.entries(channels || {})) {
      const camId = extractCameraId(prefix, id);
      if (!camId) continue;
      const name = obj && obj.common && obj.common.name ? String(obj.common.name) : camId;
      discovered.push({ id: camId, name });
    }
  } catch {
    // ignore
  }

  // Heuristic 2: fallback to states under frigate.X.cameras.<cameraId>.*
  if (!discovered.length) {
    try {
      const states = await adapter.getForeignObjectsAsync(`${prefix}.cameras.*`, 'state');
      for (const id of Object.keys(states || {})) {
        const camId = extractCameraId(prefix, id);
        if (!camId) continue;
        discovered.push({ id: camId, name: camId });
      }
    } catch {
      // ignore
    }
  }

  return uniqById(discovered);
}

function mergeCameras(configCameras, discoveredCameras) {
  const configured = Array.isArray(configCameras) ? configCameras : [];
  const discovered = Array.isArray(discoveredCameras) ? discoveredCameras : [];

  const map = new Map();
  for (const c of configured) {
    if (!c || !c.id) continue;
    map.set(String(c.id), { id: String(c.id), name: c.name ? String(c.name) : String(c.id) });
  }
  for (const c of discovered) {
    if (!c || !c.id) continue;
    const id = String(c.id);
    if (!map.has(id)) {
      map.set(id, { id, name: c.name ? String(c.name) : id });
    }
  }
  return Array.from(map.values());
}

module.exports = {
  discoverCamerasFromFrigateAdapter,
  mergeCameras,
};
