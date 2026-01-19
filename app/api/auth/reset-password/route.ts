import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getDB } from '@/lib/db/client';
import { getUserByPasswordResetToken, updateUser, clearPasswordResetToken } from '@/lib/db/queries/users';
import { hashPassword } from '@/lib/auth/password';

const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = resetPasswordSchema.parse(body);

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

    // Find user by reset token
    let user;
    try {
      user = await getUserByPasswordResetToken(db, validated.token);
    } catch (error: any) {
      console.error('Error finding user by reset token:', error);
      return NextResponse.json(
        { error: 'Failed to validate reset token', details: error?.message },
        { status: 500 }
      );
    }
    
    if (!user) {
      console.error('Reset token not found or expired:', validated.token);
      return NextResponse.json(
        { error: 'Invalid or expired reset token' },
        { status: 400 }
      );
    }

    // Hash new password
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

    // Update password and clear reset token
    try {
      await updateUser(db, user.id, {
        passwordHash,
      });
      await clearPasswordResetToken(db, user.id);
    } catch (error: any) {
      console.error('Error updating password:', error);
      return NextResponse.json(
        { error: 'Failed to update password', details: error?.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Password has been reset successfully',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Reset password error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to reset password', details: errorMessage },
      { status: 500 }
    );
  }
}

