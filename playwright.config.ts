import { defineConfig, devices } from '@playwright/test'

// Runs against the production build (`make build`) with the real Python backend behind it.
export default defineConfig({
  testDir: 'tests/frontend',
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: { baseURL: 'http://localhost:3000', trace: 'retain-on-failure' },
  projects: [{ name: 'chromium', use: devices['Desktop Chrome'] }],
  webServer: {
    command: 'node scripts/with-backend.mjs node .output/server/index.mjs',
    url: 'http://localhost:3000/robots.txt',
    reuseExistingServer: !process.env.CI,
    timeout: 90_000,
    // Lets with-backend.mjs stop the backend. A forced kill would leave it running and hang the run.
    gracefulShutdown: { signal: 'SIGTERM', timeout: 5000 },
  },
})
