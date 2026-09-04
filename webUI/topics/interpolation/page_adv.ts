/**
 * page_adv.ts
 * Page controller for the Advanced Interpolate Calculator.
 *
 * Unlike page.ts, this page computes nothing itself. It posts the table to
 * /api/interpolation/<method> and renders what comes back. Nothing here calls
 * InterpEngine on purpose: the advanced methods are scipy's, and falling back
 * to the basic page's linear math while the select reads "cubic spline" would
 * be a lie told by the page.
 */

(function () {
  const inputHost = document.getElementById('gridContainer');
  const outputHost = document.getElementById('gridContainer_2');
  const chartHost = document.getElementById('chartContainer');
  const runBtn = document.querySelector<HTMLButtonElement>('#genRangeBtn');
  const statusEl = document.querySelector<HTMLElement>('#status');
  const methodEl = document.querySelector<HTMLSelectElement>('#methodSelect');
  const xMinEl = document.querySelector<HTMLInputElement>('#outputXMin');
  const xMaxEl = document.querySelector<HTMLInputElement>('#outputXMax');
  const xIntervalEl = document.querySelector<HTMLInputElement>('#outputXInterval');

  if (!inputHost || !outputHost || !chartHost || !runBtn || !statusEl
      || !methodEl || !xMinEl || !xMaxEl || !xIntervalEl) {
    console.warn('[interpolate-adv] calculator markup missing — page not wired');
    return;
  }

  // Narrowed aliases: the guard proves these exist, but a hoisted function
  // declaration cannot see that proof.
  const status = statusEl, method = methodEl;
  const xMin = xMinEl, xMax = xMaxEl, xInterval = xIntervalEl;

  // No fixedColCount, unlike the basic page: this page takes x plus any number
  // of y series, so a wide paste grows the grid instead of alerting.
  const grid = new GridTable(inputHost, {
    rows: 10,
    cols: 4,
    viewportHeight: '100%',
    viewportWidth: '100%'
  });

  const grid_2 = new GridTable(outputHost, {
    rows: 10,
    cols: 4,
    viewportHeight: '100%',
    viewportWidth: '100%',
    readOnly: true
  });

  const chart = new DualSeriesChart(chartHost, {
    height: 'auto',
    xLabel: 'X (column A)',
    yLabel: 'Y',
    aspectRatio: 16 / 9,
    pointRadius: 2.5
  });

  function plotBoth() {
    chart.plotFromGridsIndexed(grid, grid_2);
  }

  grid_2.on('change', plotBoth);

  /* ---------------- Calculation, over HTTP ---------------- */

  function setStatus(text: string) {
    status.textContent = text;
  }

  async function run() {
    // Disabled while a request is in flight: a second click would fire a
    // second request and the answers could land out of order.
    runBtn!.disabled = true;
    setStatus('computing…');

    try {
      const res = await fetch(`/api/interpolation/${method.value}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: grid.getData(),
          rangeMin: xMin.value,
          rangeMax: xMax.value,
          interval: xInterval.value
        })
      });

      // The server answers a bad request with {"error": "..."} and a 4xx.
      // Anything else means it is down or nginx has no /api/ route, and the
      // body will not be JSON - hence the catch around parsing.
      let payload: unknown = null;
      try {
        payload = await res.json();
      } catch {
        setStatus(`calculation service unavailable (HTTP ${res.status})`);
        return;
      }

      if (!res.ok) {
        const message = (payload as { error?: string })?.error || `HTTP ${res.status}`;
        setStatus(`error: ${message}`);
        return;
      }

      const rows = payload as Grid2D;
      grid_2.setData(rows);
      plotBoth();
      setStatus(`${rows.length} rows, ${method.value}`);
      if (window.trackEvent) {
        window.trackEvent('interpolate_run', { level: 'advanced', method: method.value, query_count: rows.length });
      }
    } catch {
      // fetch itself rejected: offline, DNS, TLS, connection refused.
      setStatus('calculation service unreachable');
    } finally {
      runBtn!.disabled = false;
    }
  }

  runBtn.addEventListener('click', run);

  /* ---------------- Import / export ---------------- */

  // Paste already accepts CSV and TSV text. These two do the same job for a
  // file on disk, and give the results a way back out.
  const importBtn = document.querySelector<HTMLButtonElement>('#importBtn');
  const importFile = document.querySelector<HTMLInputElement>('#importFile');
  const exportBtn = document.querySelector<HTMLButtonElement>('#exportBtn');
  const exportFormat = document.querySelector<HTMLSelectElement>('#exportFormat');

  const TAB = '\t', COMMA = ',';

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
    // setData emits 'change', so plotBoth runs and demoPristine clears on its
    // own. Do NOT touch demoPristine here.
    grid.setData(rows);
    setStatus(`${rows.length} rows imported`);
    if (window.trackEvent) {
      window.trackEvent('csv_import', {
        level: 'advanced',
        format: file.name.toLowerCase().endsWith('.tsv') ? 'tsv' : 'csv',
        rows: rows.length
      });
    }
  }

  type Format = 'csv' | 'tsv';

  const MIME: Record<Format, string> = {
    csv: 'text/csv',
    tsv: 'text/tab-separated-values'
  };

  function exportBody(rows: Grid2D, format: Format): string {
    return toDelimited(rows, format === 'tsv' ? TAB : COMMA);
  }

  function suggestedName(format: Format): string {
    return `interpolation_${method.value}_${stamp()}.${format}`;
  }

  function formatOf(fileName: string): Format {
    return fileName.toLowerCase().endsWith('.tsv') ? 'tsv' : 'csv';
  }

  function exported(rows: Grid2D, format: Format) {
    setStatus(`${rows.length} rows exported as ${format.toUpperCase()}`);
    if (window.trackEvent) {
      window.trackEvent('csv_export', {
        level: 'advanced', format, method: method.value, rows: rows.length
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
  function saveWithAnchor(rows: Grid2D, format: Format) {
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
    const rows = grid_2.getData();
    if (!rows.length || rows.every(row => row.every(cell => cell === ''))) {
      setStatus('nothing to export — run interpolate first');
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
    saveWithAnchor(rows, (exportFormat?.value as Format) || 'csv');
  }

  if (!importBtn || !importFile || !exportBtn || !exportFormat) {
    console.warn('[interpolate-adv] import/export markup missing — buttons not wired');
  } else {
    importBtn.addEventListener('click', () => importFile.click());
    importFile.addEventListener('change', () => {
      const file = importFile.files && importFile.files[0];
      // Cleared before the await: picking the SAME file twice fires no change
      // event otherwise, and the second import would silently do nothing.
      importFile.value = '';
      if (file) void importFrom(file);
    });
    exportBtn.addEventListener('click', exportGrid);

    // The select is markup-hidden and revealed only where the save dialog
    // cannot offer a type dropdown. On Chromium it never appears.
    if (!window.showSaveFilePicker) exportFormat.hidden = false;
  }

  // Editing the input only re-plots. It does NOT re-run: every run is a network
  // round trip, and firing one per keystroke would hammer a shared service.
  grid.on('change', plotBoth);

  /* ---------------- Demo data ---------------- */

  // This page seeds its OWN demo, not the basic page's. The basic one is smooth
  // enough that all four methods agree to about 1e-2, which hides the only thing
  // this page exists to show. spec.json advanced.dataset explains the choice.
  //
  // The trap is the basic page's: grid.ts's paste overwrites cell by cell
  // without clearing, so a 2-row paste onto a seeded grid would leave the
  // remaining demo rows mixed into the visitor's data.
  let demoPristine = false;
  grid.on('change', () => { demoPristine = false; });

  const GRID_COLS = 4;

  function emptyGrid(): Grid2D {
    return Array.from({ length: 10 }, () => new Array(GRID_COLS).fill(''));
  }

  function gridIsEmpty(): boolean {
    return grid.getData().every(row => row.every(cell => cell === ''));
  }

  // Capture phase: this must run before grid.ts's own handler on the hidden input.
  inputHost.addEventListener('paste', () => {
    if (!demoPristine) return;
    demoPristine = false;
    grid.setData(emptyGrid());
  }, true);

  // spec.json owns the dataset and the range - rules/topics.md: never hardcode
  // either here. advanced.* first, falling back to the topic's own.
  fetch('/topics/interpolation/spec.json')
    .then(r => r.json() as Promise<Spec>)
    .then(spec => {
      const level = (spec.advanced || {}) as SpecMeta;

      const range = level.range;
      if (range) {
        // The HTML carries a static copy for crawlers; spec.json is the truth.
        if (range.min !== undefined) xMin.value = String(range.min);
        if (range.max !== undefined) xMax.value = String(range.max);
        if (range.interval !== undefined) xInterval.value = String(range.interval);
      }

      const data = level.dataset || spec.dataset;
      const xs = data && data.x;
      const ys = data && data.y;
      if (!xs || !xs.length) return;

      // The fetch is async. A visitor who pasted while it was in flight keeps
      // their data - seeding over it would be data loss.
      if (!gridIsEmpty()) return;

      grid.setData(xs.map((x, i) => {
        const row = new Array(GRID_COLS).fill('');
        row[0] = String(x);
        row[1] = String(ys?.[i] ?? '');
        return row;
      }));
      demoPristine = true;
    })
    .catch(() => { /* no demo is fine - the page works from an empty grid */ });
})();
