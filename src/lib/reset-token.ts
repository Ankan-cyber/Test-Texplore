import { createHash, randomBytes } from 'crypto';

export function generateResetToken(length = 48): string {
  const byteLength = Math.ceil((length * 3) / 4);
  return randomBytes(byteLength).toString('base64url').slice(0, length);
}

export function hashResetToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}