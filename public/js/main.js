/* ============================================================
   IRONMAXX — Kit Halteres Ajustáveis · interactions
   ============================================================ */
(function () {
  'use strict';

  const BUNDLE_PRICE = 149.90;
  const PIX_DISCOUNT = 0.05;
  const INSTALLMENTS = 4;
  const FULL_PRICE = 399.90; // preço cheio (peças avulsas)
  const CART_KEY = 'ignite_cart';

  /* ---------------------------------------------------------
     UTIL
  --------------------------------------------------------- */
  const $ = (sel, ctx) => (ctx || document).querySelector(sel);
  const $$ = (sel, ctx) => Array.from((ctx || document).querySelectorAll(sel));
  const brl = (n) => n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  /* ---------------------------------------------------------
     SCROLL PROGRESS
  --------------------------------------------------------- */
  const progressBar = $('#progressBar');
  function onScroll() {
    const h = document.documentElement;
    const scrolled = h.scrollTop;
    const max = h.scrollHeight - h.clientHeight;
    progressBar.style.width = (max > 0 ? (scrolled / max) * 100 : 0) + '%';
  }
  document.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------------------------------------------------------
     REVEAL ON SCROLL
  --------------------------------------------------------- */
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.01, rootMargin: '0px 0px -40px 0px' });
  $$('.reveal').forEach((el) => io.observe(el));

  $$('.specs-grid, .flavor-grid, .reviews__track').forEach((group) => {
    Array.from(group.children).forEach((child, i) => {
      if (!child.style.getPropertyValue('--d')) child.style.setProperty('--d', i);
    });
  });

  /* ---------------------------------------------------------
     MOBILE MENU
  --------------------------------------------------------- */
  const menuToggle = $('#menuToggle');
  const mobileOverlay = $('#mobileOverlay');

  function closeMenu() {
    menuToggle.classList.remove('open');
    mobileOverlay.classList.remove('open');
    document.body.style.overflow = '';
  }
  menuToggle.addEventListener('click', () => {
    const open = menuToggle.classList.toggle('open');
    mobileOverlay.classList.toggle('open', open);
    document.body.style.overflow = open ? 'hidden' : '';
  });
  $$('a', mobileOverlay).forEach((a) => a.addEventListener('click', closeMenu));

  /* ---------------------------------------------------------
     PDP IMAGE GALLERY
  --------------------------------------------------------- */
  const galleryImages = $$('.pdp__image');
  const galleryThumbs = $$('.pdp__thumb');
  let galleryIndex = 0;

  function setGallerySlide(idx) {
    galleryIndex = (idx + galleryImages.length) % galleryImages.length;
    galleryImages.forEach((img) => {
      img.classList.toggle('active', Number(img.dataset.slide) === galleryIndex);
    });
    galleryThumbs.forEach((t) => {
      t.classList.toggle('active', Number(t.dataset.thumb) === galleryIndex);
    });
  }

  galleryThumbs.forEach((thumb) => {
    thumb.addEventListener('click', () => setGallerySlide(Number(thumb.dataset.thumb)));
  });

  const pdpPrev = $('#pdpPrev');
  const pdpNext = $('#pdpNext');
  if (pdpPrev) pdpPrev.addEventListener('click', () => setGallerySlide(galleryIndex - 1));
  if (pdpNext) pdpNext.addEventListener('click', () => setGallerySlide(galleryIndex + 1));

  /* ---- qty + price ---- */
  let qty = 1;
  const qtyValueEl = $('#qtyValue');
  const priceMainEl = $('#priceMain');
  const pricePixEl = $('#pricePix');
  const priceInstallEl = $('#priceInstall');
  const priceOldEl = $('.pdp__price-old s');

  function renderPrice() {
    const total = BUNDLE_PRICE * qty;
    const pix = total * (1 - PIX_DISCOUNT);
    const install = total / INSTALLMENTS;
    priceMainEl.textContent = `R$${brl(total)}`;
    pricePixEl.textContent = `R$${brl(pix)}`;
    priceOldEl.textContent = `R$${brl(FULL_PRICE * qty)}`;
    priceInstallEl.childNodes[0].nodeValue = `${INSTALLMENTS}x de R$${brl(install)} sem juros · `;
    qtyValueEl.textContent = qty;
  }

  $('#qtyPlus').addEventListener('click', () => { qty = Math.min(qty + 1, 10); renderPrice(); });
  $('#qtyMinus').addEventListener('click', () => { qty = Math.max(qty - 1, 1); renderPrice(); });

  /* ---- buy now ---- */
  const cartCount = $('#cartCount');
  const toast = $('#toast');
  const buyNowBtn = $('#buyNowBtn');
  let cartTotal = 0;
  try {
    const saved = JSON.parse(localStorage.getItem(CART_KEY));
    if (saved && saved.qty > 0) {
      cartTotal = saved.qty;
      cartCount.textContent = cartTotal;
      cartCount.classList.add('show');
    }
  } catch (e) { /* ignore corrupted cart data */ }

  function showToast(msg) {
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => toast.classList.remove('show'), 3200);
  }

  buyNowBtn.addEventListener('click', () => {
    try {
      localStorage.setItem(CART_KEY, JSON.stringify({ qty }));
    } catch (e) { /* localStorage indisponível — checkout usa qty padrão */ }

    window.location.href = window.IgniteTracking ? window.IgniteTracking.buildUrl('/checkout') : '/checkout';
  });

  /* ---------------------------------------------------------
     ACCORDION (FAQ)
  --------------------------------------------------------- */
  $$('.accordion__item').forEach((item) => {
    const trigger = $('.accordion__trigger', item);
    const panel = $('.accordion__panel', item);
    trigger.addEventListener('click', () => {
      const isOpen = item.classList.contains('open');
      $$('.accordion__item').forEach((other) => {
        other.classList.remove('open');
        $('.accordion__panel', other).style.maxHeight = null;
      });
      if (!isOpen) {
        item.classList.add('open');
        panel.style.maxHeight = panel.scrollHeight + 'px';
      }
    });
  });

  /* ---------------------------------------------------------
     NEWSLETTER
  --------------------------------------------------------- */
  const newsletterForm = $('#newsletterForm');
  const newsletterMsg = $('#newsletterMsg');
  newsletterForm.addEventListener('submit', (e) => {
    e.preventDefault();
    newsletterMsg.textContent = 'Inscrição confirmada! Fique de olho no seu e-mail. ✓';
    newsletterForm.reset();
    setTimeout(() => { newsletterMsg.textContent = ''; }, 5000);
  });

  /* ---------------------------------------------------------
     FLOATING CHAT (decorative toggle)
  --------------------------------------------------------- */
  const chatFab = $('#chatFab');
  if (chatFab) {
    chatFab.addEventListener('click', () => showToast('Atendimento por chat em breve por aqui — use o WhatsApp!'));
  }

  /* ---------------------------------------------------------
     HEADER SEARCH SHORTCUT
  --------------------------------------------------------- */
  const searchBtn = $('#searchBtn');
  if (searchBtn) {
    searchBtn.addEventListener('click', () => showToast('Por enquanto só temos o Kit Halteres Ironmaxx por aqui ✨'));
  }

  /* ---------------------------------------------------------
     INIT
  --------------------------------------------------------- */
  renderPrice();
})();
