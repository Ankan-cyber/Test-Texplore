import { NextRequest, NextResponse } from 'next/server';
import {
  requireAuthenticatedUser,
  requireUserPermission,
} from '@/lib/api-guards';
import { aboutReorderSchema } from '@/lib/api-schemas';
import { AboutMembersService } from '@/lib/services/about-members-service';

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuthenticatedUser();
    if ('response' in authResult) {
      return authResult.response;
    }

    const permissionResponse = requireUserPermission(
      authResult.user,
      'about:manage',
    );
    if (permissionResponse) {
      return permissionResponse;
    }

    const payload = aboutReorderSchema.parse(await request.json());
    const reordered = await AboutMembersService.reorderMembers(payload.members);

    return NextResponse.json({
      success: true,
      data: reordered,
    });
  } catch (error) {
    console.error('Error reordering about members:', error);
    return NextResponse.json(
      { error: 'Failed to reorder members' },
      { status: 500 },
    );
  }
}
