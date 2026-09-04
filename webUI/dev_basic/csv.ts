/**
 * File import and export for a calculator page, shared by every topic.
 *
 * Extracted from topics/interpolation/page_adv.ts on 2026-09-04. It has one
 * caller today, which is a deliberate exception to CLAUDE.md's extract-on-
 * second-use rule: the next user is a new topic, not a second page of this one.
 *
 * Nothing here is topic-aware. The page passes its two grids and says who it
 * is; everything else is found in the DOM by id.
 *
 * Import mirrors grid.ts _onPaste deliberately — same delimiter sniffing, same
 * column-lock behaviour — so a file and a paste of the same bytes give the same
 * grid. Its limitations are copied with it, quoted fields included.
 *
 * Export offers the format in the save dialog where the browser can (Chromium),
 * and falls back to a select beside the button where it cannot (Firefox,
 * Safari). Either way the file never leaves the machine.
 */

interface CsvIoOptions {
  /** Topic slug, e.g. "interpolation". Used in analytics and the file name. */
  slug: string;
  /** Level within the topic, e.g. "advanced". Same two uses. */
  level: string;
  /** Grid an import writes into. */
  input: GridTable;
  /** Grid an export reads from. */
  output: GridTable;
}

type CsvFormat = 'csv' | 'tsv';

