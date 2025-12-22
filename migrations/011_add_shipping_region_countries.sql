-- Add countries column to shipping_regions table
-- This stores a JSON array of ISO country codes (e.g., ["SE"], ["AT", "BE", "DE", ...], ["US", "CA", ...])
ALTER TABLE shipping_regions ADD COLUMN countries TEXT DEFAULT '[]';

-- Update existing regions with default country assignments based on their codes
-- SE region gets SE
UPDATE shipping_regions SET countries = '["SE"]' WHERE code = 'SE';

-- EU region gets all EU countries
UPDATE shipping_regions SET countries = '["AT","BE","BG","HR","CY","CZ","DK","EE","FI","FR","DE","GR","HU","IE","IT","LV","LT","LU","MT","NL","PL","PT","RO","SK","SI","ES"]' WHERE code = 'EU';

-- WORLD region gets empty array (will match any country not in other regions)
UPDATE shipping_regions SET countries = '[]' WHERE code = 'WORLD';

