import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAssignableRoles } from '@/lib/permissions';
import { sanitizeUserResponse } from '@/lib/user-response';
import {
  requireAnyUserPermission,
  requireAuthenticatedUser,
} from '@/lib/api-guards';
import { buildRequestMeta, writeAuditLog } from '@/lib/audit-log';
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
    const { role: targetRole, permissions } = updateRoleSchema.parse(body);
    const requestMeta = buildRequestMeta(request, authResult.user);

    // Check if current user can assign the target role
    const allowedRoles = getAssignableRoles(authResult.user.role);
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

    await writeAuditLog({
      action: 'USER_ROLE_UPDATED',
      actorId: authResult.user.id,
      actorRole: authResult.user.role,
      resourceType: 'user',
      resourceId: id,
      success: true,
      metadata: {
        assignedRole: targetRole,
        permissionsCount: permissions?.length ?? null,
      },
      requestMeta,
    });

    return NextResponse.json({
      user: sanitizeUserResponse(updated),
      message: 'Role updated',
    });
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
