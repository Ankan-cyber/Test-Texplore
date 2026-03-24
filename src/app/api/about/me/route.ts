import { NextRequest, NextResponse } from 'next/server';
import {
  requireAnyUserPermission,
  requireAuthenticatedUser,
} from '@/lib/api-guards';
import { aboutCreateUpdateSchema } from '@/lib/api-schemas';
import { AboutMembersService } from '@/lib/services/about-members-service';

export async function GET() {
  try {
    const authResult = await requireAuthenticatedUser();
    if ('response' in authResult) {
      return authResult.response;
    }

    const permissionResponse = requireAnyUserPermission(authResult.user, [
      'about:self:update',
      'about:manage',
    ]);
    if (permissionResponse) {
      return permissionResponse;
    }

    const member = await AboutMembersService.getMemberByUserId(authResult.user.id);
    if (!member) {
      return NextResponse.json(
        { error: 'No about profile found for this user' },
        { status: 404 },
      );
    }

    const socialLinks =
      member.socialLinks && typeof member.socialLinks === 'object'
        ? (member.socialLinks as Record<string, string>)
        : {};

    return NextResponse.json({
      ...member,
      category: member.department || 'OTHER',
      imageCloudinaryUrl: member.galleryImage?.fileUrl || member.imageUrl,
      imageThumbnailUrl: member.galleryImage?.thumbnailUrl || null,
      galleryImageId: member.galleryImageId || member.galleryImage?.id || null,
      linkedinUrl: socialLinks.linkedin || null,
      githubUrl: socialLinks.github || null,
      portfolioUrl: socialLinks.portfolio || null,
    });
  } catch (error) {
    console.error('Error fetching user about profile:', error);
    return NextResponse.json(
      { error: 'Failed to fetch about profile' },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const authResult = await requireAuthenticatedUser();
    if ('response' in authResult) {
      return authResult.response;
    }

    const permissionResponse = requireAnyUserPermission(authResult.user, [
      'about:self:update',
      'about:manage',
    ]);
    if (permissionResponse) {
      return permissionResponse;
    }

    const existing = await AboutMembersService.getMemberByUserId(authResult.user.id);
    if (!existing) {
      return NextResponse.json(
        { error: 'No about profile found for this user' },
        { status: 404 },
      );
    }

    const body = (await request.json()) as Record<string, unknown>;

    const existingSocialLinks =
      existing.socialLinks && typeof existing.socialLinks === 'object'
        ? (existing.socialLinks as Record<string, string>)
        : {};

    const mergedSocialLinks = {
      ...existingSocialLinks,
      ...(typeof body.linkedinUrl === 'string' && body.linkedinUrl.trim()
        ? { linkedin: body.linkedinUrl }
        : {}),
      ...(typeof body.githubUrl === 'string' && body.githubUrl.trim()
        ? { github: body.githubUrl }
        : {}),
      ...(typeof body.portfolioUrl === 'string' && body.portfolioUrl.trim()
        ? { portfolio: body.portfolioUrl }
        : {}),
    };

    const payload = aboutCreateUpdateSchema.partial().parse({
      displayName:
        typeof body.displayName === 'string' ? body.displayName : undefined,
      role: typeof body.role === 'string' ? body.role : undefined,
      bio: typeof body.bio === 'string' ? body.bio : undefined,
      imageCloudinaryId:
        typeof body.imageCloudinaryId === 'string'
          ? body.imageCloudinaryId
          : undefined,
      galleryImageId:
        typeof body.galleryImageId === 'string' ? body.galleryImageId : undefined,
      imageUrl:
        typeof body.imageCloudinaryUrl === 'string'
          ? body.imageCloudinaryUrl
          : typeof body.imageUrl === 'string'
            ? body.imageUrl
            : undefined,
      socialLinks: mergedSocialLinks,
    });

    const updated = await AboutMembersService.updateMember(existing.id, payload);

    const socialLinks =
      updated.socialLinks && typeof updated.socialLinks === 'object'
        ? (updated.socialLinks as Record<string, string>)
        : {};

    return NextResponse.json({
      ...updated,
      category: updated.department || 'OTHER',
      imageCloudinaryUrl: updated.galleryImage?.fileUrl || updated.imageUrl,
      imageThumbnailUrl: updated.galleryImage?.thumbnailUrl || null,
      galleryImageId: updated.galleryImageId || updated.galleryImage?.id || null,
      linkedinUrl: socialLinks.linkedin || null,
      githubUrl: socialLinks.github || null,
      portfolioUrl: socialLinks.portfolio || null,
    });
  } catch (error) {
    console.error('Error updating user about profile:', error);
    return NextResponse.json(
      { error: 'Failed to update about profile' },
      { status: 500 },
    );
  }
}
