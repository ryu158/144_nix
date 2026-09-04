import { test, expect, type Page } from '@playwright/test';
import { preparePage, stubThirdParty, setConsent, collectConsoleErrors } from '../helpers/page-setup';
import { loadSpec } from '../helpers/spec';
import { copyFromGrid, parseTsv, waitForGrid } from '../helpers/grid';

/**
 * File import and export on the advanced page.
 *
 * Both are local: the file never reaches the server, and the wire format
 * to /api/ is still JSON. What these guard is that a file and a paste of the
 * same bytes produce the same grid, and that a round trip loses nothing.
 */

const spec = loadSpec('interpolation');
const ADV = spec.pages.advanced;

const API = '**/api/interpolation/*';
const CANNED = [['0', '1'], ['1', '2'], ['2', '3']];

/** Three rows, two columns. Small enough to assert cell by cell. */
const ROWS = [['0', '10'], ['1', '20'], ['2', '30']];
const asCsv = ROWS.map(r => r.join(',')).join('\n');
const asTsv = ROWS.map(r => r.join('\t')).join('\n');

async function importText(page: import('@playwright/test').Page, name: string, body: string) {
  await page.locator('#importFile').setInputFiles({
    name, mimeType: 'text/plain', buffer: Buffer.from(body, 'utf-8')
  });
}

/** Fulfil the API in the browser so export has something to save without the service. */
async function runWithCannedReply(page: import('@playwright/test').Page) {
  await page.route(API, route => route.fulfill({
    contentType: 'application/json', body: JSON.stringify(CANNED)
  }));
  await page.locator('#genRangeBtn').click();
  await expect(page.locator('#status')).toContainText('rows,');
}

test('a CSV file lands in the input grid', async ({ page }) => {
  await preparePage(page);
  await page.goto(ADV);
  await waitForGrid(page, 'gridContainer');

  await importText(page, 'points.csv', asCsv);

  await expect(page.locator('#status')).toHaveText('3 rows imported');
  expect(parseTsv(await copyFromGrid(page, 'gridContainer'))).toEqual(ROWS);
});

test('a TSV file gives the identical grid', async ({ page }) => {
  await preparePage(page);
  await page.goto(ADV);
  await waitForGrid(page, 'gridContainer');

  await importText(page, 'points.tsv', asTsv);

  // Same bytes, different delimiter, same result. This is the whole point of
  // reusing grid.ts's sniffing rather than writing a second parser.
  expect(parseTsv(await copyFromGrid(page, 'gridContainer'))).toEqual(ROWS);
});

test('an import replaces the demo instead of mixing into it', async ({ page }) => {
  await preparePage(page);
  await page.goto(ADV);
  await waitForGrid(page, 'gridContainer');
  // Wait for the demo to actually be there, or the test proves nothing.
  await expect.poll(async () => parseTsv(await copyFromGrid(page, 'gridContainer')).length)
    .toBeGreaterThan(ROWS.length);

  await importText(page, 'points.csv', asCsv);

  // The paste trap in reverse: leftover demo rows below the imported data would
  // be silently included in the next run.
  expect(parseTsv(await copyFromGrid(page, 'gridContainer'))).toEqual(ROWS);
});

test('an empty file is refused, and the grid is left alone', async ({ page }) => {
  await preparePage(page);
  await page.goto(ADV);
  await waitForGrid(page, 'gridContainer');
  const before = await copyFromGrid(page, 'gridContainer');

  await importText(page, 'empty.csv', '\n\n');

  await expect(page.locator('#status')).toContainText('no data');
  expect(await copyFromGrid(page, 'gridContainer')).toBe(before);
});

/**
 * Two save paths, and a test for each.
 *
 * Chromium opens a real "Save as type" dialog, which Playwright cannot drive —
 * so showSaveFilePicker is stubbed in the page. The fallback path deletes it,
 * which is what Firefox and Safari really look like.
 */

/** Stub the picker. `chosen` is the file name it reports back. */
async function stubPicker(page: Page, chosen: string | 'abort') {
  await page.addInitScript((name: string) => {
    (window as any).__saved = [];
    (window as any).__pickerCalls = 0;
    (window as any).showSaveFilePicker = async () => {
      (window as any).__pickerCalls++;
      if (name === 'abort') {
        const err = new Error('The user aborted a request.');
        err.name = 'AbortError';
        throw err;
      }
      return {
        name,
        createWritable: async () => ({
          write: async (data: string) => { (window as any).__saved.push(data); },
          close: async () => {}
        })
      };
    };
  }, chosen);
}

/** What Firefox and Safari present: no File System Access API at all. */
async function stubNoPicker(page: Page) {
  await page.addInitScript(() => { delete (window as any).showSaveFilePicker; });
}

const saved = (page: Page) => page.evaluate(() => (window as any).__saved as string[]);

test('the save dialog file type decides the delimiter', async ({ page }) => {
  await stubPicker(page, 'out.tsv');
  await preparePage(page);
  await page.goto(ADV);
  await waitForGrid(page, 'gridContainer');
  await runWithCannedReply(page);

  await page.locator('#exportBtn').click();

  // The page never chose tsv — the handle's name did. That is the whole point
  // of this path: the format follows the dialog, not a control on the page.
  await expect(page.locator('#status')).toHaveText('3 rows exported as TSV');
  const [text] = await saved(page);
  expect(text.split('\n').map(r => r.split('\t'))).toEqual(CANNED);
});

