import { D1Database } from '@cloudflare/workers-types';
import { queryOne } from '../client';

export interface HomepageContent {
  id: string;
  section: string;
  title_en: string | null;
  title_sv: string | null;
  subtitle_en: string | null;
  subtitle_sv: string | null;
  description_en: string | null;
  description_sv: string | null;
  created_at: number;
  updated_at: number;
}

/**
 * Get homepage content by section
 */
export async function getHomepageContentBySection(
  db: D1Database,
  section: string
): Promise<HomepageContent | null> {
  return await queryOne<HomepageContent>(
    db,
    'SELECT * FROM homepage_content WHERE section = ?',
    [section]
  );
}

/**
 * Get all homepage content
 */
export async function getAllHomepageContent(
  db: D1Database
): Promise<HomepageContent[]> {
  const result = await db
    .prepare('SELECT * FROM homepage_content ORDER BY section ASC')
    .all<HomepageContent>();
  return result.results || [];
}

/**
 * Upsert homepage content
 */
export async function upsertHomepageContent(
  db: D1Database,
  content: {
    id?: string;
    section: string;
    title_en?: string | null;
    title_sv?: string | null;
    subtitle_en?: string | null;
    subtitle_sv?: string | null;
    description_en?: string | null;
    description_sv?: string | null;
  }
): Promise<HomepageContent> {
  const now = Date.now();
  const id = content.id || `homepage-${content.section}-${now}`;

  // Check if content exists
  const existing = await getHomepageContentBySection(db, content.section);

  if (existing) {
    // Update existing
    await db
      .prepare(
        `UPDATE homepage_content SET
          title_en = ?,
          title_sv = ?,
          subtitle_en = ?,
          subtitle_sv = ?,
          description_en = ?,
          description_sv = ?,
          updated_at = ?
        WHERE section = ?`
      )
      .bind(
        content.title_en ?? null,
        content.title_sv ?? null,
        content.subtitle_en ?? null,
        content.subtitle_sv ?? null,
        content.description_en ?? null,
        content.description_sv ?? null,
        now,
        content.section
      )
      .run();

    const updated = await getHomepageContentBySection(db, content.section);
    return updated!;
  } else {
    // Insert new
    await db
      .prepare(
        `INSERT INTO homepage_content (
          id, section, title_en, title_sv, subtitle_en, subtitle_sv,
          description_en, description_sv, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        id,
        content.section,
        content.title_en ?? null,
        content.title_sv ?? null,
        content.subtitle_en ?? null,
        content.subtitle_sv ?? null,
        content.description_en ?? null,
        content.description_sv ?? null,
        now,
        now
      )
      .run();

    const inserted = await getHomepageContentBySection(db, content.section);
    return inserted!;
  }
}

