import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { hashPassword } from '@/lib/auth/password';
import { createUser, getUserByEmail } from '@/lib/db/queries/users';
import { setSession } from '@/lib/auth/session';
import { getDB } from '@/lib/db/client';
import { sendVerificationEmail } from '@/lib/email';

const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().optional(),
  phone: z.string().optional(),
  locale: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = registerSchema.parse(body);

    const db = getDB();

    // Check if user already exists
    const existingUser = await getUserByEmail(db, validated.email);
    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      );
    }

    // Hash password
    const passwordHash = await hashPassword(validated.password);

    // Generate verification token
    const verificationToken = crypto.randomUUID();
    const verificationTokenExpires = Math.floor(Date.now() / 1000) + (24 * 60 * 60); // 24 hours

    // Create user with verification token
    const user = await createUser(db, {
      email: validated.email,
      passwordHash,
      name: validated.name,
      phone: validated.phone,
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

    // Set session (user can use the site but with limited features until verified)
    await setSession({
      userId: user.id,
      email: user.email,
    });

    return NextResponse.json(
      {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          emailVerified: false,
        },
        message: 'Account created. Please check your email to verify your account.',
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

    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Registration failed' },
      { status: 500 }
    );
  }
}
