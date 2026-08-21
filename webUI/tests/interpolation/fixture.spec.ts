import { test, expect } from '@playwright/test';
import { pasteIntoGrid, copyFromGrid, parseTsv, waitForGrid } from '../helpers/grid';
import { preparePage } from '../helpers/page-setup';
import { loadSpec } from '../helpers/spec';
import { loadFixture, fixtureAsTsv, referenceInterp, seriesFrom, xDomain } from '../helpers/interp-ref';

/**
 * CLAUDE.md hard rule: "cal must match test_out_data given test_in_data, within
 * tolerance. Never validate by eye."
 *
 * This runs that check through the real page — paste, interpolate, copy the
 * whole output back out — and compares every cell against an independent
 * implementation in helpers/interp-ref.ts.
 */

const spec = loadSpec('interpolation');
const CAL = spec.pages.calculator;

// The input grid is locked to 4 columns, so the 10-column fixture goes in as
// X plus its first 3 series. The truncation warning itself is asserted in
// calculator.spec.ts.
const GRID_COLS = 4;
const TOLERANCE = 1e-6; // the engine rounds to 6 decimals, so real error ~5e-7

test('every output cell matches the reference, over the full fixture', async ({ page }) => {
  test.setTimeout(60_000);

  const errors = await preparePage(page);
  const input = loadFixture('test_in_data.md');
  const [xMin, xMax] = xDomain(input);

  await page.goto(CAL);
  await waitForGrid(page, 'gridContainer');

  await pasteIntoGrid(page, 'gridContainer', fixtureAsTsv(input, GRID_COLS));

  // spec.json's declared defaults for the range controls.
  await page.fill('#outputXMin', '0');
  await page.fill('#outputXMax', '1000');
  await page.fill('#outputXInterval', '1');
  await page.click('#genRangeBtn');

  // The grid is virtualized — off-screen rows have no DOM node — so readiness
  // is measured by copying the data out, not by waiting on a cell.
  const queryXs = Array.from({ length: 1001 }, (_, i) => i);
  let got: string[][] = [];
  await expect.poll(async () => {
    got = parseTsv(await copyFromGrid(page, 'gridContainer_2'));
    return got.length;
  }, { timeout: 15_000 }).toBe(queryXs.length);

  expect(got.map(r => r[0])).toEqual(queryXs.map(String));

  const series = [1, 2, 3].map(c => seriesFrom(input, c));
  let maxError = 0;
  let blankRows = 0;
  let compared = 0;

  for (const [row, cells] of got.entries()) {
    const x = queryXs[row];
    const outside = x < xMin || x > xMax;
    if (outside) {
      expect(cells.slice(1).join(''), `x=${x} is outside [${xMin}, ${xMax}] and must not be extrapolated`).toBe('');
      blankRows++;
      continue;
    }
    for (const [i, pts] of series.entries()) {
      const cell = cells[i + 1];
      const ref = referenceInterp(pts, x);
      expect(ref, `reference has a value for x=${x}, series ${i + 1}`).not.toBeNull();
      expect(cell, `x=${x}, series ${i + 1} must not be blank inside the domain`).not.toBe('');
      maxError = Math.max(maxError, Math.abs(Number(cell) - (ref as number)));
      compared++;
    }
  }

  expect(compared).toBe((queryXs.length - blankRows) * series.length);
  expect(blankRows).toBeGreaterThan(0); // the fixture domain really does exclude some Xs
  expect(maxError).toBeLessThanOrEqual(TOLERANCE);
  expect(errors).toEqual([]);

  console.log(`fixture: ${compared} cells compared, ${blankRows} blank rows, max error ${maxError.toExponential(2)}`);
});
