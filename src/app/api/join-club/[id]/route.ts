import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import {
  requireAuthenticatedUser,
  requireUserPermission,
} from '@/lib/api-guards';

// MongoDB ObjectId validation regex
const objectIdRegex = /^[0-9a-fA-F]{24}$/;

// Validation schema for updating join club application
const updateApplicationSchema = z.object({
  status: z
    .enum([
      'PENDING',
      'APPROVED',
      'REJECTED',
      'INTERVIEW_SCHEDULED',
      'INTERVIEW_COMPLETED',
    ])
    .optional(),
  reviewNotes: z.string().optional(),
  interviewDate: z.string().datetime().optional(),
});

// Helper function to validate MongoDB ObjectId
function validateObjectId(id: string): boolean {
  return objectIdRegex.test(id);
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    // Validate ObjectId format
    const { id } = await params;
    if (!validateObjectId(id)) {
      return NextResponse.json(
        { error: 'Invalid application ID format' },
        { status: 400 },
      );
    }

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

    // Get the application
    const application = await prisma.joinClubApplication.findUnique({
      where: { id },
    });

    if (!application) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 },
      );
    }

    return NextResponse.json(application);
  } catch (error) {
    console.error('Error fetching join club application:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    // Validate ObjectId format
    const { id } = await params;
    if (!validateObjectId(id)) {
      return NextResponse.json(
        { error: 'Invalid application ID format' },
        { status: 400 },
      );
    }

    const authResult = await requireAuthenticatedUser();
    if ('response' in authResult) {
      return authResult.response;
    }

    // Check if user has permission to manage join club applications
    const permissionResponse = requireUserPermission(
      authResult.user,
      'join-club:manage',
    );
    if (permissionResponse) {
      return permissionResponse;
    }
    const body = await request.json();

    // Validate the request body
    const validatedData = updateApplicationSchema.parse(body);

    // Check if application exists
    const existingApplication = await prisma.joinClubApplication.findUnique({
      where: { id },
    });

    if (!existingApplication) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 },
      );
    }

    // Update the application
    const updatedApplication = await prisma.joinClubApplication.update({
      where: { id },
      data: {
        ...validatedData,
        reviewedBy: authResult.user.id,
        reviewedAt: new Date(),
        ...(validatedData.interviewDate && {
          interviewDate: new Date(validatedData.interviewDate),
        }),
      },
    });

    return NextResponse.json(updatedApplication);
  } catch (error) {
    console.error('Error updating join club application:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.format() },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    // Validate ObjectId format
    const { id } = await params;
    if (!validateObjectId(id)) {
      return NextResponse.json(
        { error: 'Invalid application ID format' },
        { status: 400 },
      );
    }

    const authResult = await requireAuthenticatedUser();
    if ('response' in authResult) {
      return authResult.response;
    }

    // Check if user has permission to delete join club applications
    const permissionResponse = requireUserPermission(
      authResult.user,
      'join-club:delete',
    );
    if (permissionResponse) {
      return permissionResponse;
    }

    // Check if application exists
    const existingApplication = await prisma.joinClubApplication.findUnique({
      where: { id },
    });

    if (!existingApplication) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 },
      );
    }

    // Delete the application
    await prisma.joinClubApplication.delete({
      where: { id },
    });

    return NextResponse.json(
      { message: 'Application deleted successfully' },
      { status: 200 },
    );
  } catch (error) {
    console.error('Error deleting join club application:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
