import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/auth/session';
import { getDB } from '@/lib/db/client';
import { getUserById } from '@/lib/db/queries/users';
import { getMessageById, createMessageReply, updateMessageStatus } from '@/lib/db/queries/messages';
import { sendAdminReplyEmail } from '@/lib/email';

const replySchema = z.object({
  replyText: z.string().min(1, 'Reply cannot be empty'),
  locale: z.string().optional(),
});

/**
 * POST /api/admin/messages/[id]/reply
 * Send a reply to a customer message (admin only)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const db = getDB();
    const user = await getUserById(db, session.userId);

    if (!user || !user.is_admin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const validated = replySchema.parse(body);

    // Get the original message
    const message = await getMessageById(db, id);
    if (!message) {
      return NextResponse.json(
        { error: 'Message not found' },
        { status: 404 }
      );
    }

    // Create the reply in the database
    const reply = await createMessageReply(db, {
      messageId: id,
      replyText: validated.replyText,
      repliedBy: user.id,
      fromAdmin: true,
    });

    // Update message status to 'replied'
    await updateMessageStatus(db, id, 'replied');

    // Send email to customer
    const locale = (validated.locale as 'sv' | 'en') || 'sv';
    await sendAdminReplyEmail({
      to: message.email,
      customerName: message.name,
      originalSubject: message.subject || undefined,
      originalMessage: message.message,
      replyMessage: validated.replyText,
      adminName: user.name || 'Kundtjänst',
      locale,
    });

    return NextResponse.json({
      success: true,
      reply,
      message: 'Reply sent successfully',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Reply error:', error);
    return NextResponse.json(
      { error: 'Failed to send reply' },
      { status: 500 }
    );
  }
}
