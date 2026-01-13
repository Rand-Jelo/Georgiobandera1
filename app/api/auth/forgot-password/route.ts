import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getDB } from '@/lib/db/client';
import { getUserByEmail, setPasswordResetToken } from '@/lib/db/queries/users';
import { sendPasswordResetEmail } from '@/lib/email';

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
  locale: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = forgotPasswordSchema.parse(body);

    const db = getDB();

    // Find user by email
    const user = await getUserByEmail(db, validated.email);
    
    // Always return success to prevent email enumeration
    if (!user) {
      return NextResponse.json({
        success: true,
        message: 'If an account exists with this email, a password reset link has been sent.',
      });
    }

    // Generate password reset token
    const resetToken = crypto.randomUUID();
    const resetTokenExpires = Math.floor(Date.now() / 1000) + (60 * 60); // 1 hour

    // Save token to user
    await setPasswordResetToken(db, user.id, resetToken, resetTokenExpires);

    // Build reset URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://georgiobandera.se';
    const locale = validated.locale || 'sv';
    const resetUrl = `${baseUrl}/${locale}/reset-password?token=${resetToken}`;

    // Send password reset email
    await sendPasswordResetEmail({
      to: user.email,
      name: user.name || user.email.split('@')[0],
      resetUrl,
      locale: (locale as 'sv' | 'en') || 'sv',
    });

    return NextResponse.json({
      success: true,
      message: 'If an account exists with this email, a password reset link has been sent.',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Forgot password error:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}

