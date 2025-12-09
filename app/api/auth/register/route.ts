import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { hashPassword } from '@/lib/auth/password';
import { createUser, getUserByEmail } from '@/lib/db/queries/users';
import { setSession } from '@/lib/auth/session';
import { getDB } from '@/lib/db/client';

const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().optional(),
  phone: z.string().optional(),
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

    // Create user
    const user = await createUser(db, {
      email: validated.email,
      passwordHash,
      name: validated.name,
      phone: validated.phone,
    });

    // Set session
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
        },
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
