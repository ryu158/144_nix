---
name: new-topic
description: Add a new topic or a new level to an existing topic. Use for "add convolution", "start FFT", "build smoothing calculator", "add advanced page", "what's next?".
---

# New Topic

One `topics/<slug>/` folder. Finish current topic before next. Work inside `nix develop`. No new deps.

Detail for every step below: `.claude/rules/topics.md`. Do not restate it here.

## 0. Read

`CLAUDE.md`, `.claude/rules/topics.md`, one existing topic for pattern, `dev_basic/` components, `src/shell/`.

## 1. Blog

`topics/<slug>/<slug>_blog.html`. Static text before JS. Reader's question first, insight before formula. Confirm contents with user.

## 2. Calculator

`topics/<slug>/<slug>_cal.html` + its JS. Reuse `dev_basic/`. Tokens only, no raw colors. Debug.

## 3. Validate

Run cal against `test_in_data.md` / `test_out_data.md`. Match within tolerance. Never by eye. Debug.

## 4. Spec + register

Fill `spec.json`. Add slug to `topics/topics.json`. Confirm the card renders on index.html.

## 5. SEO

Static head tags in both pages, wire `seo.js` with `data-slug`, add urls to `sitemap.xml`.
Validate with `curl | grep '<title>'` FIRST — DevTools hides a missing title.

## 6. Analytics

GA4 event on topic interaction via `window.trackEvent`. Check consent banner, event fires, no reappear on reload.
