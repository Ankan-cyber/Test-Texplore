# Texplore — Amity University Tech Club Platform

A full-stack web platform for **Texplore**, the technology club of Amity University. It serves as both a public-facing student portal (events, gallery, about, contact, join-club) and a private admin dashboard for club management.

---

## 🚀 Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Framework** | [Next.js 15](https://nextjs.org) (App Router) | Full-stack React framework. Handles routing, server components, API routes, and middleware in one codebase. |
| **Language** | TypeScript | Type-safe development across the entire stack. |
| **Styling** | Tailwind CSS v4 | Utility-first CSS for rapid, consistent UI building. |
| **UI Components** | [Radix UI](https://www.radix-ui.com/) + [shadcn/ui](https://ui.shadcn.com/) | Accessible, headless UI primitives (dialogs, dropdowns, checkboxes, etc.) styled with Tailwind. |
| **Database** | MongoDB (via [Prisma ORM](https://www.prisma.io/)) | Flexible document database. Prisma provides type-safe queries and schema management. |
| **Authentication** | Custom cookie-based sessions | Avoids third-party auth dependencies. Sessions are stored as signed, `httpOnly` cookies and managed server-side. |
| **Password Hashing** | [bcryptjs](https://github.com/dcodeIO/bcrypt.js) | Secure password hashing with salt rounds. |
| **Media Storage** | [Cloudinary](https://cloudinary.com/) | Cloud-based image upload, transformation, and CDN delivery for gallery images and event covers. |
| **Email** | [Nodemailer](https://nodemailer.com/) | Server-side email delivery for password reset and contact replies. |
| **Forms** | [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/) | Performant form state management with schema-based client & server validation. |
| **Tables** | [TanStack Table](https://tanstack.com/table) | Headless, feature-rich data tables for admin views (users, contacts, registrations). |
| **Date Utilities** | [date-fns](https://date-fns.org/) | Lightweight date formatting and arithmetic. |
| **Notifications** | [react-hot-toast](https://react-hot-toast.com/) | Lightweight toast notification system. |
| **Icons** | [Lucide React](https://lucide.dev/) | Clean, consistent icon set. |
| **Linter/Formatter** | ESLint + Prettier | Code quality and consistent formatting. |

---

## 🗂 Project Structure

```
texplore-amity/
├── prisma/
│   ├── schema.prisma        # Database schema (models, enums, relations)
│   └── seed.ts              # Seed script to populate initial data
├── src/
│   ├── app/
│   │   ├── (student-portal)/  # Public-facing pages (no auth required)
│   │   │   ├── page.tsx         # Home
│   │   │   ├── about/
│   │   │   ├── contact/
│   │   │   ├── events/
│   │   │   ├── gallery/
│   │   │   ├── ieee/
│   │   │   └── joinclub/
│   │   ├── (dashboard)/       # Protected admin dashboard
│   │   │   ├── admin/           # Admin landing page
│   │   │   ├── auth/            # Login & register pages
│   │   │   └── admin/
│   │   │       ├── users/
│   │   │       ├── events/
│   │   │       ├── gallery/
│   │   │       ├── contact/
│   │   │       ├── join-club/
│   │   │       └── settings/
│   │   └── api/               # API Route Handlers (REST-like)
│   │       ├── auth/            # Login, logout, register, password reset
│   │       ├── users/           # User CRUD
│   │       ├── events/          # Event CRUD + registrations
│   │       ├── gallery/         # Folder & image management, Cloudinary
│   │       ├── contact/         # Contact submissions
│   │       ├── join-club/       # Club applications
│   │       ├── departments/     # Department management
│   │       └── admin/           # Admin-only utilities
│   ├── components/            # React components
│   │   ├── ui/                  # Base shadcn/ui primitives
│   │   ├── modals/              # Feature-specific modal dialogs
│   │   ├── Sidebar/             # Admin sidebar with permission-gated links
│   │   ├── GalleryManagement/   # Upload, folder, moderation components
│   │   ├── Home.tsx, Events.tsx, Gallery.tsx, ...  # Page-level components
│   ├── lib/
│   │   ├── auth.ts              # Login, register, session helpers
│   │   ├── session.ts           # Session read/write/destroy (server-side)
│   │   ├── permissions.ts       # Role hierarchy & permission definitions
│   │   ├── cloudinary.ts        # Cloudinary client config & upload helpers
│   │   ├── email.ts             # Email sending via Nodemailer
│   │   ├── db.ts                # Prisma client singleton
│   │   └── client-session.ts    # Client-side session fetching hooks
│   ├── hooks/                 # Custom React hooks
│   ├── contexts/              # React context providers
│   ├── types/                 # Shared TypeScript types
│   ├── providers/             # App-wide wrappers (e.g., SessionProvider)
│   └── middleware.ts          # Route protection & session refresh logic
```

---

## ⚙️ How the Application Works (Workflow)

### 1. Routing & Middleware

Next.js App Router splits the app into two **route groups**:

- **`(student-portal)`** — Public pages accessible to everyone (Home, About, Events, Gallery, IEEE, Contact, Join Club).
- **`(dashboard)`** — Protected pages exclusively for club members and admins.

`src/middleware.ts` runs on every request and:
1. Checks if the route is public (whitelisted) → allows through.
2. For protected/admin routes, reads the `session` cookie.
3. If the session is missing or expired → redirects to `/auth/login`.
4. If valid → **refreshes** the session expiry (sliding window) and continues.
5. Specific API routes (e.g., `GET /api/events`) are explicitly whitelisted for public access while mutations require auth.

---

### 2. Authentication Flow

Authentication is **entirely custom** — no NextAuth or Clerk.

```
User submits login form
        ↓
POST /api/auth/login
        ↓
Fetch user from DB by email (Prisma)
        ↓
Compare password with bcryptjs
        ↓
Create session object { userId, role, expiresAt } → store in httpOnly cookie
        ↓
Middleware reads & refreshes cookie on every request
        ↓
Server components call getCurrentUser() → reads cookie → fetches user from DB
```

- **Registration**: `POST /api/auth/register` creates user with `status: PENDING`. An admin must approve the account before it becomes active.
- **Password Reset**: User requests a reset link via email → `PasswordResetToken` row created in DB with expiry → Nodemailer sends email with token → User visits link → token validated → password updated.
- **Session**: Stored as a JSON object in a signed `httpOnly` cookie. The middleware refreshes the `expiresAt` on each request (configurable via `SESSION_TIMEOUT_MINUTES` env var).

---

### 3. Role-Based Access Control (RBAC)

The platform uses a **two-layer permission system** defined in `src/lib/permissions.ts`:

**Role Hierarchy** (lowest → highest):
```
member → coordinator → vice_president → president → admin
```

**Granular Permissions** (examples):
- `event:create`, `event:delete`, `event:approve`
- `gallery:upload`, `gallery:moderate`, `gallery:delete`
- `user:approve`, `user:delete`
- `contact:read`, `contact:update`
- `join-club:manage`, `join-club:delete`
- `admin:dashboard`

Each user has a `role` **and** an explicit `permissions: String[]` array stored in the database. This allows admins to grant custom/granular permissions beyond the role defaults.

Every API route checks permissions server-side by reading the session user's permissions array. The admin sidebar dynamically shows/hides sections based on `getAccessibleFeatures(user)`.

---

### 4. Database (Prisma + MongoDB)

**Key Models:**

| Model | Purpose |
|---|---|
| `User` | Club members with role, status, department, and permissions array |
| `Profile` | Extended member info: bio, year, skills, LinkedIn, GitHub |
| `Department` | Club departments (e.g., Web Dev, AI/ML, Cybersecurity) |
| `Event` | Events with dates, capacity, registration deadline, status lifecycle |
| `EventRegistration` | Public registrations (no account needed) with internal/external type |
| `EventOrganizer` | Maps club members to events they organize |
| `EventAttendee` | Attendance tracking with check-in/check-out times |
| `GalleryFolder` | Hierarchical folder structure for the photo gallery |
| `GalleryImage` | Images stored in Cloudinary, requiring approval before public display |
| `ContactSubmission` | Contact form submissions with status tracking and reply capability |
| `JoinClubApplication` | Membership applications with interview scheduling workflow |
| `PasswordResetToken` | One-time tokens for secure password recovery |

---

### 5. Feature Workflows

#### 📅 Events
1. Admin/coordinator creates an event via the admin dashboard → status `DRAFT`.
2. Event is published (`PUBLISHED`) → appears on the public `/events` page.
3. Anyone (no account needed) can register via a form → creates `EventRegistration` record.
4. Admins can view, filter, and export registrations from the dashboard.
5. Event can be `COMPLETED`, `CANCELLED`, or `ARCHIVED`.

#### 🖼 Gallery
1. Authorised users upload images via the admin dashboard.
2. Images are uploaded directly to **Cloudinary** using a signed upload signature obtained from the server.
3. Cloudinary returns a public URL and metadata → saved to `GalleryImage` in MongoDB.
4. Images are in `isApproved: false` state by default → require moderator approval.
5. Approved images appear on the public `/gallery` page, organised by folder.

#### 📬 Contact
1. Any visitor submits the contact form → `ContactSubmission` created with `status: PENDING`.
2. Admins with `contact:read` see submissions in the dashboard.
3. Admin can reply via email (Nodemailer), mark as `IN_PROGRESS` → `RESOLVED` → `CLOSED`.

#### 🤝 Join Club
1. Prospective member fills in the Join Club form → `JoinClubApplication` created with `status: PENDING`.
2. Admins with `join-club:manage` review applications, schedule interviews.
3. Application progresses: `PENDING → INTERVIEW_SCHEDULED → INTERVIEW_COMPLETED → APPROVED/REJECTED`.

#### 👥 User Management
1. Member registers → `status: PENDING`.
2. Admin approves account → `status: APPROVED`, user can log in.
3. Admin can assign roles and customise permissions per user.
4. Admins can suspend or delete accounts.

---

## 🛠 Getting Started

### Prerequisites
- Node.js 18+
- MongoDB database (local or [MongoDB Atlas])
- Cloudinary account
- SMTP credentials for email

### Environment Variables

Create a `.env` file at the project root:

```env
# Database
DATABASE_URL="mongodb+srv://..."

# Session
SESSION_SECRET="your-secret-key"
SESSION_TIMEOUT_MINUTES=60

# Cloudinary
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# Email (Nodemailer)
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=
EMAIL_FROM=

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Installation & Run

```bash
# 1. Install dependencies
npm install

# 2. Generate Prisma client
npm run db:generate

# 3. Push schema to database
npm run db:push

# 4. (Optional) Seed initial data
npm run db:seed

# 5. Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Available Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start dev server with Turbopack |
| `npm run build` | Build for production (auto-runs `db:generate` & `db:push`) |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run format` | Format code with Prettier |
| `npm run db:generate` | Regenerate Prisma client after schema changes |
| `npm run db:push` | Push schema changes to the database |
| `npm run db:seed` | Seed the database with initial data |

---

## 🚢 Deployment

The easiest way to deploy is [Vercel](https://vercel.com):

1. Push the repository to GitHub.
2. Import the project on Vercel.
3. Set all environment variables in the Vercel dashboard.
4. Vercel automatically runs `npm run build` (which includes `db:generate` and `db:push`).

For any other Node.js hosting (Railway, Render, VPS), run `npm run build && npm run start`.
