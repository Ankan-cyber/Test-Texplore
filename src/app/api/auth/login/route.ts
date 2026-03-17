import { NextRequest, NextResponse } from 'next/server';
import { loginUser, getFirstAccessibleAdminRoute } from '@/lib/auth';
import { createSession } from '@/lib/session';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 },
      );
    }

    const user = await loginUser(email, password);

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 },
      );
    }

    if (user.status !== 'APPROVED') {
      return NextResponse.json(
        { error: 'Account is not approved. Please contact an administrator.' },
        { status: 403 },
      );
    }

    // Create session for the user
    await createSession(user.id);

    // Get the first accessible admin route for the user
    const firstAccessibleRoute = getFirstAccessibleAdminRoute(user);

    // Return user data (without password)
    const { password: _pass, ...userWithoutPassword } = user;

    return NextResponse.json({
      user: userWithoutPassword,
      message: 'Login successful',
      redirectTo: firstAccessibleRoute || '/admin',
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
