import { NextRequest, NextResponse } from 'next/server';
import { requireAuthenticatedUser, requireUserPermission } from '@/lib/api-guards';
import { generateUploadSignature } from '@/lib/cloudinary';
import {
  GalleryFolderNotFoundError,
  getCloudinaryFolderPath,
} from '@/lib/gallery-folders';
import { z } from 'zod';

const signatureRequestSchema = z.object({
  folderId: z.string().optional(),
  fileName: z.string().min(1).optional(),
});

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
      return permissionResponse;
    }

    const body = await request.json();
    const { folderId, fileName } = signatureRequestSchema.parse(body);
    const folderPath = await getCloudinaryFolderPath(folderId);

    const signature = generateUploadSignature({
      folder: folderPath,
      public_id: fileName,
    });

    return NextResponse.json(signature);
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

    console.error('Error generating upload signature:', error);
    return NextResponse.json(
      { error: 'Failed to generate upload signature' },
      { status: 500 },
    );
  }
}
