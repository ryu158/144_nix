import { test, expect } from '@playwright/test';
import { preparePage } from '../helpers/page-setup';
import { loadSpec } from '../helpers/spec';

/**
 * The "How to use this" panel on the calculator.
 *
 * The point of the component is that it costs one line closed and floats when
 * open, so the grids below never move. That is what the geometry test guards —
 * a regression to normal flow would resize them and still look fine by eye.
 */

const spec = loadSpec('interpolation');
const CAL = spec.pages.calculator;

const PANEL = '.how-to-body';
const SUMMARY = 'details.how-to > summary';

test('closed on arrival — the manual does not greet a returning user', async ({ page }) => {
  await preparePage(page);
  await page.goto(CAL);

  await expect(page.locator('details.how-to')).not.toHaveAttribute('open', /.*/);
  await expect(page.locator(PANEL)).toBeHidden();
});

test('the summary carries the words spec.json promises, before anything is opened', async ({ page }) => {
  await preparePage(page);
  await page.goto(CAL);

  // rules/topics.md: the description's terms must be VISIBLE. A closed <details>
  // hides its body, so these words have to live in the summary itself.
  const summary = (await page.locator(SUMMARY).innerText()).toLowerCase();
  for (const term of ['csv', 'tsv', 'copy and paste']) {
    expect(summary, `summary must contain "${term}"`).toContain(term);
  }
});

test('opening it reveals the manual', async ({ page }) => {
  await preparePage(page);
  await page.goto(CAL);

  await page.locator(SUMMARY).click();
  await expect(page.locator(PANEL)).toBeVisible();
  await expect(page.locator(PANEL)).toContainText('Paste your data');
});

test('the manual opens with what the site is for, and points at the article', async ({ page }) => {
  await preparePage(page);
  await page.goto(CAL);

  await page.locator(SUMMARY).click();
  await expect(page.locator('.how-to-intro')).toBeVisible();
  // The link is the one internal route out of the panel; spec.json owns its URL.
  await expect(page.locator(`.how-to-intro a[href="${spec.pages.blog}"]`)).toHaveCount(1);
});

test('the open panel floats — the grids do not move or resize', async ({ page }) => {
  await preparePage(page);
  await page.goto(CAL);

  const grid = page.locator('#gridContainer');
  const before = await grid.boundingBox();

  await page.locator(SUMMARY).click();
  await expect(page.locator(PANEL)).toBeVisible();

  const after = await grid.boundingBox();
  expect(after).toEqual(before);
});

test('Escape closes it and hands focus back to the summary', async ({ page }) => {
  await preparePage(page);
  await page.goto(CAL);

  await page.locator(SUMMARY).click();
  await expect(page.locator(PANEL)).toBeVisible();

  await page.keyboard.press('Escape');
  await expect(page.locator(PANEL)).toBeHidden();
  await expect(page.locator(SUMMARY)).toBeFocused();
});

test('a click outside closes it', async ({ page }) => {
  await preparePage(page);
  await page.goto(CAL);

  await page.locator(SUMMARY).click();
  await expect(page.locator(PANEL)).toBeVisible();

  await page.locator('h1').click();
  await expect(page.locator(PANEL)).toBeHidden();
});
