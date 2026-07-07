import os
from flask import Flask, request, jsonify, send_from_directory
import numpy as np
from scipy.interpolate import interp1d

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

app = Flask(__name__)

MIN_POINTS_REQUIRED = {"linear": 2, "quadratic": 3, "cubic": 4, "nearest": 1}


# Make sure ANY unhandled error returns JSON instead of an HTML error page,
# since the frontend always expects JSON back from /interpolate.
@app.errorhandler(404)
def handle_404(e):
    return jsonify({"error": f"Not found: {request.path}. Is the URL correct?"}), 404


@app.errorhandler(500)
def handle_500(e):
    return jsonify({"error": f"Server error: {e}"}), 500


# index.html uses plain relative paths ("style.css", "script.js",
# "interpolate.js") rather than Flask's url_for/static folder, so the exact
# same file works identically whether opened via file:// or served here --
# these routes just mirror that flat, sibling-file layout on the server side.
@app.route("/")
def index():
    return send_from_directory(BASE_DIR, "index.html")


@app.route("/style.css")
def style():
    return send_from_directory(BASE_DIR, "style.css")


@app.route("/script.js")
def script():
    return send_from_directory(BASE_DIR, "script.js")


@app.route("/interpolate.js")
def interpolate_js():
    return send_from_directory(BASE_DIR, "interpolate.js")


@app.route("/interpolate", methods=["POST"])
def interpolate():
    try:
        return do_interpolate()
    except Exception as e:
        # Catch-all safety net so the client never receives an HTML traceback page.
        return jsonify({"error": f"Unexpected server error: {e}"}), 500


def do_interpolate():
    data = request.get_json(force=True, silent=True)
    if data is None:
        return jsonify({"error": "Invalid or missing JSON body."}), 400

    errors = []

    # ---- Parse x ----
    raw_x = data.get("x", [])
    try:
        x = np.array([float(v) for v in raw_x], dtype=float)
    except (ValueError, TypeError):
        return jsonify({"error": "X values must all be numeric."}), 400

    if len(x) < 2:
        return jsonify({"error": "X must have at least 2 values."}), 400

    if len(np.unique(x)) != len(x):
        return jsonify({"error": "X values must be unique (no duplicates)."}), 400

    # ---- Parse y_series ----
    raw_series = data.get("y_series", [])
    if not raw_series:
        return jsonify({"error": "At least one Y series is required."}), 400

    parsed_series = []
    for i, s in enumerate(raw_series):
        label = s.get("label") or f"Series {i + 1}"
        raw_y = s.get("y", [])

        try:
            y = np.array([float(v) for v in raw_y], dtype=float)
        except (ValueError, TypeError):
            errors.append(f"Series '{label}' contains non-numeric values.")
            continue

        # Length mismatch check (detailed, collected not short-circuited)
        if len(y) != len(x):
            errors.append(
                f"Series '{label}' has {len(y)} values, expected {len(x)} (same as X)."
            )
            continue

        parsed_series.append({"label": label, "y": y})

    if errors:
        return jsonify({"error": "Length mismatch:\n- " + "\n- ".join(errors)}), 400

    # ---- Method validation ----
    method = data.get("method", "linear")
    if method not in MIN_POINTS_REQUIRED:
        return jsonify({
            "error": f"Unknown method '{method}'. Choose from: {', '.join(MIN_POINTS_REQUIRED)}."
        }), 400

    required_points = MIN_POINTS_REQUIRED[method]
    if len(x) < required_points:
        return jsonify({
            "error": f"'{method}' interpolation needs at least {required_points} X points, got {len(x)}."
        }), 400

    # ---- New X range validation ----
    try:
        new_x_start = float(data.get("new_x_start"))
        new_x_finish = float(data.get("new_x_finish"))
        new_x_interval = float(data.get("new_x_interval"))
    except (TypeError, ValueError):
        return jsonify({"error": "New X start/finish/interval must all be numeric."}), 400

    if new_x_interval <= 0:
        return jsonify({"error": "New X interval must be greater than 0."}), 400

    if new_x_start >= new_x_finish:
        return jsonify({"error": "New X start must be less than New X finish."}), 400

    x_min, x_max = float(x.min()), float(x.max())
    if new_x_start < x_min or new_x_finish > x_max:
        return jsonify({
            "error": (
                f"New X range [{new_x_start}, {new_x_finish}] must be within "
                f"the original X range [{x_min}, {x_max}]. Extrapolation is not allowed."
            )
        }), 400

    # ---- Sort by x (interp1d requires increasing x) ----
    order = np.argsort(x)
    x_sorted = x[order]
    for s in parsed_series:
        s["y"] = s["y"][order]

    # ---- Build new x axis ----
    x_new = np.arange(new_x_start, new_x_finish + new_x_interval / 2, new_x_interval)
    x_new = x_new[x_new <= new_x_finish + 1e-9]
    if len(x_new) == 0 or x_new[-1] < new_x_finish - 1e-9:
        x_new = np.append(x_new, new_x_finish)
    x_new[-1] = new_x_finish  # avoid float drift

    # ---- Interpolate each series ----
    result_series = []
    for s in parsed_series:
        try:
            f = interp1d(x_sorted, s["y"], kind=method)
            y_interp = f(x_new)
        except Exception as e:
            return jsonify({"error": f"Interpolation failed for series '{s['label']}': {e}"}), 400

        result_series.append({
            "label": s["label"],
            "y_original": s["y"].tolist(),
            "y_interp": y_interp.tolist(),
        })

    return jsonify({
        "x_original": x_sorted.tolist(),
        "x_new": x_new.tolist(),
        "series": result_series,
    })


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=40001, debug=False)
