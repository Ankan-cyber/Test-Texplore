import { NextRequest, NextResponse } from 'next/server';
import {
  requireAuthenticatedUser,
  requireUserPermission,
} from '@/lib/api-guards';
import { prisma } from '@/lib/db';
import { sendAdminNotification } from '@/lib/email';
import { checkRateLimit, getClientIp, RATE_LIMIT_CONFIGS } from '@/lib/rate-limit';
import {
  createIdempotencyFingerprint,
  getIdempotencyKey,
  getIdempotencyReplay,
  persistIdempotencyResponse,
  releaseIdempotencyKey,
  reserveIdempotencyKey,
} from '@/lib/idempotency';

// GET - Fetch all contact submissions (admin only)
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuthenticatedUser();
    if ('response' in authResult) {
      return authResult.response;
    }

    const permissionResponse = requireUserPermission(
      authResult.user,
      'contact:read',
    );
    if (permissionResponse) {
      return permissionResponse;
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    // Build filter
    const filter: any = {};
    if (status && status !== 'all') {
      filter.status = status;
    }

    // Get contact submissions with pagination
    const submissions = await prisma.contactSubmission.findMany({
      where: filter,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Get total count for pagination
    const total = await prisma.contactSubmission.count({ where: filter });

    return NextResponse.json({
      submissions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching contact submissions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

// POST - Create new contact submission (public)
export async function POST(request: NextRequest) {
  const idempotencyKey = getIdempotencyKey(request);
  const idempotencyScope = 'contact-submit';
  let fingerprint: string | null = null;

  try {
    // Apply rate limiting per IP address
    const clientIp = getClientIp(request.headers);
    const rateLimitResponse = checkRateLimit(clientIp, RATE_LIMIT_CONFIGS.CONTACT_SUBMIT);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const body = await request.json();
    const { name, email, message, phone } = body;

    if (idempotencyKey) {
      fingerprint = createIdempotencyFingerprint({
        name,
        email: typeof email === 'string' ? email.toLowerCase().trim() : email,
        message,
        phone,
      });

      const replayResponse = getIdempotencyReplay(
        idempotencyScope,
        idempotencyKey,
        fingerprint,
      );
      if (replayResponse) {
        return replayResponse;
      }

      reserveIdempotencyKey(idempotencyScope, idempotencyKey, fingerprint);
    }

    // Validate required fields
    if (!name || !email || !message) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 },
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 },
      );
    }

    // Check for duplicate submission (same email and subject within 24 hours)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const existingSubmission = await prisma.contactSubmission.findFirst({
      where: {
        email,
        createdAt: {
          gte: oneDayAgo,
        },
      },
    });

    if (existingSubmission) {
      return NextResponse.json(
        { error: 'A similar message was already submitted recently' },
        { status: 409 },
      );
    }

    // Create contact submission
    const submission = await prisma.contactSubmission.create({
      data: {
        name,
        email,
        message,
        // Include phone in notes if provided
        notes: phone ? `Phone: ${phone}` : undefined,
      },
    });

    // Send admin notification (don't block the response if it fails)
    try {
      await sendAdminNotification(submission);
    } catch (emailError) {
      console.error('Failed to send admin notification:', emailError);
    }

    const response = NextResponse.json({
      message: 'Contact form submitted successfully',
      submission,
    });

    if (idempotencyKey && fingerprint) {
      return await persistIdempotencyResponse(
        idempotencyScope,
        idempotencyKey,
        response,
      );
    }

    return response;
  } catch (error) {
    if (idempotencyKey) {
      releaseIdempotencyKey(idempotencyScope, idempotencyKey);
    }

    console.error('Error creating contact submission:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
