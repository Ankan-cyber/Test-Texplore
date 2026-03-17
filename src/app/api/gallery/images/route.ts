import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { canReadGallery, canUploadPhotos } from '@/lib/permissions';
import { prisma } from '@/lib/db';
import { z } from 'zod';

const createImageSchema = z.object({
  originalName: z.string().min(1),
  fileName: z.string().min(1),
  fileUrl: z.string().url(),
  thumbnailUrl: z.string().url().optional(),
  fileSize: z.number().positive(),
  mimeType: z.string().min(1),
  cloudinaryId: z.string().min(1),
  cloudinaryData: z.any().optional(),
  title: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  tags: z.array(z.string()).optional(),
  altText: z.string().optional(),
  folderId: z.string().optional(),
  eventId: z.string().optional(),
});

const updateImageSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  tags: z.array(z.string()).optional(),
  altText: z.string().optional(),
  folderId: z.string().optional(),
  eventId: z.string().optional(),
});

// GET /api/gallery/images - Get images with filtering and search
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 },
      );
    }

    if (!canReadGallery(user.permissions)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);

    // Pagination
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    // Filtering
    const folderId = searchParams.get('folderId');
    const eventId = searchParams.get('eventId');
    const uploaderId = searchParams.get('uploaderId');
    const status = searchParams.get('status'); // Frontend sends 'all', 'approved', 'pending'
    const isApproved = searchParams.get('isApproved'); // Direct boolean parameter
    const search = searchParams.get('search');
    const tags = searchParams.get('tags')?.split(',').filter(Boolean);

    // Sorting
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // Build where clause
    const where: any = {};

    if (folderId) {
      where.folderId = folderId;
    }

    if (eventId) {
      where.eventId = eventId;
    }

    if (uploaderId) {
      where.uploadedBy = uploaderId;
    }

    // Handle status filter (frontend sends 'all', 'approved', 'pending')
    if (status && status !== 'all') {
      if (status === 'approved') {
        where.isApproved = true;
      } else if (status === 'pending') {
        where.isApproved = false;
      }
    } else if (isApproved !== null) {
      // Handle direct isApproved parameter
      where.isApproved = isApproved === 'true';
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { originalName: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (tags && tags.length > 0) {
      where.tags = {
        hasSome: tags,
      };
    }

    // Get images with related data
    const [images, total] = await Promise.all([
      prisma.galleryImage.findMany({
        where,
        include: {
          uploader: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          folder: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          event: {
            select: {
              id: true,
              title: true,
            },
          },
        },
        orderBy: {
          [sortBy]: sortOrder,
        },
        skip,
        take: limit,
      }),
      prisma.galleryImage.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      images,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching images:', error);
    return NextResponse.json(
      { error: 'Failed to fetch images' },
      { status: 500 },
    );
  }
}

// POST /api/gallery/images - Create image record (for manual entry)
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 },
      );
    }

    if (!canUploadPhotos(user.permissions)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = createImageSchema.parse(body);

    // Validate folder if provided
    if (validatedData.folderId) {
      const folder = await prisma.galleryFolder.findUnique({
        where: { id: validatedData.folderId },
      });

      if (!folder) {
        return NextResponse.json(
          { error: 'Folder not found' },
          { status: 404 },
        );
      }
    }

    // Validate event if provided
    if (validatedData.eventId) {
      const event = await prisma.event.findUnique({
        where: { id: validatedData.eventId },
      });

      if (!event) {
        return NextResponse.json({ error: 'Event not found' }, { status: 404 });
      }
    }

    // Create image record
    const image = await prisma.galleryImage.create({
      data: {
        ...validatedData,
        uploadedBy: user.id,
      },
      include: {
        uploader: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        folder: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        event: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: image,
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

    console.error('Error creating image:', error);
    return NextResponse.json(
      { error: 'Failed to create image' },
      { status: 500 },
    );
  }
}
