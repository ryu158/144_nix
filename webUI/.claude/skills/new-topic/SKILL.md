name: new-topic
description: Add or extend a topic. Use for requests like "add convolution", "start FFT", "build smoothing calculator", or "what's next?"

# New Topic

Goal: one `topics/<slug>/` folder. Finish current topic before next.

## 0. Check

Work inside `nix develop`.

Read: `CLAUDE.md`, `.claude/rules/topics.md` if present, 1-2 existing topics for pattern, `dev_basic/` for shared components, `src/shell/` (seo.js, consent.js, analytics.js).

No new dependencies.

## 1. Blog

Create `topics/<slug>/<slug>_blog.html`.

Static HTML, article text before JS. Start with reader's question. Core insight before formula. Confirm contents with user.

## 2. Calculator

Create `topics/<slug>/<slug>_cal.html` + JS (page.js, engine file).

Reuse `dev_basic/` components. Use design tokens, no raw colors. Debug.

## 3. Validate

Test `<slug>_cal.html` against `topics/<slug>/test_in_data.md` / `test_out_data.md`. Exact match within tolerance. Never validate by eye. Debug.

## 4. Spec + register

Update `topics/<slug>/spec.json`: `slug`, `name` (short, for home card), `pages` (public URL per level), `levels`, blog/calculator title+description, `insight`, dataset, parameters, related.

Add slug to `topics/topics.json`. Skip this = topic invisible on home.

Confirm the card renders on index.html.

## 5. SEO

Static tags in each page, copied verbatim from spec.json — viewport, robots, canonical, `<title>`, meta description, og:, twitter:, JSON-LD. Crawlers do not run JS; a JS-only title is invisible. See `.claude/rules/topics.md` for the full block.

Then wire `src/shell/seo.js` to sync, `data-slug` required:

```html
<script src="/src/shell/seo.js" data-slug="<slug>" data-level="blog"></script>
```

Add both public urls to `/sitemap.xml`.

Internal links use public urls, never `/topics/.../*.html`.

Validate:
- `curl <public-url> | grep '<title>'` — must be in RAW HTML. DevTools shows post-JS DOM and hides this failure.
- Browser: no `[seo]` drift warning in console, spec.json request 200.
- Body text actually contains the terms the description promises.

## 6. Analytics

Wire through `src/shell/analytics.js` + `consent.js`: GA4 event on topic interaction. Validate: consent banner works, event fires, no reappear on reload.

## Always

No hardcoded topic list. No topic-level colors/fonts/spacing. No new deps. One topic at a time. `src/shell/` change -> tell user first.
