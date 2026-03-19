import test from 'node:test';
import assert from 'node:assert/strict';
import { type User } from '../../src/lib/auth';
import {
  assertCanCreateEventInDepartment,
  assertCanManageGalleryImage,
  assertCanModifyEvent,
  assertCanReassignEventDepartment,
  canReadAllEventStates,
} from '../../src/lib/policies';
import { ServiceError } from '../../src/lib/services/service-error';

const baseUser: User = {
  id: 'user-1',
  email: 'member@example.com',
  name: 'Member User',
  role: 'member',
  status: 'APPROVED',
  departmentId: 'dept-1',
  permissions: ['event:read', 'gallery:upload'],
  createdAt: new Date(),
  updatedAt: new Date(),
};

test('canReadAllEventStates allows admins and event:read users', () => {
  const adminUser = {
    ...baseUser,
    role: 'admin' as const,
    permissions: [],
  };

  assert.equal(canReadAllEventStates(null), false);
  assert.equal(canReadAllEventStates(baseUser), true);
  assert.equal(canReadAllEventStates(adminUser), true);
});

test('assertCanCreateEventInDepartment blocks cross-department members', () => {
  assert.doesNotThrow(() =>
    assertCanCreateEventInDepartment(baseUser, baseUser.departmentId),
  );

  assert.throws(
    () => assertCanCreateEventInDepartment(baseUser, 'dept-2'),
    (error) => error instanceof ServiceError && error.statusCode === 403,
  );
});
test('assertCanModifyEvent allows creator and same department users', () => {
  const resource = {
    createdById: 'another-user',
    departmentId: 'dept-1',
  };

  assert.doesNotThrow(() => assertCanModifyEvent(baseUser, resource));

  const otherDepartmentResource = {
    createdById: 'another-user',
    departmentId: 'dept-2',
  };

  assert.throws(
    () => assertCanModifyEvent(baseUser, otherDepartmentResource),
    (error) => error instanceof ServiceError && error.statusCode === 403,
  );
});

test('assertCanReassignEventDepartment requires admin or own department', () => {
  assert.doesNotThrow(() =>
    assertCanReassignEventDepartment(baseUser, baseUser.departmentId || ''),
  );

  assert.throws(
    () => assertCanReassignEventDepartment(baseUser, 'dept-3'),
    (error) => error instanceof ServiceError && error.statusCode === 403,
  );
});

test('assertCanManageGalleryImage allows uploader or admin-like roles', () => {
  assert.doesNotThrow(() =>
    assertCanManageGalleryImage(baseUser, { uploadedBy: baseUser.id }),
  );

  const presidentUser = {
    ...baseUser,
    role: 'president' as const,
  };

  assert.doesNotThrow(() =>
    assertCanManageGalleryImage(presidentUser, { uploadedBy: 'someone-else' }),
  );

  assert.throws(
    () => assertCanManageGalleryImage(baseUser, { uploadedBy: 'someone-else' }),
    (error) => error instanceof ServiceError && error.statusCode === 403,
  );
});
