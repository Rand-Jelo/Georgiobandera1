-- Create site_images table for storing images for different sections of the website
CREATE TABLE IF NOT EXISTS site_images (
  id TEXT PRIMARY KEY,
  section TEXT NOT NULL UNIQUE,
  url TEXT NOT NULL,
  alt_text_en TEXT,
  alt_text_sv TEXT,
  active INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- Create index for faster queries by section
CREATE INDEX IF NOT EXISTS idx_site_images_section ON site_images(section);
CREATE INDEX IF NOT EXISTS idx_site_images_active ON site_images(active);

