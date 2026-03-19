import { NextRequest, NextResponse } from 'next/server';
import {
  requireAnyUserPermission,
  requireAuthenticatedUser,
} from '@/lib/api-guards';
import { prisma } from '@/lib/db';

// GET /api/events/[id]/registrations - Get all registrations for an event
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: eventId } = await params;

    // Validate event ID
    if (!eventId || typeof eventId !== 'string') {
      return NextResponse.json({ error: 'Invalid event ID' }, { status: 400 });
    }

    const authResult = await requireAuthenticatedUser();
    if ('response' in authResult) {
      return authResult.response;
    }

    // Check if user can manage events
    const permissionResponse = requireAnyUserPermission(authResult.user, [
      'event:create',
      'event:update',
      'event:delete',
      'event:approve',
    ]);
    if (permissionResponse) {
      return permissionResponse;
    }

    // Get the event
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: {
        id: true,
        title: true,
        status: true,
      },
    });

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Get all registrations for the event
    const registrations = await prisma.eventRegistration.findMany({
      where: { eventId },
      select: {
        id: true,
        registrationDate: true,
        status: true,
        notes: true,
        // Public registration fields
        fullName: true,
        emailId: true,
        college: true,
        department: true,
        phoneNumber: true,
        year: true,
        registrationType: true,
      },
      orderBy: { registrationDate: 'desc' },
    });

    return NextResponse.json({
      event,
      registrations,
      total: registrations.length,
    });
  } catch (error) {
    console.error('Error fetching event registrations:', error);

    return NextResponse.json(
      { error: 'Failed to fetch registrations' },
      { status: 500 },
    );
  }
}
