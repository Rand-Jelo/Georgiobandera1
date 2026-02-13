-- Add shipping_thresholds column to shipping_regions table
-- Stores JSON array of threshold objects: [{ min_order_amount: number, shipping_price: number }]
-- Example: [{"min_order_amount": 500, "shipping_price": 150}, {"min_order_amount": 1000, "shipping_price": 79}, {"min_order_amount": 1500, "shipping_price": 0}]

ALTER TABLE shipping_regions ADD COLUMN shipping_thresholds TEXT DEFAULT '[]';

-- Migrate existing free_shipping_threshold data into the new thresholds format
-- If a region has a free_shipping_threshold, create a single threshold entry with shipping_price 0
UPDATE shipping_regions 
SET shipping_thresholds = '[{"min_order_amount": ' || free_shipping_threshold || ', "shipping_price": 0}]'
WHERE free_shipping_threshold IS NOT NULL AND free_shipping_threshold > 0;
