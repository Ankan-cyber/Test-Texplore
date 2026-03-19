import { NextResponse } from 'next/server';
import { getCurrentUser, type User } from './auth';
import { hasPermission, type Permission } from './permissions';

type GuardFailure = {
  response: NextResponse;
};

type GuardSuccess = {
  user: User;
};

export type GuardResult = GuardFailure | GuardSuccess;

export async function getOptionalAuthenticatedUser(): Promise<User | null> {
  return getCurrentUser();
}

export async function requireAuthenticatedUser(): Promise<GuardResult> {
  const user = await getCurrentUser();

  if (!user) {
    return {
      response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    };
  }

  return { user };
}

export function requireUserPermission(
  user: User,
  permission: Permission,
): NextResponse | null {
  if (!hasPermission(user.permissions, permission)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  return null;
}

export function requireAnyUserPermission(
  user: User,
  permissions: Permission[],
): NextResponse | null {
  const hasAtLeastOne = permissions.some((permission) =>
    hasPermission(user.permissions, permission),
  );

  if (!hasAtLeastOne) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  return null;
}