# About System - Implementation & Testing Guide

## Overview

This document outlines the About page management system implementation and testing procedures.

## Architecture

### Data Model
- **AboutMember**: Stored About member profiles (1:1 with User when linked)
- **GalleryImage**: Source of truth for uploaded/migrated images mapped to About profiles

### APIs
- **GET /api/about** - List published members (public)
- **GET /api/about?admin=true** - List all members (admin only)
- **POST /api/about** - Create member (admin only)
- **PATCH /api/about/:id** - Update member (admin only)
- **DELETE /api/about/:id** - Delete member (admin only)
- **GET /api/about/me** - Get current user's profile (member only)
- **PATCH /api/about/me** - Update own profile (member only)
- **POST /api/about/resume/upload** - Upload member resume PDF (about:self:update/about:manage)
- **POST /api/about/reorder** - Reorder members (admin only)

### Frontend Routes
- **Admin**: `/admin/about` - Member management
- **Member**: `/admin/about/my-profile` - Self-edit profile
- **Public**: `/about` - Public About page

## Testing Checklist

### Phase 1: Data Setup
- [ ] Run Prisma migrations: `npx prisma db push`
- [ ] Verify AboutMember and GalleryImage models are available
- [ ] Check permissions added to schema

### Phase 2: Image Migration (Optional)
- [ ] Set Cloudinary env vars in `.env.local`:
  ```
  NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud
  CLOUDINARY_API_KEY=your_key
  CLOUDINARY_API_SECRET=your_secret
  ```
- [ ] Run migration script: `npx tsx scripts/migrate-public-images-to-cloudinary.ts`
- [ ] Verify images uploaded to Cloudinary in `texplore/about/` folder
- [ ] Verify migrated images appear in `/admin/gallery`

### Phase 3: Backfill Data (Optional)
- [ ] Run backfill script: `npx tsx scripts/backfill-about-members.ts`
- [ ] Verify AboutMembers created with hardcoded data
- [ ] Check sort_order set correctly

### Phase 4: Admin Interface Testing

#### Add Member
1. Navigate to `/admin/about`
2. Verify permission check (only admin/president can access)
3. Click "+" button or use Add Member dialog
4. Fill form:
   - Name: "Test Person"
   - Role: "Department Head"
   - Bio: "Test bio"
   - Category: "DEPARTMENT"
   - Toggle publish on/off
5. Submit form
6. Verify member appears in list
7. Check status: published/unpublished badge

#### Edit Member
1. Click pencil icon on a member card
2. Edit one field (e.g., bio)
3. Submit
4. Verify changes appear immediately

#### Delete Member
1. Click trash icon on a member card
2. Confirm deletion
3. Verify member removed from list

#### Toggle Visibility
1. Click eye/eye-off icon
2. Verify published status toggles
3. Check public page reflects change (after refresh)

#### Reorder Members (Advanced)
1. Drag members by grip icon (if drag-drop implemented)
2. Or use API directly: `POST /api/about/reorder` with sort_order array
3. Verify sort_order persisted in database

### Phase 5: Member Self-Edit Testing

#### Create User Link
1. As admin, create AboutMember via admin page
2. Via API or UI, link to a user: `POST /api/about/:id/link-user`
3. Member should see "My About Profile" in navigation

#### Edit Own Profile
1. Login as linked member
2. Navigate to `/admin/about/my-profile`
3. Update fields:
   - Bio
   - LinkedIn/GitHub/Portfolio URLs
   - Upload resume PDF (Cloudinary raw upload)
   - Upload new profile image (Cloudinary)
4. Submit
5. Changes publish immediately (no admin approval)
6. Public page reflects changes

#### Image Upload
1. Click upload area
2. Select JPEG/PNG under 5MB
3. Verify image uploads to Cloudinary
4. Image URL appears in form
5. Save and verify on public page

#### Resume Upload
1. Open `/admin/about/my-profile`
2. Upload a PDF under 5MB
3. Verify upload succeeds and preview link is shown
4. Save profile
5. Open member public profile page and verify resume icon/link appears
6. Negative checks:
   - Upload non-PDF and verify rejection
   - Upload PDF larger than 5MB and verify rejection

### Phase 6: Public About Page

#### Static Fallback
1. Disable API response in browser DevTools Network tab
2. Load `/about`
3. Verify fallback static data loads
4. No error messages shown

#### API Data
1. Create 3-5 AboutMembers via admin page
2. Load `/about`
3. Verify members display in correct categories (Leadership, Department)
4. Check responsive layout on mobile/tablet/desktop

#### Click Modal
1. Click on a member card
2. Verify modal opens with:
   - Profile image
   - Full name
   - Role
   - Bio
   - Social links (if provided)
3. Click outside modal to close
4. Verify responsive on small screens

#### Social Links
1. Create member with LinkedIn URL
2. Modal should show LinkedIn icon
3. Click icon → opens in new tab
4. Same for GitHub and Portfolio

### Phase 7: Permissions Testing

#### Admin Access
1. Admin user can access `/admin/about` ✓
2. Admin can CRUD members ✓
3. Verify `about:manage` permission in sidebar

