import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { getAssignableRoles } from '@/lib/permissions';
import { z } from 'zod';

const updateRoleSchema = z.object({
  role: z.enum([
    'member',
    'coordinator',
    'vice_president',
    'president',
    'admin',
  ]),
  permissions: z.array(z.string()).optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const authUser = await getCurrentUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { role: targetRole, permissions } = updateRoleSchema.parse(body);

    // Check if current user can assign the target role
    const allowedRoles = getAssignableRoles(authUser.role);
    if (!allowedRoles.includes(targetRole)) {
      return NextResponse.json(
        { error: 'You are not allowed to assign this role' },
        { status: 403 },
      );
    }

    const updateData: any = { role: targetRole };
    if (permissions !== undefined) {
      updateData.permissions = permissions;
    }

    const updated = await prisma.user.update({
      where: { id },
      data: updateData,
      include: { department: true, profile: true },
    });

    return NextResponse.json({ user: updated, message: 'Role updated' });
  } catch (error) {
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
