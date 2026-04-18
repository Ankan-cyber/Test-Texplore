import assert from 'node:assert/strict';
import test from 'node:test';
import {
  MAX_RESUME_SIZE_BYTES,
  sanitizeResumeFileName,
  validateResumeFile,
} from '../../src/lib/resume-upload';

test('sanitizeResumeFileName replaces unsafe characters', () => {
  const sanitized = sanitizeResumeFileName('my resume (final) #1.pdf');
  assert.equal(sanitized, 'my_resume__final___1.pdf');
});

test('validateResumeFile returns error when file is missing', () => {
  const result = validateResumeFile(null);
  assert.equal(result, 'No file provided');
});

test('validateResumeFile rejects non-pdf mime type', () => {
  const file = new Blob(['plain-text'], { type: 'text/plain' });
  const result = validateResumeFile(file);
  assert.equal(result, 'Only PDF files are allowed');
});

test('validateResumeFile rejects files over max size', () => {
  const oversized = new Blob(
    [new Uint8Array(MAX_RESUME_SIZE_BYTES + 1)],
    { type: 'application/pdf' },
  );

  const result = validateResumeFile(oversized);
  assert.equal(result, 'File size too large. Maximum size is 5MB.');
});

test('validateResumeFile accepts valid pdf file', () => {
  const valid = new Blob(['%PDF-1.7'], {
    type: 'application/pdf',
  });

  const result = validateResumeFile(valid);
  assert.equal(result, null);
});
