-- Product collections junction table (many-to-many relationship)
CREATE TABLE IF NOT EXISTS product_collections (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL,
  collection_id TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (collection_id) REFERENCES collections(id) ON DELETE CASCADE,
  UNIQUE(product_id, collection_id)
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_product_collections_product ON product_collections(product_id);
CREATE INDEX IF NOT EXISTS idx_product_collections_collection ON product_collections(collection_id);
CREATE INDEX IF NOT EXISTS idx_product_collections_sort ON product_collections(collection_id, sort_order);

