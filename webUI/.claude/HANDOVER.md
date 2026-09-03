# HANDOVER

Current status only. Not history — daily detail in .claude/log/.

## Resume here
1. Pick up ## Next at the bottom of this file.
2. /interpolate_adv is LIVE and computes. It needs webUI/app.py running: `cd ~/nix/webUI && nix run .`. Nothing starts it on boot, so after a reboot /api/ returns 502 until you do.
3. The suite is 85 tests. Some skip themselves when /api/health is unreachable — that is the service being down, not a broken test.
4. topics/FFT/fft.zip is untracked and untouched — dropped in during the 2026-09-02 session, never opened. Deliberately left out of that commit.
5. Left stale on purpose: log/2026-08-21.md:51 says the favicon gap is in future_work.md, and log/2026-09-02.md ends with "Not committed". Both were true when written. Logs are history, not corrected.
6. git identity is auto-detected as opc@a1-ryu...oraclevcn.com. Set user.email if the real address matters.

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

## interpolate_adv — live, 2026-09-03
1. Public URL /interpolate_adv. A real page now, not the copy of the calculator it was on 2026-09-02.
2. Methods offered: linear, cubic spline, PCHIP, Akima. NO FFT — it needs a uniform x grid and does not fit arbitrary pasted data. spec.json advanced.methods is the source; the select is a static copy of it.
3. The input grid is built WITHOUT fixedColCount. That is the one real data difference from the basic page — a wide paste grows the grid instead of alerting.
4. page_adv.ts computes NOTHING. It posts to /api/interpolation/<method> and renders the reply. It does not load interp_engine.js on purpose: falling back to the basic page's linear math while the select says "cubic spline" would be a lie told by the page.
5. The button is ENABLED and works end to end. The user said they may disable it again; it is enabled today.
6. During a request the button disables and #status reads "computing…", then "<n> rows, <method>" or an error. A second click cannot race the first.
7. Editing the input grid re-plots but does NOT re-run. Every run is a network round trip; one per keystroke would hammer a shared service.
8. This page sends data to a server. The basic page's "nothing is uploaded" wording must NEVER be copied here — advanced.spec.ts fails the build if it is.
9. The manual states the upload plainly and links back to the basic page for anyone who does not want it.
10. This page seeds its OWN demo, from spec.json advanced.dataset — NOT the topic's top-level one. Two flat runs with sharp edges: x 0..10, y 0/100/0/40/0.
11. That dataset IS the point of the page. The basic page's smooth 50-point demo makes all four methods agree to ~1e-2, so the comparison had nothing to show. Measured live: cubic runs -13.56..119.63 and akima -7.14..112.50, while linear and pchip stay inside the data's 0..100.
12. advanced.range (0, 10, 0.05) drives the three Output X inputs. The HTML carries a static copy for crawlers; spec.json wins at runtime. 0-1000 is the basic page's range and is meaningless for 11 points.
13. advanced.spec.ts asserts the separation itself: cubic must exceed the data max and dip below its min, pchip must do neither. Swap in smooth data and that test fails, rather than quietly shipping a comparison page with nothing to compare.
14. Demo seeding, the async-empty guard, and the capture-phase paste clear are carried over from page.ts. The trap is identical here.
15. The 🪄Advanced placeholder is gone: interpolate_cal.html links to /interpolate_adv, and nav.spec.ts's exemption was deleted. That rule now has no exceptions.
16. The grid VIRTUALISES its columns. An off-screen column has no DOM node, so assert grid width by copying the data out, never by locating a cell.

## Python backend — built 2026-09-03
1. webUI/app.py is the site's ONE backend, for every topic. Routes are /api/<topic>/<method>.
2. It owns all HTTP: JSON parse, validation, caps (8 MB body, 20000 rows, 64 cols, 50000 query points), error shape. Bad input is a 4xx with {"error": ...}; a stack trace never reaches the client.
3. Routes are built from each topic module's own METHODS table. A new method is one line in the topic file and none in app.py.
4. topics/interpolation/api_interp.py holds the math and imports no Flask. It stays callable without a server.
5. Binds 127.0.0.1 only. Port from INTERP_API_PORT, default 35910. nginx is its whole public face.
6. `nix run .` works now — it never had before, because app.py did not exist. Note flakes copy only GIT-TRACKED files: an untracked app.py is absent from the store and the command fails with "can't open file".
7. Verified against interp_engine.ts on the demo dataset, range 0/1000/1: 1001 rows both sides, max absolute difference 0.000e+00. The two pages cannot disagree.
8. Every method blanks outside a series' own domain. np.interp CLAMPS there, so linear masks it back explicitly; the scipy interpolators use extrapolate=False and their NaN becomes a blank cell.
9. A series too thin for its method (cubic wants 4 points, Akima 5) blanks that column instead of failing the request.
10. It is Flask's DEVELOPMENT server, single-threaded. Fine on loopback; a production WSGI server is not in the flake and adding one needs permission.
11. scipy math lives beside its topic and app.py imports it, so topics/ and topics/interpolation/ carry an __init__.py.

