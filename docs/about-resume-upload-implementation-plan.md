1. Objective
Add a member resume upload feature for the About profile flow so authenticated members can upload a PDF resume to Cloudinary, persist only the URL in the database, and display a resume link on that member’s public About profile.

2. Scope
In scope:
- Extend About member data model to store a single resume URL.
- Add secure API support for PDF upload to Cloudinary using authenticated member/admin access.
- Update member self-profile editor to upload and save resume URL.
- Expose resume link in public About member profile UI.
- Add validation and test coverage for new payload and upload constraints.

Out of scope:
- Resume version history.
- Resume parsing/indexing.
- File deletion lifecycle on Cloudinary for replaced URLs (can be a follow-up).
- Public direct resume uploads without authentication.

3. Codebase Findings
- The About member schema currently supports image and social links but has no resume field in [prisma/schema.prisma](prisma/schema.prisma#L417).
- Shared About payload validation is centralized in [src/lib/api-schemas.ts](src/lib/api-schemas.ts#L56) via aboutCreateUpdateSchema, used by create/update/self-update routes.
- About CRUD and self-update routes map/validate fields in:
  - [src/app/api/about/route.ts](src/app/api/about/route.ts#L10)
  - [src/app/api/about/[id]/route.ts](src/app/api/about/[id]/route.ts#L9)
  - [src/app/api/about/me/route.ts](src/app/api/about/me/route.ts#L78)
- Member self-edit UI already uploads profile images through gallery upload flow in [src/components/AboutProfileEditor.tsx](src/components/AboutProfileEditor.tsx#L176), so this is the natural insertion point for resume upload UX.
- Current Cloudinary helper upload function is image-only via fixed resource_type image in [src/lib/cloudinary.ts](src/lib/cloudinary.ts#L66), which is incompatible with PDF upload unless extended.
- Public member profile page currently renders social links only in [src/app/(student-portal)/about/people/[slug]/page.tsx](src/app/(student-portal)/about/people/[slug]/page.tsx#L210), so resume display must be added there.
- Resolved member typing/normalization for public profile is in [src/lib/about-slug.ts](src/lib/about-slug.ts#L171), and DB mapping in the profile page should include the resume URL.

4. Step-by-Step Plan
1. Add resume URL field to AboutMember model
- Files:
  - [prisma/schema.prisma](prisma/schema.prisma#L417)
- Changes:
  - Add nullable String field resumeUrl under AboutMember media/profile section.
  - Keep this as URL only, no Cloudinary ID field, matching requirement.
- Expected outcome:
  - DB can persist one optional resume link per member.
- Complexity: Low

2. Regenerate Prisma client and align service typing
- Files:
  - [src/lib/services/about-members-service.ts](src/lib/services/about-members-service.ts#L5)
- Changes:
  - Run db push/generate.
  - Extend AboutMemberWithUser interface with resumeUrl: string | null.
  - Ensure getPublishedMembers select includes resumeUrl for public reads.
- Expected outcome:
  - Type-safe service access to resume URL without any casts/workarounds.
- Complexity: Low

3. Extend About validation schema for resume URL
- Files:
  - [src/lib/api-schemas.ts](src/lib/api-schemas.ts#L56)
- Changes:
  - Add resumeUrl: z.string().url().optional().nullable() to aboutCreateUpdateSchema.
- Expected outcome:
  - Create/update/self-update routes can accept validated resume URL.
- Complexity: Low

4. Update About API request contracts and UI mappers
- Files:
  - [src/app/api/about/route.ts](src/app/api/about/route.ts#L10)
  - [src/app/api/about/[id]/route.ts](src/app/api/about/[id]/route.ts#L9)
  - [src/app/api/about/me/route.ts](src/app/api/about/me/route.ts#L78)
- Changes:
  - Add resumeUrl to route-level request schemas.
  - Pass resumeUrl into aboutCreateUpdateSchema payloads.
  - Include resumeUrl in response mapping so client receives it consistently.
- Expected outcome:
  - Resume URL is round-trippable across admin and self-service About endpoints.
- Complexity: Medium

5. Add secure resume upload API for PDF to Cloudinary
- Files:
  - [src/lib/cloudinary.ts](src/lib/cloudinary.ts#L66)
  - New route under src/app/api/about/resume/upload/route.ts
- Changes:
  - Extend Cloudinary helper with a generic uploader (or optional resource type) that supports raw uploads for PDFs.
  - Implement authenticated upload endpoint with requireAuthenticatedUser plus requireAnyUserPermission for about:self:update or about:manage.
  - Validate input as multipart/form-data with file Blob, enforce MIME application/pdf and size limit (for example 5MB or 10MB).
  - Upload to dedicated folder (for example texplore/about/resumes) and return only secure_url (optionally include public_id in response for logs only).
- Expected outcome:
  - Members can upload PDF resumes safely; backend returns URL ready to persist.
- Complexity: Medium

6. Implement member resume upload UX in self profile editor
- Files:
  - [src/components/AboutProfileEditor.tsx](src/components/AboutProfileEditor.tsx#L16)
- Changes:
  - Extend AboutProfile interface/state with resumeUrl.
  - Add Resume PDF upload control (accept application/pdf).
  - Add upload handler using FormData to call new resume upload endpoint.
  - Include resumeUrl in PATCH /api/about/me payload.
  - Render current resume link and remove/reset action (sets null/empty).
- Expected outcome:
  - Member can upload resume PDF, save profile, and persist only URL.
- Complexity: Medium

7. Display resume on public user About profile page
- Files:
  - [src/lib/about-slug.ts](src/lib/about-slug.ts#L171)
  - [src/app/(student-portal)/about/people/[slug]/page.tsx](src/app/(student-portal)/about/people/[slug]/page.tsx#L20)
- Changes:
  - Add optional resumeUrl to ResolvedMember.
  - Include resumeUrl in mapDbMemberToResolved for DB-backed profiles.
  - Render a Resume action/link (for example in socials/action row or quick-facts card), opening in new tab with safe rel attributes.
- Expected outcome:
  - Public member page clearly shows resume link when available.
- Complexity: Low

8. Optional admin manage form parity
- Files:
  - [src/components/AboutMemberForm.tsx](src/components/AboutMemberForm.tsx#L10)
- Changes:
  - If needed, add resume URL field for admin create/edit flow so admins can set or correct links.
- Expected outcome:
  - Admin and self-edit data model remain consistent.
- Complexity: Low

9. Add tests for schema and upload constraints
- Files:
  - [tests/contracts/query-schemas.contract.test.ts](tests/contracts/query-schemas.contract.test.ts)
  - New tests in tests folder for About resume upload route.
- Changes:
  - Add contract assertions for resumeUrl acceptance/rejection.
  - Add API tests for upload route auth, MIME rejection, oversized file rejection, and success path (with Cloudinary mocked).
- Expected outcome:
  - Regression protection for validation and security-sensitive upload behavior.
- Complexity: Medium

5. Validation Plan
Automated checks:
- Run npm run db:push after schema update.
- Run npm run db:generate.
- Run npm run typecheck.
- Run npm run lint.
- Run npm run test.
- Run npm run ci for full guardrail.

Manual checks:
- Member flow:
  - Login as user with about:self:update and open /admin/about/my-profile.
  - Upload valid PDF and confirm success toast plus resume link preview.
  - Save profile and reload page; resume link remains.
- Public flow:
  - Open /about/people/[slug] for that member and confirm resume link is visible and opens correctly.
- Negative paths:
  - Upload non-PDF and verify clear validation error.
  - Upload file above configured limit and verify rejection.
  - Access upload route unauthenticated and verify 401/403 behavior.

Rollout checks:
- Verify Cloudinary usage/folder naming for resumes.
- Verify no existing image upload path regressed.
- Verify existing members without resumeUrl still render without layout issues.

6. Risks and Mitigations
- Risk: Reusing image-only Cloudinary helper for PDF causes failed uploads.
- Mitigation: Add explicit raw upload support with resource_type raw and separate endpoint.

- Risk: Base64 uploads increase payload size and may hit limits.
- Mitigation: Use multipart/form-data for resume upload endpoint.

- Risk: Unauthorized users upload arbitrary files.
- Mitigation: Keep strict auth plus permission checks and hard MIME/size validation.

- Risk: Broken public profile rendering for members without resume.
- Mitigation: Keep resumeUrl optional end-to-end and guard conditional rendering.

- Risk: URL-only storage makes cleanup harder when replacing files.
- Mitigation: Document this tradeoff and plan optional follow-up for Cloudinary public_id tracking if deletion becomes necessary.

7. Open Questions
1. Should resume link be shown only on the dedicated profile page /about/people/[slug], or also on About listing cards in /about?
2. What max PDF size do you want to enforce (5MB, 10MB, or another limit)?
3. Should admin create/edit flow also support resume upload directly, or only member self-profile edit?
4. Should replacing a resume automatically invalidate/delete old Cloudinary files, or is URL replacement only acceptable for now?
