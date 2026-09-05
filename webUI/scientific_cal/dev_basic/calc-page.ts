/**
 * The parts every calculator page is built from, and the wiring between them.
 *
 * Extracted from topics/interpolation/page.ts and page_adv.ts on 2026-09-05,
 * when the two had converged far enough that the only real difference left was
 * how each one computes. Both are live callers, so this is extract-on-second-use
 * rather than a guess at a shape.
 *
 * What it owns: finding the markup, building the two grids and the chart,
 * plotting, the status line, file import/export, and the demo seed with its
 * paste trap.
 *
 * What it does NOT own: computing anything. The caller registers its own run
 * handler. Nothing here imports or references a topic's math — the advanced
 * page in particular must never gain a client-side fallback, because its status
 * line names the method the server ran.
 */

interface CalcPageOptions {
  /** Topic slug. Also the spec.json path. */
  slug: string;
  /**
   * Level key: 'calculator', 'advanced', … Does three jobs — it names the
   * analytics level, picks `spec[level].dataset` and `spec[level].range`, and
   * tags the console warning.
   */
  level: string;
  /** Starting column count for both grids. */
  cols: number;
  /**
   * Lock the input grid to `cols`. True on a page that means "x plus N fixed
   * series", false on one that takes any width.
   */
  fixedColCount: boolean;
}

/** Everything the caller needs to add its own compute path. */
interface CalcPage {
  input: GridTable;
  output: GridTable;
  chart: DualSeriesChart;
  runBtn: HTMLButtonElement;
  xMin: HTMLInputElement;
  xMax: HTMLInputElement;
  xInterval: HTMLInputElement;
  /** Null on a page that offers no choice of method. */
  method: HTMLSelectElement | null;
  /** Redraw both series from the current grid contents. */
  plotBoth(): void;
  /** Write the toolbar status line. */
  setStatus(text: string): void;
}

/**
 * Build a calculator page. Returns null — after warning — if the markup is not
 * there, so a caller can bail in one line. A half-wired calculator is worse
 * than an obvious warning.
 */
function initCalcPage(opts: CalcPageOptions): CalcPage | null {
  const inputHost = document.getElementById('gridContainer');
  const outputHost = document.getElementById('gridContainer_2');
  const chartHost = document.getElementById('chartContainer');
  const runBtn = document.querySelector<HTMLButtonElement>('#genRangeBtn');
  const statusEl = document.querySelector<HTMLElement>('#status');
  const xMinEl = document.querySelector<HTMLInputElement>('#outputXMin');
  const xMaxEl = document.querySelector<HTMLInputElement>('#outputXMax');
  const xIntervalEl = document.querySelector<HTMLInputElement>('#outputXInterval');

  if (!inputHost || !outputHost || !chartHost || !runBtn || !statusEl
      || !xMinEl || !xMaxEl || !xIntervalEl) {
    console.warn(`[${opts.slug}:${opts.level}] calculator markup missing — page not wired`);
    return null;
  }

  // Narrowed aliases. The guard proves these exist, but a closure created below
  // cannot see that proof — a fresh const carries it in.
  const host = inputHost, status = statusEl;
  const xMin = xMinEl, xMax = xMaxEl, xInterval = xIntervalEl;

  // Optional: a page with one method offers no select, and that is not an error.
  const method = document.querySelector<HTMLSelectElement>('#methodSelect');

  const input = new GridTable(inputHost, {
    rows: 10,
    cols: opts.cols,
    viewportHeight: '100%',
    viewportWidth: '100%',
    fixedColCount: opts.fixedColCount
  });

  const output = new GridTable(outputHost, {
    rows: 10,
    cols: opts.cols,
    viewportHeight: '100%',
    viewportWidth: '100%',
    fixedColCount: opts.fixedColCount,
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
    chart.plotFromGridsIndexed(input, output);
  }

  function setStatus(text: string) {
    status.textContent = text;
  }

  output.on('change', plotBoth);

  /* ---------------- Import / export ---------------- */

  // dev_basic/csv.ts owns the file handling. It finds its own buttons by id and
  // knows nothing about the topic; the two grids and this page's identity are
  // the only things it cannot work out for itself.
  //
  // Nothing else belongs here. Import calls setData, which emits 'change', so
  // the caller's plot and the demo clear below both run through handlers that
  // are already registered.
  initCsvIo({ slug: opts.slug, level: opts.level, input, output });

  /* ---------------- Demo data ---------------- */

  // Still holding the seeded demo, untouched by the visitor.
  let demoPristine = false;
  input.on('change', () => { demoPristine = false; });

  function emptyGrid(): Grid2D {
    return Array.from({ length: 10 }, () => new Array(opts.cols).fill(''));
  }

  function gridIsEmpty(): boolean {
    return input.getData().every(row => row.every(cell => cell === ''));
  }

  // Capture phase, on the container: this runs before grid.ts's own paste
  // handler on the hidden input, which overwrites cell by cell and would
  // otherwise leave the demo's remaining rows mixed into the visitor's data.
  host.addEventListener('paste', () => {
    if (!demoPristine) return;
    demoPristine = false;
    input.setData(emptyGrid());
  }, true);

  // spec.json owns the dataset and the range - rules/topics.md: never hardcode
  // either in a page. This level's own values first, falling back to the topic's.
  fetch(`/scientific_cal/topics/${opts.slug}/spec.json`)
    .then(r => r.json() as Promise<Spec>)
    .then(spec => {
      const meta = (spec[opts.level] || {}) as SpecMeta;

      const range = meta.range;
      if (range) {
        // The HTML carries a static copy for crawlers; spec.json is the truth.
        if (range.min !== undefined) xMin.value = String(range.min);
        if (range.max !== undefined) xMax.value = String(range.max);
        if (range.interval !== undefined) xInterval.value = String(range.interval);
      }

      const data = meta.dataset || spec.dataset;
      const xs = data && data.x;
      const ys = data && data.y;
      if (!xs || !xs.length) return;

      // The fetch is async. A visitor who typed or pasted while it was in flight
      // keeps their data - seeding over it would be data loss.
      if (!gridIsEmpty()) return;

      input.setData(xs.map((x, i) => {
        const row = new Array(opts.cols).fill('');
        row[0] = String(x);
        row[1] = String(ys?.[i] ?? '');
        return row;
      }));
      demoPristine = true;
    })
    .catch(() => { /* no demo is fine - a calculator works from an empty grid */ });

  return { input, output, chart, runBtn, xMin, xMax, xInterval, method, plotBoth, setStatus };
}
