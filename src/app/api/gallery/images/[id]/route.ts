import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { canReadGallery, canUploadPhotos } from '@/lib/permissions';
import { prisma } from '@/lib/db';
import { deleteImage } from '@/lib/cloudinary';
import { z } from 'zod';

const updateImageSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  tags: z.array(z.string()).optional(),
  altText: z.string().optional(),
  folderId: z.string().optional(),
  eventId: z.string().optional(),
});

// GET /api/gallery/images/[id] - Get a single image by ID (public access)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: imageId } = await params;

    // No authentication check - public access for student portal
    const image = await prisma.galleryImage.findUnique({
      where: {
        id: imageId,
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
            description: true,
            startDate: true,
            endDate: true,
            location: true,
          },
        },
      },
    });

    if (!image) {
      return NextResponse.json({ error: 'Image not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      image,
    });
  } catch (error) {
    console.error('Error fetching image:', error);
    return NextResponse.json(
      { error: 'Failed to fetch image' },
      { status: 500 },
    );
  }
}

// PUT /api/gallery/images/[id] - Update image
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
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
    const validatedData = updateImageSchema.parse(body);

    // Check if image exists
    const existingImage = await prisma.galleryImage.findUnique({
      where: { id },
    });

    if (!existingImage) {
      return NextResponse.json({ error: 'Image not found' }, { status: 404 });
    }

    // Check if user is the uploader or has admin permissions
    if (existingImage.uploadedBy !== user.id && user.role !== 'admin') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

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

    // Update image
    const updatedImage = await prisma.galleryImage.update({
      where: { id },
      data: {
        ...validatedData,
        updatedAt: new Date(),
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

    return NextResponse.json({
      success: true,
      data: updatedImage,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.issues },
        { status: 400 },
      );
    }

    console.error('Error updating image:', error);
    return NextResponse.json(
      { error: 'Failed to update image' },
      { status: 500 },
    );
  }
}

// DELETE /api/gallery/images/[id] - Delete image
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
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

    // Check if image exists
    const image = await prisma.galleryImage.findUnique({
      where: { id },
    });

    if (!image) {
      return NextResponse.json({ error: 'Image not found' }, { status: 404 });
    }

    // Check if user is the uploader or has admin permissions
    if (image.uploadedBy !== user.id && user.role !== 'admin') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Delete from Cloudinary first
    try {
      await deleteImage(image.cloudinaryId);
    } catch (cloudinaryError) {
      console.error('Error deleting from Cloudinary:', cloudinaryError);
      // Continue with database deletion even if Cloudinary fails
    }

    // Delete from database
    await prisma.galleryImage.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Image deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting image:', error);
    return NextResponse.json(
      { error: 'Failed to delete image' },
      { status: 500 },
    );
  }
}
