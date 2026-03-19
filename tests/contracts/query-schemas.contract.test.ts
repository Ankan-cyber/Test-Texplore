import assert from 'node:assert/strict';
import test from 'node:test';
import {
  eventsListQuerySchema,
  galleryImagesListQuerySchema,
  joinClubListQuerySchema,
  parseQuery,
} from '../../src/lib/api-schemas';

test('events list query schema uses defaults and coercion', () => {
  const parsed = parseQuery(
    eventsListQuerySchema,
    new URLSearchParams({ status: 'PUBLISHED', limit: '25' }),
  );

  assert.equal(parsed.status, 'PUBLISHED');
  assert.equal(parsed.limit, 25);
  assert.equal(parsed.offset, 0);
});

test('events list query schema rejects out-of-range limit', () => {
  assert.throws(
    () =>
      parseQuery(
        eventsListQuerySchema,
        new URLSearchParams({ limit: '999' }),
      ),
    /Too big|Invalid input/,
  );
});

test('gallery list query schema parses pagination and booleans', () => {
  const parsed = parseQuery(
    galleryImagesListQuerySchema,
    new URLSearchParams({ page: '2', limit: '10', isApproved: 'false' }),
  );

  assert.equal(parsed.page, 2);
  assert.equal(parsed.limit, 10);
  assert.equal(parsed.isApproved, false);
  assert.equal(parsed.sortBy, 'createdAt');
  assert.equal(parsed.sortOrder, 'desc');
});

test('gallery list query schema rejects invalid sortBy', () => {
  assert.throws(
    () =>
      parseQuery(
        galleryImagesListQuerySchema,
        new URLSearchParams({ sortBy: 'unknown' }),
      ),
    /Invalid option|Invalid input/,
  );
});

test('join-club list query schema uses pagination defaults', () => {
  const parsed = parseQuery(joinClubListQuerySchema, new URLSearchParams());

  assert.equal(parsed.page, 1);
  assert.equal(parsed.limit, 20);
  assert.equal(parsed.status, undefined);
});
