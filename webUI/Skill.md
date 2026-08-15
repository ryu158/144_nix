---
name: new-topic
description: Use when adding a new topic to the explainer site, or building any page for an existing topic — blog, calculator, or advanced. Covers the full sequence from writing the spec through verifying the math and publishing. Trigger on requests like "add a topic on convolution", "start the FFT topic", "build the calculator page for smoothing", or "what's next on this topic".
---

# Adding a topic

The per-topic workflow, in order. Do not skip ahead to generating HTML — steps 1 and 2
are what keep the article and the demo from disagreeing with each other.

## 1. Write the spec

Create `topics/<slug>/spec.json` (schema in `.claude/rules/topics.md`).

Settle these before writing any prose:

- **The insight.** One sentence naming what the reader should leave knowing. If it can't
  be written in one sentence, the topic is really two topics.
- **The dataset.** Small enough to reason about by eye — 5 to 12 points for most topics.
  It appears in both the article's figures and the calculator's default state.
- **The parameters.** Name, type, range, default. These become the sliders.
- **Which levels exist.** Most topics need only `blog` and `calculator`. Add `advanced`
  only when there is genuinely more to say, not to fill the shape.

Confirm the spec with the author before continuing. Everything downstream depends on it.

## 2. Build the numeric reference

Write `tools/fixtures/<slug>.py` using NumPy/SciPy to compute expected outputs for the
spec's dataset across the parameter range. Run it to produce `topics/<slug>/fixture.json`.

This must be an independent implementation. Never generate the fixture from the
TypeScript that will later be tested against it.

## 3. Blog page

Draft `blog.md`, then revise with the author until satisfied.

- Open with the searchable question, not the definition.
- State the insight in plain language before any formula.
- Every figure references the spec's dataset.
- The prose must stand alone as a useful explanation with JavaScript disabled.

## 4. Calculator page

Implement `calculator.ts` against the spec.

- Import plotting and controls from `src/kit/`; pass semantic roles, never raw colors.
- Write the test asserting output matches `fixture.json` within tolerance.
- Run `npm run test` — a passing eye check is not a passing test.
- Register the topic's analytics events.

## 5. Advanced page

Only if `levels` includes it. Same rules as the blog page.

## 6. Cross-link and extract

- Fill in `related` in the spec; verify generated navigation picks up every level.
- Review what was written inside this topic that a **second** topic now also needs.
  Extract those to `src/kit/` and update the earlier topic to import the extracted
  version. Nothing moves to the kit on its first use.

## 7. Verify

Run `npm run verify`. Then, **for the first topic only**, confirm the shell works end to
end — after that it is proven and this check is not repeated:

- Search Console shows the page indexed with no coverage errors
- Rich Results Test validates the structured data
- Pasting the URL into a chat app renders the social preview correctly
- A real visit in a private window produces a pageview **and** a slider event

## Done when

All pages read from one spec, the calculator matches the fixture, the explanation
survives JavaScript being disabled, and the topic appears in navigation and sitemap
without anyone having edited a list.
