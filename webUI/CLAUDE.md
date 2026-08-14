# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Architecture

Static HTML/CSS/JS site, served by nginx with document root pointed at
`interp3/`. No build step, no bundler, no framework — vanilla JS only.

- `dev_basic/` — canonical shared components (`chart.js`, `dual-chart.js`,
  `grid.js`, `ads.js`, `bmc.js`, `style.css`). **`prj/dev_basic/` is a stale
  duplicate — always edit the root `dev_basic/`, never `prj/dev_basic/`.**
- `prj/interpolate/` — the interpolation calculator (`interp_engine.js`,
  `page.js`, `index_interpolate.html`). Linear interpolation only.
- `prj/test/` — an earlier standalone prototype (Chart.js via CDN, inline TS
  namespace, supports quadratic/cubic/nearest interpolation too). Not part
  of the main grid/chart pipeline.
- Root `index.html` is currently a broken placeholder (byte-identical to
  `flake.nix`), not a real homepage.

See `project_plan.md` (repo root, one level up) for the overall project
vision — a tech blog + a "practice" (real-data calculation) section, of
which this interpolation calculator is the first prototype.

A Python backend (Flask + NumPy + SciPy) is a planned future addition — the
Nix devShell already provisions it — but no `app.py` exists yet, so treat
the site as static-only until that lands.

## Script paths

Scripts and stylesheets must use root-absolute paths (`/dev_basic/chart.js`,
`/prj/interpolate/interp_engine.js`), not relative paths — nginx serves
`interp3/` as the document root, and relative paths break depending on
whether the route has a trailing slash.

## Code style

- Object-literal modules (`const Foo = { method() {...} }`), not ES
  classes or `import`/`export`.
- 2-space indentation, camelCase, `_`-prefixed "private" methods.
- JSDoc-style block comments on public methods.
- Fix additively first (add new functions alongside old ones), then delete
  superseded code once the new path is confirmed working.

## Known gotcha

JS object literals here define methods positionally — if the same method
name is assigned twice on one object, the last one silently wins. Before
debugging "wrong" behavior in `chart.js`/`grid.js`/etc., grep for duplicate
method definitions on the object first.

## Local dev

Preview via nginx pointed at `interp3/` (not `python -m http.server` or
opening files directly — relative-vs-absolute path behavior differs).

## Other

- No lint/format/test tooling exists (no eslint, prettier, or test
  framework) — none is expected for now.
- `dev_basic/summary/*.md` documents each shared component (`chart.md`,
  `grid.md`, etc.) — follow this format when adding new components (see the
  `/component-summary` skill).
- Commit messages are terse, incrementing counters (e.g.
  `webUI_interpolate, 20`) — no conventional-commits prefix expected.