test('picking CSV in the dialog writes commas', async ({ page }) => {
  await stubPicker(page, 'out.csv');
  await preparePage(page);
  await page.goto(ADV);
  await waitForGrid(page, 'gridContainer');
  await runWithCannedReply(page);

  await page.locator('#exportBtn').click();

  await expect(page.locator('#status')).toHaveText('3 rows exported as CSV');
  const [text] = await saved(page);
  expect(text.split('\n').map(r => r.split(','))).toEqual(CANNED);
});

test('cancelling the save dialog is not an error', async ({ page }) => {
  await stubPicker(page, 'abort');
  const errors = collectConsoleErrors(page);
  await stubThirdParty(page);
  await setConsent(page, 'granted');
  await page.goto(ADV);
  await waitForGrid(page, 'gridContainer');
  await runWithCannedReply(page);
  const before = await page.locator('#status').textContent();

  await page.locator('#exportBtn').click();

  // Cancel is a decision, not a failure: no message, no console noise, and no
  // analytics event for a save that never happened.
  await expect(page.locator('#status')).toHaveText(before!);
  expect(errors).toEqual([]);
  const names = (await gaEvents(page)).filter(e => e[0] === 'event').map(e => e[1]);
  expect(names).not.toContain('csv_export');
});

test('the format select stays hidden where the dialog can offer the choice', async ({ page }) => {
  await stubPicker(page, 'out.csv');
  await preparePage(page);
  await page.goto(ADV);
  await waitForGrid(page, 'gridContainer');

  await expect(page.locator('#exportFormat')).toBeHidden();
});

test('without the API the format select appears and picks CSV', async ({ page }) => {
  await stubNoPicker(page);
  await preparePage(page);
  await page.goto(ADV);
  await waitForGrid(page, 'gridContainer');
  await runWithCannedReply(page);

  await expect(page.locator('#exportFormat')).toBeVisible();

  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.locator('#exportBtn').click()
  ]);

  expect(download.suggestedFilename()).toMatch(/^interpolation_[a-z]+_\d{8}-\d{6}\.csv$/);
  const text = (await (await download.createReadStream())!.toArray()).join('');
  expect(text.trim().split('\n').map(r => r.split(','))).toEqual(CANNED);
});

test('without the API the format select can still choose TSV', async ({ page }) => {
  await stubNoPicker(page);
  await preparePage(page);
  await page.goto(ADV);
  await waitForGrid(page, 'gridContainer');
  await runWithCannedReply(page);

  await page.selectOption('#exportFormat', 'tsv');
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.locator('#exportBtn').click()
  ]);

  expect(download.suggestedFilename()).toMatch(/\.tsv$/);
  const text = (await (await download.createReadStream())!.toArray()).join('');
  expect(text).toContain('\t');
  expect(text.trim().split('\n').map(r => r.split('\t'))).toEqual(CANNED);
});

test('exporting an empty output grid says why instead of saving nothing', async ({ page }) => {
  await stubPicker(page, 'out.csv');
  await preparePage(page);
  await page.goto(ADV);
  await waitForGrid(page, 'gridContainer');

  let downloaded = false;
  page.on('download', () => { downloaded = true; });

  await page.locator('#exportBtn').click();

  await expect(page.locator('#status')).toContainText('nothing to export');
  expect(downloaded).toBe(false);
  // The dialog must not open either — an empty save is refused before any UI.
  expect(await page.evaluate(() => (window as any).__pickerCalls)).toBe(0);
});

test('an exported file imports back unchanged', async ({ page }) => {
  await stubPicker(page, 'out.csv');
  await preparePage(page);
  await page.goto(ADV);
  await waitForGrid(page, 'gridContainer');
  await runWithCannedReply(page);

  await page.locator('#exportBtn').click();
  await expect(page.locator('#status')).toContainText('exported');
  const [text] = await saved(page);

  await importText(page, 'again.csv', text);

  // No header row on export is what makes this hold: every row survives as data.
  expect(parseTsv(await copyFromGrid(page, 'gridContainer'))).toEqual(CANNED);
});

/** GA events as plain arrays, same shape analytics.spec.ts reads. */
async function gaEvents(page: Page): Promise<unknown[][]> {
  return page.evaluate(() =>
    ((window.dataLayer || []) as unknown[]).map(a => Array.from(a as ArrayLike<unknown>))
  );
}

test('with consent granted, import and export each report one event', async ({ page }) => {
  await stubPicker(page, 'out.tsv');
  await stubThirdParty(page);
  await setConsent(page, 'granted');
  await page.goto(ADV);
  await waitForGrid(page, 'gridContainer');

  await importText(page, 'points.tsv', asTsv);
  await runWithCannedReply(page);
  await page.locator('#exportBtn').click();
  await expect(page.locator('#status')).toContainText('exported');

  const events = (await gaEvents(page)).filter(e => e[0] === 'event');
  expect(events.map(e => e[1])).toEqual(['csv_import', 'interpolate_run', 'csv_export']);
  // slug and level both travel: the component is shared, so an event that named
  // only the level could not say which topic produced it.
  expect(events[0][2]).toEqual({ slug: spec.slug, level: 'advanced', format: 'tsv', rows: 3 });
  // The dialog chose tsv, so the event must say tsv.
  expect(events[2][2]).toMatchObject({ slug: spec.slug, level: 'advanced', format: 'tsv', rows: 3 });
});

test('the buttons say import and export, not the formats', async ({ page }) => {
  await preparePage(page);
  await page.goto(ADV);

  // The formats are explained in the manual instead. seo.spec.ts's required
  // terms come from the <summary>, never from these labels — putting them back
  // here should be a decision, not drift.
  await expect(page.locator('#importBtn')).toHaveText('import');
  await expect(page.locator('#exportBtn')).toHaveText('export');
});
