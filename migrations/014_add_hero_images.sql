-- Create hero_images table to store hero carousel images
CREATE TABLE IF NOT EXISTS hero_images (
  id TEXT PRIMARY KEY,
  url TEXT NOT NULL,
  alt_text_en TEXT,
  alt_text_sv TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  active INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_hero_images_active ON hero_images(active);
CREATE INDEX IF NOT EXISTS idx_hero_images_sort_order ON hero_images(sort_order);

