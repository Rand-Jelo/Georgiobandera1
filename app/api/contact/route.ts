import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getDB } from '@/lib/db/client';
import { createMessage } from '@/lib/db/queries/messages';
import { sendContactConfirmationEmail, sendAdminNotificationEmail } from '@/lib/email';

const contactSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  subject: z.string().optional(),
  message: z.string().min(10, 'Message must be at least 10 characters'),
  locale: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = contactSchema.parse(body);

    const db = getDB();
    const message = await createMessage(db, {
      name: validated.name,
      email: validated.email,
      subject: validated.subject || null,
      message: validated.message,
    });

    const locale = (validated.locale as 'sv' | 'en') || 'sv';

    // Send confirmation email to customer
    await sendContactConfirmationEmail({
      to: validated.email,
      name: validated.name,
      subject: validated.subject,
      message: validated.message,
      locale,
    });

    // Send notification to admin
    await sendAdminNotificationEmail({
      customerName: validated.name,
      customerEmail: validated.email,
      subject: validated.subject,
      message: validated.message,
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Your message has been sent successfully. We will get back to you soon.',
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Contact form error:', error);
    return NextResponse.json(
      { error: 'Failed to send message. Please try again.' },
      { status: 500 }
    );
  }
}
