# HANDOVER

Current status only. Not history — daily detail in .claude/log/.

## Resume here
0. THE SITE MOVED to /scientific_cal on 2026-09-05. Config deployed by the user the same day, site verified live: all five public URLs 200, the three old URLs 301. Nothing pending here.
1. Pick up the queue at the bottom of this file. Anything waiting on the USER is in webUI/user_todo.md instead.
2. The advanced page is LIVE and computes. app.py runs in a detached tmux session and restarts at boot from cron — see the interp-api section. A 502 now means the session died, not that nobody started it: check `tmux ls`.
3. The suite is 105 tests. Some skip themselves when /api/health is unreachable — that is the service being down, not a broken test.
4. fft.zip is NO LONGER IN THE REPO. It now sits at ~/transfer/ryunote/fft.zip, moved out on 2026-09-05 before the /scientific_cal work started. It was never tracked by git, so nothing in this repo's history holds a copy. Still never opened.
5. webUI/app_py.md is the user's own notes on the backend, written 2026-09-04. Not a rules file, not loaded by anything.
6. scientific_cal/topics/interpolation/interpolation_blueprint copy.md is the user's own rewrite. Untracked, KEEP IT — the blueprint was rebuilt from it, and it is theirs.
7. Left stale on purpose: log/2026-08-21.md:51 says the favicon gap is in future_work.md, and log/2026-09-02.md ends with "Not committed". Both were true when written. Logs are history, not corrected.
8. git identity is auto-detected as opc@a1-ryu...oraclevcn.com. Set user.email if the real address matters.

## Fact ownership
1. CLAUDE.md = repo-wide rules.
2. .claude/rules/topics.md = topic detail.
3. .claude/rules/visuals.md = chart colors and line styles.
4. .claude/rules/tests.md = rules the Playwright suite depends on.
5. .claude/skills/new-topic/SKILL.md = 6-step checklist.
6. .claude/refs/ = outside knowledge, summarised. Not rules.
7. scientific_cal/topics/<slug>/<slug>_blueprint.md = what to build, written before the work. One line per requirement, no answers in it. ONE per topic, every level in it — merged from the two split files on 2026-09-04.
8. A blueprint is written BEFORE the work. Never fold as-built detail into one — function signatures, rounding, algorithm choice. That is what stops it being a blueprint. As-built facts belong in this file or in a test.
9. webUI/user_todo.md = actions the USER owns. Not a rules file, not a second handover. A code FACT stays here; an ACTION with the user as owner goes there.
10. Each fact lives in ONE file. Adding a rule? Pick the owner, never copy into a second file.

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
1. Public URL /scientific_cal/interpolate_adv. A real page now, not the copy of the calculator it was on 2026-09-02.
2. Methods offered: linear, cubic spline, PCHIP, Akima. NO FFT — it needs a uniform x grid and does not fit arbitrary pasted data. spec.json advanced.methods is the source; the select is a static copy of it.
3. The input grid is built WITHOUT fixedColCount. That is the one real data difference from the basic page — a wide paste grows the grid instead of alerting.
4. page_adv.ts computes NOTHING. It posts to /api/interpolation/<method> and renders the reply. It does not load interp_engine.js on purpose: falling back to the basic page's linear math while the select says "cubic spline" would be a lie told by the page. Since 2026-09-05 everything except that round trip lives in scientific_cal/dev_basic/calc-page.ts.
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
15. The 🪄Advanced placeholder is gone: interpolate_cal.html links to /scientific_cal/interpolate_adv, and nav.spec.ts's exemption was deleted. That rule now has no exceptions.
16. The grid VIRTUALISES its columns. An off-screen column has no DOM node, so assert grid width by copying the data out, never by locating a cell.

