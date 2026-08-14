# Project Plan

## Vision

A web project with two components:

1. **Tech blog** — writeups in the style of the interpolation work (explaining
   techniques, math, implementation notes). Not yet built.
2. **Practice** — pages for calculating real data. The interpolation
   calculator (`interp3/prj/interpolate/`) is the first prototype of this.

## Current state (as of 2026-08-14)

- The interpolation calculator prototype is built and working:
  `interp3/prj/interpolate/index_interpolate.html`, `interp_engine.js`,
  `page.js`. Linear interpolation, backed by a `GridTable` (spreadsheet-style
  input) and a `DualSeriesChart` (canvas chart), both from `dev_basic/`.
- Site is pure static HTML/CSS/JS, no framework, served by nginx pointed at
  `interp3/` as document root. Scripts use root-absolute paths
  (`/dev_basic/...`, `/prj/interpolate/...`).
- `dev_basic/` at the repo root is the canonical copy of shared components
  (chart, grid, ads, bmc). `prj/dev_basic/` is a stale duplicate — do not
  edit it.
- AdSense is live and configured (`ads.txt`). The Buy-Me-a-Coffee widget
  (`bmc.js`) still has placeholder IDs and is unfinished.

## Planned architecture changes

- A Python backend (Flask + NumPy + SciPy) is a real future plan, not just
  leftover flake.nix cruft — `flake.nix`'s devShell already provisions
  python3/flask/numpy/scipy plus nodejs/typescript for this. No `app.py`
  exists yet.
- The root-level `index.html` and `flake.nix` are currently byte-identical —
  a broken placeholder, not a real homepage. A real top-level entry point
  (linking the blog and practice sections) still needs to be built.

## Setup done in this session

Ran `/init` to set up:
- Project `CLAUDE.md` — architecture, code style, and known gotchas.
- Personal `CLAUDE.local.md` — sole-author, terse-communication preference.
- A hook warning against edits to `prj/dev_basic/`.
- A `/component-summary` skill for documenting new/changed JS components
  under `dev_basic/summary/`.
