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
| Charts | Recharts | 3.x |
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
- Ministers and Church Board profiles
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
- Dashboard with stat cards, giving trends, and membership charts
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
│   ├── schema.prisma            # 16 models, 13 enums
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
│   │   ├── charts/              # Giving trends, income breakdown
│   │   ├── public/              # Hero, service times, minister cards
│   │   └── shared/              # DataTable, stat cards, confirm dialog
│   ├── lib/
│   │   ├── auth.ts              # Auth.js config with Prisma adapter
│   │   ├── auth.config.ts       # Edge-compatible auth config
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
│   └── types/                   # TypeScript types, next-auth augmentation
├── docker-compose.yml           # PostgreSQL 17
├── package.json
├── next.config.ts
├── middleware.ts                 # Auth + RBAC route protection
└── tsconfig.json
```

**59 routes total** | **48 component files** | **16 database models** | **0 TypeScript errors**

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
npm install
```

### 3. Set up environment variables

```bash
cp .env.example .env
```

Edit `.env` with your values (see [Environment Variables](#environment-variables) below).

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
npm run db:migrate
npm run db:seed
```

The seed creates:
- Super admin account (`admin@agwuse.org` / `Admin@2026!`)
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
| `AUTH_SECRET` | NextAuth secret key (generate with `openssl rand -base64 32`) | Yes |
| `AUTH_URL` | App base URL (`http://localhost:3000` for dev) | Yes |
| `NEXT_PUBLIC_APP_URL` | Public app URL (same as AUTH_URL) | Yes |
| `RESEND_API_KEY` | Resend email service API key | Yes |
| `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` | Paystack public key | For payments |
| `PAYSTACK_SECRET_KEY` | Paystack secret key | For payments |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name | For uploads |
| `CLOUDINARY_API_KEY` | Cloudinary API key | For uploads |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret | For uploads |
| `UPSTASH_REDIS_REST_URL` | Upstash Redis URL | For rate limiting |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis token | For rate limiting |

---

## Database

### Models (16)

| Category | Models |
|----------|--------|
| Auth | User, Account, Session, VerificationToken, Token |
| Core | Department |
| Financial | FinancialTransaction, Pledge, FinancialCategory |
| Content | BlogPost, Event, Submission, GalleryImage, Sermon |
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

Route protection is enforced at the middleware level. API actions use `requireAuth()` and `requireRole()` guards.

---

## NPM Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run db:migrate` | Run Prisma migrations |
| `npm run db:push` | Push schema to database |
| `npm run db:generate` | Generate Prisma Client |
| `npm run db:studio` | Open Prisma Studio |
| `npm run db:seed` | Seed database |

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
- [ ] Configure Cloudinary for image uploads
- [ ] Set up Upstash Redis for rate limiting
- [ ] Enable daily database backups
- [ ] Review CSP headers in `next.config.ts`

---

## License

This is a private project built for Assemblies of God Church, Wuse Zone 5, Abuja.