## Python backend — built 2026-09-03
1. webUI/app.py is the site's ONE backend, for every topic. Routes are /api/<topic>/<method>.
2. It owns all HTTP: JSON parse, validation, caps (8 MB body, 20000 rows, 64 cols, 50000 query points), error shape. Bad input is a 4xx with {"error": ...}; a stack trace never reaches the client.
3. Routes are built from each topic module's own METHODS table. A new method is one line in the topic file and none in app.py.
4. scientific_cal/topics/interpolation/api_interp.py holds the math and imports no Flask. It stays callable without a server.
5. Binds 127.0.0.1 only. Port from INTERP_API_PORT, default 35910. nginx is its whole public face.
6. `nix run .` works now — it never had before, because app.py did not exist. Note flakes copy only GIT-TRACKED files: an untracked app.py is absent from the store and the command fails with "can't open file".
7. Verified against interp_engine.ts on the demo dataset, range 0/1000/1: 1001 rows both sides, max absolute difference 0.000e+00. The two pages cannot disagree.
8. Every method blanks outside a series' own domain. np.interp CLAMPS there, so linear masks it back explicitly; the scipy interpolators use extrapolate=False and their NaN becomes a blank cell.
9. A series too thin for its method (cubic wants 4 points, Akima 5) blanks that column instead of failing the request.
10. It is Flask's DEVELOPMENT server, single-threaded. Fine on loopback; a production WSGI server is not in the flake and adding one needs permission.
11. scipy math lives beside its topic and app.py imports it, so scientific_cal/topics/ and scientific_cal/topics/interpolation/ carry an __init__.py.

## nginx /api/ — deployed 2026-09-03
1. `location /api/` added to ~/nix/nginx/configs/nginx.conf (joined by `location /scientific_cal/api/` on 2026-09-05), plus api_port = "35910" in nginx-secrets.nix and api_port in the flake's substituteAll list. Miss that last one and @api_port@ ships unreplaced.
2. 35910 was already in openPortsStr. The service still binds loopback, so the open port reaches nothing directly.
3. client_max_body_size 8m in that block on purpose — the server-wide value is 2G, which would let an oversize body reach Flask instead of being refused at the edge.
4. No trailing slash on proxy_pass: Flask's own routes start with /api/.
5. Deployed by the user with `nix run --impure .#update_nginx_conf` from ~/nix/nginx. /api/health answers on the public domain.
6. A 502 there means nginx found the route and nobody answered: the block is live but app.py is not running. It is NOT an nginx fault.

## how-to panel — shared component, 2026-09-03
1. scientific_cal/dev_basic/how-to.ts. Extracted from page.ts when the advanced page became the second user; both pages load /dev_basic/how-to.js and neither controller owns panel code any more.
2. `<details>` still does the opening, so the manual is in the HTML before any script runs and Tab + Enter work with no JS.
3. Hover was ADDED, never substituted for click: hover in opens, hover out closes, a click PINS it open, Escape or an outside click closes and unpins.
4. Hover is gated behind `(hover: hover) and (pointer: fine)`. A touch device reports neither — without that gate the manual would be unreachable on a phone.
5. A click on an already-hover-opened panel is intercepted. Native <details> would toggle it SHUT, which is the opposite of what that gesture means.
6. Escape does NOT reopen on the hover that is already there. The pointer has not moved, so no mouseenter fires. Deliberate, and asserted.
7. OPEN_DELAY 120 ms and CLOSE_DELAY 220 ms: brushing past must not throw a panel over the grids, and a brief exit must not snatch it away mid-read.
8. howto_open fires ONCE per page load. Hover would otherwise report every pass of the mouse. It now carries `level` as well as `slug`, so the two calculators are distinguishable.
9. The component cannot know its topic, so the element declares it: `<details class="how-to" data-slug=… data-level=…>`.

## CSV / TSV import and export — added 2026-09-04, shared same day

