import { NextResponse } from 'next/server';
import { requireAuthenticatedUser } from '@/lib/api-guards';
import { sanitizeUserResponse } from '@/lib/user-response';

export async function GET() {
  try {
    const authResult = await requireAuthenticatedUser();
    if ('response' in authResult) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    return NextResponse.json({
      user: sanitizeUserResponse(authResult.user),
    });
  } catch (error) {
    console.error('Auth check error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
