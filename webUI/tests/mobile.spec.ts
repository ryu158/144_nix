import { test, expect, type Page } from '@playwright/test';
import { preparePage } from './helpers/page-setup';
import { loadSpec, SECTION_ROOT } from './helpers/spec';
import { waitForGrid } from './helpers/grid';

/**
 * Narrow viewports.
 *
 * PC and large tablet are the reference layout; these assert that a phone gets
 * something usable rather than something unreachable. Before the 900px block in
 * dev_basic/style.css, `body { overflow: hidden }` plus `height: 100%` meant a
 * phone saw the header and could not scroll to the panels at all.
 *
 * The desktop half of this file is the important half: it is what proves the
 * media block is additive and changed nothing above the breakpoint.
 */

const spec = loadSpec('interpolation');
const CAL = spec.pages.calculator;
const ADV = spec.pages.advanced;
const BLOG = spec.pages.blog;

/** A common phone: iPhone 14 / Pixel-class logical pixels. */
const PHONE = { width: 390, height: 844 };
/** The desktop the rest of the suite runs at. */
const DESKTOP = { width: 1280, height: 900 };

async function boxOf(page: Page, selector: string) {
  const box = await page.locator(selector).boundingBox();
  expect(box, `${selector} has no box`).not.toBeNull();
  return box!;
}

/** Page-level horizontal overflow. A panel may scroll sideways; the page may not. */
async function pageScrollsSideways(page: Page): Promise<boolean> {
  return page.evaluate(() =>
    document.documentElement.scrollWidth > document.documentElement.clientWidth + 1
  );
}

for (const [name, url] of [['calculator', CAL], ['advanced', ADV]] as const) {

  test(`${name}: on a phone the page scrolls and the panels stack`, async ({ page }) => {
    await page.setViewportSize(PHONE);
    await preparePage(page);
    await page.goto(url);
    await waitForGrid(page, 'gridContainer');

    // The whole point: the column is taller than the viewport and reachable.
    const scrollable = await page.evaluate(() =>
      document.documentElement.scrollHeight > window.innerHeight
    );
    expect(scrollable, 'page does not scroll — the panels are unreachable').toBe(true);

    // Stacked, not side by side: each panel starts below the one before it.
    const input = await boxOf(page, '#gridContainer');
    const output = await boxOf(page, '#gridContainer_2');
    const chart = await boxOf(page, '#chartContainer');

    expect(output.y).toBeGreaterThanOrEqual(input.y + input.height - 1);
    expect(chart.y).toBeGreaterThanOrEqual(output.y + output.height - 1);
  });

  test(`${name}: on a phone every panel has real height`, async ({ page }) => {
    await page.setViewportSize(PHONE);
    await preparePage(page);
    await page.goto(url);
    await waitForGrid(page, 'gridContainer');

    // The trap this guards: calc-page.ts builds both grids with
    // viewportHeight: '100%', and 100% of an auto height is zero. A collapsed
    // grid still "exists" in the DOM, so only the height catches it.
    for (const id of ['gridContainer', 'gridContainer_2', 'chartContainer']) {
      const box = await boxOf(page, `#${id}`);
      expect(box.height, `#${id} collapsed`).toBeGreaterThan(150);
      expect(box.width, `#${id} has no width`).toBeGreaterThan(200);
    }

    // Cells painted, not just a sized empty box.
    expect(await page.locator('#gridContainer .gt-cell').count()).toBeGreaterThan(0);
    await expect(page.locator('#chartContainer canvas')).toHaveCount(1);
  });

  test(`${name}: on a phone the page itself never scrolls sideways`, async ({ page }) => {
    await page.setViewportSize(PHONE);
    await preparePage(page);
    await page.goto(url);
    await waitForGrid(page, 'gridContainer');

    expect(await pageScrollsSideways(page), 'page overflows horizontally').toBe(false);
  });

  test(`${name}: on a phone the how-to panel opens inside the viewport`, async ({ page }) => {
    await page.setViewportSize(PHONE);
    await preparePage(page);
    await page.goto(url);
    await waitForGrid(page, 'gridContainer');

    // Click, not hover: hover is gated behind (hover: hover) and (pointer: fine),
    // which a phone reports as neither.
    await page.locator('.how-to > summary').click();
    const body = await boxOf(page, '.how-to-body');

    expect(body.x).toBeGreaterThanOrEqual(0);
    expect(body.x + body.width).toBeLessThanOrEqual(PHONE.width + 1);
    expect(body.height).toBeLessThanOrEqual(PHONE.height);
    expect(await pageScrollsSideways(page), 'the open panel pushed the page wide').toBe(false);
  });

  test(`${name}: the desktop layout is untouched`, async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await preparePage(page);
    await page.goto(url);
    await waitForGrid(page, 'gridContainer');

    // Side by side, one row, in source order. This is what says the media block
    // is additive — it fails the moment a rule leaks above the breakpoint.
    const input = await boxOf(page, '#gridContainer');
    const output = await boxOf(page, '#gridContainer_2');
    const chart = await boxOf(page, '#chartContainer');

    expect(output.x).toBeGreaterThan(input.x);
    expect(chart.x).toBeGreaterThan(output.x);
    // Same row: their vertical centres line up.
    expect(Math.abs(output.y - input.y)).toBeLessThan(4);

    // The calculator still fills exactly one viewport and does not scroll.
    const scrolls = await page.evaluate(() =>
      document.documentElement.scrollHeight > window.innerHeight + 1
    );
    expect(scrolls, 'desktop calculator started scrolling').toBe(false);
  });
}

for (const [name, url] of [['home', SECTION_ROOT], ['umbrella', '/'], ['blog', BLOG]] as const) {
  test(`${name}: reads on a phone without sideways scroll`, async ({ page }) => {
    await page.setViewportSize(PHONE);
    await preparePage(page);
    await page.goto(url);

    expect(await pageScrollsSideways(page), 'page overflows horizontally').toBe(false);

    // The 720px centred column has to give way, not overflow. "Confirmed, don't
    // touch" item 6 is about that column; this is its narrow-viewport half.
    const main = await boxOf(page, '.topic-list, .post');
    expect(main.width).toBeLessThanOrEqual(PHONE.width);
  });
}

test('blog: figures shrink to the column instead of overflowing it', async ({ page }) => {
  await page.setViewportSize(PHONE);
  await preparePage(page);
  await page.goto(BLOG);

  // Fixed-ratio SVGs, seven of them. img { max-width: 100% } is what keeps them
  // in; without it each one would widen the page on its own.
  const imgs = page.locator('.post img');
  const count = await imgs.count();
  expect(count).toBeGreaterThan(0);

  for (let i = 0; i < count; i++) {
    const box = await imgs.nth(i).boundingBox();
    expect(box, `figure ${i} has no box`).not.toBeNull();
    expect(box!.width, `figure ${i} overflows`).toBeLessThanOrEqual(PHONE.width);
  }
});
