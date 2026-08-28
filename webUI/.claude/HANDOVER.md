# HANDOVER

Current status only. Not history — daily detail in .claude/log/.

## Resume here
1. Config reform is done and committed. Branch `docs/reform-claude-config`, commit f315b4c, 8 files.
2. NOT merged. Merge it first:
```
git switch main && git merge docs/reform-claude-config
```
3. Then pick up ## Next at the bottom of this file.
4. Left stale on purpose: log/2026-08-21.md:51 says the favicon gap is in future_work.md. It is in HANDOVER only now. Logs are history, not corrected.
5. git identity is auto-detected as opc@a1-ryu...oraclevcn.com. Set user.email if the real address matters.

## Fact ownership
1. CLAUDE.md = repo-wide rules.
2. .claude/rules/topics.md = topic detail.
3. .claude/rules/visuals.md = chart colors and line styles.
4. .claude/rules/tests.md = rules the Playwright suite depends on.
5. .claude/skills/new-topic/SKILL.md = 6-step checklist.
6. .claude/refs/ = outside knowledge, summarised. Not rules.
7. Each fact lives in ONE file. Adding a rule? Pick the owner, never copy into a second file.

## topics/interpolation — done
1. 6-step workflow complete.
2. Renamed "Linear Interpolation" -> "Interpolation". Advanced page planned, concept still forming.

## SEO — done, live
1. Method + gap list -> .claude/refs/SEO_ref.md (4 talks, summarised).
2. Biggest gap is NOT on-page: this site has zero distribution.
3. Nothing has ever been posted where computational-math readers gather.
4. One source puts content+links at 74% of ranking weight, technical work at the tail.
5. Both its case studies won by shipping something usable, not longer prose.
6. This site IS a working tool. That asset is invisible today.

## Search Console
1. Ownership verified by meta tag in index.html. DO NOT REMOVE — removing un-verifies.
2. Sitemap submitted. "Couldn't fetch" right after submit is normal, clears in ~2 days.
3. Indexing requested: homepage only. Daily quota hit.
4. TODO next session: request indexing for /interpolate_cal and /interpolate_blog.
5. Then wait 1-2 weeks before judging search results.

## nginx
1. webUI/nginx.conf is the master copy.
2. Deployed to ~/nix/nginx/configs/nginx.conf.
3. It denies *.conf only.

## TypeScript — migrated 2026-08-21
1. Strict, target ES2020.
2. Globals are GridTable, Chart, DualSeriesChart, InterpEngine. An import would break the <script src> tags.
3. Shared types in types/globals.d.ts: Window.trackEvent, CssSize, Grid2D, GridSource, Spec. Reuse them, never redeclare.
4. Source maps on and publicly served — decided. .ts source is web-readable, same accepted category as CLAUDE.md and flake.nix.

## Browser tests — Playwright, added 2026-08-21
1. Run from webUI/:
```
run-browser-tests          # or: npx playwright test  /  nix run .#browser-test
```
2. It is in devShells packages. Missing command = stale shell, exit and re-enter nix develop.
3. run-interp-app is NOT in the shell on purpose — it interpolates ${self}, which copies the repo into the store on every shell start.
4. Flask app instead:
```
nix run .
```
5. Uses the Nix chromium via PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH.
6. PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 — a download would write outside webUI/.
7. Tests hit the real served site, baseURL https://localhost, self-signed cert ignored.
8. No webServer block — nginx root IS the repo.
9. node_modules/ is gitignored. package.json + package-lock.json are committed. Restore with npm ci.
10. Fixture spec runs the CLAUDE.md hard rule in a real browser — pastes test_in_data.md, copies the output grid back, compares all 1770 cells to an independent implementation. Max error 5.0e-7.
11. Suite rules -> .claude/rules/tests.md.

## flake.nix — two nixpkgs inputs, deliberate
1. nixpkgs = nixos-24.05: Node 20.18.1, TS 5.4.5, chromium 131, ffmpeg 6.1.2, Python.
2. nixpkgs-unstable = yt-dlp ONLY.
3. 24.05 ships yt-dlp 2024.12.06. YouTube rejects it outright.
4. Do NOT collapse back into one input. Do NOT move other packages across.
5. YouTube broken again, bump that input only:
```
nix flake update nixpkgs-unstable
```
6. ffmpeg stays on 24.05 on purpose — subtitle extraction never calls it.

## yt-dlp — blocked on login
1. 2026-08-21: bumped to yt-dlp 2026.07.04.
2. Still "Sign in to confirm you're not a bot" on https://youtu.be/eTBFhU0prqE, every player client.
3. Not a version problem any more. YouTube wants a signed-in session for this endpoint.
4. Unblocking needs --cookies cookies.txt from a logged-in browser, or --cookies-from-browser.
5. This box is headless with no YouTube session. User's call — do not go rummaging in ~/.config/chromium.
6. Downloads go to the scratchpad, NEVER into webUI/. nginx serves the repo root, so a file dropped here is instantly public.

## Not done
1. 🪄Advanced button in interpolate_cal.html links to itself. Placeholder, page not built.
2. og:image / socialImage missing — social previews have no picture.
3. /favicon.ico missing — 404 on every page, browser tabs blank. Found 2026-08-21 by the Playwright console check, which now ignores it.
4. Fixing it needs an icon decision first — the site has no logo. Then a static file plus <link rel="icon">. Small, not urgent.
5. interpolate_blog.html has TWO <h1>: "Interpolation❓" header + "Linear Interpolation" article. One H1 only.
6. interpolate_cal.html headings are Input / Output / Results — zero keywords.
7. interpolate_cal.html body is one paragraph. Short content does not rank.
8. Mobile friendliness never scored. Cal page is a full-height 3-panel grid with body { overflow: hidden }.
9. No SERP rank monitoring at all.
10. /interpolate_cal URL abbreviates "calculator". Crawler reads the URL. Changing it costs a redirect + sitemap + canonical.
11. test_data.csv orphaned. Keep or delete undecided.
12. Files served from repo root are public: CLAUDE.md, .claude/, flake.nix, Claude.local.md. Known, accepted.

## Confirmed, don't touch
1. Hardcoded nav/colors in interpolation pages — intentional, not a cleanup target.
2. Ko-fi widget — keep, exempted from the monetization ban.
3. .teal-button-link has margin: 25px -5px !important. Cancel it locally in compact rows, never change the base rule.
4. interpolate_cal input grid locked to 4 columns (cols: 4, fixedColCount: true) — intentional.
5. Pasting more alerts and truncates. A Playwright test asserts that.
6. The column lock gets unlocked on the ADVANCED page, not here.
7. test_in_data.md carries 10 columns, so the basic page only ever sees X + 3 series.

## Next
1. Advanced interpolation page, cubic and spline.
2. Add "advanced" to spec.json levels + pages. The home row grows the button by itself.
3. It also unlocks the column limit — that page takes the full 10-column fixture, the basic one stays at 4.
4. Fixing the 🪄Advanced placeholder link comes with it. tests/interpolation/nav.spec.ts exempts that href today, drop the exemption then.
5. One topic at a time.
