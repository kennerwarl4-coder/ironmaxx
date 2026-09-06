/* ============================================================
   Servidor para desenvolvimento LOCAL (npm start).
   Em produção na Vercel, as rotas /api/* são servidas pelas
   funções serverless em api/ — este arquivo não roda lá.
   ============================================================ */

require('dotenv').config();

const express = require('express');
const path = require('path');
const { createPixCharge, getTransactionStatus } = require('./lib/sigilopay');
const { handleSigilopayWebhook } = require('./lib/webhook-handler');

const { SIGILOPAY_PUBLIC_KEY, SIGILOPAY_SECRET_KEY, PORT } = process.env;

if (!SIGILOPAY_PUBLIC_KEY || !SIGILOPAY_SECRET_KEY) {
  console.warn(
    '[sigilopay] SIGILOPAY_PUBLIC_KEY / SIGILOPAY_SECRET_KEY não configuradas no .env — as rotas de pagamento vão falhar.'
  );
}

const app = express();
app.use(express.json());
// extensions: ['html'] deixa /checkout funcionar sem precisar digitar .html,
// igual ao "cleanUrls" configurado no vercel.json pra produção.
app.use(express.static(path.join(__dirname, 'public'), { extensions: ['html'] }));

app.post('/api/checkout/pix', async (req, res) => {
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
});

app.get('/api/checkout/pix/:transactionId', async (req, res) => {
  try {
    const { ok, status, data } = await getTransactionStatus(req.params.transactionId);
    if (!ok) return res.status(status).json({ message: data.message || 'Falha ao consultar o pagamento.' });
    res.json({ status: data.status, payedAt: data.payedAt || null });
  } catch (err) {
    console.error('[sigilopay] erro ao consultar status:', err);
    res.status(500).json({ message: 'Erro interno ao consultar o pagamento.' });
  }
});

app.post('/api/webhooks/sigilopay', async (req, res) => {
  try {
    await handleSigilopayWebhook(req.body || {});
  } catch (err) {
    console.error('[sigilopay webhook] erro ao processar:', err);
  }
  res.sendStatus(200);
});

const port = PORT || 3000;
app.listen(port, () => {
  console.log(`Ignite rodando em http://localhost:${port}`);
});
