export const MAX_RESUME_SIZE_BYTES = 5 * 1024 * 1024;

export function sanitizeResumeFileName(fileName: string): string {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
}

export function validateResumeFile(file: Blob | null): string | null {
  if (!file) {
    return 'No file provided';
  }

  const typedFile = file as File;

  if (typedFile.type !== 'application/pdf') {
    return 'Only PDF files are allowed';
  }

  if (typedFile.size > MAX_RESUME_SIZE_BYTES) {
    return 'File size too large. Maximum size is 5MB.';
  }

  return null;
}