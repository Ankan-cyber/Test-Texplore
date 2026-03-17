import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, canManageEvents } from '@/lib/auth';
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

    // Get current user
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 },
      );
    }

    // Check if user can manage events
    if (!canManageEvents(user)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 },
      );
    }

    // Get the event
    console.log('Fetching event with ID:', eventId);
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

    console.log('Event found:', event.title);

    // Get all registrations for the event
    console.log('Fetching registrations for event:', eventId);
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

    console.log('Found registrations:', registrations.length);

    return NextResponse.json({
      event,
      registrations,
      total: registrations.length,
    });
  } catch (error) {
    console.error('Error fetching event registrations:', error);

    // Log more details for debugging
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }

    return NextResponse.json(
      {
        error: 'Failed to fetch registrations',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}
