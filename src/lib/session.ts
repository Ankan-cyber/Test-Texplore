import { cookies } from 'next/headers';

// Session configuration
export interface SessionConfig {
  timeoutMinutes: number;
  cookieName: string;
  httpOnly: boolean;
  secure: boolean;
  sameSite: 'lax' | 'strict' | 'none';
}

// Default session configuration
export const DEFAULT_SESSION_CONFIG: SessionConfig = {
  timeoutMinutes: parseInt(process.env.SESSION_TIMEOUT_MINUTES || '60'), // 1 hour default
  cookieName: 'session',
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
};

// Session data structure
export interface SessionData {
  userId: string;
  createdAt: number;
  lastActivity: number;
  expiresAt: number;
}

/**
 * Create a new session for a user
 */
export async function createSession(
  userId: string,
  config: Partial<SessionConfig> = {},
): Promise<void> {
  const sessionConfig = { ...DEFAULT_SESSION_CONFIG, ...config };
  const now = Date.now();
  const expiresAt = now + sessionConfig.timeoutMinutes * 60 * 1000;

  const sessionData: SessionData = {
    userId,
    createdAt: now,
    lastActivity: now,
    expiresAt,
  };

  const cookieStore = await cookies();
  cookieStore.set(sessionConfig.cookieName, JSON.stringify(sessionData), {
    httpOnly: sessionConfig.httpOnly,
    secure: sessionConfig.secure,
    sameSite: sessionConfig.sameSite,
    maxAge: sessionConfig.timeoutMinutes * 60, // Convert to seconds
    path: '/',
  });
}

/**
 * Get current session data
 */
export async function getSession(
  config: Partial<SessionConfig> = {},
): Promise<SessionData | null> {
  const sessionConfig = { ...DEFAULT_SESSION_CONFIG, ...config };
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(sessionConfig.cookieName);

  if (!sessionCookie?.value) {
    return null;
  }

  try {
    const sessionData: SessionData = JSON.parse(sessionCookie.value);

    // Check if session has expired
    if (Date.now() > sessionData.expiresAt) {
      await destroySession(config);
      return null;
    }

    return sessionData;
  } catch (error) {
    console.error('Error parsing session data:', error);
    await destroySession(config);
    return null;
  }
}

/**
 * Update session activity timestamp
 */
export async function updateSessionActivity(
  config: Partial<SessionConfig> = {},
): Promise<void> {
  const sessionConfig = { ...DEFAULT_SESSION_CONFIG, ...config };
  const session = await getSession(config);

  if (!session) {
    return;
  }

  const now = Date.now();
  const newExpiresAt = now + sessionConfig.timeoutMinutes * 60 * 1000;

  const updatedSessionData: SessionData = {
    ...session,
    lastActivity: now,
    expiresAt: newExpiresAt,
  };

  const cookieStore = await cookies();
  cookieStore.set(
    sessionConfig.cookieName,
    JSON.stringify(updatedSessionData),
    {
      httpOnly: sessionConfig.httpOnly,
      secure: sessionConfig.secure,
      sameSite: sessionConfig.sameSite,
      maxAge: sessionConfig.timeoutMinutes * 60, // Convert to seconds
      path: '/',
    },
  );
}

/**
 * Destroy the current session
 */
export async function destroySession(
  config: Partial<SessionConfig> = {},
): Promise<void> {
  const sessionConfig = { ...DEFAULT_SESSION_CONFIG, ...config };
  const cookieStore = await cookies();
  cookieStore.delete(sessionConfig.cookieName);
}

/**
 * Check if session is valid and not expired
 */
export async function isSessionValid(
  config: Partial<SessionConfig> = {},
): Promise<boolean> {
  const session = await getSession(config);
  return session !== null;
}

/**
 * Get user ID from session
 */
export async function getSessionUserId(
  config: Partial<SessionConfig> = {},
): Promise<string | null> {
  const session = await getSession(config);
  return session?.userId || null;
}

/**
 * Middleware function to validate session and update activity
 */
export async function validateAndUpdateSession(
  config: Partial<SessionConfig> = {},
): Promise<SessionData | null> {
  const session = await getSession(config);

  if (!session) {
    return null;
  }

  // Update session activity
  await updateSessionActivity(config);

  return session;
}

/**
 * Get session configuration from environment variables
 */
export function getSessionConfig(): SessionConfig {
  return {
    timeoutMinutes: parseInt(process.env.SESSION_TIMEOUT_MINUTES || '60'),
    cookieName: process.env.SESSION_COOKIE_NAME || 'session',
    httpOnly: process.env.SESSION_HTTP_ONLY !== 'false',
    secure: process.env.NODE_ENV === 'production',
    sameSite:
      (process.env.SESSION_SAME_SITE as 'lax' | 'strict' | 'none') || 'lax',
  };
}
