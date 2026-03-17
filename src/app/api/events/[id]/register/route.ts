import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { z } from 'zod';

// Validation schema for public event registration
const publicRegistrationSchema = z.object({
  fullName: z.string().min(1, 'Full name is required'),
  emailId: z.string().email('Valid email is required'),
  college: z.string().optional(),
  department: z.string().min(1, 'Department is required'),
  phoneNumber: z.string().min(1, 'Phone number is required'),
  year: z.string().min(1, 'Year of study is required'),
  registrationType: z.enum(['internal', 'external']),
  enrollmentNumber: z.string().optional(),
  notes: z.string().optional(),
}).refine((data) => {
  // Enrollment number is required for internal students
  if (data.registrationType === 'internal') {
    return data.enrollmentNumber && data.enrollmentNumber.trim().length > 0;
  }
  return true;
}, {
  message: 'Enrollment number is required for internal students',
  path: ['enrollmentNumber'],
}).refine((data) => {
  // College name is required for external students
  if (data.registrationType === 'external') {
    return data.college && data.college.trim().length > 0;
  }
  return true;
}, {
  message: 'College name is required for external students',
  path: ['college'],
});

// POST /api/events/[id]/register - Register for event
async function handlePost(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: eventId } = await params;
    const body = await request.json();

    // Get the event
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        registrations: {
          select: {
            id: true,
            emailId: true,
          },
        },
      },
    });

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Check if event is published and registration is open
    if (event.status !== 'PUBLISHED') {
      return NextResponse.json(
        { error: 'Event is not published' },
        { status: 400 },
      );
    }

    if (!event.isRegistrationOpen) {
      return NextResponse.json(
        { error: 'Event registration is closed' },
        { status: 400 },
      );
    }

    // Check registration deadline
    if (event.registrationDeadline && new Date() > event.registrationDeadline) {
      return NextResponse.json(
        { error: 'Registration deadline has passed' },
        { status: 400 },
      );
    }

    // Validate public registration data
    const validatedData = publicRegistrationSchema.parse(body);

    // Debug: Log the registration attempt
    console.log('Registration attempt:', {
      eventId,
      emailId: validatedData.emailId,
      existingRegistrations: event.registrations.length,
    });

    // Check capacity
    if (event.maxCapacity) {
      const totalRegistrations = event.registrations.length;

      if (totalRegistrations >= event.maxCapacity) {
        return NextResponse.json(
          { error: 'Event is at full capacity' },
          { status: 400 },
        );
      }
    }

    // Debug: Log the registration attempt
    console.log('Registration attempt:', {
      eventId,
      emailId: validatedData.emailId,
      existingRegistrations: event.registrations.length,
    });

    // Check for existing registration with the same email (normalized)
    const normalizedEmail = validatedData.emailId.toLowerCase().trim();

    // Get all registrations for this event and check for duplicates
    const allRegistrations = await prisma.eventRegistration.findMany({
      where: {
        eventId,
        emailId: {
          not: null,
        },
      },
      select: {
        emailId: true,
      },
    });

    // Check if any existing registration has the same email (case-insensitive)
    const hasDuplicate = allRegistrations.some(
      (reg) =>
        reg.emailId && reg.emailId.toLowerCase().trim() === normalizedEmail,
    );

    if (hasDuplicate) {
      console.error(
        'Found existing registration with same email:',
        normalizedEmail,
      );
      return NextResponse.json(
        { error: 'This email is already registered for this event' },
        { status: 400 },
      );
    }

    // Create registration for public user
    const registration = await prisma.eventRegistration.create({
      data: {
        eventId,
        fullName: validatedData.fullName,
        emailId: validatedData.emailId.toLowerCase().trim(),
        college: validatedData.college,
        department: validatedData.department,
        phoneNumber: validatedData.phoneNumber,
        year: validatedData.year,
        registrationType: validatedData.registrationType,
        enrollmentNumber: validatedData.enrollmentNumber || null,
        notes: validatedData.notes || null,
        status: 'REGISTERED',
      },
      include: {
        event: {
          select: {
            id: true,
            title: true,
            startDate: true,
            endDate: true,
            location: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        registration,
        message: 'Registration successful',
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.format() },
        { status: 400 },
      );
    }

    // Handle Prisma errors
    if (
      error &&
      typeof error === 'object' &&
      'code' in error &&
      error.code === 'P2002'
    ) {
      console.error('Prisma constraint error:', error);
      return NextResponse.json(
        { error: 'Registration constraint violation' },
        { status: 400 },
      );
    }

    console.error('Error registering for event:', error);

    // Log more details about the error
    if (error && typeof error === 'object') {
      console.error('Error details:', {
        name: (error as any).name,
        code: (error as any).code,
        message: (error as any).message,
        meta: (error as any).meta,
      });
    }

    return NextResponse.json(
      { error: 'Failed to register for event' },
      { status: 500 },
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  return handlePost(request, { params });
}
