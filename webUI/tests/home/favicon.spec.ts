import { test, expect } from '@playwright/test';
import { preparePage } from '../helpers/page-setup';
import { loadSpec } from '../helpers/spec';

/**
 * Browsers request /favicon.ico on their own, whether or not a page links one.
 * That 404 was noisy enough that the console check used to ignore it by name;
 * the ignore is gone, so these tests are what keeps it gone.
 */

const spec = loadSpec('interpolation');
const PAGES = ['/', ...Object.values(spec.pages)];

test('/favicon.ico serves, and is a real multi-size icon', async ({ request }) => {
  const res = await request.get('/favicon.ico');
  expect(res.status()).toBe(200);

  const buf = await res.body();
  expect(buf.readUInt16LE(0)).toBe(0);   // reserved
  expect(buf.readUInt16LE(2)).toBe(1);   // 1 = icon, not cursor
  const count = buf.readUInt16LE(4);
  expect(count).toBe(3);

  // 16 for the tab, 32 for the bookmark bar, 48 for Windows shortcuts.
  const widths = Array.from({ length: count }, (_, i) => buf.readUInt8(6 + 16 * i) || 256);
  expect(widths).toEqual([16, 32, 48]);
});

test('/favicon.svg serves as SVG', async ({ request }) => {
  const res = await request.get('/favicon.svg');
  expect(res.status()).toBe(200);
  expect(res.headers()['content-type']).toContain('image/svg+xml');
  expect(await res.text()).toContain('<svg');
});

for (const url of PAGES) {
  test(`${url} links both icons`, async ({ page }) => {
    await preparePage(page);
    await page.goto(url);

    // SVG first: a browser that understands it never asks for the .ico.
    await expect(page.locator('link[rel="icon"][href="/favicon.svg"]')).toHaveCount(1);
    await expect(page.locator('link[rel="icon"][href="/favicon.ico"]')).toHaveCount(1);
  });
}
