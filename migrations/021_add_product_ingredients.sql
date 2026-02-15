-- Add ingredients columns to products table (bilingual)
ALTER TABLE products ADD COLUMN ingredients_en TEXT;
ALTER TABLE products ADD COLUMN ingredients_sv TEXT;
