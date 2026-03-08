# AG Wuse Church Management System

## Project Brief & Technical Specification

**Assemblies of God Church, Wuse Zone 5**
53, Accra Street, Wuse Zone 5, Abuja, Nigeria

Version 1.0 | March 2026
Prepared for: AG Wuse Church Administration

---

## 1. Executive Summary

This document serves as the project brief for the AG Wuse Church Management System, a custom web application designed to replace the current static church website with a comprehensive digital platform. The system will provide a public-facing website for visitors, a member portal for the congregation, and an administrative backend for church leadership and staff.

The application will be developed in phases, starting with user management and financial tracking (tithes, offerings, donations), then expanding to cover Sunday School management, attendance tracking, event coordination, and other operational needs of the church.

---

## 2. Church Profile

### 2.1 General Information

| Field | Details |
|---|---|
| Full Name | Assemblies of God Church, Wuse Branch (AG Wuse) |
| Also Known As | Assemblies of God International Gospel Centre, Wuse-Abuja |
| Denomination | Assemblies of God Nigeria (Pentecostal) |
| Location | 53, Accra Street, Wuse Zone 5, Abuja, Nigeria |
| Phone Lines | 0803 591 0333 \| 0807 226 9401 \| 0803 787 1278 |
| Existing Website | agwuse.org/web (WordPress/Joomla-based) |
| Facebook Pages | AG Wuse Abuja \| AGC International Gospel Centre Wuse-Abuja |
| Donation Account | Zenith International Bank - 1010327196 |
| Tagline | Center of Love and Worship |

### 2.2 Church Leadership

| Role | Name | Description |
|---|---|---|
| Senior Pastor | Rev. Anthony Eseh | District Secretary of Abuja District. Seasoned minister, teacher, writer, and marriage counselor. In full-time ministry since 1991. |
| Assistant Pastor | Rev. Churchman Felix | Ably supports the Senior Pastor in promoting the work of God in the church. |
| Children Pastor | Rev. Jeff Alex | Vibrant and dynamic minister overseeing children's ministry. |

### 2.3 Church Board

| Role | Name |
|---|---|
| Board Member | Elder Gabriel Ebemiele |
| Board Member (Pioneer) | Elder Bernard Oshiogwehom |
| Secretary | Elder Emeka Onyiriuka |
| Treasurer | Elder Solomon Achibong (Fellow of ICAN) |
| Board Member | Elder Peter Odeh |
| Board Member | Elder Sunday Okezie |

### 2.4 Weekly Activities

| Day | Activity | Time |
|---|---|---|
| Sunday | Main Service / Sunday School | 8:00 AM |
| Monday | New Believers Class | 6:00 PM |
| Tuesday | Bible Study | 6:00 PM |
| Wednesday | Prayer Meeting | 6:00 PM |
| Friday | Sunday Preparatory Meeting | 6:00 PM |

### 2.5 Departments & Ministries

The church operates through multiple departments and committees, all of which should eventually be represented in the management system:

#### Ministries & Groups

- Sunday School Department (Superintendent: Bro Erhovwo Odorume)
- Men Ministry
- Women Ministry (President: Sis Ngozi Uzosike)
- Young Singles Ministry (President: Sis Christy Onyenobi)
- Christ Ambassadors (Student Outreach)

#### Music & Worship

- Rhema Choir (Youth) - Bro Chidi Okoro
- The Exalters (Senior Choir) - Sis Joyce Orji
- Praise Team and Instrumentalists

#### Operational Committees

- Church Ushers
- Security Committee (Chair: Elder Solomon Archibong)
- Medical Team (Chair: Dr Ikedichi Okpani)
- Legal Team (Chair: Bar Ifeanyi Nweze)
- Media Committee (Chair: Bro Emma Gilbert)
- Mission Department (Chair: Rev Tony Eseh)
- Harvest/Thanksgiving Planning Committee
- Technical Services Committee
- Revival Planning Committee
- Follow-up Team
- Fund Raising Committee
- Welfare Committee
- Hospital and Prison Ministry

