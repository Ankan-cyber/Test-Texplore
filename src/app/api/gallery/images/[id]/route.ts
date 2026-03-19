import { NextRequest, NextResponse } from 'next/server';
import {
  requireAuthenticatedUser,
  requireUserPermission,
} from '@/lib/api-guards';
import {
  deleteGalleryImageById,
  getGalleryImageById,
  updateGalleryImage,
  updateImageSchema,
} from '@/lib/services/gallery-images-service';
import { buildRequestMeta, writeAuditLog } from '@/lib/audit-log';
import { errorResponse, logApiError } from '@/lib/error-envelope';
import { ServiceError } from '@/lib/services/service-error';
import { z } from 'zod';

function handleApiError(error: unknown, fallbackMessage: string) {
  if (error instanceof z.ZodError) {
    return errorResponse(400, 'Validation error', 'VALIDATION_ERROR', error.format());
  }

  if (error instanceof ServiceError) {
    const code =
      error.statusCode === 403
        ? 'ACCESS_DENIED'
        : error.statusCode === 404
          ? 'NOT_FOUND'
          : error.statusCode === 409
            ? 'CONFLICT'
            : 'INTERNAL_ERROR';
    return errorResponse(error.statusCode, error.message, code, error.details);
  }

  logApiError(fallbackMessage, error);
  return errorResponse(500, 'Failed to process request', 'INTERNAL_ERROR');
}

// GET /api/gallery/images/[id] - Get a single image by ID (public access)
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: imageId } = await params;
    const image = await getGalleryImageById(imageId);

    return NextResponse.json({
      success: true,
      image,
    });
  } catch (error) {
    return handleApiError(error, 'Error fetching image:');
  }
}

// PUT /api/gallery/images/[id] - Update image
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
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

    const { id } = await params;
    const body = await request.json();
    const validatedData = updateImageSchema.parse(body);
    const image = await updateGalleryImage(id, authResult.user, validatedData);

    return NextResponse.json({
      success: true,
      data: image,
    });
  } catch (error) {
    return handleApiError(error, 'Error updating image:');
  }
}

// DELETE /api/gallery/images/[id] - Delete image
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
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

    const { id } = await params;
    const requestMeta = buildRequestMeta(request, authResult.user);
    await deleteGalleryImageById(id, authResult.user);

    await writeAuditLog({
      action: 'GALLERY_IMAGE_DELETED',
      actorId: authResult.user.id,
      actorRole: authResult.user.role,
      resourceType: 'gallery',
      resourceId: id,
      success: true,
      requestMeta,
    });

    return NextResponse.json({
      success: true,
      message: 'Image deleted successfully',
    });
  } catch (error) {
    return handleApiError(error, 'Error deleting image:');
  }
}
