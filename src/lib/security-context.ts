import { randomUUID } from 'crypto';
import { type NextRequest } from 'next/server';
import { type User } from '@/lib/auth';
import { getClientIp } from '@/lib/rate-limit';

export interface SecurityContext {
  requestId: string;
  method: string;
  path: string;
  ip: string;
  userAgent?: string;
  actorId?: string;
  actorRole?: string;
  isAuthenticated: boolean;
}

export function buildSecurityContext(
  request: NextRequest,
  user?: Pick<User, 'id' | 'role'> | null,
): SecurityContext {
  return {
    requestId: request.headers.get('x-request-id') || randomUUID(),
    method: request.method,
    path: request.nextUrl.pathname,
    ip: getClientIp(request.headers),
    userAgent: request.headers.get('user-agent') || undefined,
    actorId: user?.id,
    actorRole: user?.role,
    isAuthenticated: Boolean(user?.id),
  };
}

export function toRequestMeta(context: SecurityContext) {
  return {
    ip: context.ip,
    userAgent: context.userAgent,
    method: context.method,
    path: context.path,
    requestId: context.requestId,
  };
}