1. Advanced page only. The basic page is untouched, so its "nothing is uploaded" claim is unaffected either way — these are local file operations and never reach the server.
1a. The code lives in scientific_cal/dev_basic/csv.ts, one entry point: initCsvIo({slug, level, input, output}). It finds its own buttons by id and knows nothing about interpolation.
1b. It has ONE caller. That is a deliberate exception to the extract-on-second-use rule, taken by the user because the next user is a new topic rather than a second page of this one.
1c. The buttons read "import" and "export". The formats are named in the how-to panel instead, and a test asserts the labels so a relabel is a decision, not drift.
1d. seo.spec.ts's required terms — csv, tsv, copy and paste — come from the <summary>, never from the button labels. Checked before the relabel.
1e. Events carry slug AS WELL AS level. A shared component firing an event that named only the level could not say which topic produced it.
1f. .panel-actions, .ghost-btn and .ghost-select moved to scientific_cal/dev_basic/style.css with the code.
1g. applyColumnLock was WRONG, not merely unproven. Fixed 2026-09-05 when the basic page became the second caller. setData hard-resets numCols from the incoming array, so a locked grid moved in BOTH directions: a wide file widened it, a narrow file shrank it. It now squares every row off to exactly numCols. Too wide still alerts, matching grid.ts; too narrow pads silently, because a narrow paste says nothing either.
2. Import: a hidden `<input type=file>` behind an `import CSV / TSV` button on the Input panel. `accept` filters the explorer; it is a hint, never a guarantee, so the parser takes whatever arrives.
3. `parseDelimited` in page_adv.ts is lifted from grid.ts `_onPaste` — tab if the first line has one, else comma. Deliberate duplication of behaviour, not of code ownership: a file and a paste of the same bytes must give the same grid.
4. Quoted fields containing a comma still split wrongly. That bug is grid.ts's too. Fixing it here alone would make file and clipboard disagree, which is worse than the bug.
5. `importFile.value = ''` is cleared BEFORE the await. Without it, picking the same file twice fires no change event and the second import silently does nothing.
6. Import calls grid.setData, which emits `change` — so plotBoth runs and demoPristine clears through the handlers that already exist. Never touch demoPristine in the import path.
7. setData also hard-resets rows and columns, so an import replaces the demo wholesale. The capture-phase paste clear is a paste-only trap and needs no import equivalent.
8. Export is ONE button. The format comes from the save dialog, not from the page.
9. That needs `window.showSaveFilePicker` — Chromium only. The handle it returns carries the name the user chose, and its extension picks the delimiter.
10. Firefox and Safari have no equivalent and no polyfill. There, `#exportFormat` unhides beside the button and the old Blob + `<a download>` path runs. Nobody loses TSV.
11. The picker must be called with no `await` above it in the click handler. Chromium requires an unconsumed user gesture and one awaited tick spends it — the dialog then silently never opens.
12. `window.showSaveFilePicker` is read fresh on every click, not cached at load. A test adds or removes it per page.
13. Cancel is a decision, not a failure: AbortError is swallowed, no status is set, and no `csv_export` event fires.
14. Export writes NO header row. test_in_data.md is headerless, so an export re-imports and round-trips through app.py unchanged.
15. types/globals.d.ts carries a minimal File System Access declaration. TS 5.4's DOM lib has none, and the full spec types are far more than the four members used.
16. `.ghost-btn` and `.ghost-select` live in interpolation_style.css — one user so far. Second page to want them moves both to scientific_cal/dev_basic/style.css.
17. tests/interpolation/csv.spec.ts, 13 tests. Playwright cannot drive a native save dialog, so the picker is stubbed per test: a fake handle named out.tsv/out.csv for the dialog path, `delete window.showSaveFilePicker` for the fallback path.
18. Events: `csv_import` {level, format, rows} and `csv_export` {level, format, method, rows}. Both consent-gated.

## CSV / TSV on interpolate_cal — added 2026-09-05

