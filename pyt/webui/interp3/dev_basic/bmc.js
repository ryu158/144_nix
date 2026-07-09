/* ---------------- Buy Me a Coffee Module ---------------- */
const BmcModule = {
  config: {
    id: 'YOUR_BMC_USERNAME',
    description: 'Support me on Buy me a coffee!',
    message: 'Thanks for using the tool!',
    color: '#2563eb',
    position: 'Right',
    xMargin: 18,
    yMargin: 18
  },

  init() {
    if (document.querySelector('script[data-name="BMC-Widget"]')) return;
    const script = document.createElement('script');
    script.setAttribute('data-name', 'BMC-Widget');
    script.setAttribute('data-cfasync', 'false');
    script.src = 'https://cdnjs.buymeacoffee.com/1.0.0/widget.prod.min.js';
    script.setAttribute('data-id', this.config.id);
    script.setAttribute('data-description', this.config.description);
    script.setAttribute('data-message', this.config.message);
    script.setAttribute('data-color', this.config.color);
    script.setAttribute('data-position', this.config.position);
    script.setAttribute('data-x_margin', this.config.xMargin);
    script.setAttribute('data-y_margin', this.config.yMargin);
    document.body.appendChild(script);
  }
};
