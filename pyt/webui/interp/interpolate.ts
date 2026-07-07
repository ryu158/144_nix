// Client-side interpolation engine, written to mirror the Python/SciPy
// backend's request/response shape and validation rules, so the same
// renderChart() function on the page can consume either one interchangeably.
//
// Caveat: "quadratic" and "cubic" here are hand-rolled splines (natural
// cubic spline / a simple C1 quadratic spline), not SciPy's B-spline based
// interp1d. Results will be close but not bit-identical to the Python
// backend, especially near the edges of the data range.

namespace Interp {

  export type Method = "linear" | "quadratic" | "cubic" | "nearest";

  export interface YSeriesInput {
    label: string;
    y: number[];
  }

  export interface InterpolateRequest {
    x: number[];
    y_series: YSeriesInput[];
    method: Method;
    new_x_start: number;
    new_x_finish: number;
    new_x_interval: number;
  }

  export interface SeriesResult {
    label: string;
    y_original: number[];
    y_interp: number[];
  }

  export interface InterpolateResponse {
    x_original: number[];
    x_new: number[];
    series: SeriesResult[];
  }

  export interface ErrorResponse {
    error: string;
  }

  const MIN_POINTS_REQUIRED: Record<Method, number> = {
    linear: 2,
    quadratic: 3,
    cubic: 4,
    nearest: 1,
  };

  // ---------- Public entry point ----------

  export function run(req: InterpolateRequest): InterpolateResponse | ErrorResponse {
    const errors: string[] = [];

    const x = req.x.slice();
    if (x.length < 2) {
      return { error: "X must have at least 2 values." };
    }
    if (new Set(x).size !== x.length) {
      return { error: "X values must be unique (no duplicates)." };
    }

    if (!req.y_series || req.y_series.length === 0) {
      return { error: "At least one Y series is required." };
    }

    req.y_series.forEach((s) => {
      if (s.y.length !== x.length) {
        errors.push(
          `Series '${s.label}' has ${s.y.length} values, expected ${x.length} (same as X).`
        );
      }
    });
    if (errors.length > 0) {
      return { error: "Length mismatch:\n- " + errors.join("\n- ") };
    }

    const method = req.method;
    if (!(method in MIN_POINTS_REQUIRED)) {
      return { error: `Unknown method '${method}'.` };
    }
    const required = MIN_POINTS_REQUIRED[method];
    if (x.length < required) {
      return {
        error: `'${method}' interpolation needs at least ${required} X points, got ${x.length}.`,
      };
    }

    if (!(req.new_x_interval > 0)) {
      return { error: "New X interval must be greater than 0." };
    }
    if (!(req.new_x_start < req.new_x_finish)) {
      return { error: "New X start must be less than New X finish." };
    }

    const xMin = Math.min(...x);
    const xMax = Math.max(...x);
    if (req.new_x_start < xMin || req.new_x_finish > xMax) {
      return {
        error:
          `New X range [${req.new_x_start}, ${req.new_x_finish}] must be within ` +
          `the original X range [${xMin}, ${xMax}]. Extrapolation is not allowed.`,
      };
    }

    // ---- sort by x ----
    const order = x.map((_, i) => i).sort((a, b) => x[a] - x[b]);
    const xSorted = order.map((i) => x[i]);

    // ---- build new x axis ----
    const xNew = buildRange(req.new_x_start, req.new_x_finish, req.new_x_interval);

    // ---- interpolate each series ----
    const series: SeriesResult[] = req.y_series.map((s) => {
      const ySorted = order.map((i) => s.y[i]);
      const yInterp = interpolateSeries(xSorted, ySorted, xNew, method);
      return { label: s.label, y_original: ySorted, y_interp: yInterp };
    });

    return { x_original: xSorted, x_new: xNew, series };
  }

  // ---------- Range construction (mirrors np.arange + clamp used server-side) ----------

  function buildRange(start: number, finish: number, interval: number): number[] {
    const out: number[] = [];
    const n = Math.floor((finish - start) / interval + 1e-9);
    for (let i = 0; i <= n; i++) {
      out.push(start + i * interval);
    }
    if (out.length === 0 || out[out.length - 1] < finish - 1e-9) {
      out.push(finish);
    }
    out[out.length - 1] = finish; // avoid float drift
    return out;
  }

  // ---------- Dispatch ----------

  function interpolateSeries(
    xs: number[],
    ys: number[],
    xq: number[],
    method: Method
  ): number[] {
    switch (method) {
      case "linear":
        return xq.map((q) => linearAt(xs, ys, q));
      case "nearest":
        return xq.map((q) => nearestAt(xs, ys, q));
      case "quadratic":
        return quadraticSplineEval(xs, ys, xq);
      case "cubic":
        return naturalCubicSplineEval(xs, ys, xq);
    }
  }

