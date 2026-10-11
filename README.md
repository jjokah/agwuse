# AG Wuse Church Management System

Assemblies of God Church, Wuse Zone 5, Abuja — Center of Love and Worship.

Next.js application with a public church website, member portal, finance workspace and administrative backend. The launch target is Vercel with PostgreSQL, Resend, Paystack, Vercel Blob and Upstash.

## Implemented behavior

- Public pages cover church information, leaders, departments, activities, blog/news, announcements, events, gallery, sermons, livestream, prayer requests, testimonies, contact and giving.
- Registration verifies the email before sign-in and requires separate administrator approval. Verification links expire after 24 hours; password reset links after one hour. Failed/expired verification is recoverable at `/resend-verification`. Repeated registration sends account guidance without replacing existing password-reset tokens.
- Members can edit profiles, change passwords, view giving and download their own receipts. Giving has date, transaction-type and payment-method filters, a filtered total and CSV download. Expenses and voided transactions are excluded.
- The directory shows active non-Visitor names and departments. Email and phone sharing are separate profile options, both off by default. Hidden contacts are excluded from server-side selection and search matching. Authorized administrators and finance staff retain access for their work.
- Finance staff record transactions, track pledges, void entries with an audit trail, and export reports/receipts. CSV exports above 50,000 rows ask the user to narrow the date range.
- Administrators manage users, content, departments and moderation. Sensitive changes and audits commit together. Media cleanup runs after persistence and retains assets referenced elsewhere.
- Giving redirects to hosted Paystack checkout. Callback, verification and signed webhook processing use exact integer kobo amounts and the verified reference. Concurrent duplicate callbacks record one ledger entry.

Department-leader portals, event registration, online pledge payments and automated reconciliation are deferred. Assigned department leaders appear on public leader pages but have no separate management portal.

## Technology

| Area | Implementation |
| --- | --- |
| App/UI | Next.js 16.4, React 19, TypeScript, Tailwind 4, shadcn/Base UI, Lucide |
| Data/auth | PostgreSQL 17, Prisma 7 CLI/client/pg adapter, Auth.js v5 beta, bcrypt |
| Forms | Native FormData/server actions, React state and Zod |
| Content | TipTap and DOMPurify |
| Delivery/storage | Resend/React Email, Vercel Blob |
| Finance | Hosted Paystack checkout, jsPDF/AutoTable, internal CSV serializer |
| Limits/tests | Upstash Redis, Vitest, Playwright/Chromium and axe |

Forms do not use React Hook Form. CSV exports do not use PapaParse. Paystack Inline is not used. Exact versions and dependency paths are recorded in `package-lock.json`.

## Development setup

Install Node.js 24, npm and Docker. Clone `https://github.com/jjokah/agwuse.git`, then run commands from the project directory. Copy `.env.example` to `.env`:

```powershell
# Windows PowerShell
Copy-Item .env.example .env
```

```sh
# Unix
cp .env.example .env
```

Choose a random `AUTH_SECRET` and seed administrator credentials. Keep the local database URLs on port **5433**, matching Compose. Start Docker, then:

```sh
npm ci
npm run db:generate
docker compose up -d db
npm run db:deploy
npm run db:seed
npm run dev
```

