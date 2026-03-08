# AG Wuse Church Management System - Implementation Plan

## Context

AG Wuse (Assemblies of God Church, Wuse Zone 5, Abuja) needs a modern web application to replace their static WordPress/Joomla site. The system will serve as a public website, member portal, and admin backend for church operations. Phase 1 (MVP) covers: User Management, Financial Management, and the Public Website. The repo currently contains only the project brief and church logo — this is a greenfield build.

---

## Tech Stack (Latest Stable Versions - March 2026)

| Layer | Package | Version |
|-------|---------|---------|
| Runtime | Node.js LTS | 24.x |
| Framework | Next.js (App Router) | 16.1.x |
| UI Library | React | 19.x |
| Language | TypeScript | 5.9.x |
| Styling | Tailwind CSS | 4.x (CSS-first config) |
| Components | shadcn/ui | CLI v4 |
| Icons | Lucide React | 0.577.x |
| Database | PostgreSQL | 17.x (broad hosting support) |
| ORM | Prisma | 7.x (requires driver adapter `@prisma/adapter-pg` + `pg`) |
| Auth | Auth.js v5 (`next-auth@beta`) | 5.x (production-stable) |
| Validation | Zod | 4.x |
| Forms | React Hook Form + `@hookform/resolvers` | 7.x |
| Charts | Recharts | 3.x |
| Email | Resend + React Email | 6.x |
| Payments | `paystack-sdk` (server) + `react-paystack` (client) | 3.x / 6.x |
| PDF | jspdf + jspdf-autotable | latest |
| CSV | papaparse | latest |
| Rich Text | TipTap | latest |
| Rate Limiting | `@upstash/ratelimit` + `@upstash/redis` | latest |
| Date Utils | date-fns | latest |

### Key Migration Notes
- **Tailwind v4**: Uses `@import "tailwindcss"` and `@theme` directives in CSS instead of `tailwind.config.js`
- **Prisma 7**: ESM-only, requires `@prisma/adapter-pg` driver adapter, config in `prisma.config.ts`
- **Zod 4**: Error customization uses `{ error: "..." }` instead of `{ message: "..." }`; `z.strictObject()` replaces `.strict()`
- **Next.js 16**: `cookies()`, `headers()`, `params`, `searchParams` are all async

---

## Project Structure

