import { NextRequest, NextResponse } from 'next/server';
import { requireAuthenticatedUser, requireUserPermission } from '@/lib/api-guards';
import { generateUploadSignature } from '@/lib/cloudinary';

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
