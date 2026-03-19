/**
 * API-level CSRF protection helper
 * Use in state-changing API endpoints (POST, PUT, PATCH, DELETE)
 */

import { NextRequest } from 'next/server';
import {
  getCsrfTokenFromRequest,
  extractCsrfTokenFromCookie,
  validateCsrfToken,
  createCsrfErrorResponse,
  shouldBypassCsrf,
} from './csrf-protection';

/**
 * Middleware helper to validate CSRF token in API routes
 * Call this at the start of POST/PUT/PATCH/DELETE handlers
 *
 * @param request - NextRequest object
 * @returns null if CSRF is valid, otherwise returns error Response
 *
 * Usage:
 * ```
 * export async function POST(request: NextRequest) {
 *   const csrfError = await validateApiCsrfToken(request);
 *   if (csrfError) return csrfError;
 *   // ... rest of endpoint logic
 * }
 * ```
 */
export async function validateApiCsrfToken(
  request: NextRequest
): Promise<Response | null> {
  // Check if this endpoint should bypass CSRF validation
  if (shouldBypassCsrf(request.nextUrl.pathname)) {
    return null;
  }

  // Get CSRF tokens from request
  const headerToken = getCsrfTokenFromRequest(request.headers);
  const cookieToken = extractCsrfTokenFromCookie(request.headers.get('cookie'));

  // Validate tokens
  const validation = validateCsrfToken(cookieToken, headerToken);

  if (!validation.valid) {
    return createCsrfErrorResponse();
  }

  return null;
}

/**
 * Helper to extract CSRF token from request for client-side use
 * Send this in response headers so frontend can include it in future requests
 */
export function getCsrfTokenForResponse(
  headers: Headers
): Record<string, string> {
  const token = getCsrfTokenFromRequest(headers) || 
    extractCsrfTokenFromCookie(headers.get('cookie'));

  if (!token) {
    return {};
  }

  return {
    'X-CSRF-Token': token,
  };
}
