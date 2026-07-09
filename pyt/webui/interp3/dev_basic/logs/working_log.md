# Working Log

---

## 2026-07-09 — Overlay Input (scatter) / Output (line) on interpolate chart

**Task:** Overlay Input (scatter points) and Output (line) on the same chart in the interpolate calculator, with Output drawn behind Input.

**Approach:** Purely additive — no changes to existing code in `chart.js`, `dual-chart.js`'s existing methods, or `mergeGridsForChart`. Used the existing `renderLayers` mechanism in `Chart`, which already supports draw-order layering (first = back, last = front).

**Changes:**

| File | Change | Type |
|---|---|---|
| `dual-chart.js` | Added `_parseDataWithMode()` override on `DualSeriesChart` | New method — lets each layer carry its own `seriesMeta` without colliding on column-index keys |
| `dual-chart.js` | Added `renderInputOutput()` override on `DualSeriesChart` | New method — draws Output (line, back) then Input (scatter, front) |
| `dual-chart.js` | Added `buildInputOutputMeta()` | New standalone helper — generates separate label/color maps for Input and Output series |
| `interpolate/index.html` | Replaced `plotBoth()` body | Now calls `chart.renderInputOutput(...)` instead of `mergeGridsForChart` + `render()` |

**Why not touch existing code:** `Chart.renderInputOutput` already existed but didn't support `seriesMeta`, and `DualSeriesChart` never overrode it. Rather than editing the base class, subclassing/overriding kept the base `Chart` fully reusable for other charts that don't need per-series metadata.

**Result:** Input points render as scatter markers in front; Output renders as a connected line behind them, each with independent labels/colors, on a shared chart.
