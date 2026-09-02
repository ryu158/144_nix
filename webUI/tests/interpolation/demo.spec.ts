import { test, expect } from '@playwright/test';
import { preparePage } from '../helpers/page-setup';
import { pasteIntoGrid, gridCell, waitForGrid, copyFromGrid, parseTsv } from '../helpers/grid';
import { loadSpec } from '../helpers/spec';

/**
 * The demo dataset seeded into the input grid on first load.
 *
 * It comes from spec.json, so every expectation here reads spec.json too —
 * rules/tests.md: never copy a value out of the page into a test.
 */

const spec = loadSpec('interpolation');
const CAL = spec.pages.calculator;
const demoX = (spec.dataset?.x ?? []) as (string | number)[];
const demoY = (spec.dataset?.y ?? []) as (string | number)[];

/** Wait for the async spec.json fetch to land the demo in the grid. */
async function waitForDemo(page: import('@playwright/test').Page) {
  await waitForGrid(page, 'gridContainer');
  await expect(gridCell(page, 'gridContainer', 0, 0)).toHaveText(String(demoX[0]));
}

test('spec.json actually carries a demo dataset', () => {
  // Guards the rest of this file: without data, every test below passes vacuously.
  expect(demoX.length).toBeGreaterThan(0);
  expect(demoY.length).toBe(demoX.length);
});

test('the input grid arrives seeded from spec.json, not empty', async ({ page }) => {
  await preparePage(page);
  await page.goto(CAL);
  await waitForDemo(page);

  await expect(gridCell(page, 'gridContainer', 0, 1)).toHaveText(String(demoY[0]));

  const rows = parseTsv(await copyFromGrid(page, 'gridContainer'));
  expect(rows).toHaveLength(demoX.length);
  expect(rows[rows.length - 1][0]).toBe(String(demoX[demoX.length - 1]));
});

test('pasting over the demo clears it — no seeded rows left mixed in', async ({ page }) => {
  await preparePage(page);
  await page.goto(CAL);
  await waitForDemo(page);

  await pasteIntoGrid(page, 'gridContainer', '0\t0\n10\t10');

  const rows = parseTsv(await copyFromGrid(page, 'gridContainer'));
  expect(rows[0][0]).toBe('0');
  expect(rows[1][0]).toBe('10');
  // The demo ran to 50 rows. Anything past the pasted two must be blank.
  for (const row of rows.slice(2)) {
    expect(row.every(cell => cell === '')).toBe(true);
  }
});

test('a second paste behaves normally — clearing happens once, not every time', async ({ page }) => {
  await preparePage(page);
  await page.goto(CAL);
  await waitForDemo(page);

  await pasteIntoGrid(page, 'gridContainer', '0\t0\n10\t10\n20\t20');
  await gridCell(page, 'gridContainer', 0, 0).click();
  await pasteIntoGrid(page, 'gridContainer', '1\t1');

  const rows = parseTsv(await copyFromGrid(page, 'gridContainer'));
  expect(rows[0][0]).toBe('1');
  // Row 2 and 3 survive: the demo clear must not fire again on a normal paste.
  expect(rows[1][0]).toBe('10');
  expect(rows[2][0]).toBe('20');
});
