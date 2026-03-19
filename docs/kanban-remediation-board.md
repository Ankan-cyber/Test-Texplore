# Kanban Board - Architecture Remediation

Last updated: 2026-03-19
Source of truth: objectives and current workspace implementation state.

## Done

### Card: Objective 1 - Sensitive user response hardening
- Status: Done
- Highlights:
  - Shared user response sanitizer introduced and applied.
- Key files:
  - src/lib/user-response.ts
  - src/app/api/users/route.ts
  - src/app/api/users/[id]/role/route.ts
  - src/app/api/users/[id]/status/route.ts
  - src/app/api/auth/me/route.ts

### Card: Objective 2 - Signed/verified session cookies
- Status: Done
- Highlights:
  - Session token encoding/verification introduced and wired.
- Key files:
  - src/lib/session-token.ts
  - src/lib/session.ts
  - src/middleware.ts

### Card: Objective 3 - Middleware boundary cleanup
- Status: Done
- Highlights:
  - Middleware scope tightened to admin pages via matcher.
  - Removed stale route assumptions from middleware logic.
- Key files:
  - src/middleware.ts

### Card: Objective 4 - API auth/authz guard migration
- Status: Done
- Highlights:
  - Legacy auth usage removed from API handlers.
  - Events and departments optional-auth behavior now use centralized helpers.
- Key files:
  - src/lib/api-guards.ts
  - src/app/api/events/route.ts
  - src/app/api/events/[id]/route.ts
  - src/app/api/departments/route.ts

### Card: Objective 5 - Seed modularization
- Status: Done
- Highlights:
  - Monolithic seed split into baseline/demo/password modules.
  - Seed entrypoint now orchestrates module execution.
- Key files:
  - prisma/seed.ts
  - prisma/seeds/baseline.ts
  - prisma/seeds/demo.ts
  - prisma/seeds/password.ts
  - package.json

### Card: Objective 6 - Seed credential hardening
- Status: Done
- Highlights:
  - Hardcoded seed credentials removed from default behavior.
- Key files:
  - prisma/seed.ts
  - README.md

### Card: Objective 7 - Build and DB lifecycle separation
- Status: Done
- Highlights:
  - Build no longer auto-pushes DB schema.
- Key files:
  - package.json
  - README.md

### Card: Objective 8 - Secure token/password randomness in APIs
- Status: Done
- Highlights:
  - Crypto-based generation adopted in auth and upload paths.
- Key files:
  - src/lib/reset-token.ts
  - src/app/api/users/route.ts
  - src/app/api/gallery/images/upload/route.ts
  - src/app/api/gallery/upload/route.ts

### Card: Objective 9 - Reset token hashing at rest
- Status: Done
- Highlights:
  - Reset tokens hashed at persistence and compared by hash.
- Key files:
  - src/lib/reset-token.ts
  - src/app/api/auth/forgot-password/route.ts
  - src/app/api/auth/reset-password/route.ts

### Card: Objective 10 - Service layer extraction
- Status: Done
- Highlights:
  - Route-heavy business logic extracted into service modules.
  - Route files now primarily handle transport/auth/error mapping.
- Key files:
  - src/lib/services/events-service.ts
  - src/lib/services/gallery-images-service.ts
  - src/app/api/events/route.ts
  - src/app/api/events/[id]/route.ts
  - src/app/api/gallery/images/route.ts
  - src/app/api/gallery/images/[id]/route.ts

### Card: Objective 11 - Upload/folder helper consolidation
- Status: Done
- Highlights:
  - Shared folder hierarchy/path utility introduced and reused.
- Key files:
  - src/lib/gallery-folders.ts
  - src/app/api/gallery/upload-signature/route.ts
  - src/app/api/gallery/upload/route.ts
  - src/app/api/gallery/images/upload/route.ts

### Card: Objective 12 - Validation and pagination/query normalization
- Status: Done
- Highlights:
  - Shared query schemas added and adopted in target APIs.
- Key files:
  - src/lib/api-schemas.ts
  - src/app/api/events/route.ts
  - src/app/api/gallery/images/route.ts
  - src/app/api/join-club/route.ts

### Card: Entropy hardening follow-up
- Status: Done
- Highlights:
  - Removed remaining Math.random usage in upload-related flows.
- Key files:
  - src/lib/gallery-upload.ts
  - src/components/GalleryManagement/GalleryManager.tsx

## In Progress

- None

## Backlog

- None from objectives 1-12

---

## Optional Next Iteration (Post-Remediation)
1. Completed: Added automated route-contract schema tests.
  - tests/contracts/query-schemas.contract.test.ts
2. Completed: Added CI checks that enforce schema-validated query parsing patterns.
  - .github/workflows/ci.yml
  - scripts/check-query-schema-usage.mjs
  - package.json (ci/check scripts)
3. Completed: Added migration notes for deployment operators (seed and environment runbook).
  - docs/DEPLOYMENT_RUNBOOK.md
