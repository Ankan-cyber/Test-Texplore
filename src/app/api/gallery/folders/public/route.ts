import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// GET /api/gallery/folders/public - Get all public folders
export async function GET(request: NextRequest) {
  try {
    // Get all public folders with their image counts
    const folders = await prisma.galleryFolder.findMany({
      where: {
        isPublic: true,
        isArchived: false,
      },
      include: {
        _count: {
          select: {
            images: {
              where: {
                isApproved: true,
              },
            },
          },
        },
        images: {
          where: { isApproved: true },
          orderBy: { createdAt: 'desc' },
          take: 4,
          select: {
            id: true,
            fileUrl: true,
            originalName: true,
            title: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    console.log('Public folders from database:', folders); // Debug log

    return NextResponse.json({
      success: true,
      folders,
    });
  } catch (error) {
    console.error('Error fetching public folders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch public folders' },
      { status: 500 },
    );
  }
}
