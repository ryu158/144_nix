/**
 * Chart
 * A dependency-free scatter+line chart rendered on <canvas>.
 *
 * Data contract: takes the same 2D array shape as GridTable.getData()
 * (array of rows, each row an array of cell strings).
 * - Column 0    -> X values
 * - Column 1..N -> one Y series per column
 * Rows where X isn't a valid number are skipped. Within a series, cells
 * that aren't valid numbers are skipped (gaps in that line), not treated
 * as zero.
 *
 * Public API:
 * new Chart(container, options)
 * .render(data2d)   // data2d: string[][] (e.g. grid.getData())
 * .clear()
 * .destroy()        // Cleans up event listeners and DOM
 */
class Chart {
	constructor(container, options = {}) {
		this.container = container;
		this.height = options.height ?? 420;
		this.width = options.width ?? null; // null = fill container width
		this.aspectRatio = options.aspectRatio ?? null; // e.g., 16/9, 4/3, 2 or null
		this.padding = { top: 28, right: 24, bottom: 44, left: 56, ...(options.padding || {}) };
		this.pointRadius = options.pointRadius ?? 3.5;
		this.showLegend = options.showLegend ?? true;
		this.showPoints = options.showPoints ?? true;
		this.showLines = options.showLines ?? true;
		this.xLabel = options.xLabel ?? '';
		this.yLabel = options.yLabel ?? '';
		this.colors = options.colors ?? [
			'#2563eb', '#dc2626', '#16a34a', '#d97706',
			'#7c3aed', '#0891b2', '#db2777', '#65a30d',
		];

		this._toCssSize = v => (v === null || v === undefined) ? null : (typeof v === 'number' ? v + 'px' : v);
		this._series = [];
		this._hover = null;
		this._drawPending = false;

		this._ensureStyles();
		this._buildDom();
		this._bindEvents();
	}

	/* ---------------- Public API ---------------- */

	render(data2d) {
		this._series = this._parseData(data2d);
		this._draw();
	}

	clear() {
		this._series = [];
		if (this.ctx && this.canvas) {
			this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
		}
	}

	getData() {
		return this._series;
	}

	destroy() {
		if (this._resizeHandler) {
			window.removeEventListener('resize', this._resizeHandler);
		}
		this.container.innerHTML = '';
	}

	/* ---------------- Core Internal Mechanics ---------------- */

