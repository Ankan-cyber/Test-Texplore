import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { canUploadPhotos } from '@/lib/permissions';
import { generateUploadSignature } from '@/lib/cloudinary';
import { prisma } from '@/lib/db';
import { createFolderPath } from '@/lib/cloudinary';

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
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 },
      );
    }

    const body = await request.json();
    const { folderId, fileName } = body;

    // Determine folder path
    let folderPath = 'texplore-gallery';
    if (folderId) {
      const folder = await prisma.galleryFolder.findUnique({
        where: { id: folderId },
      });

      if (!folder) {
        return NextResponse.json(
          { error: 'Folder not found' },
          { status: 404 },
        );
      }

      // Build folder path for Cloudinary
      const folderHierarchy = await getFolderHierarchy(folder.id);
      folderPath = createFolderPath(folderHierarchy.join('/'));
    }

    const signature = generateUploadSignature({
      folder: folderPath,
      public_id: fileName,
    });

    return NextResponse.json(signature);
  } catch (error) {
    console.error('Error generating upload signature:', error);
    return NextResponse.json(
      { error: 'Failed to generate upload signature' },
      { status: 500 },
    );
  }
}

// Helper function to get folder hierarchy
async function getFolderHierarchy(folderId: string): Promise<string[]> {
  const hierarchy: string[] = [];
  let currentFolderId = folderId;

  while (currentFolderId) {
    const folder = await prisma.galleryFolder.findUnique({
      where: { id: currentFolderId },
      select: { name: true, parentId: true },
    });

    if (!folder) break;

    hierarchy.unshift(folder.name);
    currentFolderId = folder.parentId || '';
  }

  return hierarchy;
}
