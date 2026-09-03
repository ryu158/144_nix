# HANDOVER

Current status only. Not history — daily detail in .claude/log/.

## Resume here
1. Pick up ## Next at the bottom of this file.
2. /interpolate_adv ships markup + display only. The interpolate button is disabled on purpose — see ## interpolate_adv and ## Python backend below.
3. topics/FFT/fft.zip is untracked and untouched — dropped in during the 2026-09-02 session, never opened. Deliberately left out of that commit.
4. Left stale on purpose: log/2026-08-21.md:51 says the favicon gap is in future_work.md. It is in HANDOVER only now. Logs are history, not corrected.
5. git identity is auto-detected as opc@a1-ryu...oraclevcn.com. Set user.email if the real address matters.

## Fact ownership
1. CLAUDE.md = repo-wide rules.
2. .claude/rules/topics.md = topic detail.
3. .claude/rules/visuals.md = chart colors and line styles.
4. .claude/rules/tests.md = rules the Playwright suite depends on.
5. .claude/skills/new-topic/SKILL.md = 6-step checklist.
6. .claude/refs/ = outside knowledge, summarised. Not rules.
7. topics/<slug>/*_blueprint.md = what to build, written before the work. One line per requirement, no answers in it.
8. A blueprint is written BEFORE the work. Never fold as-built detail into one — function signatures, rounding, algorithm choice. That is what stops it being a blueprint. As-built facts belong in this file or in a test.
9. Each fact lives in ONE file. Adding a rule? Pick the owner, never copy into a second file.

## topics/interpolation — done
1. 6-step workflow complete.
2. Renamed "Linear Interpolation" -> "Interpolation". Advanced page planned, concept still forming.

## interpolate_blog — rewritten 2026-09-02
1. The article now covers five methods: linear, cubic spline, PCHIP, Akima, FFT resampling. The old linear-only prose is gone.
2. Content came from interpolation.zip, built outside this repo. Its own CSS, its own nav row, and its jsDelivr MathJax tag were all dropped — the page wears the site's header, buttons, and tokens.
3. spec.json blog.title/description now read "Interpolation Methods". Head tags and JSON-LD were recopied to match.
4. Two-h1 defect fixed. The header owns the only h1; article sections start at h2. tests/interpolation/nav.spec.ts asserts the header h1 now.
5. figs/interp_0*.svg — 7 SciPy figures, served as files. Never hand-edit; edit gen_figs.py and re-run.
6. gen_figs.py is archived, not runnable here — flake.nix has numpy + scipy, no matplotlib. Adding it needs permission.
7. interpolation_blog.md is the written source of record. It is served publicly like every other file in the repo.
8. Math renders client-side, so a crawler sees raw `$$...$$`. Accepted: the prose around each equation carries the meaning. Pre-rendering is the fix if it ever matters.
9. interpolation_style.css gained .post img / table / .eq rules. Blog page loads that stylesheet now; it used to be calculator-only.

## interpolate_cal "How to use this" — added 2026-09-02
1. `<details class="how-to">` sits between the header and the toolbar. Closed by default, one line tall.
2. Open, `.how-to-body` is absolutely positioned and floats over the grids. `.how-to` owns the positioning context, so `#app` and every other page are untouched.
3. The old bottom `<p class="page-intro">` is gone, CSS with it. The manual has one home now.
4. The `<summary>` carries "copy and paste / CSV / TSV" ON PURPOSE. seo.spec.ts reads visible body text, and `innerText` does not see inside a closed `<details>`. Move those words into the panel and that check fails.
5. `.how-to-intro` opens the panel: what the site is for, then the steps.
6. Native `<details>` does the opening — no JS to reveal it, so the manual is in the HTML before any script runs. page.ts adds only dismiss-on-outside-click, dismiss-on-Escape, and the `howto_open` event.
7. That code is its own IIFE with its own guard, above the calculator IIFE. Neither can break the other.
8. Nothing in the panel names a topic, a method, or a default range. CLAUDE.md forbids a hardcoded topic list and rules/topics.md forbids the rest — spec.json owns them. Keep the text about the kind of work.
9. tests/interpolation/howto.spec.ts guards it. The geometry assertion is the important one: #gridContainer must not move when the panel opens, which is the whole point of floating.

## interpolate_cal demo data — added 2026-09-02
1. The input grid arrives seeded: 50 points, x from 0 to 1000, one y series. The chart plots it on load.
2. The dataset lives in spec.json `dataset`, never in the HTML or in page.ts. rules/topics.md owns that rule.
3. Seeding fires no analytics event. `grid.on('change')` runs interpolateAndPlot, which only plots while the output grid is empty; `interpolate_run` comes from the button alone.
4. The spec.json fetch is async, so page.ts seeds ONLY if the grid is still empty when it lands. A visitor who pasted during the fetch keeps their data.
5. First paste onto an untouched demo clears the grid first. Without that, grid.ts's paste overwrites cell by cell and leaves demo rows below the pasted data, silently mixed into the result.
6. That clear is a capture-phase listener on #gridContainer — it must run before grid.ts's own handler on the hidden input. Do not move it to the bubble phase.
7. It fires once. After any change the grid is no longer pristine, so a second paste behaves normally. tests/interpolation/demo.spec.ts asserts both halves.

## interpolate_adv — markup + display, 2026-09-03
1. Public URL /interpolate_adv. A real page now, not the copy of the calculator it was on 2026-09-02.
2. Methods offered: linear, cubic spline, PCHIP, Akima. NO FFT — it needs a uniform x grid and does not fit arbitrary pasted data. spec.json advanced.methods is the source; the select is a static copy of it.
3. The input grid is built WITHOUT fixedColCount. That is the one real data difference from the basic page — a wide paste grows the grid instead of alerting.
4. page_adv.ts does NOT load interp_engine.js, on purpose. The advanced methods are scipy's; falling back to the basic page's linear math while the select says "cubic spline" would be a lie told by the page.
5. So the interpolate button ships `disabled` and #status says why. Both are asserted.
6. This page sends data to a server. The basic page's "nothing is uploaded" wording must NEVER be copied here — advanced.spec.ts fails the build if it is.
7. The manual states the upload plainly and links back to the basic page for anyone who does not want it.
8. Demo seeding, the async-empty guard, and the capture-phase paste clear are carried over from page.ts. The trap is identical here.
9. The 🪄Advanced placeholder is gone: interpolate_cal.html links to /interpolate_adv, and nav.spec.ts's exemption was deleted. That rule now has no exceptions.
10. The grid VIRTUALISES its columns. An off-screen column has no DOM node, so assert grid width by copying the data out, never by locating a cell.

## Python backend — decided 2026-09-03, not written
1. The advanced methods come from scipy.interpolate: CubicSpline, PchipInterpolator, Akima1DInterpolator. gen_figs.py drew the blog figures with the same calls, so page and article agree by construction.
2. flake.nix pythonEnv already carries flask, numpy, scipy. No new dependency, so no permission needed.
3. /interpolate_cal stays fully client-side. interp_engine.ts survives and its "No upload" claim stays true. Decided, not an accident.
4. Three costs, accepted knowingly: the no-upload claim dies on the advanced page, a deploy step appears where there was none, and run-browser-tests gains a running-service prerequisite.
5. The endpoint binds loopback and sits behind nginx, same as syncthing. It needs a body-size cap — it is public and takes an arbitrary array.
6. Login gating the Advanced button is deferred, not dropped. Recorded as 12-1 in the advanced blueprint.
7. Requirements live in topics/interpolation/interpolation_adv_blueprint.md. Read it before writing app.py.

## vendor/mathjax
1. topics/interpolation/vendor/mathjax/tex-mml-svg.js, MathJax 3, 2.1 MB, committed.
2. Self-hosted on purpose — the site ships no third-party runtime scripts.
3. tex-mml-svg, not tex-mml-chtml: SVG output needs no web-font directory, so self-hosting is one file.
4. Second topic needing math -> move it to dev_basic/vendor/ and delete this copy.

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
1. The master copy is ~/nix/nginx/configs/nginx.conf, NOT webUI/nginx.conf. The repo-root HANDOVER owns this fact.
2. webUI/nginx.conf is a near-copy kept for reference. The two already differ.
3. Deploy from ~/nix/nginx with `nix run --impure .#update_nginx_conf`. That is outside webUI scope — ask first.
4. It denies *.conf only.
5. Every public URL needs its own `location =` block. A new topic page is invisible without one.

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
4. `nix run .` is BROKEN. runApp does `cd ${self}; python app.py`, and webUI/app.py does not exist and never has in git history. Found 2026-09-03. Writing that file is what fixes it.
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
1. og:image / socialImage missing — social previews have no picture.
2. /favicon.ico missing — 404 on every page, browser tabs blank. Found 2026-08-21 by the Playwright console check, which now ignores it.
3. Fixing it needs an icon decision first — the site has no logo. Then a static file plus <link rel="icon">. Small, not urgent.
4. interpolate_cal.html headings are Input / Output / Results — zero keywords.
5. interpolate_cal.html body was one paragraph. The How-to panel added a real manual on 2026-09-02; still short next to the blog.
6. Mobile friendliness never scored. Cal page is a full-height 3-panel grid with body { overflow: hidden }. The blog article was never checked on a phone either — its figures are fixed-ratio SVG.
7. No SERP rank monitoring at all.
8. /interpolate_cal URL abbreviates "calculator". Crawler reads the URL. Changing it costs a redirect + sitemap + canonical.
9. test_data.csv orphaned. Keep or delete undecided.
10. Files served from repo root are public: CLAUDE.md, .claude/, flake.nix, Claude.local.md. Known, accepted.
11. /interpolate_blog title and description both changed on 2026-09-02. Re-request indexing in Search Console.
12. /interpolate_adv is new as of 2026-09-03 and is in the sitemap. Request indexing once it actually computes — an indexed page with a disabled button is worse than an unindexed one.

## Confirmed, don't touch
1. Hardcoded nav/colors in interpolation pages — intentional, not a cleanup target.
2. Ko-fi widget — keep, exempted from the monetization ban.
3. .teal-button-link has margin: 25px -5px !important. Cancel it locally in compact rows, never change the base rule.
4. --label-fg (#444) is the toolbar label colour, extracted from .field label on second use. The How-to summary shares it on purpose — the two must read as one control.
5. Home and blog are both a 720px column centred with auto margins; the text inside stays left-aligned. Never add text-align to .post or .topic-list.
6. Every centred block carries width: 100% — .post, .topic-list, .dev-section, and .app-header on both page types. Auto margins cancel a flex item's default stretch, so without it a block shrinks to its content and centres at its own width, off the column's left edge. The blog header hit exactly that: 555px instead of 720px.
7. tests/interpolation/blog-layout.spec.ts and tests/home/layout.spec.ts guard centring, the shared left edge, and left-aligned text on both pages.
8. The ~80px gap under the last topic row is .topic-list padding-bottom plus .dev-section margin/padding. Deliberate spacing, not a layout bug.
9. interpolate_cal input grid locked to 4 columns (cols: 4, fixedColCount: true) — intentional.
10. Pasting more alerts and truncates. A Playwright test asserts that.
11. The column lock gets unlocked on the ADVANCED page, not here.
12. test_in_data.md carries 10 columns, so the basic page only ever sees X + 3 series.

## Next
1. Write webUI/app.py. It is what makes `nix run .` work and what the advanced page is waiting for.
2. Contract and limits are in topics/interpolation/interpolation_adv_blueprint.md, section `- api`. Do not invent a second one.
3. Match interp_engine.ts where the two overlap: skip non-numeric points, sort by x, per-series domains, and blank outside the domain — not 0, not an error.
4. Then page_adv.ts posts to it, the interpolate button loses `disabled`, and #status carries running / failed / backend down.
5. nginx needs a `location /api/` proxy block in ~/nix/nginx/configs/nginx.conf. That file is outside webUI — ask first.
6. Only then request indexing for /interpolate_adv.
7. One topic at a time.
