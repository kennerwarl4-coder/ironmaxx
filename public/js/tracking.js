/* ============================================================
   IRONMAXX — Tracking (UTMs + eventos do Meta Pixel)
   Carregado em todas as páginas, antes do script específico
   de cada uma (main.js / checkout.js).
   ============================================================ */
(function () {
  'use strict';

  var STORAGE_KEY = 'ignite_utm';
  var TRACKED_PARAMS = [
    'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term',
    'fbclid', 'gclid', 'ttclid',
  ];
  var CONTENT_ID = 'kit-halteres-ironmaxx';

  /* ---------------------------------------------------------
     Captura e persiste utm_source/medium/campaign/... e click ids
     assim que aparecerem na URL, pra sobreviver até o checkout
     mesmo que o cliente navegue por outras páginas sem eles.
  --------------------------------------------------------- */
  function captureFromUrl() {
    var params = new URLSearchParams(window.location.search);
    var data = {};
    var found = false;

    TRACKED_PARAMS.forEach(function (key) {
      var value = params.get(key);
      if (value) {
        data[key] = value;
        found = true;
      }
    });

    if (!found) return;

    try {
      data.capturedAt = new Date().toISOString();
      data.landingPage = window.location.pathname;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) { /* localStorage indisponível — segue sem persistir */ }
  }

  function getUtmParams() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      return {};
    }
  }

  /* ---------------------------------------------------------
     Faz os parâmetros seguirem o visitante pelos links internos
     do site (index -> checkout -> obrigado), pra Utmify e Meta
     continuarem enxergando eles na URL de cada página, e não só
     escondidos no localStorage.
  --------------------------------------------------------- */
  function buildUrlWithTracking(path) {
    var current = new URLSearchParams(window.location.search);
    var stored = getUtmParams();
    var params = new URLSearchParams();

    TRACKED_PARAMS.forEach(function (key) {
      var value = current.get(key) || stored[key];
      if (value) params.set(key, value);
    });

    var query = params.toString();
    if (!query) return path;
    return path + (path.indexOf('?') > -1 ? '&' : '?') + query;
  }

  function isInternalLink(href) {
    // só reescreve links internos raiz-relativos ("/checkout", "/") —
    // não mexe em âncoras (#...), externos, mailto:, tel: etc.
    return typeof href === 'string' && href.charAt(0) === '/' && href.charAt(1) !== '/';
  }

  function rewriteInternalLinks() {
    document.querySelectorAll('a[href]').forEach(function (a) {
      var href = a.getAttribute('href');
      if (isInternalLink(href)) {
        a.setAttribute('href', buildUrlWithTracking(href));
      }
    });
  }

  /* ---------------------------------------------------------
     Eventos do Meta Pixel — sempre com value/currency, essencial
     pro Meta otimizar campanhas por valor de compra.
  --------------------------------------------------------- */
  function fbqSafe() {
    return typeof window.fbq === 'function' ? window.fbq : null;
  }

  function trackInitiateCheckout(value, quantity) {
    var fbq = fbqSafe();
    if (!fbq) return;
    fbq('track', 'InitiateCheckout', {
      value: value,
      currency: 'BRL',
      content_type: 'product',
      content_name: 'Kit Halteres Ajustáveis Ironmaxx',
      content_ids: [CONTENT_ID],
      num_items: quantity || 1,
    });
  }

  function trackPurchase(value, quantity, orderId) {
    var fbq = fbqSafe();
    if (!fbq) return;
    var eventData = {
      value: value,
      currency: 'BRL',
      content_type: 'product',
      content_name: 'Kit Halteres Ajustáveis Ironmaxx',
      content_ids: [CONTENT_ID],
      num_items: quantity || 1,
    };
    if (orderId) {
      fbq('track', 'Purchase', eventData, { eventID: orderId });
    } else {
      fbq('track', 'Purchase', eventData);
    }
  }

  captureFromUrl();
  rewriteInternalLinks();

  window.IgniteTracking = {
    getUtmParams: getUtmParams,
    buildUrl: buildUrlWithTracking,
    trackInitiateCheckout: trackInitiateCheckout,
    trackPurchase: trackPurchase,
  };
})();
