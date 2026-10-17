import {defineConfig,devices} from '@playwright/test';

export default defineConfig({
  testDir:'./tests/e2e',
  timeout:30_000,
  expect:{timeout:10_000},
  fullyParallel:false,
  workers:1,
  retries:process.env.CI?1:0,
  reporter:process.env.CI?[['list'],['html',{open:'never'}]]:'list',
  use:{
    baseURL:'http://127.0.0.1:4173/',
    trace:'retain-on-failure',
    screenshot:'only-on-failure',
    video:'retain-on-failure',
    ...devices['Desktop Chrome'],
  },
  webServer:{
    command:'npm run preview -- --host 127.0.0.1 --port 4173 --strictPort',
    url:'http://127.0.0.1:4173/',
    timeout:60_000,
    reuseExistingServer:!process.env.CI,
  },
});