1. Both calculators now import and export. The component was already shared; this was one `initCsvIo` call in page.ts, the two `.panel-actions` blocks copied from the advanced page, and one script tag.
2. The basic page's "nothing is uploaded" wording is UNAFFECTED and stays. Import and export are local file operations; nothing new reaches the server.
3. The real work was the applyColumnLock fix. See the CSV section's 1g.
4. Wiring rule, and it is the whole reason this was small: `setData` emits `change`, so the existing plot and demoPristine handlers already cover the import path. A caller adds NOTHING beside the initCsvIo line.
5. The how-to panel gained the file route in step 1 of its list, and its four-column note now covers import as well as paste. seo.spec.ts's required terms come from the `<summary>`, which was not touched.
6. calculator.spec.ts now matches the panel headings by PREFIX, not equality. Input and Output carry their action buttons inside the h2, so `toHaveText(['Input', ...])` no longer holds. The heading's own label is what that assertion guards.
7. The narrow-import test was run against the pre-fix code and observed to FAIL — the grid came back 2 columns wide. It is a real regression guard, not a tautology.

## scientific_cal/dev_basic/calc-page.ts — shared scaffold, 2026-09-05

1. Both calculator controllers are built on it. page.ts went 134 -> 61 lines, page_adv.ts 196 -> 94.
2. It owns: finding the markup, both grids, the chart, plotBoth, setStatus, the initCsvIo call, the demo seed, and the capture-phase paste clear.
3. It owns NO math and loads no engine. That is the constraint, not a coincidence — the advanced page's status line names the method the SERVER ran, so a client-side fallback would make the page lie. interpolate_adv.html still carries only a comment where interp_engine.js would go.
4. `level` does three jobs: names the analytics level, picks `spec[level].dataset` and `spec[level].range`, and tags the console warning. That single key is what collapsed two different demo-seeding blocks into one.
5. The basic page has no `calculator.range` in spec.json, so its Output X inputs keep their HTML values. Same code path as the advanced page's `advanced.range`, no special case.
6. `#status` is now REQUIRED by the guard on both pages. page.ts did not require it before; both pages have always had it.
7. `#methodSelect` is optional, returned as `method: HTMLSelectElement | null`. page_adv.ts checks for it itself, because every advanced method goes over the wire.
8. What stayed in each topic file: the InterpEngine call in page.ts, the fetch round trip in page_adv.ts, and one wiring line each — `input.on('change', ...)` recomputes on the basic page and only re-plots on the advanced one.
9. Load order in the HTML: grid, csv, chart, dual-chart, calc-page, then the page controller. calc-page constructs all three and calls initCsvIo, so it comes after them.
10. Pure refactor, proven: 105/105 with ZERO test edits, and the client/API agreement re-measured at 1001 rows both sides, max absolute difference 0.000e+00.

## The move to /scientific_cal — 2026-09-05

1. Sections are REAL DIRECTORIES, not a URL prefix nginx strips. `scientific_cal/dev_basic/grid.js` on disk is `/scientific_cal/dev_basic/grid.js` on the web. No `<base>` tag, no rewrite, no alias.
2. Moved under it: index.html, home.ts/.js, scientific_cal/dev_basic/, src/, scientific_cal/topics/. Everything else stayed at the repo root.
3. Stayed at the root ON PURPOSE: app.py (the backend is the site's, not a section's), tests/, types/, tsconfig.json, robots.txt, sitemap.xml, and the favicons — a browser requests /favicon.ico regardless of page path.
4. The repo root index.html is a NEW umbrella page listing sections. Static, no JS, and it carries the Google Search Console verification meta tag, which must live at the property ROOT. Removing that tag un-verifies the property.
5. The section home is /scientific_cal/ and still renders its rows from topics.json. A topic page's home button goes THERE, not to the umbrella.
6. app.py's Flask routes are UNCHANGED and still start with /api/. nginx maps the prefix instead: `proxy_pass http://127.0.0.1:<port>/api/` in the /scientific_cal/api/ block. Drop that trailing /api/ and every call 404s inside Flask.
7. The unprefixed /api/ block is kept as well. The backend belongs to the site, and /api/health is how you tell "nginx has no route" (404) from "route exists, nobody answered" (502).
8. app.py imports `from scientific_cal.topics.interpolation import api_interp` now, and scientific_cal/ carries an __init__.py for it.
9. Old public URLs 301 to their new homes. KEEP those three blocks — they are indexed, and a permanent redirect passes the ranking on.
10. tests/helpers/spec.ts exports SECTION_ROOT = '/scientific_cal/'. A test that wants the topic cards wants that, never '/': the umbrella has no topic list.
11. CORS is still NOT needed and none was added. Page and API share an origin, and app.py records why flask_cors is absent. If the API ever gets its own origin, the fix is an exact-origin `add_header` in the nginx /api/ block — never a wildcard, never in app.py, which has caps but no auth.
12. Every leading-slash path was swept, scientific_cal/src/shell/seo.ts's spec.json fetch included. The one that would have failed SILENTLY is page_adv.ts's `/api/...`: the kept site-wide block would have served it, so a wrong path would have passed the tests.
13. Proven before handover, not after: the generated config was run as a throwaway nginx on port 18443 and the whole suite passed against it, 105/105. Old URLs returned 301 to the right targets.

