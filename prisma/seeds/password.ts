import { randomBytes } from 'crypto';

export type GeneratedSeedPasswords = Record<string, string>;

export function generateSeedPassword(length = 20): string {
  const byteLength = Math.ceil((length * 3) / 4);
  return randomBytes(byteLength).toString('base64url').slice(0, length);
}

export function resolveSeedPassword(
  envKey: string,
  accountLabel: string,
  generatedPasswords: GeneratedSeedPasswords,
): string {
  const envPassword = process.env[envKey];
  if (envPassword) {
    return envPassword;
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error(`${envKey} is required when seeding in production`);
  }

  const generated = generateSeedPassword();
  generatedPasswords[accountLabel] = generated;
  return generated;
}
