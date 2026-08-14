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
			{ data2d: outputData2d, showLines: false,  showPoints: true, seriesMeta: opts.outputMeta },
			{ data2d: inputData2d,  showLines: true, showPoints: false,  seriesMeta: opts.inputMeta  },
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
 * Plotly Python color codes default - 
*/
function mergeGridsForChart(dataA, dataB, opts = {}) {
  const labelA = opts.labelA || 'Input';
  const labelB = opts.labelB || 'Output';
  const colorsA = opts.colorsA || ['#19D3F3', '#EF553B', '#B6E880'];
  const colorsB = opts.colorsB || ['#636EFA', '#7F0000', '#00CC96'];

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
	const colorsA = opts.colorsA || ['#19D3F3', '#EF553B', '#B6E880'];
	const colorsB = opts.colorsB || ['#636EFA', '#7F0000', '#00CC96'];

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
// 👇 FIX: attached via prototype instead of a bare method-shorthand block
// (the original file had this floating at top level, which is invalid JS
// outside a class/object body and threw a parse error for the whole file).
// Input = scatter dots, drawn first (back).
// Output = line, drawn second (front).
DualSeriesChart.prototype.plotFromGridsIndexed = function (gridA, gridB, opts = {}) {
	const { inputMeta, outputMeta } = buildInputOutputMetaIndexed(gridA.getData(), gridB.getData(), {
		suffixA: opts.suffixA ?? 'input',
		suffixB: opts.suffixB ?? 'output',
	});
	this.renderLayers([
		{ data2d: gridA.getData(), showLines: false, showPoints: true, seriesMeta: inputMeta  }, // input = dots, back
		{ data2d: gridB.getData(), showLines: true,  showPoints: false, seriesMeta: outputMeta }, // output = line, front
	]);
};

/**
 * Header-based legend naming (additive extension).
 * Reads column names from row 0 of grid.getData() — col0 is the X header,
 * col1..N are the Y-series headers — instead of always using "Input B" etc.
 * Falls back to the original colLabel-based name if a header cell is blank.
 */
function _extractHeaderLabels(data2d) {
	const headerRow = (data2d && data2d[0]) || [];
	return headerRow.map(v => (v ?? '').toString().trim());
}

function buildInputOutputMetaFromHeaders(dataA, dataB, opts = {}) {
	const labelA = opts.labelA || 'Input';
	const labelB = opts.labelB || 'Output';
	const colorsA = opts.colorsA || ['#636EFA', '#7F0000', '#00CC96'];
	const colorsB = opts.colorsB || ['#19D3F3', '#EF553B', '#B6E880'];

	const headersA = _extractHeaderLabels(dataA);
	const headersB = _extractHeaderLabels(dataB);

	const yColsA = Math.max(0, ...dataA.map(r => (r ? r.length : 0)), 1) - 1;
	const yColsB = Math.max(0, ...dataB.map(r => (r ? r.length : 0)), 1) - 1;

	const inputMeta = {};
	for (let c = 0; c < yColsA; c++) {
		const headerName = headersA[c + 1];
		inputMeta[c + 1] = {
			label: headerName || (yColsA > 1 ? `${labelA} ${Chart.colLabel(c + 1)}` : labelA),
			color: colorsA[c % colorsA.length],
		};
	}
	const outputMeta = {};
	for (let c = 0; c < yColsB; c++) {
		const headerName = headersB[c + 1];
		outputMeta[c + 1] = {
			label: headerName || (yColsB > 1 ? `${labelB} ${Chart.colLabel(c + 1)}` : labelB),
			color: colorsB[c % colorsB.length],
		};
	}
	return { inputMeta, outputMeta };
}

// New prototype method, parallel to the existing plotFromGrids, but using
// header-row-derived legend labels instead of auto-generated column letters.
DualSeriesChart.prototype.plotFromGridsWithHeaders = function (gridA, gridB, opts = {}) {
	const { inputMeta, outputMeta } = buildInputOutputMetaFromHeaders(gridA.getData(), gridB.getData(), {
		labelA: opts.labelA ?? 'Input',
		labelB: opts.labelB ?? 'Output',
	});
	this.renderInputOutput(gridA.getData(), gridB.getData(), { inputMeta, outputMeta });
};

/**
 * Positional legend naming (additive extension).
 * Produces labels like y1_input, y2_input, ... and y1_output, y2_output, ...
 * based purely on column position within each dataset — no header lookup.
 */
function buildInputOutputMetaIndexed(dataA, dataB, opts = {}) {
	const suffixA = opts.suffixA || 'input';
	const suffixB = opts.suffixB || 'output';
	const colorsA = opts.colorsA || ['#636EFA', '#7F0000', '#00CC96'];
	const colorsB = opts.colorsB || ['#19D3F3', '#EF553B', '#B6E880'];

	const yColsA = Math.max(0, ...dataA.map(r => (r ? r.length : 0)), 1) - 1;
	const yColsB = Math.max(0, ...dataB.map(r => (r ? r.length : 0)), 1) - 1;

	const inputMeta = {};
	for (let c = 0; c < yColsA; c++) {
		inputMeta[c + 1] = { label: `y${c + 1}_${suffixA}`, color: colorsA[c % colorsA.length] };
	}
	const outputMeta = {};
	for (let c = 0; c < yColsB; c++) {
		outputMeta[c + 1] = { label: `y${c + 1}_${suffixB}`, color: colorsB[c % colorsB.length] };
	}
	return { inputMeta, outputMeta };
}

/**
 * Legend grouping override (new method — DualSeriesChart doesn't currently
 * define _renderLegend, so this is an addition, not a modification of
 * inherited Chart behavior). Groups legend entries by "_input"/"_output"
 * label suffix so Input items render together, then Output items on their
 * own row, regardless of internal series draw order (which must stay
 * output-behind/input-front for correct chart layering).
 */
DualSeriesChart.prototype._renderLegend = function () {
	if (!this.showLegend) { this.legendEl.innerHTML = ''; return; }
	this.legendEl.innerHTML = '';

	const isInput = s => /_input$/.test(s.label);
	const isOutput = s => /_output$/.test(s.label);

	const inputSeries = this._series.filter(isInput);
	const outputSeries = this._series.filter(isOutput);
	const otherSeries = this._series.filter(s => !isInput(s) && !isOutput(s));

	const appendGroup = (group) => {
		group.forEach(s => {
			const item = document.createElement('span');
			item.className = 'ct-legend-item';
			const swatch = document.createElement('span');
			swatch.className = 'ct-legend-swatch';
			swatch.style.background = s.color;
			item.append(swatch, document.createTextNode(s.label));
			this.legendEl.appendChild(item);
		});
	};

	appendGroup(inputSeries);
	if (inputSeries.length && outputSeries.length) {
		const rowBreak = document.createElement('span');
		rowBreak.className = 'ct-legend-break';
		this.legendEl.appendChild(rowBreak);
	}
	appendGroup(outputSeries);
	appendGroup(otherSeries);
};
