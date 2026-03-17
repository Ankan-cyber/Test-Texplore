import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { canCreateEvents } from '@/lib/permissions';
import { uploadImage } from '@/lib/cloudinary';

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 },
      );
    }

    if (!canCreateEvents(user.permissions)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 },
      );
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
