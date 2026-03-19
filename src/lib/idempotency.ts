import { createHash } from 'crypto';
import { type NextRequest } from 'next/server';

const IDEMPOTENCY_HEADER = 'idempotency-key';
const DEFAULT_TTL_MS = 24 * 60 * 60 * 1000;

type IdempotencyEntry = {
  fingerprint: string;
  status?: number;
  body?: string;
  contentType?: string;
  pending: boolean;
  expiresAt: number;
};

const idempotencyStore = new Map<string, IdempotencyEntry>();

function stableSerialize(value: unknown): string {
  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map((item) => stableSerialize(item)).join(',')}]`;
  }

  const entries = Object.entries(value as Record<string, unknown>).sort(([a], [b]) =>
    a.localeCompare(b),
  );

  return `{${entries
    .map(([key, val]) => `${JSON.stringify(key)}:${stableSerialize(val)}`)
    .join(',')}}`;
}

function getStoreKey(scope: string, key: string): string {
  return `${scope}:${key}`;
}

function cleanupExpiredEntries() {
  const now = Date.now();
  for (const [key, value] of idempotencyStore.entries()) {
    if (value.expiresAt <= now) {
      idempotencyStore.delete(key);
    }
  }
}

export function getIdempotencyKey(request: NextRequest): string | undefined {
  const key = request.headers.get(IDEMPOTENCY_HEADER)?.trim();
  return key || undefined;
}

export function createIdempotencyFingerprint(payload: unknown): string {
  const serialized = stableSerialize(payload);
  return createHash('sha256').update(serialized).digest('hex');
}

export function getIdempotencyReplay(
  scope: string,
  key: string,
  fingerprint: string,
): Response | null {
  cleanupExpiredEntries();

  const storeKey = getStoreKey(scope, key);
  const existing = idempotencyStore.get(storeKey);
  if (!existing) {
    return null;
  }

  if (existing.fingerprint !== fingerprint) {
    return Response.json(
      {
        success: false,
        error: 'Idempotency key reuse with different payload is not allowed',
      },
      { status: 409 },
    );
  }

  if (existing.pending) {
    return Response.json(
      {
        success: false,
        error: 'Request with this idempotency key is still processing',
      },
      { status: 409 },
    );
  }

  return new Response(existing.body || '', {
    status: existing.status || 200,
    headers: {
      'Content-Type': existing.contentType || 'application/json',
      'X-Idempotent-Replay': 'true',
    },
  });
}

export function reserveIdempotencyKey(
  scope: string,
  key: string,
  fingerprint: string,
  ttlMs = DEFAULT_TTL_MS,
) {
  cleanupExpiredEntries();

  const storeKey = getStoreKey(scope, key);
  idempotencyStore.set(storeKey, {
    fingerprint,
    pending: true,
    expiresAt: Date.now() + ttlMs,
  });
}

export function releaseIdempotencyKey(scope: string, key: string) {
  const storeKey = getStoreKey(scope, key);
  const existing = idempotencyStore.get(storeKey);
  if (existing?.pending) {
    idempotencyStore.delete(storeKey);
  }
}

export async function persistIdempotencyResponse(
  scope: string,
  key: string,
  response: Response,
  ttlMs = DEFAULT_TTL_MS,
): Promise<Response> {
  const storeKey = getStoreKey(scope, key);
  const existing = idempotencyStore.get(storeKey);

  if (!existing) {
    return response;
  }

  if (response.status >= 200 && response.status < 300) {
    const body = await response.clone().text();

    idempotencyStore.set(storeKey, {
      ...existing,
      pending: false,
      status: response.status,
      body,
      contentType: response.headers.get('content-type') || 'application/json',
      expiresAt: Date.now() + ttlMs,
    });
  } else {
    idempotencyStore.delete(storeKey);
  }

  return response;
}
