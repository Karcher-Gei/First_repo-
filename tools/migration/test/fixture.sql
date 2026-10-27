-- A small PrestaShop 1.7 database (tables prefixed ka_, as on karcher-gei.tn) for testing the import.
-- Only the tables and columns the import reads. Load it with: mysql prestashop < test/fixture.sql
-- Customer 1 (and the deleted customer 4) use a real PHP password_hash() of "motdepasse1"; customer 2 an old MD5 hash.
SET NAMES utf8mb4;

DROP TABLE IF EXISTS ka_lang, ka_country, ka_state, ka_tax, ka_tax_rules_group, ka_tax_rule,
  ka_category, ka_category_lang, ka_category_product, ka_product, ka_product_lang, ka_product_attribute,
  ka_product_attribute_combination, ka_attribute, ka_attribute_lang, ka_attribute_group_lang,
  ka_stock_available, ka_feature_lang, ka_feature_value_lang, ka_feature_product, ka_image,
  ka_customer, ka_address, ka_cms, ka_cms_lang, ka_image_lang, ka_manufacturer, ka_manufacturer_lang,
  ka_meta, ka_meta_lang, ka_specific_price, ka_product_sale;

CREATE TABLE ka_lang (id_lang INT PRIMARY KEY, iso_code VARCHAR(2));
INSERT INTO ka_lang VALUES (1, 'fr');

CREATE TABLE ka_country (id_country INT PRIMARY KEY, iso_code VARCHAR(3));
INSERT INTO ka_country VALUES (208, 'TN'), (8, 'FR');

CREATE TABLE ka_state (id_state INT PRIMARY KEY, id_country INT, name VARCHAR(80));
INSERT INTO ka_state VALUES (1, 208, 'Tunis'), (2, 208, 'Sfax');

CREATE TABLE ka_tax (id_tax INT PRIMARY KEY, rate DECIMAL(10,3), active TINYINT, deleted TINYINT);
INSERT INTO ka_tax VALUES (1, 19.000, 1, 0), (2, 7.000, 1, 0);
CREATE TABLE ka_tax_rules_group (id_tax_rules_group INT PRIMARY KEY, name VARCHAR(50), active TINYINT, deleted TINYINT);
INSERT INTO ka_tax_rules_group VALUES (1, 'TN Standard 19%', 1, 0), (2, 'TN Réduit 7%', 1, 0);
CREATE TABLE ka_tax_rule (id_tax_rule INT PRIMARY KEY, id_tax_rules_group INT, id_country INT, id_tax INT);
INSERT INTO ka_tax_rule VALUES (1, 1, 208, 1), (2, 2, 208, 2), (3, 1, 8, 2);

CREATE TABLE ka_category (id_category INT PRIMARY KEY, id_parent INT, level_depth TINYINT, active TINYINT, position INT, is_root_category TINYINT);
INSERT INTO ka_category VALUES
  (1, 0, 0, 1, 0, 0), (2, 1, 1, 1, 0, 1),
  (12, 2, 2, 1, 0, 0), (13, 12, 3, 1, 0, 0), (14, 12, 3, 1, 1, 0),
  (15, 2, 2, 1, 1, 0), (16, 2, 2, 0, 2, 0);
CREATE TABLE ka_category_lang (id_category INT, id_shop INT, id_lang INT, name VARCHAR(128), description TEXT, link_rewrite VARCHAR(128), meta_title VARCHAR(255), meta_description VARCHAR(512));
INSERT INTO ka_category_lang VALUES
  (1, 1, 1, 'Racine', '', 'racine', '', ''),
  (2, 1, 1, 'Accueil', '', 'accueil', '', ''),
  (12, 1, 1, 'Maison et jardin', '<p>Tout pour l''entretien de la maison et du jardin.</p>', 'home-garden', 'Kärcher Maison et jardin', 'Nettoyeurs, aspirateurs et accessoires pour la maison.'),
  (13, 1, 1, 'Nettoyeurs haute pression', '<p>Nettoyeurs haute pression Kärcher.</p>', 'nettoyeurs-haute-pression', '', ''),
  (14, 1, 1, 'Aspirateurs', '', 'aspirateurs', '', ''),
  (15, 1, 1, 'Professionnel', '<p>La gamme professionnelle.</p>', 'professionnel', '', ''),
  (16, 1, 1, 'Ancienne gamme', '', 'ancienne-gamme', '', '');
