/**
 * Chart
 * A dependency-free scatter+line chart rendered on <canvas>.
 *
 * Data contract: takes the same 2D array shape as GridTable.getData()
 * (array of rows, each row an array of cell strings).
 *   - Column 0  -> X values
 *   - Column 1..N -> one Y series per column
 * Rows where X isn't a valid number are skipped. Within a series, cells
 * that aren't valid numbers are skipped (gaps in that line), not treated
 * as zero.
 *
 * Public API:
 *   new Chart(container, options)
 *   .render(data2d)   // data2d: string[][] (e.g. grid.getData())
 *   .clear()
 */
class Chart {
  constructor(container, options = {}) {
    this.container = container;
    this.height = options.height ?? 420;
    this.width = options.width ?? null; // null = fill container width
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
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  _requestDraw() {
    if (this._drawPending) return;
    this._drawPending = true;
    requestAnimationFrame(() => {
      this._drawPending = false;
      this._draw();
    });
  }

  /* ---------------- Data parsing ---------------- */

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
    const numCols = Math.max(...data2d.map(row => row.length));
    const seriesCount = Math.max(0, numCols - 1);
    const series = [];
    for (let s = 0; s < seriesCount; s++) {
      series.push({ label: Chart.colLabel(s + 1), color: this.colors[s % this.colors.length], points: [] });
    }
    for (const row of data2d) {
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
    // keep each series sorted by x so lines don't zig-zag
    series.forEach(s => s.points.sort((a, b) => a.x - b.x));
    return series.filter(s => s.points.length > 0);
  }

  /* ---------------- DOM ---------------- */

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

    this.root.append(this.canvas, this.tooltip, this.legendEl);
    this.container.appendChild(this.root);
  }

  _bindEvents() {
    window.addEventListener('resize', () => this._requestDraw());
    this.canvas.addEventListener('mousemove', e => this._onMouseMove(e));
    this.canvas.addEventListener('mouseleave', () => {
      this._hover = null;
      this.tooltip.style.display = 'none';
      this._requestDraw();
    });
  }

  /* ---------------- Drawing ---------------- */

  _resizeCanvasForDPR() {
    const dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.getBoundingClientRect();
    const w = Math.max(1, Math.round(rect.width));
    const h = Math.max(1, Math.round(rect.height));
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

    const plotW = w - pad.left - pad.right;
    const plotH = h - pad.top - pad.bottom;
    const sx = x => pad.left + ((x - xMin) / (xMax - xMin)) * plotW;
    const sy = y => pad.top + plotH - ((y - yMin) / (yMax - yMin)) * plotH;
    return { xMin, xMax, yMin, yMax, sx, sy, plotW, plotH };
  }

  static _niceTicks(min, max, count = 5) {
    const range = max - min || 1;
    const rawStep = range / count;
    const mag = Math.pow(10, Math.floor(Math.log10(rawStep)));
    const norm = rawStep / mag;
    let step;
    if (norm < 1.5) step = 1 * mag;
    else if (norm < 3) step = 2 * mag;
    else if (norm < 7) step = 5 * mag;
    else step = 10 * mag;
    const start = Math.ceil(min / step) * step;
    const ticks = [];
    for (let v = start; v <= max + step * 1e-9; v += step) ticks.push(Math.round(v / step) * step);
    return ticks;
  }

  _draw() {
    if (!this.canvas.isConnected) return;
    const { w, h } = this._resizeCanvasForDPR();
    const ctx = this.ctx;
    ctx.clearRect(0, 0, w, h);

    this._renderLegend();

    if (!this._series.length) {
      ctx.fillStyle = '#9ca3af';
      ctx.font = '13px -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('No numeric data to plot yet', w / 2, h / 2);
      return;
    }

    const { xMin, xMax, yMin, yMax, sx, sy, plotW, plotH } = this._computeScales(w, h);
    const pad = this.padding;

    // grid lines + axis ticks
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

    // axes
    ctx.strokeStyle = '#d0d5dd';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(pad.left, pad.top);
    ctx.lineTo(pad.left, pad.top + plotH);
    ctx.lineTo(pad.left + plotW, pad.top + plotH);
    ctx.stroke();

    // axis labels
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

    // clip to plot area for series drawing
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
}
