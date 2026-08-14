# style.css — Summary

Not a script file (no functions/classes) — summarized by rule group/selector instead.

1. :root: Defines shared color variables (border, header background/foreground, accent, cell foreground, etc.) used across all components.
2. *, html, body: Global reset — border-box sizing, full-height html/body, base font, background, and padding.
3. #app / .app-header / .app-toolbar: Top-level page layout — vertical flex column with header and toolbar rows.
4. .primary-btn: Styling for the main accent-colored action button, including hover state.
5. .controls-row / .field: Layout and styling for labeled input/select control groups (e.g. output range fields).
6. .app-main / .panel / .panel-grid / .panel-chart / .panel-ad: Main content area layout — flex row splitting space between the grid, chart, and ad side panels.
7. .app-footer-ad / .ad-slot-banner / .ad-slot: Footer ad container layout and reserved-space placeholder styling for ad units (dashed border pending approval).
8. .panel-body: Ensures panel content areas can shrink properly within flex layout.
9. .gt-root / .gt-scroll / .gt-sizer / .gt-canvas: Core GridTable container, scroll viewport, content sizer, and sticky canvas layer styling.
10. .gt-corner / .gt-colheader / .gt-rowheader / .gt-cells / .gt-header-cell: Grid header/corner cell layout, z-indexing, and base header cell appearance.
11. .gt-col-resizer / .gt-row-resizer: Invisible drag handles for column/row resizing, with hover highlight.
12. .gt-cell / .gt-cell.selected / .gt-cell.active / .gt-cell.editing: Base data cell appearance and visual states for selection, active cell, and inline editing.
13. .gt-root.gt-readonly .gt-cell / .gt-cell.selected: Read-only mode overrides — "not-allowed" cursor and muted selection color.
14. .gt-hidden-input: Off-screen hidden textarea used to capture keyboard input for the grid.
15. .gt-context-menu and children: Styling for the grid's right-click context menu (row/col insert/delete), including danger (delete) items and separators.
16. .ct-root / .ct-canvas: Chart container and canvas base layout.
17. .ct-tooltip: Hover tooltip appearance (dark background, positioned above the cursor).
18. .ct-legend / .ct-legend-item / .ct-legend-swatch: Chart legend layout and per-series color swatch styling.
19. .ct-context-menu and children (.ct-menu-item, .ct-menu-checkbox, .ct-menu-separator): Styling for the chart's right-click context menu ("Pop out Chart", "Show Legend" toggle).
