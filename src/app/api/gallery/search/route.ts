import { NextRequest, NextResponse } from 'next/server';
import { requireAuthenticatedUser, requireUserPermission } from '@/lib/api-guards';
import { prisma } from '@/lib/db';

// GET /api/gallery/search - Global search across folders and images
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

    // Search parameters
    const query = searchParams.get('q') || '';
    const type = searchParams.get('type'); // 'folders', 'images', or 'all'
    const folderId = searchParams.get('folderId');
    const eventId = searchParams.get('eventId');
    const tags = searchParams.get('tags')?.split(',').filter(Boolean);
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');

    // Pagination
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    if (!query.trim()) {
      return NextResponse.json({
        success: true,
        data: {
          folders: [],
          images: [],
          pagination: {
            page,
            limit,
            total: 0,
            pages: 0,
          },
        },
      });
    }

    // Build search conditions
    const searchConditions = {
      OR: [
        { name: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
      ],
    };

    const imageSearchConditions = {
      OR: [
        { title: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
        { originalName: { contains: query, mode: 'insensitive' } },
        { tags: { hasSome: [query] } },
      ],
    };

    // Additional filters
    const folderFilters: any = {};
    const imageFilters: any = {};

    if (folderId) {
      folderFilters.parentId = folderId;
      imageFilters.folderId = folderId;
    }

    if (eventId) {
      imageFilters.eventId = eventId;
    }

    if (tags && tags.length > 0) {
      imageFilters.tags = {
        hasSome: tags,
      };
    }

    if (dateFrom || dateTo) {
      const dateFilter: any = {};
      if (dateFrom) dateFilter.gte = new Date(dateFrom);
      if (dateTo) dateFilter.lte = new Date(dateTo);

      folderFilters.createdAt = dateFilter;
      imageFilters.createdAt = dateFilter;
    }

    // Search folders
    let folders: any[] = [];
    let folderCount = 0;

    if (type !== 'images') {
      const folderResults = await Promise.all([
        prisma.galleryFolder.findMany({
          where: {
            ...searchConditions,
            ...folderFilters,
            isArchived: false,
          },
          include: {
            creator: {
              select: {
                id: true,
                name: true,
              },
            },
            _count: {
              select: {
                children: true,
                images: true,
              },
            },
          },
          orderBy: { name: 'asc' },
          skip: type === 'folders' ? skip : 0,
          take: type === 'folders' ? limit : 10,
        }),
        prisma.galleryFolder.count({
          where: {
            ...searchConditions,
            ...folderFilters,
            isArchived: false,
          },
        }),
      ]);

      folders = folderResults[0];
      folderCount = folderResults[1];
    }

    // Search images
    let images: any[] = [];
    let imageCount = 0;

    if (type !== 'folders') {
      const imageResults = await Promise.all([
        prisma.galleryImage.findMany({
          where: {
            ...imageSearchConditions,
            ...imageFilters,
          },
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
          orderBy: { createdAt: 'desc' },
          skip: type === 'images' ? skip : 0,
          take: type === 'images' ? limit : 10,
        }),
        prisma.galleryImage.count({
          where: {
            ...imageSearchConditions,
            ...imageFilters,
          },
        }),
      ]);

      images = imageResults[0];
      imageCount = imageResults[1];
    }

    // Calculate pagination
    const total = folderCount + imageCount;
    const pages = Math.ceil(total / limit);

    return NextResponse.json({
      success: true,
      data: {
        folders,
        images,
        pagination: {
          page,
          limit,
          total,
          pages,
          folderCount,
          imageCount,
        },
        query,
        filters: {
          type,
          folderId,
          eventId,
          tags,
          dateFrom,
          dateTo,
        },
      },
    });
  } catch (error) {
    console.error('Error searching gallery:', error);
    return NextResponse.json(
      { error: 'Failed to search gallery' },
      { status: 500 },
    );
  }
}
