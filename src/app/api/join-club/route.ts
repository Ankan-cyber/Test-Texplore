import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import {
  requireAuthenticatedUser,
  requireUserPermission,
} from '@/lib/api-guards';
import { joinClubListQuerySchema, parseQuery } from '@/lib/api-schemas';
import {
  createIdempotencyFingerprint,
  getIdempotencyKey,
  getIdempotencyReplay,
  persistIdempotencyResponse,
  releaseIdempotencyKey,
  reserveIdempotencyKey,
} from '@/lib/idempotency';

// Validation schema for join club application
const joinClubApplicationSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must be less than 50 characters'),
  phoneNumber: z
    .string()
    .min(10, 'Phone number must be at least 10 digits')
    .max(15, 'Phone number must be less than 15 digits'),
  email: z.string().email('Please enter a valid email address'),
  branch: z.string().min(1, 'Please select your branch'),
  year: z.string().min(1, 'Please select your year of study'),
  departments: z
    .array(z.string())
    .min(1, 'Please select at least one department'),
  whyJoin: z
    .string()
    .min(20, 'Please provide a more detailed response (at least 20 characters)')
    .max(500, 'Response must be less than 500 characters'),
});

export async function POST(request: NextRequest) {
  const idempotencyKey = getIdempotencyKey(request);
  const idempotencyScope = 'join-club-application';
  let fingerprint: string | null = null;

  try {
    const body = await request.json();

    // Validate the request body
    const validatedData = joinClubApplicationSchema.parse(body);

    if (idempotencyKey) {
      fingerprint = createIdempotencyFingerprint({
        email: validatedData.email.toLowerCase().trim(),
        branch: validatedData.branch,
        year: validatedData.year,
        departments: validatedData.departments,
      });

      const replayResponse = getIdempotencyReplay(
        idempotencyScope,
        idempotencyKey,
        fingerprint,
      );
      if (replayResponse) {
        return replayResponse;
      }

      reserveIdempotencyKey(idempotencyScope, idempotencyKey, fingerprint);
    }

    // Check if an application already exists for this email
    const existingApplication = await prisma.joinClubApplication.findFirst({
      where: { email: validatedData.email },
    });

    if (existingApplication) {
      return NextResponse.json(
        { error: 'An application with this email already exists' },
        { status: 409 },
      );
    }

    // Create the join club application
    const application = await prisma.joinClubApplication.create({
      data: {
        name: validatedData.name,
        email: validatedData.email,
        phoneNumber: validatedData.phoneNumber,
        branch: validatedData.branch,
        year: validatedData.year,
        departments: validatedData.departments,
        whyJoin: validatedData.whyJoin,
      },
    });

    const response = NextResponse.json(
      {
        message: 'Application submitted successfully',
        applicationId: application.id,
      },
      { status: 201 },
    );

    if (idempotencyKey && fingerprint) {
      return await persistIdempotencyResponse(
        idempotencyScope,
        idempotencyKey,
        response,
      );
    }

    return response;
  } catch (error) {
    if (idempotencyKey) {
      releaseIdempotencyKey(idempotencyScope, idempotencyKey);
    }

    console.error('Error submitting join club application:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.message },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuthenticatedUser();
    if ('response' in authResult) {
      return authResult.response;
    }

    // Check if user has permission to view join club applications
    const permissionResponse = requireUserPermission(
      authResult.user,
      'join-club:view',
    );
    if (permissionResponse) {
      return permissionResponse;
    }

    // Get query parameters
    const query = parseQuery(
      joinClubListQuerySchema,
      new URL(request.url).searchParams,
    );

    // Build where clause
    const where: any = {};
    if (query.status) {
      where.status = query.status;
    }
    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
        { branch: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    // Calculate pagination
    const skip = (query.page - 1) * query.limit;

    // Get applications with pagination
    const [applications, total] = await Promise.all([
      prisma.joinClubApplication.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: query.limit,
      }),
      prisma.joinClubApplication.count({ where }),
    ]);

    return NextResponse.json({
      applications,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    });
  } catch (error) {
    console.error('Error fetching join club applications:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
