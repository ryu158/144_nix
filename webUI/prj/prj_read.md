# prj/ — File Summaries

Per-file notes for everything under `prj/`. For `dev_basic/*.js` and
`style.css`, see also the more detailed function-by-function docs in
`dev_basic/summary/*.md` (chart.md, grid.md, dual-chart.md, style.md).

## prj/dev_basic/ — shared components (see root-level note below)

> **Note:** this is a stale duplicate of the root `dev_basic/` per
> `CLAUDE.md` — always edit the root copy, not this one. Summarized here
> for completeness since it's still present in the tree.

- **grid.js** — `GridTable` class: dependency-free, virtualized
  spreadsheet-style grid (only visible rows/cols are rendered as DOM
  nodes). Supports cell selection/drag-select, inline contentEditable
  editing, keyboard navigation, copy/cut/paste of TSV/CSV, column/row
  resize, right-click insert/delete row/column menus, optional
  `fixedColCount` (locks column count, disables insert), and a
  `readOnly` mode that blocks edits/deletes/paste while still allowing
  copy. Emits a `change` event on any data mutation. Public API:
  `getData()`, `setData()`, `on()`, `destroy()`, `setReadOnly()`.

- **chart.js** — `Chart` class: dependency-free scatter+line chart drawn
  on `<canvas>`. Consumes the same 2D array shape as `GridTable.getData()`
  (col 0 = X, col 1..N = Y series). Handles axis scaling with "nice"
  tick generation, legend, hover tooltip + crosshair, a right-click
  context menu (toggle legend, "pop out" a high-res PNG snapshot in a
  new window), and `renderLayers()`/`renderInputOutput()` for drawing
  multiple stacked datasets (e.g. input scatter in front of output
  line) in one chart. Note: `destroy()` is defined twice on the object
  literal — the second definition silently wins (documented gotcha).

- **dual-chart.js** — `DualSeriesChart extends Chart`, plus standalone
  helper functions. Adds `seriesMeta` (per-column label/color overrides)
  without touching `chart.js`. Includes several generations of
  Input/Output merge helpers (`mergeGridsForChart`,
  `buildInputOutputMeta`, `buildInputOutputMetaIndexed`,
  `buildInputOutputMetaFromHeaders`) and matching
  `DualSeriesChart.prototype.plotFromGridsIndexed` /
  `plotFromGridsWithHeaders` convenience methods that take two
  `GridTable` instances directly. Also overrides `_renderLegend` to
  group "_input"/"_output" suffixed series onto separate legend rows.

- **ads.js** — `AdSenseModule`: lazily injects the Google AdSense script
  tag once, then renders either a responsive auto-sized ad unit
  (`init`/`renderUnit`) or a fixed-pixel-size unit
  (`initFixed`/`renderFixedUnit`) into a given container id.

- **bmc.js** — `BmcModule`: injects the "Buy Me a Coffee" widget script
  with configurable id/message/color/position. `config.id` is still the
  placeholder `'YOUR_BMC_USERNAME'` (per `logs/request_log.md`, this
  integration is unfinished — the live pages instead use Ko-fi, embedded
  inline in `index_interpolate.html`).

- **index_dev_basic.html** — Demo/test harness page for the shared
  components: wires up two `GridTable`s and one `Chart` with a "Plot
  chart" button, a fixed 728×90 AdSense footer banner, and the BMC
  widget. Not the production interpolate page (that's
  `interpolate/index_interpolate.html`).

- **style.css** — Shared stylesheet for the grid/chart/page shell:
  CSS variables for colors, top-level app flex layout, the `.gt-*`
  grid styles (headers, cells, selection/active/editing states,
  read-only mode, context menu), the `.ct-*` chart styles (tooltip,
  legend, context menu), and some Ko-fi/custom-link button styling
  tacked on at the bottom.