function initCsvIo(opts: CsvIoOptions) {
  const importBtn = document.querySelector<HTMLButtonElement>('#importBtn');
  const importFile = document.querySelector<HTMLInputElement>('#importFile');
  const exportBtn = document.querySelector<HTMLButtonElement>('#exportBtn');
  const exportFormat = document.querySelector<HTMLSelectElement>('#exportFormat');
  const statusEl = document.querySelector<HTMLElement>('#status');

  if (!importBtn || !importFile || !exportBtn || !exportFormat) {
    console.warn('[csv] import/export markup missing — buttons not wired');
    return;
  }

  // Narrowed aliases: the guard proves these exist, but a hoisted function
  // declaration cannot see that proof.
  const fileInput = importFile, formatSelect = exportFormat;

  const { slug, level, input, output } = opts;

  const TAB = '\t', COMMA = ',';

  const MIME: Record<CsvFormat, string> = {
    csv: 'text/csv',
    tsv: 'text/tab-separated-values'
  };

  function setStatus(text: string) {
    if (statusEl) statusEl.textContent = text;
  }

  /* ---------------- Parsing ---------------- */

  // Delimiter sniffing is lifted from grid.ts _onPaste on purpose: the same
  // bytes must give the same grid whether they arrive by file or by clipboard.
  // Quoted fields are not handled there either - fixing it here alone would
  // make the two disagree.
  function parseDelimited(text: string): Grid2D {
    const rawRows = text.replace(/\r/g, '').split('\n').filter((row, idx, arr) =>
      !(idx === arr.length - 1 && row === '')
    );
    const delim = rawRows[0] && rawRows[0].includes(TAB) ? TAB : COMMA;
    return rawRows.map(row => row.split(delim));
  }

  function toDelimited(rows: Grid2D, delim: string): string {
    return rows.map(row => row.join(delim)).join('\n');
  }

  function stamp(): string {
    const d = new Date(), pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`
      + `-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
  }

  /* ---------------- Import ---------------- */

  /**
   * Enforce the grid's column lock, the way grid.ts's paste handler does.
   *
   * setData hard-resets numCols, so it walks straight past fixedColCount and
   * would silently widen a locked grid - while a paste of the same file alerts
   * and truncates. UNPROVEN: the only caller today runs an unlocked grid, so no
   * test exercises this branch.
   */
  function applyColumnLock(rows: Grid2D): Grid2D {
    if (!input.fixedColCount) return rows;
    const width = Math.max(...rows.map(row => row.length));
    if (width <= input.numCols) return rows;

    alert(`Warning: Imported data contains ${width} columns, but the grid is locked. Some columns will be truncated.`);
    return rows.map(row => row.slice(0, input.numCols));
  }

  async function importFrom(file: File) {
    let rows: Grid2D;
    try {
      rows = parseDelimited(await file.text());
    } catch {
      setStatus('could not read that file');
      return;
    }
    if (!rows.length || rows.every(row => row.every(cell => cell.trim() === ''))) {
      setStatus('that file has no data');
      return;
    }
    rows = applyColumnLock(rows);

    // setData emits 'change', so the page's own plot and demo-pristine handlers
    // run. A caller must NOT add anything here to compensate.
    input.setData(rows);
    setStatus(`${rows.length} rows imported`);
    if (window.trackEvent) {
      window.trackEvent('csv_import', {
        slug,
        level,
        format: file.name.toLowerCase().endsWith('.tsv') ? 'tsv' : 'csv',
        rows: rows.length
      });
    }
  }

  /* ---------------- Export ---------------- */

  function exportBody(rows: Grid2D, format: CsvFormat): string {
    return toDelimited(rows, format === 'tsv' ? TAB : COMMA);
  }

  /** The page's parameter select, if it has one. Read fresh — pages change it. */
  function methodValue(): string | undefined {
    return document.querySelector<HTMLSelectElement>('#methodSelect')?.value;
  }

  /**
   * `<slug>_<method>_<stamp>.<ext>`, with the method left out on a page that
   * offers no choice of one. The component cannot know what a topic calls its
   * parameter, so it reads the select the page already has, or nothing.
   */
  function suggestedName(format: CsvFormat): string {
    return [slug, methodValue(), stamp()].filter(Boolean).join('_') + `.${format}`;
  }

  function formatOf(fileName: string): CsvFormat {
    return fileName.toLowerCase().endsWith('.tsv') ? 'tsv' : 'csv';
  }

  function exported(rows: Grid2D, format: CsvFormat) {
    setStatus(`${rows.length} rows exported as ${format.toUpperCase()}`);
    if (window.trackEvent) {
      window.trackEvent('csv_export', {
        slug, level, format, method: methodValue(), rows: rows.length
      });
    }
  }

  /**
   * Chromium: a real save dialog with a "Save as type" dropdown.
   *
   * The FORMAT COMES BACK FROM THE HANDLE, not from the page - whichever type
   * the user picked in the dialog decides the delimiter. That is the whole
   * reason this path exists.
   */
  async function saveWithPicker(picker: NonNullable<Window['showSaveFilePicker']>, rows: Grid2D) {
    let handle: SaveFileHandle;
    try {
      handle = await picker({
        suggestedName: suggestedName('csv'),
        types: [
          { description: 'CSV (comma separated)', accept: { 'text/csv': ['.csv'] } },
          { description: 'TSV (tab separated)', accept: { 'text/tab-separated-values': ['.tsv'] } }
        ]
      });
    } catch {
      // AbortError: the user pressed Cancel. Not a failure - say nothing, and
      // report no analytics event for a save that never happened.
      return;
    }

    const format = formatOf(handle.name);
    try {
      const writable = await handle.createWritable();
      await writable.write(exportBody(rows, format));
      await writable.close();
    } catch {
      setStatus('could not write that file');
      return;
    }
    exported(rows, format);
  }

  /**
   * Firefox and Safari: no save dialog API exists, so the browser drops the file
   * straight into Downloads and #exportFormat carries the choice instead.
   */
  function saveWithAnchor(rows: Grid2D, format: CsvFormat) {
    const blob = new Blob([exportBody(rows, format)], { type: `${MIME[format]};charset=utf-8` });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = suggestedName(format);
    a.click();
    // Revoking immediately can cancel the download in some browsers; one tick
    // is enough for the click to have taken the URL.
    setTimeout(() => URL.revokeObjectURL(url), 0);
    exported(rows, format);
  }

  function exportGrid() {
    const rows = output.getData();
    if (!rows.length || rows.every(row => row.every(cell => cell === ''))) {
      setStatus('nothing to export — compute something first');
      return;
    }

    // Read straight off window: a test can add or remove the API per page, and
    // a cached reference taken at load would miss that.
    const picker = window.showSaveFilePicker;
    // No await above this line, deliberately. Chromium needs an unconsumed user
    // gesture to open the dialog, and one awaited tick spends it.
    if (picker) {
      void saveWithPicker(picker.bind(window), rows);
      return;
    }
    saveWithAnchor(rows, (formatSelect.value as CsvFormat) || 'csv');
  }

  /* ---------------- Wiring ---------------- */

  importBtn.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', () => {
    const file = fileInput.files && fileInput.files[0];
    // Cleared before the await: picking the SAME file twice fires no change
    // event otherwise, and the second import would silently do nothing.
    fileInput.value = '';
    if (file) void importFrom(file);
  });
  exportBtn.addEventListener('click', exportGrid);

  // The select is markup-hidden and revealed only where the save dialog cannot
  // offer a type dropdown. On Chromium it never appears.
  if (!window.showSaveFilePicker) formatSelect.hidden = false;
}
