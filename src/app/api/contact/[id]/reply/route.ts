import { NextRequest, NextResponse } from 'next/server';
import {
  requireAnyUserPermission,
  requireAuthenticatedUser,
} from '@/lib/api-guards';
import { prisma } from '@/lib/db';
import { sendReplyEmail } from '@/lib/email';

// POST - Reply to a contact submission
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const authResult = await requireAuthenticatedUser();
    if ('response' in authResult) {
      return authResult.response;
    }

    const permissionResponse = requireAnyUserPermission(authResult.user, [
      'contact:read',
      'contact:update',
      'contact:delete',
    ]);
    if (permissionResponse) {
      return permissionResponse;
    }

    const { id } = await params;
    const body = await request.json();
    const { replyText, status } = body;

    if (!replyText || !replyText.trim()) {
      return NextResponse.json(
        { error: 'Reply text is required' },
        { status: 400 },
      );
    }

    // Get the contact submission
    const submission = await prisma.contactSubmission.findUnique({
      where: { id },
    });

    if (!submission) {
      return NextResponse.json(
        { error: 'Contact submission not found' },
        { status: 404 },
      );
    }

    // Update the submission with reply
    const updatedSubmission = await prisma.contactSubmission.update({
      where: { id },
      data: {
        replyText: replyText.trim(),
        hasReply: true,
        repliedBy: authResult.user.id,
        repliedAt: new Date(),
        status: status || 'RESOLVED',
      },
    });

    // Send email reply
    try {
      await sendReplyEmail({
        to: submission.email,
        toName: submission.name,
        subject: `Re: ${submission.name}`,
        originalMessage: submission.message,
        replyText: replyText.trim(),
        repliedBy: authResult.user.name || authResult.user.email,
      });
    } catch (emailError) {
      console.error('Failed to send email reply:', emailError);
      // Don't fail the request if email fails, but log it
    }

    return NextResponse.json({
      message: 'Reply sent successfully',
      submission: updatedSubmission,
    });
  } catch (error) {
    console.error('Error replying to contact submission:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
