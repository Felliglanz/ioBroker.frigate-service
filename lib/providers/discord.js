'use strict';

const FormData = require('form-data');

async function sendDiscordWebhook({ webhookUrl, content, embed, attachment }) {
  if (!webhookUrl) throw new Error('Discord webhookUrl missing');
  if (!attachment || !attachment.buffer || !attachment.filename) throw new Error('Discord attachment missing');

  const form = new FormData();
  form.append('file', attachment.buffer, { filename: attachment.filename, contentType: attachment.contentType || undefined });

  const payload = {
    content: content || '',
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

  form.append('payload_json', JSON.stringify(payload));

  const res = await fetch(webhookUrl, { method: 'POST', body: form, headers: form.getHeaders() });
  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    throw new Error(`Discord webhook failed HTTP ${res.status}: ${txt}`.trim());
  }
}

module.exports = {
  sendDiscordWebhook,
};
