import { D1Database } from '@cloudflare/workers-types';
import { User } from '@/types/database';
import { queryOne, executeDB } from '../client';

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

export async function createUser(
  db: D1Database,
  userData: {
    email: string;
    passwordHash: string;
    name?: string;
    phone?: string;
  }
): Promise<User> {
  const id = crypto.randomUUID();
  
  await executeDB(
    db,
    `INSERT INTO users (id, email, password_hash, name, phone)
     VALUES (?, ?, ?, ?, ?)`,
    [
      id,
      userData.email,
      userData.passwordHash,
      userData.name || null,
      userData.phone || null,
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

