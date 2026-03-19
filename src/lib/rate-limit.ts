/**
 * In-memory rate limiter for sensitive endpoints
 * Tracks requests by IP address and key (e.g., email for password reset)
 * 
 * In production, consider upgrading to Redis-backed rate limiting for distributed systems
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

interface RateLimitConfig {
  /** Maximum requests allowed in the window */
  maxRequests: number;
  /** Time window in milliseconds */
  windowMs: number;
  /** Optional custom message */
  message?: string;
}

class RateLimiter {
  private store = new Map<string, RateLimitEntry>();
  private cleanupInterval: ReturnType<typeof setInterval> | null = null;

  constructor() {
    // Clean up expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }

  private cleanup() {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (entry.resetTime < now) {
        this.store.delete(key);
      }
    }
  }

  /**
   * Check if a request should be allowed or rate limited
   * @param identifier - Unique identifier (IP, email, user ID, etc.)
   * @param config - Rate limit configuration
   * @returns Object with allowed status and retry info
   */
  check(identifier: string, config: RateLimitConfig) {
    const now = Date.now();
    const entry = this.store.get(identifier);

    if (!entry || entry.resetTime < now) {
      // New entry or window expired
      this.store.set(identifier, {
        count: 1,
        resetTime: now + config.windowMs,
      });
      return {
        allowed: true,
        remaining: config.maxRequests - 1,
        resetTime: now + config.windowMs,
      };
    }

    // Increment existing entry
    entry.count += 1;
    const allowed = entry.count <= config.maxRequests;
    const remaining = Math.max(0, config.maxRequests - entry.count);

    return {
      allowed,
      remaining,
      resetTime: entry.resetTime,
      retryAfter: allowed ? null : Math.ceil((entry.resetTime - now) / 1000),
    };
  }

  /**
   * Reset rate limit for an identifier
   */
  reset(identifier: string) {
    this.store.delete(identifier);
  }

  /**
   * Manually clean up all entries
   */
  destroy() {
      if (this.cleanupInterval) {
        clearInterval(this.cleanupInterval);
      }
    this.store.clear();
  }
}

// Singleton instance
const rateLimiter = new RateLimiter();

/**
 * Predefined rate limit configurations for common endpoints
 */
export const RATE_LIMIT_CONFIGS = {
  // Auth endpoints: stricter limits to prevent brute force
  LOGIN: {
    maxRequests: 5,
    windowMs: 15 * 60 * 1000, // 15 minutes
    message: 'Too many login attempts, please try again later',
  },

  // Password reset: prevent spam and abuse
  PASSWORD_RESET_REQUEST: {
    maxRequests: 3,
    windowMs: 1 * 60 * 60 * 1000, // 1 hour
    message: 'Too many password reset requests, please try again later',
  },

  PASSWORD_RESET_SUBMIT: {
    maxRequests: 5,
    windowMs: 15 * 60 * 1000, // 15 minutes
    message: 'Too many password reset attempts, please try again later',
  },

  // User creation: prevent account enumeration
  USER_CREATION: {
    maxRequests: 3,
    windowMs: 1 * 60 * 60 * 1000, // 1 hour
    message: 'Too many new account attempts, please try again later',
  },

  // Event registration: prevent resource exhaustion
  EVENT_REGISTRATION: {
    maxRequests: 10,
    windowMs: 5 * 60 * 1000, // 5 minutes
    message: 'Too many registration attempts, please slow down',
  },

  // Contact form: prevent spam
  CONTACT_SUBMIT: {
    maxRequests: 3,
    windowMs: 60 * 60 * 1000, // 1 hour
    message: 'Too many contact submissions, please try again later',
  },

  // General API: standard protection
  GENERAL_API: {
    maxRequests: 100,
    windowMs: 15 * 60 * 1000, // 15 minutes
    message: 'Rate limit exceeded, please try again later',
  },
};

/**
 * Extract client IP from request headers
 * Handles X-Forwarded-For in case of proxies
 */
export function getClientIp(headers: Headers | Record<string, string>): string {
  // Handle Headers object (from fetch API) or plain object
  const headerObj = headers instanceof Headers 
    ? Object.fromEntries(headers)
    : headers;

  // Check X-Forwarded-For (proxy environments like Vercel)
  const xForwardedFor = headerObj['x-forwarded-for'];
  if (xForwardedFor) {
    return (xForwardedFor as string).split(',')[0].trim();
  }

  // Check CF-Connecting-IP (Cloudflare)
  if (headerObj['cf-connecting-ip']) {
    return headerObj['cf-connecting-ip'] as string;
  }

  // Fall back to x-real-ip or localhost
  return (headerObj['x-real-ip'] as string) || '127.0.0.1';
}

/**
 * Check rate limit and return response or null
 * @param identifier - Unique identifier for rate limiting
 * @param config - Rate limit configuration
 * @returns Rate limit error response or null if allowed
 */
export function checkRateLimit(
  identifier: string,
  config: (typeof RATE_LIMIT_CONFIGS)[keyof typeof RATE_LIMIT_CONFIGS]
) {
  const result = rateLimiter.check(identifier, config);

  if (!result.allowed) {
    return new Response(
      JSON.stringify({
        success: false,
        error: config.message || 'Rate limit exceeded',
        retryAfter: result.retryAfter,
      }),
      {
        status: 429, // Too Many Requests
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': String(result.retryAfter),
          'X-RateLimit-Limit': String(config.maxRequests),
          'X-RateLimit-Remaining': String(Math.max(0, result.remaining)),
          'X-RateLimit-Reset': String(result.resetTime),
        },
      }
    );
  }

  return null;
}

/**
 * Get rate limit information for response headers
 */
export function getRateLimitHeaders(
  identifier: string,
  config: (typeof RATE_LIMIT_CONFIGS)[keyof typeof RATE_LIMIT_CONFIGS]
) {
  const result = rateLimiter.check(identifier, config);
  return {
    'X-RateLimit-Limit': String(config.maxRequests),
    'X-RateLimit-Remaining': String(Math.max(0, result.remaining)),
    'X-RateLimit-Reset': String(result.resetTime),
  };
}

export default rateLimiter;
