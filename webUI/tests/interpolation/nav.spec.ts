import { test, expect } from '@playwright/test';
import { preparePage } from '../helpers/page-setup';
import { loadSpec, CANONICAL_ORIGIN } from '../helpers/spec';

const spec = loadSpec('interpolation');
const BLOG = spec.pages.blog;
const CAL = spec.pages.calculator;

test('calculator links across to the blog', async ({ page }) => {
  await preparePage(page);
  await page.goto(CAL);

  await page.getByRole('link', { name: /interpolation/i }).first().click();
  await expect(page).toHaveURL(new RegExp(`${BLOG}$`));
  await expect(page.locator('article.post h1')).toHaveText('Linear Interpolation');
});

test('blog links across to the calculator', async ({ page }) => {
  await preparePage(page);
  await page.goto(BLOG);

  await page.getByRole('link', { name: /try the calculator/i }).click();
  await expect(page).toHaveURL(new RegExp(`${CAL}$`));
  await expect(page.locator('h1')).toHaveText('Interpolate Calculator');
});

for (const [level, url] of Object.entries(spec.pages)) {
  test(`${level} links home`, async ({ page }) => {
    await preparePage(page);
    await page.goto(url);

    await page.getByRole('link', { name: /home/i }).click();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.locator('#topicList .topic-item')).not.toHaveCount(0);
  });
}

test('the home row is built from spec.json, not hardcoded', async ({ page }) => {
  await preparePage(page);
  await page.goto('/');

  const card = page.locator('.topic-item', { hasText: spec.name });
  await expect(card.locator('.topic-name')).toHaveText(spec.name);

  // One button per declared level, pointing at the declared public URL.
  for (const level of spec.levels) {
    await expect(card.locator(`a[href="${spec.pages[level]}"]`)).toHaveCount(1);
  }

  // The insight toggle reveals spec.json's insight sentence.
  await expect(card.locator('.topic-detail')).toBeHidden();
  await card.locator('.topic-toggle').click();
  await expect(card.locator('.topic-detail')).toContainText(spec.insight);
});

for (const [level, url] of Object.entries(spec.pages)) {
  test(`${level}: internal links use public URLs, never the raw topic HTML`, async ({ page }) => {
    await preparePage(page);
    await page.goto(url);

    const hrefs = await page.locator('a[href]').evaluateAll(
      els => els.map(el => el.getAttribute('href') || '')
    );

    const internal = hrefs.filter(h => h.startsWith('/'));
    expect(internal.length).toBeGreaterThan(0);

    // Exception: the 🪄Advanced button is a placeholder pointing at this page's
    // own raw path until the advanced level exists. Known, listed under
    // "Not done" in .claude/HANDOVER.md. Every other link must obey the rule.
    const ADVANCED_PLACEHOLDER = '/topics/interpolation/interpolate_cal.html';
    const offenders = internal.filter(h => h.includes('/topics/') && h !== ADVANCED_PLACEHOLDER);
    expect(offenders, 'internal links must use the public URLs from spec.json').toEqual([]);
  });
}

test('the raw topic HTML still serves, and points back at its public URL', async ({ request }) => {
  const res = await request.get('/topics/interpolation/interpolate_cal.html');
  expect(res.status()).toBe(200);
  // robots.txt keeps it out of the index; the canonical tag makes sure any
  // crawler that gets here anyway is sent to the pretty URL.
  expect(await res.text()).toContain(`<link rel="canonical" href="${CANONICAL_ORIGIN}${CAL}">`);
});

test('a junk URL under the topic 404s instead of serving a page', async ({ request }) => {
  expect((await request.get('/interpolate_nope')).status()).toBe(404);
  expect((await request.get('/topics/interpolation/nope.html')).status()).toBe(404);
});