CREATE TABLE ka_category_product (id_category INT, id_product INT, position INT);
INSERT INTO ka_category_product VALUES (2, 867, 0), (12, 867, 0), (14, 867, 0), (12, 101, 1), (13, 101, 0), (13, 102, 1), (13, 103, 2), (15, 104, 0);

-- price is excluding VAT, as PrestaShop stores it
CREATE TABLE ka_product (id_product INT PRIMARY KEY, id_tax_rules_group INT, reference VARCHAR(64), ean13 VARCHAR(13), price DECIMAL(20,6), active TINYINT, id_category_default INT, id_manufacturer INT, date_add DATETIME);
INSERT INTO ka_product VALUES
  (867, 1, '1.055-300.0', '4054278634537', 1296.218487, 1, 12, 2, '2023-04-01 10:00:00'),
  (101, 1, '1.324-030.0', '4054278800001', 714.285714, 1, 13, 2, '2023-05-01 10:00:00'),
  (102, 2, '2.643-233.0', '123', 46.728972, 1, 13, 0, '2023-06-01 10:00:00'),
  (103, 1, '1.673-121.0', '', 300.000000, 0, 13, 2, '2019-01-01 10:00:00'),
  (104, 1, '', '4039784709412', 8403.361345, 1, 15, 5, '2024-01-01 10:00:00');
CREATE TABLE ka_product_lang (id_product INT, id_shop INT, id_lang INT, name VARCHAR(128), description TEXT, description_short TEXT, link_rewrite VARCHAR(128), meta_title VARCHAR(255), meta_description VARCHAR(512));
INSERT INTO ka_product_lang VALUES
  (867, 1, 1, 'Aspirateur laveur FC 3', '<p>Le nettoyeur de sols <strong>FC 3</strong> aspire et lave en un seul passage.</p>', '<p>Aspire et lave.</p>', 'aspirateur-laveur-fc-3', 'Aspirateur laveur FC 3 Kärcher | Karcher Tunisie', 'Nettoyeur de sols FC 3 : aspire et lave en un passage.'),
  (101, 1, 1, 'Nettoyeur haute pression K 4 Power Control', '<p>Pour les salons de jardin et les vélos.</p>', '', 'nettoyeur-haute-pression-k-4-power-control', '', ''),
  (102, 1, 1, 'Brosse de lavage', '<p>Accessoire.</p>', '', 'brosse-de-lavage', '', ''),
  (103, 1, 1, 'Ancien modèle K 2', '', '', 'ancien-modele-k-2', '', ''),
  (104, 1, 1, 'Balayeuse KM 70/20 C', '<p>Balayeuse manuelle « professionnelle », idéale pour les cours et entrepôts.</p>', '', 'balayeuse-km-70-20-c', '', '');

-- Combinations: K 4 comes in two versions; price is the impact excluding VAT
CREATE TABLE ka_attribute_group_lang (id_attribute_group INT, id_lang INT, name VARCHAR(128), public_name VARCHAR(64));
INSERT INTO ka_attribute_group_lang VALUES (1, 1, 'Version', 'Version');
CREATE TABLE ka_attribute (id_attribute INT PRIMARY KEY, id_attribute_group INT, position INT);
INSERT INTO ka_attribute VALUES (1, 1, 0), (2, 1, 1);
CREATE TABLE ka_attribute_lang (id_attribute INT, id_lang INT, name VARCHAR(128));
INSERT INTO ka_attribute_lang VALUES (1, 1, 'Standard'), (2, 1, 'Home');
CREATE TABLE ka_product_attribute (id_product_attribute INT PRIMARY KEY, id_product INT, reference VARCHAR(64), ean13 VARCHAR(13), price DECIMAL(20,6), default_on TINYINT);
INSERT INTO ka_product_attribute VALUES (11, 101, '1.324-030.0', '4054278800001', 0, 1), (12, 101, '1.324-033.0', '4054278800002', 84.033613, NULL);
CREATE TABLE ka_product_attribute_combination (id_attribute INT, id_product_attribute INT);
INSERT INTO ka_product_attribute_combination VALUES (1, 11), (2, 12);

