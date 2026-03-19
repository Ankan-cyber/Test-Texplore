# Deployment Runbook

## Purpose
This runbook captures operational steps for schema updates, seeding, and environment setup after remediation.

## Required Environment Variables
- DATABASE_URL
- SESSION_SECRET
- EMAIL_SERVER_HOST
- EMAIL_SERVER_PORT
- EMAIL_SERVER_USER
- EMAIL_SERVER_PASS
- EMAIL_FROM
- NEXT_PUBLIC_APP_URL

## One-Time Environment Validation
1. Confirm all required variables are present in the deployment environment.
2. Ensure DATABASE_URL points to the intended MongoDB cluster/database.
3. Ensure SESSION_SECRET is set to a strong random value.

## Database Workflow
1. Regenerate Prisma client when schema changes:
- npm run db:generate

2. Apply schema changes explicitly:
- npm run db:push

3. Seed baseline data (safe default):
- npm run db:seed

4. Seed demo data only when explicitly desired:
- npm run db:seed:demo

## Build and Start
1. Build:
- npm run build

2. Start:
- npm run start

## CI Validation
Use the consolidated CI command locally before merge:
- npm run ci

This runs:
- lint
- typecheck
- contract tests
- query schema enforcement

## Rollback Notes
1. Revert application deployment to previous known good image/commit.
2. Restore database backup if a destructive data change occurred.
3. Re-run baseline seed only when required to restore expected baseline records.

## Troubleshooting
### Seed fails with missing DATABASE_URL
- Verify the variable exists in deployment environment.
- Verify local .env/.env.local has DATABASE_URL when seeding locally.
- Re-run: npm run db:seed

### Query validation failures in CI
- Ensure target API routes use shared parseQuery + schema flow from src/lib/api-schemas.ts.
- Re-run: npm run check:query-schemas