```
agwuse/
├── .env.local / .env.example
├── .gitignore
├── next.config.ts
├── middleware.ts                  # Auth + RBAC route protection
├── prisma/
│   ├── prisma.config.ts          # Prisma 7 config with pg adapter
│   ├── schema.prisma
│   ├── seed.ts                   # Departments, categories, super admin
│   └── migrations/
├── public/
│   ├── ag-logo.png
│   └── images/                   # Hero, ministers, gallery, og-image
├── src/
│   ├── app/
│   │   ├── layout.tsx            # Root layout (providers, fonts, metadata)
│   │   ├── page.tsx              # Home page
│   │   ├── globals.css           # Tailwind v4 directives + brand theme
│   │   ├── (public)/             # Public pages (header + footer layout)
│   │   │   ├── layout.tsx
│   │   │   ├── about/page.tsx
│   │   │   ├── ministers/page.tsx
│   │   │   ├── board/page.tsx
│   │   │   ├── departments/page.tsx
│   │   │   ├── activities/page.tsx
│   │   │   ├── blog/page.tsx & [slug]/page.tsx
│   │   │   ├── announcements/page.tsx
│   │   │   ├── events/page.tsx & [id]/page.tsx
│   │   │   ├── gallery/page.tsx
│   │   │   ├── sermons/page.tsx
│   │   │   ├── live/page.tsx
│   │   │   ├── prayer-request/page.tsx
│   │   │   ├── testimony/page.tsx
│   │   │   ├── join/page.tsx
│   │   │   ├── contact/page.tsx
│   │   │   └── give/page.tsx
│   │   ├── (auth)/               # Auth pages (centered card layout)
│   │   │   ├── layout.tsx
│   │   │   ├── login/page.tsx
│   │   │   ├── register/page.tsx
│   │   │   ├── verify-email/page.tsx
│   │   │   ├── forgot-password/page.tsx
│   │   │   └── reset-password/page.tsx
│   │   ├── (dashboard)/          # Authenticated pages (sidebar layout)
│   │   │   ├── layout.tsx
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── profile/page.tsx
│   │   │   ├── my-giving/page.tsx
│   │   │   ├── directory/page.tsx
│   │   │   ├── admin/            # ADMIN+ routes
│   │   │   │   ├── page.tsx      # Admin dashboard
│   │   │   │   ├── users/        # User management
│   │   │   │   ├── finance/      # Financial management
│   │   │   │   ├── content/      # Blog, events, gallery, sermons, moderation
│   │   │   │   └── settings/     # Church info, departments, audit log
│   │   │   └── finance/          # FINANCE+ routes
│   │   │       ├── page.tsx
│   │   │       ├── record/page.tsx
│   │   │       └── reports/page.tsx
│   │   └── api/
│   │       ├── auth/[...nextauth]/route.ts
│   │       ├── users/
│   │       ├── members/
│   │       ├── finance/ (transactions, pledges, expenses, reports, receipt, export)
│   │       ├── content/ (blog, events, announcements, gallery, sermons)
│   │       ├── prayer-requests/
│   │       ├── testimonies/
│   │       ├── departments/
│   │       ├── paystack/ (initialize, webhook)
│   │       └── upload/
│   ├── components/
│   │   ├── ui/                   # shadcn/ui (auto-generated)
│   │   ├── layout/               # public-header, public-footer, mobile-nav, dashboard-sidebar, dashboard-topbar
│   │   ├── shared/               # data-table, page-header, empty-state, stat-card, confirm-dialog, file-upload, rich-text-editor
│   │   ├── forms/                # login, register, profile, transaction, blog-post, event, prayer-request, etc.
│   │   ├── charts/               # giving-trend, income-breakdown, membership-growth
│   │   └── public/               # hero-section, service-times, minister-card, department-card, etc.
│   ├── lib/
│   │   ├── prisma.ts             # Singleton PrismaClient
│   │   ├── auth.ts               # Auth.js config (providers, callbacks, Prisma adapter)
│   │   ├── auth.config.ts        # Edge-compatible auth config (for middleware)
│   │   ├── constants.ts          # Roles, categories, church info
│   │   ├── utils.ts              # cn(), formatCurrency(), formatDate()
│   │   ├── validations/          # Zod schemas (auth, user, finance, content)
│   │   ├── actions/              # Server actions (auth, user, finance, content, upload)
│   │   ├── data/                 # Data access functions (user, finance, content, department)
│   │   ├── email/                # Resend wrapper + React Email templates
│   │   ├── paystack.ts
│   │   ├── pdf.ts                # Receipt + report PDF generation
│   │   ├── csv.ts                # CSV export
│   │   └── rate-limit.ts
│   ├── hooks/                    # use-current-user, use-debounce
│   └── types/                    # TypeScript types, next-auth.d.ts augmentation
```

---

## Database Schema (Prisma)

### Models
- **User** — id, email, passwordHash, firstName, lastName, phone, dateOfBirth, gender, maritalStatus, address, occupation, memberSince, role (6-value enum), status (PENDING/ACTIVE/INACTIVE), profilePhoto, departmentId (FK)
- **Department** — id, name, description, category (MINISTRY/COMMITTEE/CHOIR/OUTREACH), leaderId (FK), isActive
- **FinancialTransaction** — id, type (TITHE/OFFERING/DONATION/PLEDGE_PAYMENT/EXPENSE), category enum, amount (Decimal 12,2), currency (NGN), paymentMethod enum, referenceNumber, date, notes, receiptNumber (unique, auto: `AG-YYYY-NNNNN`), paystackRef, memberId (FK, nullable), recordedById (FK), pledgeId (FK, nullable)
- **Pledge** — id, title, amount, amountPaid, startDate, endDate, status (ACTIVE/FULFILLED/CANCELLED/OVERDUE), memberId (FK)
- **FinancialCategory** — id, name, type (INCOME/EXPENSE), isActive
- **BlogPost** — id, title, slug (unique), content (rich text), excerpt, type (BLOG/ANNOUNCEMENT/NEWS), featuredImage, published, publishedAt, authorId (FK)
- **Event** — id, title, description, startDate, endDate, location, type enum, imageUrl, isPublished, createdById (FK)
- **Submission** — id, type (PRAYER_REQUEST/TESTIMONY), name, email, content, isPublic, status (PENDING/APPROVED/ARCHIVED), submittedById (FK, nullable)
- **GalleryImage** — id, url, thumbnailUrl, caption, albumName, sortOrder
- **Sermon** — id, title, speaker, description, date, audioUrl, videoUrl, thumbnailUrl, seriesName
- **AuditLog** — id, action, entity, entityId, details (JSON), ipAddress, userId (FK)
- **ChurchSettings** — id, key (unique), value (JSON text)
- **Auth.js models**: Account, Session, VerificationToken, Token (for email verification + password reset)

