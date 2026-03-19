import { NextRequest, NextResponse } from 'next/server';
import { requireAuthenticatedUser, requireUserPermission } from '@/lib/api-guards';
import { prisma } from '@/lib/db';
import { z } from 'zod';

// Validation schemas
const createFolderSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  parentId: z.string().nullable().optional(),
  isPublic: z.boolean().default(false),
});

const updateFolderSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
  isPublic: z.boolean().optional(),
  isArchived: z.boolean().optional(),
});

// GET /api/gallery/folders - Get all folders
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuthenticatedUser();
    if ('response' in authResult) {
      return authResult.response;
    }

    const permissionResponse = requireUserPermission(
      authResult.user,
      'gallery:read',
    );
    if (permissionResponse) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const parentId = searchParams.get('parentId');
    const includeArchived = searchParams.get('includeArchived') === 'true';

    // Build where clause
    const where: any = {};

    if (parentId) {
      where.parentId = parentId;
    } else if (!includeArchived) {
      where.isArchived = false;
    }

    // Get folders with creator information
    const folders = await prisma.galleryFolder.findMany({
      where,
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            children: true,
            images: true,
          },
        },
      },
      orderBy: [{ name: 'asc' }, { createdAt: 'desc' }],
    });

    return NextResponse.json({
      success: true,
      data: folders,
    });
  } catch (error) {
    console.error('Error fetching folders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch folders' },
      { status: 500 },
    );
  }
}

// POST /api/gallery/folders - Create new folder
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuthenticatedUser();
    if ('response' in authResult) {
      return authResult.response;
    }

    const permissionResponse = requireUserPermission(
      authResult.user,
      'gallery:upload',
    );
    if (permissionResponse) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = createFolderSchema.parse(body);

    // Check if parent folder exists and user has access
    if (validatedData.parentId) {
      const parentFolder = await prisma.galleryFolder.findUnique({
        where: { id: validatedData.parentId },
      });

      if (!parentFolder) {
        return NextResponse.json(
          { error: 'Parent folder not found' },
          { status: 404 },
        );
      }
    }

    // Generate slug from name
    const slug = validatedData.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    // Check if slug already exists
    const existingFolder = await prisma.galleryFolder.findUnique({
      where: { slug },
    });

    if (existingFolder) {
      return NextResponse.json(
        { error: 'A folder with this name already exists' },
        { status: 409 },
      );
    }

    // Create folder
    const folder = await prisma.galleryFolder.create({
      data: {
        name: validatedData.name,
        description: validatedData.description,
        slug,
        parentId: validatedData.parentId,
        createdBy: authResult.user.id,
        isPublic: validatedData.isPublic,
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            children: true,
            images: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: folder,
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.issues },
        { status: 400 },
      );
    }

    console.error('Error creating folder:', error);
    return NextResponse.json(
      { error: 'Failed to create folder' },
      { status: 500 },
    );
  }
}
