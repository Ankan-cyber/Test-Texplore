import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { canManageContact } from '@/lib/permissions';
import { prisma } from '@/lib/db';
import { sendReplyEmail } from '@/lib/email';

// POST - Reply to a contact submission
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!canManageContact(user.permissions)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
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
        repliedBy: user.id,
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
        repliedBy: user.name || user.email,
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
