  import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { hashPassword } from '@/lib/auth';
import { hashResetToken } from '@/lib/reset-token';
import { z } from 'zod';
import { checkRateLimit, getClientIp, RATE_LIMIT_CONFIGS } from '@/lib/rate-limit';
import { buildRequestMeta, writeAuditLog } from '@/lib/audit-log';
import { errorResponse, logApiError } from '@/lib/error-envelope';

const resetSchema = z
  .object({
    token: z.string(),
    newPassword: z.string().min(8),
    confirmNewPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmNewPassword, {
    message: 'Passwords do not match',
    path: ['confirmNewPassword'],
  });

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting per IP address
    const clientIp = getClientIp(request.headers);
    const rateLimitResponse = checkRateLimit(clientIp, RATE_LIMIT_CONFIGS.PASSWORD_RESET_SUBMIT);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const body = await request.json();
    const { token, newPassword } = resetSchema.parse(body);
    const requestMeta = buildRequestMeta(request);

    const hashedToken = hashResetToken(token);

    const record = await prisma.passwordResetToken.findFirst({
      where: {
        OR: [{ token: hashedToken }, { token }],
      },
    });
    if (!record || record.expiresAt < new Date()) {
      return errorResponse(400, 'Invalid or expired token', 'VALIDATION_ERROR');
    }

    const hashed = await hashPassword(newPassword);
    await prisma.$transaction([
      prisma.user.update({
        where: { id: record.userId },
        data: { password: hashed },
      }),
      prisma.passwordResetToken.delete({ where: { userId: record.userId } }),
    ]);

    await writeAuditLog({
      action: 'AUTH_PASSWORD_RESET',
      actorId: record.userId,
      resourceType: 'auth',
      resourceId: record.userId,
      success: true,
      requestMeta,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse(400, 'Validation error', 'VALIDATION_ERROR', error.issues);
    }
    logApiError('Reset password error:', error);
    return errorResponse(500, 'Internal server error', 'INTERNAL_ERROR');
  }
}
