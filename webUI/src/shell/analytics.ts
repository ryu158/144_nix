(function () {
  const GA_ID = 'G-R11GZ5HTXE';
  let loaded = false;

  function loadGA() {
    if (loaded) return;
    loaded = true;

    const s = document.createElement('script');
    s.async = true;
    s.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
    document.head.appendChild(s);

    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', GA_ID);
  }

  window.trackEvent = function (name: string, params?: Record<string, unknown>) {
    if (localStorage.getItem('consent') !== 'granted') return;
    if (typeof window.gtag === 'function') window.gtag('event', name, params || {});
  };

  function onDecision(choice: string) {
    if (choice === 'granted') loadGA();
  }

  window.addEventListener('consent-decided', e => onDecision((e as CustomEvent<string>).detail));
  const stored = localStorage.getItem('consent');
  if (stored) onDecision(stored);
})();
