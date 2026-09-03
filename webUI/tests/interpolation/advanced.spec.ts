import { test, expect } from '@playwright/test';
import { preparePage } from '../helpers/page-setup';
import { loadSpec, meta } from '../helpers/spec';
import { pasteIntoGrid, gridCell, waitForGrid, copyFromGrid, parseTsv } from '../helpers/grid';
import { loadFixture, fixtureAsTsv } from '../helpers/interp-ref';

/**
 * The advanced page is markup only for now — the calculation service is not
 * built yet. These assertions guard what already has to be true, so the page
 * cannot drift while the backend is written.
 */

const spec = loadSpec('interpolation');
const ADV = spec.pages.advanced;
const CAL = spec.pages.calculator;

test('the method select offers exactly what spec.json declares', async ({ page }) => {
  await preparePage(page);
  await page.goto(ADV);

  const options = await page.locator('#methodSelect option').allTextContents();
  expect(options).toEqual(meta(spec, 'advanced').methods);
});

test('FFT is absent — it needs a uniform x grid', async ({ page }) => {
  await preparePage(page);
  await page.goto(ADV);

  const options = (await page.locator('#methodSelect option').allTextContents()).join(' ');
  expect(options.toLowerCase()).not.toContain('fft');
});

test('this page never repeats the basic page\'s no-upload claim', async ({ page }) => {
  await preparePage(page);
  await page.goto(ADV);

  // The advanced page posts the table to a server. Reusing the basic page's
  // wording would be a false claim, not a style nit.
  const body = (await page.locator('body').innerText()).toLowerCase();
  expect(body).not.toContain('nothing is uploaded');
  expect(body).not.toContain('no upload');
});

test('the manual says the data leaves the browser', async ({ page }) => {
  await preparePage(page);
  await page.goto(ADV);

  await page.locator('details.how-to summary').click();
  const panel = (await page.locator('.how-to-body').innerText()).toLowerCase();
  expect(panel).toContain('sends your table to the server');
  await expect(page.locator(`.how-to-intro a[href="${CAL}"]`)).toHaveCount(1);
});

test('the basic page links here by public URL', async ({ page }) => {
  await preparePage(page);
  await page.goto(CAL);

  await expect(page.locator(`.app-header a[href="${ADV}"]`)).toHaveCount(1);
});

test('the run button is disabled until the service exists', async ({ page }) => {
  await preparePage(page);
  await page.goto(ADV);

  await expect(page.locator('#genRangeBtn')).toBeDisabled();
  await expect(page.locator('#status')).not.toBeEmpty();
});

test('the grids and the chart render, seeded with the spec.json demo', async ({ page }) => {
  const errors = await preparePage(page);
  await page.goto(ADV);
  await waitForGrid(page, 'gridContainer');

  await expect(page.locator('#chartContainer canvas, #chartContainer svg').first()).toBeVisible();

  // The demo lands from spec.json, same dataset as the basic page. Cell 1,0 is
  // a distinctive value - cell 0,0 is "0" and would match almost anything.
  await expect(gridCell(page, 'gridContainer', 1, 0)).toHaveText(String(spec.dataset!.x![1]));
  await expect(gridCell(page, 'gridContainer', 1, 1)).toHaveText(String(spec.dataset!.y![1]));

  expect(errors).toEqual([]);
});

test('a wide paste is not truncated — this page has no column lock', async ({ page }) => {
  await preparePage(page);
  await page.goto(ADV);
  await waitForGrid(page, 'gridContainer');

  // The basic page alerts and truncates past 4 columns. Here the grid must grow
  // instead, so the same 10-column fixture goes in whole.
  const dialogs: string[] = [];
  page.on('dialog', async d => { dialogs.push(d.message()); await d.accept(); });

  const rows = loadFixture('test_in_data.md').slice(0, 5);
  await pasteIntoGrid(page, 'gridContainer', fixtureAsTsv(rows, 10));

  // The grid virtualises its columns, so column 9 has no DOM node until it is
  // scrolled into view. Copy the data back out instead, same as fixture.spec.ts.
  const pasted = parseTsv(await copyFromGrid(page, 'gridContainer'));
  expect(pasted[0]).toHaveLength(10);
  expect(pasted[0][9]).toBe(rows[0][9]);
  expect(dialogs).toEqual([]);
});
