import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { canCreateEvents, canManageEvents } from '@/lib/permissions';
import { prisma } from '@/lib/db';
import { z } from 'zod';

// Validation schema for updating events
const updateEventSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(200, 'Title too long')
    .optional(),
  description: z
    .string()
    .min(1, 'Description is required')
    .max(2000, 'Description too long')
    .optional(),
  startDate: z.string().datetime('Invalid start date').optional(),
  endDate: z.string().datetime('Invalid end date').optional(),
  location: z.string().optional(),
  isOnline: z.boolean().optional(),
  links: z.array(z.string()).optional(),
  maxCapacity: z.number().int().positive('Capacity must be a positive number'),
  isRegistrationOpen: z.boolean().optional(),
  registrationDeadline: z.string().datetime().optional().or(z.literal('')),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  imageUrl: z.string().url().optional().or(z.literal('')),
  departmentId: z
    .string()
    .min(1, 'Department ID must not be empty')
    .optional()
    .or(z.literal('')),
  isFeatured: z.boolean().optional(),
  status: z
    .enum(['DRAFT', 'PUBLISHED', 'CANCELLED', 'COMPLETED', 'ARCHIVED'])
    .optional(),
});

// GET /api/events/[id] - Get single event
async function handleGet(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    const isAdmin = user?.role === 'admin' || user?.role === 'president';

    // Build where clause
    const where: any = { id };

    // If not admin/president, only show published events or events from user's department
    if (!isAdmin) {
      if (user) {
        // Show published events + events from user's department
        where.OR = [
          { status: 'PUBLISHED' },
          { departmentId: user.departmentId },
        ];
      } else {
        // Public access - only published events
        where.status = 'PUBLISHED';
      }
    }

    const event = await prisma.event.findFirst({
      where,
      include: {
        department: {
          select: {
            id: true,
            name: true,
            displayName: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        registrations: {
          select: {
            id: true,
            fullName: true,
            emailId: true,
            college: true,
            department: true,
            phoneNumber: true,
            year: true,
            registrationType: true,
            registrationDate: true,
          },
        },
        organizers: {
          select: {
            id: true,
            role: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        attendances: {
          select: {
            id: true,
            status: true,
            checkInTime: true,
            checkOutTime: true,
            notes: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        _count: {
          select: {
            registrations: true,
            attendances: true,
            organizers: true,
          },
        },
      },
    });

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    return NextResponse.json({ event });
  } catch (error) {
    console.error('Error fetching event:', error);
    return NextResponse.json(
      { error: 'Failed to fetch event' },
      { status: 500 },
    );
  }
}

// PUT /api/events/[id] - Update event
async function handlePut(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    // Get current user and check authentication
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 },
      );
    }

    // Check if user is approved
    if (user.status !== 'APPROVED') {
      return NextResponse.json(
        { error: 'Account is not approved' },
        { status: 403 },
      );
    }

    // Check if user can manage events
    if (!canManageEvents(user.permissions)) {
      return NextResponse.json(
        { error: 'Insufficient permissions to update events' },
        { status: 403 },
      );
    }

    // Get the existing event
    const existingEvent = await prisma.event.findUnique({
      where: { id },
      include: {
        department: true,
      },
    });

    if (!existingEvent) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Check if user can update this specific event
    const isAdmin = user.role === 'admin' || user.role === 'president';
    const isCreator = existingEvent.createdById === user.id;

    if (!isAdmin && !isCreator) {
      // Check if user is in the same department as the event
      if (existingEvent.departmentId) {
        const userDepartment = user.departmentId;

        if (!isAdmin && userDepartment !== existingEvent.departmentId) {
          return NextResponse.json(
            {
              error: 'You can only update events from your assigned department',
            },
            { status: 403 },
          );
        }
      } else {
        return NextResponse.json(
          {
            error:
              'You can only update events you created or events from your department',
          },
          { status: 403 },
        );
      }
    }

    const body = await request.json();

    // Validate request body
    const validatedData = updateEventSchema.parse(body);

    // Validate and filter links if provided
    if (validatedData.links && validatedData.links.length > 0) {
      // Helper function to validate and normalize URLs
      const validateAndNormalizeUrl = (url: string) => {
        // If it already starts with http/https, validate as is
        if (url.startsWith('http://') || url.startsWith('https://')) {
          try {
            new URL(url);
            return url;
          } catch {
            return null;
          }
        }
        
        // If it doesn't start with protocol, add https://
        const normalizedUrl = `https://${url}`;
        try {
          new URL(normalizedUrl);
          return normalizedUrl;
        } catch {
          return null;
        }
      };
      
      const validatedLinks = validatedData.links.map(link => {
        const [name, url] = link.split('|');
        if (!name?.trim() || !url?.trim()) {
          return null;
        }
        
        const normalizedUrl = validateAndNormalizeUrl(url.trim());
        if (!normalizedUrl) {
          return null;
        }
        
        return `${name.trim()}|${normalizedUrl}`;
      }).filter((link): link is string => link !== null);
      
      if (validatedLinks.length !== validatedData.links.length) {
        return NextResponse.json(
          { error: 'One or more links have invalid format or URLs. Use format: "Link Name|URL"' },
          { status: 400 },
        );
      }
      
      validatedData.links = validatedLinks;
    }

    // Validate dates if provided
    if (validatedData.startDate && validatedData.endDate) {
      const startDate = new Date(validatedData.startDate);
      const endDate = new Date(validatedData.endDate);

      if (startDate >= endDate) {
        return NextResponse.json(
          { error: 'End date must be after start date' },
          { status: 400 },
        );
      }
    }

    if (validatedData.registrationDeadline && validatedData.startDate) {
      const deadline = new Date(validatedData.registrationDeadline);
      const startDate = new Date(validatedData.startDate);
      if (deadline >= startDate) {
        return NextResponse.json(
          { error: 'Registration deadline must be before event start date' },
          { status: 400 },
        );
      }
    }

    // Check if user is assigning to a department they have access to
    if (
      validatedData.departmentId &&
      validatedData.departmentId !== existingEvent.departmentId
    ) {
      const userDepartment = user.departmentId;

      if (!isAdmin && userDepartment !== validatedData.departmentId) {
        return NextResponse.json(
          { error: 'You can only assign events to your assigned departments' },
          { status: 403 },
        );
      }
    }

    // Process the data to handle empty departmentId
    const updateData: any = { ...validatedData };

    // Handle departmentId - if it's empty string, set to null (no department)
    if (updateData.departmentId === '') {
      updateData.departmentId = null;
    }

    // Handle dates
    if (updateData.startDate) {
      updateData.startDate = new Date(updateData.startDate);
    }
    if (updateData.endDate) {
      updateData.endDate = new Date(updateData.endDate);
    }
    if (updateData.registrationDeadline) {
      updateData.registrationDeadline = new Date(
        updateData.registrationDeadline,
      );
    } else if (updateData.registrationDeadline === '') {
      updateData.registrationDeadline = null;
    }

    // Remove undefined values
    Object.keys(updateData).forEach((key) => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });

    // Prepare the update data with proper Prisma structure
    const prismaUpdateData: any = { ...updateData };

    // Handle department relation properly
    if (updateData.departmentId !== undefined) {
      if (updateData.departmentId === null) {
        prismaUpdateData.department = { disconnect: true };
      } else {
        prismaUpdateData.department = {
          connect: { id: updateData.departmentId },
        };
      }
      delete prismaUpdateData.departmentId;
    }

    // Update the event
    const updatedEvent = await prisma.event.update({
      where: { id },
      data: prismaUpdateData,
      include: {
        department: {
          select: {
            id: true,
            name: true,
            displayName: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({
      event: updatedEvent,
      message: 'Event updated successfully',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.format() },
        { status: 400 },
      );
    }

    console.error('Error updating event:', error);
    return NextResponse.json(
      { error: 'Failed to update event' },
      { status: 500 },
    );
  }
}

// DELETE /api/events/[id] - Delete event
async function handleDelete(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    // Get current user and check authentication
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 },
      );
    }

    // Check if user is approved
    if (user.status !== 'APPROVED') {
      return NextResponse.json(
        { error: 'Account is not approved' },
        { status: 403 },
      );
    }

    // Check if user can manage events
    if (!canManageEvents(user.permissions)) {
      return NextResponse.json(
        { error: 'Insufficient permissions to delete events' },
        { status: 403 },
      );
    }

    // Get the existing event
    const existingEvent = await prisma.event.findUnique({
      where: { id },
      include: {
        department: true,
      },
    });

    if (!existingEvent) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Check if user can delete this specific event
    const isAdmin = user.role === 'admin' || user.role === 'president';
    const isCreator = existingEvent.createdById === user.id;

    if (!isAdmin && !isCreator) {
      // Check if user is in the same department as the event
      if (existingEvent.departmentId) {
        const userDepartment = user.departmentId;

        if (!isAdmin && userDepartment !== existingEvent.departmentId) {
          return NextResponse.json(
            {
              error: 'You can only delete events from your assigned department',
            },
            { status: 403 },
          );
        }
      } else {
        return NextResponse.json(
          {
            error:
              'You can only delete events you created or events from your department',
          },
          { status: 403 },
        );
      }
    }

    // Check if event has registrations
    const registrationCount = await prisma.eventRegistration.count({
      where: { eventId: id },
    });

    if (registrationCount > 0) {
      return NextResponse.json(
        {
          error:
            'Cannot delete event with existing registrations. Please cancel the event instead.',
        },
        { status: 400 },
      );
    }

    // Delete the event
    await prisma.event.delete({
      where: { id },
    });

    return NextResponse.json({
      message: 'Event deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting event:', error);
    return NextResponse.json(
      { error: 'Failed to delete event' },
      { status: 500 },
    );
  }
}

// Main handlers
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  return handleGet(request, { params });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  return handlePut(request, { params });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  return handleDelete(request, { params });
}