#### Media & Outreach

- Online Radio (live message streaming)
- Sermon Archive (MP3 and Video via YouTube)
- Live Streaming
- Senior Pastor's Blog

---

## 3. Project Scope & Objectives

### 3.1 Project Goals

1. Replace the current static website with a modern, responsive web application
2. Provide a public-facing site with church information, announcements, events, blog, and media
3. Implement a secure member registration and authentication system with role-based access
4. Build a financial management module for tithes, offerings, donations, and reporting
5. Create an admin dashboard for church leadership to manage all operations
6. Design the system to be extensible for future modules (attendance, Sunday School, etc.)

### 3.2 User Roles

| Role | Description | Access Level |
|---|---|---|
| Visitor | Anyone browsing the public website. No login required. | Public pages only: Home, About, Events, Blog, Contact, Beliefs, Ministers |
| Member | Registered church member with verified account. | Public pages + Member dashboard, giving history, profile, prayer requests, testimony sharing |
| Department Lead | Head of a department or ministry. | Member access + Department-specific management (attendance, reports for their unit) |
| Finance Officer | Authorized personnel managing church finances. | Financial module: record tithes, offerings, donations; generate reports |
| Admin | Church secretary, IT admin, or designated staff. | Full backend access: user management, content management, financial oversight |
| Super Admin | Senior Pastor or designated church authority. | All access including system settings, role assignment, audit logs |

---

## 4. Development Phases

### Phase 1: Foundation (MVP)

**Target: 4 to 6 weeks**

#### Module 1A: User Management System

- User registration with email verification
- Login/logout with secure session management (JWT or session-based)
- Role-based access control (Visitor, Member, Admin, Super Admin)
- Member profile management (personal info, family details, department affiliation)
- Admin user management panel (approve members, assign roles, deactivate accounts)
- Password reset and account recovery
- Member directory (visible only to authenticated members)
- Membership form (online equivalent of existing paper form from the website)

#### Module 1B: Financial Management System

- Tithe recording (per member, date, amount, payment method)
- Offering recording (general offerings, special offerings, mission offerings)
- Donation tracking (building fund, welfare, special projects)
- Pledge management (record pledges and track fulfillment)
- Payment method tracking (cash, bank transfer, POS, mobile money)
- Receipt generation (printable/downloadable receipts for members)
- Financial reports: monthly/quarterly/annual summaries
- Income categorization and chart of accounts
- Expense recording and categorization
- Bank reconciliation support (Zenith Bank - 1010327196)
- Dashboard with financial overview (charts, totals, trends)
- Export to CSV/PDF for external accounting use
- Audit trail for all financial transactions

#### Module 1C: Public Website (Visitor-Facing)

Recreate and modernize the content currently available on agwuse.org/web:

- Home page with hero section, service times, welcome message, and key scripture
- About Us / Beliefs page (Assemblies of God Statement of Fundamental Truths)
- Ministers page (Senior Pastor, Assistant Pastor, Children Pastor profiles)
- Church Board page
- Departments and Ministries directory
- Weekly Activities schedule
- Blog / Church News section (admin-managed posts)
- Announcements and Events calendar
- Image Gallery
- Sermon Archive (links to YouTube/audio files)
- Online Radio / Live Streaming embed
- Contact page with church location, phone numbers, map
- Prayer Request submission form
- Testimony sharing form
- Donation information (bank details, and optionally online payment integration)

### Phase 2: Church Operations

**Target: 4 to 6 weeks after Phase 1**

#### Module 2A: Sunday School Management

- Class management (create classes, assign teachers, define schedules)
- Student enrollment and class assignment
- Lesson planning and curriculum tracking
- Attendance per class per week
- Performance/participation notes
- Quarterly/annual reports by class

#### Module 2B: Attendance Tracking

