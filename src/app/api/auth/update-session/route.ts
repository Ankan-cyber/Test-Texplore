import { NextResponse } from 'next/server';
import { validateAndUpdateSession } from '@/lib/session';

export async function POST() {
  try {
    // Validate and update session activity
    const session = await validateAndUpdateSession();

    if (!session) {
      return NextResponse.json(
        { error: 'No valid session found' },
        { status: 401 },
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Session updated successfully',
      refreshed: true,
    });
  } catch (error) {
    console.error('Session update error:', error);
    return NextResponse.json(
      { error: 'Failed to update session' },
      { status: 500 },
    );
  }
}
