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

// POST /api/gallery/upload - Upload images using FormData
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

    // Parse FormData with proper error handling
    let formData;
    try {
      formData = await request.formData();
    } catch (error) {
      console.error('Error parsing FormData:', error);
      return NextResponse.json(
        { error: 'Invalid form data or file too large' },
        { status: 400 },
      );
    }

    const folderId = formData.get('folderId') as string;
    const files = formData.getAll('images') as any[];

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 });
    }

    const folderPath = await getCloudinaryFolderPath(folderId);

    const uploadedImages = [];
    let uploadedCount = 0;

    for (const file of files) {
      try {
        // Validate file type
        if (!file.type || !file.type.startsWith('image/')) {
          console.warn(`Skipping non-image file: ${file.name}`);
          continue;
        }

        // Validate file size (max 10MB)
        if (file.size && file.size > 10 * 1024 * 1024) {
          console.warn(
            `Skipping large file: ${file.name} (${file.size} bytes)`,
          );
          continue;
        }

        // Convert file to base64
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const base64 = buffer.toString('base64');
        const dataUrl = `data:${file.type};base64,${base64}`;

        // Generate unique filename
        const fileExtension = file.name.split('.').pop();
        const uniqueFileName = `${Date.now()}_${randomUUID()}.${fileExtension}`;

        // Upload to Cloudinary
        const uploadResult = await uploadImage(dataUrl, {
          folder: folderPath,
          public_id: uniqueFileName,
        });

        // Generate thumbnail URL
        const thumbnailUrl = getThumbnailUrl(uploadResult.public_id);

        // Save to database
        const image = await prisma.galleryImage.create({
          data: {
            originalName: file.name,
            fileName: uniqueFileName,
            fileUrl: uploadResult.secure_url,
            thumbnailUrl,
            fileSize: uploadResult.bytes,
            mimeType: file.type,
            folderId: folderId || null,
            title: file.name,
            cloudinaryId: uploadResult.public_id,
            cloudinaryData: JSON.parse(JSON.stringify(uploadResult)),
            uploadedBy: authResult.user.id,
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
          },
        });

        uploadedImages.push(image);
        uploadedCount++;
      } catch (error) {
        console.error(`Error uploading file ${file.name}:`, error);
        // Continue with other files even if one fails
      }
    }

    return NextResponse.json(
      {
        success: true,
        uploadedCount,
        images: uploadedImages,
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof GalleryFolderNotFoundError) {
      return NextResponse.json({ error: 'Folder not found' }, { status: 404 });
    }

    console.error('Error uploading images:', error);
    return NextResponse.json(
      { error: 'Failed to upload images' },
      { status: 500 },
    );
  }
}
