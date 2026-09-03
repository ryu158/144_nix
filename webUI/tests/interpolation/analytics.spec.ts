import { test, expect, type Page } from '@playwright/test';
import { stubThirdParty, setConsent, collectConsoleErrors, preparePage } from '../helpers/page-setup';
import { pasteIntoGrid, waitForGrid, outputCell } from '../helpers/grid';
import { loadSpec } from '../helpers/spec';

/**
 * Consent gating, from the CLAUDE.md hard rules: analytics live in src/shell/
 * only, and GA4 stays behind an opt-in because it sets cookies.
 *
 * googletagmanager is stubbed by stubThirdParty, so gtag never really loads —
 * but analytics.ts still builds window.dataLayer and pushes into it, which is
 * exactly the boundary worth testing. Nothing leaves the browser.
 */

const spec = loadSpec('interpolation');
const CAL = spec.pages.calculator;

/** GA events as plain arrays. analytics.ts pushes `arguments`, which is array-like. */
async function gaEvents(page: Page): Promise<unknown[][]> {
  return page.evaluate(() =>
    ((window.dataLayer || []) as unknown[]).map(a => Array.from(a as ArrayLike<unknown>))
  );
}

async function runInterpolation(page: Page) {
  await waitForGrid(page, 'gridContainer');
  await pasteIntoGrid(page, 'gridContainer', '0\t0\n10\t10');
  await page.fill('#outputXMin', '0');
  await page.fill('#outputXMax', '10');
  await page.fill('#outputXInterval', '5');
  await page.click('#genRangeBtn');
  await expect(outputCell(page, 1, 1)).toHaveText('5');
}

test('with consent granted, interpolating reports one event with its query count', async ({ page }) => {
  await preparePage(page, 'granted');

  await page.goto(CAL);
  await runInterpolation(page);

  const events = (await gaEvents(page)).filter(e => e[0] === 'event');
  expect(events).toHaveLength(1);
  expect(events[0][1]).toBe('interpolate_run');
  expect(events[0][2]).toEqual({ query_count: 3 }); // x = 0, 5, 10
});

test('with consent granted, opening the manual reports one howto_open', async ({ page }) => {
  await preparePage(page, 'granted');

  await page.goto(CAL);
  await page.locator('details.how-to > summary').click();
  await expect(page.locator('.how-to-body')).toBeVisible();

  const events = (await gaEvents(page)).filter(e => e[0] === 'event');
  expect(events).toHaveLength(1);
  expect(events[0][1]).toBe('howto_open');
  // The panel is shared by both calculators, so it reports which one it is on.
  expect(events[0][2]).toEqual({ slug: spec.slug, level: 'calculator' });
});

test('hovering the manual open and shut still reports exactly one howto_open', async ({ page }) => {
  await preparePage(page, 'granted');

  await page.goto(CAL);

  // Hover fires on every pass of the pointer. One event per page load is the
  // honest signal - it says the manual was opened, not how twitchy the mouse is.
  for (let i = 0; i < 3; i++) {
    await page.locator('details.how-to > summary').hover();
    await expect(page.locator('.how-to-body')).toBeVisible();
    await page.mouse.move(5, 5);
    await expect(page.locator('.how-to-body')).toBeHidden();
  }

  const events = (await gaEvents(page)).filter(e => e[0] === 'event');
  expect(events).toHaveLength(1);
  expect(events[0][1]).toBe('howto_open');
});

test('with consent denied, nothing is reported at all', async ({ page }) => {
  await preparePage(page, 'denied');

  await page.goto(CAL);
  await runInterpolation(page);

  // trackEvent early-returns and loadGA never runs, so dataLayer is never built.
  expect(await page.evaluate(() => window.dataLayer === undefined)).toBe(true);
});

test('undecided visitors get the banner, and Accept stores the choice', async ({ page }) => {
  await stubThirdParty(page);
  const errors = collectConsoleErrors(page);

  await page.goto(CAL);

  const banner = page.getByText('This site uses cookies for analytics.');
  await expect(banner).toBeVisible();
  await expect(page.getByRole('button', { name: 'Accept' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Decline' })).toBeVisible();

  // Nothing is reported while the choice is still open.
  await runInterpolation(page);
  expect(await page.evaluate(() => window.dataLayer === undefined)).toBe(true);

  await page.getByRole('button', { name: 'Accept' }).click();
  await expect(banner).toBeHidden();
  expect(await page.evaluate(() => localStorage.getItem('consent'))).toBe('granted');

  expect(errors).toEqual([]);
});

test('opening the interpolation card on the home page reports it', async ({ page }) => {
  await preparePage(page, 'granted');

  await page.goto('/');
  const card = page.locator('.topic-item', { hasText: spec.name });
  await card.locator('.topic-toggle').click();

  const events = (await gaEvents(page)).filter(e => e[0] === 'event');
  expect(events).toHaveLength(1);
  expect(events[0][1]).toBe('topic_detail_open');
  expect(events[0][2]).toEqual({ slug: spec.slug });
});

for (const [level, url] of Object.entries(spec.pages)) {
  test(`${level}: carries no analytics tag of its own`, async ({ request }) => {
    const html = await (await request.get(url)).text();

    // Hard rule: analytics live in src/shell/ only, never page-level.
    expect(html).not.toContain('googletagmanager.com');
    expect(html).not.toContain('gtag(');
    expect(html).not.toContain('clarity');
    expect(html).toContain('/src/shell/analytics.js');
    expect(html).toContain('/src/shell/consent.js');
  });
}
