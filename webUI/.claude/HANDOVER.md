# HANDOVER

Current status only. Not history — daily detail in .claude/log/.

## Reality
Static HTML. Scripts are TypeScript — source .ts, served .js, built by `tsc -p tsconfig.json`. Never edit a .js.
dev_basic/ = shared components + style.css (tokens in :root). src/shell/ = seo.ts, consent.ts, analytics.ts. home.ts = home page renderer.
nginx root IS the repo (/home/opc/nix/webUI). Build goes live on write. No deploy step, so generated .js/.js.map are committed.
Scope: work only inside webUI/.

## Claude config — cleaned 2026-08-20
CLAUDE.md = repo-wide rules. .claude/rules/topics.md = topic detail (spec.json shape, SEO head block, validate order). .claude/skills/new-topic/SKILL.md = 6-step checklist.
Each fact lives in ONE of those. Adding a rule? Pick the owner, do not copy it into a second file.
No hooks, no settings.json — the old hook guarded prj/, deleted 2026-08-14. component-summary skill deleted, its dev_basic/summary/ never existed.
Claude.local.md untracked 2026-08-20 (.gitignore had wrong case). Still in old git history.

## Open bug
None.

## topics/interpolation — done
6-step workflow complete. Renamed "Linear Interpolation" -> "Interpolation" (advanced page planned, concept still forming).
Files: interpolate_blog.html, interpolate_cal.html, interp_engine.ts, page.ts, spec.json, test_in_data.md, test_out_data.md, interpolation_style.css.

## Home page — data-driven
index.html renders rows from topics/topics.json -> each spec.json. Source in /home.ts.
Row = name, toggle (insight), one button per level.
spec.json gained `name` (short, card) and `pages` (public URL per level).
New topic MUST be added to topics/topics.json or it stays invisible.

## SEO — done, live
Static <title>/meta description/og/twitter/JSON-LD in every page. Crawlers do not run JS.
seo.ts syncs from spec.json, console.warns on drift. data-slug required.
robots.txt + sitemap.xml at root. Internal links use public urls (/interpolate_cal), never /topics/*.html.
Validate with curl, NOT DevTools — DevTools shows post-JS DOM and hides a missing title.

## nginx — fixed, reloaded, verified
webUI/nginx.conf is the master copy; deployed to ~/nix/nginx/configs/nginx.conf.
Fixed: soft-404 (`=404`), /interpolate_* exact match, /test path (was /prj/..., served homepage), /dev_basic missing semicolon. Also denies *.conf.
Verified: junk urls 404, /test serves the test page, real pages 200.

## Search Console
Ownership verified — meta tag in index.html. DO NOT REMOVE, removing un-verifies.
Sitemap submitted ("Couldn't fetch" right after submit is normal, clears in ~2 days).
Indexing requested: homepage only. Daily quota hit.
TODO next session: request indexing for /interpolate_cal and /interpolate_blog.
Then wait 1-2 weeks before judging search results.

## TypeScript — migrated 2026-08-21
Every site script is .ts now. `tsc -p tsconfig.json`, strict, target ES2020.
No imports/exports anywhere: each file is a classic script, classes (GridTable, Chart, DualSeriesChart, InterpEngine) are globals. Adding an import would break the <script src> tags.
Shared/browser types in types/globals.d.ts (Window.trackEvent, CssSize, Grid2D, GridSource, Spec). Reuse them, do not redeclare.
Source maps on and publicly served — decided, .ts source is web-readable. Same accepted category as CLAUDE.md/flake.nix.

## Browser tests — Playwright, added 2026-08-21
`run-browser-tests` from webUI/ (flake script; re-enter `nix develop` if the command is missing). Or `npx playwright test`.
Uses the Nix chromium via PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH — PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1, a download would write outside webUI/.
Tests hit the real served site (baseURL https://localhost, self-signed cert ignored). No webServer block — nginx root IS the repo.
node_modules/ is gitignored; package.json + package-lock.json are committed. `npm ci` to restore.

34 specs, ~8s. `tests/helpers/` + `tests/interpolation/{calculator,fixture,seo,nav,analytics}.spec.ts`.
- calculator — load, generate-range, re-interpolate on input change, no extrapolation, invalid ranges, read-only output grid, 4-column truncation alert, method list vs spec.json.
- fixture — the CLAUDE.md hard rule, in-browser. Pastes test_in_data.md, copies the output back, compares every cell to an independent implementation. 1770 cells, max error 5.0e-7.
- seo — raw HTML (crawler view) and rendered, both levels, asserted against spec.json. Zero `[seo]` drift warnings. Plus sitemap and robots.
- nav — cross-links, home card from spec.json, public-URL-only rule, raw HTML canonical, 404s.
- analytics — consent granted/denied/undecided, `interpolate_run` and `topic_detail_open`, no page-level tags.

Rules the suite depends on. Break these and tests fail for the wrong reason:
- page.ts keeps grid/chart private, so tests drive the UI (paste/copy events, DOM cells), never internals. Keep it that way.
- Third parties are stubbed with `route.fulfill`, never `abort` — both pages call `kofiwidget2.init(...)` inline, and an aborted script leaves that throwing.
- Assertions read spec.json. Never copy a string from the HTML into a test; that is what the drift check exists to catch.
- The grid is virtualized — off-screen rows have no DOM node. Read bulk data with `copyFromGrid`, not cell locators.

## Not done
- MS Clarity (later, GA4 first)
- test_data.csv (orphaned, keep/delete undecided)
- 🪄Advanced button in interpolate_cal.html links to itself (placeholder, page not built)
- og:image / socialImage missing — social previews have no picture
- /favicon.ico missing — 404 on every page, browser tabs blank. Found 2026-08-21 by the Playwright console check, which now ignores it.
- Files served from repo root are public (CLAUDE.md, .claude/, flake.nix, Claude.local.md). Known, accepted. nginx.conf denies *.conf only.

## Confirmed, don't touch
- Hardcoded nav/colors in interpolation pages - intentional, not a cleanup target
- Ko-fi widget - keep, exempted from monetization ban
- .teal-button-link has `margin: 25px -5px !important` - cancel it locally in compact rows, do not change the base rule

## Next
Advanced interpolation page (cubic/spline). Add "advanced" to spec.json levels + pages; home row grows the button by itself.
One topic at a time.
