export interface SessionPayload {
  userId: string;
  createdAt: number;
  lastActivity: number;
  expiresAt: number;
}

const encoder = new TextEncoder();

function toBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  const base64 = btoa(binary);
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function fromBase64Url(input: string): ArrayBuffer {
  const normalized = input.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized.padEnd(
    normalized.length + ((4 - (normalized.length % 4)) % 4),
    '=',
  );
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

function getSessionSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (secret) {
    return secret;
  }

  if (process.env.NODE_ENV !== 'production') {
    return 'dev-only-session-secret-change-me';
  }

  throw new Error('SESSION_SECRET is required in production');
}

async function getSigningKey() {
  return crypto.subtle.importKey(
    'raw',
    encoder.encode(getSessionSecret()),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify'],
  );
}

function isValidSessionPayload(payload: unknown): payload is SessionPayload {
  if (!payload || typeof payload !== 'object') {
    return false;
  }

  const data = payload as Partial<SessionPayload>;

  return (
    typeof data.userId === 'string' &&
    typeof data.createdAt === 'number' &&
    typeof data.lastActivity === 'number' &&
    typeof data.expiresAt === 'number'
  );
}

export async function encodeSessionToken(payload: SessionPayload): Promise<string> {
  const payloadBytes = encoder.encode(JSON.stringify(payload));
  const payloadPart = toBase64Url(payloadBytes);
  const key = await getSigningKey();
  const signatureBuffer = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(payloadPart),
  );
  const signaturePart = toBase64Url(new Uint8Array(signatureBuffer));

  return `${payloadPart}.${signaturePart}`;
}

export async function decodeSessionToken(
  token: string,
): Promise<SessionPayload | null> {
  const [payloadPart, signaturePart] = token.split('.');

  if (!payloadPart || !signaturePart) {
    return null;
  }

  try {
    const key = await getSigningKey();
    const isValid = await crypto.subtle.verify(
      'HMAC',
      key,
      fromBase64Url(signaturePart),
      encoder.encode(payloadPart),
    );

    if (!isValid) {
      return null;
    }

    const payloadText = new TextDecoder().decode(
      new Uint8Array(fromBase64Url(payloadPart)),
    );
    const payload = JSON.parse(payloadText);

    if (!isValidSessionPayload(payload)) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}