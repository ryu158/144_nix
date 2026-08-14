# dual-chart.js — Summary

**Class:** `DualSeriesChart extends Chart` — adds per-series label/color overrides via `seriesMeta` (keyed by 1-based column index), without modifying `chart.js`.

1. constructor: Calls `Chart`'s constructor, then stores an optional `seriesMeta` map from options.
2. setSeriesMeta: Replaces the current `seriesMeta` map.
3. _parseDataWithMode (override): Like `Chart`'s version, but temporarily swaps in a layer-specific `seriesMeta` during parsing so two independently-numbered datasets don't collide on the same column keys.
4. renderInputOutput (override): Renders an "output" scatter layer (back) and an "input" line layer (front), each using its own `inputMeta`/`outputMeta` seriesMeta.
5. _parseData (override): Same parsing contract as `Chart._parseData`, but applies `seriesMeta` label/color overrides per column when building series.

**Standalone helper functions:**

6. mergeGridsForChart: Merges two `grid.getData()` tables (Input/Output) into one combined table plus a single offset `seriesMeta` map, for rendering both datasets as one merged chart.
7. buildInputOutputMeta: Builds separate `inputMeta`/`outputMeta` seriesMeta maps (default labels/colors) for the layered (non-merged) Input/Output rendering case.
8. DualSeriesChart.prototype.plotFromGrids: Convenience method attached to the prototype — takes two `GridTable` instances directly, auto-builds seriesMeta via `buildInputOutputMeta`, and renders both layers via `renderInputOutput`.