## og:image social cards — added 2026-09-05

1. og/ at the REPO ROOT, five 1200x630 PNGs, beside favicon.svg/.ico. They are site metadata, the same class as the favicons, and one of the five belongs to the root umbrella page which is in no section. 184 KB for all five.
2. A visitor never downloads them. Only a scraper does, once, when someone pastes a link. Zero page-weight cost.
3. tools/gen-og.js builds them. Rebuild with `gen-og-images` (flake devShell script) or `nix run .#gen-og-images`. Regeneration is byte-identical, so a rebuild never shows up as a spurious diff.
4. UNLIKE the favicon script, this one is KEPT. The favicon was a one-off; these carry text from spec.json, so a title change means re-running a command — and a script that exists only in a log entry cannot be re-run.
5. spec.json gained a `card` field per level. It is REQUIRED, and a missing one throws. Falling back to `title` was deliberately refused: calculator.title is 120 characters and would render as a wall on a 1200px card.
6. Re-run gen-og-images after ANY `card` change. The text is baked into the PNG, so a stale card is a wrong social preview that nothing else will catch.
7. `twitter:card` must stay `summary_large_image` on every page. With `summary` a 1200x630 image is cropped to a small square, which throws the card away.
8. The mark is copied from favicon.svg into gen-og.js. Two copies of one path — if the favicon is ever redrawn, both change.
8a. ALL FIVE share one layout, by the user's call 2026-09-05: kicker top, title, then domain bottom-left and mark bottom-right. The two site-level cards sit inside no section, so their kicker is EMPTY — but `.kicker { min-height: 36px }` keeps the line's height, or an absent kicker would slide the title up and break the shared geometry. The domain is on every card, never doubled into the kicker.
9. seo.spec.ts covers all five pages, umbrella and section home included. The assertion that earns its place is the 200: a declared og:image that 404s looks exactly like a working one until somebody shares the link. Proven by moving a PNG aside and watching it fail.
10. The size check reads the PNG's own IHDR bytes, so a card regenerated at the wrong size cannot ship with the tag still claiming 1200x630.
11. og:image is NOT a ranking factor. It buys click-through and credibility when a link is shared, nothing else.
12. CONFIRMED WORKING 2026-09-05 by pasting a page link into Notion: full card, image included. That is worth naming, because no local test can prove it — every test here asks the origin directly, while a real consumer brings its own fetcher, its own cache and its own TLS check. One paste covers all three.
13. Scrapers cache hard. A card that looks stale is the consumer's cache, not the site — re-pasting the same URL will not refresh it.

## Mobile — added 2026-09-05