CREATE TABLE ka_stock_available (id_product INT, id_product_attribute INT, id_shop INT, quantity INT);
INSERT INTO ka_stock_available VALUES (867, 0, 1, 7), (101, 0, 1, 9), (101, 11, 1, 5), (101, 12, 1, 4), (102, 0, 1, 30), (103, 0, 1, 0), (104, 0, 1, 2);

CREATE TABLE ka_feature_lang (id_feature INT, id_lang INT, name VARCHAR(128));
INSERT INTO ka_feature_lang VALUES (1, 1, 'Type'), (2, 1, 'Gamme');
CREATE TABLE ka_feature_value_lang (id_feature_value INT, id_lang INT, value VARCHAR(255));
INSERT INTO ka_feature_value_lang VALUES (1, 1, 'Aspirateur'), (2, 1, 'Nettoyeur haute pression'), (3, 1, 'Balayeuse'), (4, 1, 'Particuliers'), (5, 1, 'Professionnels');
CREATE TABLE ka_feature_product (id_feature INT, id_product INT, id_feature_value INT);
INSERT INTO ka_feature_product VALUES (1, 867, 1), (2, 867, 4), (1, 101, 2), (2, 101, 4), (1, 104, 3), (2, 104, 5);

CREATE TABLE ka_image (id_image INT PRIMARY KEY, id_product INT, position INT, cover TINYINT);
INSERT INTO ka_image VALUES (2292, 867, 1, 1), (2293, 867, 2, NULL), (3001, 101, 1, 1), (3002, 104, 1, 1), (3003, 104, 2, NULL);
-- Discounts: FC 3 -15% with no end, K 4 variant 12 -50 DT (tax incl.) until 2099, the brush at a fixed
-- price for Tunisia; and rows the import must leave out: expired, future, group, quantity and cart prices.
CREATE TABLE ka_specific_price (id_specific_price INT PRIMARY KEY, id_specific_price_rule INT, id_cart INT, id_product INT, id_shop INT, id_currency INT, id_country INT, id_group INT, id_customer INT, id_product_attribute INT, price DECIMAL(20,6), from_quantity INT, reduction DECIMAL(20,6), reduction_tax TINYINT, reduction_type VARCHAR(16), `from` DATETIME, `to` DATETIME);
INSERT INTO ka_specific_price VALUES
  (1, 0, 0, 867, 0, 0, 0, 0, 0, 0, -1, 1, 0.150000, 1, 'percentage', '0000-00-00 00:00:00', '0000-00-00 00:00:00'),
  (2, 0, 0, 101, 1, 0, 0, 0, 0, 12, -1, 1, 50.000000, 1, 'amount', '2026-01-01 00:00:00', '2099-12-31 23:59:59'),
  (3, 0, 0, 102, 0, 0, 0, 0, 0, 0, -1, 1, 0.200000, 1, 'percentage', '2020-01-01 00:00:00', '2020-02-01 00:00:00'),
  (4, 0, 0, 104, 0, 0, 0, 0, 0, 0, -1, 1, 0.100000, 1, 'percentage', '2099-01-01 00:00:00', '2099-02-01 00:00:00'),
  (5, 0, 0, 102, 0, 0, 0, 4, 0, 0, -1, 1, 0.300000, 1, 'percentage', '0000-00-00 00:00:00', '0000-00-00 00:00:00'),
  (6, 0, 0, 102, 0, 0, 0, 0, 0, 0, -1, 10, 0.050000, 1, 'percentage', '0000-00-00 00:00:00', '0000-00-00 00:00:00'),
  (7, 0, 55, 102, 0, 0, 0, 0, 0, 0, 30.000000, 1, 0, 1, 'amount', '0000-00-00 00:00:00', '0000-00-00 00:00:00'),
  (8, 0, 0, 102, 0, 0, 208, 0, 0, 0, 35.000000, 1, 0, 1, 'amount', '0000-00-00 00:00:00', '0000-00-00 00:00:00');

