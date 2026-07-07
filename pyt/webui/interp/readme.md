# Data Interpolation Tool

A small web app: paste or type X/Y data (Excel-paste supported), pick an
interpolation method, and see the original points plus the interpolated
curve on a chart — for one or more Y series sharing the same X axis.

## Project structure

```
interp_project/
├── app.py               # Flask server: serves the flat files below + /interpolate API
├── index.html            # Markup only, plain relative paths (no templating)
├── style.css              # All styling
├── script.js              # Page logic: grid, paste, validation, fetch, chart
├── interpolate.js         # Compiled client-side interpolation engine
├── requirements.txt
├── flake.nix               # Nix flake dev shell (Python + Node/TypeScript)
└── ts/
    ├── interpolate.ts      # Source for the client-side engine
    └── tsconfig.json
```

UI, logic, and style are separated into their own files (`index.html`,
`script.js`, `style.css`), same as before — but the directory is now flat and
`index.html` references the others with **plain relative paths**
(`href="style.css"`, `src="script.js"`, `src="interpolate.js"`) instead of
Flask's `{{ url_for(...) }}` templating.

This means the exact same `index.html` renders identically two ways:

1. **Double-click `index.html` directly** (`file://`) — no server needed at all.
   All relative paths resolve against sibling files in the same folder.
2. **`python app.py`, open `http://localhost:40001`** — Flask serves each file
   from explicit routes (`/`, `/style.css`, `/script.js`, `/interpolate.js`)
   that mirror the same flat layout, so the relative paths resolve the same way.

Both were verified to produce byte-identical DOM output (same input cells,
same computed styles) in this project.

> Earlier versions used Jinja's `{{ url_for('static', filename=...) }}`, which
> only resolves when Flask actually renders the page. Opened directly via
> `file://`, that placeholder is left as literal text, so the browser can't
> find the CSS/JS — the page loads but looks broken (e.g. an empty grid with
> no input cells, since those are added by JavaScript that never loaded).
> The flat/plain-relative-path structure above avoids that entirely.

## Setup

    pip install -r requirements.txt

## Run

    python app.py

Then open http://localhost:40001 — or just double-click `index.html` directly,
no server required.

## Using Nix flakes (non-NixOS, e.g. Oracle Linux 9)

Assumes you already have the Nix package manager with flakes enabled.

    nix develop        # drops into a shell with python3 (+ flask/numpy/scipy) and node/typescript
    python app.py
    # or
    nix run             # runs app.py directly, one shot

First run will generate a `flake.lock` — commit it alongside `flake.nix`.

## Usage

- First column of the grid is X, additional columns are Y series (add more with "+ Col").
- Paste directly from Excel: select a range, copy, click a starting cell here, paste.
- "New X start / finish / interval" define the output x-axis. Must stay within the
  original X range — extrapolation is rejected with an error.
- Pick a method (linear / quadratic / cubic / nearest) and click "Run Interpolation".

## Two interpolation engines, switchable at runtime

A checkbox — **"Compute in browser (TypeScript) — no server"** — next to Run:

- **Unchecked (default)**: posts to Flask's `/interpolate`, computed in Python via
  SciPy's `interp1d`. Requires `python app.py` to be running.
- **Checked**: computed entirely client-side by `interpolate.js`
  (compiled from `ts/interpolate.ts`), no network call for that run — works even
  when `index.html` is opened directly via `file://` with no server at all.

Both paths validate the same rules (unique X, matching lengths, method minimum
points, no extrapolation) and return the same response shape, so the chart
renders identically either way.

`linear` and `nearest` are numerically identical between the two engines.
`quadratic` and `cubic` will be close but **not bit-identical** — the Python side
uses SciPy's B-spline-based `interp1d`, the TypeScript side uses a natural cubic
spline and a simple C1 quadratic spline. Differences are most visible near the
edges of the X range.

### Rebuilding the TypeScript engine after edits

    cd ts
    tsc -p tsconfig.json

This regenerates `../interpolate.js` (project root). `index.html` loads it
directly via a relative path — no bundler needed.

## Error handling

`/interpolate` always returns JSON, including for unexpected server errors and
404s (wrapped by Flask error handlers), and the frontend checks the response's
`content-type` before parsing — so a misconfigured request shows a clear error
message instead of a cryptic "not valid JSON" failure.

## Length-mismatch validation

Both the browser (before sending) and the server (authoritative) check every
Y series against the X array length and report **all** mismatches at once,
distinguishing:
- a series with fewer values than X (trailing gap)
- a series with more values than X (extra values)
- a series with a gap in the middle (missing a value between filled cells)

No auto-padding or truncating — mismatches are always a hard error.
