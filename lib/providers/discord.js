'use strict';

let LegacyFormData;
try {
  LegacyFormData = require('form-data');
} catch {
  LegacyFormData = null;
}

async function sendDiscordWebhook({ webhookUrl, content, embed, attachment }) {
  if (!webhookUrl) throw new Error('Discord webhookUrl missing');
  if (!attachment || !attachment.buffer || !attachment.filename) throw new Error('Discord attachment missing');

  const payload = {
    content: String(content || ''),
    embeds: [
      Object.assign(
        {
          color: 0xF1C40F,
          timestamp: new Date().toISOString(),
        },
        embed || {},
        attachment && attachment.filename && (attachment.contentType || '').startsWith('image/')
          ? { image: { url: `attachment://${attachment.filename}` } }
          : {}
      ),
    ],
  };

  // Ensure Discord receives a valid embed structure
  try {
    const e0 = payload.embeds && payload.embeds[0];
    if (e0 && Array.isArray(e0.fields)) {
      e0.fields = e0.fields.filter(Boolean);
    }
  } catch {
    // ignore
  }

  // Node 18+ built-in fetch (undici) plays best with native FormData/Blob.
  const hasNativeFormData = typeof FormData !== 'undefined' && typeof Blob !== 'undefined';

  let res;
  if (hasNativeFormData) {
    const form = new FormData();
    const blob = new Blob([attachment.buffer], { type: attachment.contentType || 'application/octet-stream' });
    // Discord webhook expects files[n]
    form.append('files[0]', blob, attachment.filename);
    form.append('payload_json', JSON.stringify(payload));
    res = await fetch(webhookUrl, { method: 'POST', body: form });
  } else if (LegacyFormData) {
    const form = new LegacyFormData();
    form.append('files[0]', attachment.buffer, { filename: attachment.filename, contentType: attachment.contentType || undefined });
    form.append('payload_json', JSON.stringify(payload));
    res = await fetch(webhookUrl, { method: 'POST', body: form, headers: form.getHeaders() });
  } else {
    throw new Error('Discord webhook upload not supported: FormData not available');
  }

  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    throw new Error(`Discord webhook failed HTTP ${res.status}: ${txt}`.trim());
  }
}

module.exports = {
  sendDiscordWebhook,
};
