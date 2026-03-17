'use server';

import { validateAndUpdateSession, getSession } from './session';
import { getUserById } from './auth';

/**
 * Server action to validate and update session activity
 */
export async function updateSessionActivity() {
  try {
    const session = await validateAndUpdateSession();
    return { success: true, session };
  } catch (error) {
    console.error('Session update error:', error);
    return { success: false, error: 'Failed to update session' };
  }
}

/**
 * Server action to get current session without updating
 */
export async function getCurrentSession() {
  try {
    const session = await getSession();
    return { success: true, session };
  } catch (error) {
    console.error('Session retrieval error:', error);
    return { success: false, error: 'Failed to get session' };
  }
}

/**
 * Server action to get current user with session validation
 */
export async function getCurrentUserAction() {
  try {
    const session = await getSession();

    if (!session) {
      return { success: false, user: null };
    }

    const user = await getUserById(session.userId);
    return { success: true, user };
  } catch (error) {
    console.error('User retrieval error:', error);
    return { success: false, error: 'Failed to get user' };
  }
}
