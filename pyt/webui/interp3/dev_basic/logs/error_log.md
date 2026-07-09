# Error Log

## style.css apply fail
- found in index.html, visible in dev tools, script.js loads fine
- **cause:** nginx.conf root dir / index file setting
- **fix:** index.html → /index.html

## 260708 — grid/chart build
- **css not load** → link tag fail → inlined css in html
- **click no work** → header divs cover grid (transparent, high z-index) → pointer-events: none on header container, auto on header cell
- **scroll breaks past ~20 rows** → sticky canvas sized to full content not viewport → set canvas w/h = scrollEl.clientWidth/Height in js
- **select row/col + select-all** → added mousedown+mouseenter on headers, corner = select-all, ctrl+a
- **multi-row/col context menu** → detect right-click inside existing multi-selection
- **fixed width not applying** → snippet given but never written to file → applied edit for real
- **% width/height broken** → % height needs every ancestor with explicit height → use vh for height, % ok for width
- **layout heavy, no scrollbar** → grid root height never set (only width) → mirror height onto root. bonus: throttled chart mousemove redraw via rAF

> **pattern:** something (css link, height mirror, file edit) skipped in one layer while working in another — check full render chain, not just JS

## 260709 — AdSense / BMC not visible
- dev tools show correct dom (aswift iframes, aframe, adtrafficquality.google, google_esf, bmc script loaded) but nothing renders
- **cause (adsense):** placeholder client/slot id → invalid → no ad served → `<ins>` has no intrinsic size → collapses to 0×0
- **cause (bmc):** placeholder `data-id` → unmatched page → script loads silently, button never renders
- **fix:** pending — need real adsense publisher/slot id + real bmc username
- **note:** adsense also needs account approval before ads serve

> **pattern:** config-layer placeholders left in place while code-layer wiring was correct — same lesson as 260708
