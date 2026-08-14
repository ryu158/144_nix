/**
 * GridTable
 * A performance-optimized virtualized grid.
 */
class GridTable {
  constructor(container, options = {}) {
    this.container = container;
    this.numRows = options.rows ?? 200;
    this.numCols = options.cols ?? 50;
    this.fixedColCount = options.fixedColCount ?? false; // false by default
    this.defaultColWidth = options.colWidth ?? 90;
    this.defaultRowHeight = options.rowHeight ?? 28;
    this.rowHeaderWidth = options.rowHeaderWidth ?? 50;
    this.colHeaderHeight = options.colHeaderHeight ?? 28;
    this.viewportHeight = options.viewportHeight ?? 480;
    this.viewportWidth = options.viewportWidth ?? null;
    this._toCssSize = v => (v === null || v === undefined) ? null : (typeof v === 'number' ? v + 'px' : v);
    this.buffer = 3;

    this.colWidths = new Array(this.numCols).fill(this.defaultColWidth);
    this.rowHeights = new Array(this.numRows).fill(this.defaultRowHeight);
    this.data = Array.from({ length: this.numRows }, () => new Array(this.numCols).fill(''));

    this.selection = { r1: 0, c1: 0, r2: 0, c2: 0 };
    this.activeCell = { r: 0, c: 0 };
    this.editingCell = null;
    this._dragging = false;
    this._resizing = null;
    this._listeners = {};
    this._renderPending = false;
    this._globalListeners = [];
	  this.readOnly = options.readOnly ?? false; // Default to editable

    this._computeOffsets();
    this._buildDom();
    this._bindEvents();
    this.renderViewport();
  }

  /* ---------------- Public API ---------------- */

  getData() {
    return this.data.map(row => row.slice(0, this.numCols));
  }

  setData(arr2d) {
    const rows = arr2d.length;
    const cols = rows ? Math.max(...arr2d.map(r => r.length)) : 0;
    
    // Hard reset dimensions to match incoming dataset completely
    this.numRows = rows;
    this.numCols = cols;
    this.colWidths = new Array(this.numCols).fill(this.defaultColWidth);
    this.rowHeights = new Array(this.numRows).fill(this.defaultRowHeight);
    
    this.data = Array.from({ length: this.numRows }, (_, r) => 
      Array.from({ length: this.numCols }, (_, c) => arr2d[r]?.[c] ?? '')
    );

    this._computeOffsets();
    this._updateSizerSize();
    this.renderViewport();
    this._emit('change');
  }

  on(event, cb) {
    (this._listeners[event] ||= []).push(cb);
  }

  destroy() {
    // Unbind all global event listeners to prevent severe memory leaks
    this._globalListeners.forEach(({ target, type, handler }) => {
      target.removeEventListener(type, handler);
    });
    this._globalListeners = [];
    this.container.innerHTML = '';
  }

	setReadOnly(readOnly) {
		this.readOnly = !!readOnly;

		// Toggle the CSS class on the root element for visual changes
		if (this.root) {
			this.root.classList.toggle('gt-readonly', this.readOnly);
		}

		// If runtime write-protection is forced *while* editing, cancel gracefully
		if (this.readOnly && this.editingCell) {
			const { r, c, original } = this.editingCell;
			this.data[r][c] = original;
			this.editingCell = null;
			this._requestRender();
			this.hiddenInput.focus({ preventScroll: true });
		}
	}
  /* ---------------- Core Engine ---------------- */

  _emit(event, payload) {
    (this._listeners[event] || []).forEach(cb => cb(payload));
  }

  _computeOffsets() {
    this.colOffsets = [0];
    for (let c = 0; c < this.numCols; c++) {
      this.colOffsets.push(this.colOffsets[c] + this.colWidths[c]);
    }
    this.rowOffsets = [0];
    for (let r = 0; r < this.numRows; r++) {
      this.rowOffsets.push(this.rowOffsets[r] + this.rowHeights[r]);
    }
    this.totalWidth = this.colOffsets[this.numCols];
    this.totalHeight = this.rowOffsets[this.numRows];
  }

