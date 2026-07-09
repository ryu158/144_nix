/* ---------------- AdSense Module ---------------- */
const AdSenseModule = {
  config: {
    client: 'ca-pub-XXXXXXXXXXXXXXXX',
    slot: 'XXXXXXXXXX'
  },

  loadScript() {
    if (document.querySelector('script[data-adsense-loader]')) return;
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${this.config.client}`;
    script.crossOrigin = 'anonymous';
    script.setAttribute('data-adsense-loader', 'true');
    document.head.appendChild(script);
  },

  renderUnit(container) {
    const ins = document.createElement('ins');
    ins.className = 'adsbygoogle';
    ins.style.display = 'block';
    ins.setAttribute('data-ad-client', this.config.client);
    ins.setAttribute('data-ad-slot', this.config.slot);
    ins.setAttribute('data-ad-format', 'auto');
    ins.setAttribute('data-full-width-responsive', 'true');
    container.appendChild(ins);
    (window.adsbygoogle = window.adsbygoogle || []).push({});
  },

  init(containerId) {
    this.loadScript();
    const container = document.getElementById(containerId);
    if (container) this.renderUnit(container);
  }
};