### Seed Data
- Super admin account (Senior Pastor or IT admin)
- All 23 departments from the brief with categories
- Default financial categories (income + expense types)
- Default church settings (name, address, phones, bank details, service times)

---

## Authentication & RBAC

**Strategy**: Auth.js v5 with Credentials provider (email + password), JWT session strategy

**6 Roles**: VISITOR < MEMBER < DEPT_LEAD < FINANCE < ADMIN < SUPER_ADMIN

**Middleware route protection**:
| Route Pattern | Access |
|---------------|--------|
| `/`, `/about`, `/blog`, etc. | Public |
| `/login`, `/register`, etc. | Redirect to `/dashboard` if authenticated |
| `/dashboard`, `/profile`, `/my-giving`, `/directory` | Any authenticated user |
| `/finance/*` | FINANCE, ADMIN, SUPER_ADMIN |
| `/admin/*` | ADMIN, SUPER_ADMIN |

**Flows**: Email verification (24h token), password reset (1h token), both via Resend

---

## Implementation Steps (Build Sequence)

### Step 1: Project Scaffolding (Day 1)
- `npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"`
- Install all dependencies (Prisma, Auth.js, Zod 4, React Hook Form, shadcn/ui, Recharts, Resend, jspdf, papaparse, TipTap, date-fns, bcryptjs, Lucide)
- `npx shadcn@latest init` + add core components (button, card, input, label, select, textarea, dialog, dropdown-menu, table, tabs, badge, avatar, form, toast, sidebar, sheet, navigation-menu, calendar, popover, skeleton, pagination, etc.)
- Configure brand theme in `globals.css` using Tailwind v4 `@theme` (gold primary `#D4A017`/`#B8860B`, dark navy `#1a1a2e`)
- Create `.env.local`, `.env.example`, `.gitignore`
- Initialize git repo
- **Verify**: `npm run dev` shows default page, shadcn components import correctly

### Step 2: Database Schema & Prisma Setup (Day 2)
- Write `prisma/schema.prisma` with all models above
- Configure `prisma.config.ts` with `@prisma/adapter-pg` driver adapter (Prisma 7 requirement)
- Run `npx prisma migrate dev --name init`
- Write `prisma/seed.ts` (departments, categories, super admin, church settings)
- Run seed, create `src/lib/prisma.ts` singleton
- **Verify**: `npx prisma studio` shows all tables with seed data

### Step 3: Authentication System (Days 3-5)
- `src/lib/auth.config.ts` (edge-compatible) + `src/lib/auth.ts` (full config with Prisma adapter)
- `src/types/next-auth.d.ts` (augment Session/JWT with `id`, `role`)
- `src/app/api/auth/[...nextauth]/route.ts`
- `middleware.ts` with full RBAC route matching
- `src/lib/validations/auth.ts` (Zod schemas for login, register, reset)
- `src/lib/actions/auth-actions.ts` (register, verifyEmail, requestPasswordReset, resetPassword)
- `src/lib/email/send-email.ts` + templates (verification, password-reset, welcome)
- Auth pages: `/login`, `/register`, `/verify-email`, `/forgot-password`, `/reset-password`
- Auth forms: `login-form.tsx`, `register-form.tsx`
- Rate limiting on auth endpoints
- **Verify**: Register -> verify email -> login -> session has role -> middleware blocks `/admin` for MEMBER role

