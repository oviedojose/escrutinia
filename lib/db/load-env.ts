// Scoped .env.local loader for DB-touching test files only.
//
// Most tests in this repo are pure (no DB import), so vitest.setup.ts
// intentionally does NOT load .env.local globally (see Task 4's history:
// a global loader was added then reverted in favor of decoupling pure
// logic from lib/db/client.ts). A handful of genuinely integration-style
// tests (e.g. lib/queries/snapshots.test.ts) do need DATABASE_URL to run
// under `npm test`. Those files import this module first, before
// importing anything that transitively loads lib/db/client.ts, so the
// env var is populated before client.ts's eager check runs.
//
// No credential values are ever logged here.
import { existsSync } from "node:fs";
import { resolve } from "node:path";

if (!process.env.DATABASE_URL) {
  const envPath = resolve(process.cwd(), ".env.local");
  if (existsSync(envPath)) {
    process.loadEnvFile(envPath);
  }
}
