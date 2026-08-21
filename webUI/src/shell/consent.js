"use strict";
(function () {
    const KEY = 'consent';
    const stored = localStorage.getItem(KEY);
    if (stored === 'granted' || stored === 'denied') {
        window.dispatchEvent(new CustomEvent('consent-decided', { detail: stored }));
        return;
    }
    const bar = document.createElement('div');
    bar.style.cssText = [
        'position:fixed', 'left:0', 'right:0', 'bottom:0', 'z-index:9999',
        'display:flex', 'align-items:center', 'justify-content:center', 'gap:12px',
        'flex-wrap:wrap', 'padding:12px 16px',
        'background:var(--header-bg,#f4f6f8)', 'color:var(--header-fg,#6b7280)',
        'border-top:1px solid var(--accent-bg,#dbe7ff)', 'font-size:14px'
    ].join(';');
    bar.innerHTML = `
    <span>This site uses cookies for analytics.</span>
    <button type="button" data-choice="granted" style="background:var(--accent,#2563eb);color:#fff;border:none;border-radius:4px;padding:6px 14px;cursor:pointer;">Accept</button>
    <button type="button" data-choice="denied" style="background:transparent;color:var(--header-fg,#6b7280);border:1px solid var(--header-fg,#6b7280);border-radius:4px;padding:6px 14px;cursor:pointer;">Decline</button>
  `;
    bar.addEventListener('click', e => {
        const el = e.target;
        const choice = el && el.dataset && el.dataset.choice;
        if (!choice)
            return;
        localStorage.setItem(KEY, choice);
        bar.remove();
        window.dispatchEvent(new CustomEvent('consent-decided', { detail: choice }));
    });
    document.addEventListener('DOMContentLoaded', () => document.body.appendChild(bar));
})();
//# sourceMappingURL=consent.js.map