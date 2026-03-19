import { type User } from '@/lib/auth';
import { ServiceError } from '@/lib/services/service-error';

export function isAdminLike(user: User): boolean {
  return user.role === 'admin' || user.role === 'president';
}

export function assertApprovedUser(user: User) {
  if (user.status !== 'APPROVED') {
    throw new ServiceError('Account is not approved', 403);
  }
}
