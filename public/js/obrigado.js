/* ============================================================
   IRONMAXX — Página de obrigado (pós-pagamento)
   ============================================================ */
(function () {
  'use strict';

  const ORDER_KEY = 'ignite_order';
  const $ = (sel) => document.querySelector(sel);
  const brl = (n) => Number(n || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  let order = null;
  try {
    order = JSON.parse(sessionStorage.getItem(ORDER_KEY));
  } catch (e) { /* ignore */ }

  if (!order) {
    // Acesso direto, sem vir do checkout — some com o card de detalhes do pedido.
    const card = $('#thanksCard');
    if (card) card.hidden = true;
    return;
  }

  $('#thanksEmail').textContent = order.email || 'seu e-mail';
  $('#thanksOrderId').textContent = order.orderId || '—';
  $('#thanksPayment').textContent = order.payment || 'Pix';
  $('#thanksTotal').textContent = `R$${brl(order.total)}`;

  // Evita disparar o Purchase de novo se o cliente atualizar a página.
  if (window.IgniteTracking && order.orderId) {
    const trackedKey = `ignite_order_tracked_${order.orderId}`;
    let alreadyTracked = false;
    try { alreadyTracked = sessionStorage.getItem(trackedKey) === '1'; } catch (e) { /* ignore */ }

    if (!alreadyTracked) {
      window.IgniteTracking.trackPurchase(order.total, order.qty, order.orderId);
      try { sessionStorage.setItem(trackedKey, '1'); } catch (e) { /* ignore */ }
    }
  }
})();
