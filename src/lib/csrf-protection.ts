/**
 * CSRF (Cross-Site Request Forgery) protection utility
 * Implements a token + trusted-origin strategy for cookie-authenticated APIs.
 */

import { NextRequest, NextResponse } from 'next/server';

export const CSRF_TOKEN_LENGTH = 32;
export const CSRF_COOKIE_NAME = '__csrf_token';
export const CSRF_HEADER_NAME = 'x-csrf-token';

function normalizeOrigin(value: string): string | null {
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

function normalizeHost(value: string): string | null {
  if (!value) {
    return null;
  }

  const asOrigin = normalizeOrigin(value);
  if (asOrigin) {
    try {
      return new URL(asOrigin).host.toLowerCase();
    } catch {
      return null;
    }
  }

  return value.trim().toLowerCase() || null;
}

function firstHeaderValue(value: string | null): string | null {
  if (!value) {
    return null;
  }

  const first = value.split(',')[0]?.trim();
  return first || null;
}

function buildTrustedOrigins(request: NextRequest): Set<string> {
  const trusted = new Set<string>();

  trusted.add(request.nextUrl.origin);

  const envOrigins = [
    process.env.TRUSTED_ORIGINS,
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined,
  ]
    .filter(Boolean)
    .flatMap((entry) => (entry as string).split(',').map((origin) => origin.trim()));

  for (const origin of envOrigins) {
    const normalized = normalizeOrigin(origin);
    if (normalized) {
      trusted.add(normalized);
    }
  }

  const forwardedHost = firstHeaderValue(request.headers.get('x-forwarded-host'));
  const host = request.headers.get('host');
  const proto = firstHeaderValue(request.headers.get('x-forwarded-proto')) || 'https';

  for (const candidateHost of [forwardedHost, host]) {
    if (candidateHost) {
      const normalized = normalizeOrigin(`${proto}://${candidateHost}`);
      if (normalized) {
        trusted.add(normalized);
      }
    }
  }

  return trusted;
}

function buildTrustedHosts(
  request: NextRequest,
  trustedOrigins: Set<string>,
): Set<string> {
  const trustedHosts = new Set<string>();

  const requestHost = normalizeHost(request.nextUrl.origin);
  if (requestHost) {
    trustedHosts.add(requestHost);
  }

  for (const origin of trustedOrigins) {
    const host = normalizeHost(origin);
    if (host) {
      trustedHosts.add(host);
    }
  }

  const host = normalizeHost(request.headers.get('host') || '');
  const forwardedHost = normalizeHost(
    firstHeaderValue(request.headers.get('x-forwarded-host')) || '',
  );

  if (host) {
    trustedHosts.add(host);
  }

  if (forwardedHost) {
    trustedHosts.add(forwardedHost);
  }

  return trustedHosts;
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

function secureTokenCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  return diff === 0;
}

/**
 * Generate a cryptographically secure CSRF token
 */
export function generateCsrfToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(CSRF_TOKEN_LENGTH));
  return bytesToHex(bytes);
}

/**
 * Validate CSRF token from request
 * Compares token from header with token from cookie
 */
export interface CsrfValidationResult {
  valid: boolean;
  token?: string;
  error?: string;
}

export function validateCsrfToken(
  cookieToken: string | undefined,
  headerToken: string | undefined
): CsrfValidationResult {
  if (!cookieToken) {
    return {
      valid: false,
      error: 'CSRF token missing from cookie',
    };
  }

  if (!headerToken) {
    return {
      valid: false,
      error: 'CSRF token missing from request header',
    };
  }

  // Use constant-time comparison to reduce timing-attack signal.
  const matches = secureTokenCompare(cookieToken, headerToken);

  if (!matches) {
    return {
      valid: false,
      error: 'CSRF token mismatch',
    };
  }

  return {
    valid: true,
    token: cookieToken,
  };
}

/**
 * CSRF error response
 */
export function createCsrfErrorResponse(message = 'CSRF validation failed') {
  return NextResponse.json(
    {
      success: false,
      error: message,
    },
    {
      status: 403,
    }
  );
}

/**
 * Extract CSRF token from request headers
 */
export function getCsrfTokenFromRequest(headers: Headers): string | undefined {
  return headers.get(CSRF_HEADER_NAME) || undefined;
}

/**
 * Set CSRF token cookie (readable by browser JS for header submission).
 */
export function setCsrfTokenCookie(response: NextResponse, token: string) {
  response.cookies.set(CSRF_COOKIE_NAME, token, {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
    maxAge: 60 * 60 * 24,
    path: '/',
  });
}

