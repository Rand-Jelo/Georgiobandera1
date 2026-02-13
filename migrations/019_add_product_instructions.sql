-- Add instructions columns to products table (bilingual)
ALTER TABLE products ADD COLUMN instructions_en TEXT;
ALTER TABLE products ADD COLUMN instructions_sv TEXT;
