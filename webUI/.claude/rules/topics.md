---
paths:
  - "topics/**/*"
---

# Topic authoring rules

Loaded when working inside `topics/`. One subject's pages.

## spec.json is the source of truth

Article and calculator both read it. Never copy a dataset, parameter range, or default into the HTML. Article says "5 points, linear fit" -> those numbers come from spec.json, so the demo below cannot drift.

Shape:

```json
{
  "slug": "interpolation",
  "name": "Linear Interpolation",
  "pages": {
    "blog": "/interpolate_blog",
    "calculator": "/interpolate_cal"
  },
  "blog":       { "title": "<~60 char, question-shaped>", "description": "<~155 char, for search results>" },
  "calculator": { "title": "<~60 char>", "description": "<~155 char>" },
  "category": "numerical-methods",
  "difficulty": "intro",
  "prerequisites": [],
  "related": [],
  "levels": ["blog", "calculator"],
  "insight": "One sentence: what the reader leaves knowing. Shown on the home card.",
  "dataset": { "x": [], "y": [] },
  "parameters": [
    { "name": "method", "type": "enum", "values": ["linear"], "default": "linear" }
  ]
}
```

`name` — short, for the home card. `blog.title` is the long SEO one, too long for a card.
`pages` — public URL per level. Filenames are NOT derivable from slug (slug `interpolation`, file `interpolate_blog.html`), so declare them.
`levels` — which pages exist. Never assume three. Home renders one button per level; a level with no `pages` entry is skipped.

## Register the topic

Add the slug to `topics/topics.json`. Not there = invisible on home. No build step, so nothing discovers the folder on its own.

## Validation

`test_in_data.md` / `test_out_data.md` in the topic folder. Paste input, diff output, must match within tolerance. Never validate by eye.

No `fixture.json`, no `tools/fixtures/`, no Python generator — that plan was dropped.

## Page metadata

Static in the page. Crawlers index without running JS, so a JS-only title is invisible on first crawl. This bit us once already — both pages shipped titleless.

Every topic page carries, copied verbatim from `spec.json`:

```html
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="index, follow">
<link rel="canonical" href="https://ryuora144.duckdns.org/<public-url>">
<title>…</title>
<meta name="description" content="…">
<meta property="og:type|og:url|og:title|og:description" …>
<meta name="twitter:card|twitter:title|twitter:description" …>
<script type="application/ld+json">…</script>   <!-- Article for blog, WebApplication for calculator -->
```

`seo.js` still runs and syncs from spec.json:

```html
<script src="/src/shell/seo.js" data-slug="interpolation" data-level="blog"></script>
```

`data-slug` is required — public URLs are rewritten (`/interpolate_blog`), so seo.js cannot read the slug from the path. It `console.warn`s when a static tag differs from spec.json. Fix the drift, never ignore it.

Analytics tags stay out of the page — shell only.

## Links

Internal links use public urls (`/interpolate_cal`, `/`), never `/topics/.../*.html`. Those raw paths are duplicate content and robots.txt disallows them; linking there wastes crawl budget and splits ranking signals.

## Sitemap

Add every new public url to `/sitemap.xml`. Hand-maintained — no build step generates it.

## Body text must carry the terms

A description promising "CSV, TSV, copy and paste" while the page never says those words is a mismatch Google discounts. Whatever the meta claims, the visible HTML has to back it up.

## CSS

Use `dev_basic/style.css` and its `:root` tokens. Component missing? `topics/<slug>/<slug>_style.css`, loaded after style.css, tokens only. Second topic needs the same pattern -> move to `dev_basic/style.css`, delete both copies.

## SEO targeting

Target the question, not the term. "Interpolation" loses to Wikipedia. "Why does cubic interpolation overshoot" is thin competition and is what a demo answers better than prose. `<h1>` matches that question.

## Analytics events

Register the topic's own events — slider moved, method switched, demo reset. Fire via `window.trackEvent(name, params)`; it no-ops until consent is granted.

Pageviews cannot tell a 4-second bounce from a 6-minute read. Engagement is the only feedback the author gets.
