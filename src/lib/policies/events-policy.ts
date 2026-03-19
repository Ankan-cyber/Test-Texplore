import { type User } from '@/lib/auth';
import { ServiceError } from '@/lib/services/service-error';
import { isAdminLike } from './common-policy';

type EventPolicyResource = {
  createdById: string;
  departmentId: string | null;
};

export function canReadAllEventStates(user: User | null): boolean {
  if (!user) {
    return false;
  }

  return isAdminLike(user) || user.permissions.includes('event:read');
}

export function assertCanCreateEventInDepartment(
  user: User,
  targetDepartmentId?: string | null,
) {
  if (!targetDepartmentId) {
    return;
  }

  if (isAdminLike(user)) {
    return;
  }

  if (user.departmentId !== targetDepartmentId) {
    throw new ServiceError(
      'You can only create events for your assigned department',
      403,
    );
  }
}

export function assertCanModifyEvent(user: User, event: EventPolicyResource) {
  if (isAdminLike(user)) {
    return;
  }

  if (event.createdById === user.id) {
    return;
  }

  if (event.departmentId && user.departmentId === event.departmentId) {
    return;
  }

  if (event.departmentId) {
    throw new ServiceError(
      'You can only manage events from your assigned department',
      403,
    );
  }

  throw new ServiceError(
    'You can only manage events you created or events from your department',
    403,
  );
}

export function assertCanReassignEventDepartment(
  user: User,
  targetDepartmentId: string,
) {
  if (isAdminLike(user)) {
    return;
  }

  if (user.departmentId !== targetDepartmentId) {
    throw new ServiceError(
      'You can only assign events to your assigned department',
      403,
    );
  }
}
