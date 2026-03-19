import { createHash } from 'crypto';
import { type NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { type User } from '@/lib/auth';
import { buildSecurityContext, toRequestMeta } from '@/lib/security-context';

export type AuditAction =
  | 'AUTH_LOGIN_SUCCESS'
  | 'AUTH_LOGIN_FAILED'
  | 'AUTH_PASSWORD_RESET'
  | 'USER_CREATED'
  | 'USER_ROLE_UPDATED'
  | 'USER_STATUS_UPDATED'
  | 'EVENT_UPDATED'
  | 'EVENT_DELETED'
  | 'GALLERY_IMAGE_DELETED'
  | 'GALLERY_FOLDER_DELETED';

export type AuditResourceType = 'auth' | 'user' | 'event' | 'gallery';

export interface AuditEventInput {
  action: AuditAction;
  actorId?: string | null;
  actorRole?: string | null;
  resourceType: AuditResourceType;
  resourceId?: string | null;
  success: boolean;
  metadata?: Record<string, unknown>;
  requestMeta?: {
    ip?: string;
    userAgent?: string;
    method?: string;
    path?: string;
    requestId?: string;
  };
}

type RawFindResult = {
  cursor?: {
    firstBatch?: Array<{ hash?: string }>;
  };
};

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

async function getLatestAuditHash(): Promise<string | null> {
  const result = (await prisma.$runCommandRaw({
    find: 'AuditLog',
    filter: {},
    sort: { createdAt: -1 },
    limit: 1,
  })) as RawFindResult;

  return result.cursor?.firstBatch?.[0]?.hash || null;
}

function computeAuditHash(payload: Record<string, unknown>): string {
  const serialized = stableSerialize(payload);
  return createHash('sha256').update(serialized).digest('hex');
}

export function buildRequestMeta(
  request: NextRequest,
  user?: Pick<User, 'id' | 'role'> | null,
) {
  const context = buildSecurityContext(request, user);
  return toRequestMeta(context);
}

/**
 * Writes an append-only audit record with hash chaining.
 * Failures are swallowed to avoid blocking user-facing operations.
 */
export async function writeAuditLog(input: AuditEventInput): Promise<void> {
  try {
    const createdAt = new Date();
    const createdAtIso = createdAt.toISOString();
    const previousHash = await getLatestAuditHash();

    const hashPayload = {
      action: input.action,
      actorId: input.actorId || null,
      actorRole: input.actorRole || null,
      resourceType: input.resourceType,
      resourceId: input.resourceId || null,
      success: input.success,
      metadata: input.metadata || null,
      requestMeta: input.requestMeta || null,
      createdAt: createdAtIso,
      previousHash,
    };

    const hash = computeAuditHash(hashPayload);

    const insertCommand = {
      insert: 'AuditLog',
      documents: [
        {
          ...hashPayload,
          createdAt: createdAtIso,
          hash,
          schemaVersion: 1,
        },
      ],
    } as unknown as Parameters<typeof prisma.$runCommandRaw>[0];

    await prisma.$runCommandRaw(insertCommand);
  } catch (error) {
    console.error('Audit log write failed:', error);
  }
}
