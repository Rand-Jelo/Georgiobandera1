import { D1Database } from '@cloudflare/workers-types';

export interface Migration {
  name: string;
  sql: string;
}

/**
 * Read migration files from the migrations directory
 * Note: In production, these files need to be bundled or read differently
 */
export function getMigrations(): Migration[] {
  // In Cloudflare Pages, we'll need to embed the SQL or use a different approach
  // For now, we'll return the migrations as strings
  const migrations: Migration[] = [
    {
      name: '001_initial_schema.sql',
      sql: `-- Users table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT,
  phone TEXT,
  is_admin BOOLEAN DEFAULT 0,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  name_en TEXT NOT NULL,
  name_sv TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description_en TEXT,
  description_sv TEXT,
  image_url TEXT,
  parent_id TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
  FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL
);

-- Products table
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  name_en TEXT NOT NULL,
  name_sv TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description_en TEXT,
  description_sv TEXT,
  category_id TEXT,
  price DECIMAL(10, 2) NOT NULL,
  compare_at_price DECIMAL(10, 2),
  sku TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  featured BOOLEAN DEFAULT 0,
  stock_quantity INTEGER DEFAULT 0,
  track_inventory BOOLEAN DEFAULT 1,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
);

-- Product variants table
CREATE TABLE IF NOT EXISTS product_variants (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL,
  name_en TEXT,
  name_sv TEXT,
  sku TEXT,
  price DECIMAL(10, 2),
  compare_at_price DECIMAL(10, 2),
  stock_quantity INTEGER DEFAULT 0,
  track_inventory BOOLEAN DEFAULT 1,
  option1_name TEXT,
  option1_value TEXT,
  option2_name TEXT,
  option2_value TEXT,
  option3_name TEXT,
  option3_value TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- Product images table
CREATE TABLE IF NOT EXISTS product_images (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL,
  variant_id TEXT,
  url TEXT NOT NULL,
  alt_text_en TEXT,
  alt_text_sv TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE CASCADE
);

-- Cart items table
CREATE TABLE IF NOT EXISTS cart_items (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  session_id TEXT,
  product_id TEXT NOT NULL,
  variant_id TEXT,
  quantity INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE SET NULL
);

-- Shipping regions table
CREATE TABLE IF NOT EXISTS shipping_regions (
  id TEXT PRIMARY KEY,
  name_en TEXT NOT NULL,
  name_sv TEXT NOT NULL,
  code TEXT NOT NULL,
  base_price DECIMAL(10, 2) NOT NULL,
  free_shipping_threshold DECIMAL(10, 2),
  active BOOLEAN DEFAULT 1,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  order_number TEXT UNIQUE NOT NULL,
  user_id TEXT,
  email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  payment_method TEXT,
  payment_status TEXT NOT NULL DEFAULT 'pending',
  payment_intent_id TEXT,
  subtotal DECIMAL(10, 2) NOT NULL,
  shipping_cost DECIMAL(10, 2) NOT NULL,
  tax DECIMAL(10, 2) NOT NULL,
  total DECIMAL(10, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'SEK',
  shipping_region_id TEXT,
  shipping_name TEXT NOT NULL,
  shipping_address_line1 TEXT NOT NULL,
  shipping_address_line2 TEXT,
  shipping_city TEXT NOT NULL,
  shipping_postal_code TEXT NOT NULL,
  shipping_country TEXT NOT NULL,
  shipping_phone TEXT,
  tracking_number TEXT,
  notes TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (shipping_region_id) REFERENCES shipping_regions(id) ON DELETE SET NULL
);

-- Order items table
CREATE TABLE IF NOT EXISTS order_items (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  variant_id TEXT,
  product_name TEXT NOT NULL,
  variant_name TEXT,
  sku TEXT,
  price DECIMAL(10, 2) NOT NULL,
  quantity INTEGER NOT NULL,
  total DECIMAL(10, 2) NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE SET NULL
);

-- Messages table (contact form)
CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'unread',
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_variants_product ON product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_user ON cart_items(user_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_session ON cart_items(session_id);
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_messages_status ON messages(status);`,
    },
    {
      name: '003_add_admin_role.sql',
      sql: `-- Add is_admin column to users table if it doesn't exist
-- Note: SQLite doesn't support IF NOT EXISTS for ALTER TABLE ADD COLUMN
-- So we'll use a workaround by checking if the column exists first
-- This migration is safe to run multiple times`,
    },
    {
      name: '005_add_settings_tables.sql',
      sql: `-- Store settings table (singleton)
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
);`,
    },
    {
      name: '006_add_discount_codes.sql',
      sql: `-- Discount codes table
CREATE TABLE IF NOT EXISTS discount_codes (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  description TEXT,
  discount_type TEXT NOT NULL,
  discount_value DECIMAL(10, 2) NOT NULL,
  minimum_purchase DECIMAL(10, 2) DEFAULT 0,
  maximum_discount DECIMAL(10, 2),
  usage_limit INTEGER,
  usage_count INTEGER DEFAULT 0,
  user_usage_limit INTEGER DEFAULT 1,
  valid_from INTEGER,
  valid_until INTEGER,
  active BOOLEAN DEFAULT 1,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- Discount code usage tracking table (without foreign keys - SQLite doesn't support adding FKs to existing tables easily)
-- Foreign key constraints are enforced at application level
CREATE TABLE IF NOT EXISTS discount_code_usage (
  id TEXT PRIMARY KEY,
  discount_code_id TEXT NOT NULL,
  order_id TEXT NOT NULL,
  user_id TEXT,
  email TEXT NOT NULL,
  discount_amount DECIMAL(10, 2) NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_discount_codes_code ON discount_codes(code);
CREATE INDEX IF NOT EXISTS idx_discount_codes_active ON discount_codes(active);
CREATE INDEX IF NOT EXISTS idx_discount_code_usage_code ON discount_code_usage(discount_code_id);
CREATE INDEX IF NOT EXISTS idx_discount_code_usage_order ON discount_code_usage(order_id);
CREATE INDEX IF NOT EXISTS idx_discount_code_usage_user ON discount_code_usage(user_id);`,
    },
    {
      name: '007_add_product_reviews.sql',
      sql: `-- Product reviews table
CREATE TABLE IF NOT EXISTS product_reviews (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL,
  user_id TEXT,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT,
  review_text TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  helpful_count INTEGER DEFAULT 0,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_reviews_product ON product_reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_status ON product_reviews(status);
CREATE INDEX IF NOT EXISTS idx_reviews_user ON product_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON product_reviews(rating);`,
    },
    {
      name: '008_add_wishlist.sql',
      sql: `-- Wishlist table
CREATE TABLE IF NOT EXISTS wishlist (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  UNIQUE(user_id, product_id)
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_wishlist_user ON wishlist(user_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_product ON wishlist(product_id);`,
    },
    {
      name: '009_add_price_alerts.sql',
      sql: `-- Price alerts table
CREATE TABLE IF NOT EXISTS price_alerts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  target_price DECIMAL(10, 2) NOT NULL,
  current_price DECIMAL(10, 2) NOT NULL,
  notified BOOLEAN DEFAULT 0,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  UNIQUE(user_id, product_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_price_alerts_user ON price_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_price_alerts_product ON price_alerts(product_id);
CREATE INDEX IF NOT EXISTS idx_price_alerts_notified ON price_alerts(notified);`,
    },
    {
      name: '011_add_shipping_region_countries.sql',
      sql: `-- Add countries column to shipping_regions table
-- This stores a JSON array of ISO country codes (e.g., ["SE"], ["AT", "BE", "DE", ...], ["US", "CA", ...])
ALTER TABLE shipping_regions ADD COLUMN countries TEXT DEFAULT '[]';

-- Update existing regions with default country assignments based on their codes
-- SE region gets SE
UPDATE shipping_regions SET countries = '["SE"]' WHERE code = 'SE';

-- EU region gets all EU countries
UPDATE shipping_regions SET countries = '["AT","BE","BG","HR","CY","CZ","DK","EE","FI","FR","DE","GR","HU","IE","IT","LV","LT","LU","MT","NL","PL","PT","RO","SK","SI","ES"]' WHERE code = 'EU';

-- WORLD region gets empty array (will match any country not in other regions)
UPDATE shipping_regions SET countries = '[]' WHERE code = 'WORLD';`,
    },
    {
      name: '012_add_order_gift_message.sql',
      sql: `-- Add gift_message column to orders table
ALTER TABLE orders ADD COLUMN gift_message TEXT;`,
    },
    {
      name: '013_add_order_status_history.sql',
      sql: `-- Create order_status_history table to track order status changes
CREATE TABLE IF NOT EXISTS order_status_history (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL,
  status TEXT NOT NULL,
  message TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_order_status_history_order_id ON order_status_history(order_id);
CREATE INDEX IF NOT EXISTS idx_order_status_history_created_at ON order_status_history(created_at);`,
    },
    {
      name: '014_add_site_images.sql',
      sql: `-- Site images table for homepage sections (philosophy, about, etc.)
CREATE TABLE IF NOT EXISTS site_images (
  id TEXT PRIMARY KEY,
  section TEXT NOT NULL UNIQUE,
  url TEXT NOT NULL,
  alt_text_en TEXT,
  alt_text_sv TEXT,
  active INTEGER DEFAULT 1,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- Index for faster lookups by section
CREATE INDEX IF NOT EXISTS idx_site_images_section ON site_images(section);`,
    },
    {
      name: '015_add_email_verification.sql',
      sql: `-- Add email verification fields to users table
ALTER TABLE users ADD COLUMN email_verified INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN verification_token TEXT;
ALTER TABLE users ADD COLUMN verification_token_expires INTEGER;
ALTER TABLE users ADD COLUMN password_reset_token TEXT;
ALTER TABLE users ADD COLUMN password_reset_expires INTEGER;

-- Create index for verification token lookups
CREATE INDEX IF NOT EXISTS idx_users_verification_token ON users(verification_token);
CREATE INDEX IF NOT EXISTS idx_users_password_reset_token ON users(password_reset_token);

-- Message replies table for admin conversation feature
CREATE TABLE IF NOT EXISTS message_replies (
  id TEXT PRIMARY KEY,
  message_id TEXT NOT NULL,
  reply_text TEXT NOT NULL,
  replied_by TEXT NOT NULL,
  from_admin INTEGER DEFAULT 1,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE,
  FOREIGN KEY (replied_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_message_replies_message ON message_replies(message_id);`,
    },
    {
      name: '016_add_homepage_content.sql',
      sql: `-- Homepage content table for managing editable homepage text content
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
);`,
    },
    {
      name: '017_add_collections.sql',
      sql: `-- Collections table for managing homepage collection cards
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
CREATE INDEX IF NOT EXISTS idx_collections_active ON collections(active);`,
    },
    {
      name: '018_add_product_collections.sql',
      sql: `-- Product collections junction table (many-to-many relationship)
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
CREATE INDEX IF NOT EXISTS idx_product_collections_sort ON product_collections(collection_id, sort_order);`,
    },
  ];

  return migrations;
}

