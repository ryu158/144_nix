# chart.js — Summary

**Class:** `Chart` — dependency-free scatter+line chart rendered on `<canvas>`. Data contract: column 0 = X, columns 1..N = Y series (from `GridTable.getData()`-shaped arrays).

1. constructor: Sets up sizing, padding, styling, and color options; initializes internal series/hover state; builds DOM and binds events.
2. render: Parses a single data2d table into series and draws the chart.
3. renderLayers: Parses and draws multiple stacked data layers (e.g. input scatter + output line) in one chart, preserving draw order.
4. renderInputOutput: Convenience wrapper rendering an "output" line layer (back) and an "input" scatter layer (front) via `renderLayers`.
5. clear: Clears the current series and wipes the canvas.
6. getData: Returns the currently parsed series array.
7. destroy (first definition): Removes the resize listener and clears the container.
8. _requestDraw: Debounces redraws via `requestAnimationFrame`.
9. static colLabel: Converts a 0-based index into an Excel-style column letter, used for default series labels.
10. _parseData: Converts a data2d table into an array of `{label, color, points}` series, skipping non-numeric X/Y cells and sorting points by X.
11. _parseDataWithMode: Wraps `_parseData`, tagging the resulting series with per-layer draw mode (`showLines`/`showPoints`) and an optional label suffix.
12. _ensureStyles: Injects the chart's scoped CSS (once) into the document head.
13. _buildDom: Builds the chart's DOM structure — canvas, tooltip, legend, and context menu elements.
14. _bindEvents: Wires up window resize, mouse move/leave (tooltip), right-click context menu, and outside-click-to-close handlers.
15. destroy (second definition): Duplicate of #7 — removes the resize listener, the document click listener, and clears the container (note: this later definition overrides the earlier one at runtime).
16. _resizeCanvasForDPR: Recomputes canvas pixel dimensions for the container size, aspect ratio, and device pixel ratio, then scales the drawing context.
17. _computeScales: Computes X/Y data domains (with padding) and returns `sx`/`sy` pixel-mapping functions plus plot area dimensions.
18. static _niceTicks: Computes a "nice" set of evenly-spaced axis tick values for a given min/max/count.
19. _draw: Main render routine — clears canvas, draws legend, grid lines, axis ticks/labels, axis titles, each series' line/points, and any hover crosshair.
20. _formatNum: Formats a numeric axis/tooltip value using exponential notation for very large/small values, otherwise fixed decimals.
21. _renderLegend: Rebuilds the legend DOM from the current series list (or clears it if legend is disabled).
22. _onMouseMove: Finds the nearest data point to the cursor, shows/positions the tooltip, and triggers a redraw for the hover crosshair.
23. _showContextMenu: Builds and shows the right-click context menu with "Pop out Chart" and "Show Legend" toggle options.
24. _openPopoutWindow: Temporarily upscales the chart to 1920px wide, captures a high-resolution PNG snapshot, restores the original size, and opens the image in a new browser window.
