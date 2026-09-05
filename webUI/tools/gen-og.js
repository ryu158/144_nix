/**
 * Generate the og:image cards — the picture a link shows when it is pasted into
 * Slack, X, KakaoTalk or LinkedIn.
 *
 * Run it:
 *   gen-og-images            # flake devShell script
 *   node tools/gen-og.js     # equivalent, needs PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
 *
 * Output: og/*.png at the repo root, 1200x630, beside the favicons. Those are
 * the same class of asset — site metadata rather than a section's content — and
 * one of the five belongs to the root umbrella page, which is in no section.
 *
 * Kept in the repo, unlike the throwaway that made favicon.ico. Card text comes
 * from spec.json, so a title change means re-running one command; a script that
 * only exists in a log entry cannot be re-run.
 *
 * Same browser the test suite uses: the Nix chromium, never a downloaded one.
 */

const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('@playwright/test');

const REPO_ROOT = path.resolve(__dirname, '..');
const OUT_DIR = path.join(REPO_ROOT, 'og');

const WIDTH = 1200;
const HEIGHT = 630;

/** The favicon's teal, and .teal-button-link's ground. */
const TEAL = '#21c2b5';

/**
 * The mark, lifted verbatim from favicon.svg so the two cannot diverge:
 * known points, and a curve estimating what sits between them.
 */
const MARK = `
  <svg viewBox="0 0 32 32" width="150" height="150" aria-hidden="true">
    <path d="M6 23 C 11 23, 11 9, 16 9 S 21 23, 26 23"
          fill="none" stroke="#ffffff" stroke-width="2.6" stroke-linecap="round"/>
    <circle cx="6" cy="23" r="3.4" fill="#ffffff"/>
    <circle cx="16" cy="9" r="3.4" fill="#ffffff"/>
    <circle cx="26" cy="23" r="3.4" fill="#ffffff"/>
  </svg>`;

const DOMAIN = 'ryuora144.duckdns.org';

function loadSpec(slug) {
  const p = path.join(REPO_ROOT, 'scientific_cal', 'topics', slug, 'spec.json');
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

/**
 * What to draw, in order.
 *
 * The first two are written out here rather than read from a file: a section has
 * no spec.json, and inventing a sections.json to hold two strings would be a
 * data-driven list of two entries. Topic levels DO come from spec.json — those
 * are the ones that drift.
 */
function cards() {
  const spec = loadSpec('interpolation');
  const SECTION = 'Scientific Calculators';

  // Every card has the same three slots: a kicker naming what this page sits
  // inside, the title, and the domain. The two site-level pages sit inside
  // nothing, so their kicker is empty - but the line still takes its height, so
  // all five share one geometry and the domain never moves.
  const out = [
    { file: 'site.png', kicker: '', title: 'Interactive Tools for Computational Work' },
    { file: 'scientific_cal.png', kicker: '', title: SECTION }
  ];

  for (const level of spec.levels) {
    const meta = spec[level] || {};
    // `card` is the short title. Falling back to `title` would put a 120-char
    // SEO string on a 1200px card, so a missing one is an error, not a default.
    if (!meta.card) {
      throw new Error(`spec.json: ${spec.slug}.${level} has no "card" title`);
    }
    out.push({
      file: `${spec.slug}_${level}.png`,
      kicker: SECTION,
      title: meta.card
    });
  }
  return out;
}

function html(card) {
  // Inline everything: this page is rendered from a data: URL and loads nothing.
  return `<!DOCTYPE html>
<meta charset="utf-8">
<style>
  * { box-sizing: border-box; margin: 0; }
  body {
    width: ${WIDTH}px; height: ${HEIGHT}px;
    background: ${TEAL};
    display: flex; flex-direction: column; justify-content: space-between;
    padding: 74px 80px;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif;
    color: #ffffff;
  }
  .kicker {
    font-size: 30px; font-weight: 600; letter-spacing: 0.04em;
    opacity: 0.82;
    /* Reserved even when empty: an absent kicker must not slide the title up
       and break the shared geometry. */
    min-height: 36px;
  }
  h1 {
    font-size: 84px; font-weight: 700; line-height: 1.1;
    letter-spacing: -0.02em;
    /* The longest card is the umbrella's 40 characters. Anything longer wraps
       rather than overflows, which is why nothing here is absolutely placed. */
    max-width: 900px;
  }
  .foot { display: flex; align-items: flex-end; justify-content: space-between; }
  .domain { font-size: 26px; opacity: 0.75; }
</style>
<div class="kicker">${card.kicker}</div>
<h1>${card.title}</h1>
<div class="foot">
  <span class="domain">${DOMAIN}</span>
  ${MARK}
</div>`;
}

async function main() {
  const list = cards();
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;
  const browser = await chromium.launch({
    ...(executablePath ? { executablePath } : {}),
    args: ['--no-sandbox']
  });
  const page = await browser.newPage({
    viewport: { width: WIDTH, height: HEIGHT },
    // 1 device pixel per CSS pixel: the card IS 1200x630, and og:image:width
    // says so. A 2x shot would make the tag a lie.
    deviceScaleFactor: 1
  });

  for (const card of list) {
    await page.setContent(html(card), { waitUntil: 'load' });
    const file = path.join(OUT_DIR, card.file);
    await page.screenshot({ path: file, type: 'png' });
    const kb = (fs.statSync(file).size / 1024).toFixed(1);
    console.log(`  og/${card.file.padEnd(30)} ${WIDTH}x${HEIGHT}  ${kb} KB  "${card.title}"`);
  }

  await browser.close();
  console.log(`\n${list.length} cards written to og/`);
}

main().catch(err => {
  console.error(err.message);
  process.exit(1);
});
