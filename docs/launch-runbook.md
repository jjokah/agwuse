# AG Wuse launch runbook

## Environments and Vercel

Use separate PostgreSQL databases, Resend configuration, Paystack credentials, Blob stores, and Upstash namespaces for preview/staging and production. Configure them in their respective [Vercel environment scopes](https://vercel.com/docs/environment-variables). Preview deployments must never receive the production database URL. Do not copy production member data into preview or test databases.

Configure [Node.js 24 in Vercel](https://vercel.com/docs/functions/runtimes/node-js/node-js-versions), use `npm ci` for installation and `npm run build` for the build command. Prisma CLI, client and PostgreSQL adapter are on the same version 7 release. Run `npm run db:generate` explicitly if your npm installation policy disables lifecycle scripts. Build the deployment with its correct `NEXT_PUBLIC_APP_URL`; public environment values are embedded at build time.

Set `DATABASE_URL` to the application's pooled PostgreSQL connection and `DIRECT_DATABASE_URL` to the direct connection used by migrations. Choose `DATABASE_POOL_MAX` for the provider's connection budget across server instances (default 5 per instance). Use TLS as required by the database provider.

Set `AUTH_SECRET` to a unique random value, `AUTH_URL` and `NEXT_PUBLIC_APP_URL` to the deployment origin. Configure Auth.js trusted-host behavior only for the trusted Vercel host. Production startup rejects missing authentication/database configuration. Production email operations reject logging or missing Resend delivery credentials. `/api/health/ready` checks PostgreSQL connectivity and the directory-privacy schema without reading member records, and returns only `{"status":"healthy"}` or `{"status":"unavailable"}` (503); it does not expose connection details.

Email configuration failures emit an `email_configuration_invalid` startup log and block email operations with explicit errors; they do not prevent unrelated pages from starting. Fix production-scoped email settings and redeploy when this log appears.

For email, set `EMAIL_TRANSPORT=resend`, a valid `RESEND_API_KEY`, and `EMAIL_FROM` on a verified domain. Verify DNS and delivery in staging. [Resend idempotency keys](https://resend.com/changelog/idempotency-keys) are passed as SDK request options. Local `EMAIL_TRANSPORT=log` prints the full plain-text message, including verification/reset links, to the server terminal. Logging is disabled in production. Failed delivery is shown in recovery forms; users can retry `/resend-verification`. Email verification confirms the address; administrator approval is a separate step.

Set `PAYSTACK_SECRET_KEY` to a **test** key in staging and a live key only in production. The app redirects donors to hosted Paystack checkout; it does not use Paystack Inline. Configure the webhook URL as `https://<deployment>/api/paystack/webhook`. The callback returns to `/give/complete?reference=...`; `/api/paystack/verify` also verifies payments server-side. Check the signature against the exact webhook body, integer kobo amount, currency and verified reference. Public-key configuration is reserved for future client integrations.

Connect Vercel Blob and set its environment-specific `BLOB_READ_WRITE_TOKEN`. Exercise browser uploads and the signed upload-completed callback in staging. The upload API issues tokens only after authentication and folder/role checks. Cleanup runs after persistence, keeps URLs referenced by other records, and logs failures for later investigation.

Connect Upstash and configure both `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`. Verify distributed IP/account throttling in staging. The in-memory fallback supports local development and emits a production warning; it does not enforce shared limits across Vercel instances. Do not launch with the fallback. Keep `TRUSTED_PROXY_HOPS` aligned with the actual trusted proxy chain; Vercel supplies the client IP.

## Four review batches and rollout

1. **Dependency and test safety:** patched dependencies; unit-only default; explicit disposable test URL, reset authorization and connected-database check; CI dependency report.
2. **Correctness:** transactional tokens/audits, recovery and delivery errors, exact payment reconciliation, committed asset cleanup, strict calendar dates, safe filters/pagination and snapshot report exports.
3. **Member features:** opt-in contact visibility, recovery route, filtered giving/CSV, accessible controlled member selection and shared pledge lists.
4. **Documentation and validation:** setup/runbooks, regression suites, browser provider mocks, build and staging checklist.

Review the diff by these groups. Run the complete gate against a disposable database before promotion. Back up production, then apply the additive `20261009120000_directory_contact_privacy` migration **before deploying the UI**. Existing/new accounts get both sharing flags set to false. Keep the columns on rollback; they are compatible with older code.

Run production migrations once in a controlled release step using production-scoped direct credentials. Never put production migration execution into a general Vercel build command: preview builds also execute that command. CI migrates only its disposable test database. Locally use migrations against the development database deliberately; never use `db:push` to update production.

```sh
# In the controlled production release environment, with both URLs set correctly:
npm run db:deploy
# Verify migration status using the same direct connection:
npx prisma migrate status --config prisma/prisma.config.ts
```

Deploy the reviewed build to staging, complete the checks below, then promote on Vercel. Confirm readiness, public pages, login, private route restrictions and the migration version after promotion. Do not seed production repeatedly or print real credentials into build logs.

## Automated release gate

CI runs lint, TypeScript, unit tests, integration tests, production build and Chromium browser tests, with migrations on disposable PostgreSQL. Email/payment/storage tests use mocks. `npm run audit:dependencies` reports both overall and production dependency entries and rejects undocumented high/critical advisories; applicability and remediation are recorded in `dependency-findings.md` and `dependency-exceptions.json`.

Follow [testing.md](testing.md) for the local Windows/Unix commands. Successful unit tests alone are insufficient for a release. Browser traces/screenshots may contain fixture data; CI stores them as test artifacts. Do not run the browser setup or integration resets against an environment containing real members.

## Staging validation with test credentials

Automated mocks validate application behavior, not provider configuration. Record the deployment identifier, migration version, date, tester and result for each item before promoting:

- Register, follow the delivered email link, confirm the account remains pending, approve it as an administrator, and sign in. Exercise resend and reset, including an expired link and delivery failure. Confirm a password change/deactivation revokes existing sessions.
- Make a Paystack test payment. Confirm one ledger row, exact amount/type/member, receipt, intent status and audit entry after callback, webhook retry and manual verification. Test a failed payment and verify no successful receipt is issued.
- Upload/replace avatars and content media. Verify the new asset persists, old unreferenced media is removed, and shared assets remain. Confirm failures are visible in structured logs.
- Check opt-in email/phone sharing and searches from another member account. Confirm a Visitor is excluded from the directory. Check member giving filters, totals, CSV and owner-only receipts.
- Exercise mobile navigation, keyboard member selection, pledge payments/voids, overdue day boundaries and report downloads. Check Upstash limits across requests and database readiness during an outage drill.
- Confirm preview uses test credentials and independent data; production uses its own verified delivery domain, webhook and Blob store. Confirm backups can actually be restored.

No real provider staging run or deployment is implied by automated test results. Keep department-leader portals, event registration, online pledge payments and automated reconciliation outside this launch.

## Backup and restore

Use provider-managed scheduled backups and point-in-time recovery. Before a migration, take a custom-format PostgreSQL dump using the **direct** connection and store it encrypted outside the repository. Avoid pasting credentials in tickets or shell history; use a protected connection/service file or temporary environment variables.

```sh
pg_dump --format=custom --no-owner --file=agwuse-backup.dump "$DIRECT_DATABASE_URL"
# Restore into a newly provisioned, isolated recovery database, never over the live DB:
pg_restore --no-owner --dbname="$RESTORE_DATABASE_URL" agwuse-backup.dump
```

PowerShell uses `$env:DIRECT_DATABASE_URL` / `$env:RESTORE_DATABASE_URL` in place of Unix variables. Validate row counts, migration history, recent payments and sign-in against the restored database before any traffic switch. Treat the dump as sensitive member/finance data. Never commit it.

## Failed-payment investigation

Search structured logs for `payment_recording_failed` using the verified payment reference. Inspect the matching PaymentIntent and FinancialTransaction (`paystackRef`), amount in decimal Naira, verified integer kobo, currency, status, transaction link and audit actions. Compare with Paystack's verified test/live transaction in the correct environment. Conflicting metadata references or amount/currency mismatch must not be manually accepted as matching.

If Paystack succeeded but the ledger write failed, repair the underlying database/system-administrator issue and retry server verification or the signed webhook. Recording is idempotent; a concurrent winner must exist in the ledger before duplicate success is returned. Investigate unmatched payments separately; they are recorded as general donations without assigning a member from untrusted metadata. Use finance's audited void workflow to correct a ledger entry rather than deleting financial records. Escalate refunds through the provider's established process.

Inspect `email_delivery_failed` / `receipt_email_failed` and provider delivery logs for missing receipts. Retrying a receipt should reuse `receipt-<receipt number>` as the idempotency key. Investigate `asset_cleanup_failed` after database recovery; verify all references again before deleting media. Logs should not contain passwords, raw tokens, or provider secrets; development email logging intentionally contains local recovery links.

## Rollback

On a failed promotion, return traffic to the previous known-good Vercel deployment. Preserve the additive privacy columns and database records. Do not roll back schema by dropping tables or restore a backup over new live payments. If data recovery is required, restore to an isolated database first, reconcile intervening writes, then perform a controlled traffic switch. Check environment scope, readiness, authentication/session behavior and recent payment recording after rollback. Keep a record of failed deployment IDs and actions taken.
