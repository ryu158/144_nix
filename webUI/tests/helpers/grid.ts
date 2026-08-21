import { type Page, type Locator } from '@playwright/test';

/**
 * Helpers for driving dev_basic/grid.ts from the outside.
 *
 * page.ts wraps its GridTable/Chart instances in an IIFE, so tests cannot reach
 * them from page.evaluate — and should not. Everything here goes through the
 * same events a real user produces.
 */

/** Paste TSV into a grid. "Copy and paste CSV, TSV, or spreadsheet data" is the documented way in. */
export async function pasteIntoGrid(page: Page, containerId: string, tsv: string) {
  const hidden = page.locator(`#${containerId} .gt-hidden-input`);
  await hidden.focus();
  await hidden.evaluate((el, text) => {
    const dt = new DataTransfer();
    dt.setData('text/plain', text);
    el.dispatchEvent(new ClipboardEvent('paste', { clipboardData: dt, bubbles: true, cancelable: true }));
  }, tsv);
}

/**
 * Select the whole grid and copy it out as TSV.
 *
 * Uses a synthetic copy event carrying our own DataTransfer, which grid.ts's
 * _onCopy fills — that keeps the system clipboard (and its permission prompts)
 * out of the picture entirely.
 */
export async function copyFromGrid(page: Page, containerId: string): Promise<string> {
  const hidden = page.locator(`#${containerId} .gt-hidden-input`);
  await hidden.focus();
  await page.keyboard.press('Control+a');
  return hidden.evaluate(el => {
    const dt = new DataTransfer();
    el.dispatchEvent(new ClipboardEvent('copy', { clipboardData: dt, bubbles: true, cancelable: true }));
    return dt.getData('text/plain');
  });
}

export function gridCell(page: Page, containerId: string, row: number, col: number): Locator {
  return page.locator(`#${containerId} .gt-cell[data-row="${row}"][data-col="${col}"]`);
}

export function outputCell(page: Page, row: number, col: number): Locator {
  return gridCell(page, 'gridContainer_2', row, col);
}

export function parseTsv(tsv: string): string[][] {
  if (!tsv) return [];
  return tsv.replace(/\r/g, '').split('\n').map(line => line.split('\t'));
}

/** Wait until a grid has painted its first cell. */
export async function waitForGrid(page: Page, containerId: string) {
  await page.locator(`#${containerId} .gt-cell`).first().waitFor({ state: 'visible' });
}

/** Put the selection on one cell, so a following paste lands at a known origin. */
export async function selectCell(page: Page, containerId: string, row: number, col: number) {
  await gridCell(page, containerId, row, col).click();
}
