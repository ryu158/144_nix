import { type Page } from '@playwright/test';

/**
 * Ko-fi and GA4 are the only outbound requests these pages make. Tests stub
 * them rather than letting them out: deterministic, offline-capable, and no
 * hammering someone else's CDN on every run.
 *
 * Stub, never abort. Both pages call kofiWidgetOverlay.draw(...) from an inline
 * script — an aborted request leaves that throwing ReferenceError, which would
 * poison every console assertion. kofiwidget2 stays stubbed: harmless, and it
 * costs nothing if an inline ko-fi button ever comes back.
 */
export async function stubThirdParty(page: Page) {
  await page.route(/storage\.ko-fi\.com/, route => route.fulfill({
    contentType: 'application/javascript',
    body: `window.kofiwidget2 = { init: function () {}, draw: function () {} };
           window.kofiWidgetOverlay = { draw: function () {} };`,
  }));

  await page.route(/googletagmanager\.com|google-analytics\.com/, route => route.fulfill({
    contentType: 'application/javascript',
    body: '/* GA stubbed in tests */',
  }));
}

/**
 * Decide consent before page scripts run, so consent.ts skips the banner.
 * Left undecided, the bar is position:fixed at the bottom and can swallow clicks.
 */
export async function setConsent(page: Page, choice: 'granted' | 'denied') {
  await page.addInitScript(value => {
    try { localStorage.setItem('consent', value); } catch { /* private mode */ }
  }, choice);
}

/**
 * Collect console errors/warnings and page errors.
 *
 * seo.ts console.warns on spec.json drift, so an empty list is also an SEO check.
 */
export function collectConsoleErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('console', m => {
    if (m.type() !== 'error' && m.type() !== 'warning') return;
    errors.push(m.text());
  });
  page.on('pageerror', e => errors.push(String(e)));
  return errors;
}

/** Standard setup for a test that just wants a quiet, deterministic page. */
export async function preparePage(page: Page, consent: 'granted' | 'denied' = 'denied') {
  await stubThirdParty(page);
  await setConsent(page, consent);
  return collectConsoleErrors(page);
}
