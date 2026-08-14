# Project Summary

webUI is a static HTML/CSS/JS site (no framework, no build step), served by
nginx with document root at `interp3/`.

Long-term vision: a tech blog + a "practice" section of real-data
calculators.

The only working piece so far is the **Interpolation Calculator**
(`prj/interpolate/`) — a spreadsheet-style input grid, a canvas chart, and
linear interpolation logic, built on shared components in root `dev_basic/`
(grid.js, chart.js, dual-chart.js, ads.js, bmc.js).

Root `index.html` is a broken placeholder, not a real homepage yet.
`prj/dev_basic/` is a stale duplicate — never edit it, only root
`dev_basic/`. A Python (Flask + NumPy + SciPy) backend is planned but
doesn't exist yet — the site is static-only for now.

See `project_plan.md` for the fuller vision and planned architecture
changes.
