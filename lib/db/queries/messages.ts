import { D1Database } from '@cloudflare/workers-types';
import { Message } from '@/types/database';
import { queryDB, queryOne, executeDB } from '../client';

export async function getMessages(
  db: D1Database,
  options: {
    status?: Message['status'];
    search?: string;
    limit?: number;
    offset?: number;
  } = {}
): Promise<Message[]> {
  let sql = 'SELECT * FROM messages WHERE 1=1';
  const params: any[] = [];

  if (options.status) {
    sql += ' AND status = ?';
    params.push(options.status);
  }

  if (options.search) {
    sql += ' AND (name LIKE ? OR email LIKE ? OR subject LIKE ? OR message LIKE ?)';
    const searchTerm = `%${options.search}%`;
    params.push(searchTerm, searchTerm, searchTerm, searchTerm);
  }

  sql += ' ORDER BY created_at DESC';

  if (options.limit) {
    sql += ' LIMIT ?';
    params.push(options.limit);
  }

  if (options.offset) {
    sql += ' OFFSET ?';
    params.push(options.offset);
  }

  const result = await queryDB<Message>(db, sql, params);
  return result.results || [];
}

export async function getMessageById(
  db: D1Database,
  id: string
): Promise<Message | null> {
  return await queryOne<Message>(
    db,
    'SELECT * FROM messages WHERE id = ?',
    [id]
  );
}

export async function updateMessageStatus(
  db: D1Database,
  id: string,
  status: Message['status']
): Promise<void> {
  await executeDB(
    db,
    'UPDATE messages SET status = ?, updated_at = unixepoch() WHERE id = ?',
    [status, id]
  );
}

export async function createMessage(
  db: D1Database,
  messageData: {
    name: string;
    email: string;
    subject?: string | null;
    message: string;
  }
): Promise<Message> {
  const id = crypto.randomUUID();
  const now = Math.floor(Date.now() / 1000);

  await executeDB(
    db,
    `INSERT INTO messages (id, name, email, subject, message, status, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, 'unread', ?, ?)`,
    [
      id,
      messageData.name,
      messageData.email,
      messageData.subject || null,
      messageData.message,
      now,
      now,
    ]
  );

  const message = await getMessageById(db, id);
  if (!message) {
    throw new Error('Failed to create message');
  }

  return message;
}

