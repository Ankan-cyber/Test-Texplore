import { NextRequest, NextResponse } from 'next/server';
import { requireAuthenticatedUser, requireUserPermission } from '@/lib/api-guards';
import { buildRequestMeta, writeAuditLog } from '@/lib/audit-log';
import { prisma } from '@/lib/db';
import { z } from 'zod';

const updateFolderSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
  isPublic: z.boolean().optional(),
  isArchived: z.boolean().optional(),
});

// GET /api/gallery/folders/[id] - Get specific folder with contents (public access for student portal)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    
    // No authentication check - public access for viewing folders in student portal
    const { searchParams } = new URL(request.url);
    const includeImages = searchParams.get('includeImages') === 'true';
    const includeChildren = searchParams.get('includeChildren') === 'true';

    // Get folder with optional includes
    const folder = await prisma.galleryFolder.findUnique({
      where: { id },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        parent: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        _count: {
          select: {
            children: true,
            images: true,
          },
        },
        ...(includeImages && {
          images: {
            take: 20, // Limit to prevent large responses
            orderBy: { createdAt: 'desc' },
            include: {
              uploader: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        }),
        ...(includeChildren && {
          children: {
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
          },
        }),
      },
    });

    if (!folder) {
      return NextResponse.json({ error: 'Folder not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: folder,
    });
  } catch (error) {
    console.error('Error fetching folder:', error);
    return NextResponse.json(
      { error: 'Failed to fetch folder' },
      { status: 500 },
    );
  }
}

// PUT /api/gallery/folders/[id] - Update folder
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
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
    const validatedData = updateFolderSchema.parse(body);

    // Check if folder exists
    const existingFolder = await prisma.galleryFolder.findUnique({
      where: { id },
    });

    if (!existingFolder) {
      return NextResponse.json({ error: 'Folder not found' }, { status: 404 });
    }

    // Check if user is the creator or has admin permissions
    if (
      existingFolder.createdBy !== authResult.user.id &&
      authResult.user.role !== 'admin'
    ) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // If name is being updated, check for slug conflicts
    let slug = existingFolder.slug;
    if (validatedData.name && validatedData.name !== existingFolder.name) {
      slug = validatedData.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

      const slugConflict = await prisma.galleryFolder.findFirst({
        where: {
          slug,
          id: { not: id },
        },
      });

      if (slugConflict) {
        return NextResponse.json(
          { error: 'A folder with this name already exists' },
          { status: 409 },
        );
      }
    }

    // Update folder
    const updatedFolder = await prisma.galleryFolder.update({
      where: { id },
      data: {
        ...validatedData,
        ...(slug !== existingFolder.slug && { slug }),
        updatedAt: new Date(),
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

    return NextResponse.json({
      success: true,
      data: updatedFolder,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.issues },
        { status: 400 },
      );
    }

    console.error('Error updating folder:', error);
    return NextResponse.json(
      { error: 'Failed to update folder' },
      { status: 500 },
    );
  }
}

// DELETE /api/gallery/folders/[id] - Delete folder
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const authResult = await requireAuthenticatedUser();
    if ('response' in authResult) {
      return authResult.response;
    }
    const requestMeta = buildRequestMeta(request, authResult.user);

    const permissionResponse = requireUserPermission(
      authResult.user,
      'gallery:delete',
    );
    if (permissionResponse) {
      return NextResponse.json(
        { error: 'Access denied: gallery:delete permission required' },
        { status: 403 },
      );
    }

    // Check if folder exists
    const folder = await prisma.galleryFolder.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            children: true,
            images: true,
          },
        },
      },
    });

    if (!folder) {
      return NextResponse.json({ error: 'Folder not found' }, { status: 404 });
    }

    // Check if user is the creator or has admin permissions
    if (
      folder.createdBy !== authResult.user.id &&
      authResult.user.role !== 'admin'
    ) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Check if folder has children (subfolders)
    if (folder._count.children > 0) {
      return NextResponse.json(
        {
          error: 'Cannot delete folder with subfolders. Please delete subfolders first.',
          details: {
            children: folder._count.children,
            images: folder._count.images,
          },
        },
        { status: 400 },
      );
    }

    // Delete all images in the folder first if any exist
    if (folder._count.images > 0) {
      console.log(`Deleting ${folder._count.images} images in folder ${id}`);
      
      // Delete all images in the folder
      await prisma.galleryImage.deleteMany({
        where: { folderId: id },
      });
      
      console.log(`Successfully deleted images in folder ${id}`);
    }

    // Delete the folder
    await prisma.galleryFolder.delete({
      where: { id },
    });

    await writeAuditLog({
      action: 'GALLERY_FOLDER_DELETED',
      actorId: authResult.user.id,
      actorRole: authResult.user.role,
      resourceType: 'gallery',
      resourceId: id,
      success: true,
      requestMeta,
      metadata: {
        deletedImageCount: folder._count.images,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Folder deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting folder:', error);
    return NextResponse.json(
      { error: 'Failed to delete folder' },
      { status: 500 },
    );
  }
}
