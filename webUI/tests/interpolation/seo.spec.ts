import { test, expect } from '@playwright/test';
import { preparePage } from '../helpers/page-setup';
import { loadSpec, meta, CANONICAL_ORIGIN } from '../helpers/spec';

/**
 * The SEO contract from .claude/rules/topics.md, automated for both levels.
 *
 * Every expectation is read out of spec.json — the source of truth — never
 * copied from the HTML. Asserting the page against itself would prove nothing,
 * and drift between the two is exactly what seo.ts warns about.
 *
 * The raw-HTML half matters most: crawlers do not run JS, and both pages
 * shipped titleless once already.
 */

const spec = loadSpec('interpolation');

const LD_TYPE: Record<string, string> = {
  blog: 'Article', calculator: 'WebApplication', advanced: 'WebApplication'
};

function decode(s: string): string {
  return s
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#0?39;/g, "'");
}

function tagContent(html: string, attr: 'name' | 'property', key: string): string | null {
  const m = html.match(new RegExp(`<meta\\s+${attr}="${key}"\\s+content="([^"]*)"`, 'i'));
  return m ? decode(m[1]) : null;
}

for (const level of spec.levels) {
  const url = spec.pages[level];
  const expected = meta(spec, level);

  test(`${level}: raw HTML carries the spec.json tags, before any JS runs`, async ({ request }) => {
    const res = await request.get(url);
    expect(res.status()).toBe(200);
    const html = await res.text();

    const title = html.match(/<title>([\s\S]*?)<\/title>/i);
    expect(title, 'page must have a <title> in the raw HTML').not.toBeNull();
    expect(decode(title![1])).toBe(expected.title);

    expect(tagContent(html, 'name', 'description')).toBe(expected.description);

    const canonical = html.match(/<link\s+rel="canonical"\s+href="([^"]*)"/i);
    expect(canonical![1]).toBe(`${CANONICAL_ORIGIN}${url}`);

    expect(tagContent(html, 'property', 'og:title')).toBe(expected.title);
    expect(tagContent(html, 'property', 'og:description')).toBe(expected.description);
    expect(tagContent(html, 'property', 'og:url')).toBe(`${CANONICAL_ORIGIN}${url}`);
    expect(tagContent(html, 'property', 'og:type')).toBeTruthy();

    expect(tagContent(html, 'name', 'twitter:card')).toBeTruthy();
    expect(tagContent(html, 'name', 'twitter:title')).toBe(expected.title);
    expect(tagContent(html, 'name', 'twitter:description')).toBe(expected.description);

    expect(html).toMatch(/<meta\s+name="robots"\s+content="index, follow">/i);

    const ld = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/i);
    expect(ld, 'page must carry JSON-LD').not.toBeNull();
    const parsed = JSON.parse(ld![1]);
    expect(parsed['@type']).toBe(LD_TYPE[level]);
    expect(parsed.description).toBe(expected.description);
  });

  test(`${level}: seo.ts syncs from spec.json without a drift warning`, async ({ page }) => {
    const errors = await preparePage(page);

    await page.goto(url);
    await expect(page).toHaveTitle(expected.title);
    await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', expected.description);

    // seo.ts console.warns on any drift between the static tag and spec.json.
    expect(errors.filter(e => e.includes('[seo]'))).toEqual([]);
    expect(errors).toEqual([]);
  });
}

test('spec.json is fetchable — seo.ts and the home page both depend on it', async ({ request }) => {
  const res = await request.get(`/scientific_cal/topics/${spec.slug}/spec.json`);
  expect(res.status()).toBe(200);
  expect(await res.json()).toMatchObject({ slug: spec.slug });
});

test('sitemap.xml lists every public URL the spec declares', async ({ request }) => {
  const xml = await (await request.get('/sitemap.xml')).text();
  for (const level of spec.levels) {
    expect(xml, `sitemap is missing ${level}`).toContain(`${CANONICAL_ORIGIN}${spec.pages[level]}`);
  }
  // Never the raw paths — they duplicate the pretty URLs and split ranking.
  // Only <loc> values count; the file's own comments mention topics/ folders.
  const locs = [...xml.matchAll(/<loc>([^<]*)<\/loc>/g)].map(m => m[1]);
  expect(locs.length).toBeGreaterThan(0);
  expect(locs.filter(l => l.includes('/scientific_cal/topics/'))).toEqual([]);
});

test('robots.txt blocks the duplicate raw HTML but not the render assets', async ({ request }) => {
  const txt = await (await request.get('/robots.txt')).text();
  expect(txt).toContain('Disallow: /scientific_cal/topics/*/*.html');
  // Google renders before indexing: blocking these would break the render.
  expect(txt).not.toMatch(/^Disallow:\s*\/scientific_cal\/dev_basic/m);
  expect(txt).not.toMatch(/^Disallow:\s*\/scientific_cal\/src/m);
  expect(txt).toContain(`Sitemap: ${CANONICAL_ORIGIN}/sitemap.xml`);
});

test('the calculator body says the words its description promises', async ({ page }) => {
  await preparePage(page);
  await page.goto(spec.pages.calculator);

  // rules/topics.md: a description promising "CSV, TSV, copy and paste" is
  // discounted unless the visible text actually says them.
  const body = (await page.locator('body').innerText()).toLowerCase();
  for (const term of ['csv', 'tsv', 'copy and paste']) {
    expect(body, `body text must contain "${term}"`).toContain(term);
  }
});
