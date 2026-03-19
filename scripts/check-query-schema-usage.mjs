#!/usr/bin/env node
import { readFileSync } from 'fs';
import { resolve } from 'path';

const checks = [
  {
    file: 'src/app/api/events/route.ts',
    mustInclude: ['eventsListQuerySchema', 'parseQuery('],
    mustNotInclude: ['searchParams.get('],
  },
  {
    file: 'src/app/api/gallery/images/route.ts',
    mustInclude: ['galleryImagesListQuerySchema', 'parseQuery('],
    mustNotInclude: ['searchParams.get('],
  },
  {
    file: 'src/app/api/join-club/route.ts',
    mustInclude: ['joinClubListQuerySchema', 'parseQuery('],
    mustNotInclude: ['searchParams.get('],
  },
];

const failures = [];

for (const check of checks) {
  const absolutePath = resolve(process.cwd(), check.file);
  const content = readFileSync(absolutePath, 'utf8');

  for (const token of check.mustInclude) {
    if (!content.includes(token)) {
      failures.push(`${check.file}: missing required token "${token}"`);
    }
  }

  for (const token of check.mustNotInclude) {
    if (content.includes(token)) {
      failures.push(
        `${check.file}: contains disallowed token "${token}"; use shared parseQuery schema flow instead`,
      );
    }
  }
}

if (failures.length > 0) {
  console.error('Query schema enforcement failed:');
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log('Query schema enforcement passed.');