- **dev_basic/backup/** — Older snapshots of `index.html`,
  `index_test.html`, `grid.js`, `dual-chart.js`, `chart.js`, `style.css`,
  saved via the copy commands recorded in `logs/tricks.md`. Point-in-time
  backups, not part of the active app.

- **dev_basic/logs/** — Working notes, not code:
  - `request_log.md` — running checklist of requested features/fixes
    (mostly checked off) — column-count lock, aspect ratio, legend
    toggle, chart popout, grid write-protection, dual input/output
    charting, AdSense/BMC/Ko-fi integration, several dual-chart.js
    bugfixes (syntax error from a floating method, duplicate
    `plotFromGridsIndexed` reversing scatter/line layers), and the
    interpolate page's duplicate-inline-script / path-resolution bugs.
  - `error_log.md` — presumably a log of past bugs/errors (63 lines,
    not read in full for this summary).
  - `working_log.md` — presumably a running work log (94 lines, not
    read in full for this summary).
  - `tricks.md` — two one-line shell snippets for copying the live
    files into `backup/`.

- **dev_basic/summary/** — Per-component markdown docs following the
  project's documented format (`chart.md`, `dual-chart.md`, `grid.md`,
  `style.md`) — a numbered list of every method/rule-group in the
  corresponding file, one line each. Kept up to date via the
  `/component-summary` skill.

## prj/interpolate/ — the interpolation calculator (canonical, in use)

- **index_interpolate.html** — The production Interpolate Calculator
  page. SEO'd `<title>`/meta description, loads shared components from
  the root-absolute `/dev_basic/` paths (grid.js, chart.js,
  dual-chart.js) plus this folder's `interp_engine.js`/`page.js`. Layout:
  an Input grid, an Output grid (read-only), and a results chart, with a
  manual output-range control row (X start/finish/interval + method
  dropdown, currently linear-only) and a "interpolate" button. Also
  embeds a Ko-fi donate button/widget and floating tip-me overlay, and
  header links (Home / Advanced / interpolation help) pointing at
  `ryuora144.duckdns.org`.

- **interp_engine.js** — `InterpEngine` object: dependency-free linear
  interpolation used by the calculator. `_seriesPoints` extracts sorted
  `{x,y}` points for one Y column from a data2d table; `_interpAt` does
  binary-search + linear interpolation with no extrapolation (returns
  `null` outside the known X domain, written as a blank cell by the
  caller); `buildOutputTable` runs this across every Y series for a
  given array of query X's; `generateRange` builds an ascending X array
  from a start/finish/interval triple. Linear only — no
  quadratic/cubic/nearest here (that's only in `prj/test/`).

- **page.js** — Page controller wiring the interpolate page together
  (kept separate from grid.js/chart.js/dual-chart.js/interp_engine.js
  per `CLAUDE.md`'s module-boundary convention). Instantiates the Input
  `GridTable`, the read-only Output `GridTable`, and a
  `DualSeriesChart`. `plotBoth()` draws both grids via
  `plotFromGridsIndexed`. Two interpolation triggers: `interpolateAndPlot`
  (auto-runs off the Output grid's own X column whenever the Input grid
  or Output grid changes) and `interpolateAndPlotManual` (runs off the
  manual X start/finish/interval fields when the "interpolate" button is
  clicked) — both call `InterpEngine.buildOutputTable` and push the
  result into the Output grid.

- **test_data.csv** — Sample/scratch numeric dataset, no header row: 748
  rows × 10 columns (1 X column + 9 Y series), X ranging ~210 to ~487,
  Y values are small floats (roughly -0.01 to 0.02) — looks like
  detrended/noise-like measurement data used to exercise the
  interpolation engine and chart with a realistic multi-series dataset.

## prj/test/ — earlier standalone prototype (not part of main pipeline)

- **index_test.html** — Self-contained single-file prototype, predating
  the grid/chart split above. Loads Chart.js from a CDN and defines an
  inline TypeScript-flavored `Interp` namespace (compiled to JS, wrapped
  in an IIFE) supporting **linear, quadratic (spline), cubic (natural
  cubic spline), and nearest-neighbor** interpolation — the extra
  methods beyond linear that `interp_engine.js` doesn't have. Builds its
  own plain HTML `<table>` grid (not `GridTable`) with add/remove
  row/column, paste-from-Excel support, per-cell numeric validation, and
  a run button that either calls `Interp.run()` client-side or POSTs to
  a `/interpolate` server endpoint (a Flask backend `app.py` doesn't
  exist yet per `CLAUDE.md`, so the server path is currently
  aspirational/unused) and renders original vs. interpolated points as
  a Chart.js scatter+line combo. Self-validating: checks for duplicate
  X's, mismatched series lengths, interval/range sanity, and rejects
  extrapolation outside the original X range.
