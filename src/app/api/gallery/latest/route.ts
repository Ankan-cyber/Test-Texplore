import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// GET /api/gallery/latest - Get latest approved images from public folders
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '12');
    const folderId = searchParams.get('folderId');

    // Build where clause
    const where: any = {
      isApproved: true,
      folder: {
        isPublic: true,
        isArchived: false,
      },
    };

    // If folderId is provided, filter by specific folder
    if (folderId) {
      where.folderId = folderId;
    }

    // Get latest approved images from public folders
    const images = await prisma.galleryImage.findMany({
      where,
      include: {
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
        createdAt: 'desc',
      },
      take: limit,
    });

    return NextResponse.json({
      success: true,
      images,
      count: images.length,
    });
  } catch (error) {
    console.error('Error fetching latest images:', error);
    return NextResponse.json(
      { error: 'Failed to fetch latest images' },
      { status: 500 },
    );
  }
}
