import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { hashPassword } from '@/lib/auth';
import { z } from 'zod';

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
    const body = await request.json();
    const { token, newPassword } = resetSchema.parse(body);

    const record = await prisma.passwordResetToken.findFirst({
      where: { token },
    });
    if (!record || record.expiresAt < new Date()) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 400 },
      );
    }

    const hashed = await hashPassword(newPassword);
    await prisma.$transaction([
      prisma.user.update({
        where: { id: record.userId },
        data: { password: hashed },
      }),
      prisma.passwordResetToken.delete({ where: { userId: record.userId } }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 },
      );
    }
    console.error('Reset password error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
