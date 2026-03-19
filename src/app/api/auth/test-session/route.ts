import { NextResponse } from 'next/server';
import { getSession, validateAndUpdateSession } from '@/lib/session';
import {
  requireAuthenticatedUser,
  requireUserPermission,
} from '@/lib/api-guards';

export async function GET() {
  try {
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const authResult = await requireAuthenticatedUser();
    if ('response' in authResult) {
      return authResult.response;
    }

    const permissionResponse = requireUserPermission(
      authResult.user,
      'admin:dashboard',
    );
    if (permissionResponse) {
      return permissionResponse;
    }

    // Test session retrieval and refresh flow without exposing sensitive values
    const session = await getSession();
    const validatedSession = await validateAndUpdateSession();

    return NextResponse.json({
      success: true,
      hasSession: Boolean(session),
      refreshedSession: Boolean(validatedSession),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Session test error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Session test failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}
