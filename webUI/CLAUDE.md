# webUI

## Style
1. Every English message I send: show a corrected version first, then answer.
2. Write every Claude-setting .md the same way. Essential only.
3. Silently fix English grammar, keep technical meaning.
4. Ask when technical intent is unclear.

## Scope
1. Small static site: interactive explainers for computational math/science.
2. Work only inside webUI/.
3. No write/modify/exec outside.
4. Read outside = last resort, rare.

## Stack
1. Hand-written static HTML. No framework, no bundler.
2. Scripts are TypeScript. Source = .ts, served = .js.
3. Never edit a .js — it is generated.
4. Build:
```
tsc -p tsconfig.json    # watch: tsc -w
```
5. No imports/exports — every .ts is a classic script, classes are global. Keep it that way.
6. nginx root IS this repo. Build = live.
7. No deploy step, so .js/.js.map are committed.
8. flake.nix gives Node/TS/Python/chromium from the nixos-24.05 pin.
9. Always inside:
```
nix develop
```
10. No pip/dnf/global installs.
11. yt-dlp alone comes from a second nixpkgs-unstable input — YouTube breaks old extractors. Never move anything else there.
12. npm is for Playwright only (approved 2026-08-21, project-local). Site ships zero runtime deps.
13. Browser tests, specs in tests/:
```
run-browser-tests
```
14. That flake script uses the Nix chromium, never downloads one.

## Map
1. Sections are real directories. `scientific_cal/` is the only one; repo layout mirrors URL layout, so `/scientific_cal/dev_basic/grid.js` is that file on disk.
2. index.html at the repo root — umbrella page listing sections. Static, no JS.
3. scientific_cal/index.html + home.ts — section home. Renders rows from topics/topics.json -> each spec.json.
4. scientific_cal/dev_basic/ — shared components + style.css. Tokens in :root. calc-page.ts builds a whole calculator; a page controller adds only its compute path.
5. scientific_cal/topics/topics.json — slug list. Not listed = invisible on the section home.
6. New topic or new level -> skill `new-topic`.
7. Topic detail — folder shape, spec.json, SEO, validation, CSS, writing -> .claude/rules/topics.md.
7a. user_todo.md — actions the USER owns. Never put a code fact there; never put a user action in HANDOVER.md.
8. Chart colors and line styles -> .claude/rules/visuals.md.
9. app.py, tests/, types/, robots.txt, sitemap.xml, og/ and the favicons stay at the repo root — they are the site's, not a section's.
10. tools/ — build scripts that are not served. gen-og.js rebuilds og/ from spec.json; run it with `gen-og-images`.
11. Responsive: one @media (max-width: 900px) block at the end of scientific_cal/dev_basic/style.css. Additive only — never edit a desktop rule to fix a phone.

## Hard rules
1. Topics are data-driven — never hardcode a topic list.
2. Design tokens only — no raw colors/fonts/spacing in topics.
3. Exception: user-confirmed temp adjustment, not a cleanup target.
4. Extract on second use. First use stays in the topic. No speculative abstraction.
5. Static-first — article text in HTML before JS runs. JS adds interaction only.
6. SEO tags static in the page — crawlers do not run JS.
7. Shell is global — tell user before changing scientific_cal/src/shell/.
8. Analytics live in scientific_cal/src/shell/ only — never page-level.
9. One topic at a time.
10. No new dependencies without permission.

## Deferred
1. No monetization. Ko-fi is the only exception, no approval needed.
2. Under consideration, not approved: a paid tier gating advanced levels. Blueprint-level only — build nothing for it.
3. Consent banner required, not deferred — GA4/Clarity set cookies, must gate behind opt-in.
