import { test, expect } from '@playwright/test';
import { pasteIntoGrid, outputCell, gridCell, waitForGrid, selectCell } from '../helpers/grid';
import { preparePage } from '../helpers/page-setup';
import { loadSpec } from '../helpers/spec';
import { loadFixture, fixtureAsTsv } from '../helpers/interp-ref';

const spec = loadSpec('interpolation');
const CAL = spec.pages.calculator;

test('page loads with both grids, a chart and a quiet console', async ({ page }) => {
  const errors = await preparePage(page);

  await page.goto(CAL);
  await waitForGrid(page, 'gridContainer');

  await expect(page.locator('h1')).toHaveText('Interpolate Calculator');
  await expect(page.locator('.panel h2')).toHaveText(['Input', 'Output', 'Results']);
  await expect(page.locator('#gridContainer_2 .gt-cell').first()).toBeVisible();
  await expect(page.locator('#chartContainer canvas')).toHaveCount(1);

  expect(errors).toEqual([]);
});

test('interpolates a pasted table over a generated range', async ({ page }) => {
  const errors = await preparePage(page);

  await page.goto(CAL);
  await waitForGrid(page, 'gridContainer');

  // Two segments with different slopes, so a wrong result cannot pass by luck.
  await pasteIntoGrid(page, 'gridContainer', '0\t0\n10\t10\n20\t30');

  await page.fill('#outputXMin', '0');
  await page.fill('#outputXMax', '20');
  await page.fill('#outputXInterval', '5');
  await page.click('#genRangeBtn');

  // x: 0 5 10 15 20  ->  y: 0 5 10 20 30
  const expected = [['0', '0'], ['5', '5'], ['10', '10'], ['15', '20'], ['20', '30']];
  for (const [row, [x, y]] of expected.entries()) {
    await expect(outputCell(page, row, 0)).toHaveText(x);
    await expect(outputCell(page, row, 1)).toHaveText(y);
  }

  await expect(page.locator('#chartContainer canvas')).toHaveCount(1);
  expect(errors).toEqual([]);
});

test('editing the input re-interpolates on the existing query Xs, with no second click', async ({ page }) => {
  await preparePage(page);

  await page.goto(CAL);
  await waitForGrid(page, 'gridContainer');

  await pasteIntoGrid(page, 'gridContainer', '0\t0\n10\t10');
  await page.fill('#outputXMin', '0');
  await page.fill('#outputXMax', '10');
  await page.fill('#outputXInterval', '5');
  await page.click('#genRangeBtn');
  await expect(outputCell(page, 1, 1)).toHaveText('5');

  // page.ts wires grid.on('change') -> interpolateAndPlot, which reads the query
  // Xs back out of the output grid. Steeper input, same Xs, no button press.
  await selectCell(page, 'gridContainer', 0, 0);
  await pasteIntoGrid(page, 'gridContainer', '0\t0\n10\t100');

  await expect(outputCell(page, 0, 1)).toHaveText('0');
  await expect(outputCell(page, 1, 1)).toHaveText('50');
  await expect(outputCell(page, 2, 1)).toHaveText('100');
});

test('outside the input domain stays blank — no extrapolation', async ({ page }) => {
  await preparePage(page);

  await page.goto(CAL);
  await waitForGrid(page, 'gridContainer');

  await pasteIntoGrid(page, 'gridContainer', '10\t1\n20\t2');

  await page.fill('#outputXMin', '0');
  await page.fill('#outputXMax', '30');
  await page.fill('#outputXInterval', '10');
  await page.click('#genRangeBtn');

  await expect(outputCell(page, 0, 0)).toHaveText('0');
  await expect(outputCell(page, 0, 1)).toHaveText('');  // below domain
  await expect(outputCell(page, 1, 1)).toHaveText('1');
  await expect(outputCell(page, 2, 1)).toHaveText('2');
  await expect(outputCell(page, 3, 1)).toHaveText('');  // above domain
});

for (const [label, min, max, interval] of [
  ['a zero interval', '0', '10', '0'],
  ['a reversed range', '10', '0', '1'],
  ['non-numeric input', 'abc', '10', '1'],
] as const) {
  test(`${label} leaves the output untouched instead of crashing`, async ({ page }) => {
    const errors = await preparePage(page);

    await page.goto(CAL);
    await waitForGrid(page, 'gridContainer');

    await pasteIntoGrid(page, 'gridContainer', '0\t0\n10\t10');
    await page.fill('#outputXMin', '0');
    await page.fill('#outputXMax', '10');
    await page.fill('#outputXInterval', '5');
    await page.click('#genRangeBtn');
    await expect(outputCell(page, 1, 1)).toHaveText('5');

    // generateRange returns [] for all three, so page.ts replots and returns.
    await page.fill('#outputXMin', min);
    await page.fill('#outputXMax', max);
    await page.fill('#outputXInterval', interval);
    await page.click('#genRangeBtn');

    await expect(outputCell(page, 0, 0)).toHaveText('0');
    await expect(outputCell(page, 1, 0)).toHaveText('5');
    await expect(outputCell(page, 1, 1)).toHaveText('5');
    expect(errors).toEqual([]);
  });
}

test('the output grid is read-only — pasting into it is ignored', async ({ page }) => {
  await preparePage(page);

  await page.goto(CAL);
  await waitForGrid(page, 'gridContainer');

  await pasteIntoGrid(page, 'gridContainer', '0\t0\n10\t10');
  await page.fill('#outputXMin', '0');
  await page.fill('#outputXMax', '10');
  await page.fill('#outputXInterval', '5');
  await page.click('#genRangeBtn');
  await expect(outputCell(page, 0, 0)).toHaveText('0');

  await pasteIntoGrid(page, 'gridContainer_2', '999\t999\n999\t999');

  await expect(outputCell(page, 0, 0)).toHaveText('0');
  await expect(outputCell(page, 0, 1)).toHaveText('0');
});

test('pasting more columns than the locked grid holds warns and truncates', async ({ page }) => {
  await preparePage(page);

  await page.goto(CAL);
  await waitForGrid(page, 'gridContainer');

  // The input grid is created with cols: 4, fixedColCount: true, but the
  // fixture carries 10 columns. grid.ts alerts and drops the overflow.
  const dialogs: string[] = [];
  page.on('dialog', async d => { dialogs.push(d.message()); await d.accept(); });

  const rows = loadFixture('test_in_data.md').slice(0, 5);
  await pasteIntoGrid(page, 'gridContainer', fixtureAsTsv(rows, 10));

  await expect.poll(() => dialogs.length).toBe(1);
  expect(dialogs[0]).toContain('10 columns');
  expect(dialogs[0]).toContain('locked');

  await expect(gridCell(page, 'gridContainer', 0, 3)).toBeVisible();
  await expect(gridCell(page, 'gridContainer', 0, 4)).toHaveCount(0);
});

test('the method select offers exactly what spec.json declares', async ({ page }) => {
  await preparePage(page);

  await page.goto(CAL);

  const declared = spec.parameters.find(p => p.name === 'method');
  const options = await page.locator('#methodSelect option').allTextContents();
  expect(options).toEqual(declared?.values);
});