### Step 4: Root Layout & Shared Components (Days 6-7)
- `src/app/layout.tsx` (SessionProvider, fonts, metadata, Toaster)
- `src/app/globals.css` (brand theme via `@theme`)
- `src/components/layout/public-header.tsx` (logo + nav + mobile hamburger + "Login" button)
- `src/components/layout/public-footer.tsx` (4-column: church info, quick links, contact, social)
- `src/components/layout/mobile-nav.tsx` (Sheet-based slide menu)
- `src/app/(public)/layout.tsx`, `src/app/(auth)/layout.tsx`
- Shared: `data-table.tsx`, `page-header.tsx`, `empty-state.tsx`, `stat-card.tsx`, `confirm-dialog.tsx`
- `src/app/not-found.tsx`, `src/app/error.tsx`
- **Verify**: Public pages render inside header/footer layout; auth pages render in centered card layout

### Step 5: Public Website Pages (Days 8-12)
17+ pages, all Server Components for SEO. Build in priority order:

**Core**: Home (hero, service times, scripture, latest news, events, quick links), About/Beliefs, Contact (map, phones, form), Ministers (3 pastor profiles), Give (bank details + Paystack form)

**Informational**: Board (6 elders), Departments (23 departments grid), Activities (weekly schedule), Join (membership form)

**Dynamic**: Blog listing + `/blog/[slug]`, Announcements, Events listing + `/events/[id]`, Sermons, Gallery

**Interactive**: Live Stream (embedded player), Prayer Request (form), Testimony (form)

Each page: `metadata` export for SEO, `next/image` for optimized images, mobile-first responsive, loading skeletons. Add `sitemap.ts` and `robots.ts`.

- **Verify**: All routes accessible, mobile-responsive, Lighthouse SEO score > 90

