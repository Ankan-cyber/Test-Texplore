import { NextRequest, NextResponse } from 'next/server';
import { requireAuthenticatedUser, requireUserPermission } from '@/lib/api-guards';
import { prisma } from '@/lib/db';

interface FolderNode {
  id: string;
  name: string;
  slug: string;
  description?: string;
  isPublic: boolean;
  isArchived: boolean;
  createdAt: string;
  creator: {
    id: string;
    name: string;
  };
  _count: {
    children: number;
    images: number;
  };
  children?: FolderNode[];
  path: string[];
}

// Recursive function to build folder tree
function buildFolderTree(
  folders: any[],
  parentId: string | null = null,
  path: string[] = [],
): FolderNode[] {
  return folders
    .filter((folder) => folder.parentId === parentId)
    .map((folder) => ({
      id: folder.id,
      name: folder.name,
      slug: folder.slug,
      description: folder.description,
      isPublic: folder.isPublic,
      isArchived: folder.isArchived,
      createdAt: folder.createdAt,
      creator: folder.creator,
      _count: folder._count,
      path: [...path, folder.name],
      children: buildFolderTree(folders, folder.id, [...path, folder.name]),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

// GET /api/gallery/folders/tree - Get complete folder hierarchy
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
    const includeArchived = searchParams.get('includeArchived') === 'true';

    // Build where clause
    const where: any = {};
    if (!includeArchived) {
      where.isArchived = false;
    }

    // Get all folders first; avoid including required creator relation directly
    // because legacy/orphaned records may reference deleted users.
    const folders = await prisma.galleryFolder.findMany({
      where,
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        isPublic: true,
        isArchived: true,
        createdAt: true,
        parentId: true,
        createdBy: true,
        _count: {
          select: {
            children: true,
            images: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    const creatorIds = Array.from(
      new Set(folders.map((folder) => folder.createdBy).filter(Boolean)),
    );

    const creators = await prisma.user.findMany({
      where: { id: { in: creatorIds } },
      select: { id: true, name: true },
    });

    const creatorMap = new Map(creators.map((user) => [user.id, user.name]));

    const foldersWithCreator = folders.map((folder) => ({
      ...folder,
      creator: {
        id: folder.createdBy,
        name: creatorMap.get(folder.createdBy) || 'Unknown User',
      },
    }));

    // Build hierarchical tree
    const folderTree = buildFolderTree(foldersWithCreator);

    // Calculate total counts
    const totalFolders = foldersWithCreator.length;
    const totalImages = foldersWithCreator.reduce(
      (sum, folder) => sum + folder._count.images,
      0,
    );

    return NextResponse.json({
      success: true,
      folders: folderTree,
      stats: {
        totalFolders,
        totalImages,
      },
    });
  } catch (error) {
    console.error('Error fetching folder tree:', error);
    return NextResponse.json(
      { error: 'Failed to fetch folder tree' },
      { status: 500 },
    );
  }
}
