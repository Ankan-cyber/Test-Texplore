import { NextRequest, NextResponse } from 'next/server';
import {
  getOptionalAuthenticatedUser,
  requireAuthenticatedUser,
  requireUserPermission,
} from '@/lib/api-guards';
import { eventsListQuerySchema, parseQuery } from '@/lib/api-schemas';
import {
  createEvent,
  createEventSchema,
  listEvents,
} from '@/lib/services/events-service';
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
    const query = parseQuery(eventsListQuerySchema, new URL(request.url).searchParams);
    const user = await getOptionalAuthenticatedUser();
    const data = await listEvents(query, user);

    return NextResponse.json(data);
  } catch (error) {
    return handleApiError(error, 'Error fetching events:');
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuthenticatedUser();
    if ('response' in authResult) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 },
      );
    }

    const permissionResponse = requireUserPermission(authResult.user, 'event:create');
    if (permissionResponse) {
      return NextResponse.json(
        { error: 'Insufficient permissions to create events' },
        { status: 403 },
      );
    }

    const body = await request.json();
    const validatedData = createEventSchema.parse(body);
    const event = await createEvent(authResult.user, validatedData);

    return NextResponse.json(
      {
        event,
        message: 'Event created successfully',
      },
      { status: 201 },
    );
  } catch (error) {
    return handleApiError(error, 'Error creating event:');
  }
}
