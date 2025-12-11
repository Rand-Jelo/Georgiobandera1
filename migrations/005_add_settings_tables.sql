-- Store settings table (singleton)
CREATE TABLE IF NOT EXISTS store_settings (
  id TEXT PRIMARY KEY,
  store_name TEXT NOT NULL DEFAULT 'Georgio Bandera',
  store_email TEXT NOT NULL,
  store_phone TEXT,
  store_address TEXT,
  store_city TEXT,
  store_postal_code TEXT,
  store_country TEXT,
  currency TEXT NOT NULL DEFAULT 'SEK',
  tax_rate DECIMAL(5, 2) NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- General settings table (singleton)
CREATE TABLE IF NOT EXISTS general_settings (
  id TEXT PRIMARY KEY,
  maintenance_mode BOOLEAN DEFAULT 0,
  allow_registrations BOOLEAN DEFAULT 1,
  default_language TEXT NOT NULL DEFAULT 'en',
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

