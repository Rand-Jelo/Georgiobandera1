import { D1Database } from '@cloudflare/workers-types';
import { User } from '@/types/database';
import { queryOne, executeDB, queryDB } from '../client';

export async function getUserByEmail(
  db: D1Database,
  email: string
): Promise<User | null> {
  return await queryOne<User>(
    db,
    'SELECT * FROM users WHERE email = ?',
    [email]
  );
}

export async function getUserById(
  db: D1Database,
  id: string
): Promise<User | null> {
  return await queryOne<User>(
    db,
    'SELECT * FROM users WHERE id = ?',
    [id]
  );
}

export async function getUserByVerificationToken(
  db: D1Database,
  token: string
): Promise<User | null> {
  return await queryOne<User>(
    db,
    'SELECT * FROM users WHERE verification_token = ? AND verification_token_expires > unixepoch()',
    [token]
  );
}

export async function getUserByPasswordResetToken(
  db: D1Database,
  token: string
): Promise<User | null> {
  return await queryOne<User>(
    db,
    'SELECT * FROM users WHERE password_reset_token = ? AND password_reset_expires > unixepoch()',
    [token]
  );
}

export async function createUser(
  db: D1Database,
  userData: {
    email: string;
    passwordHash: string;
    name?: string;
    phone?: string;
    isAdmin?: boolean;
    verificationToken?: string;
    verificationTokenExpires?: number;
  }
): Promise<User> {
  const id = crypto.randomUUID();
  
  await executeDB(
    db,
    `INSERT INTO users (id, email, password_hash, name, phone, is_admin, email_verified, verification_token, verification_token_expires)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      userData.email,
      userData.passwordHash,
      userData.name || null,
      userData.phone || null,
      userData.isAdmin ? 1 : 0,
      0, // email_verified defaults to false
      userData.verificationToken || null,
      userData.verificationTokenExpires || null,
    ]
  );

  const user = await getUserById(db, id);
  if (!user) {
    throw new Error('Failed to create user');
  }

  return user;
}

export async function updateUser(
  db: D1Database,
  id: string,
  updates: {
    name?: string;
    phone?: string;
    email?: string;
    isAdmin?: boolean;
    emailVerified?: boolean;
    verificationToken?: string | null;
    verificationTokenExpires?: number | null;
    passwordResetToken?: string | null;
    passwordResetExpires?: number | null;
    passwordHash?: string;
  }
): Promise<void> {
  const fields: string[] = [];
  const values: any[] = [];

  if (updates.name !== undefined) {
    fields.push('name = ?');
    values.push(updates.name);
  }

  if (updates.phone !== undefined) {
    fields.push('phone = ?');
    values.push(updates.phone);
  }

  if (updates.email !== undefined) {
    fields.push('email = ?');
    values.push(updates.email);
  }

  if (updates.isAdmin !== undefined) {
    fields.push('is_admin = ?');
    values.push(updates.isAdmin ? 1 : 0);
  }

  if (updates.emailVerified !== undefined) {
    fields.push('email_verified = ?');
    values.push(updates.emailVerified ? 1 : 0);
  }

  if (updates.verificationToken !== undefined) {
    fields.push('verification_token = ?');
    values.push(updates.verificationToken);
  }

  if (updates.verificationTokenExpires !== undefined) {
    fields.push('verification_token_expires = ?');
    values.push(updates.verificationTokenExpires);
  }

  if (updates.passwordResetToken !== undefined) {
    fields.push('password_reset_token = ?');
    values.push(updates.passwordResetToken);
  }

  if (updates.passwordResetExpires !== undefined) {
    fields.push('password_reset_expires = ?');
    values.push(updates.passwordResetExpires);
  }

  if (updates.passwordHash !== undefined) {
    fields.push('password_hash = ?');
    values.push(updates.passwordHash);
  }

  if (fields.length === 0) {
    return;
  }

  fields.push('updated_at = unixepoch()');
  values.push(id);

  await executeDB(
    db,
    `UPDATE users SET ${fields.join(', ')} WHERE id = ?`,
    values
  );
}

export async function verifyUserEmail(
  db: D1Database,
  userId: string
): Promise<void> {
  await executeDB(
    db,
    `UPDATE users SET 
      email_verified = 1, 
      verification_token = NULL, 
      verification_token_expires = NULL,
      updated_at = unixepoch() 
    WHERE id = ?`,
    [userId]
  );
}

export async function setPasswordResetToken(
  db: D1Database,
  userId: string,
  token: string,
  expiresAt: number
): Promise<void> {
  await executeDB(
    db,
    `UPDATE users SET 
      password_reset_token = ?, 
      password_reset_expires = ?,
      updated_at = unixepoch() 
    WHERE id = ?`,
    [token, expiresAt, userId]
  );
}

export async function clearPasswordResetToken(
  db: D1Database,
  userId: string
): Promise<void> {
  await executeDB(
    db,
    `UPDATE users SET 
      password_reset_token = NULL, 
      password_reset_expires = NULL,
      updated_at = unixepoch() 
    WHERE id = ?`,
    [userId]
  );
}

export async function getAdminUsers(db: D1Database): Promise<User[]> {
  const result = await queryDB<User>(
    db,
    'SELECT * FROM users WHERE is_admin = 1',
    []
  );
  return result.results || [];
}
