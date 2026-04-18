import { NextRequest, NextResponse } from 'next/server';
import {
  requireAuthenticatedUser,
  requireUserPermission,
} from '@/lib/api-guards';
import { aboutCreateUpdateSchema } from '@/lib/api-schemas';
import { AboutMembersService } from '@/lib/services/about-members-service';
import { z } from 'zod';

const aboutPatchRequestSchema = z.object({
  displayName: z.string().trim().optional(),
  role: z.string().trim().optional(),
  bio: z.string().trim().optional(),
  resumeUrl: z.string().url().optional().or(z.literal('')),
  category: z.enum(['LEADERSHIP', 'DEPARTMENT', 'OTHER']).optional(),
  linkedinUrl: z.string().url().optional().or(z.literal('')),
  githubUrl: z.string().url().optional().or(z.literal('')),
  portfolioUrl: z.string().url().optional().or(z.literal('')),
  galleryImageId: z.string().optional(),
  imageCloudinaryId: z.string().optional(),
  imageCloudinaryUrl: z.string().url().optional().or(z.literal('')),
  sortOrder: z.number().int().min(0).optional(),
  isPublished: z.boolean().optional(),
});

function mapMemberForUi(member: any) {
  const socialLinks =
    member.socialLinks && typeof member.socialLinks === 'object'
      ? (member.socialLinks as Record<string, string>)
      : {};

  return {
    ...member,
    category: member.department || 'OTHER',
    imageCloudinaryUrl: member.galleryImage?.fileUrl || member.imageUrl,
    imageThumbnailUrl: member.galleryImage?.thumbnailUrl || null,
    galleryImageId: member.galleryImageId || member.galleryImage?.id || null,
    linkedinUrl: socialLinks.linkedin || null,
    githubUrl: socialLinks.github || null,
    portfolioUrl: socialLinks.portfolio || null,
  };
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const member = await AboutMembersService.getMemberById(id);

    if (!member || !member.isPublished) {
      return NextResponse.json({ error: 'About member not found' }, { status: 404 });
    }

    const socialLinks =
      member.socialLinks && typeof member.socialLinks === 'object'
        ? (member.socialLinks as Record<string, string>)
        : {};

    return NextResponse.json(mapMemberForUi(member));
  } catch (error) {
    console.error('Error fetching about member:', error);
    return NextResponse.json(
      { error: 'Failed to fetch about member' },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const authResult = await requireAuthenticatedUser();
    if ('response' in authResult) {
      return authResult.response;
    }

    const permissionResponse = requireUserPermission(
      authResult.user,
      'about:manage',
    );
    if (permissionResponse) {
      return permissionResponse;
    }

    const { id } = await params;
    const raw = await request.json();
    const parsed = aboutPatchRequestSchema.parse(raw);

    const existing = await AboutMembersService.getMemberById(id);
    if (!existing) {
      return NextResponse.json({ error: 'About member not found' }, { status: 404 });
    }

    const existingSocialLinks =
      existing.socialLinks && typeof existing.socialLinks === 'object'
        ? (existing.socialLinks as Record<string, string>)
        : {};

    const payload = aboutCreateUpdateSchema.partial().parse({
      displayName: parsed.displayName,
      role: parsed.role,
      department: parsed.category,
      bio: parsed.bio,
      resumeUrl: parsed.resumeUrl === '' ? null : parsed.resumeUrl,
      galleryImageId: parsed.galleryImageId,
      imageCloudinaryId: parsed.imageCloudinaryId,
      imageUrl: parsed.imageCloudinaryUrl,
      sortOrder: parsed.sortOrder,
      isPublished: parsed.isPublished,
      socialLinks: {
        ...existingSocialLinks,
        ...(parsed.linkedinUrl !== undefined ? { linkedin: parsed.linkedinUrl } : {}),
        ...(parsed.githubUrl !== undefined ? { github: parsed.githubUrl } : {}),
        ...(parsed.portfolioUrl !== undefined
          ? { portfolio: parsed.portfolioUrl }
          : {}),
      },
    });

    const updated = await AboutMembersService.updateMember(id, payload);
    return NextResponse.json(mapMemberForUi(updated));
  } catch (error: unknown) {
    console.error('Error updating about member:', error);
    return NextResponse.json(
      { error: 'Failed to update about member' },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const authResult = await requireAuthenticatedUser();
    if ('response' in authResult) {
      return authResult.response;
    }

    const permissionResponse = requireUserPermission(
      authResult.user,
      'about:manage',
    );
    if (permissionResponse) {
      return permissionResponse;
    }

    const { id } = await params;
    await AboutMembersService.deleteMember(id);

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Error deleting about member:', error);
    return NextResponse.json(
      { error: 'Failed to delete about member' },
      { status: 500 },
    );
  }
}
