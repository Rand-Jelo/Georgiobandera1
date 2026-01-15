-- Homepage content table for managing editable homepage text content
CREATE TABLE IF NOT EXISTS homepage_content (
  id TEXT PRIMARY KEY,
  section TEXT NOT NULL UNIQUE,
  title_en TEXT,
  title_sv TEXT,
  subtitle_en TEXT,
  subtitle_sv TEXT,
  description_en TEXT,
  description_sv TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- Insert default content for "Discover Our Range" section
INSERT INTO homepage_content (id, section, title_en, title_sv, subtitle_en, subtitle_sv)
VALUES (
  'collections-section',
  'collections',
  'Discover Our Range',
  'Upptäck Vårt Sortiment',
  'Explore Collections',
  'Utforska Kollektioner'
);

