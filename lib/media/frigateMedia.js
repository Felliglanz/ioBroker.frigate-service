'use strict';

function buildHeaders(config) {
  const type = String(config.frigateAuthType || 'none');
  if (type === 'bearer' && config.frigateAuthBearerToken) {
    return { Authorization: `Bearer ${String(config.frigateAuthBearerToken)}` };
  }
  if (type === 'basic' && config.frigateAuthUsername && config.frigateAuthPassword !== undefined) {
    const b64 = Buffer.from(`${String(config.frigateAuthUsername)}:${String(config.frigateAuthPassword)}`).toString('base64');
    return { Authorization: `Basic ${b64}` };
  }
  return {};
}

function cleanBaseUrl(baseUrl) {
  return String(baseUrl || '').replace(/\/+$/, '');
}

function buildSnapshotUrl(baseUrl, eventId) {
  const base = cleanBaseUrl(baseUrl);
  return `${base}/api/events/${encodeURIComponent(eventId)}/snapshot.jpg`;
}

function buildClipUrl(baseUrl, eventId, paddingSeconds) {
  const base = cleanBaseUrl(baseUrl);
  const padding = Number.isFinite(Number(paddingSeconds)) ? Number(paddingSeconds) : 0;
  return `${base}/api/events/${encodeURIComponent(eventId)}/clip.mp4?padding=${encodeURIComponent(String(padding))}`;
}

async function readToBufferWithLimit(res, maxBytes) {
  const limit = Number(maxBytes);
  const cl = res.headers && typeof res.headers.get === 'function' ? res.headers.get('content-length') : null;
  if (cl) {
    const n = Number(cl);
    if (Number.isFinite(n) && Number.isFinite(limit) && limit > 0 && n > limit) {
      throw new Error(`Response too large (${n} bytes > ${limit} bytes)`);
    }
  }

  // Web ReadableStream (undici / global fetch)
  if (res.body && typeof res.body.getReader === 'function') {
    const reader = res.body.getReader();
    const chunks = [];
    let total = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) {
        const buf = Buffer.from(value);
        total += buf.length;
        if (Number.isFinite(limit) && limit > 0 && total > limit) {
          try { reader.cancel(); } catch { /* ignore */ }
          throw new Error(`Response too large (${total} bytes > ${limit} bytes)`);
        }
        chunks.push(buf);
      }
    }
    return Buffer.concat(chunks, total);
  }

  // Node.js Readable (node-fetch v2)
  if (res.body && typeof res.body.on === 'function') {
    return await new Promise((resolve, reject) => {
      let total = 0;
      const chunks = [];
      const onData = chunk => {
        const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
        total += buf.length;
        if (Number.isFinite(limit) && limit > 0 && total > limit) {
          try { res.body.destroy && res.body.destroy(); } catch { /* ignore */ }
          reject(new Error(`Response too large (${total} bytes > ${limit} bytes)`));
          return;
        }
        chunks.push(buf);
      };
      const onEnd = () => resolve(Buffer.concat(chunks, total));
      const onErr = err => reject(err);
      res.body.on('data', onData);
      res.body.on('end', onEnd);
      res.body.on('error', onErr);
    });
  }

  const ab = await res.arrayBuffer();
  const buf = Buffer.from(ab);
  if (Number.isFinite(limit) && limit > 0 && buf.length > limit) {
    throw new Error(`Response too large (${buf.length} bytes > ${limit} bytes)`);
  }
  return buf;
}

function createMediaFetcher(adapter, config) {
  const headers = buildHeaders(config);
  const baseUrl = String(config.frigateBaseUrl || '').trim();

  async function fetchSnapshot(eventId, opts) {
    if (!baseUrl) return null;
    const url = buildSnapshotUrl(baseUrl, eventId);
    const maxBytes = opts && opts.maxBytes ? Number(opts.maxBytes) : 0;
    const res = await fetch(url, { method: 'GET', headers });
    if (!res.ok) return null;
    try {
      const buffer = await readToBufferWithLimit(res, maxBytes);
      return { buffer };
    } catch (e) {
      adapter.log.warn(`Snapshot too large / read failed: ${e && e.message ? e.message : e}`);
      return null;
    }
  }

  async function fetchClip(eventId, opts) {
    if (!baseUrl) return { status: 'noBaseUrl', buffer: null };
    const paddingSeconds = opts && opts.paddingSeconds !== undefined ? opts.paddingSeconds : 0;
    const maxBytes = opts && opts.maxBytes ? Number(opts.maxBytes) : 0;
    const url = buildClipUrl(baseUrl, eventId, paddingSeconds);
    try {
      const res = await fetch(url, { method: 'GET', headers });
      if (!res.ok) return { status: 'httpError', buffer: null };
      const buffer = await readToBufferWithLimit(res, maxBytes);
      if (!buffer || !buffer.length) return { status: 'empty', buffer: null };
      return { status: 'ok', buffer };
    } catch (e) {
      const msg = String(e && e.message ? e.message : e);
      if (msg.includes('Response too large')) return { status: 'tooLarge', buffer: null };
      return { status: 'networkError', buffer: null };
    }
  }

  async function fetchClipWithRetries(eventId, opts) {
    const retries = opts && opts.retries ? Number(opts.retries) : 0;
    const retryDelayMs = opts && opts.retryDelayMs ? Number(opts.retryDelayMs) : 0;
    const attempts = Math.max(1, 1 + retries);
    for (let attempt = 1; attempt <= attempts; attempt++) {
      const result = await fetchClip(eventId, opts);
      if (!result) return { status: 'networkError', buffer: null };
      if (result.status === 'ok') return result;
      if (result.status === 'tooLarge') return result;
      if (attempt === attempts) return result;
      if (retryDelayMs > 0) await new Promise(r => setTimeout(r, retryDelayMs));
    }
    return { status: 'networkError', buffer: null };
  }

  return {
    fetchSnapshot,
    fetchClipWithRetries,
  };
}

module.exports = {
  createMediaFetcher,
};
