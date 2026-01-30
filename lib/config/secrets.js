'use strict';

const ENC_PREFIX = 'enc:';

function isEncrypted(value) {
  return typeof value === 'string' && value.startsWith(ENC_PREFIX) && value.length > ENC_PREFIX.length;
}

function encryptIfNeeded(adapter, value) {
  if (value === undefined || value === null) return '';
  const str = String(value);
  if (!str) return '';
  if (isEncrypted(str)) return str;
  if (!adapter || typeof adapter.encrypt !== 'function') {
    // Fallback: keep plaintext if encryption is unavailable
    return str;
  }
  return ENC_PREFIX + adapter.encrypt(str);
}

function decryptIfNeeded(adapter, value) {
  if (value === undefined || value === null) return '';
  const str = String(value);
  if (!str) return '';
  if (!isEncrypted(str)) return str;
  const payload = str.slice(ENC_PREFIX.length);
  if (!adapter || typeof adapter.decrypt !== 'function') {
    // Can't decrypt; return empty rather than leaking ciphertext into requests
    return '';
  }
  try {
    return adapter.decrypt(payload);
  } catch {
    return '';
  }
}

async function migrateNotifyTargetSecrets(adapter) {
  // Encrypt secrets inside notifyTargets rows and persist back to instance object.
  const instanceObjId = `system.adapter.${adapter.namespace}`;
  const instObj = await adapter.getForeignObjectAsync(instanceObjId).catch(() => null);
  if (!instObj || !instObj.native || typeof instObj.native !== 'object') return { changed: false };

  const native = instObj.native;
  const targets = Array.isArray(native.notifyTargets) ? native.notifyTargets : [];
  let changed = false;

  const nextTargets = targets.map(t => {
    if (!t || typeof t !== 'object') return t;
    const next = { ...t };

    if (next.webhookUrl) {
      const enc = encryptIfNeeded(adapter, next.webhookUrl);
      if (enc !== next.webhookUrl) {
        next.webhookUrl = enc;
        changed = true;
      }
    }
    if (next.botToken) {
      const enc = encryptIfNeeded(adapter, next.botToken);
      if (enc !== next.botToken) {
        next.botToken = enc;
        changed = true;
      }
    }

    return next;
  });

  if (!changed) return { changed: false };

  await adapter.extendForeignObjectAsync(instanceObjId, {
    native: {
      ...native,
      notifyTargets: nextTargets,
    },
  });

  return { changed: true };
}

module.exports = {
  encryptIfNeeded,
  decryptIfNeeded,
  migrateNotifyTargetSecrets,
};
