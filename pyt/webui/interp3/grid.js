/**
 * GridTable
 * A virtualized, Excel-like grid.
 *
 * Features:
 *  1. Range select + copy/paste (tab-separated, works with Excel/CSV)
 *  2. Resizable column widths / row heights (drag handles on headers)
 *  3. Virtualized rendering — only visible cells exist in the DOM
 *  4. Right-click context menu on headers to insert/delete rows & columns
 *
 * Public API:
 *   new GridTable(container, options)
 *   .getData() -> string[][]
 *   .setData(array2d) -> void
 *   .on(event, cb)     event: 'change'
 */
class GridTable {
  constructor(container, options = {}) {
    this.container = container;
    this.numRows = options.rows ?? 200;
    this.numCols = options.cols ?? 50;
    this.defaultColWidth = options.colWidth ?? 90;
    this.defaultRowHeight = options.rowHeight ?? 28;
    this.rowHeaderWidth = options.rowHeaderWidth ?? 50;
    this.colHeaderHeight = options.colHeaderHeight ?? 28;
    this.viewportHeight = options.viewportHeight ?? 480;
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
    this._ensureSize(rows, cols);
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < arr2d[r].length; c++) {
        this.data[r][c] = arr2d[r][c] ?? '';
      }
    }
    this.renderViewport();
    this._emit('change');
  }

  on(event, cb) {
    (this._listeners[event] ||= []).push(cb);
  }

  _emit(event, payload) {
    (this._listeners[event] || []).forEach(cb => cb(payload));
  }

  /* ---------------- Offsets / sizing ---------------- */

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
    if (rows > this.numRows) {
      for (let r = this.numRows; r < rows; r++) {
        this.data.push(new Array(this.numCols).fill(''));
        this.rowHeights.push(this.defaultRowHeight);
      }
      this.numRows = rows;
    }
    if (cols > this.numCols) {
      for (let r = 0; r < this.numRows; r++) {
        while (this.data[r].length < cols) this.data[r].push('');
      }
      for (let c = this.numCols; c < cols; c++) this.colWidths.push(this.defaultColWidth);
      this.numCols = cols;
    }
    this._computeOffsets();
    this._updateSizerSize();
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

  /* ---------------- DOM construction ---------------- */

  _buildDom() {
    this.container.innerHTML = '';
    this.root = document.createElement('div');
    this.root.className = 'gt-root';
    this.root.tabIndex = -1;

    this.scrollEl = document.createElement('div');
    this.scrollEl.className = 'gt-scroll';
    this.scrollEl.style.height = this.viewportHeight + 'px';

    this.sizer = document.createElement('div');
    this.sizer.className = 'gt-sizer';

    this.canvas = document.createElement('div');
    this.canvas.className = 'gt-canvas';

    this.cornerEl = document.createElement('div');
    this.cornerEl.className = 'gt-corner';
    this.cornerEl.style.width = this.rowHeaderWidth + 'px';
    this.cornerEl.style.height = this.colHeaderHeight + 'px';

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
  }

  /* ---------------- Rendering ---------------- */

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

    this.colHeaderEl.innerHTML = '';
    for (let c = c0; c < c1; c++) {
      this.colHeaderEl.appendChild(this._buildColHeaderCell(c, sl));
    }

    this.rowHeaderEl.innerHTML = '';
    for (let r = r0; r < r1; r++) {
      this.rowHeaderEl.appendChild(this._buildRowHeaderCell(r, st));
    }

    this.cellsEl.innerHTML = '';
    const sel = this._normSelection();
    for (let r = r0; r < r1; r++) {
      for (let c = c0; c < c1; c++) {
        this.cellsEl.appendChild(this._buildDataCell(r, c, sl, st, sel));
      }
    }

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

    const handle = document.createElement('div');
    handle.className = 'gt-col-resizer';
    handle.addEventListener('mousedown', e => this._startColResize(e, c));
    el.appendChild(handle);

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

    const handle = document.createElement('div');
    handle.className = 'gt-row-resizer';
    handle.addEventListener('mousedown', e => this._startRowResize(e, r));
    el.appendChild(handle);

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

  /* ---------------- Selection helpers ---------------- */

  _normSelection() {
    const { r1, c1, r2, c2 } = this.selection;
    return { r1: Math.min(r1, r2), r2: Math.max(r1, r2), c1: Math.min(c1, c2), c2: Math.max(c1, c2) };
  }

  _setSelection(r1, c1, r2, c2) {
    this.selection = { r1, c1, r2, c2 };
    this.activeCell = { r: r1, c: c1 };
  }

  /* ---------------- Mouse interaction ---------------- */

  _onCellMouseDown(e, r, c) {
    if (this.editingCell && (this.editingCell.r !== r || this.editingCell.c !== c)) {
      this._commitEdit();
    }
    if (this.editingCell && this.editingCell.r === r && this.editingCell.c === c) {
      return; // let native text-cursor placement happen
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

  _bindGlobalMouseUp() {
    document.addEventListener('mouseup', () => {
      this._dragging = false;
      this._resizing = null;
    });
  }

  /* ---------------- Editing ---------------- */

  _startEdit(r, c, initialChar = null) {
    this._setSelection(r, c, r, c);
    this.editingCell = { r, c, original: this.data[r][c] ?? '' };
    if (initialChar !== null) this.data[r][c] = initialChar;
    this._requestRender();
  }

  _activateEditableEl(el) {
    el.classList.add('editing');
    el.contentEditable = 'true';
    el.spellcheck = false;
    el.addEventListener('keydown', e => this._onEditKeydown(e));
    el.addEventListener('blur', () => this._commitEdit());
    el.focus();
    // place cursor at end
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
  }

  /* ---------------- Keyboard (navigation / copy / paste / delete) ---------------- */

  _bindHiddenInput() {
    this.hiddenInput.addEventListener('keydown', e => this._onHiddenKeydown(e));
    this.hiddenInput.addEventListener('copy', e => this._onCopy(e));
    this.hiddenInput.addEventListener('cut', e => this._onCopy(e, true));
    this.hiddenInput.addEventListener('paste', e => this._onPaste(e));
  }

  _onHiddenKeydown(e) {
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

  /* ---------------- Copy / Paste ---------------- */

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
      for (let r = sel.r1; r <= sel.r2; r++) {
        for (let c = sel.c1; c <= sel.c2; c++) this.data[r][c] = '';
      }
      this._emit('change');
      this._requestRender();
    }
  }

  _onPaste(e) {
    e.preventDefault();
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
    const neededCols = startC + Math.max(...grid.map(row => row.length));
    this._ensureSize(neededRows, neededCols);

    grid.forEach((rowArr, ri) => {
      rowArr.forEach((val, ci) => {
        this.data[startR + ri][startC + ci] = val;
      });
    });

    this._setSelection(startR, startC, startR + grid.length - 1, startC + Math.max(...grid.map(r => r.length)) - 1);
    this._emit('change');
    this._requestRender();
  }

  /* ---------------- Resize ---------------- */

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

  /* ---------------- Context menus ---------------- */

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
    this._openMenu(e.clientX, e.clientY, [
      { label: 'Insert row above', action: () => this._insertRow(r) },
      { label: 'Insert row below', action: () => this._insertRow(r + 1) },
      { sep: true },
      { label: 'Delete row', danger: true, action: () => this._deleteRow(r) },
    ]);
  }

  _showColMenu(e, c) {
    e.preventDefault();
    this._openMenu(e.clientX, e.clientY, [
      { label: 'Insert column left', action: () => this._insertCol(c) },
      { label: 'Insert column right', action: () => this._insertCol(c + 1) },
      { sep: true },
      { label: 'Delete column', danger: true, action: () => this._deleteCol(c) },
    ]);
  }

  _insertRow(at) {
    this.data.splice(at, 0, new Array(this.numCols).fill(''));
    this.rowHeights.splice(at, 0, this.defaultRowHeight);
    this.numRows++;
    this._computeOffsets();
    this._updateSizerSize();
    this._requestRender();
    this._emit('change');
  }

  _deleteRow(at) {
    if (this.numRows <= 1) return;
    this.data.splice(at, 1);
    this.rowHeights.splice(at, 1);
    this.numRows--;
    this._computeOffsets();
    this._updateSizerSize();
    this._requestRender();
    this._emit('change');
  }

  _insertCol(at) {
    this.data.forEach(row => row.splice(at, 0, ''));
    this.colWidths.splice(at, 0, this.defaultColWidth);
    this.numCols++;
    this._computeOffsets();
    this._updateSizerSize();
    this._requestRender();
    this._emit('change');
  }

  _deleteCol(at) {
    if (this.numCols <= 1) return;
    this.data.forEach(row => row.splice(at, 1));
    this.colWidths.splice(at, 1);
    this.numCols--;
    this._computeOffsets();
    this._updateSizerSize();
    this._requestRender();
    this._emit('change');
  }

  /* ---------------- Event wiring ---------------- */

  _bindEvents() {
    this.scrollEl.addEventListener('scroll', () => this._requestRender());
    this._bindGlobalMouseUp();
    this._bindHiddenInput();
    window.addEventListener('resize', () => this._requestRender());
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') this._closeMenu();
    });
  }
}