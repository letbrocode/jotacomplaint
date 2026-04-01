# 📋 JotaComplaint — Walkthrough


## Table of Contents

1. [Problem Statement](#1-problem-statement)
2. [Abstract](#2-abstract)
3. [Aim](#3-aim)
4. [Objectives](#4-objectives)
5. [Scope of the Project](#5-scope-of-the-project)
6. [Existing Systems & Limitations](#6-existing-systems--limitations)
7. [Proposed System](#7-proposed-system)
8. [Methodology](#8-methodology)
9. [System Architecture](#9-system-architecture)
10. [Database Design](#10-database-design)
11. [Tech Stack](#11-tech-stack)
12. [Features & Modules](#12-features--modules)
13. [User Roles & Workflows](#13-user-roles--workflows)
14. [Implementation Details](#14-implementation-details)
15. [Security](#15-security)
16. [Results & Outcomes](#16-results--outcomes)
17. [Future Scope](#17-future-scope)
18. [Conclusion](#18-conclusion)
19. [Quick Demo Cheat Sheet](#19-quick-demo-cheat-sheet)
20. [Possible Q&A](#20-possible-qa)

---

## 1. Problem Statement

Municipal bodies across cities receive hundreds of complaints daily regarding roads, water supply, electricity, sanitation, and other civic issues. The current methods of lodging these complaints — phone calls, physical offices, or basic web forms — suffer from:

- **No transparency**: Citizens submit complaints but have no way to track their status.
- **No accountability**: Complaints often get lost without any assignment or follow-up.
- **Inefficient routing**: Complaints are manually forwarded to the wrong departments, causing delays.
- **Lack of documentation**: No photo evidence or geolocation is captured, making it hard for staff to assess the situation remotely.
- **No analytics**: Administrators have no data-driven view of complaint trends, bottlenecks, or departmental performance.

These gaps result in citizen frustration, repeated complaints, unresolved issues, and a general erosion of trust in municipal services.

---

## 2. Abstract

**JotaComplaint** is a modern, full-stack Municipal Complaint Management System designed to bridge the communication gap between citizens and local government bodies. Built using the T3 Stack (Next.js 15, TypeScript, Prisma, Auth.js, and Tailwind CSS), the platform enables citizens to file complaints with photos and GPS-tagged locations, track real-time status updates, and receive instant notifications.

The system provides a dedicated portal for each user role — **Citizens**, **Staff**, and **Administrators** — ensuring that every complaint is documented, routed to the appropriate department, prioritized, and resolved efficiently. An admin analytics dashboard offers insights into complaint trends, resolution rates, and departmental performance. The application is deployed on the cloud, making it accessible from any device at any time.

---

## 3. Aim

To design and develop a scalable, role-based web application that digitizes and streamlines the municipal complaint management process — improving transparency, accountability, and resolution time for civic issues.

---

## 4. Objectives

1. **Enable citizens** to easily submit complaints with details, photos, and GPS location.
2. **Automate routing** by categorizing complaints and assigning them to the relevant department.
3. **Provide real-time tracking** so citizens can monitor the status of their complaints at any time.
4. **Empower staff** with a dedicated portal to view assigned complaints, update statuses, and add internal notes.
5. **Give administrators** a comprehensive dashboard with analytics, charts, user management, and department oversight.
6. **Maintain a complete audit trail** of all actions taken on a complaint through an activity log.
7. **Send notifications** to relevant parties at each key stage (creation, assignment, update, resolution).
8. **Ensure security** through role-based access control (RBAC), session-based authentication, and password hashing.
9. **Support public location awareness** by pre-seeding garbage bins, dump sites, and collection points on a map.
10. **Deliver a responsive, accessible UI** that works seamlessly on desktop, tablet, and mobile.

---

## 5. Scope of the Project

### In Scope
- Web application accessible via browser (no native mobile app)
- Three distinct user portals: Citizen Dashboard, Staff Portal, Admin Dashboard
- Complaint lifecycle: Submit → Assign → In Progress → Resolve
- Photo uploads with cloud CDN (ImageKit)
- Interactive map with Leaflet for complaint location and public facilities visualization
- Analytics dashboard with charts (Recharts) for admin
- Notification system (in-app)
- Role-Based Access Control (RBAC) with three roles: USER, STAFF, ADMIN
- PostgreSQL database with Prisma ORM

### Out of Scope
- Native mobile application (iOS/Android)
- SMS or email notifications (in-app only currently)
- Payment gateway integration
- Multi-language / i18n support
- AI-based complaint auto-categorization (future scope)

---

## 6. Existing Systems & Limitations

| Aspect | Traditional/Existing Systems | JotaComplaint |
|---|---|---|
| Complaint Filing | Phone calls, physical forms, basic web forms | Rich web form with photos + GPS |
| Status Tracking | None / manual inquiry | Real-time status with history |
| Department Routing | Manual | Category-based automatic routing |
| Staff Management | Spreadsheets / emails | Dedicated staff portal with assignment |
| Analytics | None | Interactive charts, trends, KPIs |
| Accountability | None | Complete audit trail & activity logs |
| Notifications | None | In-app notification system |
| Priority Handling | None | LOW / MEDIUM / HIGH priority tagging |

---

## 7. Proposed System

JotaComplaint proposes a **three-tier role-based complaint management platform** with the following key components:

1. **Public Landing Page** — Showcases features, how it works, and impact stats.
2. **Citizen Portal** (`/dashboard`) — Submit, view, and comment on complaints; view notifications; navigate to public locations on map.
3. **Staff Portal** (`/staff`) — View assigned complaints, update statuses, add internal notes, navigate to locations.
4. **Admin Portal** (`/admin`) — Full control: manage users, departments, staff, view all complaints, analytics dashboard, map view of all complaint locations, and public location management.
5. **Authentication System** — Secure sign-up / sign-in with bcryptjs-hashed passwords and Auth.js database sessions.
6. **Notification System** — Auto-generated notifications on complaint creation, assignment, status updates, and resolution.
7. **Activity Log** — Every action on a complaint (status change, assignment, priority change, comments) is logged with a timestamp and actor.

---

## 8. Methodology

The project was developed using the **Agile methodology** with iterative feature development. The high-level development process followed these phases:

### Phase 1: Planning & Requirements Gathering
- Identified core pain points in traditional complaint handling
- Defined three user personas: Citizen, Staff, Admin
- Mapped out the complaint lifecycle and all system states
- Designed the ER diagram and database schema

### Phase 2: Environment Setup & Foundation
- Scaffolded the project using the **T3 Stack** (create-t3-app v7.39.3)
- Configured PostgreSQL database with **Prisma ORM**
- Set up **Auth.js** with database sessions and bcryptjs password hashing
- Established environment variables for database, auth, and third-party services

### Phase 3: Database Design & Seeding
- Designed 8 models: `User`, `Account`, `Session`, `Complaint`, `Department`, `Comment`, `ComplaintActivity`, `Notification`, `PublicLocation`
- Defined Enums: `Role`, `Status`, `Priority`, `ComplaintCategory`, `ActivityAction`, `NotificationType`, `LocationType`
- Created seed data (seed.ts) for demo: admin, staff, user accounts + departments + sample complaints

### Phase 4: Backend — Server Actions & Data Layer
- Built all server-side logic using **Next.js Server Actions** (no separate REST API needed)
- Implemented CRUD operations for complaints, departments, users (soft-delete supported)
- Built complaint activity logging as a side effect of every mutation
- Implemented auto-notification triggers on key events

### Phase 5: Authentication & Authorization
- Implemented sign-up and sign-in flows with form validation (Zod + React Hook Form)
- Configured **Next.js Middleware** for route protection based on user roles
- Role-based redirect: USER → `/dashboard`, STAFF → `/staff`, ADMIN → `/admin`

### Phase 6: Frontend — Component & Page Development
- Built reusable UI components using **shadcn/ui** (Radix UI primitives + Tailwind CSS)
- Implemented responsive layouts for all three portals
- Integrated **Recharts** for analytics charts in admin dashboard
- Integrated **Leaflet** + **React Leaflet** for interactive maps
- Integrated **ImageKit** for photo upload, optimization, and CDN delivery
- Built complaint cards, notification badges, user avatars, department dialogs, staff dialogs

### Phase 7: Testing & Polish
- Cross-browser and responsive design testing
- Seeded test data and validated all CRUD flows
- Added TypeScript strict mode, Zod validation schemas, and ESLint/Prettier configs
- Final deployment to cloud (Render/Vercel)

---

## 9. System Architecture

```
┌───────────────────────────────────────────────────────────┐
│                     Client (Browser)                       │
│   ┌──────────┐  ┌──────────┐  ┌──────────────────────┐   │
│   │ Citizen  │  │  Staff   │  │       Admin           │   │
│   │ Dashboard│  │  Portal  │  │     Dashboard         │   │
│   └────┬─────┘  └────┬─────┘  └──────────┬───────────┘   │
└────────┼─────────────┼───────────────────┼───────────────┘
         │             │                   │
         └─────────────▼───────────────────┘
                       │  HTTPS
         ┌─────────────▼────────────────────┐
         │         Next.js 15 App           │
         │  ┌────────────────────────────┐  │
         │  │   Next.js Middleware       │  │ ← RBAC Route Protection
         │  │   (Auth + Role Guards)     │  │
         │  └────────────────────────────┘  │
         │  ┌────────────────────────────┐  │
         │  │   Server Actions / API     │  │ ← Business Logic
         │  │   Routes                   │  │
         │  └────────────────────────────┘  │
         │  ┌────────────────────────────┐  │
         │  │   Prisma ORM               │  │ ← Data Access Layer
         │  └────────────────────────────┘  │
         └─────────────┬────────────────────┘
                       │
         ┌─────────────▼────────────────────┐
         │         PostgreSQL DB             │
         └──────────────────────────────────┘
         
         External Services:
         ┌──────────┐   ┌─────────────┐
         │ ImageKit │   │ Google Maps │
         │  (CDN)   │   │   API       │
         └──────────┘   └─────────────┘
```

### Key Architectural Decisions
- **Server Components by default** — Pages and layouts fetch data on the server, reducing client-side JavaScript.
- **Server Actions** — Mutations (create/update/delete) happen via server functions, keeping API surface minimal and type-safe.
- **Database Sessions** — Auth.js stores sessions in PostgreSQL for persistence and security.
- **Soft Delete** — Complaints support a `deletedAt` field for safe deletion without data loss.
- **Cascade Deletes** — Prisma relations handle referential integrity automatically.

---

## 10. Database Design

### Entity Relationship Summary

```
User ──< Complaint (created by)
User ──< Complaint (assigned to — via "AssignedComplaints" relation)
User ──< Department (staff members — via "DepartmentStaff" relation)
User ──< Comment
User ──< ComplaintActivity
User ──< Notification
User ──< Account (OAuth)
User ──< Session

Complaint ──< Comment
Complaint ──< ComplaintActivity
Complaint ──< Notification
Complaint >── Department
```

### Core Models

| Model | Key Fields | Purpose |
|---|---|---|
| `User` | id, name, email, password, role, isActive | All user accounts (citizen/staff/admin) |
| `Complaint` | id, title, details, category, location, lat, lng, photoUrl, priority, status, userId, assignedToId, departmentId | Core complaint entity |
| `Department` | id, name, description, email, phone, isActive | Municipal departments |
| `Comment` | id, content, isInternal, complaintId, authorId | Discussion on complaints; `isInternal` hides from citizens |
| `ComplaintActivity` | id, action, oldValue, newValue, comment, complaintId, userId | Immutable audit log |
| `Notification` | id, title, message, type, isRead, userId, complaintId | In-app notifications |
| `PublicLocation` | id, name, type, latitude, longitude | Pre-mapped bins, dump sites, collection points |

### Enums

| Enum | Values |
|---|---|
| `Role` | USER, STAFF, ADMIN |
| `Status` | PENDING, IN_PROGRESS, RESOLVED |
| `Priority` | LOW, MEDIUM, HIGH |
| `ComplaintCategory` | ROADS, WATER, ELECTRICITY, SANITATION, OTHER |
| `ActivityAction` | NEW_COMPLAINT, STATUS_CHANGED, ASSIGNED, REASSIGNED, COMMENT_ADDED, PRIORITY_CHANGED, DEPARTMENT_CHANGED |
| `NotificationType` | COMPLAINT_CREATED, COMPLAINT_ASSIGNED, STATUS_UPDATED, COMMENT_ADDED, RESOLVED |
| `LocationType` | GARBAGE_BIN, DUMP_SITE, COLLECTION_POINT |

---

## 11. Tech Stack

| Layer | Technology | Version | Purpose |
|---|---|---|---|
| **Framework** | Next.js | 16.x | Full-stack React framework with App Router |
| **Language** | TypeScript | 5.9 | Type safety across the entire codebase |
| **Styling** | Tailwind CSS | 4.x | Utility-first CSS framework |
| **UI Components** | shadcn/ui (Radix UI) | Latest | Accessible, unstyled component primitives |
| **Database** | PostgreSQL | 15+ | Relational database |
| **ORM** | Prisma | 6.5 | Type-safe database client & schema management |
| **Authentication** | Auth.js (NextAuth v5) | 5.0-beta | Session-based auth with DB adapter |
| **Password Hashing** | bcryptjs | 3.x | Secure password storage |
| **Form Handling** | React Hook Form + Zod | 7.x / 3.x | Validated, performant forms |
| **Charts** | Recharts | 3.x | Analytics charts in admin dashboard |
| **Maps** | Leaflet + React Leaflet | 1.9 / 5.x | Interactive maps with markers |
| **Image Uploads** | ImageKit + @imagekit/next | 2.x | CDN-backed image uploads with optimization |
| **Notifications UI** | Sonner | 2.x | Toast notifications |
| **Icons** | Lucide React | 0.544 | Clean SVG icon library |
| **Date Formatting** | date-fns | 4.x | Human-readable timestamps |
| **Env Validation** | @t3-oss/env-nextjs | 0.12 | Runtime environment variable validation |
| **Deployment** | Render / Vercel | — | Cloud hosting |

---

## 12. Features & Modules

### 🏠 Public Landing Page
- Hero section with tagline: *"Report Issues. Track Progress. Build Better Communities."*
- Key stats: Active Users, Resolved Issues, Avg. Response Time
- Features section: Location Mapping, Real-time Notifications, Activity Tracking, Photo Documentation, Department Management, Analytics Dashboard
- How It Works: 3-step process (Report → Auto Assign → Track & Resolve)
- Built for everyone: Citizen, Staff, Admin role cards
- Responsive mobile navigation with drawer/sheet

### 👤 Citizen Portal (`/dashboard`)
- **Complaint Submission**: Title, details, category (Roads/Water/Electricity/Sanitation/Other), priority, location (text + map pin), photo upload
- **My Complaints**: View all submitted complaints with status badges (Pending/In Progress/Resolved), priority labels, timestamps
- **Complaint Detail**: Full complaint view with photo, activity history timeline, comments thread
- **Notifications**: In-app notification center with unread badge
- **Public Location Map**: View nearby garbage bins, dump sites, collection points on Leaflet map with navigation

### 🔧 Staff Portal (`/staff`)
- **Assigned Complaints**: View complaints specifically assigned to this staff member
- **Status Updates**: Change status (Pending → In Progress → Resolved)
- **Internal Comments**: Add private notes visible only to admin and staff
- **Location Navigation**: Open complaint location in Google Maps for field visits
- **Notifications**: Alerts on new assignments and comment additions

### 🛡️ Admin Dashboard (`/admin`)
- **Analytics Overview**: KPIs — Total Complaints, Pending, In Progress, Resolved, Resolution Rate
- **Charts**: Interactive bar/line charts for complaints by category, trends over time, department-wise distribution
- **All Complaints**: Full list with filters (status, category, priority, department)
- **Complaint Management**: Assign/reassign to staff and departments, change priority
- **User Management**: View all users; activate/deactivate accounts; see detailed stats per user
- **Staff Management**: Create staff accounts, assign to departments, manage roles
- **Department Management**: Create, edit, activate/deactivate departments; add contact info
- **Map View**: See all complaint locations plotted on an interactive map
- **Public Locations**: Manage garbage bins, dump sites, collection points on the city map
- **Notifications**: Admin-specific alerts for new complaints and escalations
- **Resolved Complaints**: View closed complaints with resolution analytics

---

## 13. User Roles & Workflows

### Citizen Workflow
```
Register → Sign In → Submit Complaint (title, details, category, priority, photo, location)
  → Complaint PENDING → Receive Notification: Complaint Created
  → Complaint assigned to Staff → Notification: Assigned
  → Status: IN_PROGRESS → Notification: Status Updated
  → Status: RESOLVED → Notification: Resolved
  → Can comment on complaint at any stage
```

### Staff Workflow
```
Sign In → Redirected to /staff
  → View assigned complaints list
  → Open complaint → Review details, photo, location
  → Update status (IN_PROGRESS / RESOLVED)
  → Add internal comment (hidden from citizen)
  → Navigate to location via Google Maps
  → Receive notification of new assignments
```

### Admin Workflow
```
Sign In → Redirected to /admin
  → View dashboard overview (KPIs + charts)
  → Review incoming PENDING complaints
  → Assign complaint to department + staff member
  → Set priority (LOW / MEDIUM / HIGH)
  → Monitor progress across all complaints
  → Manage users (activate/deactivate)
  → Add/manage departments
  → Add/manage staff
  → View analytics and complaint trends
  → Manage public map locations
```

---

## 14. Implementation Details

### Middleware & Route Protection
The `middleware.ts` intercepts every request and:
1. Checks for a valid Auth.js session
2. Redirects unauthenticated users to `/signin`
3. Enforces role-based routing:
   - `ADMIN` → can access `/admin/*`
   - `STAFF` → can access `/staff/*`
   - `USER` → can access `/dashboard/*`
4. Redirects users trying to access unauthorized portals to `/unauthorized`

### Server Actions
All data mutations happen through Next.js Server Actions (no exposed REST endpoints):
- `createComplaint()` — validates with Zod, creates complaint + logs `NEW_COMPLAINT` activity + sends notification
- `updateComplaintStatus()` — updates status + logs `STATUS_CHANGED` + sends notification
- `assignComplaint()` — assigns to staff + logs `ASSIGNED`/`REASSIGNED` + sends notification
- `addComment()` — creates comment + logs `COMMENT_ADDED` + sends notification (if not internal)
- `createDepartment()`, `updateDepartment()` — department CRUD
- `toggleUserStatus()` — activate/deactivate users
- `createStaff()` — creates USER with STAFF role + assigns to department

### Image Uploads
ImageKit is integrated via `@imagekit/next`:
- Client generates an upload token via `/api/imagekit-auth`
- Images are uploaded directly to ImageKit CDN from the browser
- The returned URL is stored in `Complaint.photoUrl`
- Images are delivered via CDN with auto-optimization

### Map Integration
- **Leaflet + React Leaflet** used for interactive maps
- Complaint locations (lat/lng) are plotted as markers
- Public locations (bins, dump sites) are pre-seeded and shown on map
- Staff can click a marker to open Google Maps navigation
- `PublicLocationNavigationView.tsx` handles the combined map view

### Form Validation
All forms use `react-hook-form` + `zod` schemas:
- Sign-up: email uniqueness, password length, name required
- Complaint submission: title (min 5 chars), details (min 10 chars), category enum, optional location/photo
- Department: name uniqueness, optional email/phone

---

## 15. Security

| Concern | How It's Handled |
|---|---|
| **Password Storage** | bcryptjs hashing (never stored in plaintext) |
| **Session Management** | Auth.js DB sessions (server-side, not JWT) |
| **Route Protection** | Next.js Middleware checks session on every request |
| **Role Enforcement** | Server Actions re-verify roles server-side |
| **Input Validation** | Zod schemas on all forms (client + server) |
| **Environment Secrets** | `.env` file, validated at runtime via `@t3-oss/env-nextjs` |
| **Soft Deletes** | `deletedAt` field ensures no accidental data loss |
| **Cascade Deletes** | Prisma handles FK integrity automatically |
| **CSRF** | Next.js Server Actions include built-in CSRF protection |
| **Internal Comments** | `isInternal: true` comments are only served to STAFF/ADMIN queries |

---

## 16. Results & Outcomes

- ✅ **Fully functional** three-portal web application
- ✅ **Complete complaint lifecycle** from submission to resolution
- ✅ **Real-time activity tracking** with immutable audit logs
- ✅ **In-app notification system** at every complaint lifecycle stage
- ✅ **Interactive map** with complaint locations and public facilities
- ✅ **Analytics dashboard** with charts for admins
- ✅ **Cloud-deployed** and accessible at: https://jotacomplaint.onrender.com/
- ✅ **Responsive design** — works on desktop, tablet, and mobile
- ✅ **Type-safe end-to-end** — TypeScript, Zod, Prisma generated types
- ✅ **Photo evidence support** via ImageKit CDN

---

## 17. Future Scope

1. **AI Auto-Categorization** — Use NLP to automatically detect category and priority from complaint text
2. **Email/SMS Notifications** — Integrate Twilio/SendGrid for out-of-app alerts
3. **Native Mobile App** — React Native companion app for citizens
4. **Heatmap Analytics** — Geographic heatmap of complaint density for city planning
5. **SLA Management** — Define resolution time SLAs per department and alert on breaches
6. **Citizen Rating System** — Allow citizens to rate the quality of complaint resolution
7. **Multi-tenancy** — Support multiple municipalities on the same platform
8. **OAuth Login** — Google/GitHub social login for citizens
9. **Export Reports** — PDF/CSV export of complaints and analytics for municipal records
10. **Dark Mode** — Full light/dark theme toggle across all portals

---

## 18. Conclusion

JotaComplaint successfully addresses the critical gaps in traditional municipal complaint management by providing a unified, digital platform for citizens, staff, and administrators. By leveraging the modern T3 Stack, the system delivers a type-safe, performant, and scalable solution that improves transparency, accountability, and efficiency in resolving civic issues.

The project demonstrates the practical application of:
- Full-stack web development with Next.js 15 and the App Router
- Role-based access control in a real-world multi-user system
- Database design with relational models and ORM integration
- Cloud deployment and third-party API integration (Maps, Image CDN)
- Modern UI/UX with accessible, responsive component design

JotaComplaint is not just a project — it is a working product deployed on the cloud, ready for real-world municipal adoption.

---

## 19. Quick Demo Cheat Sheet

> Use this during the live demo. Have the browser open at: **https://jotacomplaint.onrender.com/**

### Demo Credentials
| Role | Email | Password |
|---|---|---|
| Admin | admin@example.com | 12345678 |
| Staff | staff@example.com | 12345678 |
| User | user@example.com | 12345678 |

### Suggested Demo Flow (5–7 minutes)
1. **Land on Home Page** → Walk through Hero, Features, How It Works, Role cards
2. **Sign up as new user** OR **Sign in as User** → Show citizen dashboard
3. **Submit a new complaint** → Fill form with category (e.g., Roads), upload photo, pin location on map
4. **Show complaint card** with PENDING status + notification it was created
5. **Switch to Admin** → Show dashboard KPIs, charts, complaint list
6. **Assign complaint** to staff member + set priority HIGH
7. **Switch to Staff** → Show assigned complaint, update status to IN_PROGRESS
8. **Go back to User** → Show notification received + updated status
9. **Staff resolves complaint** → User receives RESOLVED notification
10. **Admin → Analytics** → Show charts, department stats
11. **Admin → Map view** → Show complaint pins + public locations

### Key Pages to Visit
- `/` — Landing page
- `/dashboard` — Citizen portal (after login as USER)
- `/dashboard/complaints` — All citizen complaints
- `/admin` — Admin dashboard with analytics
- `/admin/complaints` — All complaints with filters
- `/admin/users` — User management
- `/admin/departments` — Department management
- `/admin/staff` — Staff management
- `/admin/map` — Map with all complaint locations
- `/staff` — Staff portal (after login as STAFF)
- `/staff/complaints` — Assigned complaints

---

## 20. Possible Q&A

**Q: Why Next.js instead of a separate frontend + backend?**  
A: Next.js App Router with Server Actions gives us a full-stack solution in one codebase. Server Components reduce client-side JS, and Server Actions eliminate the need for a separate REST API, all while maintaining full type safety.

**Q: Why PostgreSQL over MongoDB?**  
A: Municipal complaint data is highly relational — complaints link to users, departments, staff, comments, activities, and notifications. A relational model with Prisma enforces data integrity via foreign keys and cascades, which is critical for an accountability system.

**Q: How is authentication handled?**  
A: Auth.js with the Prisma adapter stores sessions in the PostgreSQL database. Passwords are hashed with bcryptjs. Middleware protects every route, and server actions re-verify authorization for all mutations.

**Q: How does the notification system work?**  
A: Notifications are generated server-side as a side effect of key complaint actions (creation, assignment, status change, comment, resolution). They are stored in the `Notification` table and fetched on the client. A badge shows the count of unread notifications.

**Q: How does the map integration work?**  
A: We use React Leaflet (built on Leaflet.js) — an open-source mapping library. Complaints with lat/lng are plotted as markers. Public locations (bins, sites) are pre-seeded in the `PublicLocation` table and shown as different marker types. Staff can tap a marker to open Google Maps for turn-by-turn navigation.

**Q: What happens if a user tries to access the admin panel?**  
A: The Next.js Middleware checks the session role on every request. If a USER tries to access `/admin`, they are redirected to `/unauthorized`. All server actions also re-verify the session role to prevent privilege escalation.

**Q: How are images stored?**  
A: Images are uploaded directly from the browser to ImageKit's CDN using a server-generated auth token. Only the resulting URL is stored in the database. This keeps the database lean and delivers images via CDN with automatic optimization (resizing, compression, format conversion).

**Q: Is the application responsive?**  
A: Yes, fully. All pages use Tailwind CSS responsive classes (`sm:`, `md:`, `lg:`) with a mobile-first approach. The navigation collapses to a drawer (Sheet component) on mobile.

**Q: What is the T3 Stack?**  
A: The T3 Stack is a popular, opinionated full-stack Next.js project starter (by Theo — t3.gg) that bundles TypeScript, Tailwind CSS, Prisma, tRPC (or Server Actions), and NextAuth. It enforces type safety throughout the entire stack. JotaComplaint was scaffolded using `create-t3-app`.

**Q: Can this scale to a real city?**  
A: The architecture is cloud-deployable on platforms like Vercel (frontend) and Railway/Render (PostgreSQL). With proper indexing (already defined in the Prisma schema), the design can handle thousands of complaints. The future scope includes multi-tenancy, SLA management, and AI auto-categorization for further scaling.


