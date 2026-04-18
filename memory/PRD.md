# PRD — Texplore Amity University Tech Club Platform

## Original Problem Statement
"Explore the codebase read the readme to understand it better and get an understanding of the app. Then add the about page like https://www.fr.com/our-people/ — shows the about member for our app and when we click it should open a dedicated page like fr.com. Make these changes to our app now the flow is it shows a modal."

## Core Architecture
- Next.js 15 (App Router) + TypeScript + Tailwind v4
- Prisma ORM → MongoDB
- Radix UI + shadcn/ui primitives
- Custom cookie-based sessions, bcryptjs, Cloudinary, Nodemailer

## User Personas
- **Visitor**: Browses about/events/gallery, submits contact / join-club forms.
- **Member / Coordinator / VP / President**: Authenticated dashboard users.
- **Admin**: Full access incl. About, Users, Events, Gallery moderation.

## What's Been Implemented (Jan 2026)

### Jan 2026 — Profile Auto-Provision + Schema Cleanup
**Problem:** Logged-in users without a row in `AboutMember` saw *"No About profile created yet. Please contact an admin to create your profile."* in `/admin/about/my-profile`. Separately, the admin **Users** tab excluded any user who was linked to an `AboutMember`.

**Fixes:**
- `src/app/api/about/me/route.ts` (GET): If the user has no `AboutMember`, the endpoint now **auto-creates a blank one** (`displayName = user.name`, `role = "Member"`, `isPublished = false`). `/about` and `/about/people/[slug]` still respect `isPublished`, so auto-created cards stay hidden until the user flips the new toggle.
- `src/components/AboutProfileEditor.tsx`: Removed the 404 error branch; added a **"Show on the public About page"** checkbox tied to `isPublished`. Save path now PATCHes `isPublished`.
- `src/app/api/about/me/route.ts` (PATCH): Accepts `isPublished`.
- `src/app/api/users/route.ts`: Removed the block that filtered out users with an `AboutMember` row. All users now appear in the admin Users tab regardless of about-profile status. Removed the `includeAboutProfileOnly` query param (no longer needed).
- **Removed `User.isAboutProfileOnly`** field + index from `prisma/schema.prisma`, all call sites (`src/lib/auth.ts`, `src/components/Sidebar/index.tsx`, `src/app/api/about/route.ts`), since every authenticated user now gets an About record on demand.

**Verification (curl):**
- Member login → `GET /api/about/me` returns HTTP 200 with a freshly created `isPublished: false` record.
- `GET /api/about` (public) returns 0 members (unpublished excluded). ✓
- `GET /api/users` as admin returns all 5 seeded users (admin, president, vp, coordinator, member). ✓

### Jan 2026 — About Member Dedicated Profile Pages + Loading Skeleton
- Replaced the modal on `/about` with dedicated SEO-friendly URLs: `/about/people/[slug]`
- `src/lib/about-slug.ts`: slug helpers + shared static-fallback data (leaders + department heads)
- `src/app/(student-portal)/about/people/[slug]/page.tsx`: server-rendered profile page with:
  - Breadcrumbs (Home / About / [Name])
  - Hero banner with portrait, category badge, name, role, additional role, department, social links
  - Bio section + focus areas (responsibilities) for department heads
  - Quick Facts sidebar + "Get in touch" contact card
  - "Meet other team members" grid linking to other profile slugs
- `src/app/(student-portal)/about/people/[slug]/loading.tsx`: skeleton that shows instantly during navigation so clicking a member no longer feels stuck.
- `src/components/About.tsx`: replaced `onClick={setSelectedMember}` + `<Dialog>` modal with `<Link href="/about/people/[slug]">` — **both DB-backed and static fallback members are clickable**
- Supports DB-backed members (when About API is available) with automatic fallback to static data in `src/lib/about-slug.ts`
- Tested end-to-end: navigation, breadcrumbs, back link, static-leader profile, static-department-head profile, and cross-links in "other members" all verified via Playwright

## Prior Functionality (unchanged)
Auth (login/register/password reset), role + permissions, events + registrations, gallery w/ Cloudinary + moderation, contact submissions, join-club applications, user management, about management from admin.

## Prioritized Backlog
- **P1**: Seed About members in DB so live data replaces static fallback
- **P2**: Add static members' bios / LinkedIn / GitHub URLs to `about-slug.ts` for richer profiles
- **P2**: Add `generateStaticParams` for DB members for faster loads / SSG
- **P3**: "Share profile" button + OG metadata image for each profile

## Next Tasks
- Optional: Populate real bios for leadership and department heads in DB
- Optional: Admin UI already supports About management — migrate static members into DB via `npm run about:seed-members` when content is ready
