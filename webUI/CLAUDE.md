Every time I ask with English, modify it for better answer and show me the modified sentence then answer me as simple as possible as, leave only essential like a 'cave man' skill style

Write every Claude-setting-related .md file (CLAUDE.md, claude_log, HANDOVER.md, .claude/rules/, .claude/skills/, etc.) in the same 'cave man' style — essential only.

Small static site: interactive explainers for computational math/science.

Work only inside webUI/. No write/modify/exec outside it. Reading outside is last resort, rare.

Stack
Static HTML + vanilla JS/TS. No framework, bundler, or build step.
src/shell/ — global layout, SEO, analytics, nav. Rarely touch.
src/kit/ — shared components, math utils, design tokens.
topics/<slug>/ — self-contained topic:
spec.json — metadata/dataset/parameters/formula
test_in_data / test_out_data — validation input/expected output
blog.md — article
calculator.ts — interactive demo
advanced.md — optional

flake.nix provides Node/Python. Always work inside nix develop. No npm/pip/dnf/global installs.

New topic workflow — every topics/<slug>, in order, no skipping:
1. Generate <slug>_blog.html, confirm contents with user.
2. Generate <slug>_cal.html, debug.
3. Validate <slug>_cal.html (test_in_data / test_out_data), debug.
4. Update spec.json.
5. Add SEO for both pages, validate.
6. Add analytics for both pages, validate.

SEO validation
Browser: title/meta match spec.json's blog/calculator fields per page. Network: spec.json request = 200.
Google: Search Console > URL Inspection > Test Live URL. Request indexing to speed up crawl.
Indexing: days-weeks. Ranking: weeks-months. Not instant.

HARD RULES
Topics are data-driven — never hardcode topic lists, discover from topics/*/spec.json.
Use design tokens — never hardcode colors/fonts/spacing in topics, use src/kit/tokens.ts. Exception: a deliberate, user-confirmed temporary special-case adjustment is allowed, not a cleanup target.
Static-first — article text must exist in HTML before JS runs. JS adds interaction only.
Trust validation data — calculator must match test_out_data given test_in_data, within tolerance. Never validate by visual inspection only.
Extract on second use — first use stays in the topic, second use moves to src/kit/. No speculative abstraction.
Shell is global — tell the user before changing src/shell/, it affects every page.
SEO/analytics belong in shell — topic provides only title/description/social image via spec.json. No page-level meta/analytics/ads.
One topic at a time — finish current before starting another.
No new dependencies without permission.

Visual grammar
Meaning	Token/style
Original data	solid dots, --c-data
Computed result	solid line, --c-result
Ground truth	dashed line, --c-truth
Discarded	same color, 30% opacity
Active parameter	--c-accent
Never choose topic-specific colors.

Writing
Start with the reader's real question. One core insight per page, stated early. Plain English first, derive after. Demo supports the explanation, doesn't replace it. Silently fix English grammar, preserve technical meaning. Ask when technical intent is ambiguous.

Deferred
No monetization/ads/affiliate/Carbon Ads/AdSense/Amazon. Exception: Ko-fi allowed, no approval needed.
Analytics allowed only in src/shell/. Consent banner required (not deferred) — GA4/MS Clarity set tracking cookies, must gate behind opt-in.
