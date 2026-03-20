1. Objective
Improve responsiveness and usability of the admin portal on small and medium screens, with highest priority on gallery management and dense admin data views, while preserving desktop behavior and existing permission-driven flows.

2. Scope
In scope
- Admin shell and navigation behavior.
- Admin page headers and spacing consistency.
- Gallery management layout and controls.
- Shared table/filter behavior used by users and registrations.
- Custom tabular pages (contact and join-club) and registration detail header.
- Settings form width and mobile ergonomics.

Out of scope
- Student portal pages.
- Backend API logic and data models.
- Visual redesign of branding/colors.

Primary files in scope
- [src/app/(dashboard)/admin/layout.tsx](src/app/(dashboard)/admin/layout.tsx)
- [src/components/Sidebar/index.tsx](src/components/Sidebar/index.tsx)
- [src/app/(dashboard)/admin/gallery/page.tsx](src/app/(dashboard)/admin/gallery/page.tsx)
- [src/components/GalleryManagement/GalleryManager.tsx](src/components/GalleryManagement/GalleryManager.tsx)
- [src/components/ui/data-table.tsx](src/components/ui/data-table.tsx)
- [src/components/EventManagement.tsx](src/components/EventManagement.tsx)
- [src/components/UsersDataTable.tsx](src/components/UsersDataTable.tsx)
- [src/components/ContactDataTable.tsx](src/components/ContactDataTable.tsx)
- [src/app/(dashboard)/admin/join-club/page.tsx](src/app/(dashboard)/admin/join-club/page.tsx)
- [src/app/(dashboard)/admin/events/[id]/registrations/page.tsx](src/app/(dashboard)/admin/events/[id]/registrations/page.tsx)
- [src/app/(dashboard)/admin/users/page.tsx](src/app/(dashboard)/admin/users/page.tsx)
- [src/app/(dashboard)/admin/contact/page.tsx](src/app/(dashboard)/admin/contact/page.tsx)
- [src/app/(dashboard)/admin/settings/page.tsx](src/app/(dashboard)/admin/settings/page.tsx)
- [src/components/ChangePasswordCard.tsx](src/components/ChangePasswordCard.tsx)

