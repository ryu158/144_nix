import { test, expect, type Page } from '@playwright/test';

// Paste is the documented way in ("Copy and paste CSV, TSV, or spreadsheet
// data"), so the test uses it rather than reaching into page internals —
// page.ts keeps its grid/chart instances private inside an IIFE.
async function pasteIntoGrid(page: Page, containerId: string, tsv: string) {
  const hidden = page.locator(`#${containerId} .gt-hidden-input`);
  await hidden.focus();
  await hidden.evaluate((el, text) => {
    const dt = new DataTransfer();
    dt.setData('text/plain', text);
    el.dispatchEvent(new ClipboardEvent('paste', { clipboardData: dt, bubbles: true, cancelable: true }));
  }, tsv);
}

function outputCell(page: Page, row: number, col: number) {
  return page.locator(`#gridContainer_2 .gt-cell[data-row="${row}"][data-col="${col}"]`);
}

test('calculator interpolates a pasted table over a generated range', async ({ page }) => {
  // /favicon.ico is genuinely missing — a known gap, tracked in future_work.md.
  // Everything else must stay silent.
  const consoleErrors: string[] = [];
  page.on('console', m => {
    if (m.type() !== 'error' && m.type() !== 'warning') return;
    if (m.location().url.endsWith('/favicon.ico')) return;
    consoleErrors.push(m.text());
  });
  page.on('pageerror', e => consoleErrors.push(String(e)));

  await page.goto('/interpolate_cal');
  await expect(page.locator('#gridContainer .gt-cell').first()).toBeVisible();

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

  // Chart is driven off the same data; its canvas must exist.
  await expect(page.locator('#chartContainer canvas')).toHaveCount(1);

  // seo.ts warns on spec.json drift, so a clean console is also an SEO check.
  expect(consoleErrors).toEqual([]);
});

test('outside the input domain stays blank — no extrapolation', async ({ page }) => {
  await page.goto('/interpolate_cal');
  await expect(page.locator('#gridContainer .gt-cell').first()).toBeVisible();

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
