/* ============================================================
   Meta Conversions API — envia o evento Purchase direto do
   servidor pra Meta quando o webhook da SigiloPay confirma o
   pagamento. Funciona independente do cliente estar com o site
   aberto ou não (diferente do pixel no navegador).

   Usa o mesmo event_id do pixel do navegador (o id da transação)
   pra Meta deduplicar automaticamente caso os dois cheguem.
   ============================================================ */

const crypto = require('crypto');

const META_API_VERSION = 'v21.0';
const META_PIXEL_ID = '1053979560754141';

function sha256(value) {
  if (!value) return undefined;
  return crypto.createHash('sha256').update(String(value).trim().toLowerCase()).digest('hex');
}

async function sendPurchaseEvent({ value, currency, email, phone, eventId, eventSourceUrl }) {
  const accessToken = process.env.META_ACCESS_TOKEN;

  if (!accessToken) {
    console.warn('[meta-capi] META_ACCESS_TOKEN não configurado — Purchase via servidor não enviado (só o do navegador, se o cliente chegou na página de obrigado).');
    return;
  }

  const payload = {
    data: [{
      event_name: 'Purchase',
      event_time: Math.floor(Date.now() / 1000),
      event_id: eventId,
      action_source: 'website',
      event_source_url: eventSourceUrl || process.env.PUBLIC_BASE_URL || undefined,
      user_data: {
        em: sha256(email),
        ph: sha256(phone ? String(phone).replace(/\D/g, '') : undefined),
      },
      custom_data: {
        currency: currency || 'BRL',
        value: Number(value),
      },
    }],
  };

  try {
    const response = await fetch(
      `https://graph.facebook.com/${META_API_VERSION}/${META_PIXEL_ID}/events?access_token=${accessToken}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }
    );
    const data = await response.json();
    if (!response.ok) {
      console.error('[meta-capi] erro ao enviar Purchase:', JSON.stringify(data));
    } else {
      console.log('[meta-capi] Purchase enviado via servidor. event_id:', eventId);
    }
  } catch (err) {
    console.error('[meta-capi] erro de rede ao enviar Purchase:', err);
  }
}

module.exports = { sendPurchaseEvent };
