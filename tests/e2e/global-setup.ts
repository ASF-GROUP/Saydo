/**
 * Global setup for Playwright E2E tests.
 * Database reset is now handled per-test via the /api/test-reset endpoint
 * (because the dev server may reuse an existing process with an open SQLite connection).
 */
export default async function globalSetup() {
  // no-op — cleanup is done in setupPage via the API
}
