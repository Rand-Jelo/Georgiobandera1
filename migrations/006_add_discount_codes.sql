-- Discount codes table
CREATE TABLE IF NOT EXISTS discount_codes (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  description TEXT,
  discount_type TEXT NOT NULL, -- 'percentage' or 'fixed'
  discount_value DECIMAL(10, 2) NOT NULL, -- Percentage (0-100) or fixed amount
  minimum_purchase DECIMAL(10, 2) DEFAULT 0, -- Minimum order amount to use code
  maximum_discount DECIMAL(10, 2), -- Maximum discount amount (for percentage codes)
  usage_limit INTEGER, -- Total number of times code can be used (NULL = unlimited)
  usage_count INTEGER DEFAULT 0, -- Number of times code has been used
  user_usage_limit INTEGER DEFAULT 1, -- Number of times a single user can use the code
  valid_from INTEGER, -- Start date (unix timestamp, NULL = no start date)
  valid_until INTEGER, -- Expiry date (unix timestamp, NULL = no expiry)
  active BOOLEAN DEFAULT 1, -- Whether code is active
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- Discount code usage tracking table (without foreign keys first)
CREATE TABLE IF NOT EXISTS discount_code_usage (
  id TEXT PRIMARY KEY,
  discount_code_id TEXT NOT NULL,
  order_id TEXT NOT NULL,
  user_id TEXT, -- NULL for guest orders
  email TEXT NOT NULL, -- Email from order
  discount_amount DECIMAL(10, 2) NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_discount_codes_code ON discount_codes(code);
CREATE INDEX IF NOT EXISTS idx_discount_codes_active ON discount_codes(active);
CREATE INDEX IF NOT EXISTS idx_discount_code_usage_code ON discount_code_usage(discount_code_id);
CREATE INDEX IF NOT EXISTS idx_discount_code_usage_order ON discount_code_usage(order_id);
CREATE INDEX IF NOT EXISTS idx_discount_code_usage_user ON discount_code_usage(user_id);

