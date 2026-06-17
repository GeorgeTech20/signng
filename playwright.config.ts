import { defineConfig, devices } from '@playwright/test';

// Runs the a11y + interaction gate against the SSR server (tests SSR + hydration + zoneless).
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:4000',
    trace: 'off',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'node e2e/static-server.mjs',
    url: 'http://localhost:4000',
    timeout: 120_000,
    reuseExistingServer: false,
    env: { PORT: '4000' },
  },
});
