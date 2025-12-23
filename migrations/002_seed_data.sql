-- Seed categories
INSERT OR IGNORE INTO categories (id, name_en, name_sv, slug, description_en, description_sv, sort_order) VALUES
('cat-shampoo', 'Shampoo', 'Schampo', 'shampoo', 'Professional hair cleansing products', 'Professionella hårrengöringsprodukter', 1),
('cat-conditioner', 'Conditioner', 'Balsam', 'conditioner', 'Nourishing hair conditioners', 'Närande hårbalsam', 2),
('cat-treatments', 'Treatments', 'Behandlingar', 'treatments', 'Deep treatment products for hair repair', 'Djupbehandlingsprodukter för hårreparation', 3),
('cat-styling', 'Styling', 'Styling', 'styling', 'Professional styling products', 'Professionella stylingprodukter', 4),
('cat-kits', 'Kits & Bundles', 'Kit & Paket', 'kits-bundles', 'Value bundles and gift sets', 'Värdepaket och presentset', 5);

-- Seed products
INSERT OR IGNORE INTO products (id, name_en, name_sv, slug, description_en, description_sv, category_id, price, compare_at_price, sku, status, featured, stock_quantity) VALUES
('prod-1', 'Signature Shampoo', 'Signatur Schampo', 'signature-shampoo', 'Our signature salon-grade shampoo for all hair types. Gently cleanses while nourishing your hair with premium ingredients.', 'Vårt signatur salongsklass schampo för alla hårtyper. Rengör försiktigt samtidigt som det närmar ditt hår med premiumingrediens.', 'cat-shampoo', 299.00, 349.00, 'GB-SH-001', 'active', 1, 50),
('prod-2', 'Hydrating Conditioner', 'Återfuktande Balsam', 'hydrating-conditioner', 'Intense hydration for dry and damaged hair. Leaves hair silky smooth and manageable.', 'Intensiv återfuktning för torrt och skadat hår. Lämnar håret silkeslent och hanterbart.', 'cat-conditioner', 279.00, NULL, 'GB-CO-001', 'active', 1, 45),
('prod-3', 'Repair Treatment Mask', 'Reparerande Behandlingsmask', 'repair-treatment-mask', 'Deep conditioning treatment that repairs damaged hair from within. Use weekly for best results.', 'Djupverkande behandling som reparerar skadat hår inifrån. Använd varje vecka för bästa resultat.', 'cat-treatments', 399.00, 449.00, 'GB-TR-001', 'active', 1, 30),
('prod-4', 'Volumizing Mousse', 'Volymgivande Mousse', 'volumizing-mousse', 'Lightweight mousse that adds incredible volume without weighing hair down.', 'Lätt mousse som ger otrolig volym utan att tynga ner håret.', 'cat-styling', 249.00, NULL, 'GB-ST-001', 'active', 1, 60),
('prod-5', 'Complete Care Kit', 'Komplett Vårdkit', 'complete-care-kit', 'Everything you need for salon-quality hair at home. Includes shampoo, conditioner, and treatment mask.', 'Allt du behöver för salongskvalitet hår hemma. Inkluderar schampo, balsam och behandlingsmask.', 'cat-kits', 799.00, 999.00, 'GB-KIT-001', 'active', 1, 20),
('prod-6', 'Shine Serum', 'Glanserum', 'shine-serum', 'Lightweight serum that adds brilliant shine and tames frizz.', 'Lätt serum som ger strålande glans och tämjer friss.', 'cat-styling', 329.00, NULL, 'GB-ST-002', 'active', 1, 40);

-- Seed product images (using placeholder images)
INSERT OR IGNORE INTO product_images (id, product_id, url, alt_text_en, alt_text_sv, sort_order) VALUES
('img-1', 'prod-1', 'https://images.unsplash.com/photo-1585751119414-ef2636f8aede?w=600&h=800&fit=crop', 'Signature Shampoo bottle', 'Signatur Schampo flaska', 1),
('img-2', 'prod-2', 'https://images.unsplash.com/photo-1526947425960-945c6e72858f?w=600&h=800&fit=crop', 'Hydrating Conditioner bottle', 'Återfuktande Balsam flaska', 1),
('img-3', 'prod-3', 'https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?w=600&h=800&fit=crop', 'Repair Treatment Mask jar', 'Reparerande Behandlingsmask burk', 1),
('img-4', 'prod-4', 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&h=800&fit=crop', 'Volumizing Mousse can', 'Volymgivande Mousse burk', 1),
('img-5', 'prod-5', 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=600&h=800&fit=crop', 'Complete Care Kit set', 'Komplett Vårdkit set', 1),
('img-6', 'prod-6', 'https://images.unsplash.com/photo-1619451334792-150fd785ee74?w=600&h=800&fit=crop', 'Shine Serum bottle', 'Glanserum flaska', 1);

-- Seed shipping regions
INSERT OR IGNORE INTO shipping_regions (id, name_en, name_sv, code, base_price, free_shipping_threshold, active) VALUES
('ship-se', 'Sweden', 'Sverige', 'SE', 49.00, 499.00, 1),
('ship-eu', 'European Union', 'Europeiska Unionen', 'EU', 99.00, 999.00, 1),
('ship-world', 'Rest of World', 'Övriga Världen', 'WORLD', 199.00, NULL, 1);

