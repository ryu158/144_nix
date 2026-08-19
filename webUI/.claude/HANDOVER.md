# HANDOVER

Current status only. Not history — daily detail in .claude/log/.

## Reality
Static HTML/JS, no build step. dev_basic/ = shared components + style.css (tokens in :root). src/shell/ = seo.js, consent.js, analytics.js. home.js = home page renderer.
nginx root IS the repo (/home/opc/nix/webUI). Edits go live on save. No deploy step.
Scope: work only inside webUI/.

## Open bug
None.

## topics/interpolation — done
6-step workflow complete. Renamed "Linear Interpolation" -> "Interpolation" (advanced page planned, concept still forming).
Files: interpolate_blog.html, interpolate_cal.html, interp_engine.js, page.js, spec.json, test_in_data.md, test_out_data.md, interpolation_style.css.

## Home page — data-driven
index.html renders rows from topics/topics.json -> each spec.json. JS in /home.js.
Row = name, toggle (insight), one button per level.
spec.json gained `name` (short, card) and `pages` (public URL per level).
New topic MUST be added to topics/topics.json or it stays invisible.

## SEO — done, live
Static <title>/meta description/og/twitter/JSON-LD in every page. Crawlers do not run JS.
seo.js syncs from spec.json, console.warns on drift. data-slug required.
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

## Not done
- MS Clarity (later, GA4 first)
- test_data.csv (orphaned, keep/delete undecided)
- 🪄Advanced button in interpolate_cal.html links to itself (placeholder, page not built)
- og:image / socialImage missing — social previews have no picture
- Files served from repo root are public (CLAUDE.md, .claude/, flake.nix). Known, accepted.

## Confirmed, don't touch
- Hardcoded nav/colors in interpolation pages - intentional, not a cleanup target
- Ko-fi widget - keep, exempted from monetization ban
- .teal-button-link has `margin: 25px -5px !important` - cancel it locally in compact rows, do not change the base rule

## Next
Advanced interpolation page (cubic/spline). Add "advanced" to spec.json levels + pages; home row grows the button by itself.
One topic at a time.
