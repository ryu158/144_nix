# Working Log

## 260814 — Cleanup pass: dead code, stale duplicate, path convention, stale docs
**task:** user asked for an optimization review (report-only first, then "fix all")
**approach:** additive/low-risk fixes only — no refactors

- `chart.js`: removed the dead first `destroy()` definition (object-literal
  gotcha — second definition was already winning and is more complete,
  also cleans up `_documentClickHandler`)
- deleted stale `prj/dev_basic/` (228K, full duplicate of root `dev_basic/`
  including its own nested `backup/`) — flagged as do-not-edit in
  `CLAUDE.md` for a while, now actually gone
- `index.html` (root): stylesheet link changed from relative
  `./dev_basic/style.css` to root-absolute `/dev_basic/style.css`
- `CLAUDE.md`: corrected stale "index.html is a broken placeholder"
  description (it's a real link-map homepage now), removed references to
  the now-deleted `prj/dev_basic/`, noted the chart.js fix under the
  object-literal gotcha
- wrote `project_summary.md` (repo root) — plain-language project summary
- `.claude/hooks/block-prj-dev-basic.sh` left in place as a no-op safety
  net in case `prj/dev_basic/` ever gets recreated
**result:** all four flagged items fixed; logged in `claude_log/2026-08-14.md`

## 260814 — Interpolate blog post added
**task:** writeup explaining how the interpolation calculator works, per
`project_plan.md`'s tech-blog vision
**approach:** static content page, reuses shared header/button styling

- new page written explaining: linear interpolation math, the binary-search
  bracket lookup in `interp_engine.js`, why extrapolation is rejected
  (returns blank instead of guessing), the shared grid/chart data contract,
  and the two ways the page picks output X's
- user relocated the page to `prj/interpolate/interpolate_blog.html`
  (alongside the calculator) and wired the calculator's "❓interpolation"
  header link in `index_interpolate.html` to point at it
**result:** `prj/interpolate/interpolate_blog.html` live, linked from the calculator

## 260814 — Blog styles consolidated into dev_basic/style.css
**task:** integrate the blog page's design with the calculator instead of
duplicating styles per-page
**approach:** tried a separate shared `prj/interpolate/interpolate.css`
first; user preferred folding it into the canonical `dev_basic/style.css`
so the whole project shares one stylesheet — reverted the per-folder file,
redid it in the canonical file

- `style.css`: added `.post`/`.post h1`/`.post h2`/`.post pre`/`.post code`/
  `.post .note` article-prose rules, plus `body.blog-page { overflow: auto; }`
  scoped so it doesn't affect the calculator's fixed-viewport layout
- body/list text uses `var(--header-fg)` (soft grey `#6b7280`, same as the
  calculator's labels) instead of near-black, per user request for
  "a little bit grey" text
- `interpolate_blog.html`: removed inline `<style>` block, added
  `class="blog-page"` to `<body>`, now only links `/dev_basic/style.css`
**result:** one shared stylesheet drives both the calculator and the blog page

## 260814 — Header vertical alignment fix
**task:** "webUI blog" heading and the Calculator/Home buttons weren't
aligned vertically in the header
**finding:** shared `.controls-row` (`align-items: flex-end`) and
`.teal-button-link` (`margin: 25px -5px`) were tuned for the toolbar's
label-above-input fields, not a plain heading+buttons header row

- `style.css`: added `.app-header .controls-row { align-items: center; margin-top: 0; }`
  and `.app-header .teal-button-link { margin-top: 0; margin-bottom: 0; }`
  overrides, scoped to the header so the toolbar row is unaffected
**result:** heading and header buttons now share a baseline on both
`index_interpolate.html` and `interpolate_blog.html`

---

## 260714 — Dual chart legend: positional naming, grouping, and scatter/line reversal fix
**task:** legend should show input/output series by position (y1_input, y2_input, ... / y1_output, ...) instead of auto-generated column-letter labels, grouped Input-then-Output, with input as scatter (back) and output as line (front)
**approach:** additive-first (new functions/methods alongside existing ones), then a targeted deletion once a duplicate definition was found causing a visual regression

- `dual-chart.js`: added `buildInputOutputMetaIndexed()` — builds `y#_input`/`y#_output` seriesMeta maps by column position, no header/grid-name lookup
- `dual-chart.js`: added `DualSeriesChart.prototype.plotFromGridsIndexed()` — calls `renderLayers` directly (input=dots/back, output=line/front), bypassing the existing `renderInputOutput` override
- `dual-chart.js`: added `DualSeriesChart.prototype._renderLegend()` override — groups legend items by `_input`/`_output` label suffix onto separate rows, independent of internal series draw order
- `style.css`: added `.ct-legend-break` (forces legend row wrap between Input and Output groups)
- `page.js`: `plotBoth()` switched to `chart.plotFromGridsIndexed(grid, grid_2)`

**bug found:** a second, later `plotFromGridsIndexed` definition existed in `dual-chart.js` (from an earlier header-based-labels attempt) and silently overwrote the first — it called the old `renderInputOutput` override instead of `renderLayers` directly, so labels stayed correct but scatter/line shapes and draw order came out reversed
- **fix:** deleted the second, incorrect `plotFromGridsIndexed` definition — kept the first; see error_log 260714

**also:**
- `page.js`: added `pointRadius: 2.5` to `DualSeriesChart` construction options (default 3.5) — smaller scatter dots
- generated standalone markdown function/class summaries for `grid.js`, `chart.js`, `dual-chart.js`, `style.css`

**leftover from this session (not removed, flagged only):** `plotFromGridsWithHeaders()` + `buildInputOutputMetaFromHeaders()` in `dual-chart.js` — superseded by the indexed approach, currently unused dead code
**result:** legend now reads `y1_input, y2_input, ... / y1_output, y2_output, ...` on two grouped rows; input renders as smaller scatter dots behind, output as line in front — matches confirmed rules (grid=Input=scatter/back, grid_2=Output=line/front)

---

## 260713 — grid.js colLabel function change from alphabet to x,y1,y2...

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
