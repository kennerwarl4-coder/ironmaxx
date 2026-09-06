/* ============================================================
   SigiloPay — client HTTP compartilhado entre o servidor local
   (server.js, Express) e as funções serverless da Vercel (api/*).
   As chaves só existem aqui, lidas de variáveis de ambiente —
   nunca em código versionado, nunca enviadas ao navegador.
   ============================================================ */

const crypto = require('crypto');
const QRCode = require('qrcode');

const SIGILOPAY_BASE_URL = 'https://app.sigilopay.com.br/api/v1';

function headers() {
  return {
    'Content-Type': 'application/json',
    'x-public-key': process.env.SIGILOPAY_PUBLIC_KEY,
    'x-secret-key': process.env.SIGILOPAY_SECRET_KEY,
  };
}

const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'fbclid', 'gclid', 'ttclid'];

// O utm chega do navegador (não confiável) — só repassamos as chaves conhecidas,
// só com caracteres normais de parâmetro de URL (evita injeção e bloqueio por
// WAF da adquirente ao ver algo como "<script>" dentro do metadata).
function sanitizeUtm(utm) {
  if (!utm || typeof utm !== 'object') return {};
  const clean = {};
  UTM_KEYS.forEach((key) => {
    const value = utm[key];
    if (typeof value !== 'string') return;
    const safe = value.trim().replace(/[^a-zA-Z0-9 _.\-:/]/g, '').slice(0, 120);
    if (safe) clean[key] = safe;
  });
  return clean;
}

function buildPixPayload({ amount, shippingFee, client, items, utm }) {
  const identifier = `ignite-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;

  // callbackUrl só é enviado se PUBLIC_BASE_URL estiver configurado (produção,
  // com domínio público e HTTPS) — em localhost não há URL pública pra receber webhook.
  const callbackUrl = process.env.PUBLIC_BASE_URL
    ? `${process.env.PUBLIC_BASE_URL}/api/webhooks/sigilopay`
    : undefined;

  return {
    identifier,
    amount: Number(amount),
    ...(shippingFee ? { shippingFee: Number(shippingFee) } : {}),
    client: {
      name: client.name,
      email: client.email,
      phone: client.phone,
      document: client.document,
    },
    // Nomes confirmados em teste real contra a API: "id" e "price" (não "unitPrice").
    products: (items || []).map((item, i) => ({
      id: item.id || `item-${i + 1}`,
      name: item.name,
      price: item.unitPrice,
      quantity: item.quantity,
    })),
    // UTMs vão junto no metadata — a SigiloPay já está integrada com a Utmify no
    // painel, então a origem da venda (campanha/anúncio) chega atribuída lá também.
    metadata: { source: 'ignite-checkout', identifier, ...sanitizeUtm(utm) },
    ...(callbackUrl ? { callbackUrl } : {}),
  };
}

// Lê a resposta como JSON com segurança — a adquirente (ou um WAF na frente
// dela) às vezes devolve uma página HTML de erro/bloqueio em vez de JSON, o
// que quebraria um .json() direto.
async function parseJsonSafe(response) {
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch (err) {
    console.error('[sigilopay] resposta não era JSON:', text.slice(0, 300));
    return { message: 'Resposta inesperada da SigiloPay. Tente novamente em instantes.' };
  }
}

async function createPixCharge(input) {
  const payload = buildPixPayload(input);
  const response = await fetch(`${SIGILOPAY_BASE_URL}/gateway/pix/receive`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(payload),
  });
  const data = await parseJsonSafe(response);

  // A SigiloPay às vezes não devolve uma imagem de QR pronta (campo "base64"
  // vem vazio) — nesse caso geramos o QR aqui mesmo a partir do código
  // copia-e-cola, que é sempre confiável.
  if (response.ok && data.pix && data.pix.code && !data.pix.base64) {
    try {
      data.pix.qrImage = await QRCode.toDataURL(data.pix.code, { margin: 1, width: 320 });
    } catch (err) {
      console.error('[sigilopay] falha ao gerar QR code local:', err);
    }
  }

  return { ok: response.ok, status: response.status, data };
}

async function getTransactionStatus(transactionId) {
  const response = await fetch(
    `${SIGILOPAY_BASE_URL}/gateway/transactions?id=${encodeURIComponent(transactionId)}`,
    { headers: headers() }
  );
  const data = await parseJsonSafe(response);
  return { ok: response.ok, status: response.status, data };
}

module.exports = { createPixCharge, getTransactionStatus };