1. ONE `@media (max-width: 900px)` block at the end of scientific_cal/dev_basic/style.css. It was the first @media rule in the codebase.
2. Purely ADDITIVE: it changes no existing rule, so a desktop viewport never reaches it. The two `the desktop layout is untouched` tests in tests/mobile.spec.ts are what enforce that, and they are the half of that file to keep if anything is ever cut.
3. PC and large tablet stay the reference layout, by the user's decision. Mobile is best-effort.
4. What it does: body scrolls instead of `overflow: hidden`, html/body drop `height: 100%`, `.app-main` becomes a column, panels take explicit heights, padding drops to 12px, the header wraps, and the ad rail is hidden.
5. THE TRAP, and it is not obvious: calc-page.ts builds both grids with `viewportHeight: '100%'`, and 100% of an auto height is ZERO. Without an explicit height on .panel-grid / .panel-chart the grids render empty while still existing in the DOM. Only a height assertion catches it.
6. The page must never scroll sideways. A grid scrolling sideways INSIDE its own panel is correct and expected — that is what a spreadsheet does on a phone.
7. tests/mobile.spec.ts, 14 tests at 390x844 and 1280x900. Four were observed to fail with the media block removed; the rest are regression guards that already passed.
8. The how-to panel needed NO change. `width: min(760px, calc(100vw - 60px))` and `max-height: min(60vh, 520px)` were already viewport-relative. Hover is already gated behind `(hover: hover) and (pointer: fine)`, so touch keeps click.

## .panel-grid inline flex — fixed 2026-09-05

1. Every `.panel-grid` section carried `style="flex: 1"` in the HTML. Six of them, across interpolate_cal.html, interpolate_adv.html and index_dev_basic.html.
2. So `.panel-grid { flex: 3 }` in style.css was DEAD CODE and always had been. The desktop row has always been 1 : 1 : 2, never 3 : 3 : 2.
3. The lesson, and it is the reusable one: **an inline style cannot be overridden by a media query without !important.** The mobile block's `flex: none` lost, so the phone grid rendered 1428px tall instead of the intended 55vh.
4. Fixed by moving the value into CSS as `.panel-grid { flex: 1 }` and deleting all six inline styles. Computed desktop result is unchanged by construction.
5. Measured both ways to prove it: desktop 302 : 302 : 604, one row, no scroll — identical before and after. Phone 396 / 396 / 270, stacked.
6. Found by SCREENSHOTTING the phone layout, not by a test. The tests passed because they only asserted a lower bound on panel height. A 1428px grid satisfied `> 150` perfectly well.

## interp-api tmux session — added 2026-09-05

1. app.py runs in a DETACHED TMUX SESSION named `api`. Survives closing VS Code and logging out. A @reboot crontab line restarts it at boot.
2. NOT systemd. A systemd user service was built first and REMOVED at the user's request the same day. Do not propose it again without asking.
2a. THE @reboot LINE IS PROVEN. The user rebooted 2026-09-05 and everything came back with no manual step: nginx, crond, the `api` session, and /api/health answering. app.py came up as a boot-PID parented by `tmux: server`, cwd the working tree, and ~/.local/state/api-boot.log carried the script's own output — which is what says cron fired rather than something else starting it.
3. Commands:
```
~/nix/webUI/tools/start-api.sh     # start, or restart if already running
tmux attach -t api                 # watch it live; detach with ctrl-b then d
tmux kill-session -t api           # stop
```
4. tools/start-api.sh is IDEMPOTENT — it kills an existing `api` session before creating one. That is what makes it safe as both the restart command and the @reboot line.
5. It runs the flake's launcher through an out-link, NOT `nix run .`. Two reasons, and both are load-bearing:
5a. `nix run .` does `cd "${self}"` — a store snapshot of git-TRACKED files. nginx serves this repo directly, so that would put an uncommitted api_interp.py edit live on the page and invisible to the API at the same time. The launcher cd's to the working tree. Verified: /proc/<pid>/cwd is /home/opc/nix/webUI.
5b. ~/.local/state/nix/interp-api is a GC ROOT. Checked before building: the python closure's only roots were /proc/<pid>/maps entries — running processes. A nix-collect-garbage with the server stopped would have deleted the interpreter.
6. Rebuild the out-link after ANY flake.nix change, or the session keeps starting the old closure:
```
cd ~/nix/webUI && nix build .#interp-api --out-link ~/.local/state/nix/interp-api
```
7. NO CRASH RESTART. tmux does not supervise, and that is the ONE thing giving up systemd cost. Boot is covered; a crash at 3am is not. A 502 on /api/ means the session died — check `tmux ls` before suspecting nginx.
8. The crontab line logs to ~/.local/state/api-boot.log, OUTSIDE webUI on purpose. nginx serves this directory, so a log file here would be fetchable at /<name>.
9. The crontab and the out-link are NOT in this repo. `crontab -l` shows the line; rebuilding this box means recreating both.
10. tmux is /usr/bin/tmux, the system one. It is not in flake.nix and was not added as a dependency.
11. Sessions 0, 1 and 2 in `tmux ls` are the user's, from July. Not ours, do not touch.
12. The port is INTERP_API_PORT, default 35910 in app.py, and must match api_port in ~/nix/nginx/nginx-secrets.nix.

