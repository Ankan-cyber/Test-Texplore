import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { sendPasswordResetEmail } from '@/lib/email';
import { z } from 'zod';

const requestSchema = z.object({ email: z.string().email() });

function generateToken(length = 48) {
  const chars =
    'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let token = '';
  for (let i = 0; i < length; i++)
    token += chars[Math.floor(Math.random() * chars.length)];
  return token;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = requestSchema.parse(body);

    const user = await prisma.user.findUnique({ where: { email } });
    // Always return success to prevent user enumeration
    if (!user) {
      return NextResponse.json({ success: true });
    }

    const token = generateToken();
    const expiresAt = new Date(Date.now() + 1000 * 60 * 15); // 15 minutes

    await prisma.passwordResetToken.upsert({
      where: { userId: user.id },
      update: { token, expiresAt },
      create: { userId: user.id, token, expiresAt },
    });

    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL || '';
    const origin = baseUrl.startsWith('http') ? baseUrl : `https://${baseUrl}`;
    const resetLink = `${origin}/auth/reset-password?token=${token}`;
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
