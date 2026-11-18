import { defineConfig, devices } from "@playwright/test";
import { tmpdir } from "node:os";
import { join } from "node:path";

export default defineConfig({
  testDir: "./tests",
  // Keep traces/artifacts outside the repo: the Next dev watcher sees writes
  // into ./test-results and invalidates its compile cache mid-run, which makes
  // route navigations take 8-14s and blows the per-test timeouts.
  outputDir: join(tmpdir(), "campusloop-pw"),
  fullyParallel: true,
  workers: 1,
  reporter: "list",
  use: {
    baseURL: "http://127.0.0.1:3100",
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    // Test the production build, not `next dev`. The dev server evicts
    // on-demand route entries after ~30s idle, so each run re-compiles routes
    // (8-12s apiece) and intermittently blows per-test timeouts. Requires a
    // prior `npm run build` (with NEXT_PUBLIC_USE_FIREBASE=false for sample data).
    command: "npm run start -- --hostname 127.0.0.1 --port 3100",
    url: "http://127.0.0.1:3100",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
