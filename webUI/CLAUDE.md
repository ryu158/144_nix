Every English message I send: show a corrected version first, then answer. Answer short — essential only, 'cave man' style.
Write every Claude-setting .md the same way (CLAUDE.md, .claude/log/, HANDOVER.md, rules/, skills/). Essential only.

Small static site: interactive explainers for computational math/science.

Work only inside webUI/. No write/modify/exec outside. Read outside = last resort, rare.

Stack
Static HTML + vanilla JS. No framework, bundler, build step. Pages are hand-written HTML.
nginx root IS this repo. Edit = live. No deploy step.
flake.nix gives Node/Python. Always inside `nix develop`. No npm/pip/dnf/global installs.

Map
index.html + home.js — home. Renders rows from topics/topics.json -> each spec.json.
src/shell/ — seo.js, consent.js, analytics.js. Global. Tell user before touching.
dev_basic/ — shared components (chart.js, dual-chart.js, grid.js, ads.js, bmc.js) + style.css. Tokens in :root.
topics/topics.json — slug list. Not listed = invisible on home.
topics/<slug>/ — spec.json, <slug>_blog.html, <slug>_cal.html + its .js, test_in_data.md / test_out_data.md, optional <slug>_style.css.

New topic or new level -> skill `new-topic`.
Topic detail (spec.json shape, SEO block, validation) -> .claude/rules/topics.md.

HARD RULES
Topics are data-driven — never hardcode a topic list.
Design tokens only — no raw colors/fonts/spacing in topics. Exception: user-confirmed temp adjustment, not a cleanup target.
Topic CSS — missing component goes in topics/<slug>/<slug>_style.css, loaded after style.css, tokens only. Second topic needs it -> move to dev_basic/style.css, delete both copies.
Extract on second use — first use stays in the topic. No speculative abstraction.
Static-first — article text in HTML before JS runs. JS adds interaction only.
SEO tags static in the page — crawlers do not run JS. spec.json is the source of truth, seo.js warns on drift. Copy strings, never invent.
Trust validation data — cal must match test_out_data given test_in_data, within tolerance. Never validate by eye.
Shell is global — tell user before changing src/shell/.
Analytics live in src/shell/ only — never page-level.
One topic at a time.
No new dependencies without permission.

Visual grammar
Shape carries meaning. Color from chart.js palette (options.colors) or style.css :root tokens. No --c-* tokens exist.
Original data — solid dots
Computed result — solid line
Ground truth — dashed line
Discarded — same color, 30% opacity
Active parameter — --accent
Same series keeps one color across layers. Never invent topic colors.

Writing
Start with the reader's real question. One core insight, stated early. Plain English first, derive after. Demo supports the words, does not replace them. Silently fix English grammar, keep technical meaning. Ask when technical intent is unclear.

Deferred
No monetization/ads/affiliate/AdSense/Amazon. Ko-fi allowed, no approval needed.
Consent banner required, not deferred — GA4/Clarity set cookies, must gate behind opt-in.
