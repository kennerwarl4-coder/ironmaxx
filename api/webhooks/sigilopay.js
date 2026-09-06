const { handleSigilopayWebhook } = require('../../lib/webhook-handler');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end();
  }

  try {
    // Await aqui de propósito: numa função serverless, o processo pode ser
    // encerrado assim que a resposta é enviada, então esperamos o envio pra
    // Meta terminar antes de responder à SigiloPay.
    await handleSigilopayWebhook(req.body || {});
  } catch (err) {
    console.error('[sigilopay webhook] erro ao processar:', err);
  }

  res.status(200).end();
};