/**
 * Run a specific migration to add is_admin column
 * This is safe to run multiple times
 */
export async function addAdminColumnIfNeeded(db: D1Database): Promise<void> {
  try {
    // Check if column exists by trying to select it
    await db.prepare('SELECT is_admin FROM users LIMIT 1').first();
  } catch (error: any) {
    // Column doesn't exist, add it
    if (error?.message?.includes('no such column')) {
      await db.exec('ALTER TABLE users ADD COLUMN is_admin BOOLEAN DEFAULT 0');
    } else {
      throw error;
    }
  }
}

/**
 * Check if a table exists in the database
 */
export async function tableExists(db: D1Database, tableName: string): Promise<boolean> {
  try {
    const result = await db
      .prepare(
        `SELECT name FROM sqlite_master WHERE type='table' AND name=?`
      )
      .bind(tableName)
      .first<{ name: string }>();
    return !!result;
  } catch (error) {
    console.error(`Error checking if table ${tableName} exists:`, error);
    return false;
  }
}

/**
 * Check if the database has been migrated (users table exists)
 */
export async function isDatabaseMigrated(db: D1Database): Promise<boolean> {
  return await tableExists(db, 'users');
}

/**
 * Run all migrations
 */
export async function runMigrations(db: D1Database): Promise<{ success: boolean; message: string }> {
  try {
    const migrations = getMigrations();
    const results: string[] = [];

    for (const migration of migrations) {
      // Handle special migrations
      if (migration.name === '003_add_admin_role.sql') {
        try {
          await addAdminColumnIfNeeded(db);
          results.push(`✅ Applied ${migration.name}`);
        } catch (error: any) {
          // Ignore if column already exists
          if (error?.message?.includes('duplicate column')) {
            results.push(`⏭️  Skipped ${migration.name} (already applied)`);
          } else {
            throw error;
          }
        }
        continue;
      }

      if (migration.name === '012_add_order_gift_message.sql') {
        try {
          // Check if column already exists
          const tableInfo = await db.prepare("PRAGMA table_info(orders)").all();
          const hasGiftMessage = (tableInfo.results as any[]).some((col: any) => col.name === 'gift_message');
          
          if (!hasGiftMessage) {
            await db.prepare("ALTER TABLE orders ADD COLUMN gift_message TEXT").run();
            results.push(`✅ Applied ${migration.name}`);
          } else {
            results.push(`⏭️  Skipped ${migration.name} (already applied)`);
          }
        } catch (error: any) {
          // Ignore if column already exists
          if (error?.message?.includes('duplicate column')) {
            results.push(`⏭️  Skipped ${migration.name} (already applied)`);
          } else {
            throw error;
          }
        }
        continue;
      }

      // For migrations, try to execute all SQL at once using db.exec()
      // This ensures foreign keys are handled properly in a single transaction
      try {
        // Clean up the SQL: remove comments and ensure proper semicolon separation
        let cleanSql = migration.sql
          .split('\n')
          .filter(line => !line.trim().startsWith('--'))
          .join('\n')
          .trim();
        
        // Ensure it ends with a semicolon
        if (!cleanSql.endsWith(';')) {
          cleanSql += ';';
        }

        // Try executing all at once with exec()
        await db.exec(cleanSql);
      } catch (error: any) {
        // If exec() fails, fall back to executing statements one by one
        // This handles cases where exec() might not work
        const errorMsg = error?.message || '';
        
        // Split SQL by semicolons and filter out comments
        const statements = migration.sql
          .split(';')
          .map((s) => s.trim())
          .filter((s) => s.length > 0 && !s.startsWith('--'));

        // Execute statements one by one
        for (let i = 0; i < statements.length; i++) {
          const statement = statements[i];
          if (statement.trim()) {
            try {
              await db.prepare(statement).run();
            } catch (stmtError: any) {
              const stmtErrorMsg = stmtError?.message || '';
              // Ignore "already exists" errors
              if (stmtErrorMsg.includes('already exists') || 
                  stmtErrorMsg.includes('duplicate column') ||
                  stmtErrorMsg.includes('index already exists') ||
                  stmtErrorMsg.includes('UNIQUE constraint failed')) {
                continue;
              }
              // For "no such table" errors on foreign keys, this might be expected
              // if the table creation hasn't completed yet - but with IF NOT EXISTS it should work
              if (stmtErrorMsg.includes('no such table') && statement.includes('FOREIGN KEY')) {
                // This is a foreign key constraint issue
                // The table should exist by now if we're executing in order
                // Let's log and continue - the table might already exist from a previous run
                console.warn(`Warning: Foreign key constraint error (table might already exist): ${stmtErrorMsg}`);
                continue;
              }
              console.error(`Error executing migration statement ${i + 1}:`, stmtError);
              console.error(`Statement was: ${statement.substring(0, 200)}...`);
              throw stmtError;
            }
          }
        }
      }

      results.push(`✅ Applied ${migration.name}`);
    }

    return {
      success: true,
      message: results.join('\n'),
    };
  } catch (error: any) {
    console.error('Migration error:', error);
    return {
      success: false,
      message: error?.message || 'Unknown error during migration',
    };
  }
}

