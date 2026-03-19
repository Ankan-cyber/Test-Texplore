# Architecture Remediation Plan (Objectives 1-12)

Date: 2026-03-18
Source: First remediation plan from the working session (normalized into objectives 1-12).

## Objective 1. Lock down sensitive user responses
Status: Completed

- Define and use a shared user response sanitizer so password hashes are never returned.
- Apply safe user DTOs in user-related endpoints.

Evidence:
- `src/lib/user-response.ts`
- `src/app/api/users/route.ts`
- `src/app/api/users/[id]/role/route.ts`
- `src/app/api/users/[id]/status/route.ts`
- `src/app/api/auth/me/route.ts`

## Objective 2. Replace plaintext cookie sessions with signed/verified sessions
Status: Completed

- Replace JSON cookie payload with HMAC-signed token format.
- Verify token integrity on read; invalidate bad tokens.

Evidence:
- `src/lib/session-token.ts`
- `src/lib/session.ts`
- `src/middleware.ts`

## Objective 3. Redesign middleware responsibilities and matcher boundaries
Status: Completed

- Keep middleware focused on protected page routes.
- Move API authorization to route handlers/guards.
- Remove stale/legacy middleware route assumptions.

Evidence:
- `src/middleware.ts`

## Objective 4. Centralize API authentication/authorization helpers
Status: Completed

- Introduce reusable auth guards and migrate handlers incrementally.
- Reduce duplicated auth and permission logic in route files.

Evidence:
- `src/lib/api-guards.ts`
- Migrated routes include:
  - `src/app/api/contact/route.ts`
  - `src/app/api/contact/[id]/reply/route.ts`
  - `src/app/api/join-club/route.ts`
  - `src/app/api/join-club/[id]/route.ts`
  - `src/app/api/users/route.ts`
  - `src/app/api/users/options/route.ts`
  - `src/app/api/users/[id]/role/route.ts`
  - `src/app/api/users/[id]/status/route.ts`
  - `src/app/api/events/[id]/registrations/route.ts`
  - `src/app/api/admin/dashboard/route.ts`
  - `src/app/api/auth/change-password/route.ts`
  - `src/app/api/auth/me/route.ts`
  - `src/app/api/events/upload-signature/route.ts`
  - `src/app/api/events/upload/route.ts`
  - `src/app/api/gallery/upload/route.ts`
  - `src/app/api/gallery/upload-signature/route.ts`
  - `src/app/api/gallery/search/route.ts`
  - `src/app/api/gallery/folders/route.ts`
  - `src/app/api/gallery/folders/[id]/route.ts`
  - `src/app/api/gallery/folders/tree/route.ts`
  - `src/app/api/gallery/images/route.ts`
  - `src/app/api/gallery/images/[id]/route.ts`
  - `src/app/api/gallery/images/[id]/approve/route.ts`
  - `src/app/api/gallery/images/upload/route.ts`
  - `src/app/api/departments/route.ts` (POST path)

- `src/app/api/events/route.ts`
- `src/app/api/events/[id]/route.ts`
- `src/app/api/departments/route.ts` (GET path via optional-auth guard helper)

## Objective 5. Split baseline seed from optional demo fixtures
Status: Completed

- Introduce environment-gated demo seeding.
- Keep baseline seed path deterministic.
- Extract baseline/demo seeding into dedicated modules.

Evidence:
- `prisma/seed.ts`
- `prisma/seeds/baseline.ts`
- `prisma/seeds/demo.ts`
- `prisma/seeds/password.ts`
- `package.json`

## Objective 6. Remove hardcoded credentials and risky seed defaults
Status: Completed

- Replace hardcoded seeded passwords with env-provided or generated credentials.
- Avoid printing fixed credentials.

Evidence:
- `prisma/seed.ts`
- `README.md`

## Objective 7. Separate build from database mutation lifecycle
Status: Completed

- Remove automatic DB push from build pipeline.
- Keep DB push/seed as explicit operator actions.

Evidence:
- `package.json`
- `README.md`

## Objective 8. Harden reset and generated credential entropy
Status: Completed

- Replace weak random generation with cryptographic random APIs.

Evidence:
- `src/lib/reset-token.ts`
- `src/app/api/users/route.ts`
- `src/app/api/gallery/images/upload/route.ts`

## Objective 9. Hash password reset tokens at rest
Status: Completed

- Store hashed reset token and compare against hashed input during reset.
- Keep temporary compatibility path for existing plaintext records.

Evidence:
- `src/lib/reset-token.ts`
- `src/app/api/auth/forgot-password/route.ts`
- `src/app/api/auth/reset-password/route.ts`

## Objective 10. Refactor heavy route handlers into service modules
Status: Completed

- Extracted business logic into `src/lib/services/*`.
- Route handlers are now thin auth/validation/response adapters.

Evidence:
- `src/lib/services/events-service.ts`
- `src/lib/services/gallery-images-service.ts`
- `src/app/api/events/route.ts`
- `src/app/api/events/[id]/route.ts`
- `src/app/api/gallery/images/route.ts`
- `src/app/api/gallery/images/[id]/route.ts`

## Objective 11. Consolidate upload/folder hierarchy helpers
Status: Completed

- Remove duplicate hierarchy/path generation logic in gallery upload routes.
- Consolidate folder path resolution in one shared utility.

Evidence:
- `src/lib/gallery-folders.ts`
- `src/app/api/gallery/upload/route.ts`
- `src/app/api/gallery/upload-signature/route.ts`
- `src/app/api/gallery/images/upload/route.ts`

## Objective 12. Normalize validation and pagination/query limits across APIs
Status: Completed

- Centralize Zod request schemas for query/body parsing.
- Standardize pagination limits and query validation in targeted routes.

Evidence:
- `src/lib/api-schemas.ts`
- `src/app/api/events/route.ts`
- `src/app/api/gallery/images/route.ts`
- `src/app/api/join-club/route.ts`

---

## Remaining Objectives To Resume Next

1. No remaining objectives from 1-12. Execution completed.
