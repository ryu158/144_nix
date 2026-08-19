# HANDOVER

Current status only. Not history — daily detail in .claude/log/.

## Reality
Static HTML/JS, no build step. dev_basic/ = shared components. src/shell/ = seo.js, consent.js, analytics.js. No blog.md/calculator.ts (skipped, no build pipeline).
Scope: work only inside webUI/.

## topics/interpolation — 6-step workflow done
1. blog.html - done
2. cal.html - done, fixed dead plotBtn crash (broke auto-replot)
3. Validated - user pasted test_in_data, output exact match vs test_out_data.md
4. spec.json - confirmed, split into blog/calculator title+description
5. SEO - seo.js injects title/meta from spec.json per page
6. Analytics - GA4 (G-R11GZ5HTXE) + consent banner, trackEvent('interpolate_run'), tested OK

## Open bug
GA4 console: "not activated for data acquisition" despite DevTools working. Not fixed.
Next: check Network tab for `collect` request (not just gtag.js load) -> test incognito/no adblock -> GA4 DebugView with debug_mode:true -> confirm Measurement ID matches.

## Not done
- MS Clarity (later, GA4 first)
- test_data.csv (orphaned, keep/delete undecided)
- .claude/skills/new-topic/SKILL.md is stale (references fixture.json/calculator.ts/src/kit, all gone). Fix when next used.

## Confirmed, don't touch
- Hardcoded nav/colors in interpolation pages - intentional, not a cleanup target
- Ko-fi widget - keep, exempted from monetization ban

## Repo layout (2026-08-18)
Topics.md -> .claude/rules/topics.md
Skill.md -> .claude/skills/new-topic/SKILL.md
claude_log/ -> .claude/log/, HANDOVER.md -> .claude/HANDOVER.md
CLAUDE.md, Claude.local.md stay at root (required).

## Next
No new topic picked yet. One topic at a time.
