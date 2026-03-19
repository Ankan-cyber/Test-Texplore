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

    // Get all folders with creator information
    const folders = await prisma.galleryFolder.findMany({
      where,
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
    });

    // Build hierarchical tree
    const folderTree = buildFolderTree(folders);

    // Calculate total counts
    const totalFolders = folders.length;
    const totalImages = folders.reduce(
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
