/**
 * interp.js
 * Dependency-free linear interpolation helper for the Interpolate Calculator page.
 * Reads Input-shaped data2d (X in col 0, Y in col 1..N) and a set of query X's,
 * returns an Output-shaped data2d in the same GridTable.getData() contract.
 * Additive utility — grid.js / chart.js / dual-chart.js remain untouched.
 */
const InterpEngine = {
  // Sorted {x,y} points for one series column (1-based) from a grid2d table.
  _seriesPoints(data2d, colIndex) {
    const pts = [];
    for (const row of data2d) {
      if (!row) continue;
      const xRaw = row[0], yRaw = row[colIndex];
      if (xRaw === undefined || xRaw === '' || xRaw === null) continue;
      if (yRaw === undefined || yRaw === '' || yRaw === null) continue;
      const x = Number(xRaw), y = Number(yRaw);
      if (Number.isNaN(x) || Number.isNaN(y)) continue;
      pts.push({ x, y });
    }
    pts.sort((a, b) => a.x - b.x);
    return pts;
  },

  // Linear-interpolate y at xQuery. Returns null outside the known domain
  // (no extrapolation) — caller writes that as a blank cell.
  _interpAt(points, xQuery) {
    if (points.length === 0) return null;
    if (xQuery < points[0].x || xQuery > points[points.length - 1].x) return null;
    let lo = 0, hi = points.length - 1;
    while (hi - lo > 1) {
      const mid = (lo + hi) >> 1;
      if (points[mid].x <= xQuery) lo = mid; else hi = mid;
    }
    const p1 = points[lo], p2 = points[hi];
    if (p2.x === p1.x) return p1.y;
    const t = (xQuery - p1.x) / (p2.x - p1.x);
    return p1.y + t * (p2.y - p1.y);
  },

  _round(v, digits = 6) {
    const f = Math.pow(10, digits);
    return Math.round(v * f) / f;
  },

  // Public: Input data2d + query X's -> Output data2d (one Y col per Input Y series).
  buildOutputTable(inputData2d, queryXs) {
    const numCols = Math.max(0, ...inputData2d.map(r => r?.length || 0));
    const seriesCount = Math.max(0, numCols - 1);
    const seriesPoints = [];
    for (let s = 1; s <= seriesCount; s++) seriesPoints.push(this._seriesPoints(inputData2d, s));

    return queryXs.map(x => {
      const row = [String(x)];
      for (let s = 0; s < seriesCount; s++) {
        const y = this._interpAt(seriesPoints[s], x);
        row.push(y === null ? '' : String(this._round(y)));
      }
      return row;
    });
  },
};
