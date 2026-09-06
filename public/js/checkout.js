/* ============================================================
   IRONMAXX — Checkout
   ============================================================ */
(function () {
  'use strict';

  const BUNDLE_PRICE = 149.90;
  const CART_KEY = 'ignite_cart';

  const $ = (sel, ctx) => (ctx || document).querySelector(sel);
  const $$ = (sel, ctx) => Array.from((ctx || document).querySelectorAll(sel));
  const brl = (n) => n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const escapeHtml = (s) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  /* ---------------------------------------------------------
     QUANTITY (from the product page's "add to cart")
  --------------------------------------------------------- */
  let qty = 1;
  try {
    const saved = JSON.parse(localStorage.getItem(CART_KEY));
    if (saved && saved.qty > 0) qty = saved.qty;
  } catch (e) { /* default qty = 1 */ }

  /* ---------------------------------------------------------
     TOAST
  --------------------------------------------------------- */
  const toast = $('#toast');
  function showToast(msg) {
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => toast.classList.remove('show'), 3000);
  }

  /* ---------------------------------------------------------
     INPUT MASKS
  --------------------------------------------------------- */
  function applyMask(el, template) {
    if (!el) return;
    el.addEventListener('input', () => {
      const digits = el.value.replace(/\D/g, '');
      let out = '';
      let di = 0;
      for (let i = 0; i < template.length && di < digits.length; i++) {
        if (template[i] === '0') { out += digits[di]; di++; }
        else { out += template[i]; }
      }
      el.value = out;
    });
  }
  applyMask($('#phone'), '(00) 00000-0000');
  applyMask($('#cpf'), '000.000.000-00');
  applyMask($('#cep'), '00000-000');

  const stateInput = $('#state');
  if (stateInput) stateInput.addEventListener('input', () => { stateInput.value = stateInput.value.toUpperCase(); });

  /* ---------------------------------------------------------
     ORDER SUMMARY
  --------------------------------------------------------- */
  function getShippingCost() {
    const checked = document.querySelector('input[name="shipping"]:checked');
    return checked ? Number(checked.dataset.price) : 0;
  }

  function updateSummary() {
    const subtotal = BUNDLE_PRICE * qty;
    const shippingCost = getShippingCost();
    const total = subtotal + shippingCost;

    $('#summaryQty').textContent = `Qtd: ${qty}`;
    $('#summaryItemPrice').textContent = `R$${brl(subtotal)}`;
    $('#summarySubtotal').textContent = `R$${brl(subtotal)}`;

    const shippingEl = $('#summaryShipping');
    shippingEl.textContent = shippingCost > 0 ? `R$${brl(shippingCost)}` : 'Grátis';
    shippingEl.classList.toggle('text-accent', shippingCost === 0);

    $('#summaryTotal').textContent = `R$${brl(total)}`;
    return { subtotal, shippingCost, total };
  }

  /* ---------------------------------------------------------
     OPTION CARDS (shipping / payment)
  --------------------------------------------------------- */
  $$('#shippingOptions .option-card').forEach((card) => {
    const input = $('input', card);
    input.addEventListener('change', () => {
      $$('#shippingOptions .option-card').forEach((c) => c.classList.remove('selected'));
      card.classList.add('selected');
      updateSummary();
    });
  });

  $$('#paymentOptions .option-card').forEach((card) => {
    const input = $('input', card);
    if (input.disabled) return;
    input.addEventListener('change', () => {
      $$('#paymentOptions .option-card').forEach((c) => c.classList.remove('selected'));
      card.classList.add('selected');
    });
  });

  /* ---------------------------------------------------------
     STEP FLOW
  --------------------------------------------------------- */
  let currentStep = 1;
  const stepCards = { 1: $('#step1'), 2: $('#step2'), 3: $('#step3') };
  const stepDots = $$('.checkout-steps__item');
  const stepLines = $$('.checkout-steps__line');
  const ctaLabel = $('#checkoutCtaLabel');
  const ctaLabels = { 1: 'Ir para entrega', 2: 'Ir para pagamento', 3: 'Confirmar pedido' };

  function render() {
    [1, 2, 3].forEach((n) => {
      const card = stepCards[n];
      card.classList.remove('is-active', 'is-done', 'is-disabled');
      if (n < currentStep) card.classList.add('is-done');
      else if (n === currentStep) card.classList.add('is-active');
      else card.classList.add('is-disabled');
    });
    stepDots.forEach((dot, i) => {
      const n = i + 1;
      dot.classList.remove('is-active', 'is-done');
      if (n < currentStep) dot.classList.add('is-done');
      else if (n === currentStep) dot.classList.add('is-active');
    });
    stepLines.forEach((line, i) => line.classList.toggle('is-done', currentStep > i + 1));
    if (ctaLabels[currentStep]) ctaLabel.textContent = ctaLabels[currentStep];
  }

  function validateStep(n) {
    let valid = true;
    let firstInvalid = null;
    $$('input[required]', stepCards[n]).forEach((input) => {
      const empty = !input.value.trim();
      input.classList.toggle('invalid', empty);
      if (empty && !firstInvalid) firstInvalid = input;
      if (empty) valid = false;
    });
    if (!valid) {
      showToast('Preencha os campos obrigatórios para continuar.');
      if (firstInvalid) firstInvalid.focus();
    }
    return valid;
  }

  function fillStep1Summary() {
    $('.checkout-card__summary', stepCards[1]).innerHTML =
      `<strong>${escapeHtml($('#fullName').value)}</strong> · ${escapeHtml($('#email').value)}`;
  }

  function fillStep2Summary() {
    const shipping = document.querySelector('input[name="shipping"]:checked');
    const price = Number(shipping.dataset.price);
    const priceText = price > 0 ? ` (R$${brl(price)})` : '';
    const complement = $('#complement').value.trim();
    $('.checkout-card__summary', stepCards[2]).innerHTML =
      `<strong>${escapeHtml($('#address').value)}${complement ? ', ' + escapeHtml(complement) : ''}</strong> — ` +
      `${escapeHtml($('#city').value)}/${escapeHtml($('#state').value)} · ${shipping.dataset.label}${priceText}`;
  }

  const checkoutCta = $('#checkoutCta');
  const checkoutCtaBar = $('.checkout-cta-bar');

  checkoutCta.addEventListener('click', () => {
    if (currentStep === 1) {
      if (!validateStep(1)) return;
      fillStep1Summary();
      currentStep = 2;
    } else if (currentStep === 2) {
      if (!validateStep(2)) return;
      fillStep2Summary();
      currentStep = 3;
    } else {
      startPixPayment();
      return;
    }
    render();
    stepCards[currentStep].scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  $$('.checkout-card__edit').forEach((btn) => {
    btn.addEventListener('click', () => {
      currentStep = Number(btn.dataset.edit);
      render();
      stepCards[currentStep].scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  /* ---------------------------------------------------------
     PIX PAYMENT (SigiloPay via /api/checkout/pix — chaves ficam no servidor)
  --------------------------------------------------------- */
  const pixPanel = $('#pixPanel');
  const pixCode = $('#pixCode');
  const pixQrImage = $('#pixQrImage');
  const pixStatus = $('#pixStatus');
  const pixCheckNow = $('#pixCheckNow');
  let pollTimer = null;
  let currentTransactionId = null;

  function setCtaLoading(isLoading, label) {
    checkoutCta.disabled = isLoading;
    checkoutCta.style.opacity = isLoading ? '0.6' : '';
    if (label) ctaLabel.textContent = label;
  }

  async function startPixPayment() {
    setCtaLoading(true, 'Gerando Pix...');

    const { total, shippingCost } = updateSummary();

    const body = {
      amount: total,
      shippingFee: shippingCost || undefined,
      client: {
        name: $('#fullName').value.trim(),
        email: $('#email').value.trim(),
        phone: $('#phone').value.trim(),
        document: $('#cpf').value.replace(/\D/g, ''),
      },
      items: [{ name: 'Kit Halteres Ajustáveis Ironmaxx', quantity: qty, unitPrice: BUNDLE_PRICE }],
      utm: window.IgniteTracking ? window.IgniteTracking.getUtmParams() : {},
    };

    let data;
    try {
      const response = await fetch('/api/checkout/pix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Não foi possível gerar o Pix.');
    } catch (err) {
      showToast(err.message || 'Erro ao gerar o Pix. Tente novamente.');
      setCtaLoading(false, ctaLabels[3]);
      return;
    }

    currentTransactionId = data.transactionId;
    const pix = data.pix || {};

    // 1) Esconde tudo que não é o pagamento em si — feito primeiro e sem depender
    // de nada abaixo, pra garantir que a tela fique limpa mesmo se o QR falhar.
    $('.checkout-title').hidden = true;
    $('.checkout-steps').hidden = true;
    $('#checkoutForm').hidden = true;
    $('#checkoutLayout').classList.add('is-paying');
    checkoutCtaBar.hidden = true;
    pixPanel.hidden = false;
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // 2) Código copia-e-cola (essencial pro pagamento).
    // "qrImage" é gerado pelo nosso servidor a partir do código (sempre confiável).
    // Os demais nomes ficam como fallback caso a SigiloPay já mande uma imagem pronta.
    const code = pix.code || pix.copyPaste || pix.qrcode || pix.qrCode || pix.emv || '';
    $('#pixAmount').textContent = `R$${brl(total)}`;
    pixCode.value = code;
    if (!code) console.warn('[pix] Não encontrei o código copia-e-cola na resposta da SigiloPay:', pix);

    // 3) Imagem do QR — isolada num try/catch próprio: se falhar por qualquer
    // motivo, o copia-e-cola acima continua funcionando normalmente.
    try {
      const qrImage = pix.qrImage || pix.base64 || pix.qrcodeImage || pix.qrCodeImage || pix.image || '';
      if (typeof qrImage === 'string' && qrImage) {
        pixQrImage.src = qrImage.startsWith('data:') ? qrImage : `data:image/png;base64,${qrImage}`;
        pixQrImage.hidden = false;
      } else {
        console.warn('[pix] Nenhuma imagem de QR na resposta:', pix);
      }
    } catch (err) {
      console.error('[pix] erro ao exibir o QR code:', err);
    }

    pollTimer = setInterval(() => checkPixStatus(false), 5000);
  }

  async function checkPixStatus(manual) {
    if (!currentTransactionId) return;
    if (manual) pixCheckNow.textContent = 'Verificando...';

    try {
      const response = await fetch(`/api/checkout/pix/${currentTransactionId}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);

      if (data.status === 'COMPLETED') {
        clearInterval(pollTimer);
        goToThankYouPage();
      } else if (['FAILED', 'REFUNDED', 'CHARGED_BACK'].includes(data.status)) {
        clearInterval(pollTimer);
        pixStatus.innerHTML = 'Este pagamento não foi aprovado. <a href="javascript:location.reload()">Gerar novo Pix</a>';
        pixStatus.classList.add('checkout-pix__status--error');
      } else if (manual) {
        showToast('Ainda não identificamos o pagamento — aguarde alguns segundos após pagar.');
      }
    } catch (err) {
      if (manual) showToast('Não foi possível verificar agora. Tente de novo em instantes.');
    }

    if (manual) pixCheckNow.textContent = 'Já paguei, verificar agora';
  }

  pixCheckNow.addEventListener('click', () => checkPixStatus(true));

  const pixCopyBtn = $('#pixCopyBtn');
  const pixCopyLabel = $('.checkout-pix__copy-label', pixCopyBtn);

  pixCopyBtn.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(pixCode.value);
    } catch (e) {
      pixCode.select();
      document.execCommand('copy');
    }

    pixCopyBtn.classList.add('is-copied');
    pixCopyLabel.textContent = 'Copiado!';
    clearTimeout(pixCopyBtn._t);
    pixCopyBtn._t = setTimeout(() => {
      pixCopyBtn.classList.remove('is-copied');
      pixCopyLabel.textContent = 'Copiar';
    }, 2000);
  });

  function goToThankYouPage() {
    const { total } = updateSummary();

    try {
      sessionStorage.setItem('ignite_order', JSON.stringify({
        orderId: currentTransactionId,
        total,
        qty,
        email: $('#email').value.trim(),
        payment: 'Pix',
      }));
    } catch (e) { /* ignore */ }

    try { localStorage.removeItem(CART_KEY); } catch (e) { /* ignore */ }

    window.location.href = window.IgniteTracking ? window.IgniteTracking.buildUrl('/obrigado') : '/obrigado';
  }

  /* ---------------------------------------------------------
     INIT
  --------------------------------------------------------- */
  const initialSummary = updateSummary();
  render();

  if (window.IgniteTracking) {
    window.IgniteTracking.trackInitiateCheckout(initialSummary.total, qty);
  }
})();
