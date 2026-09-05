import { test, expect } from '@playwright/test';
import { preparePage } from '../helpers/page-setup';
import { SECTION_ROOT } from '../helpers/spec';

/**
 * Home is the same centred 720px column as a blog page: the column moves, the
 * text inside does not. Every block in it must centre at the SAME width, or the
 * header, the topic rows and the dev section drift onto different left edges.
 */

const COLUMNS = ['.app-header', '.topic-list', '.dev-section'];

test('every block on home is centred in the viewport', async ({ page }) => {
  await preparePage(page);
  await page.setViewportSize({ width: 1400, height: 900 });
  await page.goto(SECTION_ROOT);

  const viewport = page.viewportSize()!.width;
  for (const sel of COLUMNS) {
    const box = (await page.locator(sel).boundingBox())!;
    const right = viewport - (box.x + box.width);
    expect(Math.abs(box.x - right), `${sel} must sit centred`).toBeLessThanOrEqual(2);
  }
});

test('the blocks share one left edge', async ({ page }) => {
  await preparePage(page);
  await page.setViewportSize({ width: 1400, height: 900 });
  await page.goto(SECTION_ROOT);

  const lefts: number[] = [];
  for (const sel of COLUMNS) {
    lefts.push((await page.locator(sel).boundingBox())!.x);
  }
  for (const left of lefts) {
    expect(Math.abs(left - lefts[0])).toBeLessThanOrEqual(1);
  }
});

test('the text inside stays left-aligned', async ({ page }) => {
  await preparePage(page);
  await page.goto(SECTION_ROOT);

  const align = await page.locator('.app-header h1')
    .evaluate(el => getComputedStyle(el).textAlign);
  expect(align).toBe('start');
});
