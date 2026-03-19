import { NextRequest, NextResponse } from 'next/server';
import {
  requireAnyUserPermission,
  requireAuthenticatedUser,
} from '@/lib/api-guards';
import { prisma } from '@/lib/db';
import { z } from 'zod';

const approveSchema = z.object({
  approved: z.boolean(),
  notes: z.string().optional(),
});

// POST /api/gallery/images/[id]/approve - Approve or reject image
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  return handleApproval(request, await params);
}

// PATCH /api/gallery/images/[id]/approve - Approve or reject image
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  return handleApproval(request, await params);
}

// Helper function to handle approval logic
async function handleApproval(request: NextRequest, params: { id: string }) {
  try {
    const authResult = await requireAuthenticatedUser();
    if ('response' in authResult) {
      return authResult.response;
    }

    const permissionResponse = requireAnyUserPermission(authResult.user, [
      'gallery:upload',
      'gallery:moderate',
      'gallery:delete',
    ]);
    if (permissionResponse) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = approveSchema.parse(body);

    // Validate params
    if (!params || !params.id) {
      return NextResponse.json({ error: 'Invalid image ID' }, { status: 400 });
    }

    // Check if image exists
    const image = await prisma.galleryImage.findUnique({
      where: { id: params.id },
    });

    if (!image) {
      return NextResponse.json({ error: 'Image not found' }, { status: 404 });
    }

    // Update image approval status
    const updatedImage = await prisma.galleryImage.update({
      where: { id: params.id },
      data: {
        isApproved: validatedData.approved,
        approvedBy: validatedData.approved ? authResult.user.id : null,
        approvedAt: validatedData.approved ? new Date() : null,
      },
      include: {
        uploader: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        folder: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        event: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedImage,
      message: `Image ${validatedData.approved ? 'approved' : 'rejected'} successfully`,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.issues },
        { status: 400 },
      );
    }

    console.error('Error approving image:', error);
    return NextResponse.json(
      { error: 'Failed to approve image' },
      { status: 500 },
    );
  }
}
