-- A small PrestaShop 1.7 database (tables prefixed ka_, as on karcher-gei.tn) for testing the import.
-- Only the tables and columns the import reads. Load it with: mysql prestashop < test/fixture.sql
-- Customer 1 (and the deleted customer 4) use a real PHP password_hash() of "motdepasse1"; customer 2 an old MD5 hash.
SET NAMES utf8mb4;

DROP TABLE IF EXISTS ka_lang, ka_country, ka_state, ka_tax, ka_tax_rules_group, ka_tax_rule,
  ka_category, ka_category_lang, ka_category_product, ka_product, ka_product_lang, ka_product_attribute,
  ka_product_attribute_combination, ka_attribute, ka_attribute_lang, ka_attribute_group_lang,
  ka_stock_available, ka_feature_lang, ka_feature_value_lang, ka_feature_product, ka_image,
  ka_customer, ka_address, ka_cms, ka_cms_lang;

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
CREATE TABLE ka_product (id_product INT PRIMARY KEY, id_tax_rules_group INT, reference VARCHAR(64), ean13 VARCHAR(13), price DECIMAL(20,6), active TINYINT, id_category_default INT, date_add DATETIME);
INSERT INTO ka_product VALUES
  (867, 1, '1.055-300.0', '4054278634537', 1296.218487, 1, 12, '2023-04-01 10:00:00'),
  (101, 1, '1.324-030.0', '4054278800001', 714.285714, 1, 13, '2023-05-01 10:00:00'),
  (102, 2, '2.643-233.0', '123', 46.728972, 1, 13, '2023-06-01 10:00:00'),
  (103, 1, '1.673-121.0', '', 300.000000, 0, 13, '2019-01-01 10:00:00'),
  (104, 1, '', '4039784709412', 8403.361345, 1, 15, '2024-01-01 10:00:00');
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
