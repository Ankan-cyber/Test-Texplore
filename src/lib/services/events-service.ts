import { EventStatus, type Prisma } from '@prisma/client';
import { type User } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { type EventsListQuery } from '@/lib/api-schemas';
import { z } from 'zod';
import { ServiceError } from './service-error';
import {
  assertApprovedUser,
  assertCanCreateEventInDepartment,
  assertCanModifyEvent,
  assertCanReassignEventDepartment,
  canReadAllEventStates,
  isAdminLike,
} from '@/lib/policies';

export const createEventSchema = z.object({
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
  departmentId: z.string().min(1, 'Department ID must not be empty').optional().or(z.literal('')),
  isFeatured: z.boolean().default(false),
  status: z.nativeEnum(EventStatus).default(EventStatus.DRAFT),
});

export const updateEventSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long').optional(),
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
  maxCapacity: z.number().int().positive('Capacity must be a positive number').optional(),
  isRegistrationOpen: z.boolean().optional(),
  registrationDeadline: z.string().datetime().optional().or(z.literal('')),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  imageUrl: z.string().url().optional().or(z.literal('')),
  departmentId: z.string().min(1, 'Department ID must not be empty').optional().or(z.literal('')),
  isFeatured: z.boolean().optional(),
  status: z.nativeEnum(EventStatus).optional(),
});

type CreateEventInput = z.infer<typeof createEventSchema>;
type UpdateEventInput = z.infer<typeof updateEventSchema>;

function normalizeLinks(links: string[]): string[] {
  const validateAndNormalizeUrl = (url: string): string | null => {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      try {
        new URL(url);
        return url;
      } catch {
        return null;
      }
    }

    const normalizedUrl = `https://${url}`;
    try {
      new URL(normalizedUrl);
      return normalizedUrl;
    } catch {
      return null;
    }
  };

  const validatedLinks = links
    .map((link) => {
      const [name, url] = link.split('|');
      if (!name?.trim() || !url?.trim()) {
        return null;
      }

      const normalizedUrl = validateAndNormalizeUrl(url.trim());
      if (!normalizedUrl) {
        return null;
      }

      return `${name.trim()}|${normalizedUrl}`;
    })
    .filter((link): link is string => link !== null);

  if (validatedLinks.length !== links.length) {
    throw new ServiceError(
      'One or more links have invalid format or URLs. Use format: "Link Name|URL"',
      400,
    );
  }

  return validatedLinks;
}

export async function listEvents(query: EventsListQuery, user: User | null) {
  const where: Prisma.EventWhereInput = {};

  if (query.status) {
    where.status = query.status;
  }

  if (query.category) {
    where.category = query.category;
  }

  if (query.department) {
    where.departmentId = query.department;
  }

  if (!canReadAllEventStates(user) && !where.status) {
    const now = new Date();
    where.OR = [
      { status: EventStatus.PUBLISHED },
      { endDate: { lt: now } },
      { status: EventStatus.COMPLETED },
    ];
  }

  const [events, total] = await Promise.all([
    prisma.event.findMany({
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
      orderBy: [{ isFeatured: 'desc' }, { startDate: 'asc' }, { createdAt: 'desc' }],
      take: query.limit,
      skip: query.offset,
    }),
    prisma.event.count({ where }),
  ]);

  return {
    events,
    pagination: {
      total,
      limit: query.limit,
      offset: query.offset,
      hasMore: query.offset + query.limit < total,
    },
  };
}

