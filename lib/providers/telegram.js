'use strict';

const FormData = require('form-data');

async function sendTelegram({ botToken, chatId, caption, attachment }) {
  if (!botToken) throw new Error('Telegram botToken missing');
  if (!chatId) throw new Error('Telegram chatId missing');
  if (!attachment || !attachment.buffer || !attachment.filename) throw new Error('Telegram attachment missing');

  const isVideo = (attachment.contentType || '').startsWith('video/');
  const endpoint = isVideo ? 'sendVideo' : 'sendPhoto';
  const url = `https://api.telegram.org/bot${encodeURIComponent(String(botToken))}/${endpoint}`;

  const form = new FormData();
  form.append('chat_id', String(chatId));
  if (caption) form.append('caption', String(caption));

  if (isVideo) {
    form.append('video', attachment.buffer, { filename: attachment.filename, contentType: attachment.contentType || 'video/mp4' });
  } else {
    form.append('photo', attachment.buffer, { filename: attachment.filename, contentType: attachment.contentType || 'image/jpeg' });
  }

  const res = await fetch(url, { method: 'POST', body: form, headers: form.getHeaders() });
  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    throw new Error(`Telegram ${endpoint} failed HTTP ${res.status}: ${txt}`.trim());
  }
}

module.exports = {
  sendTelegram,
};
