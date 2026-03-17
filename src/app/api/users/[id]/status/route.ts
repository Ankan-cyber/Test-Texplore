import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { canManageUsers } from '@/lib/permissions';
import { z } from 'zod';

const updateStatusSchema = z.object({
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED']),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!canManageUsers(user.permissions)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const validatedData = updateStatusSchema.parse(body);

    // Update user status
    const updatedUser = await prisma.user.update({
      where: { id },
      data: { status: validatedData.status },
      include: {
        department: true,
        profile: true,
      },
    });

    return NextResponse.json({
      user: updatedUser,
      message: 'User status updated successfully',
    });
  } catch (error) {
    console.error('Error updating user status:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