-- Units sold, for /meilleures-ventes.
CREATE TABLE ka_product_sale (id_product INT PRIMARY KEY, quantity INT, sale_nbr INT, date_upd DATE);
INSERT INTO ka_product_sale VALUES (867, 40, 31, '2026-09-01'), (101, 25, 20, '2026-09-01'), (102, 3, 3, '2026-08-01');

-- Legends become the images' alt text; an empty legend falls back to the product name.
CREATE TABLE ka_image_lang (id_image INT, id_lang INT, legend VARCHAR(128));
INSERT INTO ka_image_lang VALUES
  (2292, 1, 'Aspirateur laveur FC 3 Kärcher'), (2293, 1, 'FC 3 : réservoir d’eau propre'),
  (3001, 1, ''), (3002, 1, 'Balayeuse manuelle KM 70/20 C'), (3003, 1, 'KM 70/20 C de côté');

-- Brands (/{id}_{slug}); 5 is inactive, so its URL must answer 404.
CREATE TABLE ka_manufacturer (id_manufacturer INT PRIMARY KEY, name VARCHAR(64), active TINYINT);
INSERT INTO ka_manufacturer VALUES (2, 'Kärcher', 1), (5, 'Ancienne Marque', 0);
CREATE TABLE ka_manufacturer_lang (id_manufacturer INT, id_lang INT, description TEXT, short_description TEXT, meta_title VARCHAR(255), meta_description VARCHAR(512));
INSERT INTO ka_manufacturer_lang VALUES
  (2, 1, '<p>Kärcher, leader mondial des solutions de nettoyage.</p>', '<p>Le spécialiste du nettoyage.</p>', 'Produits Kärcher en Tunisie', 'Toute la gamme Kärcher : nettoyeurs haute pression, aspirateurs, balayeuses.'),
  (5, 1, '', '', '', '');

-- Fixed pages' meta tags and friendly URLs (Préférences > Trafic & SEO).
CREATE TABLE ka_meta (id_meta INT PRIMARY KEY, page VARCHAR(64), configurable TINYINT);
INSERT INTO ka_meta VALUES (1, 'pagenotfound', 1), (2, 'best-sales', 1), (3, 'contact', 1), (4, 'index', 1),
  (5, 'manufacturer', 1), (6, 'new-products', 1), (8, 'prices-drop', 1), (10, 'search', 1), (12, 'stores', 1),
  (13, 'supplier', 1), (20, 'cart', 1), (30, 'module-ps_emailsubscription-verification', 1);
CREATE TABLE ka_meta_lang (id_meta INT, id_shop INT, id_lang INT, title VARCHAR(128), description VARCHAR(255), keywords VARCHAR(255), url_rewrite VARCHAR(254));
INSERT INTO ka_meta_lang VALUES
  (1, 1, 1, 'Erreur 404', 'Page introuvable', '', 'page-introuvable'),
  (2, 1, 1, 'Meilleures ventes', 'Les produits Kärcher les plus vendus en Tunisie', '', 'meilleures-ventes'),
  (3, 1, 1, 'Contactez-nous', 'Contactez Kärcher Center Tunisie', '', 'nous-contacter'),
  (4, 1, 1, 'Kärcher Tunisie - Nettoyeurs haute pression et aspirateurs', 'Distributeur officiel Kärcher en Tunisie : nettoyeurs haute pression, aspirateurs, balayeuses, livraison partout en Tunisie.', 'karcher, tunisie', ''),
  (5, 1, 1, 'Marques', 'Toutes nos marques', '', 'brands'),
  (6, 1, 1, 'Nouveaux produits', 'Les nouveautés Kärcher', '', 'nouveaux-produits'),
  (8, 1, 1, 'Promotions', 'Les promotions Kärcher du moment', '', 'promotions'),
  (10, 1, 1, 'Recherche', '', '', 'recherche'),
  (12, 1, 1, 'Nos magasins', 'Nos points de vente en Tunisie', '', 'magasins'),
  (13, 1, 1, 'Fournisseurs', '', '', 'fournisseur'),
  (20, 1, 1, 'Panier', '', '', 'panier'),
  (30, 1, 1, '', '', '', 'verification-email');

