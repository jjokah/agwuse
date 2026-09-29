# AG Wuse Church Management System

**Assemblies of God Church, Wuse Zone 5, Abuja** — *Center of Love and Worship*

A comprehensive church management web application providing a public-facing website, member portal, and administrative backend for church leadership and staff.

---

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js (App Router) | 16.x |
| Language | TypeScript | 5.x |
| UI | React | 19.x |
| Styling | Tailwind CSS | 4.x |
| Components | shadcn/ui (Base UI) | v4 |
| Icons | Lucide React | 0.577.x |
| Database | PostgreSQL | 17.x |
| ORM | Prisma | 7.x |
| Auth | Auth.js (next-auth) | v5 |
| Validation | Zod | 4.x |
| Forms | React Hook Form | 7.x |
| Email | Resend + React Email | 6.x |
| Payments | Paystack | Inline JS |
| Rich Text | TipTap | 3.x |
| PDF Export | jsPDF + jspdf-autotable | latest |
| CSV Export | PapaParse | latest |
| Rate Limiting | Upstash Redis | latest |
| Date Utils | date-fns | latest |

---

## Features

### Public Website (18 routes)
- Home page with hero section, service times, latest news, and upcoming events
- About / Statement of Faith (16 Assemblies of God doctrines)
- Leaders page combining ministers, church board, and departmental heads
- Departments & Ministries directory (23 departments)
- Weekly Activities schedule
- Blog / Church News with rich text content
- Announcements and Events calendar with detail pages
- Photo Gallery with albums
- Sermon Archive (audio/video links)
- Live Stream page (YouTube embed)
- Prayer Request and Testimony submission forms
- Membership registration form
- Contact page with church location and phone numbers
- Online Giving with bank details and Paystack integration
- Privacy Policy and Terms of Service pages
- SEO optimized with sitemap.xml and robots.txt

### Authentication & Security
- Email/password registration with email verification (24h token)
- Password reset flow with secure tokens (1h expiry)
- JWT-based sessions with role-based access control
- 6 user roles: Visitor, Member, Dept Lead, Finance, Admin, Super Admin
- Middleware-enforced route protection
- Rate limiting on auth endpoints (Upstash Redis)
- CSP headers with Paystack and YouTube allowlists
- HTML sanitization on all user-generated content (DOMPurify)
- Audit logging for sensitive operations

### Member Portal
- Personal dashboard with announcements and upcoming events
- Giving history with filterable transaction records
- Profile management (personal info, password change)
- Searchable member directory (active members only)

### Admin Panel
- Dashboard with stat cards (members, giving this month/year) and recent activity
- **User Management**: Search, filter, approve, assign roles, deactivate accounts
- **Financial Management**: Record tithes/offerings/donations/expenses, pledge tracking, receipt generation (PDF), financial reports with CSV/PDF export, auto-generated receipt numbers (`AG-YYYY-NNNNN`)
- **Content Management**: Blog editor (TipTap WYSIWYG), event scheduling, sermon archive, gallery management, prayer request/testimony moderation queue
- **Settings**: Church info, department CRUD, audit log viewer

### Finance Portal
- Simplified dashboard for Finance Officers
- Quick transaction entry
- Report generation and export

### Online Giving (Paystack)
- Paystack Inline JS integration (React 19 compatible)
- Server-side payment initialization and webhook verification
- Automatic transaction creation on successful payment
- Supports cards, bank transfers, and USSD

---

## Project Structure

