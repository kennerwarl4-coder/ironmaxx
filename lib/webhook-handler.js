/* ============================================================
   Processa os webhooks da SigiloPay. Usado tanto pela função
   serverless da Vercel (api/webhooks/sigilopay.js) quanto pelo
   servidor local (dev-server.js).
   ============================================================ */

const { sendPurchaseEvent } = require('./meta-capi');

const PAID_EVENTS = ['TRANSACTION_PAID'];

// Os nomes exatos dos campos dentro de "transaction"/"client" não estavam
// totalmente documentados — tentamos as variações mais prováveis. Se a
// SigiloPay usar outro nome, isso aparece nos logs do primeiro webhook real
// (console.log abaixo) e dá pra ajustar rapidinho.
function extractPaymentData(body) {
  const transaction = body.transaction || {};
  const client = body.client || {};

  return {
    transactionId: transaction.id || transaction.transactionId || body.transactionId,
    value: transaction.chargeAmount ?? transaction.amount ?? transaction.value,
    currency: transaction.currency || 'BRL',
    email: client.email,
    phone: client.phone,
  };
}

async function handleSigilopayWebhook(body) {
  const event = body && body.event;
  console.log('[sigilopay webhook] evento recebido:', event, JSON.stringify(body).slice(0, 500));

  if (!PAID_EVENTS.includes(event)) return;

  const { transactionId, value, currency, email, phone } = extractPaymentData(body);

  if (!transactionId || !value) {
    console.warn('[sigilopay webhook] TRANSACTION_PAID sem id/valor reconhecível — não deu pra enviar o Purchase:', JSON.stringify(body).slice(0, 500));
    return;
  }

  await sendPurchaseEvent({
    value,
    currency,
    email,
    phone,
    eventId: transactionId,
  });
}

module.exports = { handleSigilopayWebhook };
