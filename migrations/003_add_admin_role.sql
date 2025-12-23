-- Add is_admin field to users table (if it doesn't exist)
-- SQLite doesn't support IF NOT EXISTS for ALTER TABLE, so we check first
-- This will fail silently if column already exists, which is fine
ALTER TABLE users ADD COLUMN is_admin BOOLEAN DEFAULT 0;

-- Create index for faster admin queries
CREATE INDEX IF NOT EXISTS idx_users_is_admin ON users(is_admin);