export async function getEventById(id: string, user: User | null) {
  const isAdmin = user ? isAdminLike(user) : false;
  const where: Prisma.EventWhereInput = { id };

  if (!isAdmin) {
    if (user) {
      where.OR = [{ status: EventStatus.PUBLISHED }, { departmentId: user.departmentId }];
    } else {
      where.status = EventStatus.PUBLISHED;
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
    throw new ServiceError('Event not found', 404);
  }

  return event;
}

export async function createEvent(user: User, input: CreateEventInput) {
  assertApprovedUser(user);
  assertCanCreateEventInDepartment(user, input.departmentId || null);

  const startDate = new Date(input.startDate);
  const endDate = new Date(input.endDate);

  if (startDate >= endDate) {
    throw new ServiceError('End date must be after start date', 400);
  }

  let registrationDeadline: Date | null = null;
  if (input.registrationDeadline) {
    registrationDeadline = new Date(input.registrationDeadline);
    if (registrationDeadline >= startDate) {
      throw new ServiceError('Registration deadline must be before event start date', 400);
    }
  }

  const slug =
    input.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') +
    '-' +
    Date.now();

  const normalizedLinks = input.links ? normalizeLinks(input.links) : [];
  const departmentId = input.departmentId === '' ? null : input.departmentId;

  const event = await prisma.event.create({
    data: {
      title: input.title,
      description: input.description,
      slug,
      startDate,
      endDate,
      location: input.location,
      isOnline: input.isOnline,
      links: normalizedLinks,
      maxCapacity: input.maxCapacity,
      isRegistrationOpen: input.isRegistrationOpen,
      registrationDeadline,
      status: input.status,
      isFeatured: input.isFeatured,
      imageUrl: input.imageUrl || null,
      tags: input.tags,
      category: input.category,
      createdBy: {
        connect: {
          id: user.id,
        },
      },
      ...(departmentId
        ? {
            department: {
              connect: { id: departmentId },
            },
          }
        : {}),
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

  return event;
}

export async function updateEvent(id: string, user: User, input: UpdateEventInput) {
  assertApprovedUser(user);

  const existingEvent = await prisma.event.findUnique({
    where: { id },
    include: {
      department: true,
    },
  });

  if (!existingEvent) {
    throw new ServiceError('Event not found', 404);
  }

  assertCanModifyEvent(user, {
    createdById: existingEvent.createdById,
    departmentId: existingEvent.departmentId,
  });

  if (input.departmentId && input.departmentId !== existingEvent.departmentId) {
    assertCanReassignEventDepartment(user, input.departmentId);
  }

  const normalizedLinks = input.links ? normalizeLinks(input.links) : undefined;

  const candidateStartDate = input.startDate
    ? new Date(input.startDate)
    : existingEvent.startDate;
  const candidateEndDate = input.endDate ? new Date(input.endDate) : existingEvent.endDate;

  if (candidateStartDate >= candidateEndDate) {
    throw new ServiceError('End date must be after start date', 400);
  }

  let registrationDeadline: Date | null | undefined;
  if (input.registrationDeadline === '') {
    registrationDeadline = null;
  } else if (input.registrationDeadline) {
    registrationDeadline = new Date(input.registrationDeadline);
    if (registrationDeadline >= candidateStartDate) {
      throw new ServiceError('Registration deadline must be before event start date', 400);
    }
  }

  const updateData: Prisma.EventUpdateInput = {
    ...input,
    ...(normalizedLinks && { links: normalizedLinks }),
    ...(input.startDate && { startDate: candidateStartDate }),
    ...(input.endDate && { endDate: candidateEndDate }),
    ...(registrationDeadline !== undefined && { registrationDeadline }),
  };

  if (input.departmentId !== undefined) {
    if (input.departmentId === '') {
      updateData.department = { disconnect: true };
    } else {
      updateData.department = { connect: { id: input.departmentId } };
    }
    delete (updateData as Prisma.EventUpdateInput & { departmentId?: string }).departmentId;
  }

  const event = await prisma.event.update({
    where: { id },
    data: updateData,
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

  return event;
}

export async function deleteEvent(id: string, user: User) {
  assertApprovedUser(user);

  const existingEvent = await prisma.event.findUnique({
    where: { id },
    include: {
      department: true,
    },
  });

  if (!existingEvent) {
    throw new ServiceError('Event not found', 404);
  }

  assertCanModifyEvent(user, {
    createdById: existingEvent.createdById,
    departmentId: existingEvent.departmentId,
  });

  const registrationCount = await prisma.eventRegistration.count({
    where: { eventId: id },
  });

  if (registrationCount > 0) {
    throw new ServiceError(
      'Cannot delete event with existing registrations. Please cancel the event instead.',
      400,
    );
  }

  await prisma.event.delete({ where: { id } });
}
