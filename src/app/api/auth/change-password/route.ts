import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyPassword, hashPassword } from '@/lib/auth';
import { requireAuthenticatedUser } from '@/lib/api-guards';
import { z } from 'zod';

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(6, 'Current password is required'),
    newPassword: z
      .string()
      .min(8, 'New password must be at least 8 characters')
      .max(100, 'New password too long')
      .regex(/^(?=.*[A-Za-z])(?=.*\d).+$/, 'Must include letters and numbers'),
    confirmNewPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: 'Passwords do not match',
    path: ['confirmNewPassword'],
  });

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuthenticatedUser();
    if ('response' in authResult) {
      return authResult.response;
    }

    const body = await request.json();
    const { currentPassword, newPassword } = changePasswordSchema.parse(body);

    // Fetch fresh user with password
    const dbUser = await prisma.user.findUnique({
      where: { id: authResult.user.id },
    });
    if (!dbUser || !dbUser.password) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const isValid = await verifyPassword(currentPassword, dbUser.password);
    if (!isValid) {
      return NextResponse.json(
        { error: 'Current password is incorrect' },
        { status: 400 },
      );
    }

    // Prevent reusing the same password
    const isSame = await verifyPassword(newPassword, dbUser.password);
    if (isSame) {
      return NextResponse.json(
        { error: 'New password must be different from current' },
        { status: 400 },
      );
    }

    const hashed = await hashPassword(newPassword);
    await prisma.user.update({
      where: { id: authResult.user.id },
      data: { password: hashed },
    });

    return NextResponse.json({
      success: true,
      message: 'Password updated successfully',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      // Extract the first validation error message for user-friendly display
      const firstError = error.issues[0];
      const errorMessage = firstError?.message || 'Validation error';
      return NextResponse.json(
        { error: errorMessage, details: error.issues },
        { status: 400 },
      );
    }

    console.error('Error changing password:', error);
    return NextResponse.json(
      { error: 'Failed to change password' },
      { status: 500 },
    );
  }
}
