import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { canUploadPhotos } from '@/lib/permissions';
import { prisma } from '@/lib/db';
import {
  uploadImage,
  getThumbnailUrl,
  createFolderPath,
} from '@/lib/cloudinary';
import { z } from 'zod';

const uploadImageSchema = z.object({
  file: z.string(), // Base64 encoded file
  fileName: z.string().min(1),
  title: z.string().optional(),
  description: z.string().optional(),
  tags: z.array(z.string()).optional(),
  altText: z.string().optional(),
  folderId: z.string().optional(),
  eventId: z.string().optional(),
});

// POST /api/gallery/images/upload - Upload image to Cloudinary and save to DB
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
    const validatedData = uploadImageSchema.parse(body);

    // Validate file size (max 10MB)
    const fileSize = Math.ceil((validatedData.file.length * 3) / 4);
    if (fileSize > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size too large. Maximum size is 10MB.' },
        { status: 400 },
      );
    }

    // Check if folder exists if folderId is provided
    let folderPath = 'texplore-gallery';
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

      // Build folder path for Cloudinary
      const folderHierarchy = await getFolderHierarchy(folder.id);
      folderPath = createFolderPath(folderHierarchy.join('/'));
    }

    // Generate unique filename
    const timestamp = Date.now();
    const fileExtension = validatedData.fileName.split('.').pop();
    const uniqueFileName = `${timestamp}_${Math.random().toString(36).substring(2)}.${fileExtension}`;
    const publicId = `${folderPath}/${uniqueFileName}`;

    // Upload to Cloudinary
    const uploadResult = await uploadImage(validatedData.file, {
      folder: folderPath,
      public_id: uniqueFileName,
      tags: validatedData.tags || [],
    });

    // Generate thumbnail URL
    const thumbnailUrl = getThumbnailUrl(uploadResult.public_id);

    // Save to database
    const image = await prisma.galleryImage.create({
      data: {
        originalName: validatedData.fileName,
        fileName: uniqueFileName,
        fileUrl: uploadResult.secure_url,
        thumbnailUrl,
        fileSize: uploadResult.bytes,
        mimeType: `image/${uploadResult.format}`,
        folderId: validatedData.folderId,
        title: validatedData.title || validatedData.fileName,
        description: validatedData.description,
        tags: validatedData.tags || [],
        altText: validatedData.altText,
        cloudinaryId: uploadResult.public_id,
        cloudinaryData: JSON.parse(JSON.stringify(uploadResult)),
        uploadedBy: user.id,
        eventId: validatedData.eventId,
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

    console.error('Error uploading image:', error);
    return NextResponse.json(
      { error: 'Failed to upload image' },
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
