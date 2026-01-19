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

    let db;
    try {
      db = getDB();
    } catch (dbError: any) {
      console.error('Failed to get database:', dbError);
      return NextResponse.json(
        { error: 'Database connection failed', details: dbError?.message },
        { status: 500 }
      );
    }

    // Check if user already exists
    let existingUser;
    try {
      existingUser = await getUserByEmail(db, validated.email);
    } catch (error: any) {
      console.error('Error checking existing user:', error);
      return NextResponse.json(
        { error: 'Failed to check existing user', details: error?.message },
        { status: 500 }
      );
    }

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      );
    }

    // Hash password
    let passwordHash;
    try {
      passwordHash = await hashPassword(validated.password);
    } catch (error: any) {
      console.error('Error hashing password:', error);
      return NextResponse.json(
        { error: 'Failed to hash password', details: error?.message },
        { status: 500 }
      );
    }

    // Generate verification token
    const verificationToken = crypto.randomUUID();
    const verificationTokenExpires = Math.floor(Date.now() / 1000) + (24 * 60 * 60); // 24 hours

    // Create user with verification token
    let user;
    try {
      user = await createUser(db, {
        email: validated.email,
        passwordHash,
        name: validated.name,
        phone: validated.phone,
        verificationToken,
        verificationTokenExpires,
      });
    } catch (error: any) {
      console.error('Error creating user:', error);
      return NextResponse.json(
        { error: 'Failed to create user', details: error?.message },
        { status: 500 }
      );
    }

    // Build verification URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://georgiobandera.se';
    const locale = validated.locale || 'sv';
    const verificationUrl = `${baseUrl}/${locale}/verify-email?token=${verificationToken}`;

    // Send verification email (non-blocking - don't fail registration if email fails)
    try {
      const emailResult = await sendVerificationEmail({
        to: user.email,
        name: user.name || user.email.split('@')[0],
        verificationUrl,
        locale: (locale as 'sv' | 'en') || 'sv',
      });
      
      if (!emailResult.success) {
        console.error('Failed to send verification email:', emailResult.error);
        // Continue anyway - user is created, they can request a new verification email
      }
    } catch (emailError: any) {
      console.error('Error sending verification email:', emailError);
      // Continue anyway - user is created, they can request a new verification email
    }

    // Set session (user can use the site but with limited features until verified)
    try {
      await setSession({
        userId: user.id,
        email: user.email,
      });
    } catch (sessionError: any) {
      console.error('Error setting session:', sessionError);
      // Continue anyway - user is created, session can be set on next login
    }

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
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Registration failed', details: errorMessage },
      { status: 500 }
    );
  }
}
