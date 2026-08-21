import { defineConfig } from '@playwright/test';

// The Nix chromium, exported by the `run-browser-tests` script in flake.nix.
// Playwright never downloads a browser here — PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
// is set alongside it, and a download would write outside webUI/.
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: [['list']],

  use: {
    // nginx root IS this repo, so the tests hit the real served site, not a
    // dev server. No webServer block on purpose.
    baseURL: process.env.WEBUI_BASE_URL || 'https://localhost',
    ignoreHTTPSErrors: true, // self-signed cert on localhost
    trace: 'on-first-retry',
  },

  projects: [
    {
      name: 'chromium',
      use: {
        browserName: 'chromium',
        viewport: { width: 1280, height: 900 },
        launchOptions: {
          ...(executablePath ? { executablePath } : {}),
          args: ['--no-sandbox'],
        },
      },
    },
  ],
});
