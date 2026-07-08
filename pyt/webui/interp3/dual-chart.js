/**
 * DualSeriesChart
 * Extends Chart to allow per-series label/color overrides via seriesMeta,
 * keyed by 1-based column index. Pure addition — chart.js is untouched.
 */
class DualSeriesChart extends Chart {
  constructor(container, options = {}) {
    super(container, options);
    this.seriesMeta = options.seriesMeta || {}; // { [colIndex]: {label, color} }
  }

  setSeriesMeta(meta) {
    this.seriesMeta = meta || {};
  }

  // Same parsing contract as Chart._parseData, but applies seriesMeta overrides.
  _parseData(data2d) {
    if (!data2d || !data2d.length) return [];
    const numCols = Math.max(...data2d.map(row => row?.length || 0));
    const seriesCount = Math.max(0, numCols - 1);
    const series = [];
    for (let s = 0; s < seriesCount; s++) {
      const colIndex = s + 1;
      const meta = this.seriesMeta[colIndex];
      series.push({
        label: (meta && meta.label) || Chart.colLabel(colIndex),
        color: (meta && meta.color) || this.colors[s % this.colors.length],
        points: [],
      });
    }
    for (const row of data2d) {
      if (!row) continue;
      const xRaw = row[0];
      if (xRaw === undefined || xRaw === '' || xRaw === null) continue;
      const x = Number(xRaw);
      if (Number.isNaN(x)) continue;
      for (let s = 0; s < seriesCount; s++) {
        const yRaw = row[s + 1];
        if (yRaw === undefined || yRaw === '' || yRaw === null) continue;
        const y = Number(yRaw);
        if (Number.isNaN(y)) continue;
        series[s].points.push({ x, y });
      }
    }
    series.forEach(s => s.points.sort((a, b) => a.x - b.x));
    return series.filter(s => s.points.length > 0);
  }
}

/**
 * mergeGridsForChart
 * Combines two grid.getData() tables (each: col0 = X, col1..N = Y series)
 * into one table for DualSeriesChart, keeping Input and Output columns
 * separate so they render as distinct series with independent X domains.
 */
function mergeGridsForChart(dataA, dataB, opts = {}) {
  const labelA = opts.labelA || 'Input';
  const labelB = opts.labelB || 'Output';
  const colorsA = opts.colorsA || ['#2563eb', '#0891b2', '#4f46e5'];
  const colorsB = opts.colorsB || ['#dc2626', '#d97706', '#db2777'];

  const yColsA = Math.max(0, ...dataA.map(r => (r ? r.length : 0)), 1) - 1;
  const yColsB = Math.max(0, ...dataB.map(r => (r ? r.length : 0)), 1) - 1;
  const totalCols = 1 + yColsA + yColsB;

  const rows = [];
  for (const row of dataA) {
    if (!row) continue;
    const merged = new Array(totalCols).fill('');
    merged[0] = row[0] ?? '';
    for (let c = 0; c < yColsA; c++) merged[1 + c] = row[c + 1] ?? '';
    rows.push(merged);
  }
  for (const row of dataB) {
    if (!row) continue;
    const merged = new Array(totalCols).fill('');
    merged[0] = row[0] ?? '';
    for (let c = 0; c < yColsB; c++) merged[1 + yColsA + c] = row[c + 1] ?? '';
    rows.push(merged);
  }

  const seriesMeta = {};
  for (let c = 0; c < yColsA; c++) {
    seriesMeta[1 + c] = {
      label: yColsA > 1 ? `${labelA} ${Chart.colLabel(c + 1)}` : labelA,
      color: colorsA[c % colorsA.length],
    };
  }
  for (let c = 0; c < yColsB; c++) {
    seriesMeta[1 + yColsA + c] = {
      label: yColsB > 1 ? `${labelB} ${Chart.colLabel(c + 1)}` : labelB,
      color: colorsB[c % colorsB.length],
    };
  }

  return { data: rows, seriesMeta };
}
