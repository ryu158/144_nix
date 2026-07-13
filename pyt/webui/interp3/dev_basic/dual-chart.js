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

	// Override of Chart._parseDataWithMode: same behavior, but also lets a
	// layer carry its own seriesMeta (temporarily swapped in for the parse),
	// so two independently-numbered datasets (Input col1, Output col1, ...)
	// don't collide on the same seriesMeta keys.
	_parseDataWithMode(data2d, mode = {}) {
		const prevMeta = this.seriesMeta;
		if (mode.seriesMeta) this.seriesMeta = mode.seriesMeta;

		const series = this._parseData(data2d);

		this.seriesMeta = prevMeta; // restore, no lingering side effects

		series.forEach(s => {
			if (mode.showLines !== undefined) s.showLines = mode.showLines;
			if (mode.showPoints !== undefined) s.showPoints = mode.showPoints;
			if (mode.labelSuffix) s.label += mode.labelSuffix;
		});
		return series;
	}

	// Input = scatter, drawn in front. Output = line, drawn behind.
	// opts: { inputMeta, outputMeta } — seriesMeta objects keyed by local
	// column index (1-based), same shape as setSeriesMeta() expects.
	renderInputOutput(inputData2d, outputData2d, opts = {}) {
		this.renderLayers([
			{ data2d: outputData2d, showLines: true,  showPoints: false, seriesMeta: opts.outputMeta },
			{ data2d: inputData2d,  showLines: false, showPoints: true,  seriesMeta: opts.inputMeta  },
		]);
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

/**
 * buildInputOutputMeta
 * Like mergeGridsForChart's label/color logic, but for the layered
 * (non-merged) case: each dataset keeps its own local column numbering,
 * so seriesMeta is returned as two separate maps instead of one offset map.
 */
function buildInputOutputMeta(dataA, dataB, opts = {}) {
	const labelA = opts.labelA || 'Input';
	const labelB = opts.labelB || 'Output';
	const colorsA = opts.colorsA || ['#2563eb', '#0891b2', '#4f46e5'];
	const colorsB = opts.colorsB || ['#dc2626', '#d97706', '#db2777'];

	const yColsA = Math.max(0, ...dataA.map(r => (r ? r.length : 0)), 1) - 1;
	const yColsB = Math.max(0, ...dataB.map(r => (r ? r.length : 0)), 1) - 1;

	const inputMeta = {};
	for (let c = 0; c < yColsA; c++) {
		inputMeta[c + 1] = {
			label: yColsA > 1 ? `${labelA} ${Chart.colLabel(c + 1)}` : labelA,
			color: colorsA[c % colorsA.length],
		};
	}
	const outputMeta = {};
	for (let c = 0; c < yColsB; c++) {
		outputMeta[c + 1] = {
			label: yColsB > 1 ? `${labelB} ${Chart.colLabel(c + 1)}` : labelB,
			color: colorsB[c % colorsB.length],
		};
	}
	return { inputMeta, outputMeta };
}

// Convenience wrapper: takes two GridTable instances directly (instead of
// raw data2d), builds seriesMeta automatically, and renders both layers.
// Generic — any page with two grids feeding one dual chart can use this.
plotFromGrids(gridA, gridB, opts = {}) {
	const { inputMeta, outputMeta } = buildInputOutputMeta(gridA.getData(), gridB.getData(), {
		labelA: opts.labelA ?? 'Input',
		labelB: opts.labelB ?? 'Output',
	});
	this.renderInputOutput(gridA.getData(), gridB.getData(), { inputMeta, outputMeta });
}
