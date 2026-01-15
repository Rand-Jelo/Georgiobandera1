-- Collections table for managing homepage collection cards
CREATE TABLE IF NOT EXISTS collections (
  id TEXT PRIMARY KEY,
  name_en TEXT NOT NULL,
  name_sv TEXT NOT NULL,
  description_en TEXT,
  description_sv TEXT,
  href TEXT NOT NULL,
  image_url TEXT,
  sort_order INTEGER DEFAULT 0,
  active INTEGER DEFAULT 1,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- Insert default collections
INSERT INTO collections (id, name_en, name_sv, description_en, description_sv, href, sort_order)
VALUES 
  ('collection-1', 'Signature Line', 'Signatur Linje', 'Our most beloved formulations', 'Våra mest älskade formler', '/shop?category=shampoo', 1),
  ('collection-2', 'Treatment Collection', 'Behandlingskollektion', 'Deep repair and restoration', 'Djup reparation och återställning', '/shop?category=treatments', 2),
  ('collection-3', 'Styling Essentials', 'Styling Essentials', 'Professional styling products', 'Professionella stylingprodukter', '/shop?category=styling', 3);

-- Index for sorting
CREATE INDEX IF NOT EXISTS idx_collections_sort_order ON collections(sort_order);
CREATE INDEX IF NOT EXISTS idx_collections_active ON collections(active);

