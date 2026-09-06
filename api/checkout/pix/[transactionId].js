const { getTransactionStatus } = require('../../../lib/sigilopay');

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ message: 'Método não permitido.' });
  }

  try {
    const { transactionId } = req.query;
    const { ok, status, data } = await getTransactionStatus(transactionId);
    if (!ok) return res.status(status).json({ message: data.message || 'Falha ao consultar o pagamento.' });
    res.json({ status: data.status, payedAt: data.payedAt || null });
  } catch (err) {
    console.error('[sigilopay] erro ao consultar status:', err);
    res.status(500).json({ message: 'Erro interno ao consultar o pagamento.' });
  }
};