```
agwuse/
├── prisma/
│   ├── prisma.config.ts         # Prisma 7 config with pg adapter
│   ├── schema.prisma            # 19 models, 14 enums
│   ├── seed.ts                  # Departments, categories, super admin
│   └── migrations/
├── public/
│   └── images/
├── src/
│   ├── app/
│   │   ├── layout.tsx           # Root layout (fonts, providers, toaster)
│   │   ├── globals.css          # Tailwind v4 theme + brand colors
│   │   ├── (public)/            # Public pages (header + footer layout)
│   │   ├── (auth)/              # Auth pages (centered card layout)
│   │   ├── (dashboard)/         # Protected pages (sidebar layout)
│   │   │   ├── dashboard/
│   │   │   ├── profile/
│   │   │   ├── my-giving/
│   │   │   ├── directory/
│   │   │   ├── finance/         # Finance Officer routes
│   │   │   └── admin/           # Admin routes
│   │   │       ├── users/
│   │   │       ├── finance/
│   │   │       ├── content/
│   │   │       └── settings/
│   │   └── api/
│   │       ├── auth/[...nextauth]/
│   │       └── paystack/
│   ├── components/
│   │   ├── ui/                  # shadcn/ui components
│   │   ├── layout/              # Header, footer, sidebar, topbar
│   │   ├── forms/               # Login, register, profile, submission forms
│   │   ├── public/              # Hero, service times, minister cards
│   │   └── shared/              # DataTable, stat cards, confirm dialog
│   ├── lib/
│   │   ├── auth.ts              # Auth.js config with Prisma adapter
│   │   ├── route-access.ts      # Pure route-access rules used by the proxy
│   │   ├── tz.ts                # Africa/Lagos date/time helpers
│   │   ├── prisma.ts            # PrismaClient singleton
│   │   ├── constants.ts         # Church info, nav items, roles
│   │   ├── utils.ts             # cn(), formatCurrency(), formatDate()
│   │   ├── sanitize.ts          # HTML sanitization
│   │   ├── pdf.ts               # Receipt and report PDF generation
│   │   ├── csv.ts               # CSV export
│   │   ├── actions/             # Server actions (auth, user, admin, finance, content)
│   │   ├── email/               # Resend wrapper + email templates
│   │   └── validations/         # Zod schemas
│   ├── hooks/                   # Custom React hooks
│   ├── proxy.ts                 # Next.js 16 proxy: auth + RBAC route protection
│   └── types/                   # TypeScript types, next-auth augmentation
├── docker-compose.yml           # PostgreSQL 17
├── package.json
├── next.config.ts
└── tsconfig.json
```

**19 database models** | **14 enums**

---

## Getting Started

### Prerequisites

- Node.js 24.x (LTS)
- Docker (for PostgreSQL)
- npm

### 1. Clone the repository

```bash
git clone https://github.com/your-org/agwuse.git
cd agwuse
```

### 2. Install dependencies

```bash
npm ci
```

### 3. Set up environment variables

```bash
cp .env.example .env
```

