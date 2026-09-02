import { test, expect } from '@playwright/test';
import { preparePage } from '../helpers/page-setup';
import { loadSpec } from '../helpers/spec';

/**
 * The article is a centred column of left-aligned text. Two separate things,
 * and the easy regression is to conflate them — centring the text instead of
 * the column, or dropping the auto margins and pinning the column left.
 */

const spec = loadSpec('interpolation');
const BLOG = spec.pages.blog;

test('the article column is centred in the viewport, header with it', async ({ page }) => {
  await preparePage(page);
  await page.setViewportSize({ width: 1400, height: 900 });
  await page.goto(BLOG);

  const viewport = page.viewportSize()!.width;
  for (const sel of ['article.post', '.app-header']) {
    const box = (await page.locator(sel).boundingBox())!;
    const left = box.x;
    const right = viewport - (box.x + box.width);
    expect(Math.abs(left - right), `${sel} must sit centred`).toBeLessThanOrEqual(2);
  }
});

test('the text inside stays left-aligned', async ({ page }) => {
  await preparePage(page);
  await page.goto(BLOG);

  const align = await page.locator('article.post p').first()
    .evaluate(el => getComputedStyle(el).textAlign);
  expect(align).toBe('start');
});

test('header and article share the same left edge', async ({ page }) => {
  await preparePage(page);
  await page.setViewportSize({ width: 1400, height: 900 });
  await page.goto(BLOG);

  const header = (await page.locator('.app-header').boundingBox())!;
  const article = (await page.locator('article.post').boundingBox())!;
  expect(Math.abs(header.x - article.x)).toBeLessThanOrEqual(1);
});
