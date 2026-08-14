# Error Log

## 260714 — dual-chart.js: legend correct but scatter/line shapes reversed
- **found:** two separate `DualSeriesChart.prototype.plotFromGridsIndexed` definitions existed in the same file — a later one silently overwrote the earlier, correct one (last assignment to the same prototype property wins in JS)
- **cause:** the later definition called the old `renderInputOutput` override (input=line/front, output=dots/back) instead of building the layer array directly — labels stayed correct (still sourced from `buildInputOutputMetaIndexed`), but draw shape/order flipped
- **fix:** deleted the second, incorrect `plotFromGridsIndexed` definition; kept the first (input=dots/back, output=line/front), matching confirmed rules: `grid`=Input=scatter/back, `grid_2`=Output=line/front
- **also confirmed:** `page.js`'s `plotBoth()` was already correct (`plotFromGridsIndexed(grid, grid_2)`) — bug was isolated entirely to `dual-chart.js`

> **pattern:** fourth occurrence of same root class of bug (260708, 260709, 260710, 260713) — but this variant is new: not a missing/stale file, a **duplicate same-name definition inside one file** silently shadowing the correct version. Same lesson though — symptom (wrong visual output) looked like a logic bug but was actually a "which code is really running" problem; grep for duplicate method/function names before re-debugging logic.

## 260713 — dual-chart.js parse failure (DualSeriesChart never defined)
- **found:** `plotFromGrids(...)` written as bare method-shorthand at top level, outside any class/object body
- **cause:** invalid JS syntax outside a class → parse error for entire file → `DualSeriesChart` class never registers → `new DualSeriesChart(...)` fails in page.js
- **fix:** moved to `DualSeriesChart.prototype.plotFromGrids = function(...)`, attached after class definition — class body itself untouched

## 260713 — index_interpolate.html duplicate declarations
- **found:** inline `<script>` block at bottom of HTML re-declared `const grid`, `grid_2`, `chart`, duplicate `.on('change', ...)` listeners — page.js already declares these
- **cause:** `page.js` loads first via `<script src="page.js">`, inline block re-runs same `const` names in same top-level scope → `Identifier 'grid' has already been declared`, halts before inline block's plotBoth (which also skipped InterpEngine) ever runs
- **fix:** removed inline script block entirely — page.js is sole source of grid/chart wiring

## 260713 — interp_engine.js / page.js not loading on /interpolate
- **found:** two copies of interp_engine.js and page.js exist — real ones in `prj/interpolate/`, stray duplicates in `dev_basic/` (stray copies contained unrelated link-map HTML, not JS)
- **cause (files):** duplicate files left in dev_basic/ from earlier session, easy to edit/view wrong copy
- **cause (paths):** relative script paths (`interp_engine.js`, `../interpolate/interp_engine.js`) resolve against served URL, not disk layout; `/interpolate` route ambiguous on trailing slash (nginx rewrite) → relative paths resolved one level off from actual `prj/interpolate/` folder
- **fix:** switched to root-absolute paths (`/prj/interpolate/interp_engine.js`, `/prj/interpolate/page.js`) — confirmed correct against `root /home/opc/nix/pyt/webui/interp3;` in nginx config, works regardless of how `/interpolate` itself is routed
- **note:** typo'd path `../../prj/interpolat/interp_engine.js` appeared to "work" — actually stale cached/already-defined `InterpEngine` from a prior successful load, not a real resolution

> **pattern:** third occurrence of same root class of bug (260708, 260709, 260710) — file/path resolution issue disguised as a code bug; check served-URL + root config before assuming JS logic is wrong

## 260710 — Ad container zero-height + wrong placement
- **update:** confirmed via AdSense dashboard's own generated snippet — client/slot/fixed-size markup in `renderFixedUnit()` matches Google's official code exactly. Ruled out slot-type mismatch. 400s isolated to pending site approval.
- **found:** `#adContainer` inside `.panel-ad` had no height rule → `panel-body` class never applied to it (only sibling panels got it) → 0×0 collapse regardless of ad-serve status
- **cause:** `.panel-ad` (flex child of `.app-main`) only reserved width (`flex: 0 0 160px`), no height path
- **fix:** removed ad from `.app-main` entirely, moved to new `<footer class="app-footer-ad">` after `.app-main`, sized as fixed 728×90 (`.ad-slot-banner`) instead of relying on flex/responsive sizing
- **also:** switched from `renderUnit()` (responsive `data-full-width-responsive`) to new `renderFixedUnit()` — fixed-size units shouldn't use the responsive flag

> **pattern:** same class as 260708/260709 — new container added without confirming it inherits a sizing path from its parent chain

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