### Step 6: Dashboard Layout & Member Portal (Days 13-15)
- `src/app/(dashboard)/layout.tsx` with shadcn Sidebar (role-aware nav items)
- `src/components/layout/dashboard-sidebar.tsx` + `dashboard-topbar.tsx`
- `/dashboard` (welcome, quick stats, recent announcements, upcoming events)
- `/profile` (edit personal info, change password, upload photo)
- `/my-giving` (member's own giving history table with filters)
- `/directory` (searchable member directory, active members only)
- **Verify**: Login as MEMBER -> see member nav; login as ADMIN -> see admin nav items too

### Step 7: Admin — User Management (Days 16-18)
- `/admin` dashboard (stat cards: total members, new this month, total giving, pending approvals; charts: giving trend, income breakdown; recent activity feed)
- `/admin/users` (DataTable: search, filter by role/status/department, sort, paginate)
- `/admin/users/[id]` (detail view, edit profile, change role, approve/deactivate, giving history)
- Server actions: `approveUser`, `changeUserRole`, `deactivateUser`
- Audit logging for all role/status changes
- **Verify**: Admin can list, search, approve, change roles; audit log records actions

### Step 8: Admin — Financial Management (Days 19-24)
**This is the core business module.**

- `/admin/finance` overview (income vs expense chart, giving trends, category breakdown pie, top givers, quick stats)
- `/admin/finance/transactions` (DataTable with date range, type/category/method/member filters, export button)
- `/admin/finance/transactions/new` (tabbed form: Tithe | Offering | Donation | Expense; member search, amount in NGN, payment method, category, date, reference, notes)
- Auto-generated receipt numbers: `AG-YYYY-NNNNN` (sequential per year)
- `/admin/finance/transactions/[id]` (view/edit)
- `/admin/finance/pledges` (pledge list with progress bars, create/edit)
- `/admin/finance/expenses` (expense recording)
- `/admin/finance/reports` (period selector: monthly/quarterly/annual/custom; report types: income summary, expense summary, full statement, member giving statement; on-screen display + export)
- `src/lib/pdf.ts` — Receipt PDF (church header with logo, receipt #, member, transaction details) and Report PDF (letterhead, summary, tables)
- `src/lib/csv.ts` — Transaction export to CSV
- Audit trail on all financial CRUD
- **Verify**: Record transactions, generate reports matching manual totals, export CSV/PDF, receipts render correctly

### Step 9: Admin — Content Management (Days 25-28)
- `/admin/content/blog` (CRUD with TipTap rich text editor, auto-slug, featured image upload, publish/draft)
- `/admin/content/events` (CRUD with date pickers)
- `/admin/content/announcements` (CRUD with optional expiry)
- `/admin/content/gallery` (image upload to Cloudinary, album organization, captions)
- `/admin/content/sermons` (title, speaker, date, YouTube/audio URLs)
- `/admin/content/moderation` (prayer requests + testimonies queue: approve/archive)
- `/admin/settings` (church info, service times)
- `/admin/settings/departments` (department CRUD with leader assignment)
- `/admin/settings/audit-log` (searchable, filterable log viewer)
- **Verify**: Create blog post -> visible on `/blog`; upload gallery images -> visible on `/gallery`; approve testimony -> visible on `/testimony`

### Step 10: Finance Portal, Paystack, Polish (Days 29-32)
- `/finance` portal (simplified dashboard for FINANCE role)
- `/finance/record` (quick transaction entry)
- `/finance/reports` (report access)
- Paystack integration on `/give`: `POST /api/paystack/initialize` -> Inline popup -> `POST /api/paystack/webhook` (verify signature, auto-create transaction, send receipt email)
- Security hardening: review all API auth checks, rate limiting on auth + payment endpoints, CSP headers in `next.config.ts`, input sanitization on rich text (DOMPurify)
- Performance: verify Server Components usage, `loading.tsx` on all segments, test on throttled 3G
- NDPR compliance: cookie consent banner, `/privacy-policy` + `/terms` pages
- **Verify**: End-to-end Paystack test payment, Lighthouse performance > 80 on 3G throttle, all auth checks pass

---

## Verification Plan

1. **Auth flow**: Register -> verify email link -> login -> session shows correct role -> middleware blocks unauthorized routes -> logout
2. **RBAC**: Login as each role (MEMBER, FINANCE, ADMIN, SUPER_ADMIN) -> verify only allowed nav items and routes are accessible
3. **Financial module**: Record 10+ transactions of various types -> verify totals in reports match -> export CSV and verify data -> generate receipt PDF and verify content
4. **Public pages**: Visit all 17+ routes -> verify SSR (view source shows content) -> check mobile responsiveness at 375px width -> run Lighthouse
5. **Content CMS**: Create blog post with images -> publish -> verify on `/blog` and `/blog/[slug]` -> edit -> unpublish -> verify removed from public
6. **Paystack**: Initialize test payment -> complete in sandbox -> verify webhook creates transaction -> verify receipt email sent
7. **Audit trail**: Perform sensitive actions (role change, transaction create/edit) -> verify AuditLog entries in `/admin/settings/audit-log`
8. **Run**: `npm run build` succeeds with no TypeScript errors, `npm run lint` passes

---

## Timeline Summary

| Step | Days | Deliverable |
|------|------|-------------|
| 1. Scaffolding | 1 | Project runs, deps installed, shadcn configured |
| 2. Database | 1 | Schema migrated, seed data populated |
| 3. Authentication | 3 | Full auth flow with email verification + RBAC |
| 4. Layouts | 2 | Public + auth + dashboard layout shells |
| 5. Public Pages | 5 | All 17+ SEO-optimized public pages |
| 6. Member Portal | 3 | Dashboard, profile, giving history, directory |
| 7. Admin Users | 3 | User management with search/filter/approve |
| 8. Financial Module | 6 | Transactions, pledges, reports, receipts, exports |
| 9. Content CMS | 4 | Blog, events, gallery, sermons, moderation |
| 10. Polish & Payments | 4 | Paystack, security, performance, compliance |
| **Total** | **32 days** | **Complete Phase 1 MVP** |
