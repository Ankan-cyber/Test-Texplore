import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { canManageGallery } from '@/lib/permissions';
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
  const resolvedParams = await params;
  console.log('POST params:', resolvedParams);
  return handleApproval(request, resolvedParams);
}

// PATCH /api/gallery/images/[id]/approve - Approve or reject image
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const resolvedParams = await params;
  console.log('PATCH params:', resolvedParams);
  return handleApproval(request, resolvedParams);
}

// Helper function to handle approval logic
async function handleApproval(request: NextRequest, params: { id: string }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 },
      );
    }

    if (!canManageGallery(user.permissions)) {
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
        approvedBy: validatedData.approved ? user.id : null,
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
