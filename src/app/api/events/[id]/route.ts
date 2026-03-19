import { NextRequest, NextResponse } from 'next/server';
import {
  getOptionalAuthenticatedUser,
  requireAnyUserPermission,
  requireAuthenticatedUser,
} from '@/lib/api-guards';
import {
  deleteEvent,
  getEventById,
  updateEvent,
  updateEventSchema,
} from '@/lib/services/events-service';
import { ServiceError } from '@/lib/services/service-error';
import { buildRequestMeta, writeAuditLog } from '@/lib/audit-log';
import { errorResponse, logApiError } from '@/lib/error-envelope';
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

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const user = await getOptionalAuthenticatedUser();
    const event = await getEventById(id, user);

    return NextResponse.json({ event });
  } catch (error) {
    return handleApiError(error, 'Error fetching event:');
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const authResult = await requireAuthenticatedUser();
    if ('response' in authResult) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 },
      );
    }

    const permissionResponse = requireAnyUserPermission(authResult.user, [
      'event:create',
      'event:update',
      'event:delete',
      'event:approve',
    ]);
    if (permissionResponse) {
      return NextResponse.json(
        { error: 'Insufficient permissions to update events' },
        { status: 403 },
      );
    }

    const { id } = await params;
    const body = await request.json();
    const validatedData = updateEventSchema.parse(body);
    const requestMeta = buildRequestMeta(request, authResult.user);
    const event = await updateEvent(id, authResult.user, validatedData);

    await writeAuditLog({
      action: 'EVENT_UPDATED',
      actorId: authResult.user.id,
      actorRole: authResult.user.role,
      resourceType: 'event',
      resourceId: id,
      success: true,
      metadata: {
        updatedFields: Object.keys(validatedData),
      },
      requestMeta,
    });

    return NextResponse.json({
      event,
      message: 'Event updated successfully',
    });
  } catch (error) {
    return handleApiError(error, 'Error updating event:');
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const authResult = await requireAuthenticatedUser();
    if ('response' in authResult) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 },
      );
    }

    const permissionResponse = requireAnyUserPermission(authResult.user, [
      'event:create',
      'event:update',
      'event:delete',
      'event:approve',
    ]);
    if (permissionResponse) {
      return NextResponse.json(
        { error: 'Insufficient permissions to delete events' },
        { status: 403 },
      );
    }

    const { id } = await params;
    const requestMeta = buildRequestMeta(request, authResult.user);
    await deleteEvent(id, authResult.user);

    await writeAuditLog({
      action: 'EVENT_DELETED',
      actorId: authResult.user.id,
      actorRole: authResult.user.role,
      resourceType: 'event',
      resourceId: id,
      success: true,
      requestMeta,
    });

    return NextResponse.json({
      message: 'Event deleted successfully',
    });
  } catch (error) {
    return handleApiError(error, 'Error deleting event:');
  }
}