Edit `.env` with your values (see [Environment Variables](#environment-variables) below).

> **The app will not start without `.env`.** It is gitignored, so a fresh clone has no
> `.env` at all — `DATABASE_URL` is then `undefined` and every Prisma query fails with
> `ECONNREFUSED`. See [Troubleshooting](#troubleshooting).
>
> Note the database port: `docker-compose.yml` maps PostgreSQL to host port **5433**,
> not the default 5432. The values in `.env.example` already match.

### 4. Start the database

```bash
docker compose up -d
```

This starts PostgreSQL 17 on port **5433** with:
- User: `agwuse`
- Password: `agwuse_dev_2026`
- Database: `agwuse`

### 5. Run database migrations and seed

```bash
# PowerShell: choose credentials before the first seed
$env:SEED_ADMIN_EMAIL="admin@agwuse.org"
$env:SEED_ADMIN_PASSWORD="choose-a-strong-development-password"

npm run db:deploy
npm run db:seed
```

The seed creates:
- A super admin account using `SEED_ADMIN_EMAIL` and `SEED_ADMIN_PASSWORD`. In
  development, a random password is printed if `SEED_ADMIN_PASSWORD` is unset.
- 23 church departments
- Default financial categories
- Church settings (name, address, phones, bank details)

### 6. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the public site.

Log in at [http://localhost:3000/login](http://localhost:3000/login) with the super admin credentials.

---

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `DIRECT_DATABASE_URL` | Direct PostgreSQL connection (bypasses pooler) | Yes |
| `AUTH_SECRET` | Auth.js secret key (generate with `openssl rand -base64 32`) | Yes |
| `NEXTAUTH_SECRET` | Legacy name, accepted instead of `AUTH_SECRET` | No |
| `AUTH_URL` | App base URL (`http://localhost:3000` for dev) | Yes |
| `NEXT_PUBLIC_APP_URL` | Public app URL (same as AUTH_URL) | Yes |
| `EMAIL_TRANSPORT` | `log` for local development or `resend` for real delivery | No |
| `EMAIL_FROM` | Sender identity on a verified Resend domain | For real email |
| `RESEND_API_KEY` | Resend email service API key | For real email |
| `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` | Reserved for client-side Paystack integrations; currently unused | No |
| `PAYSTACK_SECRET_KEY` | Paystack secret key | For payments |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob read/write token | For uploads |
| `UPSTASH_REDIS_REST_URL` | Upstash Redis URL | For rate limiting |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis token | For rate limiting |
| `DATABASE_POOL_MAX` | Max pg connections per server instance (default 5) | No |
| `AUTH_REVALIDATE_SECONDS` | How often a session is re-checked against the DB (default 60) | No |
| `TRUSTED_PROXY_HOPS` | Proxies in front of the app, for client-IP rate limiting (default 1) | No |

---

## Database

### Models (19)

| Category | Models |
|----------|--------|
| Auth | User, Account, Session, VerificationToken, Token |
| Core | Department |
| Financial | FinancialTransaction, Pledge, FinancialCategory, PaymentIntent, ReceiptCounter |
| Content | BlogPost, Event, Submission, GalleryImage, Sermon, LiveStreamConfig |
| System | AuditLog, ChurchSettings |

### Prisma Commands

```bash
npm run db:migrate      # Create and apply migrations
npm run db:push         # Push schema changes (no migration file)
npm run db:generate     # Regenerate Prisma Client
npm run db:studio       # Open Prisma Studio (visual DB editor)
npm run db:seed         # Seed database with initial data
```

> **Note**: Prisma 7 requires the `--config prisma/prisma.config.ts` flag. All `db:*` scripts include this automatically.

---

## Authentication & Roles

| Role | Access |
|------|--------|
| Visitor | Public pages only |
| Member | Public + Dashboard, profile, giving history, directory |
| Dept Lead | Member access + department-specific features |
| Finance | Member access + financial recording and reports |
| Admin | Full backend: users, finance, content, settings |
| Super Admin | All access including system settings and audit logs |

Route protection is enforced by the Next.js 16 proxy (`src/proxy.ts`, Node.js runtime) using the
rules in `src/lib/route-access.ts`. Every page re-checks access server-side with `requirePageRole()`
(redirects), and server actions / route handlers use `requireAuth()` / `requireRole()`, which read the
user's current role and status from the database.

### Time zone

All wall-clock times (event times, "today", report day/month boundaries, displayed dates) are
**Africa/Lagos** (UTC+1, no DST), regardless of the server's time zone. Use the helpers in
`src/lib/tz.ts` and `formatDate()`/`formatDateTime()` from `src/lib/utils.ts`; never
`toISOString().split("T")[0]` for "today".

---

## NPM Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Type-check with `tsc --noEmit` |
| `npm test` | Run the Vitest suites |
| `npm run test:integration` | Run the database integration suites (needs a `*_test` database, see below) |
| `npm run db:deploy` | Apply pending migrations (CI / production) |
| `npm run db:migrate` | Run Prisma migrations |
| `npm run db:push` | Push schema to database |
| `npm run db:generate` | Generate Prisma Client |
| `npm run db:studio` | Open Prisma Studio |
| `npm run db:seed` | Seed database |

### Integration tests

`src/__tests__/integration/*.int.test.ts` exercise the finance ledger and Paystack
recording against a real PostgreSQL database (receipt numbering, pledge payments and
voids, concurrent Paystack writers). They **truncate tables**, so they only run when
`DATABASE_URL` points at a database whose name contains `_test`; otherwise the
project collects no files. CI runs them against its own Postgres service.

```powershell
# One-time: create and migrate a local test database in the Docker container
docker exec agwuse-db psql -U agwuse -d agwuse -c "create database agwuse_test"
$env:DATABASE_URL="postgresql://agwuse:agwuse_dev_2026@localhost:5433/agwuse_test"
$env:DIRECT_DATABASE_URL=$env:DATABASE_URL
npm run db:deploy

# Run
npm run test:integration
```

---

## Troubleshooting

### Pages using the database fail with `PrismaClientKnownRequestError`

Symptom — a DB-backed page (`/departments`, `/leaders`, `/blog`, the dashboard, login)
shows a Next.js error overlay like:

```
Invalid `prisma.department.findMany()` invocation in ...
```

...often with **no message body after it**. The empty body is the tell: it means the
connection was refused before any query ran (`code: ECONNREFUSED`), not that the query
is malformed. Static pages (`/`, `/about`, `/contact`) keep working, which can make it
look page-specific when it is not.

Check, in order:

1. **Does `.env` exist?** It is gitignored, so a fresh clone has none.
   `src/lib/prisma.ts` reads `process.env.DATABASE_URL!` with no fallback — if unset,
   `pg` silently tries `localhost:5432` and is refused.
   ```bash
   cp .env.example .env
   ```
2. **Is the database container running?**
   ```bash
   docker compose up -d db
   docker ps --filter name=agwuse-db
   ```
3. **Is `DATABASE_URL` on the right port?** Docker maps PostgreSQL to **5433**, not
   5432. A URL ending in `:5432/agwuse` is refused unless you also run a local Postgres.
4. **Confirm the port is actually listening:**
   ```bash
   # PowerShell
   (Test-NetConnection localhost -Port 5433).TcpTestSucceeded
   ```
5. **Have migrations been applied?** A reachable but empty database throws a different
   error (`P2021: table does not exist`). Fix with `npm run db:migrate && npm run db:seed`.

### `/leaders` renders, but the "Departmental Heads" section is missing

This is expected, not a failure. Ministers and the church board on `/leaders` are static
content in the page file; **departmental heads are read from the database** — only
departments that are `isActive` *and* have a `leaderId` assigned appear, and the whole
section is hidden when none match.

Assign leaders under **Admin → Settings → Departments → [department] → Leader**. The
seed creates 23 departments but does not assign leaders to them.

Note that this query is deliberately wrapped in a `try/catch` that falls back to an empty
list, so a database outage hides that one section instead of taking down the static
ministers and board content with it. If the section is unexpectedly empty, check the
server console for `Failed to load departmental heads:` before assuming it is a data issue.

### Docker command not found

Docker Desktop must be running, and its CLI must be on `PATH`. If `docker ps` fails in
your shell but Docker Desktop is open, restart the terminal so it picks up `PATH`.

---

## Deployment

### Vercel (Recommended)

1. Push the repository to GitHub
2. Import the project on [Vercel](https://vercel.com)
3. Set all environment variables in the Vercel dashboard
4. Use a managed PostgreSQL provider (Neon, Supabase, Railway) for the database
5. Update `DATABASE_URL` and `DIRECT_DATABASE_URL` to point to the managed database
6. Deploy

### Production Checklist

- [ ] Set `AUTH_SECRET` to a strong random value
- [ ] Configure Resend with a verified domain
- [ ] Set up Paystack live keys (switch from test mode)
- [ ] Configure Vercel Blob for image uploads
- [ ] Set up Upstash Redis for rate limiting
- [ ] Enable daily database backups
- [ ] Review CSP headers in `src/lib/security-headers.ts`

---

## License

This is a private project built for Assemblies of God Church, Wuse Zone 5, Abuja.
