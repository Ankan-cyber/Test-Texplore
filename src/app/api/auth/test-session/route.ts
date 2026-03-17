import { NextResponse } from 'next/server';
import { getSession, validateAndUpdateSession } from '@/lib/session';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    // Test session retrieval
    const session = await getSession();

    // Test session validation and update
    const validatedSession = await validateAndUpdateSession();

    // Test user retrieval
    const user = await getCurrentUser();

    return NextResponse.json({
      success: true,
      session: session
        ? {
            userId: session.userId,
            createdAt: new Date(session.createdAt).toISOString(),
            lastActivity: new Date(session.lastActivity).toISOString(),
            expiresAt: new Date(session.expiresAt).toISOString(),
            isExpired: Date.now() > session.expiresAt,
          }
        : null,
      validatedSession: validatedSession
        ? {
            userId: validatedSession.userId,
            lastActivity: new Date(validatedSession.lastActivity).toISOString(),
            expiresAt: new Date(validatedSession.expiresAt).toISOString(),
          }
        : null,
      user: user
        ? {
            id: user.id,
            email: user.email,
            name: user.name,
            status: user.status,
          }
        : null,
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
