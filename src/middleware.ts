import { NextRequest, NextResponse } from 'next/server';

// Routes that don't require authentication
const publicRoutes = [
  '/auth/login',
  '/auth/register',
  '/api/auth/login',
  '/api/auth/register',
  '/unauthorized',
  '/',
  '/about',
  '/contact',
  '/events',
  '/gallery',
  '/ieee',
];

// Routes that require authentication
const protectedRoutes = ['/admin', '/api/auth/logout', '/api/auth/me'];

// Admin routes that require authentication
const adminRoutes = [
  '/admin',
  '/admin/users',
  '/admin/events',
  '/admin/gallery',
  '/admin/contact',
  '/admin/reports',
  '/admin/settings',
  '/api/users',
  '/api/events',
  '/api/gallery',
  '/api/contact',
  '/api/reports',
  '/api/settings',
  '/api/gallery/upload',
];

// Routes that should be ignored by middleware
const ignoredRoutes = ['/_next', '/favicon.ico', '/api/webhooks'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for ignored routes
  if (ignoredRoutes.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Check if route is public
  const isPublicRoute = publicRoutes.some(
    (route) => pathname === route || pathname.startsWith(route + '/'),
  );

  // Check if route is protected
  const isProtectedRoute = protectedRoutes.some(
    (route) => pathname === route || pathname.startsWith(route + '/'),
  );

  // Check if route is admin-specific
  const isAdminRoute = adminRoutes.some((route) => pathname.startsWith(route));

  // Special handling for public API routes - allow public GET for specific routes
  if (
    // Events API routes - public GET access
    pathname === '/api/events' || 
    pathname.startsWith('/api/events/') ||
    
    // Gallery API routes for student portal - public GET access
    pathname === '/api/gallery/folders/public' ||
    pathname === '/api/gallery/images/public' ||
    pathname.startsWith('/api/gallery/images/[id]') ||
    pathname.startsWith('/api/gallery/folders/[id]') ||
    pathname === '/api/gallery/latest'
  ) {
    if (request.method === 'GET') {
      // Allow public access for GET requests to these specific routes
      return NextResponse.next();
    } else {
      // Require authentication for other methods (POST, PUT, DELETE)
      const sessionCookie = request.cookies.get('session');
      if (!sessionCookie?.value) {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 },
        );
      }
      // Continue with authentication check
    }
  }
  
  // Admin-specific routes always require authentication
  if (
    pathname === '/api/gallery/upload' ||
    pathname === '/api/gallery/upload-signature' ||
    pathname === '/api/events/upload-signature' ||
    pathname.startsWith('/api/gallery/images/upload') ||
    pathname.startsWith('/api/gallery/images/[id]/approve')
  ) {
    const sessionCookie = request.cookies.get('session');
    if (!sessionCookie?.value) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 },
      );
    }
  }

  // For public routes, just continue
  if (isPublicRoute) {
    return NextResponse.next();
  }

  // For protected routes, validate and refresh session
  if (isProtectedRoute || isAdminRoute) {
    try {
      // Get session from cookies
      const sessionCookie = request.cookies.get('session');

      if (!sessionCookie?.value) {
        // No session found, redirect to login
        return NextResponse.redirect(new URL('/auth/login', request.url));
      }

      // Parse session data
      const sessionData = JSON.parse(sessionCookie.value);

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

      // For admin routes, we'll do additional validation in the API routes
      // The middleware ensures authentication, and the API routes will handle authorization
      if (isAdminRoute) {
        // Continue to the route - authorization will be handled by the API route
        const response = NextResponse.next();

        // Refresh session
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

        response.cookies.set('session', JSON.stringify(updatedSessionData), {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: timeoutMinutes * 60, // Convert to seconds
          path: '/',
        });

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

      // Create response and set updated session cookie
      const response = NextResponse.next();
      response.cookies.set('session', JSON.stringify(updatedSessionData), {
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
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
