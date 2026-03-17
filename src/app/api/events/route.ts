import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { canCreateEvents } from '@/lib/permissions';
import { prisma } from '@/lib/db';
import { z } from 'zod';

// Validation schema for creating events
const createEventSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  description: z
    .string()
    .min(1, 'Description is required')
    .max(2000, 'Description too long'),
  startDate: z.string().datetime('Invalid start date'),
  endDate: z.string().datetime('Invalid end date'),
  location: z.string().optional(),
  isOnline: z.boolean().default(false),
  links: z.array(z.string()).optional().default([]),
  maxCapacity: z.number().int().positive('Capacity must be a positive number'),
  isRegistrationOpen: z.boolean().default(true),
  registrationDeadline: z.string().datetime().optional().or(z.literal('')),
  category: z.string().optional(),
  tags: z.array(z.string()).default([]),
  imageUrl: z.string().url().optional().or(z.literal('')),
  departmentId: z
    .string()
    .min(1, 'Department ID must not be empty')
    .optional()
    .or(z.literal('')),
  isFeatured: z.boolean().default(false),
  status: z
    .enum(['DRAFT', 'PUBLISHED', 'CANCELLED', 'COMPLETED', 'ARCHIVED'])
    .default('DRAFT'),
});

// GET /api/events - List events with filtering
async function handleGet(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const category = searchParams.get('category');
    const department = searchParams.get('department');

    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build where clause
    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (category) {
      where.category = category;
    }

    if (department) {
      where.departmentId = department;
    }

    // Get current user for permission checking
    const user = await getCurrentUser();

    // Check if user has event:read permission
    const canReadEvents =
      user &&
      (user.role === 'admin' || user.permissions.includes('event:read'));

    // If user doesn't have read permission, show published events and past events
    if (!canReadEvents) {
      // Public access - published events and past events (regardless of status)
      // Don't override existing status filter if it's already set
      if (!where.status) {
        const now = new Date();
        where.OR = [
          { status: 'PUBLISHED' },
          { 
            endDate: {
              lt: now
            }
          },
          { status: 'COMPLETED' }
        ];
      }
    }

    const events = await prisma.event.findMany({
      where,
      select: {
        id: true,
        title: true,
        description: true,
        slug: true,
        startDate: true,
        endDate: true,
        location: true,
        isOnline: true,
        links: true,
        maxCapacity: true,
        isRegistrationOpen: true,
        registrationDeadline: true,
        status: true,
        isFeatured: true,
        imageUrl: true,
        tags: true,
        category: true,
        createdAt: true,
        updatedAt: true,
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
          },
        },
        _count: {
          select: {
            registrations: true,
          },
        },
      },
      orderBy: [
        { isFeatured: 'desc' },
        { startDate: 'asc' },
        { createdAt: 'desc' },
      ],
      take: limit,
      skip: offset,
    });

    // Get total count for pagination
    const total = await prisma.event.count({ where });

    return NextResponse.json({
      events,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    });
  } catch (error) {
    console.error('Error fetching events:', error);
    return NextResponse.json(
      { error: 'Failed to fetch events' },
      { status: 500 },
    );
  }
}

// POST /api/events - Create new event
async function handlePost(request: NextRequest) {
  try {
    console.log('POST /api/events - Starting request processing');
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

    // Check if user can create events
    if (!canCreateEvents(user.permissions)) {
      return NextResponse.json(
        { error: 'Insufficient permissions to create events' },
        { status: 403 },
      );
    }

    const body = await request.json();
    console.log('POST /api/events - Request body:', body);

    // Validate request body
    const validatedData = createEventSchema.parse(body);
    console.log('POST /api/events - Validated data:', validatedData);

    // Validate and filter links
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

    // Validate dates
    const startDate = new Date(validatedData.startDate);
    const endDate = new Date(validatedData.endDate);

    if (startDate >= endDate) {
      return NextResponse.json(
        { error: 'End date must be after start date' },
        { status: 400 },
      );
    }

    if (validatedData.registrationDeadline) {
      const deadline = new Date(validatedData.registrationDeadline);
      if (deadline >= startDate) {
        return NextResponse.json(
          { error: 'Registration deadline must be before event start date' },
          { status: 400 },
        );
      }
    }

    // Generate slug from title
    const slug =
      validatedData.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '') +
      '-' +
      Date.now();

    // Check if user is assigning to a department they have access to
    if (validatedData.departmentId) {
      const isAdmin = user.role === 'admin';
      const userDepartmentId = user.departmentId;

      if (!isAdmin && userDepartmentId !== validatedData.departmentId) {
        return NextResponse.json(
          { error: 'You can only create events for your assigned department' },
          { status: 403 },
        );
      }
    }

    // Process the data to handle empty departmentId
    const eventData: any = { ...validatedData };

    // Handle departmentId - if it's empty string, set to null (no department)
    const departmentId =
      eventData.departmentId === '' ? null : eventData.departmentId;
    delete eventData.departmentId;

    // Handle registration deadline
    if (eventData.registrationDeadline) {
      eventData.registrationDeadline = new Date(eventData.registrationDeadline);
    } else {
      eventData.registrationDeadline = null;
    }

    // Remove undefined values
    Object.keys(eventData).forEach((key) => {
      if (eventData[key] === undefined) {
        delete eventData[key];
      }
    });

    console.log('POST /api/events - About to create event in database');
    console.log('POST /api/events - Event data for database:', {
      ...eventData,
      slug,
      createdBy: { connect: { id: user.id } },
      startDate,
      endDate,
      ...(departmentId && { department: { connect: { id: departmentId } } }),
    });
    
    // Create the event
    const event = await prisma.event.create({
      data: {
        ...eventData,
        slug,
        createdBy: {
          connect: {
            id: user.id,
          },
        },
        startDate,
        endDate,
        ...(departmentId && {
          department: {
            connect: {
              id: departmentId,
            },
          },
        }),
      },
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

    return NextResponse.json(
      {
        event,
        message: 'Event created successfully',
      },
      { status: 201 },
    );
  } catch (error) {
    console.error('POST /api/events - Error details:', error);
    
    if (error instanceof z.ZodError) {
      console.error('POST /api/events - Zod validation error:', error.format());
      return NextResponse.json(
        { error: 'Validation error', details: error.format() },
        { status: 400 },
      );
    }

    console.error('Error creating event:', error);
    return NextResponse.json(
      { error: 'Failed to create event', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 },
    );
  }
}

// Main handler
export async function GET(request: NextRequest) {
  return handleGet(request);
}

export async function POST(request: NextRequest) {
  return handlePost(request);
}
