"""
Interpolation methods for the advanced calculator.

Math only. No Flask import, no route, no port — app.py owns everything HTTP, so
these functions stay callable and testable without a server running.

The input cleaning here is deliberately identical to interp_engine.ts. The basic
page computes linear interpolation in the browser and this module computes it on
the server; where the two overlap they must agree, or the same table gives two
different answers depending on which page you opened.
"""
import math

import numpy as np
from scipy.interpolate import Akima1DInterpolator, CubicSpline, PchipInterpolator

# Rounding matches interp_engine.ts: 6 decimals on results, 9 on generated x
# values. The browser fixture tolerates 5.0e-7, which only holds if both sides
# round the same way.
RESULT_DIGITS = 6
RANGE_DIGITS = 9

# Minimum points each method needs before it can fit anything.
_MIN_POINTS = {'linear': 2, 'cubic': 4, 'pchip': 2, 'akima': 5}


def generate_range(x_min, x_max, interval):
    """Ascending query x values, endpoint INCLUDED.

    Mirrors InterpEngine.generateRange. np.arange is not used on purpose: it
    excludes the endpoint, so 0/1000/1 would give 1000 points where the basic
    page gives 1001, and the two pages would disagree at the last x.
    """
    try:
        x_min, x_max, interval = float(x_min), float(x_max), float(interval)
    except (TypeError, ValueError):
        return np.empty(0)
    if not all(math.isfinite(v) for v in (x_min, x_max, interval)):
        return np.empty(0)
    if interval <= 0 or x_max < x_min:
        return np.empty(0)

    # The epsilon is what keeps the last step: without it a range like
    # 0/1000/0.1 loses its endpoint to float error.
    steps = math.floor((x_max - x_min) / interval + 1e-9)
    return np.round(x_min + np.arange(steps + 1) * interval, RANGE_DIGITS)


def _series_points(table, col):
    """Sorted (x, y) for one y column, skipping anything unusable.

    Skipping is per series, not per row: a gap in column 2 must not drop the
    point from column 1.
    """
    xs, ys = [], []
    for row in table:
        if col >= len(row):
            continue
        try:
            x = float(row[0])
            y = float(row[col])
        except (TypeError, ValueError):
            continue
        if not (math.isfinite(x) and math.isfinite(y)):
            continue
        xs.append(x)
        ys.append(y)

    if not xs:
        return np.empty(0), np.empty(0)

    x_arr, y_arr = np.asarray(xs, float), np.asarray(ys, float)
    order = np.argsort(x_arr, kind='stable')  # pasted data is not assumed sorted
    return x_arr[order], y_arr[order]


def _dedupe(x, y):
    """Collapse repeated x values to their first y.

    Every scipy interpolator raises on a duplicate x. interp_engine.ts hits the
    same case in _interpAt and returns the first point's y, so this matches it
    rather than failing the request.
    """
    keep = np.concatenate(([True], np.diff(x) > 0))
    return x[keep], y[keep]


def _evaluate(method, x, y, query):
    """One series -> interpolated values, NaN outside the series' own domain."""
    if x.size < _MIN_POINTS[method]:
        # A series too thin for its method blanks out. One narrow column must
        # not fail the whole request.
        return np.full(query.shape, np.nan)

    if method == 'linear':
        # np.interp CLAMPS outside the domain and returns the edge value with no
        # signal. That would invent data past the last measured point, so the
        # outside is masked back to NaN explicitly.
        out = np.interp(query, x, y)
        return np.where((query < x[0]) | (query > x[-1]), np.nan, out)

    if method == 'cubic':
        return CubicSpline(x, y, extrapolate=False)(query)
    if method == 'pchip':
        return PchipInterpolator(x, y, extrapolate=False)(query)
    return Akima1DInterpolator(x, y)(query, extrapolate=False)


def interpolate(method, table, query):
    """Input table + query x's -> output table, both 2D lists of strings.

    Strings in and strings out is the GridTable.getData() contract, so the page
    needs no conversion layer in either direction.
    """
    n_cols = max((len(r) for r in table), default=0)
    series_count = max(0, n_cols - 1)

    columns = []
    for col in range(1, series_count + 1):
        x, y = _series_points(table, col)
        if x.size:
            x, y = _dedupe(x, y)
        columns.append(_evaluate(method, x, y, query))

    rows = []
    for i, q in enumerate(query):
        row = [_num(q, RANGE_DIGITS)]
        # Outside a series' domain the value is NaN, and NaN is written as an
        # empty cell - not 0, not "nan". Same contract as interp_engine.ts.
        row.extend('' if not math.isfinite(c[i]) else _num(c[i], RESULT_DIGITS)
                   for c in columns)
        rows.append(row)
    return rows


def _num(value, digits):
    """Round, then drop a trailing .0 so integers read as integers."""
    rounded = round(float(value), digits)
    return str(int(rounded)) if rounded == int(rounded) else repr(rounded)


# app.py builds one route per entry, so adding a method here is the only edit
# a new method needs.
METHODS = {
    'linear': lambda table, query: interpolate('linear', table, query),
    'cubic': lambda table, query: interpolate('cubic', table, query),
    'pchip': lambda table, query: interpolate('pchip', table, query),
    'akima': lambda table, query: interpolate('akima', table, query),
}
