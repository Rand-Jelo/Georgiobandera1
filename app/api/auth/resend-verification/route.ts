import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getDB } from '@/lib/db/client';
import { getUserByEmail, updateUser } from '@/lib/db/queries/users';
import { sendVerificationEmail } from '@/lib/email';

const resendSchema = z.object({
  email: z.string().email('Invalid email address'),
  locale: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = resendSchema.parse(body);

    const db = getDB();

    // Find user by email
    const user = await getUserByEmail(db, validated.email);
    
    if (!user) {
      // Don't reveal if email exists or not
      return NextResponse.json({
        success: true,
        message: 'If an account exists with this email, a verification link has been sent.',
      });
    }

    // Check if already verified
    if (user.email_verified) {
      return NextResponse.json({
        success: true,
        message: 'Email is already verified.',
      });
    }

    // Generate new verification token
    const verificationToken = crypto.randomUUID();
    const verificationTokenExpires = Math.floor(Date.now() / 1000) + (24 * 60 * 60); // 24 hours

    // Update user with new token
    await updateUser(db, user.id, {
      verificationToken,
      verificationTokenExpires,
    });

    // Build verification URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://georgiobandera.se';
    const locale = validated.locale || 'sv';
    const verificationUrl = `${baseUrl}/${locale}/verify-email?token=${verificationToken}`;

    // Send verification email
    await sendVerificationEmail({
      to: user.email,
      name: user.name || user.email.split('@')[0],
      verificationUrl,
      locale: (locale as 'sv' | 'en') || 'sv',
    });

    return NextResponse.json({
      success: true,
      message: 'Verification email sent.',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Resend verification error:', error);
    return NextResponse.json(
      { error: 'Failed to resend verification email' },
      { status: 500 }
    );
  }
}

