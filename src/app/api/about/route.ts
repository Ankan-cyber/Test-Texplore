import { NextRequest, NextResponse } from 'next/server';
import {
  requireAuthenticatedUser,
  requireUserPermission,
} from '@/lib/api-guards';
import { aboutCreateUpdateSchema, aboutListQuerySchema } from '@/lib/api-schemas';
import { AboutMembersService } from '@/lib/services/about-members-service';
import { prisma } from '@/lib/db';
import { hashPassword } from '@/lib/auth';
import { z } from 'zod';

const aboutCreateRequestSchema = z.object({
  userId: z.string().optional(),
  email: z.string().email().optional(),
  password: z.string().min(8).optional(),
  displayName: z.string().trim().min(1),
  role: z.string().trim().min(1),
  bio: z.string().trim().optional(),
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

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = aboutListQuerySchema.parse(
      Object.fromEntries(searchParams.entries()),
    );

    const isAdminRequest = searchParams.get('admin') === 'true';

    if (isAdminRequest) {
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
    }

    const result = await AboutMembersService.listMembers({
      isPublished: isAdminRequest ? query.isPublished : true,
      department: query.department,
      page: query.page,
      limit: query.limit,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
    });

    const members = result.data.map((member) => mapMemberForUi(member));

    return NextResponse.json(members);
  } catch (error) {
    console.error('Error fetching about members:', error);
    return NextResponse.json(
      { error: 'Failed to fetch about members' },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const parsed = aboutCreateRequestSchema.parse(body);

    let userId =
      typeof parsed.userId === 'string' && parsed.userId.trim().length > 0
        ? parsed.userId
        : '';

    // If userId is not provided, create a dedicated About-only user.
    if (!userId) {
      if (!parsed.email || !parsed.password) {
        return NextResponse.json(
          {
            error:
              'Email and password are required when creating a new About user',
          },
          { status: 400 },
        );
      }

      const existingUser = await prisma.user.findUnique({
        where: { email: parsed.email },
      });

      if (existingUser) {
        return NextResponse.json(
          { error: 'User with this email already exists' },
          { status: 409 },
        );
      }

      const hashedPassword = await hashPassword(parsed.password);
      const createdUser = await prisma.user.create({
        data: {
          email: parsed.email,
          name: parsed.displayName,
          password: hashedPassword,
          status: 'APPROVED',
          role: 'member',
          permissions: [
            'about:read',
            'about:self:update',
            'gallery:upload',
          ],
          isAboutProfileOnly: true,
        } as any,
      });

      userId = createdUser.id;
    }

    const existing = await AboutMembersService.getMemberByUserId(userId);
    if (existing) {
      return NextResponse.json(
        { error: 'User already has an about profile' },
        { status: 409 },
      );
    }

    const socialLinks: Record<string, string> = {};
    if (parsed.linkedinUrl) socialLinks.linkedin = parsed.linkedinUrl;
    if (parsed.githubUrl) socialLinks.github = parsed.githubUrl;
    if (parsed.portfolioUrl) socialLinks.portfolio = parsed.portfolioUrl;

    const payload = aboutCreateUpdateSchema.parse({
      displayName: parsed.displayName,
      role: parsed.role,
      department: parsed.category,
      bio: parsed.bio || null,
      galleryImageId: parsed.galleryImageId || null,
      imageCloudinaryId: parsed.imageCloudinaryId || null,
      imageUrl: parsed.imageCloudinaryUrl || null,
      sortOrder: parsed.sortOrder ?? 0,
      isPublished: parsed.isPublished ?? true,
      socialLinks,
    });

    const created = await AboutMembersService.createMember(userId, payload);

    return NextResponse.json(mapMemberForUi(created), { status: 201 });
  } catch (error: unknown) {
    console.error('Error creating about member:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { error: 'Failed to create about member' },
      { status: 500 },
    );
  }
}
