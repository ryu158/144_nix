name: new-topic
description: Add or extend a topic. Use for requests like "add convolution", "start FFT", "build smoothing calculator", or "what's next?"

# New Topic

**Goal:** one topic = one `topics/<slug>/` folder. Complete it before starting another.

## 0. Check

Work inside `nix develop`.

Read:

* `CLAUDE.md`
* `.claude/rules/topics.md` if present
* existing `src/kit/` components
* 1–2 existing topics for patterns

Do not add dependencies.

## 1. Spec — FIRST

Create:

`topics/<slug>/spec.json`

Define:

* `insight` — one sentence
* `dataset` — usually 5–12 points
* `parameters` — name, type, range, default
* `levels` — usually `blog`, `calculator`; add `advanced` only if needed
* metadata: title, description, social image
* `related`

**Stop and confirm the spec with the author before continuing.**

Everything else must use this spec.

## 2. Numeric Fixture

Create:

`tools/fixtures/<slug>.py`

Use independent NumPy/SciPy calculations.

Generate:

`topics/<slug>/fixture.json`

Rules:

* Fixture must NOT use the TypeScript implementation.
* Cover representative parameter values/ranges.
* Fixture is the numeric authority.

## 3. Blog

Create:

`topics/<slug>/blog.md`

Rules:

* Start with the question readers search for.
* State the core insight before formulas.
* Use the spec dataset.
* Explanation must work with JavaScript disabled.
* Keep one core idea per page.
* Preserve technical meaning; silently fix English.

## 4. Calculator

Create:

`topics/<slug>/calculator.ts`

Rules:

* Follow the spec exactly.
* Reuse `src/kit/`.
* Use semantic roles/tokens, never raw colors.
* Test numerical output against `fixture.json` within tolerance.
* Never trust visual similarity alone.
* Add analytics events through the existing shell/kit mechanism.

**Do not invent a build/test command. Use the project's actual verification method.**

## 5. Advanced

Only if `levels` contains `advanced`.

Create:

`topics/<slug>/advanced.md`

Same writing rules as `blog.md`.

## 6. Cross-links / Extraction

* Set `related` in `spec.json`.
* Verify generated navigation, homepage, sitemap, and links discover the topic automatically.
* Never edit a topic list manually.
* If a component is needed by a second topic, extract it to `src/kit/`.
* Do not abstract first-use code.

## 7. Verify

Check:

* `spec.json` is valid.
* Fixture is reproducible.
* Calculator matches fixture within tolerance.
* HTML contains the explanation without JS.
* Navigation discovers the topic.
* Sitemap discovers the topic.
* No hardcoded topic list.
* No topic-level colors/fonts/spacing.
* No new dependency.
* Open the HTML/page and manually test interaction.
* If `src/shell/` changed, explicitly report it.

For the first topic only, also verify the existing shell/SEO/analytics/social-preview setup end-to-end.

## Done

A topic is complete when:

`spec → fixture → article → calculator → links → verification`

all agree, and adding the topic required **no manual topic-list edits**.