CREATE TABLE ka_customer (id_customer INT PRIMARY KEY, id_shop INT, firstname VARCHAR(255), lastname VARCHAR(255), email VARCHAR(255), passwd VARCHAR(255), active TINYINT, deleted TINYINT, is_guest TINYINT, newsletter TINYINT, date_add DATETIME);
INSERT INTO ka_customer VALUES
  (1, 1, 'Amel', 'Ben Salah', 'amel.bensalah@example.tn', '$2y$10$bkHNSKGmTpZdYcFkBSUVme0tjGw.vLm9VzVdUorFj8XX221kpNsh6', 1, 0, 0, 1, '2022-03-01 09:00:00'),
  (2, 1, 'Karim', 'Trabelsi', 'Karim.Trabelsi@Example.tn', 'e10adc3949ba59abbe56e057f20f883e', 1, 0, 0, 0, '2016-05-01 09:00:00'),
  (3, 1, 'Invité', 'Commande', 'guest@example.tn', '', 1, 0, 1, 0, '2023-01-01 09:00:00'),
  (4, 1, 'Supprimé', 'Compte', 'deleted@example.tn', '$2y$10$bkHNSKGmTpZdYcFkBSUVme0tjGw.vLm9VzVdUorFj8XX221kpNsh6', 1, 1, 0, 0, '2021-01-01 09:00:00');
CREATE TABLE ka_address (id_address INT PRIMARY KEY, id_customer INT, id_country INT, id_state INT, firstname VARCHAR(255), lastname VARCHAR(255), address1 VARCHAR(128), address2 VARCHAR(128), postcode VARCHAR(12), city VARCHAR(64), phone VARCHAR(32), phone_mobile VARCHAR(32), deleted TINYINT);
INSERT INTO ka_address VALUES
  (1, 1, 208, 1, 'Amel', 'Ben Salah', '12 rue de Marseille', 'Appartement 4', '1000', 'Tunis', '', '+216 20 000 000', 0),
  (2, 1, 208, 2, 'Amel', 'Ben Salah', '3 rue Ibn Khaldoun', '', '3000', 'Sfax', '74 000 000', '', 0),
  (3, 1, 208, 1, 'Amel', 'Ben Salah', 'Ancienne adresse', '', '1000', 'Tunis', '', '', 1),
  (4, 2, 8, 0, 'Karim', 'Trabelsi', '5 rue de Paris', '', '75001', 'Paris', '0600000000', '', 0);

CREATE TABLE ka_cms (id_cms INT PRIMARY KEY, active TINYINT);
INSERT INTO ka_cms VALUES (62, 1), (4, 1), (9, 0);
CREATE TABLE ka_cms_lang (id_cms INT, id_lang INT, id_shop INT, meta_title VARCHAR(255), meta_description VARCHAR(512), content LONGTEXT, link_rewrite VARCHAR(128));
INSERT INTO ka_cms_lang VALUES
  (62, 1, 1, 'Devenir revendeur', 'Rejoignez le réseau de revendeurs Kärcher en Tunisie.', '<h2>Pourquoi nous rejoindre ?</h2><p>Bénéficiez des <strong>conditions revendeur</strong> et du support de notre équipe.</p><ul><li>Formation produit</li><li>Livraison rapide</li></ul><p><a href="/nous-contacter">Contactez-nous</a></p>', 'devenir-revendeur'),
  (4, 1, 1, 'À propos', '', '<p>Karcher Tunisie, distributeur officiel.</p>', 'a-propos'),
  (9, 1, 1, 'Page désactivée', '', '<p>Brouillon.</p>', 'page-desactivee');
