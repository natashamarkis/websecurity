import { defineConfig } from '@playwright/test'

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:3000'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  use: {
    baseURL,
    channel: process.env.PLAYWRIGHT_CHANNEL,
    trace: 'retain-on-failure',
  },
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : [{
        command: 'pnpm dev',
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 60_000,
      }, {
        command: 'node ../../scripts/csrf-attacker.mjs',
        url: `http://127.0.0.1:${process.env.CSRF_ATTACKER_PORT ?? 3001}/offer`,
        reuseExistingServer: !process.env.CI,
        timeout: 15_000,
      }],
})
