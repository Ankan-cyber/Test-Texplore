import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { sanitizeUserResponse } from '@/lib/user-response';
import {
  requireAnyUserPermission,
  requireAuthenticatedUser,
} from '@/lib/api-guards';
import { buildRequestMeta, writeAuditLog } from '@/lib/audit-log';
import { z } from 'zod';

const updateStatusSchema = z.object({
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED']),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const authResult = await requireAuthenticatedUser();
    if ('response' in authResult) {
      return authResult.response;
    }

    const permissionResponse = requireAnyUserPermission(authResult.user, [
      'user:create',
      'user:update',
      'user:delete',
      'user:approve',
    ]);
    if (permissionResponse) {
      return permissionResponse;
    }

    const { id } = await params;
    const body = await request.json();
    const validatedData = updateStatusSchema.parse(body);
    const requestMeta = buildRequestMeta(request, authResult.user);

    // Update user status
    const updatedUser = await prisma.user.update({
      where: { id },
      data: { status: validatedData.status },
      include: {
        department: true,
        profile: true,
      },
    });

    await writeAuditLog({
      action: 'USER_STATUS_UPDATED',
      actorId: authResult.user.id,
      actorRole: authResult.user.role,
      resourceType: 'user',
      resourceId: id,
      success: true,
      metadata: {
        status: validatedData.status,
      },
      requestMeta,
    });

    return NextResponse.json({
      user: sanitizeUserResponse(updatedUser),
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
