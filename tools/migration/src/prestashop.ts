import mysql, { type RowDataPacket } from 'mysql2/promise';

/** Read-only access to a copy of the PrestaShop database. */
export interface PrestaShopConfig {
  url: string;
  prefix: string;
  langId: number;
  shopId: number;
}

export function configFromEnv(): PrestaShopConfig {
  const url = process.env.PS_DATABASE_URL;
  if (!url) {
    throw new Error('PS_DATABASE_URL is not set (see tools/migration/.env.example)');
  }
  const prefix = process.env.PS_TABLE_PREFIX ?? 'ka_';
  if (!/^[a-z0-9_]+$/i.test(prefix)) {
    throw new Error(`Invalid PS_TABLE_PREFIX "${prefix}"`);
  }
  return {
    url,
    prefix,
    langId: Number(process.env.PS_LANG_ID ?? 1),
    shopId: Number(process.env.PS_SHOP_ID ?? 1),
  };
}

export interface PsCategory {
  id_category: number;
  id_parent: number;
  level_depth: number;
  active: number;
  position: number;
  name: string;
  link_rewrite: string;
  description: string | null;
  meta_title: string | null;
  meta_description: string | null;
}

export interface PsProduct {
  id_product: number;
  id_tax_rules_group: number;
  reference: string;
  ean13: string;
  /** Excluding VAT. */
  price: string;
  active: number;
  id_category_default: number;
  category_slug: string;
  name: string;
  link_rewrite: string;
  description: string | null;
  meta_title: string | null;
  meta_description: string | null;
}

export interface PsCategoryProduct {
  id_category: number;
  id_product: number;
  position: number;
}

/** One row per attribute of a combination; a combination can have several (Version + Couleur). */
export interface PsCombinationAttribute {
  id_product_attribute: number;
  id_product: number;
  reference: string;
  ean13: string;
  /** Price impact excluding VAT. */
  price: string;
  default_on: number | null;
  id_attribute_group: number;
  group_name: string;
  id_attribute: number;
  attribute_name: string;
  attribute_position: number;
}

export interface PsStock {
  id_product: number;
  id_product_attribute: number;
  quantity: number;
}

export interface PsProductFeature {
  id_product: number;
  id_feature: number;
  feature_name: string;
  id_feature_value: number;
  value: string;
}

export interface PsCmsPage {
  id_cms: number;
  active: number;
  meta_title: string;
  meta_description: string | null;
  link_rewrite: string;
  content: string | null;
}

export interface PsImage {
  id_image: number;
  id_product: number;
  position: number;
  cover: number | null;
  product_slug: string;
}

export interface PsCustomer {
  id_customer: number;
  firstname: string;
  lastname: string;
  email: string;
  passwd: string;
  active: number;
  newsletter: number;
}

export interface PsAddress {
  id_address: number;
  id_customer: number;
  country_iso: string;
  state_name: string | null;
  firstname: string;
  lastname: string;
  address1: string;
  address2: string | null;
  postcode: string | null;
  city: string;
  phone: string | null;
  phone_mobile: string | null;
}

export class PrestaShopReader {
  private constructor(
    private readonly pool: mysql.Pool,
    private readonly cfg: PrestaShopConfig,
  ) {}

  static create(cfg: PrestaShopConfig): PrestaShopReader {
    return new PrestaShopReader(mysql.createPool({ uri: cfg.url, connectionLimit: 4 }), cfg);
  }

  private t(table: string): string {
    return `\`${this.cfg.prefix}${table}\``;
  }

  private async rows<T>(sql: string, params: unknown[] = []): Promise<T[]> {
    const [rows] = await this.pool.query<RowDataPacket[]>(sql, params);
    return rows as T[];
  }

  categories(): Promise<PsCategory[]> {
    return this.rows<PsCategory>(
      `SELECT c.id_category, c.id_parent, c.level_depth, c.active, c.position, cl.name, cl.link_rewrite,
              cl.description, cl.meta_title, cl.meta_description
       FROM ${this.t('category')} c
       JOIN ${this.t('category_lang')} cl
         ON cl.id_category = c.id_category AND cl.id_lang = ? AND cl.id_shop = ?
       WHERE c.level_depth >= 2
       ORDER BY c.level_depth, c.position, c.id_category`,
      [this.cfg.langId, this.cfg.shopId],
    );
  }

  products(): Promise<PsProduct[]> {
    return this.rows<PsProduct>(
      `SELECT p.id_product, p.id_tax_rules_group, p.reference, p.ean13, p.price, p.active,
              p.id_category_default, cl.link_rewrite AS category_slug, pl.name, pl.link_rewrite,
              pl.description, pl.meta_title, pl.meta_description
       FROM ${this.t('product')} p
       JOIN ${this.t('product_lang')} pl
         ON pl.id_product = p.id_product AND pl.id_lang = ? AND pl.id_shop = ?
       JOIN ${this.t('category_lang')} cl
         ON cl.id_category = p.id_category_default AND cl.id_lang = ? AND cl.id_shop = ?
       ORDER BY p.id_product`,
      [this.cfg.langId, this.cfg.shopId, this.cfg.langId, this.cfg.shopId],
    );
  }