  // ---------- Linear ----------

  function findSegment(xs: number[], q: number): number {
    // returns i such that xs[i] <= q <= xs[i+1]
    let i = 0;
    while (i < xs.length - 2 && q > xs[i + 1]) i++;
    return i;
  }

  function linearAt(xs: number[], ys: number[], q: number): number {
    const i = findSegment(xs, q);
    const t = (q - xs[i]) / (xs[i + 1] - xs[i]);
    return ys[i] + t * (ys[i + 1] - ys[i]);
  }

  // ---------- Nearest ----------

  function nearestAt(xs: number[], ys: number[], q: number): number {
    let bestIdx = 0;
    let bestDist = Infinity;
    for (let i = 0; i < xs.length; i++) {
      const d = Math.abs(xs[i] - q);
      if (d < bestDist) {
        bestDist = d;
        bestIdx = i;
      }
    }
    return ys[bestIdx];
  }

  // ---------- Natural cubic spline ----------
  // Standard textbook algorithm (Burden & Faires): tridiagonal solve for
  // second-derivative coefficients, natural boundary conditions (c[0] = c[n-1] = 0).

  interface CubicCoeffs {
    a: number[];
    b: number[];
    c: number[];
    d: number[];
  }

  function naturalCubicSplineCoeffs(xs: number[], ys: number[]): CubicCoeffs {
    const n = xs.length;
    const h: number[] = [];
    for (let i = 0; i < n - 1; i++) h.push(xs[i + 1] - xs[i]);

    const alpha: number[] = new Array(n).fill(0);
    for (let i = 1; i < n - 1; i++) {
      alpha[i] =
        (3 / h[i]) * (ys[i + 1] - ys[i]) - (3 / h[i - 1]) * (ys[i] - ys[i - 1]);
    }

    const l: number[] = new Array(n).fill(0);
    const mu: number[] = new Array(n).fill(0);
    const z: number[] = new Array(n).fill(0);
    l[0] = 1;

    for (let i = 1; i < n - 1; i++) {
      l[i] = 2 * (xs[i + 1] - xs[i - 1]) - h[i - 1] * mu[i - 1];
      mu[i] = h[i] / l[i];
      z[i] = (alpha[i] - h[i - 1] * z[i - 1]) / l[i];
    }
    l[n - 1] = 1;
    z[n - 1] = 0;

    const c: number[] = new Array(n).fill(0);
    const b: number[] = new Array(n - 1).fill(0);
    const d: number[] = new Array(n - 1).fill(0);
    const a: number[] = ys.slice(0, n - 1);

    for (let j = n - 2; j >= 0; j--) {
      c[j] = z[j] - mu[j] * c[j + 1];
      b[j] = (ys[j + 1] - ys[j]) / h[j] - (h[j] * (c[j + 1] + 2 * c[j])) / 3;
      d[j] = (c[j + 1] - c[j]) / (3 * h[j]);
    }

    return { a, b, c, d };
  }

  function naturalCubicSplineEval(xs: number[], ys: number[], xq: number[]): number[] {
    const { a, b, c, d } = naturalCubicSplineCoeffs(xs, ys);
    return xq.map((q) => {
      const i = findSegment(xs, q);
      const dx = q - xs[i];
      return a[i] + b[i] * dx + c[i] * dx * dx + d[i] * dx * dx * dx;
    });
  }

  // ---------- Quadratic spline ----------
  // C1-continuous piecewise quadratic. Initial derivative z0 is seeded from
  // the first segment's average slope, then propagated forward so each
  // segment's derivative matches its neighbor at the shared knot.

  interface QuadCoeffs {
    a: number[];
    b: number[];
    c: number[];
  }

  function quadraticSplineCoeffs(xs: number[], ys: number[]): QuadCoeffs {
    const n = xs.length;
    const a: number[] = ys.slice(0, n - 1);
    const b: number[] = new Array(n - 1).fill(0);
    const c: number[] = new Array(n - 1).fill(0);

    let z = (ys[1] - ys[0]) / (xs[1] - xs[0]); // seed derivative at x0

    for (let i = 0; i < n - 1; i++) {
      const h = xs[i + 1] - xs[i];
      const ci = (ys[i + 1] - ys[i] - z * h) / (h * h);
      b[i] = z;
      c[i] = ci;
      z = z + 2 * ci * h; // derivative continuity into next segment
    }

    return { a, b, c };
  }

  function quadraticSplineEval(xs: number[], ys: number[], xq: number[]): number[] {
    const { a, b, c } = quadraticSplineCoeffs(xs, ys);
    return xq.map((q) => {
      const i = findSegment(xs, q);
      const dx = q - xs[i];
      return a[i] + b[i] * dx + c[i] * dx * dx;
    });
  }
}
