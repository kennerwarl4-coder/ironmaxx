const { createPixCharge } = require('../../../lib/sigilopay');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ message: 'Método não permitido.' });
  }

  try {
    const { amount, shippingFee, client, items, utm } = req.body || {};

    if (!amount || !client || !client.name || !client.email || !client.document) {
      return res.status(400).json({ message: 'Dados obrigatórios ausentes (amount, client.name, client.email, client.document).' });
    }

    const { ok, status, data } = await createPixCharge({ amount, shippingFee, client, items, utm });

    if (!ok) {
      console.error('[sigilopay] erro ao criar pix:', JSON.stringify(data, null, 2));
      return res.status(status).json({
        message: data.message || 'Não foi possível gerar o Pix agora.',
        errorCode: data.errorCode,
        details: data.details,
      });
    }

    res.status(201).json({
      transactionId: data.transactionId,
      status: data.status,
      pix: data.pix,
      order: data.order,
    });
  } catch (err) {
    console.error('[sigilopay] erro inesperado ao criar pix:', err);
    res.status(500).json({ message: 'Erro interno ao gerar o Pix.' });
  }
};
