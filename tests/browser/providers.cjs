/* eslint-disable @typescript-eslint/no-require-imports -- Node's preload hook requires CommonJS. */
// Loaded ONLY by Playwright's server process. Never installed into production app code.
const fs = require("node:fs");
const path = require("node:path");
const db = new URL(process.env.TEST_DATABASE_URL || "postgresql://invalid/invalid");
if (process.env.ALLOW_TEST_DATABASE_RESET !== "true" || !/^[a-zA-Z0-9_-]+_test$/.test(decodeURIComponent(db.pathname.slice(1)))) {
  throw new Error("Browser provider mocks require an explicitly authorized disposable database");
}
const failed = new Set();
const payments = new Map();
const originalFetch = globalThis.fetch;
globalThis.fetch = async (input, options) => {
  const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
  if (url.startsWith("https://api.resend.com/")) {
    const body = JSON.parse(options?.body || "{}");
    const to = Array.isArray(body.to) ? body.to[0] : body.to;
    if (to?.startsWith("delivery-fail") && !failed.has(to)) {
      failed.add(to);
      return Response.json({ name: "application_error", message: "Mock delivery failure" }, { status: 503 });
    }
    fs.mkdirSync(path.dirname(process.env.E2E_OUTBOX), { recursive: true });
    fs.appendFileSync(process.env.E2E_OUTBOX, JSON.stringify(body) + "\n");
    return Response.json({ id: "mock-delivery" });
  }
  if (url === "https://api.paystack.co/transaction/initialize") {
    const data = JSON.parse(options?.body || "{}");
    payments.set(data.reference, { reference: data.reference, amount: data.amount, currency: "NGN", status: "success", customer: { email: data.email }, metadata: data.metadata });
    return Response.json({ status: true, data: { reference: data.reference, authorization_url: `http://127.0.0.1:3108/give/complete?reference=${data.reference}`, access_code: "mock" } });
  }
  if (url.startsWith("https://api.paystack.co/transaction/verify/")) {
    const reference = decodeURIComponent(url.split("/").at(-1));
    return Response.json({ status: payments.has(reference), data: payments.get(reference) });
  }
  // Automated workflows must never contact live email/payment services.
  return originalFetch(input, options);
};