3. Codebase Findings
- Admin shell uses fixed full viewport height and static content padding, which is desktop-first and can feel cramped on small screens: [src/app/(dashboard)/admin/layout.tsx#L17](src/app/(dashboard)/admin/layout.tsx#L17), [src/app/(dashboard)/admin/layout.tsx#L20](src/app/(dashboard)/admin/layout.tsx#L20).
- Sidebar width is hardcoded to 320px or 96px and mobile trigger is fixed at top-left, increasing overlap risk with page headers: [src/components/Sidebar/index.tsx#L190](src/components/Sidebar/index.tsx#L190), [src/components/Sidebar/index.tsx#L204](src/components/Sidebar/index.tsx#L204).
- Gallery manager is a strict horizontal split layout with fixed left panel width 256px and desktop-style header/filter rows: [src/components/GalleryManagement/GalleryManager.tsx#L980](src/components/GalleryManagement/GalleryManager.tsx#L980), [src/components/GalleryManagement/GalleryManager.tsx#L982](src/components/GalleryManagement/GalleryManager.tsx#L982), [src/components/GalleryManagement/GalleryManager.tsx#L1033](src/components/GalleryManagement/GalleryManager.tsx#L1033), [src/components/GalleryManagement/GalleryManager.tsx#L1087](src/components/GalleryManagement/GalleryManager.tsx#L1087).
- Admin gallery page header uses large typography and wide static padding without small-screen adaptation: [src/app/(dashboard)/admin/gallery/page.tsx#L20](src/app/(dashboard)/admin/gallery/page.tsx#L20), [src/app/(dashboard)/admin/gallery/page.tsx#L22](src/app/(dashboard)/admin/gallery/page.tsx#L22).
- Shared data table has table overflow fallback, but filter/action controls are primarily desktop aligned and pagination layout is right-biased: [src/components/ui/data-table.tsx#L159](src/components/ui/data-table.tsx#L159), [src/components/ui/data-table.tsx#L214](src/components/ui/data-table.tsx#L214), [src/components/ui/data-table.tsx#L261](src/components/ui/data-table.tsx#L261), [src/components/ui/data-table.tsx#L324](src/components/ui/data-table.tsx#L324).
- Event management has desktop header/actions and non-wrapping action cluster in each event row: [src/components/EventManagement.tsx#L231](src/components/EventManagement.tsx#L231), [src/components/EventManagement.tsx#L233](src/components/EventManagement.tsx#L233), [src/components/EventManagement.tsx#L257](src/components/EventManagement.tsx#L257), [src/components/EventManagement.tsx#L427](src/components/EventManagement.tsx#L427).
- Contact table has fixed-width status filter, dense table actions, and dialogs with two-column sections that do not degrade for narrow widths: [src/components/ContactDataTable.tsx#L229](src/components/ContactDataTable.tsx#L229), [src/components/ContactDataTable.tsx#L248](src/components/ContactDataTable.tsx#L248), [src/components/ContactDataTable.tsx#L343](src/components/ContactDataTable.tsx#L343).
- Join-club page uses container + large padding and a dialog with fixed two-column personal info grid/actions row: [src/app/(dashboard)/admin/join-club/page.tsx#L196](src/app/(dashboard)/admin/join-club/page.tsx#L196), [src/app/(dashboard)/admin/join-club/page.tsx#L350](src/app/(dashboard)/admin/join-club/page.tsx#L350), [src/app/(dashboard)/admin/join-club/page.tsx#L376](src/app/(dashboard)/admin/join-club/page.tsx#L376), [src/app/(dashboard)/admin/join-club/page.tsx#L518](src/app/(dashboard)/admin/join-club/page.tsx#L518).
- Event registrations detail page header is horizontal by default with large heading size, reducing compactness on mobile: [src/app/(dashboard)/admin/events/[id]/registrations/page.tsx#L116](src/app/(dashboard)/admin/events/[id]/registrations/page.tsx#L116), [src/app/(dashboard)/admin/events/[id]/registrations/page.tsx#L121](src/app/(dashboard)/admin/events/[id]/registrations/page.tsx#L121).
- Users/settings/contact page headers all use large title sizing and desktop spacing patterns: [src/app/(dashboard)/admin/users/page.tsx#L75](src/app/(dashboard)/admin/users/page.tsx#L75), [src/app/(dashboard)/admin/contact/page.tsx#L22](src/app/(dashboard)/admin/contact/page.tsx#L22), [src/app/(dashboard)/admin/settings/page.tsx#L27](src/app/(dashboard)/admin/settings/page.tsx#L27).
- Change password form max width is acceptable, but action alignment can be improved for touch ergonomics: [src/components/ChangePasswordCard.tsx#L60](src/components/ChangePasswordCard.tsx#L60).

4. Step-by-Step Plan
Step 1: Define responsive admin spacing and typography baseline
- Files: [src/app/(dashboard)/admin/layout.tsx](src/app/(dashboard)/admin/layout.tsx), [src/app/(dashboard)/admin/page.tsx](src/app/(dashboard)/admin/page.tsx), [src/app/(dashboard)/admin/users/page.tsx](src/app/(dashboard)/admin/users/page.tsx), [src/app/(dashboard)/admin/contact/page.tsx](src/app/(dashboard)/admin/contact/page.tsx), [src/app/(dashboard)/admin/settings/page.tsx](src/app/(dashboard)/admin/settings/page.tsx), [src/app/(dashboard)/admin/events/[id]/registrations/page.tsx](src/app/(dashboard)/admin/events/[id]/registrations/page.tsx), [src/app/(dashboard)/admin/gallery/page.tsx](src/app/(dashboard)/admin/gallery/page.tsx), [src/app/(dashboard)/admin/join-club/page.tsx](src/app/(dashboard)/admin/join-club/page.tsx)
- Actions:
  - Reduce global admin content padding for small screens and scale up by breakpoint.
  - Standardize page title style to responsive sizing pattern (small on mobile, current size at md+).
  - Convert rigid header rows to wrapping/stacking structures where action buttons exist.
- Expected outcome: consistent, non-cramped spacing and readable page headers across 320-768 widths.
- Complexity: Low.

Step 2: Make sidebar mobile behavior less intrusive and width-safe
- Files: [src/components/Sidebar/index.tsx](src/components/Sidebar/index.tsx), [src/app/(dashboard)/admin/layout.tsx](src/app/(dashboard)/admin/layout.tsx)
- Actions:
  - Use viewport-relative mobile sidebar width (for example 85vw with max cap) while keeping current desktop widths.
  - Ensure content area does not compete with mobile trigger by adding safe top spacing in admin main region on small screens.
  - Validate overlay and z-index interactions with dialogs.
- Expected outcome: reliable sidebar opening/closing on phones without clipping content or creating accidental overlap.
- Complexity: Medium.

Step 3: Refactor gallery management for responsive layout switching
- Files: [src/components/GalleryManagement/GalleryManager.tsx](src/components/GalleryManagement/GalleryManager.tsx), [src/app/(dashboard)/admin/gallery/page.tsx](src/app/(dashboard)/admin/gallery/page.tsx)
- Actions:
  - Change root layout from always-horizontal split to stacked layout on mobile and split layout on large screens.
  - Replace always-visible fixed folder panel on mobile with toggleable panel (inline collapse or drawer).
  - Make gallery header controls wrap (upload button, view toggle) and place search/filter in stacked block at small breakpoints.
  - Keep image grid responsive and tune smallest breakpoint for card density.
- Expected outcome: gallery remains usable on mobile without horizontal squeeze; controls stay reachable and legible.
- Complexity: High.

Step 4: Upgrade shared table UX for small screens
- Files: [src/components/ui/data-table.tsx](src/components/ui/data-table.tsx)
- Actions:
  - Make filter/search/action row fully responsive (stack on mobile, two-row layout where needed).
  - Make title/actions row wrap and keep export/columns controls visible without overflow.
  - Rework pagination area to stack summary and controls on small screens.
  - Add optional compact/mobile mode hooks (prop-based) for consumers needing card fallback in future.
- Expected outcome: table tooling is usable before horizontal scroll begins; fewer clipped controls.
- Complexity: Medium.

Step 5: Apply table/page-specific responsive fixes to heavy admin views
- Files: [src/components/EventManagement.tsx](src/components/EventManagement.tsx), [src/components/ContactDataTable.tsx](src/components/ContactDataTable.tsx), [src/app/(dashboard)/admin/join-club/page.tsx](src/app/(dashboard)/admin/join-club/page.tsx), [src/app/(dashboard)/admin/events/[id]/registrations/page.tsx](src/app/(dashboard)/admin/events/[id]/registrations/page.tsx), [src/components/RegistrationsDataTable.tsx](src/components/RegistrationsDataTable.tsx)
- Actions:
  - EventManagement: stack header CTA; remove fixed margin on row action cluster and allow action wrapping.
  - ContactDataTable: make filter select full-width on small screens; make dialog detail grids responsive from 2 columns to 1.
  - Join-club page: reduce container padding; make dialog personal-info grid responsive; stack review action buttons on narrow screens.
  - Event registrations page: stack back button and title block on mobile.
  - Registrations table: ensure long columns (email/department) have truncation or wrap strategy and verify with shared table updates.
- Expected outcome: all high-traffic admin screens are operable at phone widths without layout breakage.
- Complexity: Medium.

Step 6: Polish settings and small-form ergonomics
- Files: [src/components/ChangePasswordCard.tsx](src/components/ChangePasswordCard.tsx), [src/app/(dashboard)/admin/settings/page.tsx](src/app/(dashboard)/admin/settings/page.tsx)
- Actions:
  - Ensure form actions align and size appropriately for touch.
  - Verify card spacing and title block scaling within the settings page hierarchy.
- Expected outcome: settings page remains compact and balanced on small screens.
- Complexity: Low.

Step 7: Regression pass and cleanup
- Files: all touched admin files above.
- Actions:
  - Run lint/type checks.
  - Spot-check all admin routes with and without table data.
  - Remove any duplicated one-off responsive overrides created during refactor.
- Expected outcome: stable responsive behavior with minimal CSS debt.
- Complexity: Medium.

5. Validation Plan
Automated checks
- Run lint: npm run lint.
- Run types: npm run typecheck.
- Run production build: npm run build.

Manual checks by viewport
- 320x568, 360x800, 390x844, 768x1024, 1024x768, 1280x800.
- Verify these routes:
  - /admin
  - /admin/users
  - /admin/events
  - /admin/events/{id}/registrations
  - /admin/gallery
  - /admin/contact
  - /admin/join-club
  - /admin/settings
- For each route, confirm:
  - No horizontal page-level overflow.
  - Header text and actions remain readable and tappable.
  - Sidebar open/close works and does not trap content.
  - Data tables support filtering, export/column controls, and pagination without clipped controls.
  - Dialogs are scrollable and internal grids stack correctly.

Rollout checks
- Verify no behavior regressions in desktop layout at 1280+.
- Validate dark mode visual integrity for updated responsive classes.
- If possible, collect before/after screenshots of gallery, users table, and join-club dialog.

6. Risks and Mitigations
- Risk: Responsive changes in shared DataTable can unintentionally alter multiple admin flows.
- Mitigation: Gate new behavior with optional props and test users + registrations flows first.

- Risk: Sidebar z-index interactions may conflict with dialogs/toasts on mobile.
- Mitigation: Validate overlay layering and test open dialog while sidebar is open.

- Risk: Gallery manager refactor could regress folder-selection workflow.
- Mitigation: Keep existing selection logic intact and only isolate layout/control wrappers.

- Risk: Inconsistent one-off classes across pages can increase maintenance burden.
- Mitigation: Apply a common header/padding pattern and reuse it across admin pages.

- Risk: Build/runtime verification may be limited by environment command issues.
- Mitigation: Prioritize static checks and device/manual QA from browser once implementation lands.

7. Open Questions
- Should mobile tables remain horizontal-scroll first, or do you want card-style row rendering for users/contact/join-club at small widths?
- Is the target mobile behavior for gallery folders a slide-in drawer or an inline collapsible section above images?
- Do you want a single shared admin page-header component introduced now, or keep page-local responsive classes for lower implementation risk?
- Which screens should be treated as highest-priority for screenshots and approval: gallery, users, join-club, or contact?
