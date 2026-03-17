import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// GET /api/gallery/images/public - Get public gallery images with filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Pagination
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    // Filtering
    const folderId = searchParams.get('folderId');
    const eventId = searchParams.get('eventId');
    const search = searchParams.get('search');
    const tags = searchParams.get('tags')?.split(',').filter(Boolean);

    // Sorting
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // Build where clause - only get public images
    const where: any = {
      // No authentication requirements
    };

    if (folderId) {
      where.folderId = folderId;
    }

    if (eventId) {
      where.eventId = eventId;
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
    console.error('Error fetching public images:', error);
    return NextResponse.json(
      { error: 'Failed to fetch images' },
      { status: 500 },
    );
  }
}