  _indexForOffset(offsets, pos) {
    let lo = 0, hi = offsets.length - 2;
    if (pos <= 0) return 0;
    if (pos >= offsets[offsets.length - 1]) return offsets.length - 2;
    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      if (offsets[mid] <= pos && pos < offsets[mid + 1]) return mid;
      if (offsets[mid] > pos) hi = mid - 1; else lo = mid + 1;
    }
    return Math.max(0, lo - 1);
  }

  _ensureSize(rows, cols) {
    let changed = false;
    if (rows > this.numRows) {
      for (let r = this.numRows; r < rows; r++) {
        this.data.push(new Array(this.numCols).fill(''));
        this.rowHeights.push(this.defaultRowHeight);
      }
      this.numRows = rows;
      changed = true;
    }
    if (cols > this.numCols) {
      for (let r = 0; r < this.numRows; r++) {
        while (this.data[r].length < cols) this.data[r].push('');
      }
      for (let c = this.numCols; c < cols; c++) this.colWidths.push(this.defaultColWidth);
      this.numCols = cols;
      changed = true;
    }
    if (changed) {
      this._computeOffsets();
      this._updateSizerSize();
    }
  }

  static colLabel(n) {
    let s = '', v = n + 1;
    while (v > 0) {
      const rem = (v - 1) % 26;
      s = String.fromCharCode(65 + rem) + s;
      v = Math.floor((v - 1) / 26);
    }
    return s;
  }

  _buildDom() {
    this.container.innerHTML = '';
    this.root = document.createElement('div');
    this.root.className = 'gt-root';
    this.root.tabIndex = -1;
    if (this.viewportWidth) this.root.style.width = this._toCssSize(this.viewportWidth);
    this.root.style.height = this._toCssSize(this.viewportHeight);

    this.scrollEl = document.createElement('div');
    this.scrollEl.className = 'gt-scroll';
    this.scrollEl.style.height = this._toCssSize(this.viewportHeight);
    this.scrollEl.style.width = this._toCssSize(this.viewportWidth) ?? '100%';

    this.sizer = document.createElement('div');
    this.sizer.className = 'gt-sizer';

    this.canvas = document.createElement('div');
    this.canvas.className = 'gt-canvas';

    this.cornerEl = document.createElement('div');
    this.cornerEl.className = 'gt-corner';
    this.cornerEl.style.width = this.rowHeaderWidth + 'px';
    this.cornerEl.style.height = this.colHeaderHeight + 'px';
    this.cornerEl.style.cursor = 'pointer';
    this.cornerEl.addEventListener('mousedown', e => this._onCornerMouseDown(e));

    this.colHeaderEl = document.createElement('div');
    this.colHeaderEl.className = 'gt-colheader';
    this.rowHeaderEl = document.createElement('div');
    this.rowHeaderEl.className = 'gt-rowheader';
    this.cellsEl = document.createElement('div');
    this.cellsEl.className = 'gt-cells';

    this.canvas.append(this.rowHeaderEl, this.colHeaderEl, this.cellsEl, this.cornerEl);
    this.sizer.appendChild(this.canvas);
    this.scrollEl.appendChild(this.sizer);
    this.root.appendChild(this.scrollEl);
    this.container.appendChild(this.root);

    this.hiddenInput = document.createElement('textarea');
    this.hiddenInput.className = 'gt-hidden-input';
    this.root.appendChild(this.hiddenInput);

    this._updateSizerSize();
  }

  _updateSizerSize() {
    this.sizer.style.width = (this.totalWidth + this.rowHeaderWidth) + 'px';
    this.sizer.style.height = (this.totalHeight + this.colHeaderHeight) + 'px';
    this._updateCanvasSize();
  }

  _updateCanvasSize() {
    this.canvas.style.width = this.scrollEl.clientWidth + 'px';
    this.canvas.style.height = this.scrollEl.clientHeight + 'px';
  }

  /* ---------------- Rendering Engine ---------------- */

  renderViewport() {
    const sl = this.scrollEl.scrollLeft;
    const st = this.scrollEl.scrollTop;
    const viewW = this.scrollEl.clientWidth - this.rowHeaderWidth;
    const viewH = this.scrollEl.clientHeight - this.colHeaderHeight;

    let c0 = this._indexForOffset(this.colOffsets, sl) - this.buffer;
    let c1 = this._indexForOffset(this.colOffsets, sl + viewW) + this.buffer + 1;
    let r0 = this._indexForOffset(this.rowOffsets, st) - this.buffer;
    let r1 = this._indexForOffset(this.rowOffsets, st + viewH) + this.buffer + 1;
    
    c0 = Math.max(0, c0); c1 = Math.min(this.numCols, c1);
    r0 = Math.max(0, r0); r1 = Math.min(this.numRows, r1);

    // Fast DOM Clears
    this.colHeaderEl.textContent = '';
    this.rowHeaderEl.textContent = '';
    this.cellsEl.textContent = '';

    const fragmentCols = document.createDocumentFragment();
    for (let c = c0; c < c1; c++) {
      fragmentCols.appendChild(this._buildColHeaderCell(c, sl));
    }
    this.colHeaderEl.appendChild(fragmentCols);

    const fragmentRows = document.createDocumentFragment();
    for (let r = r0; r < r1; r++) {
      fragmentRows.appendChild(this._buildRowHeaderCell(r, st));
    }
    this.rowHeaderEl.appendChild(fragmentRows);

    const fragmentCells = document.createDocumentFragment();
    const sel = this._normSelection();
    for (let r = r0; r < r1; r++) {
      for (let c = c0; c < c1; c++) {
        fragmentCells.appendChild(this._buildDataCell(r, c, sl, st, sel));
      }
    }
    this.cellsEl.appendChild(fragmentCells);

    if (this.editingCell) {
      const el = this.cellsEl.querySelector(
        `.gt-cell[data-row="${this.editingCell.r}"][data-col="${this.editingCell.c}"]`
      );
      if (el) this._activateEditableEl(el);
    }
  }

  _requestRender() {
    if (this._renderPending) return;
    this._renderPending = true;
    requestAnimationFrame(() => {
      this._renderPending = false;
      this.renderViewport();
    });
  }

  _buildColHeaderCell(c, sl) {
    const el = document.createElement('div');
    el.className = 'gt-header-cell';
    el.dataset.col = c;
    el.style.left = (this.rowHeaderWidth + this.colOffsets[c] - sl) + 'px';
    el.style.top = '0px';
    el.style.width = this.colWidths[c] + 'px';
    el.style.height = this.colHeaderHeight + 'px';
    el.textContent = GridTable.colLabel(c);

    const sel = this._normSelection();
    if (sel.r1 === 0 && sel.r2 === this.numRows - 1 && c >= sel.c1 && c <= sel.c2) {
      el.classList.add('selected');
    }

    const handle = document.createElement('div');
    handle.className = 'gt-col-resizer';
    handle.addEventListener('mousedown', e => this._startColResize(e, c));
    el.appendChild(handle);

    el.addEventListener('mousedown', e => this._onColHeaderMouseDown(e, c));
    el.addEventListener('mouseenter', () => this._onColHeaderMouseEnter(c));
    el.addEventListener('contextmenu', e => this._showColMenu(e, c));
    return el;
  }

  _buildRowHeaderCell(r, st) {
    const el = document.createElement('div');
    el.className = 'gt-header-cell rownum';
    el.dataset.row = r;
    el.style.left = '0px';
    el.style.top = (this.colHeaderHeight + this.rowOffsets[r] - st) + 'px';
    el.style.width = this.rowHeaderWidth + 'px';
    el.style.height = this.rowHeights[r] + 'px';
    el.textContent = r + 1;

    const sel = this._normSelection();
    if (sel.c1 === 0 && sel.c2 === this.numCols - 1 && r >= sel.r1 && r <= sel.r2) {
      el.classList.add('selected');
    }

    const handle = document.createElement('div');
    handle.className = 'gt-row-resizer';
    handle.addEventListener('mousedown', e => this._startRowResize(e, r));
    el.appendChild(handle);

    el.addEventListener('mousedown', e => this._onRowHeaderMouseDown(e, r));
    el.addEventListener('mouseenter', () => this._onRowHeaderMouseEnter(r));
    el.addEventListener('contextmenu', e => this._showRowMenu(e, r));
    return el;
  }

  _buildDataCell(r, c, sl, st, sel) {
    const el = document.createElement('div');
    el.className = 'gt-cell';
    el.dataset.row = r;
    el.dataset.col = c;
    el.style.left = (this.rowHeaderWidth + this.colOffsets[c] - sl) + 'px';
    el.style.top = (this.colHeaderHeight + this.rowOffsets[r] - st) + 'px';
    el.style.width = this.colWidths[c] + 'px';
    el.style.height = this.rowHeights[r] + 'px';
    el.textContent = this.data[r][c] ?? '';

    const inSel = r >= sel.r1 && r <= sel.r2 && c >= sel.c1 && c <= sel.c2;
    if (inSel) el.classList.add('selected');
    if (this.activeCell.r === r && this.activeCell.c === c) el.classList.add('active');

    el.addEventListener('mousedown', e => this._onCellMouseDown(e, r, c));
    el.addEventListener('mouseenter', () => this._onCellMouseEnter(r, c));
    el.addEventListener('dblclick', () => this._startEdit(r, c));
    return el;
  }

  /* ---------------- Interaction Handling ---------------- */

  _normSelection() {
    const { r1, c1, r2, c2 } = this.selection;
    return { r1: Math.min(r1, r2), r2: Math.max(r1, r2), c1: Math.min(c1, c2), c2: Math.max(c1, c2) };
  }

  _setSelection(r1, c1, r2, c2) {
    this.selection = { r1, c1, r2, c2 };
    this.activeCell = { r: r1, c: c1 };
  }

  _onCellMouseDown(e, r, c) {
    if (this.editingCell) {
      if (this.editingCell.r === r && this.editingCell.c === c) {
        return; // Allow intentional inner text selection during editing
      }
      this._commitEdit();
    }
    e.preventDefault();
    this._dragging = true;
    if (e.shiftKey) {
      this.selection.r2 = r; this.selection.c2 = c;
    } else {
      this._setSelection(r, c, r, c);
    }
    this.hiddenInput.focus({ preventScroll: true });
    this._requestRender();
  }

  _onCellMouseEnter(r, c) {
    if (!this._dragging) return;
    this.selection.r2 = r;
    this.selection.c2 = c;
    this._requestRender();
  }

  _onColHeaderMouseDown(e, c) {
    if (this.editingCell) this._commitEdit();
    e.preventDefault();
    this._headerDragging = 'col';
    if (e.shiftKey && this._headerAnchor && this._headerAnchor.type === 'col') {
      const a = this._headerAnchor.index;
      this._setSelection(0, Math.min(a, c), this.numRows - 1, Math.max(a, c));
    } else {
      this._headerAnchor = { type: 'col', index: c };
      this._setSelection(0, c, this.numRows - 1, c);
    }
    this.hiddenInput.focus({ preventScroll: true });
    this._requestRender();
  }

  _onColHeaderMouseEnter(c) {
    if (this._headerDragging !== 'col') return;
    this.selection.c2 = c;
    this._requestRender();
  }

  _onRowHeaderMouseDown(e, r) {
    if (this.editingCell) this._commitEdit();
    e.preventDefault();
    this._headerDragging = 'row';
    if (e.shiftKey && this._headerAnchor && this._headerAnchor.type === 'row') {
      const a = this._headerAnchor.index;
      this._setSelection(Math.min(a, r), 0, Math.max(a, r), this.numCols - 1);
    } else {
      this._headerAnchor = { type: 'row', index: r };
      this._setSelection(r, 0, r, this.numCols - 1);
    }
    this.hiddenInput.focus({ preventScroll: true });
    this._requestRender();
  }

  _onRowHeaderMouseEnter(r) {
    if (this._headerDragging !== 'row') return;
    this.selection.r2 = r;
    this._requestRender();
  }

  _onCornerMouseDown(e) {
    e.preventDefault();
    if (this.editingCell) this._commitEdit();
    this._selectAll();
    this.hiddenInput.focus({ preventScroll: true });
  }

  _selectAll() {
    this._setSelection(0, 0, this.numRows - 1, this.numCols - 1);
    this._requestRender();
  }

  /* ---------------- Inline Editor ---------------- */

  _startEdit(r, c, initialChar = null) {
	  if (this.readOnly) return; // 👇 Block editing early
    this._setSelection(r, c, r, c);
    this.editingCell = { r, c, original: this.data[r][c] ?? '' };
    if (initialChar !== null) this.data[r][c] = initialChar;
    this._requestRender();
  }

  _activateEditableEl(el) {
    el.classList.add('editing');
    el.contentEditable = 'true';
    el.spellcheck = false;
    
    const keydownHandler = e => this._onEditKeydown(e);
    const blurHandler = () => this._commitEdit();
    
    el.addEventListener('keydown', keydownHandler);
    el.addEventListener('blur', blurHandler, { once: true });
    el.focus();
    
    // Select trailing offset range
    const range = document.createRange();
    range.selectNodeContents(el);
    range.collapse(false);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
  }

  _onEditKeydown(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      this._commitEdit();
      this._moveActive(1, 0);
    } else if (e.key === 'Tab') {
      e.preventDefault();
      this._commitEdit();
      this._moveActive(0, e.shiftKey ? -1 : 1);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      const { r, c, original } = this.editingCell;
      this.data[r][c] = original;
      this.editingCell = null;
      this._requestRender();
      this.hiddenInput.focus({ preventScroll: true });
    }
  }

  _commitEdit() {
    if (!this.editingCell) return;
    const { r, c } = this.editingCell;
    const el = this.cellsEl.querySelector(`.gt-cell[data-row="${r}"][data-col="${c}"]`);
    if (el) this.data[r][c] = el.textContent;
    this.editingCell = null;
    this._emit('change');
    this._requestRender();
    this.hiddenInput.focus({ preventScroll: true });
  }

  /* ---------------- Global Event Registration ---------------- */

  _addGlobalListener(target, type, handler) {
    target.addEventListener(type, handler);
    this._globalListeners.push({ target, type, handler });
  }

  _bindEvents() {
    this.scrollEl.addEventListener('scroll', () => this._requestRender());
    
    this._addGlobalListener(document, 'mouseup', () => {
      this._dragging = false;
      this._headerDragging = null;
      this._resizing = null;
    });

    this._addGlobalListener(window, 'resize', () => {
      this._updateCanvasSize();
      this._requestRender();
    });

    this._addGlobalListener(document, 'keydown', e => {
      if (e.key === 'Escape') this._closeMenu();
    });

    this.hiddenInput.addEventListener('keydown', e => this._onHiddenKeydown(e));
    this.hiddenInput.addEventListener('copy', e => this._onCopy(e));
    this.hiddenInput.addEventListener('cut', e => this._onCopy(e, true));
    this.hiddenInput.addEventListener('paste', e => this._onPaste(e));
  }

  /* ---------------- Navigation / Clipboard ---------------- */

  _onHiddenKeydown(e) {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'a') {
      e.preventDefault();
      this._selectAll();
      return;
    }
    const printable = e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey;
    if (printable) {
      e.preventDefault();
      this._startEdit(this.activeCell.r, this.activeCell.c, e.key);
      return;
    }
    switch (e.key) {
      case 'Enter':
      case 'F2':
        e.preventDefault();
        this._startEdit(this.activeCell.r, this.activeCell.c);
        break;
      case 'Delete':
      case 'Backspace': {
        e.preventDefault();
	if (this.readOnly) return; // 👇 Block single/multi-cell deletion
        const sel = this._normSelection();
        for (let r = sel.r1; r <= sel.r2; r++) {
          for (let c = sel.c1; c <= sel.c2; c++) this.data[r][c] = '';
        }
        this._emit('change');
        this._requestRender();
        break;
      }
      case 'ArrowUp': e.preventDefault(); this._moveActive(-1, 0, e.shiftKey); break;
      case 'ArrowDown': e.preventDefault(); this._moveActive(1, 0, e.shiftKey); break;
      case 'ArrowLeft': e.preventDefault(); this._moveActive(0, -1, e.shiftKey); break;
      case 'ArrowRight': e.preventDefault(); this._moveActive(0, 1, e.shiftKey); break;
      case 'Tab': e.preventDefault(); this._moveActive(0, e.shiftKey ? -1 : 1); break;
    }
  }

  _moveActive(dr, dc, extend = false) {
    if (extend) {
      let r2 = Math.min(this.numRows - 1, Math.max(0, this.selection.r2 + dr));
      let c2 = Math.min(this.numCols - 1, Math.max(0, this.selection.c2 + dc));
      this.selection.r2 = r2; this.selection.c2 = c2;
    } else {
      let r = Math.min(this.numRows - 1, Math.max(0, this.activeCell.r + dr));
      let c = Math.min(this.numCols - 1, Math.max(0, this.activeCell.c + dc));
      this._setSelection(r, c, r, c);
    }
    this._scrollCellIntoView(this.selection.r2, this.selection.c2);
    this._requestRender();
  }

  _scrollCellIntoView(r, c) {
    const left = this.colOffsets[c], right = this.colOffsets[c + 1];
    const top = this.rowOffsets[r], bottom = this.rowOffsets[r + 1];
    const viewW = this.scrollEl.clientWidth - this.rowHeaderWidth;
    const viewH = this.scrollEl.clientHeight - this.colHeaderHeight;
    const sl = this.scrollEl.scrollLeft, st = this.scrollEl.scrollTop;
    if (left < sl) this.scrollEl.scrollLeft = left;
    else if (right > sl + viewW) this.scrollEl.scrollLeft = right - viewW;
    if (top < st) this.scrollEl.scrollTop = top;
    else if (bottom > st + viewH) this.scrollEl.scrollTop = bottom - viewH;
  }

  _onCopy(e, isCut = false) {
    e.preventDefault();
    const sel = this._normSelection();
    const rows = [];
    for (let r = sel.r1; r <= sel.r2; r++) {
      const rowVals = [];
      for (let c = sel.c1; c <= sel.c2; c++) rowVals.push(this.data[r][c] ?? '');
      rows.push(rowVals.join('\t'));
    }
    e.clipboardData.setData('text/plain', rows.join('\n'));
    if (isCut) {
      if (this.readOnly) return; // 👇 Block cutting (copying will still function)

      for (let r = sel.r1; r <= sel.r2; r++) {
        for (let c = sel.c1; c <= sel.c2; c++) this.data[r][c] = '';
      }
      this._emit('change');
      this._requestRender();
    }
  }

	_onPaste(e) {
		e.preventDefault();
		if (this.readOnly) return; // 👇 Block clipboard pasting
		const text = e.clipboardData.getData('text/plain');
		if (!text) return;
		const rawRows = text.replace(/\r/g, '').split('\n').filter((row, idx, arr) =>
			!(idx === arr.length - 1 && row === '')
		);
		const delim = rawRows[0] && rawRows[0].includes('\t') ? '\t' : ',';
		const grid = rawRows.map(row => row.split(delim));

		const sel = this._normSelection();
		const startR = sel.r1, startC = sel.c1;
		const neededRows = startR + grid.length;

		const incomingMaxCols = Math.max(...grid.map(row => row.length));
		let neededCols = startC + incomingMaxCols;

		// 👇 Check if the incoming data overflows the locked column count
		if (this.fixedColCount && neededCols > this.numCols) {
			alert(`Warning: Pasted data contains ${incomingMaxCols} columns, but the grid is locked. Some columns will be truncated.`);
			neededCols = this.numCols;
		}

		this._ensureSize(neededRows, neededCols);

		grid.forEach((rowArr, ri) => {
			rowArr.forEach((val, ci) => {
				// Prevent writing data out-of-bounds if it was truncated
				if (startC + ci < this.numCols) {
					this.data[startR + ri][startC + ci] = val;
				}
			});
		});

		// Clamp selection visual box to match actual written grid dimensions
		const finalC2 = Math.min(this.numCols - 1, startC + incomingMaxCols - 1);
		this._setSelection(startR, startC, startR + grid.length - 1, finalC2);

		this._emit('change');
		this._requestRender();
	}

  /* ---------------- Column/Row Resize ---------------- */

  _startColResize(e, c) {
    e.preventDefault();
    e.stopPropagation();
    const startX = e.clientX;
    const startWidth = this.colWidths[c];
    this._resizing = { type: 'col', index: c };
    const onMove = ev => {
      const w = Math.max(24, startWidth + (ev.clientX - startX));
      this.colWidths[c] = w;
      this._computeOffsets();
      this._updateSizerSize();
      this._requestRender();
    };
    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }

  _startRowResize(e, r) {
    e.preventDefault();
    e.stopPropagation();
    const startY = e.clientY;
    const startHeight = this.rowHeights[r];
    this._resizing = { type: 'row', index: r };
    const onMove = ev => {
      const h = Math.max(18, startHeight + (ev.clientY - startY));
      this.rowHeights[r] = h;
      this._computeOffsets();
      this._updateSizerSize();
      this._requestRender();
    };
    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }

  /* ---------------- Context Menus ---------------- */

  _closeMenu() {
    if (this._menuEl) { this._menuEl.remove(); this._menuEl = null; }
  }

  _openMenu(x, y, items) {
    this._closeMenu();
    const menu = document.createElement('div');
    menu.className = 'gt-context-menu';
    const ul = document.createElement('ul');
    items.forEach(item => {
      const li = document.createElement('li');
      if (item.sep) { li.className = 'sep'; ul.appendChild(li); return; }
      li.textContent = item.label;
      if (item.danger) li.classList.add('danger');
      li.addEventListener('click', () => { item.action(); this._closeMenu(); });
      ul.appendChild(li);
    });
    menu.appendChild(ul);
    document.body.appendChild(menu);
    const rect = menu.getBoundingClientRect();
    menu.style.left = Math.min(x, window.innerWidth - rect.width - 8) + 'px';
    menu.style.top = Math.min(y, window.innerHeight - rect.height - 8) + 'px';
    this._menuEl = menu;

    const onOutside = ev => {
      if (!menu.contains(ev.target)) { this._closeMenu(); document.removeEventListener('mousedown', onOutside); }
    };
    setTimeout(() => document.addEventListener('mousedown', onOutside), 0);
  }

  _showRowMenu(e, r) {
    e.preventDefault();
    const sel = this._normSelection();
    const isFullRowSel = sel.c1 === 0 && sel.c2 === this.numCols - 1 && r >= sel.r1 && r <= sel.r2 && sel.r2 > sel.r1;
    let r1 = r, r2 = r;
    if (isFullRowSel) {
      r1 = sel.r1; r2 = sel.r2;
    } else {
      this._setSelection(r, 0, r, this.numCols - 1);
      this._requestRender();
    }
    const count = r2 - r1 + 1;
    const noun = count > 1 ? `${count} rows` : 'row';
    this._openMenu(e.clientX, e.clientY, [
      { label: `Insert ${noun} above`, action: () => this._insertRows(r1, count) },
      { label: `Insert ${noun} below`, action: () => this._insertRows(r2 + 1, count) },
      { sep: true },
      { label: `Delete ${noun}`, danger: true, action: () => this._deleteRows(r1, count) },
    ]);
  }

  _showColMenu(e, c) {
    e.preventDefault();
    const sel = this._normSelection();
    const isFullColSel = sel.r1 === 0 && sel.r2 === this.numRows - 1 && c >= sel.c1 && c <= sel.c2 && sel.c2 > sel.c1;
    let c1 = c, c2 = c;
    if (isFullColSel) {
      c1 = sel.c1; c2 = sel.c2;
    } else {
      this._setSelection(0, c, this.numRows - 1, c);
      this._requestRender();
    }
    const count = c2 - c1 + 1;
    const noun = count > 1 ? `${count} columns` : 'column';
    const menuItems = [];
if (!this.fixedColCount) {
    menuItems.push(
      { label: `Insert ${noun} left`, action: () => this._insertCols(c1, count) },
      { label: `Insert ${noun} right`, action: () => this._insertCols(c2 + 1, count) },
      { sep: true }
    );
  }

  menuItems.push({ label: `Delete ${noun}`, danger: true, action: () => this._deleteCols(c1, count) });

  this._openMenu(e.clientX, e.clientY, menuItems);

  }

  _clampSelection() {
    const clampR = v => Math.min(this.numRows - 1, Math.max(0, v));
    const clampC = v => Math.min(this.numCols - 1, Math.max(0, v));
    this.selection = {
      r1: clampR(this.selection.r1), c1: clampC(this.selection.c1),
      r2: clampR(this.selection.r2), c2: clampC(this.selection.c2),
    };
    this.activeCell = { r: clampR(this.activeCell.r), c: clampC(this.activeCell.c) };
  }

  _insertRows(at, count = 1) {
    const blankRows = Array.from({ length: count }, () => new Array(this.numCols).fill(''));
    this.data.splice(at, 0, ...blankRows);
    this.rowHeights.splice(at, 0, ...new Array(count).fill(this.defaultRowHeight));
    this.numRows += count;
    this._computeOffsets();
    this._updateSizerSize();
    this._requestRender();
    this._emit('change');
  }

  _deleteRows(at, count = 1) {
    if (this.readOnly) return; // 👇 Block row structural deletes
    count = Math.min(count, this.numRows - 1);
    if (count <= 0) return;
    this.data.splice(at, count);
    this.rowHeights.splice(at, count);
    this.numRows -= count;
    this._computeOffsets();
    this._updateSizerSize();
    this._clampSelection();
    this._requestRender();
    this._emit('change');
  }

	_insertCols(at, count = 1) {
		if (this.fixedColCount) {
			alert("Warning: Column insertion is disabled because the grid column count is locked.");
			return;
		}

		const blanks = new Array(count).fill('');
		this.data.forEach(row => row.splice(at, 0, ...blanks));
		this.colWidths.splice(at, 0, ...new Array(count).fill(this.defaultColWidth));
		this.numCols += count;
		this._computeOffsets();
		this._updateSizerSize();
		this._requestRender();
		this._emit('change');
	}

  _deleteCols(at, count = 1) {
    if (this.readOnly) return; // 👇 Block row structural deletes
    count = Math.min(count, this.numCols - 1);
    if (count <= 0) return;
    this.data.forEach(row => row.splice(at, count));
    this.colWidths.splice(at, count);
    this.numCols -= count;
    this._computeOffsets();
    this._updateSizerSize();
    this._clampSelection();
    this._requestRender();
    this._emit('change');
  }
}