/**
 * Extract CSRF token from cookies
 */
export function extractCsrfTokenFromCookie(cookieHeader: string | null): string | undefined {
  if (!cookieHeader) return undefined;

  const cookies = cookieHeader.split(';').map((c) => c.trim());
  for (const cookie of cookies) {
    const [name, value] = cookie.split('=');
    if (name === CSRF_COOKIE_NAME) {
      return value;
    }
  }

  return undefined;
}

/**
 * List of HTTP methods that require CSRF protection
 */
export const CSRF_PROTECTED_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE'];

/**
 * Check if request method requires CSRF protection
 */
export function requiresCsrfProtection(method: string): boolean {
  return CSRF_PROTECTED_METHODS.includes(method.toUpperCase());
}

/**
 * List of URL patterns that should skip CSRF validation
 * (e.g., webhooks, public API endpoints)
 */
export const CSRF_BYPASS_PATTERNS = ['/api/webhooks/', '/api/public/'];

/**
 * Check if URL should bypass CSRF validation
 */
export function shouldBypassCsrf(pathname: string): boolean {
  return CSRF_BYPASS_PATTERNS.some((pattern) => pathname.startsWith(pattern));
}

/**
 * Check whether request origin is trusted for this deployment.
 */
export function isTrustedOrigin(request: NextRequest): boolean {
  // Keep development environments usable (localhost, tunnels, codespaces, proxies).
  // Production still uses strict origin checks below.
  if (process.env.NODE_ENV !== 'production') {
    return true;
  }

  const originHeader = firstHeaderValue(request.headers.get('origin'));
  const refererHeader = firstHeaderValue(request.headers.get('referer'));
  const secFetchSite = request.headers.get('sec-fetch-site');
  const trustedOrigins = buildTrustedOrigins(request);
  const trustedHosts = buildTrustedHosts(request, trustedOrigins);

  const isSameSiteFetch =
    secFetchSite && ['same-origin', 'same-site', 'none'].includes(secFetchSite);

  if (originHeader) {
    if (originHeader === 'null') {
      return process.env.NODE_ENV !== 'production' || Boolean(isSameSiteFetch);
    }

    const normalizedOrigin = normalizeOrigin(originHeader);
    if (!normalizedOrigin) {
      return process.env.NODE_ENV !== 'production' || Boolean(isSameSiteFetch);
    }

    if (trustedOrigins.has(normalizedOrigin)) {
      return true;
    }

    const originHost = normalizeHost(normalizedOrigin);
    return originHost ? trustedHosts.has(originHost) : false;
  }

  if (refererHeader) {
    const refererOrigin = normalizeOrigin(refererHeader);
    if (!refererOrigin) {
      return process.env.NODE_ENV !== 'production' || Boolean(isSameSiteFetch);
    }

    if (trustedOrigins.has(refererOrigin)) {
      return true;
    }

    const refererHost = normalizeHost(refererOrigin);
    return refererHost ? trustedHosts.has(refererHost) : false;
  }

  // Some same-site requests (server-side/internal tooling) may omit Origin/Referer.
  // In development, avoid blocking these to keep local flows usable.
  if (process.env.NODE_ENV !== 'production') {
    return true;
  }

  if (secFetchSite && ['same-origin', 'same-site', 'none'].includes(secFetchSite)) {
    return true;
  }

  return false;
}

/**
 * Validate CSRF for state-changing API requests that include session cookies.
 * If a CSRF header token is present, enforce token match.
 * Otherwise, enforce trusted same-origin checks.
 */
export function validateCsrfRequest(request: NextRequest): CsrfValidationResult {
  if (!requiresCsrfProtection(request.method)) {
    return { valid: true };
  }

  const pathname = request.nextUrl.pathname;
  if (shouldBypassCsrf(pathname)) {
    return { valid: true };
  }

  const hasSessionCookie = Boolean(request.cookies.get('session')?.value);
  if (!hasSessionCookie) {
    // Only enforce CSRF on cookie-authenticated requests.
    return { valid: true };
  }

  const cookieToken = request.cookies.get(CSRF_COOKIE_NAME)?.value;
  const headerToken = request.headers.get(CSRF_HEADER_NAME) || undefined;

  if (headerToken) {
    return validateCsrfToken(cookieToken, headerToken);
  }

  if (!isTrustedOrigin(request)) {
    return {
      valid: false,
      error: 'Untrusted request origin',
    };
  }

  return { valid: true };
}
