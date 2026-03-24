import { NextRequest, NextResponse } from 'next/server';
import {
  requireAnyUserPermission,
  requireAuthenticatedUser,
  requireUserPermission,
} from '@/lib/api-guards';
import { hasPermission } from '@/lib/permissions';
import { galleryImagesListQuerySchema, parseQuery } from '@/lib/api-schemas';
import {
  createGalleryImage,
  createImageSchema,
  listGalleryImages,
} from '@/lib/services/gallery-images-service';
import { ServiceError } from '@/lib/services/service-error';
import { z } from 'zod';

function handleApiError(error: unknown, fallbackMessage: string) {
  if (error instanceof z.ZodError) {
    return NextResponse.json(
      { error: 'Validation error', details: error.format() },
      { status: 400 },
    );
  }

  if (error instanceof ServiceError) {
    return NextResponse.json(
      { error: error.message, ...(error.details ? { details: error.details } : {}) },
      { status: error.statusCode },
    );
  }

  console.error(fallbackMessage, error);
  return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
}

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuthenticatedUser();
    if ('response' in authResult) {
      return authResult.response;
    }

    const permissionResponse = requireAnyUserPermission(authResult.user, [
      'gallery:read',
      'gallery:upload',
    ]);
    if (permissionResponse) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const query = parseQuery(
      galleryImagesListQuerySchema,
      new URL(request.url).searchParams,
    );

    const canReadAll = hasPermission(authResult.user.permissions, 'gallery:read');
    const scopedQuery = canReadAll
      ? query
      : {
          ...query,
          uploaderId: authResult.user.id,
        };

    const result = await listGalleryImages(scopedQuery);

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    return handleApiError(error, 'Error fetching images:');
  }
}

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
    const validatedData = createImageSchema.parse(body);
    const image = await createGalleryImage(authResult.user, validatedData);

    return NextResponse.json(
      {
        success: true,
        data: image,
      },
      { status: 201 },
    );
  } catch (error) {
    return handleApiError(error, 'Error creating image:');
  }
}
