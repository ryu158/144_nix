"use strict";
var Interp;
(function (Interp) {
    const MIN_POINTS_REQUIRED = {
        linear: 2,
        quadratic: 3,
        cubic: 4,
        nearest: 1,
    };
    function run(req) {
        const errors = [];
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
                errors.push(`Series '${s.label}' has ${s.y.length} values, expected ${x.length} (same as X).`);
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
                error: `New X range [${req.new_x_start}, ${req.new_x_finish}] must be within ` +
                    `the original X range [${xMin}, ${xMax}]. Extrapolation is not allowed.`,
            };
        }
        const order = x.map((_, i) => i).sort((a, b) => x[a] - x[b]);
        const xSorted = order.map((i) => x[i]);
        const xNew = buildRange(req.new_x_start, req.new_x_finish, req.new_x_interval);
        const series = req.y_series.map((s) => {
            const ySorted = order.map((i) => s.y[i]);
            const yInterp = interpolateSeries(xSorted, ySorted, xNew, method);
            return { label: s.label, y_original: ySorted, y_interp: yInterp };
        });
        return { x_original: xSorted, x_new: xNew, series };
    }
    Interp.run = run;
    function buildRange(start, finish, interval) {
        const out = [];
        const n = Math.floor((finish - start) / interval + 1e-9);
        for (let i = 0; i <= n; i++) {
            out.push(start + i * interval);
        }
        if (out.length === 0 || out[out.length - 1] < finish - 1e-9) {
            out.push(finish);
        }
        out[out.length - 1] = finish;
        return out;
    }
    function interpolateSeries(xs, ys, xq, method) {
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
    function findSegment(xs, q) {
        let i = 0;
        while (i < xs.length - 2 && q > xs[i + 1])
            i++;
        return i;
    }
    function linearAt(xs, ys, q) {
        const i = findSegment(xs, q);
        const t = (q - xs[i]) / (xs[i + 1] - xs[i]);
        return ys[i] + t * (ys[i + 1] - ys[i]);
    }
    function nearestAt(xs, ys, q) {
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
    function naturalCubicSplineCoeffs(xs, ys) {
        const n = xs.length;
        const h = [];
        for (let i = 0; i < n - 1; i++)
            h.push(xs[i + 1] - xs[i]);
        const alpha = new Array(n).fill(0);
        for (let i = 1; i < n - 1; i++) {
            alpha[i] =
                (3 / h[i]) * (ys[i + 1] - ys[i]) - (3 / h[i - 1]) * (ys[i] - ys[i - 1]);
        }
        const l = new Array(n).fill(0);
        const mu = new Array(n).fill(0);
        const z = new Array(n).fill(0);
        l[0] = 1;
        for (let i = 1; i < n - 1; i++) {
            l[i] = 2 * (xs[i + 1] - xs[i - 1]) - h[i - 1] * mu[i - 1];
            mu[i] = h[i] / l[i];
            z[i] = (alpha[i] - h[i - 1] * z[i - 1]) / l[i];
        }
        l[n - 1] = 1;
        z[n - 1] = 0;
        const c = new Array(n).fill(0);
        const b = new Array(n - 1).fill(0);
        const d = new Array(n - 1).fill(0);
        const a = ys.slice(0, n - 1);
        for (let j = n - 2; j >= 0; j--) {
            c[j] = z[j] - mu[j] * c[j + 1];
            b[j] = (ys[j + 1] - ys[j]) / h[j] - (h[j] * (c[j + 1] + 2 * c[j])) / 3;
            d[j] = (c[j + 1] - c[j]) / (3 * h[j]);
        }
        return { a, b, c, d };
    }
    function naturalCubicSplineEval(xs, ys, xq) {
        const { a, b, c, d } = naturalCubicSplineCoeffs(xs, ys);
        return xq.map((q) => {
            const i = findSegment(xs, q);
            const dx = q - xs[i];
            return a[i] + b[i] * dx + c[i] * dx * dx + d[i] * dx * dx * dx;
        });
    }
    function quadraticSplineCoeffs(xs, ys) {
        const n = xs.length;
        const a = ys.slice(0, n - 1);
        const b = new Array(n - 1).fill(0);
        const c = new Array(n - 1).fill(0);
        let z = (ys[1] - ys[0]) / (xs[1] - xs[0]);
        for (let i = 0; i < n - 1; i++) {
            const h = xs[i + 1] - xs[i];
            const ci = (ys[i + 1] - ys[i] - z * h) / (h * h);
            b[i] = z;
            c[i] = ci;
            z = z + 2 * ci * h;
        }
        return { a, b, c };
    }
    function quadraticSplineEval(xs, ys, xq) {
        const { a, b, c } = quadraticSplineCoeffs(xs, ys);
        return xq.map((q) => {
            const i = findSegment(xs, q);
            const dx = q - xs[i];
            return a[i] + b[i] * dx + c[i] * dx * dx;
        });
    }
})(Interp || (Interp = {}));