- Sunday service attendance (main service, children's church)
- Midweek activity attendance (Bible Study, Prayer Meeting, etc.)
- Department meeting attendance
- Special event attendance
- Check-in system (manual entry or QR code-based)
- Attendance trends and reports (weekly, monthly, yearly comparisons)
- First-timer / visitor tracking and follow-up integration

#### Module 2C: Event Management

- Event creation and scheduling (revivals, conferences, harvest, outreach)
- Event registration for members
- Event reminders (email/SMS notifications)
- Volunteer coordination per event
- Post-event reports and analytics

### Phase 3: Advanced Features (Future)

**Target: Ongoing development after Phase 2**

- SMS and Email notification system (announcements, birthday greetings, reminders)
- Small Group / Cell Group management
- Counseling and follow-up tracking
- Asset and inventory management (church property, equipment)
- Welfare and benevolence tracking
- Missions and outreach project management
- Online giving integration (Paystack or Flutterwave for Nigerian payments)
- Mobile app (Progressive Web App or React Native)
- Reporting dashboard with data visualization for church leadership
- Multi-branch support (for Jabi outreach and future branches)

---

## 5. Recommended Technology Stack

| Layer | Technology | Rationale |
|---|---|---|
| Frontend | Next.js 14+ (React) | Server-side rendering for SEO on public pages, excellent developer experience, and React ecosystem for rich UI |
| Styling | Tailwind CSS | Utility-first CSS for rapid, consistent UI development |
| Backend/API | Next.js API Routes or separate Node.js/Express server | Unified codebase with Next.js, or separate API for scalability |
| Database | PostgreSQL | Robust relational database ideal for financial records and structured church data |
| ORM | Prisma | Type-safe database access with easy migrations and schema management |
| Authentication | NextAuth.js (Auth.js) | Flexible auth supporting email/password, social logins, and role-based access |
| File Storage | Cloudinary or AWS S3 | For sermon audio/video, gallery images, and document uploads |
| Payment Gateway | Paystack | Leading Nigerian payment processor; supports cards, bank transfers, and USSD |
| Email Service | Resend or SendGrid | Transactional emails for verification, receipts, and notifications |
| Hosting | Vercel (frontend) + Railway/Render (DB) | Optimized for Next.js deployment with managed PostgreSQL |
| Version Control | Git / GitHub | Standard version control and collaboration |

### 5.1 Alternative Stack Considerations

If the team prefers a more traditional approach or has specific hosting constraints, these alternatives are viable:

- **Laravel (PHP) + MySQL:** Well-suited if the hosting environment is cPanel-based or shared hosting
- **Django (Python) + PostgreSQL:** Strong admin panel out of the box, good for rapid prototyping
- **Astro + Supabase:** For a lighter approach, Astro handles the static public site while Supabase provides auth, database, and real-time features

---

## 6. Database Schema Overview (Phase 1)

The following outlines the core data models needed for Phase 1. These are not exhaustive but provide the starting point for the database design.

### 6.1 Users / Members

| Field | Type | Notes |
|---|---|---|
| id | UUID / Auto-increment | Primary key |
| email | String (unique) | Login credential |
| password_hash | String | Bcrypt hashed |
| first_name | String | |
| last_name | String | |
| phone | String | Nigerian phone format |
| date_of_birth | Date | Optional |
| gender | Enum | Male / Female |
| marital_status | Enum | Single / Married / Widowed |
| address | Text | Residential address |
| member_since | Date | Date of church membership |
| department_id | FK | Link to departments table |
| role | Enum | visitor / member / dept_lead / finance / admin / super_admin |
| status | Enum | pending / active / inactive |
| profile_photo | String (URL) | Optional |
| created_at | Timestamp | |
| updated_at | Timestamp | |

### 6.2 Departments

| Field | Type | Notes |
|---|---|---|
| id | UUID | Primary key |
| name | String | e.g. Sunday School, Men Ministry, Rhema Choir |
| description | Text | Department purpose |
| leader_id | FK (Users) | Department head |
| category | Enum | ministry / committee / choir / outreach |

### 6.3 Financial Transactions

| Field | Type | Notes |
|---|---|---|
| id | UUID | Primary key |
| member_id | FK (Users) | Nullable for anonymous donations |
| type | Enum | tithe / offering / donation / pledge / expense |
| category | String | e.g. general_offering, building_fund, mission_offering, welfare |
| amount | Decimal | In Naira (NGN) |
| currency | String | Default NGN |
| payment_method | Enum | cash / bank_transfer / pos / mobile_money / online |
| reference_number | String | Bank reference or receipt number |
| date | Date | Transaction date |
| recorded_by | FK (Users) | Admin who entered the record |
| notes | Text | Optional description |
| receipt_url | String | Generated receipt link |
| created_at | Timestamp | |

### 6.4 Blog Posts / Announcements

| Field | Type | Notes |
|---|---|---|
| id | UUID | Primary key |
| title | String | Post title |
| slug | String (unique) | URL-friendly identifier |
| content | Rich Text | Post body (Markdown or HTML) |
| type | Enum | blog / announcement / news |
| author_id | FK (Users) | |
| featured_image | String (URL) | Optional banner image |
| published | Boolean | Draft vs published |
| published_at | Timestamp | |
| created_at | Timestamp | |

### 6.5 Events

| Field | Type | Notes |
|---|---|---|
| id | UUID | Primary key |
| title | String | Event name |
| description | Text | Details |
| start_date | DateTime | |
| end_date | DateTime | |
| location | String | Venue |
| type | Enum | service / revival / conference / outreach / harvest / other |
| created_by | FK (Users) | |

### 6.6 Prayer Requests & Testimonies

| Field | Type | Notes |
|---|---|---|
| id | UUID | Primary key |
| type | Enum | prayer_request / testimony |
| submitted_by | FK (Users) | Nullable for anonymous |
| name | String | For non-logged-in submissions |
| content | Text | The request or testimony |
| is_public | Boolean | Whether to display publicly |
| status | Enum | pending / approved / archived |
| created_at | Timestamp | |

---

## 7. Public Website Page Map

Based on the existing agwuse.org/web site structure, the new application should include these public pages:

| Page | Route | Content Source |
|---|---|---|
| Home | / | Hero, service times, scripture, quick links, latest news |
| About / Believes | /about | Church history, statement of faith, mission |
| Ministers | /ministers | Pastor profiles with photos and bios |
| Church Board | /board | Board member profiles |
| Departments | /departments | Department listings with descriptions and leaders |
| Weekly Activities | /activities | Schedule of weekly church programs |
| Blog / Church News | /blog | CMS-managed articles and news posts |
| Announcements | /announcements | Time-sensitive church announcements |
| Events | /events | Upcoming events with registration |
| Gallery | /gallery | Photo gallery from church events |
| Sermon Archive | /sermons | Audio/video sermon links |
| Live Stream | /live | Embedded live stream player |
| Prayer Request | /prayer-request | Submission form |
| Share Testimony | /testimony | Submission form |
| Membership Form | /join | Online membership registration |
| Contact | /contact | Location map, phone numbers, email form |
| Give / Donate | /give | Bank details and online payment option |

---

## 8. Admin Panel Structure

The admin backend will be accessible at /admin (or a subdomain like admin.agwuse.org) and will include:

### 8.1 Dashboard

- Overview cards: total members, new members this month, total giving this month
- Recent activity feed (new registrations, financial entries, content updates)
- Quick action buttons (add member, record transaction, create post)
- Charts: giving trends, attendance trends, membership growth

### 8.2 User Management

- Member list with search, filter, and sort
- Member detail view and edit
- Role assignment and permission management
- Pending member approvals
- Bulk import from spreadsheet (for migrating existing member records)

### 8.3 Financial Management

- Transaction entry form (tithe, offering, donation, expense)
- Transaction list with date range filters
- Per-member giving history
- Report generation (monthly, quarterly, annual)
- Chart of accounts management
- Export functionality (CSV, PDF)

### 8.4 Content Management

- Blog post editor (rich text with image upload)
- Announcement creation and scheduling
- Event management (create, edit, cancel events)
- Gallery management (upload and organize photos)
- Sermon archive management (add links, descriptions)
- Minister and board member profile editing
- Prayer request and testimony moderation queue

### 8.5 Settings

- Church information (name, address, contact details)
- Service times configuration
- Department management (add, edit, deactivate)
- Financial categories and payment methods configuration
- Email notification templates
- System audit log viewer

---

## 9. Non-Functional Requirements

### 9.1 Security

- All financial data encrypted at rest and in transit (HTTPS mandatory)
- Role-based access control enforced at API level
- Input validation and sanitization to prevent XSS and SQL injection
- Rate limiting on authentication endpoints
- Audit logging for all sensitive operations (financial entries, role changes)
- Regular database backups (daily automated)

### 9.2 Performance

- Public pages load in under 3 seconds on 3G connections (important for Nigerian mobile users)
- Optimized images and lazy loading throughout
- Server-side rendering for SEO-critical public pages
- Database indexing on frequently queried fields

### 9.3 Accessibility & Usability

- Mobile-first responsive design (majority of Nigerian web traffic is mobile)
- Simple, intuitive interface suitable for non-technical church administrators
- Clear navigation and consistent layout
- Support for low-bandwidth environments

### 9.4 Compliance

- Nigeria Data Protection Regulation (NDPR) compliance for member data
- Secure handling of financial records per church accounting standards
- Clear privacy policy and data usage terms

---

## 10. Content Migration Plan

The following content from the existing agwuse.org/web site should be migrated or recreated in the new system:

| Content Type | Source | Migration Approach |
|---|---|---|
| Church info & about text | agwuse.org/web homepage | Manual entry into CMS |
| Minister profiles | agwuse.org/web/ministers | Recreate with updated bios and photos |
| Board member profiles | agwuse.org/web/board | Recreate with current information |
| Department listings | agwuse.org/web/departments | Seed database with department data |
| Gallery images | agwuse.org/web/gallery | Download and re-upload to new platform |
| Blog/news articles | agwuse.org/web (church news) | Manual migration of relevant posts |
| Contact information | agwuse.org/web/contact | Configure in admin settings |
| Donation details | Footer/sidebar of existing site | Set up in financial module config |
| Member records | Paper forms / spreadsheets | Bulk import via admin panel |

---

## 11. Success Criteria

The MVP (Phase 1) will be considered successful when:

1. Church members can register and log in to their accounts
2. Admins can manage users and assign roles through the admin panel
3. Financial officers can record tithes, offerings, and donations accurately
4. The system generates monthly financial reports that match manual records
5. The public website displays all essential church information and is mobile-friendly
6. The Senior Pastor and church board can view dashboards with key metrics
7. The system is live and accessible via the church's domain (agwuse.org)

---

## 12. Risks & Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Low adoption by church staff | High | Provide training sessions and create simple user guides. Start with a small pilot group. |
| Data accuracy during migration | High | Validate migrated data against existing records. Run parallel systems during transition. |
| Internet connectivity issues | Medium | Design for low-bandwidth. Consider Progressive Web App (PWA) for offline capability. |
| Scope creep across phases | Medium | Stick strictly to phase deliverables. Document all change requests for future phases. |
| Security vulnerabilities | High | Follow OWASP guidelines. Conduct security review before launch. Keep dependencies updated. |
| Hosting costs escalation | Low | Start with free/affordable tiers (Vercel free, Railway starter). Scale as needed. |

---

## 13. Build Instructions for Claude

When sharing this document with Claude to begin building the application, use the following prompt structure as a starting point:

```
I am building a Church Management System for Assemblies of God
Church, Wuse Zone 5, Abuja. Please read the attached project
brief document for full context.

For Phase 1, I want to start with [Module 1A / 1B / 1C].
Please scaffold the project using [Next.js / your recommended
stack] and implement the following features first: [list
specific features].
```

This document provides Claude with enough context about the church's structure, leadership, departments, and operational needs to build a well-informed application that truly fits AG Wuse's requirements.

---

*End of Project Brief | AG Wuse Church Management System | v1.0*
