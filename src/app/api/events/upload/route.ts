import { NextRequest, NextResponse } from 'next/server';
import { requireAuthenticatedUser, requireUserPermission } from '@/lib/api-guards';
import { uploadImage } from '@/lib/cloudinary';

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuthenticatedUser();
    if ('response' in authResult) {
      return authResult.response;
    }

    const permissionResponse = requireUserPermission(
      authResult.user,
      'event:create',
    );
    if (permissionResponse) {
      return permissionResponse;
    }

    const formData = await request.formData();
    const file = formData.get('file');

    if (!file || !(file instanceof Blob)) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const result = await uploadImage(buffer, {
      folder: 'texplore-events',
      transformation: { quality: 'auto', fetch_format: 'auto' },
      tags: ['event'],
    });

    return NextResponse.json({
      public_id: result.public_id,
      url: result.secure_url,
    });
  } catch (error) {
    console.error('Error uploading event image:', error);
    return NextResponse.json(
      { error: 'Failed to upload image' },
      { status: 500 },
    );
  }
}
