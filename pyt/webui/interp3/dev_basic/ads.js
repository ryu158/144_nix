/* ---------------- AdSense Module ---------------- */
const AdSenseModule = {
  config: {
    client: 'ca-pub-6452790596934933',
    slot: '9842525526'
  },

loadScript() {
  const existing = document.querySelector('script[src*="adsbygoogle.js"]');
  if (existing) return;
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${this.config.client}`;
  script.crossOrigin = 'anonymous';
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
  },

	renderFixedUnit(container, width, height) {
		const ins = document.createElement('ins');
		ins.className = 'adsbygoogle';
		ins.style.display = 'inline-block';
		ins.style.width = `${width}px`;
		ins.style.height = `${height}px`;
		ins.setAttribute('data-ad-client', this.config.client);
		ins.setAttribute('data-ad-slot', this.config.slot);
		container.appendChild(ins);
		(window.adsbygoogle = window.adsbygoogle || []).push({});
	},

	initFixed(containerId, width, height) {
		this.loadScript();
		const container = document.getElementById(containerId);
		if (container) this.renderFixedUnit(container, width, height);
	}
};
