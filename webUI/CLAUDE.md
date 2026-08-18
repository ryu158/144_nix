Small static site: interactive explainers for computational math/science.

Stack
Static HTML + vanilla JS/TS. No framework, bundler, or build step.
src/shell/ — global layout, SEO, analytics, nav. Rarely touch.
src/kit/ — shared components, math utils, design tokens.
topics/<slug>/ — self-contained topic:
spec.json — metadata/dataset/parameters/formula
fixture.json — trusted numeric results
blog.md — article
calculator.ts — interactive demo
advanced.md — optional
tools/fixtures/ — fixture generators.
flake.nix provides Node/Python. Always work inside nix develop.
No npm install, pip install, dnf, or global installs.
HARD RULES
Topics are data-driven.
Never hardcode topic lists. Discover topics from topics/*/spec.json.
Use design tokens.
Never hardcode colors, fonts, or spacing in topics. Use src/kit/tokens.ts.
Static-first.
Article/explanation text must exist in HTML before JS runs. JS adds interaction only.
Trust fixtures.
Every calculator must match fixture.json within tolerance.
Never validate math only by visual inspection.
Extract on second use.
First use: keep code in the topic.
Second real use: move it to src/kit/.
No speculative abstractions.
Shell is global.
Before changing src/shell/, explicitly tell the user. Shell changes affect every page.
SEO/analytics belong in shell.
Topic provides only title, description, and social image via spec.json.
No page-level meta, analytics, or ads.
One topic at a time.
Finish the current topic before starting another.
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
Start with the reader's real question.
One core insight per page; state it early.
Explain in plain English, derive afterward.
Demo supports the explanation; it must not replace it.
Silently fix English grammar while preserving technical meaning.
Ask when technical intent is ambiguous.
Deferred

Do not implement monetization, ads, affiliate links, consent banners, Ko-fi, Carbon Ads, AdSense, or Amazon.

Analytics is allowed only in src/shell/.