	_requestDraw() {
		if (this._drawPending) return;
		this._drawPending = true;
		requestAnimationFrame(() => {
			this._drawPending = false;
			this._draw();
		});
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

	_parseData(data2d) {
		if (!data2d || !data2d.length) return [];
		const numCols = Math.max(...data2d.map(row => row?.length || 0));
		const seriesCount = Math.max(0, numCols - 1);
		const series = [];
		for (let s = 0; s < seriesCount; s++) {
			series.push({ label: Chart.colLabel(s + 1), color: this.colors[s % this.colors.length], points: [] });
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

	/* ---------------- DOM & Styles ---------------- */

	_ensureStyles() {
		const styleId = 'ct-chart-styles';
		if (document.getElementById(styleId)) return;
		const style = document.createElement('style');
		style.id = styleId;
		style.textContent = `
      .ct-root { position: relative; box-sizing: border-box; display: flex; flex-direction: column; }
      .ct-canvas { width: 100%; height: 100%; flex-grow: 1; display: block; }
      .ct-tooltip { position: absolute; padding: 6px 10px; background: rgba(31, 41, 55, 0.95); color: #fff; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; font-size: 11px; border-radius: 4px; pointer-events: none; z-index: 10; box-shadow: 0 2px 5px rgba(0,0,0,0.2); line-height: 1.4; }
      .ct-legend { display: flex; flex-wrap: wrap; gap: 12px; justify-content: center; padding: 6px 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; font-size: 12px; color: #374151; }
      .ct-legend-item { display: flex; align-items: center; gap: 4px; }
      .ct-legend-swatch { width: 12px; height: 12px; border-radius: 2px; display: inline-block; }
    `;
		document.head.appendChild(style);
	}

	_buildDom() {
		this.container.innerHTML = '';
		this.root = document.createElement('div');
		this.root.className = 'ct-root';
		if (this.width) this.root.style.width = this._toCssSize(this.width);
		this.root.style.height = this._toCssSize(this.height);

		this.canvas = document.createElement('canvas');
		this.canvas.className = 'ct-canvas';
		this.ctx = this.canvas.getContext('2d');

		this.tooltip = document.createElement('div');
		this.tooltip.className = 'ct-tooltip';
		this.tooltip.style.display = 'none';

		this.legendEl = document.createElement('div');
		this.legendEl.className = 'ct-legend';

		// NEW: Create Context Menu element
		this.contextMenu = document.createElement('div');
		this.contextMenu.className = 'ct-context-menu';
		this.contextMenu.style.display = 'none';

		this.root.append(this.canvas, this.tooltip, this.legendEl, this.contextMenu); // Append contextMenu here
		this.container.appendChild(this.root);
	}

	_bindEvents() {
		this._resizeHandler = () => this._requestDraw();
		window.addEventListener('resize', this._resizeHandler);

		this.canvas.addEventListener('mousemove', e => this._onMouseMove(e));
		this.canvas.addEventListener('mouseleave', () => {
			this._hover = null;
			this.tooltip.style.display = 'none';
			this._requestDraw();
		});

		this.canvas.addEventListener('contextmenu', e => {
			e.preventDefault(); 
			this._showContextMenu(e);
		});

		// Save the reference to the global click handler so we can remove it later
		this._documentClickHandler = e => {
			if (this.contextMenu && !this.contextMenu.contains(e.target)) {
				this.contextMenu.style.display = 'none';
			}
		};
		document.addEventListener('click', this._documentClickHandler);
	}

	destroy() {
		if (this._resizeHandler) {
			window.removeEventListener('resize', this._resizeHandler);
		}
		// Clean up the global document click listener
		if (this._documentClickHandler) {
			document.removeEventListener('click', this._documentClickHandler);
		}
		this.container.innerHTML = '';
	}
	/* ---------------- Drawing Engineering ---------------- */

	_resizeCanvasForDPR() {
		const dpr = window.devicePixelRatio || 1;

		// 1. Determine available width from container
		const w = Math.max(1, Math.round(this.root.clientWidth));

		// 2. Calculate height based on options or aspect ratio
		let h;
		if (this.aspectRatio) {
			// Calculate height from width using the custom ratio (Width / Ratio = Height)
			h = Math.max(1, Math.round(w / this.aspectRatio));

			// Update the wrapper container's style so the DOM matches the calculated aspect ratio
			this.root.style.height = h + 'px';
		} else {
			// Fallback to fixed layout calculations if no aspect ratio is specified
			const legendHeight = this.showLegend ? this.legendEl.offsetHeight : 0;
			h = Math.max(1, Math.round(this.root.clientHeight - legendHeight));
		}

		// 3. Sync backing canvas buffer dimensions
		if (this.canvas.width !== w * dpr || this.canvas.height !== h * dpr) {
			this.canvas.width = w * dpr;
			this.canvas.height = h * dpr;
		}

		this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
		return { w, h };
	}

	_computeScales(w, h) {
		const pad = this.padding;
		const allX = this._series.flatMap(s => s.points.map(p => p.x));
		const allY = this._series.flatMap(s => s.points.map(p => p.y));
		let xMin = Math.min(...allX), xMax = Math.max(...allX);
		let yMin = Math.min(...allY), yMax = Math.max(...allY);

		if (xMin === xMax) { xMin -= 1; xMax += 1; }
		if (yMin === yMax) { yMin -= 1; yMax += 1; }

		const xPad = (xMax - xMin) * 0.05;
		const yPad = (yMax - yMin) * 0.08;
		xMin -= xPad; xMax += xPad; yMin -= yPad; yMax += yPad;

		const plotW = Math.max(1, w - pad.left - pad.right);
		const plotH = Math.max(1, h - pad.top - pad.bottom);

		const sx = x => pad.left + ((x - xMin) / (xMax - xMin || 1)) * plotW;
		const sy = y => pad.top + plotH - ((y - yMin) / (yMax - yMin || 1)) * plotH;
		return { xMin, xMax, yMin, yMax, sx, sy, plotW, plotH };
	}

	static _niceTicks(min, max, count = 5) {
		const range = max - min || 1;
		const rawStep = range / count;
		const mag = Math.pow(10, Math.floor(Math.log10(rawStep || 1)));
		const norm = rawStep / (mag || 1);
		let step;
		if (norm < 1.5) step = 1 * mag;
		else if (norm < 3) step = 2 * mag;
		else if (norm < 7) step = 5 * mag;
		else step = 10 * mag;

		const start = Math.ceil(min / (step || 1)) * step;
		const ticks = [];
		for (let v = start; v <= max + step * 1e-9; v += step) {
			ticks.push(Math.round(v / (step || 1)) * step);
		}
		return ticks;
	}

	_draw() {
		if (!this.canvas || !this.canvas.isConnected) return;
		const { w, h } = this._resizeCanvasForDPR();
		const ctx = this.ctx;
		ctx.clearRect(0, 0, w, h);

		this._renderLegend();

		if (!this._series.length) {
			ctx.fillStyle = '#9ca3af';
			ctx.font = '13px -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif';
			ctx.textAlign = 'center';
			ctx.textBaseline = 'middle';
			ctx.fillText('No numeric data to plot yet', w / 2, h / 2);
			return;
		}

		const { xMin, xMax, yMin, yMax, sx, sy, plotW, plotH } = this._computeScales(w, h);
		const pad = this.padding;

		// Grid lines & axis text layouts
		ctx.strokeStyle = '#eef0f2';
		ctx.fillStyle = '#6b7280';
		ctx.font = '11px -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif';
		ctx.lineWidth = 1;

		const yTicks = Chart._niceTicks(yMin, yMax);
		ctx.textAlign = 'right';
		ctx.textBaseline = 'middle';
		for (const t of yTicks) {
			const py = sy(t);
			ctx.beginPath();
			ctx.moveTo(pad.left, py);
			ctx.lineTo(pad.left + plotW, py);
			ctx.stroke();
			ctx.fillText(this._formatNum(t), pad.left - 8, py);
		}

		const xTicks = Chart._niceTicks(xMin, xMax);
		ctx.textAlign = 'center';
		ctx.textBaseline = 'top';
		for (const t of xTicks) {
			const px = sx(t);
			ctx.beginPath();
			ctx.moveTo(px, pad.top);
			ctx.lineTo(px, pad.top + plotH);
			ctx.stroke();
			ctx.fillText(this._formatNum(t), px, pad.top + plotH + 8);
		}

		// Outer bounds base-axes
		ctx.strokeStyle = '#d0d5dd';
		ctx.lineWidth = 1;
		ctx.beginPath();
		ctx.moveTo(pad.left, pad.top);
		ctx.lineTo(pad.left, pad.top + plotH);
		ctx.lineTo(pad.left + plotW, pad.top + plotH);
		ctx.stroke();

		// Context descriptive label positions
		if (this.xLabel) {
			ctx.fillStyle = '#374151';
			ctx.textAlign = 'center';
			ctx.textBaseline = 'alphabetic';
			ctx.font = '12px -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif';
			ctx.fillText(this.xLabel, pad.left + plotW / 2, h - 6);
		}
		if (this.yLabel) {
			ctx.save();
			ctx.translate(14, pad.top + plotH / 2);
			ctx.rotate(-Math.PI / 2);
			ctx.fillStyle = '#374151';
			ctx.textAlign = 'center';
			ctx.font = '12px -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif';
			ctx.fillText(this.yLabel, 0, 0);
			ctx.restore();
		}

		// Graph plotting rendering (with clipping boundaries)
		ctx.save();
		ctx.beginPath();
		ctx.rect(pad.left, pad.top, plotW, plotH);
		ctx.clip();

		for (const series of this._series) {
			if (this.showLines && series.points.length > 1) {
				ctx.strokeStyle = series.color;
				ctx.lineWidth = 2;
				ctx.beginPath();
				series.points.forEach((p, i) => {
					const px = sx(p.x), py = sy(p.y);
					if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
				});
				ctx.stroke();
			}
			if (this.showPoints) {
				ctx.fillStyle = series.color;
				for (const p of series.points) {
					ctx.beginPath();
					ctx.arc(sx(p.x), sy(p.y), this.pointRadius, 0, Math.PI * 2);
					ctx.fill();
				}
			}
		}

		// Crosshair rendering logic
		if (this._hover) {
			const { series, point } = this._hover;
			const px = sx(point.x), py = sy(point.y);
			ctx.strokeStyle = '#9ca3af';
			ctx.lineWidth = 1;
			ctx.setLineDash([3, 3]);
			ctx.beginPath();
			ctx.moveTo(px, pad.top);
			ctx.lineTo(px, pad.top + plotH);
			ctx.stroke();
			ctx.setLineDash([]);

			ctx.fillStyle = series.color;
			ctx.beginPath();
			ctx.arc(px, py, this.pointRadius + 2.5, 0, Math.PI * 2);
			ctx.fill();
			ctx.strokeStyle = '#ffffff';
			ctx.lineWidth = 2;
			ctx.stroke();
		}

		ctx.restore();
		this._scales = { xMin, xMax, yMin, yMax, sx, sy };
	}

	_formatNum(v) {
		if (Math.abs(v) >= 1000 || (Math.abs(v) < 0.001 && v !== 0)) return v.toExponential(1);
		return Number(v.toFixed(4)).toString();
	}

	_renderLegend() {
		if (!this.showLegend) { this.legendEl.innerHTML = ''; return; }
		this.legendEl.innerHTML = '';
		this._series.forEach(s => {
			const item = document.createElement('span');
			item.className = 'ct-legend-item';
			const swatch = document.createElement('span');
			swatch.className = 'ct-legend-swatch';
			swatch.style.background = s.color;
			item.append(swatch, document.createTextNode(s.label));
			this.legendEl.appendChild(item);
		});
	}

	_onMouseMove(e) {
		if (!this._scales || !this._series.length) return;
		const rect = this.canvas.getBoundingClientRect();
		const mx = e.clientX - rect.left;
		const my = e.clientY - rect.top;

		let closest = null, closestDist = Infinity;
		for (const series of this._series) {
			for (const p of series.points) {
				const px = this._scales.sx(p.x), py = this._scales.sy(p.y);
				const d = Math.hypot(px - mx, py - my);
				if (d < closestDist) { closestDist = d; closest = { series, point: p, px, py }; }
			}
		}

		if (closest && closestDist < 24) {
			this._hover = closest;
			this.tooltip.style.display = 'block';
			this.tooltip.style.left = (closest.px + 12) + 'px';
			this.tooltip.style.top = (closest.py - 8) + 'px';
			this.tooltip.innerHTML =
				`<strong>${closest.series.label}</strong><br>x: ${this._formatNum(closest.point.x)}<br>y: ${this._formatNum(closest.point.y)}`;
		} else {
			this._hover = null;
			this.tooltip.style.display = 'none';
		}
		this._requestDraw();
	}

	_showContextMenu(e) {
		this.contextMenu.innerHTML = '';

		// ==========================================
		// 1. GLOBAL OPTION: Pop out Chart Window
		// ==========================================
		const popoutItem = document.createElement('div');
		popoutItem.className = 'ct-menu-item';

		const popoutIcon = document.createElement('span');
		popoutIcon.className = 'ct-menu-checkbox';
		popoutIcon.innerHTML = '↗';
		popoutIcon.style.color = '#2563eb';

		const popoutLabel = document.createElement('span');
		popoutLabel.textContent = 'Pop out Chart';

		popoutItem.append(popoutIcon, popoutLabel);

		popoutItem.addEventListener('click', (menuEvent) => {
			menuEvent.stopPropagation();
			this.contextMenu.style.display = 'none'; // Close menu
			this._openPopoutWindow();
		});

		this.contextMenu.appendChild(popoutItem);

		// ==========================================
		// 2. GLOBAL OPTION: Toggle Whole Legend
		// ==========================================
		const legendToggleItem = document.createElement('div');
		legendToggleItem.className = 'ct-menu-item';

		const legendCheckbox = document.createElement('span');
		legendCheckbox.className = 'ct-menu-checkbox';
		legendCheckbox.innerHTML = this.showLegend ? '✓' : '';
		legendCheckbox.style.color = '#374151';

		const legendLabel = document.createElement('span');
		legendLabel.textContent = 'Show Legend';

		legendToggleItem.append(legendCheckbox, legendLabel);

		legendToggleItem.addEventListener('click', (menuEvent) => {
			menuEvent.stopPropagation();
			this.showLegend = !this.showLegend;
			legendCheckbox.innerHTML = this.showLegend ? '✓' : '';
			this._requestDraw();
		});

		this.contextMenu.appendChild(legendToggleItem);

		// ==========================================
		// 3. Positioning Logic
		// ==========================================
		const rect = this.root.getBoundingClientRect();
		const x = e.clientX - rect.left;
		const y = e.clientY - rect.top;

		this.contextMenu.style.left = x + 'px';
		this.contextMenu.style.top = y + 'px';
		this.contextMenu.style.display = 'block';
	}

	_openPopoutWindow() {
		// 1. Save the original chart state before upscaling
		const originalWidthSetting = this.width;
		const originalHeightSetting = this.height;
		const originalCanvasWidth = this.canvas.width;
		const originalCanvasHeight = this.canvas.height;

		// 2. Temporarily upscale the chart wrapper styles for an ultra-sharp capture
		// This scales the math, font text, and lines proportionally
		const targetWidth = 1920; 
		const targetHeight = Math.round(targetWidth / (this.aspectRatio || (16 / 9)));

		this.root.style.width = targetWidth + 'px';
		this.root.style.height = targetHeight + 'px';

		// Force a high-res redraw cycle synchronously
		this._draw();

		// 3. Extract the high-definition image data URL
		const highResDataUrl = this.canvas.toDataURL('image/png');

		// 4. Restore the on-screen chart back to its original layout settings immediately
		this.width = originalWidthSetting;
		this.height = originalHeightSetting;
		if (this.width) {
			this.root.style.width = this._toCssSize(this.width);
		} else {
			this.root.style.width = '';
		}
		this.root.style.height = this._toCssSize(this.height);

		this.canvas.width = originalCanvasWidth;
		this.canvas.height = originalCanvasHeight;

		// Request a standard frame redraw to reset the view smoothly
		this._requestDraw();

		// 5. Open the window and display the high-res image
		const popout = window.open('', '_blank', 'width=950,height=550,scrollbars=no,resizable=yes');
		if (!popout) {
			alert('Popup blocker blocked chart window execution. Please enable popups for this site.');
			return;
		}

		popout.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
	<title>Chart Popout View (HD)</title>
	<style>
	  html, body { 
	    margin: 0; 
	    padding: 0; 
	    width: 100%; 
	    height: 100%; 
	    background: #ffffff; 
	    display: flex; 
	    justify-content: center; 
	    align-items: center; 
	    box-sizing: border-box;
	    padding: 24px;
	  }
	  img { 
	    max-width: 100%; 
	    max-height: 100%; 
	    object-fit: contain;
	    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
	    border-radius: 6px;
	  }
	</style>
      </head>
      <body>
	<img src="${highResDataUrl}" alt="High Resolution Chart Snapshot" />
      </body>
      </html>
    `);
		popout.document.close();
	}
}
