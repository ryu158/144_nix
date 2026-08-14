# grid.js — Summary

**Class:** `GridTable` — performance-optimized virtualized spreadsheet-style grid.

1. constructor: Initializes dimensions, data array, selection/edit state, computes offsets, builds DOM, binds events, does first render.
2. getData: Returns a copy of the grid's 2D data array, sliced to current column count.
3. setData: Hard-resets grid dimensions/widths/heights to match an incoming 2D array, rebuilds data, recomputes layout, re-renders, emits `change`.
4. on: Registers a callback for a named event (e.g. `change`).
5. destroy: Removes all global event listeners and clears the container to prevent memory leaks.
6. setReadOnly: Toggles read-only mode, updates the `gt-readonly` CSS class, and safely cancels any in-progress edit.
7. _emit: Fires all registered callbacks for an event with a payload.
8. _computeOffsets: Recomputes cumulative column/row pixel offsets and total grid width/height.
9. _indexForOffset: Binary-searches an offsets array to find which row/column a pixel position falls in.
10. _ensureSize: Grows the data array/row heights/col widths if pasted or written data exceeds current bounds.
11. static colLabel: Converts a 0-based column index into an Excel-style column letter (A, B, ... AA).
12. _buildDom: Constructs the grid's DOM skeleton (scroll container, sizer, canvas, headers, cells, hidden input).
13. _updateSizerSize: Updates the scrollable sizer element's width/height to match total content size.
14. _updateCanvasSize: Syncs the sticky canvas element's size to the visible scroll viewport.
15. renderViewport: Core virtualization renderer — computes the visible row/col window and rebuilds only those header/data cell DOM nodes.
16. _requestRender: Debounces render calls via `requestAnimationFrame`.
17. _buildColHeaderCell: Creates a single column header cell element with resize handle and interaction listeners.
18. _buildRowHeaderCell: Creates a single row header cell element with resize handle and interaction listeners.
19. _buildDataCell: Creates a single data cell element, applying selection/active styling and interaction listeners.
20. _normSelection: Normalizes the selection object so r1≤r2 and c1≤c2 regardless of drag direction.
21. _setSelection: Sets the current selection rectangle and active cell.
22. _onCellMouseDown: Handles starting a selection drag or committing an in-progress edit when a cell is clicked.
23. _onCellMouseEnter: Extends the selection rectangle while dragging over cells.
24. _onColHeaderMouseDown: Starts a full-column selection drag from a column header click.
25. _onColHeaderMouseEnter: Extends a column selection while dragging across headers.
26. _onRowHeaderMouseDown: Starts a full-row selection drag from a row header click.
27. _onRowHeaderMouseEnter: Extends a row selection while dragging across headers.
28. _onCornerMouseDown: Selects the entire grid when the corner cell is clicked.
29. _selectAll: Sets selection to cover the whole grid and re-renders.
30. _startEdit: Enters inline-edit mode on a cell (blocked when read-only), optionally seeding it with a typed character.
31. _activateEditableEl: Makes a cell DOM element contenteditable, focuses it, and places the caret at the end.
32. _onEditKeydown: Handles Enter/Tab/Escape behavior while editing a cell (commit, move, or cancel).
33. _commitEdit: Writes the edited cell's DOM text back into the data array and emits `change`.
34. _addGlobalListener: Registers a document/window-level event listener and tracks it for later cleanup.
35. _bindEvents: Wires up scroll, resize, keydown, and clipboard (copy/cut/paste) event handlers.
36. _onHiddenKeydown: Handles keyboard navigation, typing-to-edit, select-all, delete, and arrow/tab movement via the hidden input.
37. _moveActive: Moves (or extends) the active cell/selection by a row/column delta, clamped to grid bounds.
38. _scrollCellIntoView: Scrolls the viewport so a given cell is visible.
39. _onCopy: Copies (or cuts, if not read-only) the selected cell range to the clipboard as TSV text.
40. _onPaste: Parses clipboard TSV/CSV text and writes it into the grid starting at the current selection (blocked when read-only), expanding grid size as needed.
41. _startColResize: Handles drag-to-resize interaction for a column width.
42. _startRowResize: Handles drag-to-resize interaction for a row height.
43. _closeMenu: Removes any open context menu from the DOM.
44. _openMenu: Builds and positions a context menu from a list of items, with outside-click dismissal.
45. _showRowMenu: Opens the right-click row context menu with insert/delete row actions.
46. _showColMenu: Opens the right-click column context menu with insert/delete column actions (insert hidden when column count is fixed).
47. _clampSelection: Clamps the current selection/active cell to stay within valid grid bounds after structural changes.
48. _insertRows: Inserts blank rows at a given index and updates layout/selection.
49. _deleteRows: Deletes rows at a given index (blocked when read-only), updates layout/selection.
50. _insertCols: Inserts blank columns at a given index (blocked when column count is fixed), updates layout.
51. _deleteCols: Deletes columns at a given index (blocked when read-only), updates layout/selection.
