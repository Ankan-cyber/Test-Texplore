import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import {
  requireAuthenticatedUser,
} from '@/lib/api-guards';
import { hasPermission } from '@/lib/permissions';

/**
 * GET /api/admin/security-logs/stats
 *
 * Returns aggregate counters / top-N facets for the SIEM dashboard header.
 */

type RawFindResult = {
  cursor?: {
    firstBatch?: Array<Record<string, unknown>>;
  };
};
type RawCountResult = { n?: number };
type RawAggregateResult = {
  cursor?: { firstBatch?: Array<{ _id: unknown; count: number }> };
};

function hoursAgo(h: number): string {
  return new Date(Date.now() - h * 60 * 60 * 1000).toISOString();
}

export async function GET() {
  const authResult = await requireAuthenticatedUser();
  if ('response' in authResult) return authResult.response;

  const canView =
    hasPermission(authResult.user.permissions, 'security:logs:read') ||
    authResult.user.role === 'admin';
  if (!canView) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const last24h = hoursAgo(24);
    const last7d = hoursAgo(24 * 7);

    const [
      totalCountRaw,
      last24hCountRaw,
      last7dCountRaw,
      failed24hCountRaw,
      failedLoginsRaw,
      topActionsRaw,
      topActorsRaw,
      latestRaw,
    ] = await Promise.all([
      prisma.$runCommandRaw({ count: 'AuditLog', query: {} }) as Promise<RawCountResult>,
      prisma.$runCommandRaw({
        count: 'AuditLog',
        query: { createdAt: { $gte: last24h } },
      }) as Promise<RawCountResult>,
      prisma.$runCommandRaw({
        count: 'AuditLog',
        query: { createdAt: { $gte: last7d } },
      }) as Promise<RawCountResult>,
      prisma.$runCommandRaw({
        count: 'AuditLog',
        query: { createdAt: { $gte: last24h }, success: false },
      }) as Promise<RawCountResult>,
      prisma.$runCommandRaw({
        count: 'AuditLog',
        query: {
          action: 'AUTH_LOGIN_FAILED',
          createdAt: { $gte: last7d },
        },
      }) as Promise<RawCountResult>,
      prisma.$runCommandRaw({
        aggregate: 'AuditLog',
        pipeline: [
          { $match: { createdAt: { $gte: last7d } } },
          { $group: { _id: '$action', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 5 },
        ],
        cursor: {},
      }) as Promise<RawAggregateResult>,
      prisma.$runCommandRaw({
        aggregate: 'AuditLog',
        pipeline: [
          {
            $match: {
              createdAt: { $gte: last7d },
              actorId: { $ne: null },
            },
          },
          { $group: { _id: '$actorId', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 5 },
        ],
        cursor: {},
      }) as Promise<RawAggregateResult>,
      prisma.$runCommandRaw({
        find: 'AuditLog',
        filter: {},
        sort: { createdAt: -1 },
        limit: 1,
      }) as Promise<RawFindResult>,
    ]);

    const topActions = (topActionsRaw.cursor?.firstBatch || []).map((r) => ({
      action: String(r._id),
      count: r.count,
    }));

    const topActors = (topActorsRaw.cursor?.firstBatch || []).map((r) => ({
      actorId: String(r._id),
      count: r.count,
    }));

    // Resolve top actor names
    const actorIds = topActors.map((a) => a.actorId);
    const usersMap = new Map<string, { name: string; email: string; role: string }>();
    if (actorIds.length > 0) {
      const users = await prisma.user.findMany({
        where: { id: { in: actorIds } },
        select: { id: true, name: true, email: true, role: true },
      });
      users.forEach((u) => usersMap.set(u.id, u));
    }
    const topActorsResolved = topActors.map((a) => ({
      ...a,
      name: usersMap.get(a.actorId)?.name || null,
      email: usersMap.get(a.actorId)?.email || null,
      role: usersMap.get(a.actorId)?.role || null,
    }));

    const latestRow = latestRaw.cursor?.firstBatch?.[0];
    const latestAt =
      typeof latestRow?.createdAt === 'string' ? latestRow.createdAt : null;

    return NextResponse.json({
      total: totalCountRaw.n || 0,
      last24h: last24hCountRaw.n || 0,
      last7d: last7dCountRaw.n || 0,
      failed24h: failed24hCountRaw.n || 0,
      failedLogins7d: failedLoginsRaw.n || 0,
      topActions,
      topActors: topActorsResolved,
      latestAt,
      windows: { last24h, last7d },
    });
  } catch (error) {
    console.error('Failed to compute security log stats:', error);
    return NextResponse.json(
      { error: 'Failed to compute security log stats' },
      { status: 500 },
    );
  }
}
