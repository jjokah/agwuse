# Setup and safe testing

Use Node.js 24, npm and Docker Desktop (Windows) or Docker Engine with Compose (Unix). Start Docker before running database commands. `npm ci` installs the lockfile; `npm run db:generate` explicitly generates Prisma when npm lifecycle scripts are disabled by your installation policy.

## Local development

Copy `.env.example` to `.env` using `Copy-Item .env.example .env` in PowerShell or `cp .env.example .env` in Unix shells. Set a random `AUTH_SECRET`, leave development URLs on port 3000 and use the development PostgreSQL URL on port 5433. Start `docker compose up -d db`, then run `npm run db:deploy` and `npm run db:seed`. Choose seed credentials first:

```powershell
$env:SEED_ADMIN_EMAIL="admin@example.test"
$env:SEED_ADMIN_PASSWORD="choose-a-strong-development-password"
npm ci
npm run db:generate
npm run db:deploy
npm run db:seed
npm run dev
```

Unix uses `export SEED_ADMIN_EMAIL=admin@example.test` and `export SEED_ADMIN_PASSWORD='choose-a-strong-development-password'` before the same npm commands. The seed creates departments, categories, church settings and the super administrator. Keep credentials outside version control.

For local email use `EMAIL_TRANSPORT=log`. Verification/reset messages, including usable URLs, print in the server terminal. Open the link, then approve the account separately as an administrator. Failed or expired verification can be retried at `/resend-verification`. Real delivery uses `EMAIL_TRANSPORT=resend` with a verified sender and API key. Production prohibits logging.

## Unit tests

`npm test` runs only unit tests and never resets a database. Run `npm run lint` and `npm run typecheck` too. Unit tests mock email, storage and payment providers. Missing or empty test discovery fails rather than reporting a successful empty run.

## Disposable database and browser tests

Integration and browser setup **truncate tables**. They require both `TEST_DATABASE_URL` and `ALLOW_TEST_DATABASE_RESET=true`. The parsed database name must end in `_test`; a username or query parameter containing `_test` cannot authorize reset. The connection must match `TEST_DATABASE_URL`, and `current_database()` is checked before truncation. Never point these commands at development, preview or production data.

Compose's test service stores its database in memory and uses port 5434, separate from development on 5433. Stopping the test service discards its data. Start and wait for it, then use a new terminal for test environment variables:

```powershell
docker compose --profile test up -d --wait test-db
$env:TEST_DATABASE_URL="postgresql://agwuse_test:isolated_test_only@127.0.0.1:5434/agwuse_test"
$env:ALLOW_TEST_DATABASE_RESET="true"
$env:DATABASE_URL=$env:TEST_DATABASE_URL
$env:DIRECT_DATABASE_URL=$env:TEST_DATABASE_URL
npm run db:deploy
npm run test:integration
npm run build
npx playwright install chromium
npm run test:browser
npm run audit:dependencies
docker compose --profile test stop test-db
```

```sh
docker compose --profile test up -d --wait test-db
export TEST_DATABASE_URL='postgresql://agwuse_test:isolated_test_only@127.0.0.1:5434/agwuse_test'
export ALLOW_TEST_DATABASE_RESET=true
export DATABASE_URL="$TEST_DATABASE_URL"
export DIRECT_DATABASE_URL="$TEST_DATABASE_URL"
npm run db:deploy
npm run test:integration
npm run build
npx playwright install --with-deps chromium
npm run test:browser
npm run audit:dependencies
docker compose --profile test stop test-db
```

Close the test terminal before starting normal development, or remove these four environment variables. Shell variables override `.env`. Do not run integration and browser suites concurrently: both reset the same disposable database. Unit tests can run independently.

Playwright starts the built production server on port 3108, resets/seeds its own fixtures and intercepts email and Paystack HTTP calls in a Node preload file. No production application test bypass is installed. The fixture outbox is `test-results/provider-outbox.jsonl`; failure traces/screenshots and audit JSON also stay under ignored test artifact directories. Do not reuse real member data as fixtures. `npx playwright show-report` opens the browser report.

CI creates disposable PostgreSQL, migrates it, runs lint/types/unit/integration/build/browser checks and the dependency applicability gate. `audit:dependencies` fails on undocumented or expired high/critical findings and audit service failures. Review findings monthly and whenever dependencies change. See [dependency findings](dependency-findings.md).

Real email, Paystack, Blob and Upstash configuration is validated separately in staging with test credentials, following [the launch runbook](launch-runbook.md). Automated provider mocks do not establish live delivery or settlement.
