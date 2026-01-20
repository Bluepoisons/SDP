import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 30000,
  expect: {
    timeout: 5000
  },
  reporter: 'html',
  use: {
    trace: 'on-first-retry',
    ...devices['Desktop Chrome']
  },
  projects: [
    {
      name: 'Jest',
      testMatch: /.*\.spec\.ts/,
      use: { ...devices['Desktop Chrome'] }
    },
    {
      name: 'Mocha',
      testMatch: /.*\.spec\.ts/,
      use: { ...devices['Desktop Firefox'] }
    }
  ]
});