  categoryProducts(): Promise<PsCategoryProduct[]> {
    return this.rows<PsCategoryProduct>(
      `SELECT id_category, id_product, position FROM ${this.t('category_product')}
       ORDER BY id_category, position`,
    );
  }

  /** VAT rate (percent) of each tax rules group for a country, e.g. TN. */
  async taxRates(countryIso: string): Promise<Map<number, number>> {
    const rows = await this.rows<{ id_tax_rules_group: number; rate: string }>(
      `SELECT tr.id_tax_rules_group, t.rate
       FROM ${this.t('tax_rule')} tr
       JOIN ${this.t('tax')} t ON t.id_tax = tr.id_tax
       JOIN ${this.t('country')} co ON co.id_country = tr.id_country
       WHERE co.iso_code = ?`,
      [countryIso],
    );
    return new Map(rows.map((r) => [r.id_tax_rules_group, Number(r.rate)]));
  }

  combinations(): Promise<PsCombinationAttribute[]> {
    return this.rows<PsCombinationAttribute>(
      `SELECT pa.id_product_attribute, pa.id_product, pa.reference, pa.ean13, pa.price, pa.default_on,
              a.id_attribute_group, agl.public_name AS group_name, a.id_attribute,
              al.name AS attribute_name, a.position AS attribute_position
       FROM ${this.t('product_attribute')} pa
       JOIN ${this.t('product_attribute_combination')} pac ON pac.id_product_attribute = pa.id_product_attribute
       JOIN ${this.t('attribute')} a ON a.id_attribute = pac.id_attribute
       JOIN ${this.t('attribute_lang')} al ON al.id_attribute = a.id_attribute AND al.id_lang = ?
       JOIN ${this.t('attribute_group_lang')} agl
         ON agl.id_attribute_group = a.id_attribute_group AND agl.id_lang = ?
       ORDER BY pa.id_product, pa.id_product_attribute, a.id_attribute_group`,
      [this.cfg.langId, this.cfg.langId],
    );
  }

  stock(): Promise<PsStock[]> {
    return this.rows<PsStock>(
      `SELECT id_product, id_product_attribute, quantity FROM ${this.t('stock_available')}
       WHERE id_shop = ?`,
      [this.cfg.shopId],
    );
  }

  productFeatures(): Promise<PsProductFeature[]> {
    return this.rows<PsProductFeature>(
      `SELECT fp.id_product, fp.id_feature, fl.name AS feature_name, fp.id_feature_value, fvl.value
       FROM ${this.t('feature_product')} fp
       JOIN ${this.t('feature_lang')} fl ON fl.id_feature = fp.id_feature AND fl.id_lang = ?
       JOIN ${this.t('feature_value_lang')} fvl
         ON fvl.id_feature_value = fp.id_feature_value AND fvl.id_lang = ?
       ORDER BY fp.id_feature, fp.id_feature_value`,
      [this.cfg.langId, this.cfg.langId],
    );
  }

  cmsPages(): Promise<PsCmsPage[]> {
    return this.rows<PsCmsPage>(
      `SELECT c.id_cms, c.active, l.meta_title, l.meta_description, l.link_rewrite, l.content
       FROM ${this.t('cms')} c
       JOIN ${this.t('cms_lang')} l ON l.id_cms = c.id_cms AND l.id_lang = ? AND l.id_shop = ?
       ORDER BY c.id_cms`,
      [this.cfg.langId, this.cfg.shopId],
    );
  }

  images(): Promise<PsImage[]> {
    return this.rows<PsImage>(
      `SELECT i.id_image, i.id_product, i.position, i.cover, pl.link_rewrite AS product_slug
       FROM ${this.t('image')} i
       JOIN ${this.t('product_lang')} pl
         ON pl.id_product = i.id_product AND pl.id_lang = ? AND pl.id_shop = ?
       ORDER BY i.id_product, i.position`,
      [this.cfg.langId, this.cfg.shopId],
    );
  }

  /** Registered customers; guest checkouts and deleted accounts are left out. */
  customers(): Promise<PsCustomer[]> {
    return this.rows<PsCustomer>(
      `SELECT id_customer, firstname, lastname, email, passwd, active, newsletter
       FROM ${this.t('customer')}
       WHERE deleted = 0 AND is_guest = 0 AND id_shop = ?
       ORDER BY id_customer`,
      [this.cfg.shopId],
    );
  }

  addresses(): Promise<PsAddress[]> {
    return this.rows<PsAddress>(
      `SELECT a.id_address, a.id_customer, co.iso_code AS country_iso, s.name AS state_name,
              a.firstname, a.lastname, a.address1, a.address2, a.postcode, a.city, a.phone, a.phone_mobile
       FROM ${this.t('address')} a
       JOIN ${this.t('country')} co ON co.id_country = a.id_country
       LEFT JOIN ${this.t('state')} s ON s.id_state = a.id_state
       WHERE a.deleted = 0 AND a.id_customer > 0
       ORDER BY a.id_customer, a.id_address`,
    );
  }

  close(): Promise<void> {
    return this.pool.end();
  }
}
