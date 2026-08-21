---
paths:
  - "topics/**/*"
---

# Topic rules

## spec.json = source of truth

Blog and cal both read it. Never copy a dataset, range, or default into HTML.

```json
{
  "slug": "interpolation",
  "name": "Interpolation",
  "pages": { "blog": "/interpolate_blog", "calculator": "/interpolate_cal" },
  "blog":       { "title": "<~60 char, question-shaped>", "description": "<~155 char>" },
  "calculator": { "title": "<~60 char>", "description": "<~155 char>" },
  "category": "numerical-methods",
  "difficulty": "intro",
  "prerequisites": [],
  "related": [],
  "levels": ["blog", "calculator"],
  "insight": "One sentence: what the reader leaves knowing. Shown on the home card.",
  "dataset": { "x": [], "y": [] },
  "parameters": [ { "name": "method", "type": "enum", "values": ["linear"], "default": "linear" } ]
}
```

`name` — short, home card. `blog.title` is the long SEO one, too long for a card.
`pages` — public URL per level. Filenames do NOT follow the slug (slug `interpolation`, file `interpolate_blog.html`), so declare them.
`levels` — which pages exist. Home renders one button per level. Level with no `pages` entry is skipped.

## Register

Add slug to `topics/topics.json`. Not there = invisible on home. No build step finds the folder on its own.

## Validate

`test_in_data.md` / `test_out_data.md` in the topic folder. Paste input, diff output, match within tolerance. Never by eye.

## Page head — static, copied verbatim from spec.json

Both pages shipped titleless once. Crawlers index without running JS.

```html
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="index, follow">
<link rel="canonical" href="https://ryuora144.duckdns.org/<public-url>">
<title>…</title>
<meta name="description" content="…">
<meta property="og:type|og:url|og:title|og:description" …>
<meta name="twitter:card|twitter:title|twitter:description" …>
<script type="application/ld+json">…</script>   <!-- Article for blog, WebApplication for cal -->
<script src="/src/shell/seo.js" data-slug="<slug>" data-level="blog"></script>
```

`data-slug` required — public URLs are rewritten, seo.js cannot read the slug from the path. It `console.warn`s on drift from spec.json. Fix the drift, never ignore.

No analytics tags in the page — shell only.

## SEO validate, in order

1. `curl <public-url> | grep '<title>'` — must be in RAW HTML. DevTools shows post-JS DOM and hides this.
2. Browser: title/description match spec.json, no `[seo]` warning in console, spec.json request 200.
3. Search Console > URL Inspection > Test Live URL. Request indexing.

Indexing takes days-weeks. Ranking weeks-months. Not instant.

## Links + sitemap

Internal links use public urls (`/interpolate_cal`, `/`), never `/topics/.../*.html` — duplicates, robots-disallowed, splits ranking.
Add every new public url to `/sitemap.xml`. Hand-maintained.
robots.txt must NOT block `/dev_basic/`, `/src/`, or topic JSON — Google renders before indexing.

## Body text carries the terms

Description promises "CSV, TSV, copy and paste"? The visible HTML must say those words. Mismatch gets discounted.

## Target the question, not the term

"Interpolation" loses to Wikipedia. "Why does cubic interpolation overshoot" is thin competition and a demo answers it better than prose. `<h1>` matches that question.

## Analytics events

Register the topic's own events — slider moved, method switched, reset. Fire `window.trackEvent(name, params)`; no-ops until consent granted.
Pageviews cannot tell a 4-second bounce from a 6-minute read. Engagement is the only feedback.
