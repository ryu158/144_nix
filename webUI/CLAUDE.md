Every time I ask with English, modify it for better answer and show me the modified sentence then answer me as simple as possible as, leave only essential like a 'cave man' skill style

Write every Claude-setting-related .md file (CLAUDE.md, claude_log, HANDOVER.md, .claude/rules/, .claude/skills/, etc.) in the same 'cave man' style — essential only.

Small static site: interactive explainers for computational math/science.

Work only inside webUI/. No write/modify/exec outside it. Reading outside is last resort, rare.

Stack
Static HTML + vanilla JS. No framework, bundler, build step. No src/kit/, no .md/.ts source — pages are hand-written HTML.
src/shell/ — seo.js, consent.js, analytics.js. Global. Rarely touch, tell user first.
dev_basic/ — shared components + style.css. Design tokens live in style.css :root.
  chart.js, dual-chart.js, grid.js, ads.js, bmc.js
index.html — home. Renders topic cards from topics/topics.json + each spec.json.
topics/topics.json — slug list. New topic not added here stays invisible on home.
topics/<slug>/ — self-contained topic:
spec.json — slug/name/pages/levels/blog+calculator title+description/insight/dataset/parameters
<slug>_blog.html — article
<slug>_cal.html — interactive demo, plus its own .js
test_in_data.md / test_out_data.md — validation input/expected output
<slug>_style.css — optional, topic-only CSS

flake.nix provides Node/Python. Always work inside nix develop. No npm/pip/dnf/global installs.

New topic workflow — every topics/<slug>, in order, no skipping:
1. Generate <slug>_blog.html, confirm contents with user.
2. Generate <slug>_cal.html, debug.
3. Validate <slug>_cal.html (test_in_data / test_out_data), debug.
4. Update spec.json (slug, name, pages, levels). Add slug to topics/topics.json, confirm card shows on index.html.
5. Add SEO for both pages, validate.
6. Add analytics for both pages, validate.

SEO validation
Raw HTML first: curl the PUBLIC url, grep for <title>. Must be there before any JS. DevTools shows post-JS DOM, so it hides this failure — curl, don't eyeball.
Browser: title/meta match spec.json's blog/calculator fields per page, no [seo] drift warning in console. Network: spec.json request = 200.
Internal links point at public urls (/interpolate_cal), never /topics/*.html — those are robots-disallowed duplicates.
sitemap.xml lists every new page. robots.txt must not block /dev_basic/, /src/, or topic JSON — Google renders before indexing.
Google: Search Console > URL Inspection > Test Live URL. Request indexing to speed up crawl.
Indexing: days-weeks. Ranking: weeks-months. Not instant.

HARD RULES
Topics are data-driven — never hardcode topic lists. index.html reads topics/topics.json, then each topics/<slug>/spec.json.
Use design tokens — never hardcode colors/fonts/spacing in topics, use tokens in dev_basic/style.css (:root). Exception: a deliberate, user-confirmed temporary special-case adjustment is allowed, not a cleanup target.
Topic CSS — component missing from dev_basic/style.css? Put it in topics/<slug>/<slug>_style.css, load after style.css, tokens only. Second topic needs the same pattern -> move it into dev_basic/style.css, delete both copies. Never invent shared CSS before the second use.
Static-first — article text must exist in HTML before JS runs. JS adds interaction only.
Trust validation data — calculator must match test_out_data given test_in_data, within tolerance. Never validate by visual inspection only.
Extract on second use — first use stays in the topic, second use moves to dev_basic/. No speculative abstraction.
Shell is global — tell the user before changing src/shell/, it affects every page.
SEO tags are static in the page — crawlers do not wait for JS. Every page carries its own <title>, <meta description>, og:/twitter:, JSON-LD, canonical, robots, viewport. spec.json stays the source of truth; seo.js overwrites at runtime and console.warns on drift. Copy the strings, never invent new ones.
Analytics belong in shell — no page-level analytics/ads. src/shell/ only.
One topic at a time — finish current before starting another.
No new dependencies without permission.

Visual grammar
Shape carries meaning. Color comes from chart.js palette (options.colors) or style.css :root tokens. No --c-* tokens exist — don't reference them.
Original data	solid dots
Computed result	solid line
Ground truth	dashed line
Discarded	same color, 30% opacity
Active parameter	--accent
Same series across layers keeps one color (chart.js does this by series index).
Never invent topic-specific colors.

Writing
Start with the reader's real question. One core insight per page, stated early. Plain English first, derive after. Demo supports the explanation, doesn't replace it. Silently fix English grammar, preserve technical meaning. Ask when technical intent is ambiguous.

Deferred
No monetization/ads/affiliate/Carbon Ads/AdSense/Amazon. Exception: Ko-fi allowed, no approval needed.
Analytics allowed only in src/shell/. Consent banner required (not deferred) — GA4/MS Clarity set tracking cookies, must gate behind opt-in.