## Blueprints — one per topic, 2026-09-04

1. scientific_cal/topics/<slug>/<slug>_blueprint.md. ONE file per topic, every level in it. interpolation_cal_blueprint.md and interpolation_adv_blueprint.md were merged into it and deleted.
2. Shape, and it is the user's: numbered requests, level-parallel numbering so cal 2-x lines up against adv 3-x item for item, "(later)" on anything deferred.
3. Section 1-2-*-N is a per-method template — In plain words / Basic idea / Important characteristics / Advantages / Disadvantages. Every method section in every topic blog follows it.
4. The first merged version was mine and had drifted into map territory, citing test names and work already done. The user rewrote it shorter; that rewrite is what the file now holds.
5. Six constraints their rewrite dropped were folded back as sub-items: static SEO tags, public urls + sitemap, spec.json owns displayed values, input cleaning, no-extrapolation-to-blank, and the whole api part.
6. One line of theirs was a change rather than a wording choice: "linear uses the client-side logic" on the advanced page. Resolved the other way — every method goes to the API, one path, which is what the 0.000e+00 agreement check depends on.
7. A blueprint is written BEFORE the work. As-built detail — function names, rounding digits, delay values — belongs in this file or in a test, never in one.

## topics/FFT — blueprint only, 2026-09-04

1. scientific_cal/topics/FFT/FFT_blueprint.md exists. Nothing else does: no spec.json, no topics.json entry, no pages, no api module.
2. Written from ./260829_my_webUI_FFT.md and the contents of fft.zip. The zip was listed and piped, never extracted — nginx serves the repo root, so anything unpacked there is instantly public.
3. fft.zip carries a finished blog: fft_blog.md, fft_blog.html, 8 SVG figures, gen_figs.py, build_html.py. Same shape interpolation.zip arrived in, so the same treatment applies — drop its css, its nav row and any CDN tag.
4. The two markdown sources are the same text at different drafts. Keep the newer, delete the other.
5. FFT is NOT interpolation with different math. Output is a spectrum, not a resampled signal: col 0 is frequency, the output chart shares no axis with the input.
6. Uniform sampling is the transform's precondition. Non-uniform t is refused with a reason, never silently resampled — the same fact that kept FFT off the interpolation advanced page.
7. The blog's five algorithms are how scipy dispatches, not a user choice. Only fft-versus-naive-DFT is observable, and naive DFT needs its own lower row cap because it is O(N^2).
8. Section 6 of that file lists four unresolved decisions. Building before they are answered means guessing at the output contract.

## vendor/mathjax
1. scientific_cal/topics/interpolation/vendor/mathjax/tex-mml-svg.js, MathJax 3, 2.1 MB, committed.
2. Self-hosted on purpose — the site ships no third-party runtime scripts.
3. tex-mml-svg, not tex-mml-chtml: SVG output needs no web-font directory, so self-hosting is one file.
4. Second topic needing math -> move it to scientific_cal/dev_basic/vendor/ and delete this copy.

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
4. TODO next session: request indexing for /scientific_cal/interpolate_cal and /scientific_cal/interpolate_blog.
5. Then wait 1-2 weeks before judging search results.