## nginx /api/ — deployed 2026-09-03
1. `location /api/` added to ~/nix/nginx/configs/nginx.conf, plus api_port = "35910" in nginx-secrets.nix and api_port in the flake's substituteAll list. Miss that last one and @api_port@ ships unreplaced.
2. 35910 was already in openPortsStr. The service still binds loopback, so the open port reaches nothing directly.
3. client_max_body_size 8m in that block on purpose — the server-wide value is 2G, which would let an oversize body reach Flask instead of being refused at the edge.
4. No trailing slash on proxy_pass: Flask's own routes start with /api/.
5. Deployed by the user with `nix run --impure .#update_nginx_conf` from ~/nix/nginx. /api/health answers on the public domain.
6. A 502 there means nginx found the route and nobody answered: the block is live but app.py is not running. It is NOT an nginx fault.
7. webUI/nginx.conf, the reference near-copy, does NOT have this block. It already differed; left alone.

## how-to panel — shared component, 2026-09-03
1. dev_basic/how-to.ts. Extracted from page.ts when the advanced page became the second user; both pages load /dev_basic/how-to.js and neither controller owns panel code any more.
2. `<details>` still does the opening, so the manual is in the HTML before any script runs and Tab + Enter work with no JS.
3. Hover was ADDED, never substituted for click: hover in opens, hover out closes, a click PINS it open, Escape or an outside click closes and unpins.
4. Hover is gated behind `(hover: hover) and (pointer: fine)`. A touch device reports neither — without that gate the manual would be unreachable on a phone.
5. A click on an already-hover-opened panel is intercepted. Native <details> would toggle it SHUT, which is the opposite of what that gesture means.
6. Escape does NOT reopen on the hover that is already there. The pointer has not moved, so no mouseenter fires. Deliberate, and asserted.
7. OPEN_DELAY 120 ms and CLOSE_DELAY 220 ms: brushing past must not throw a panel over the grids, and a brief exit must not snatch it away mid-read.
8. howto_open fires ONCE per page load. Hover would otherwise report every pass of the mouse. It now carries `level` as well as `slug`, so the two calculators are distinguishable.
9. The component cannot know its topic, so the element declares it: `<details class="how-to" data-slug=… data-level=…>`.

## vendor/mathjax
1. topics/interpolation/vendor/mathjax/tex-mml-svg.js, MathJax 3, 2.1 MB, committed.
2. Self-hosted on purpose — the site ships no third-party runtime scripts.
3. tex-mml-svg, not tex-mml-chtml: SVG output needs no web-font directory, so self-hosting is one file.
4. Second topic needing math -> move it to dev_basic/vendor/ and delete this copy.

## favicon — added 2026-09-03
1. favicon.svg is the source of record. Edit that, never the .ico.
2. favicon.ico is GENERATED from it: render_favicon.js drew 16/32/48 px through Playwright + the Nix chromium, and a short Python block packed them into one .ico. The script was scratch and is not kept — the recipe is this line.
3. The .ico holds PNG payloads, not BMP. Every browser since IE11 reads that, and it keeps the file at 2.9 KB instead of ~10 KB.
4. Both are linked from all four pages, SVG first: a browser that understands SVG never requests the .ico.
5. The mark is the site's one idea drawn — known points, and a curve estimating between them. Ground is #21c2b5, the .teal-button-link colour.
6. collectConsoleErrors used to ignore /favicon.ico by name. That ignore is GONE. Every "console is quiet" assertion now depends on the file really being there.
7. tests/home/favicon.spec.ts parses the .ico header and asserts 3 images at 16/32/48.


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
2. interpolate_cal.html headings are Input / Output / Results — zero keywords.
3. interpolate_cal.html body was one paragraph. The How-to panel added a real manual on 2026-09-02; still short next to the blog.
4. Mobile friendliness never scored. Cal page is a full-height 3-panel grid with body { overflow: hidden }. The blog article was never checked on a phone either — its figures are fixed-ratio SVG.
5. No SERP rank monitoring at all.
6. /interpolate_cal URL abbreviates "calculator". Crawler reads the URL. Changing it costs a redirect + sitemap + canonical.
7. test_data.csv orphaned. Keep or delete undecided.
8. Files served from repo root are public: CLAUDE.md, .claude/, flake.nix, Claude.local.md. Known, accepted.
9. /interpolate_blog title and description both changed on 2026-09-02. Re-request indexing in Search Console.
10. /interpolate_adv is new as of 2026-09-03 and is in the sitemap. It computes now, so requesting indexing is unblocked.
11. NOTHING STARTS app.py ON BOOT. After a reboot /api/ returns 502 until someone runs `nix run .` by hand. A systemd unit is the fix and lives outside webUI — ask first.
12. app.py runs Flask's DEVELOPMENT server, single-threaded, and says so on startup. Fine behind loopback; a production WSGI server is a new flake dependency and needs permission.

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
1. Decide how app.py stays up: a systemd unit, or start it by hand each time. Until then a reboot means 502.
2. Request indexing for /interpolate_adv, /interpolate_cal and /interpolate_blog in Search Console.
3. og:image is still missing on every page — social previews have no picture. The favicon mark added 2026-09-03 is something to build one from.
4. Mobile is still unscored on all three pages.
5. topics/FFT/fft.zip has never been opened. FFT is the obvious next topic, and the backend takes a second one with a single import line.
6. One topic at a time.
