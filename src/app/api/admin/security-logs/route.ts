import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import {
  requireAuthenticatedUser,
} from '@/lib/api-guards';
import { hasPermission } from '@/lib/permissions';
import { z } from 'zod';

/**
 * GET /api/admin/security-logs
 *
 * Paginated, filterable list of audit log entries. Gated on the
 * `security:logs:read` permission — admins have it by default; a future
 * `security_researcher` role / custom user can be granted only this
 * permission to read logs without any other admin capability.
 */

const querySchema = z.object({
  page: z
    .string()
    .optional()
    .transform((v) => (v ? Math.max(1, parseInt(v, 10)) : 1)),
  limit: z
    .string()
    .optional()
    .transform((v) => {
      const n = v ? parseInt(v, 10) : 50;
      return Math.min(Math.max(n, 1), 200);
    }),
  action: z.string().optional(),
  resourceType: z.string().optional(),
  actorId: z.string().optional(),
  success: z.enum(['true', 'false']).optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  q: z.string().optional(),
});

type RawFindResult = {
  cursor?: {
    firstBatch?: Array<Record<string, unknown>>;
  };
};

type RawCountResult = { n?: number };

export async function GET(request: NextRequest) {
  const authResult = await requireAuthenticatedUser();
  if ('response' in authResult) return authResult.response;

  const canView =
    hasPermission(authResult.user.permissions, 'security:logs:read') ||
    authResult.user.role === 'admin';
  if (!canView) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const parsed = querySchema.safeParse(Object.fromEntries(searchParams));
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid query', details: parsed.error.issues },
      { status: 400 },
    );
  }
  const query = parsed.data;

  const filter: Record<string, unknown> = {};
  if (query.action) filter.action = query.action;
  if (query.resourceType) filter.resourceType = query.resourceType;
  if (query.actorId) filter.actorId = query.actorId;
  if (query.success === 'true') filter.success = true;
  if (query.success === 'false') filter.success = false;

  if (query.from || query.to) {
    const range: Record<string, string> = {};
    if (query.from) range.$gte = new Date(query.from).toISOString();
    if (query.to) range.$lte = new Date(query.to).toISOString();
    filter.createdAt = range;
  }

  if (query.q) {
    const qStr = query.q.trim();
    if (qStr.length > 0) {
      const regex = { $regex: qStr, $options: 'i' };
      filter.$or = [
        { actorId: regex },
        { resourceId: regex },
        { 'requestMeta.ip': regex },
        { 'requestMeta.path': regex },
        { 'requestMeta.userAgent': regex },
        { 'requestMeta.requestId': regex },
      ];
    }
  }

  const skip = (query.page - 1) * query.limit;

  try {
    const [findResult, countResult] = await Promise.all([
      prisma.$runCommandRaw({
        find: 'AuditLog',
        filter: filter as Record<string, any>,
        sort: { createdAt: -1 },
        limit: query.limit,
        skip,
      }) as Promise<RawFindResult>,
      prisma.$runCommandRaw({
        count: 'AuditLog',
        query: filter as Record<string, any>,
      }) as Promise<RawCountResult>,
    ]);

    const rows = findResult.cursor?.firstBatch || [];
    const total = countResult.n || 0;

    // Collect unique actor ids to resolve names
    const actorIds = Array.from(
      new Set(
        rows
          .map((r) => r.actorId)
          .filter((v): v is string => typeof v === 'string' && v.length > 0),
      ),
    );

    const actorsMap = new Map<string, { name: string; email: string }>();
    if (actorIds.length > 0) {
      const users = await prisma.user.findMany({
        where: { id: { in: actorIds } },
        select: { id: true, name: true, email: true },
      });
      users.forEach((u) => {
        actorsMap.set(u.id, { name: u.name, email: u.email });
      });
    }

    const logs = rows.map((r) => {
      const actorId =
        typeof r.actorId === 'string' && r.actorId.length > 0 ? r.actorId : null;
      const actor = actorId ? actorsMap.get(actorId) : undefined;
      return {
        _id: typeof r._id === 'object' ? String(r._id) : r._id,
        action: r.action,
        actorId,
        actorRole: r.actorRole || null,
        actorName: actor?.name || null,
        actorEmail: actor?.email || null,
        resourceType: r.resourceType,
        resourceId: r.resourceId || null,
        success: Boolean(r.success),
        metadata: r.metadata ?? null,
        requestMeta: r.requestMeta ?? null,
        createdAt:
          typeof r.createdAt === 'string'
            ? r.createdAt
            : r.createdAt instanceof Date
              ? r.createdAt.toISOString()
              : null,
        previousHash: r.previousHash || null,
        hash: r.hash || null,
        schemaVersion: r.schemaVersion ?? null,
      };
    });

    return NextResponse.json({
      logs,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        pages: Math.ceil(total / query.limit),
        hasNext: skip + logs.length < total,
        hasPrev: query.page > 1,
      },
    });
  } catch (error) {
    console.error('Failed to read security logs:', error);
    return NextResponse.json(
      { error: 'Failed to read security logs' },
      { status: 500 },
    );
  }
}
