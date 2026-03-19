import { NextRequest, NextResponse } from 'next/server';
import { loginUser, getFirstAccessibleAdminRoute } from '@/lib/auth';
import { createSession } from '@/lib/session';
import { checkRateLimit, getClientIp, RATE_LIMIT_CONFIGS } from '@/lib/rate-limit';
import { buildRequestMeta, writeAuditLog } from '@/lib/audit-log';
import { errorResponse, logApiError } from '@/lib/error-envelope';

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting per IP address
    const clientIp = getClientIp(request.headers);
    const rateLimitResponse = checkRateLimit(clientIp, RATE_LIMIT_CONFIGS.LOGIN);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const { email, password } = await request.json();
    const requestMeta = buildRequestMeta(request);

    if (!email || !password) {
      return errorResponse(
        400,
        'Email and password are required',
        'VALIDATION_ERROR',
      );
    }

    const user = await loginUser(email, password);

    if (!user) {
      await writeAuditLog({
        action: 'AUTH_LOGIN_FAILED',
        resourceType: 'auth',
        success: false,
        metadata: { email },
        requestMeta,
      });
      return errorResponse(401, 'Invalid email or password', 'AUTH_REQUIRED');
    }

    if (user.status !== 'APPROVED') {
      return errorResponse(
        403,
        'Account is not approved. Please contact an administrator.',
        'ACCESS_DENIED',
      );
    }

    // Create session for the user
    await createSession(user.id);

    // Get the first accessible admin route for the user
    const firstAccessibleRoute = getFirstAccessibleAdminRoute(user);

    // Return user data (without password)
    const { password: _pass, ...userWithoutPassword } = user;

    await writeAuditLog({
      action: 'AUTH_LOGIN_SUCCESS',
      actorId: user.id,
      actorRole: user.role,
      resourceType: 'auth',
      resourceId: user.id,
      success: true,
      requestMeta,
    });

    return NextResponse.json({
      user: userWithoutPassword,
      message: 'Login successful',
      redirectTo: firstAccessibleRoute || '/admin',
    });
  } catch (error) {
    logApiError('Login error:', error);
    return errorResponse(500, 'Internal server error', 'INTERNAL_ERROR');
  }
}
