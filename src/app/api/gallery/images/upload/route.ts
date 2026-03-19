import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { requireAuthenticatedUser, requireUserPermission } from '@/lib/api-guards';
import { prisma } from '@/lib/db';
import {
  uploadImage,
  getThumbnailUrl,
} from '@/lib/cloudinary';
import {
  GalleryFolderNotFoundError,
  getCloudinaryFolderPath,
} from '@/lib/gallery-folders';
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
    const validatedData = uploadImageSchema.parse(body);

    // Validate file size (max 10MB)
    const fileSize = Math.ceil((validatedData.file.length * 3) / 4);
    if (fileSize > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size too large. Maximum size is 10MB.' },
        { status: 400 },
      );
    }

    const folderPath = await getCloudinaryFolderPath(validatedData.folderId);

    // Generate unique filename
    const fileExtension = validatedData.fileName.split('.').pop();
    const uniqueFileName = `${Date.now()}_${randomUUID()}.${fileExtension}`;

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
        uploadedBy: authResult.user.id,
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
    if (error instanceof GalleryFolderNotFoundError) {
      return NextResponse.json({ error: 'Folder not found' }, { status: 404 });
    }

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