## nginx
1. The master and ONLY copy is ~/nix/nginx/configs/nginx.conf. There is no copy in this repo.
2. webUI/nginx.conf was DELETED 2026-09-05, by the user. A near-copy that drifts from the master is worse than no copy — it reads like a source of truth and is not one.
3. Any path or URL change means READING the master and handing the user an updated version of it. Never edit it in place: it is outside webUI scope.
4. Deploy is the user's, from ~/nix/nginx: `nix run --impure .#update_nginx_conf`.
5. It denies *.conf only.
6. Every public URL needs its own `location =` block. A new topic page is invisible without one.

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

Code facts and known gaps. Anything waiting on the USER is in webUI/user_todo.md, not here.

1. interpolate_cal.html headings are Input / Output / Results — zero keywords.
2. interpolate_cal.html body was one paragraph. The How-to panel added a real manual on 2026-09-02; still short next to the blog.
3. Files served from repo root are public: CLAUDE.md, .claude/, flake.nix, Claude.local.md, user_todo.md. Known, accepted.
4. app.py runs Flask's DEVELOPMENT server, single-threaded, and says so on startup. Fine behind loopback; a production WSGI server is a new flake dependency and needs permission. Restart=always covers a crash, not the single-threadedness.
5. CSV import cannot read a quoted field containing a comma. Same limit as clipboard paste, and they must be fixed together or not at all.
6. Mobile works below 900px and tests/mobile.spec.ts covers it. No EXTERNAL score exists — PageSpeed and Lighthouse have never been run.
7. TLS cert expires 2026-09-25. Nothing in this repo renews it; renewal is in ~/nix/nginx. An expired cert breaks every page, the API and the social cards at once.

## Confirmed, don't touch
1. Hardcoded nav/colors in interpolation pages — intentional, not a cleanup target.
2. Ko-fi widget — keep, exempted from the monetization ban.
3. .teal-button-link has margin: 25px -5px !important. Cancel it locally in compact rows, never change the base rule.
4. --label-fg (#444) is the toolbar label colour, extracted from .field label on second use. The How-to summary shares it on purpose — the two must read as one control.
5. Home and blog are both a 720px column centred with auto margins; the text inside stays left-aligned. Never add text-align to .post or .topic-list.
6. Every centred block carries width: 100% — .post, .topic-list, .dev-section, and .app-header on both page types. Auto margins cancel a flex item's default stretch, so without it a block shrinks to its content and centres at its own width, off the column's left edge. The blog header hit exactly that: 555px instead of 720px.
7. tests/interpolation/blog-layout.spec.ts and tests/home/layout.spec.ts guard centring, the shared left edge, and left-aligned text on both pages. tests/mobile.spec.ts guards the narrow-viewport half: the column gives way rather than overflowing, and the blog's fixed-ratio SVG figures stay inside it.
8. The ~80px gap under the last topic row is .topic-list padding-bottom plus .dev-section margin/padding. Deliberate spacing, not a layout bug.
9. interpolate_cal input grid locked to 4 columns (cols: 4, fixedColCount: true) — intentional.
10. Pasting more alerts and truncates. A Playwright test asserts that.
11. The column lock gets unlocked on the ADVANCED page, not here.
12. test_in_data.md carries 10 columns, so the basic page only ever sees X + 3 series.

## Next
1. Nothing is blocked on Claude. Everything outstanding needs the user — see webUI/user_todo.md.
2. The two urgent ones there: the TLS cert expires 2026-09-25, and no public URL has been re-requested in Search Console since they all changed on 2026-09-05.
3. FFT is the next build, and it is blocked on the four decisions in scientific_cal/topics/FFT/FFT_blueprint.md section 6.
4. One topic at a time.
