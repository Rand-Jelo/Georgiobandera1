import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getDB } from '@/lib/db/client';
import { getUserByVerificationToken, verifyUserEmail } from '@/lib/db/queries/users';
import { sendWelcomeEmail } from '@/lib/email';

const verifySchema = z.object({
  token: z.string().min(1, 'Token is required'),
  locale: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = verifySchema.parse(body);

    const db = getDB();

    // Find user by verification token
    const user = await getUserByVerificationToken(db, validated.token);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid or expired verification token' },
        { status: 400 }
      );
    }

    // Verify the user's email
    await verifyUserEmail(db, user.id);

    // Send welcome email
    await sendWelcomeEmail({
      to: user.email,
      name: user.name || user.email.split('@')[0],
      locale: (validated.locale as 'sv' | 'en') || 'sv',
    });

    return NextResponse.json({
      success: true,
      message: 'Email verified successfully',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Email verification error:', error);
    return NextResponse.json(
      { error: 'Verification failed' },
      { status: 500 }
    );
  }
}