#### Member Access
1. Regular member:
   - Cannot access `/admin/about`
   - Can access `/admin/about/my-profile` if linked
   - Cannot view other members' profiles

#### Public Access
1. Visitors cannot access admin panel
2. Can view public `/about` page
3. Can click members and see modal

### Phase 8: Error Handling

#### API Errors
1. Test with backend offline
2. Verify graceful fallback to static data
3. No blank page or unhandled errors

#### Invalid Data
1. Try creating member without name
2. Verify validation error shown
3. Try invalid URL in social links
4. Verify format validation

#### Permission Denied
1. Regular user tries to access `/admin/about`
2. Should see permission denied message or redirect
3. Check logs for audit trail

### Phase 9: Database Consistency

#### Relationships
1. Link member to user: `aboutMember.userId` set
2. Delete user: aboutMember orphaned (nullable userId)
3. Unlink: userId set to null

#### One-to-One
1. User can have 0 or 1 AboutMember
2. AboutMember can link to 0 or 1 User
3. Test unlinking and relinking

#### Sort Order
1. Verify sort_order is unique or allows duplicates (clarify requirement)
2. Reordering doesn't break sort

### Phase 10: Performance

#### Load Time
- `/about` should load < 2s with 20+ members
- Admin page should load < 3s

#### Image Delivery
- Cloudinary URLs optimize automatically
- Check responsive image sizes on slow 3G (DevTools)

#### Database Indexing
- sort_order, category, userId should be indexed
- Verify indexes in schema: `@@index([category, sortOrder])`

## Rollout Plan

### Stage 1: Development
- [ ] All tests passing locally
- [ ] Feature flag `ABOUT_SYSTEM_ENABLED=true` in .env
- [ ] Zero TypeScript/lint errors: `npm run ci`

### Stage 2: Staging
- [ ] Deploy to staging environment
- [ ] Run full test suite against real Cloudinary
- [ ] Admin team tests all CRUD operations
- [ ] Load testing with 100+ members

### Stage 3: Production
- [ ] Feature flag disabled initially: `ABOUT_SYSTEM_ENABLED=false`
- [ ] Backfill production data
- [ ] Verify migrations applied
- [ ] Soft launch to admins only
- [ ] Enable flag: `ABOUT_SYSTEM_ENABLED=true`
- [ ] Monitor error logs for 24h
- [ ] Announce to members

### Stage 4: Monitoring
- [ ] Set up alerts for API errors
- [ ] Monitor Cloudinary rate limits
- [ ] Track member profile updates
- [ ] Gather feedback

## Debugging Checklist

### If images don't display:
1. Check Cloudinary credentials in ENV
2. Verify images exist in Cloudinary folder
3. Test direct Cloudinary URL in browser
4. Check Next.js image config permits Cloudinary domain

### If members don't save:
1. Check Prisma connection
2. Verify permissions in DB: `user.permissions` includes `about:manage`
3. Check API error response: browser Network tab
4. Verify MongoDB _id fields aren't missing

### If API 404:
1. Verify route files exist: `/api/about/route.ts`, `[id]/route.ts`, etc.
2. Check permissions middleware on routes
3. Test with curl: `curl http://localhost:3000/api/about`

### If modal doesn't open:
1. Check Dialog component imported from shadcn/ui
2. Verify selectedMember state updates on click
3. Check browser console for JS errors

## Rollback Plan

If critical issues arise:

1. **Disable feature temporarily**: Set `ABOUT_SYSTEM_ENABLED=false`
2. **Revert About.tsx to hardcoded data**: Restore from git
3. **Keep data safe**: AboutMember table remains, can re-enable later
4. **Notify users**: Brief message on `/about` page

## Success Criteria

✅ All above tests passing  
✅ No regressions in other admin features  
✅ < 100ms API response for member list  
✅ Mobile responsive on iOS Safari 14+  
✅ Accessibility: keyboard nav, screen readers  
✅ Zero console errors in production build  

## Questions for Clarification

1. **Approval workflow**: Do member edits auto-publish or require approval?
   → **Answer**: Auto-publish immediately

2. **Image permissions**: Can non-linked members view profiles?
   → **Answer**: Yes, public modal visible to all

3. **Deletion safety**: When delete AboutMember, should linked GalleryImage be detached or remain reusable?
   → **Answer**: Keep GalleryImage reusable and only update AboutMember linkage

4. **Sort order**: How handle ties? Use createdAt as tiebreaker?
   → **Answer**: Use numeric sort_order only, admins control order

## Support Runbook

### Member can't see profile edit page:
- Check if they have `about:self:update` permission
- Check if AboutMember linked to their User ID
- Verify `/admin/about/my-profile` route accessible

### Images won't upload:
- Check Cloudinary credentials
- Verify file < 5MB
- Check browser CORS issues (DevTools Network tab)
- Try uploading from different browser

### Contact admin for:
- Linking user to AboutMember (1:1 relationship)
- Fixing sort_order if corrupted
- Restoring deleted member from backup

---

**Last Updated**: 2026-03-23  
**Implemented By**: GitHub Copilot  
**Status**: Ready for Testing
