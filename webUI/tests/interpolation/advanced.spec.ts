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

// This page seeds its own demo and its own range, not the topic's. The basic
// page's data is smooth enough that all four methods agree to ~1e-2, which
// hides the only thing this page exists to show.
const advanced = meta(spec, 'advanced');
const DEMO = advanced.dataset!;
const RANGE = advanced.range!;

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

/**
 * The page talks to /api/interpolation/<method>. These fulfil that route in the
 * browser, so the wiring is tested whether or not the Python service is up —
 * the live round trip is covered separately, and skips when it is not running.
 */
const API = '**/api/interpolation/*';

test('interpolate posts the grid and renders what comes back', async ({ page }) => {
  await preparePage(page);
  await page.goto(ADV);
  await waitForGrid(page, 'gridContainer');

  let seen: { url: string; body: any } | null = null;
  await page.route(API, async route => {
    seen = { url: route.request().url(), body: route.request().postDataJSON() };
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify([['0', '1'], ['1', '2'], ['2', '3']])
    });
  });

  await page.selectOption('#methodSelect', 'pchip');
  await page.locator('#genRangeBtn').click();

  await expect(page.locator('#status')).toHaveText('3 rows, pchip');
  expect(seen!.url).toContain('/api/interpolation/pchip');
  // The range inputs travel as typed; the server parses them.
  expect(seen!.body).toMatchObject({
    rangeMin: String(RANGE.min), rangeMax: String(RANGE.max), interval: String(RANGE.interval)
  });
  expect(Array.isArray(seen!.body.data)).toBe(true);

  const out = parseTsv(await copyFromGrid(page, 'gridContainer_2'));
  expect(out.slice(0, 3)).toEqual([['0', '1'], ['1', '2'], ['2', '3']]);
});

test('a server error is shown, not swallowed', async ({ page }) => {
  await preparePage(page);
  await page.goto(ADV);
  await waitForGrid(page, 'gridContainer');

  await page.route(API, route => route.fulfill({
    status: 400,
    contentType: 'application/json',
    body: JSON.stringify({ error: 'empty range: check rangeMin, rangeMax and interval' })
  }));

  await page.locator('#genRangeBtn').click();
  await expect(page.locator('#status')).toContainText('empty range');
  // Still clickable: the failure was the request's, not the page's.
  await expect(page.locator('#genRangeBtn')).toBeEnabled();
});

test('a dead backend says so instead of sitting silent', async ({ page }) => {
  await preparePage(page);
  await page.goto(ADV);
  await waitForGrid(page, 'gridContainer');

  // What nginx returns when no /api/ block exists: an HTML 404, not JSON.
  await page.route(API, route => route.fulfill({
    status: 404, contentType: 'text/html', body: '<html>404</html>'
  }));

  await page.locator('#genRangeBtn').click();
  await expect(page.locator('#status')).toContainText('unavailable');
});

test('the button is disabled while a request is in flight', async ({ page }) => {
  await preparePage(page);
  await page.goto(ADV);
  await waitForGrid(page, 'gridContainer');

  let release: () => void;
  const held = new Promise<void>(r => { release = r; });
  await page.route(API, async route => {
    await held;   // hold the response open
    await route.fulfill({ contentType: 'application/json', body: JSON.stringify([['0', '1']]) });
  });

  await page.locator('#genRangeBtn').click();
  await expect(page.locator('#genRangeBtn')).toBeDisabled();
  await expect(page.locator('#status')).toHaveText('computing…');

  release!();
  await expect(page.locator('#genRangeBtn')).toBeEnabled();
});

test('against the real service, if it is running', async ({ page, request }) => {
  const health = await request.get('/api/health').catch(() => null);
  test.skip(!health || !health.ok(),
    'no /api/ route — start the service and deploy the nginx proxy block');

  await preparePage(page);
  await page.goto(ADV);
  await waitForGrid(page, 'gridContainer');

  await page.locator('#genRangeBtn').click();

  await expect(page.locator('#status')).toContainText('rows,');
  const out = parseTsv(await copyFromGrid(page, 'gridContainer_2'));
  expect(out.length).toBeGreaterThan(1);
  expect(Number(out[0][0])).toBe(RANGE.min);
});

test('the demo data actually separates the methods', async ({ request }) => {
  const health = await request.get('/api/health').catch(() => null);
  test.skip(!health || !health.ok(),
    'no /api/ route — start the service and deploy the nginx proxy block');

  // The reason this dataset was chosen. The basic page's smooth demo made all
  // four methods look identical, so the page had nothing to show. If a future
  // dataset change loses that, this fails rather than quietly shipping a
  // comparison page where there is nothing to compare.
  const data = DEMO.x!.map((x, i) => [String(x), String(DEMO.y![i])]);
  const body = {
    data,
    rangeMin: String(RANGE.min), rangeMax: String(RANGE.max), interval: String(RANGE.interval)
  };

  const peak = async (method: string) => {
    const res = await request.post(`/api/interpolation/${method}`, { data: body });
    expect(res.ok()).toBe(true);
    const rows: string[][] = await res.json();
    const ys = rows.map(r => Number(r[1])).filter(v => Number.isFinite(v));
    return { max: Math.max(...ys), min: Math.min(...ys) };
  };

  const dataMax = Math.max(...DEMO.y!.map(Number));
  const dataMin = Math.min(...DEMO.y!.map(Number));

  const cubic = await peak('cubic');
  const pchip = await peak('pchip');

  // Cubic swings past the data on both sides - the overshoot the article
  // annotates. PCHIP is shape-preserving and must not.
  expect(cubic.max).toBeGreaterThan(dataMax + 10);
  expect(cubic.min).toBeLessThan(dataMin - 5);
  expect(pchip.max).toBeLessThanOrEqual(dataMax);
  expect(pchip.min).toBeGreaterThanOrEqual(dataMin);
});

test('the grids and the chart render, seeded with the spec.json demo', async ({ page }) => {
  const errors = await preparePage(page);
  await page.goto(ADV);
  await waitForGrid(page, 'gridContainer');

  await expect(page.locator('#chartContainer canvas, #chartContainer svg').first()).toBeVisible();

  // Row 3 is the first interesting one: it is where the data jumps to 100, and
  // rows 0-2 are zeros that would match almost anything.
  await expect(gridCell(page, 'gridContainer', 3, 0)).toHaveText(String(DEMO.x![3]));
  await expect(gridCell(page, 'gridContainer', 3, 1)).toHaveText(String(DEMO.y![3]));

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
