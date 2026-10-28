-- Second round of read-only checks, after inspect-prestashop.sql. Same rules: nothing is written, and
-- no customer personal data comes back (only counts, settings, product and category names).
USE `qmrfdnuq_karcher_DB_2022`;

-- A. Discounts by kind. Dates compared as text: MySQL 8 refuses the '0000-00-00' literal in strict mode.
SELECT * FROM (
  SELECT
    CASE
      WHEN id_cart <> 0 THEN 'cart'
      WHEN id_customer <> 0 THEN 'customer'
      WHEN id_group <> 0 THEN 'customer group'
      WHEN from_quantity > 1 THEN 'quantity'
      WHEN CAST(`to` AS CHAR) NOT LIKE '0000%' AND `to` < NOW() THEN 'expired'
      WHEN CAST(`from` AS CHAR) NOT LIKE '0000%' AND `from` > NOW() THEN 'future'
      ELSE 'current, everyone'
    END AS kind,
    COUNT(*) AS specific_prices
  FROM ka_specific_price
  GROUP BY kind
) r;

-- B. Customer accounts by password format (counts only).
SELECT * FROM (
  SELECT
    CASE WHEN passwd LIKE '$2y$%' OR passwd LIKE '$2a$%' OR passwd LIKE '$2b$%' THEN 'bcrypt (kept)'
         WHEN LENGTH(passwd) = 32 THEN 'md5 (reset needed)'
         ELSE 'other' END AS password_format,
    SUM(deleted = 0 AND is_guest = 0) AS accounts,
    SUM(is_guest = 1) AS guests,
    SUM(deleted = 1) AS deleted
  FROM ka_customer
  GROUP BY password_format
) r;

-- C. What the homepage shows (modules on displayHome, in order).
SELECT * FROM (
  SELECT hm.position, m.name, m.active
  FROM ka_hook_module hm
  JOIN ka_hook h ON h.id_hook = hm.id_hook AND h.name = 'displayHome'
  JOIN ka_module m ON m.id_module = hm.id_module
  WHERE hm.id_shop = 1
) r ORDER BY position;

-- D. Character set and server.
SELECT @@character_set_database AS charset, @@collation_database AS collation, VERSION() AS mysql_version;

-- E. Products PrestaShop already sells "on quote": price hidden or not orderable, by top-level range.
SELECT * FROM (
  SELECT
    COALESCE(top.name, '(other)') AS top_category,
    COUNT(*) AS products,
    SUM(p.active = 1) AS active,
    SUM(p.show_price = 0) AS price_hidden,
    SUM(p.available_for_order = 0) AS not_orderable,
    SUM(p.on_sale = 1) AS on_sale_flag
  FROM ka_product p
  JOIN ka_category c ON c.id_category = p.id_category_default
  LEFT JOIN ka_category top_c ON top_c.id_category = CASE
      WHEN c.level_depth = 2 THEN c.id_category
      WHEN c.level_depth = 3 THEN c.id_parent
      ELSE (SELECT pc.id_parent FROM ka_category pc WHERE pc.id_category = c.id_parent)
    END
  LEFT JOIN ka_category_lang top ON top.id_category = top_c.id_category AND top.id_lang = 1 AND top.id_shop = 1
  GROUP BY top_category
) r ORDER BY products DESC;

-- F. The quotation module's own product list (Roja45 Quotations Pro): its columns and a sample.
SELECT * FROM (
  SELECT column_name, column_type FROM information_schema.columns
  WHERE table_schema = DATABASE() AND table_name = 'ka_product_quotationspro'
) r;
SELECT * FROM (SELECT * FROM ka_product_quotationspro LIMIT 10) r;

-- G. The hand-filled "Promotions", "Bestsellers" and "Coup de cœur" categories: their products, and
-- how many of them have a current discount or the "on sale" flag.
SELECT * FROM (
  SELECT cp.id_category, cl.link_rewrite, COUNT(*) AS products,
    SUM(EXISTS (
      SELECT 1 FROM ka_specific_price sp
      WHERE sp.id_product = cp.id_product AND sp.id_cart = 0 AND sp.id_customer = 0 AND sp.id_group = 0
        AND (CAST(sp.`to` AS CHAR) LIKE '0000%' OR sp.`to` >= NOW())
    )) AS with_current_discount,
    SUM(p.on_sale = 1) AS on_sale_flag
  FROM ka_category_product cp
  JOIN ka_category_lang cl ON cl.id_category = cp.id_category AND cl.id_lang = 1 AND cl.id_shop = 1
  JOIN ka_product p ON p.id_product = cp.id_product
  WHERE cl.link_rewrite IN ('promotions', 'bestsellers', 'coup-de-coeur')
  GROUP BY cp.id_category, cl.link_rewrite
) r ORDER BY id_category;

-- H. Old products that redirect elsewhere (to carry over as redirects).
SELECT * FROM (
  SELECT redirect_type, active, COUNT(*) AS products
  FROM ka_product
  GROUP BY redirect_type, active
) r ORDER BY active, redirect_type;

-- I. The main menu (Nov mega menu): its entries, to keep short menu labels.
SELECT * FROM (
  SELECT column_name, column_type FROM information_schema.columns
  WHERE table_schema = DATABASE() AND table_name IN ('ka_novmegamenu', 'ka_novmegamenu_lang')
) r;
SELECT * FROM (SELECT * FROM ka_novmegamenu_lang WHERE id_lang = 1 LIMIT 40) r;

-- J. Revolution Slider and Visual Composer content: what the homepage really uses.
SELECT * FROM (SELECT id, title, alias FROM ka_revslider_sliders) r;
SELECT * FROM (
  SELECT column_name, column_type FROM information_schema.columns
  WHERE table_schema = DATABASE() AND table_name IN ('ka_vccontentanywhere', 'ka_vccontentanywhere_lang')
) r;

-- K. Stores and attachments (counts and names only).
SELECT * FROM (
  SELECT s.id_store, sl.name, s.city, s.active FROM ka_store s
  JOIN ka_store_lang sl ON sl.id_store = s.id_store AND sl.id_lang = 1
) r;
SELECT * FROM (
  SELECT a.id_attachment, a.file_name, a.mime, al.name FROM ka_attachment a
  JOIN ka_attachment_lang al ON al.id_attachment = a.id_attachment AND al.id_lang = 1
) r LIMIT 40;