Set `SEED_ADMIN_EMAIL` and `SEED_ADMIN_PASSWORD` before seeding; [setup and testing](docs/testing.md) gives Windows and Unix examples. Development seed generates and prints a random password if none is supplied. Open [localhost:3000](http://localhost:3000), and sign in at `/login` with the seed credentials.

Use `EMAIL_TRANSPORT=log` for local recovery: the server terminal prints usable verification/reset links. Production rejects email logging and requires configured Resend delivery.

## Configuration

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | Application PostgreSQL connection, pooled when required by the provider |
| `DIRECT_DATABASE_URL` | Direct PostgreSQL connection for migrations |
| `AUTH_SECRET` | Unique secret; legacy `NEXTAUTH_SECRET` is also accepted |
| `AUTH_URL`, `NEXT_PUBLIC_APP_URL` | Deployment origin; public URL is embedded at build time |
| `EMAIL_TRANSPORT` | `log` only for development/test; `resend` for delivery |
| `RESEND_API_KEY`, `EMAIL_FROM` | Required for production delivery; verified sender domain |
| `PAYSTACK_SECRET_KEY` | Test key in staging, live key in production |
| `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` | Reserved; unused by current hosted checkout |
| `BLOB_READ_WRITE_TOKEN` | Environment-specific Blob store token |
| `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | Shared IP/account limits; configure both for Vercel |
| `DATABASE_POOL_MAX` | Connection budget per server instance, default 5 |
| `AUTH_REVALIDATE_SECONDS` | Session database refresh interval, default 60 seconds |
| `TRUSTED_PROXY_HOPS` | Trusted proxy chain for client IP extraction, default 1 |
| `TEST_DATABASE_URL`, `ALLOW_TEST_DATABASE_RESET` | Disposable test authorization; never use real data |

Production validates core database, auth and email settings. Missing Upstash uses a local limiter with a production warning; it cannot share limits across Vercel instances and must be configured before launch. `/api/health/ready` returns only healthy/unavailable database status.

## Roles and access

All roles can browse public pages. Protected pages/actions require active accounts; credentials sign-in also requires a verified email.

| Role | Additional access |
| --- | --- |
| Visitor | Dashboard, profile and own giving/receipts; excluded from directory |
| Member | Dashboard, profile, own giving and directory |
| Dept Lead | Member access; department assignment, no separate leader portal |
| Finance | Member access plus finance recording, pledges, transactions and reports |
| Admin | Users, finance, content, departments and audit logs |
| Super Admin | Administrator access plus church/system settings and protected role operations |

The proxy requires an actual user identity. Server-side guards recheck the database role, status and session version; private metadata guards run before loading account details. Password changes, deactivation and sensitive role changes revoke sessions.

Calendar-only fields are validated and stored as UTC dates. Event wall-clock inputs, displayed dates and day/report boundaries use Africa/Lagos. Open pledges become overdue after their due calendar day ends in Lagos, consistently in filters and presentation.

## Commands and verification

| Command | Purpose |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build`, `npm start` | Production build/server |
| `npm run lint`, `npm run typecheck` | ESLint and TypeScript |
| `npm test` | Unit tests only |
| `npm run test:integration` | Destructive suites, explicitly isolated and authorized |
| `npm run test:browser` | Browser workflows with a built server and disposable database |
| `npm run audit:dependencies` | Dependency report and applicability/expiry gate |
| `npm run db:deploy` | Apply checked-in migrations |
| `npm run db:migrate` | Create/apply development migrations |
| `npm run db:generate`, `npm run db:studio` | Generate client / inspect database |
| `npm run db:seed` | Initial development data and administrator |

Integration/browser tests truncate tables and require a database name ending in `_test`, explicit `TEST_DATABASE_URL`, `ALLOW_TEST_DATABASE_RESET=true` and matching `current_database()`. Misconfiguration and empty discovery fail. Never use development or production. See [safe testing commands](docs/testing.md).

CI gates lint, types, unit tests, disposable PostgreSQL integrations, production build, browser workflows and dependency findings. Provider tests use mocks; live integrations need separate staging validation. Remaining high findings and remediation are documented in [dependency findings](docs/dependency-findings.md).

## Deployment and operations

Follow the [Vercel launch runbook](docs/launch-runbook.md) for isolated environments, production-only migrations, providers, staging validation, backup/restore, failed-payment investigation and rollback. Apply the additive directory-privacy migration before deploying its UI. Do not put production migrations in a shared preview build command.

If database pages fail, check `.env`, database port 5433, `docker compose up -d db`, and migration status. A missing departmental-head section on `/leaders` can mean no active department has an assigned leader; assign one under Admin → Settings → Departments. Docker Desktop must be running and its CLI available in the terminal.

## Project layout

`src/app` contains public/auth/dashboard routes and APIs; `src/components` contains UI/forms/shared finance views; `src/lib` contains guards, actions, validators and provider/data helpers. `prisma` holds schema, migrations and seed. Unit/integration tests live in `src/__tests__`, browser tests in `tests/browser`, and operations guidance in `docs`.

This is a private project built for Assemblies of God Church, Wuse Zone 5, Abuja.
