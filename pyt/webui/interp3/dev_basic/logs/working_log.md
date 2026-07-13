# Working Log

## 260713 — dual-chart.js + index_interpolate.html syntax/scope bugs fixed
**task:** restore working input→interpolate→output→chart flow on interpolate page
**approach:** fix syntax/scope errors only, no logic changes — existing InterpEngine/page.js flow was already correct in design

- `dual-chart.js`: `plotFromGrids` moved from invalid top-level block to `DualSeriesChart.prototype.plotFromGrids`
- `index_interpolate.html`: removed duplicate inline `<script>` block; `page.js` is now sole init source
**result:** both files now valid, page.js's interpolateAndPlot → InterpEngine → grid_2.setData → plotBoth flow intact

## 260713 — interp_engine.js / page.js path resolution fixed
**task:** figure out why interp_engine.js / page.js failed to load under some relative paths but not others
**approach:** traced disk layout vs served URL vs nginx root config, ruled out JS logic

- confirmed duplicate stray `interp_engine.js` / `page.js` in `dev_basic/` (unrelated content) vs real files in `prj/interpolate/`
- confirmed nginx `root /home/opc/nix/pyt/webui/interp3;` — root-absolute paths resolve directly off this
- `index_interpolate.html`: script paths switched to root-absolute (`/prj/interpolate/interp_engine.js`, `/prj/interpolate/page.js`)
**open item:** stray duplicate files in `dev_basic/` still on disk — recommend deleting to avoid future confusion
**result:** path resolution now stable regardless of `/interpolate` route's trailing-slash behavior

## 260710 — Ad repositioned: app-main → footer, fixed 728×90
**task:** move banner out of side panel into bottom footer at real leaderboard size
**approach:** additive — new footer section + new ad.js methods, old panel-ad rule left untouched

- `index_dev_basic.html`: removed `<aside class="panel panel-ad">` from `.app-main`; added `<footer class="app-footer-ad">` after `.app-main` closes, containing `#adContainer`
- `index_dev_basic.html`: init call swapped to `AdSenseModule.initFixed('adContainer', 728, 90)`
- `style.css`: added `.app-footer-ad` (centered flex footer) + `.ad-slot-banner` (728×90, dashed border placeholder)
- `ads.js`: added `renderFixedUnit()` + `initFixed()` — fixed-size sibling to existing responsive `renderUnit()`/`init()`, base methods untouched

**open question:** confirm AdSense slot `9842525526` was created as a fixed 728×90 unit on Google's side, not responsive — mismatched slot type may ignore inline width/height
**result:** layout wired, pending live-render confirmation once slot type is confirmed

## 260709 — Overlay Input/Output on interpolate chart
**task:** Input (scatter) + Output (line) on one chart, Output behind Input
**approach:** additive only, reused existing `renderLayers` draw-order in `Chart`

- `dual-chart.js`: `_parseDataWithMode()` override — per-layer seriesMeta, avoids key collisions
- `dual-chart.js`: `renderInputOutput()` override — draws Output (line, back) then Input (scatter, front)
- `dual-chart.js`: `buildInputOutputMeta()` — separate label/color maps
- `interpolate/index.html`: `plotBoth()` now calls `renderInputOutput()` instead of `mergeGridsForChart` + `render()`

**why:** base `Chart.renderInputOutput` lacked seriesMeta support; subclassed in `DualSeriesChart` instead of editing base class
**result:** scatter in front, line behind, independent styling, shared chart

---

## 260709 — AdSense + BMC integration (modularized)
**task:** add adsense + bmc without touching grid/chart code
**approach:** new standalone files, 2 script includes, 1 new aside panel

- `ads.js` (new): `AdSenseModule` — `loadScript()`, `renderUnit()`, `init()`
- `bmc.js` (new): `BmcModule` — `init()`
- `index_dev_basic.html`: added `ads.js`/`bmc.js` includes, `#adContainer` in new `.panel-ad` aside, init calls after `grid.on('change', ...)`
- `style.css`: added `.panel-ad { flex: 0 0 160px; max-width: 160px; }`

**result:** dom wiring confirmed correct (iframe chain, bmc script loaded), nothing visible yet — client/slot/id still placeholders, adsense also needs approval. see error_log 260709.

---

## 260709 — BMC donation popup (proposed, not applied)
**task:** popup/notification on BMC donation
**finding:** no backend in project; bmc widget has no client-side success callback → real confirmation needs server-side webhook

**proposed (client-only approx):**
- `bmc.js`: add `attachReturnListener()` + `showThankYouPopup()`, called from `init()`
- `style.css`: add `.bmc-popup` / `.bmc-popup-visible`

**mechanism:** click on bmc button → popup fires on next tab `visibilitychange`
**caveat:** not real payment confirmation — abandoned checkout still triggers popup
**status:** not yet implemented — pending decision on backend + webhook route
