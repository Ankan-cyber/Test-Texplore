import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import {
  requireAnyUserPermission,
  requireAuthenticatedUser,
} from '@/lib/api-guards';
import { Role } from '@prisma/client';

export async function GET(_request: NextRequest) {
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

    // Fetch departments
    const departments = await prisma.department.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        displayName: true,
        description: true,
      },
      orderBy: { displayName: 'asc' },
    });

    // Define available roles (from the Role enum)
    const roles = Object.values(Role).map((role) => ({
      id: role,
      name: role,
      displayName:
        role.charAt(0).toUpperCase() + role.slice(1).replace('_', ' '),
      description: getRoleDescription(role),
      level: getRoleLevel(role),
      isGlobal: true,
    }));

    return NextResponse.json({
      departments,
      roles,
    });
  } catch (error) {
    console.error('Error fetching user options:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

// Helper function to get role descriptions
function getRoleDescription(role: Role): string {
  const descriptions: Record<Role, string> = {
    member: 'Basic member with limited permissions',
    coordinator: 'Event coordinator with event management permissions',
    vice_president: 'Vice president with department management permissions',
    president: 'President with full administrative permissions',
    admin: 'System administrator with all permissions',
  };
  return descriptions[role];
}

// Helper function to get role levels (higher number = higher authority)
function getRoleLevel(role: Role): number {
  const levels: Record<Role, number> = {
    member: 1,
    coordinator: 2,
    vice_president: 3,
    president: 4,
    admin: 5,
  };
  return levels[role];
}
