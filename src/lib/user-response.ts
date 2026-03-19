type UserWithPassword = {
  password?: unknown;
};

export function sanitizeUserResponse<T extends UserWithPassword>(
  user: T,
): Omit<T, 'password'> {
  const safeUser = { ...user } as T;
  delete (safeUser as UserWithPassword).password;
  return safeUser;
}

export function sanitizeUsersResponse<T extends UserWithPassword>(
  users: T[],
): Array<Omit<T, 'password'>> {
  return users.map((user) => sanitizeUserResponse(user));
}