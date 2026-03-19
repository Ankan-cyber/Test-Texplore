import { NextRequest, NextResponse } from 'next/server';
import { decodeSessionToken, encodeSessionToken } from '@/lib/session-token';
import {
  generateCsrfToken,
  setCsrfTokenCookie,
  CSRF_COOKIE_NAME,
  validateCsrfRequest,
  createCsrfErrorResponse,
} from '@/lib/csrf-protection';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Enforce CSRF for state-changing API requests using cookie auth.
  if (pathname.startsWith('/api/')) {
    const csrfResult = validateCsrfRequest(request);
    if (!csrfResult.valid) {
      return createCsrfErrorResponse(csrfResult.error);
    }
  }

  // Middleware is scoped to /admin via matcher. Non-admin routes pass through.
  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    try {
      // Get session from cookies
      const sessionCookie = request.cookies.get('session');

      if (!sessionCookie?.value) {
        // No session found, redirect to login
        return NextResponse.redirect(new URL('/auth/login', request.url));
      }

      // Parse and verify session token
      const sessionData = await decodeSessionToken(sessionCookie.value);

      if (!sessionData) {
        const response = NextResponse.redirect(new URL('/auth/login', request.url));
        response.cookies.delete('session');
        return response;
      }

      // Check if session has expired
      if (Date.now() > sessionData.expiresAt) {
        // Session expired, redirect to login
        const response = NextResponse.redirect(
          new URL('/auth/login', request.url),
        );

        // Clear the expired session cookie
        response.cookies.delete('session');

        return response;
      }

      // Session is valid, refresh it by extending the timeout
      const timeoutMinutes = parseInt(
        process.env.SESSION_TIMEOUT_MINUTES || '60',
      );
      const now = Date.now();
      const newExpiresAt = now + timeoutMinutes * 60 * 1000;

      const updatedSessionData = {
        ...sessionData,
        lastActivity: now,
        expiresAt: newExpiresAt,
      };

      const sessionToken = await encodeSessionToken(updatedSessionData);

      // Create response and set updated session cookie
      const response = NextResponse.next();

      // Rotate CSRF token for authenticated sessions.
      const csrfToken = generateCsrfToken();
      setCsrfTokenCookie(response, csrfToken);

      response.cookies.set('session', sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: timeoutMinutes * 60, // Convert to seconds
        path: '/',
      });

      return response;
    } catch (error) {
      console.error('Session validation error:', error);

      // Invalid session, redirect to login
      const response = NextResponse.redirect(
        new URL('/auth/login', request.url),
      );
      response.cookies.delete('session');

      return response;
    }
  }

  // For other routes, continue normally
  const response = NextResponse.next();

  // Ensure browser has CSRF token cookie for future mutating requests.
  if (request.method === 'GET' && !request.cookies.get(CSRF_COOKIE_NAME)?.value) {
    const csrfToken = generateCsrfToken();
    setCsrfTokenCookie(response, csrfToken);
  }

  return response;
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/api/:path*',
    '/auth/:path*',
  ],
};
