import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { canCreateEvents } from '@/lib/permissions';
import { generateUploadSignature } from '@/lib/cloudinary';

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

    const body = await request.json();
    const { folder } = body;

    const signature = generateUploadSignature({
      folder: folder || 'texplore-events',
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
