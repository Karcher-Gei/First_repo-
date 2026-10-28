-- Read-only checks on the PrestaShop database of karcher-gei.tn, run BEFORE exporting the dump.
-- Paste into phpMyAdmin (SQL tab) on the PrestaShop database. Nothing here writes or locks anything,
-- and no query returns customer personal data: only structure, settings and counts.
-- Tables are assumed to be prefixed "ka_"; if the first query shows another prefix, replace ka_ everywhere.
-- Send back the result of each numbered query (phpMyAdmin: Export the results, or a screenshot).
--
-- First make the shop's database the active one (else MySQL looks in information_schema and answers
-- "Table inconnue"): click it in phpMyAdmin's left panel before opening the SQL tab, or keep this line
-- with its name (on karcher-gei.tn: qmrfdnuq_karcher_DB_2022).
USE `qmrfdnuq_karcher_DB_2022`;
SELECT DATABASE() AS active_database;

-- 1. Every table with its row count and size: confirms the prefix and the tables the import reads.
SELECT table_name, table_rows, ROUND((data_length + index_length) / 1024 / 1024, 1) AS size_mb
FROM information_schema.tables
WHERE table_schema = DATABASE()
ORDER BY table_name;

-- 2. Columns of the tables the import reads: catches a PrestaShop version with different columns.
SELECT table_name, column_name, column_type
FROM information_schema.columns
WHERE table_schema = DATABASE()
  AND table_name IN (
    'ka_address', 'ka_attribute', 'ka_attribute_group_lang', 'ka_attribute_lang', 'ka_category',
    'ka_category_lang', 'ka_category_product', 'ka_cms', 'ka_cms_lang', 'ka_configuration', 'ka_country',
    'ka_customer', 'ka_feature_lang', 'ka_feature_product', 'ka_feature_value_lang', 'ka_homeslider',
    'ka_homeslider_slides', 'ka_homeslider_slides_lang', 'ka_hook', 'ka_hook_module', 'ka_image',
    'ka_image_lang', 'ka_manufacturer', 'ka_manufacturer_lang', 'ka_meta', 'ka_meta_lang', 'ka_module',
    'ka_product', 'ka_product_attribute', 'ka_product_attribute_combination', 'ka_product_lang',
    'ka_product_sale', 'ka_specific_price', 'ka_state', 'ka_stock_available', 'ka_tax', 'ka_tax_rule'
  )
ORDER BY table_name, ordinal_position;

-- 3. Version, languages, shops, currency and the URL formats (the new site must keep the same URLs).
SELECT name, value
FROM ka_configuration
WHERE name IN (
  'PS_VERSION_DB', 'PS_SHOP_NAME', 'PS_SHOP_DOMAIN', 'PS_LANG_DEFAULT', 'PS_CURRENCY_DEFAULT',
  'PS_COUNTRY_DEFAULT', 'PS_REWRITING_SETTINGS', 'PS_ROUTE_product_rule', 'PS_ROUTE_category_rule',
  'PS_ROUTE_manufacturer_rule', 'PS_ROUTE_supplier_rule', 'PS_ROUTE_cms_rule', 'PS_ROUTE_layered_rule',
  'PS_TAX', 'PS_PRICE_ROUND_MODE', 'PS_STOCK_MANAGEMENT', 'PS_HOME_CATEGORY', 'HOME_FEATURED_CAT',
  'HOME_FEATURED_NBR', 'PS_SPECIFIC_PRICE_PRIORITIES'
)
ORDER BY name;
SELECT id_lang, iso_code, active FROM ka_lang;
SELECT id_shop, name, active FROM ka_shop;
SELECT id_currency, iso_code, active, deleted FROM ka_currency;

-- 4. Catalog volumes.
SELECT
  (SELECT COUNT(*) FROM ka_product) AS products,
  (SELECT COUNT(*) FROM ka_product WHERE active = 1) AS products_active,
  (SELECT COUNT(*) FROM ka_product_attribute) AS combinations,
  (SELECT COUNT(*) FROM ka_image) AS images,
  (SELECT COUNT(*) FROM ka_category WHERE level_depth >= 2) AS categories,
  (SELECT COUNT(*) FROM ka_category WHERE level_depth >= 2 AND active = 1) AS categories_active,
  (SELECT COUNT(*) FROM ka_feature_product) AS feature_values_on_products,
  (SELECT COUNT(*) FROM ka_manufacturer) AS brands,
  (SELECT COUNT(*) FROM ka_cms) AS cms_pages;

-- 5. The category tree (names and depth), to confirm the "Professionnel" range sold on quote only.
SELECT c.id_category, c.id_parent, c.level_depth, c.active, cl.name, cl.link_rewrite,
  (SELECT COUNT(*) FROM ka_category_product cp WHERE cp.id_category = c.id_category) AS products
FROM ka_category c
JOIN ka_category_lang cl ON cl.id_category = c.id_category
  AND cl.id_lang = (SELECT value FROM ka_configuration WHERE name = 'PS_LANG_DEFAULT' LIMIT 1)
GROUP BY c.id_category
ORDER BY c.level_depth, c.position;

-- 6. Discounts by kind (only those for every visitor, today, are migrated as sales).
SELECT
  CASE
    WHEN id_cart <> 0 THEN 'cart'
    WHEN id_customer <> 0 THEN 'customer'
    WHEN id_group <> 0 THEN 'customer group'
    WHEN from_quantity > 1 THEN 'quantity'
    WHEN `to` <> '0000-00-00 00:00:00' AND `to` < NOW() THEN 'expired'
    WHEN `from` > NOW() THEN 'future'
    ELSE 'current, everyone'
  END AS kind,
  COUNT(*) AS specific_prices
FROM ka_specific_price
GROUP BY kind;

-- 7. Customer accounts by password format (counts only): bcrypt ones keep their password.
SELECT
  CASE WHEN passwd LIKE '$2y$%' OR passwd LIKE '$2a$%' OR passwd LIKE '$2b$%' THEN 'bcrypt (kept)'
       WHEN LENGTH(passwd) = 32 THEN 'md5 (reset needed)'
       ELSE 'other' END AS password_format,
  SUM(deleted = 0 AND is_guest = 0) AS accounts,
  SUM(is_guest = 1) AS guests,
  SUM(deleted = 1) AS deleted
FROM ka_customer
GROUP BY password_format;

-- 8. What the homepage shows (modules on displayHome, in order).
SELECT hm.position, m.name, m.active
FROM ka_hook_module hm
JOIN ka_hook h ON h.id_hook = hm.id_hook AND h.name = 'displayHome'
JOIN ka_module m ON m.id_module = hm.id_module
ORDER BY hm.position;

-- 9. Character set: the dump must be exported in utf8mb4 (accents, ’ and Kärcher).
SELECT @@character_set_database AS charset, @@collation_database AS collation, VERSION() AS mysql_version;
