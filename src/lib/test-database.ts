/** Destructive test setup must never infer authorization from DATABASE_URL. */
export function testDatabaseName(env: Record<string, string | undefined> = process.env): string {
  if (env.ALLOW_TEST_DATABASE_RESET !== "true" || !env.TEST_DATABASE_URL) {
    throw new Error("Set TEST_DATABASE_URL and ALLOW_TEST_DATABASE_RESET=true for disposable database tests.");
  }
  const url = new URL(env.TEST_DATABASE_URL);
  const name = decodeURIComponent(url.pathname.slice(1));
  if (!["postgres:", "postgresql:"].includes(url.protocol) || !/^[a-zA-Z0-9_-]+_test$/.test(name)) {
    throw new Error("TEST_DATABASE_URL must name a PostgreSQL database ending in _test.");
  }
  return name;
}
