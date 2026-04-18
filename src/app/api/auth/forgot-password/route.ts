import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { sendPasswordResetEmail } from '@/lib/email';
import { generateResetToken, hashResetToken } from '@/lib/reset-token';
import { z } from 'zod';
import { checkRateLimit, getClientIp, RATE_LIMIT_CONFIGS } from '@/lib/rate-limit';

const requestSchema = z.object({ email: z.string().email() });

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting per IP address
    const clientIp = getClientIp(request.headers);
    const rateLimitResponse = checkRateLimit(clientIp, RATE_LIMIT_CONFIGS.PASSWORD_RESET_REQUEST);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }
    

    const body = await request.json();
    const { email } = requestSchema.parse(body);

    const user = await prisma.user.findUnique({ where: { email } });
    // Always return success to prevent user enumeration
    if (!user) {
      return NextResponse.json({ success: true });
    }

    const token = generateResetToken();
    const tokenHash = hashResetToken(token);
    const expiresAt = new Date(Date.now() + 1000 * 60 * 15); // 15 minutes

    await prisma.passwordResetToken.upsert({
      where: { userId: user.id },
      update: { token: tokenHash, expiresAt },
      create: { userId: user.id, token: tokenHash, expiresAt },
    });

    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL || '';
    const origin = baseUrl.startsWith('http') ? baseUrl : `${baseUrl}`;
    const resetLink = `${origin}/auth/reset-password?token=${token}`;
    console.log(resetLink)
    await sendPasswordResetEmail(user.email, user.name || '', resetLink);

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
    }
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
