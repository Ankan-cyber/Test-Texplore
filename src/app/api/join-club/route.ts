import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/session';
import { hasPermission } from '@/lib/permissions';

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
  try {
    const body = await request.json();

    // Validate the request body
    const validatedData = joinClubApplicationSchema.parse(body);

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

    return NextResponse.json(
      {
        message: 'Application submitted successfully',
        applicationId: application.id,
      },
      { status: 201 },
    );
  } catch (error) {
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
    // Check authentication and permissions
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user has permission to view join club applications
    if (!hasPermission(user.permissions, 'join-club:view')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search');

    // Build where clause
    const where: any = {};
    if (status) {
      where.status = status;
    }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { branch: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Get applications with pagination
    const [applications, total] = await Promise.all([
      prisma.joinClubApplication.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.joinClubApplication.count({ where }),
    ]);

    return NextResponse.json({
      applications,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
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
