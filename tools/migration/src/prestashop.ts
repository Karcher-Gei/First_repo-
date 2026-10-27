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
  name: string;
  link_rewrite: string;
}

export interface PsProduct {
  id_product: number;
  reference: string;
  ean13: string;
  active: number;
  id_category_default: number;
  category_slug: string;
  name: string;
  link_rewrite: string;
}

export interface PsCmsPage {
  id_cms: number;
  active: number;
  meta_title: string;
  link_rewrite: string;
}

export interface PsImage {
  id_image: number;
  id_product: number;
  cover: number | null;
  product_slug: string;
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
      `SELECT c.id_category, c.id_parent, c.level_depth, c.active, cl.name, cl.link_rewrite
       FROM ${this.t('category')} c
       JOIN ${this.t('category_lang')} cl
         ON cl.id_category = c.id_category AND cl.id_lang = ? AND cl.id_shop = ?
       WHERE c.level_depth >= 2
       ORDER BY c.id_category`,
      [this.cfg.langId, this.cfg.shopId],
    );
  }

  products(): Promise<PsProduct[]> {
    return this.rows<PsProduct>(
      `SELECT p.id_product, p.reference, p.ean13, p.active, p.id_category_default,
              cl.link_rewrite AS category_slug, pl.name, pl.link_rewrite
       FROM ${this.t('product')} p
       JOIN ${this.t('product_lang')} pl
         ON pl.id_product = p.id_product AND pl.id_lang = ? AND pl.id_shop = ?
       JOIN ${this.t('category_lang')} cl
         ON cl.id_category = p.id_category_default AND cl.id_lang = ? AND cl.id_shop = ?
       ORDER BY p.id_product`,
      [this.cfg.langId, this.cfg.shopId, this.cfg.langId, this.cfg.shopId],
    );
  }

  cmsPages(): Promise<PsCmsPage[]> {
    return this.rows<PsCmsPage>(
      `SELECT c.id_cms, c.active, l.meta_title, l.link_rewrite
       FROM ${this.t('cms')} c
       JOIN ${this.t('cms_lang')} l ON l.id_cms = c.id_cms AND l.id_lang = ? AND l.id_shop = ?
       ORDER BY c.id_cms`,
      [this.cfg.langId, this.cfg.shopId],
    );
  }

  images(): Promise<PsImage[]> {
    return this.rows<PsImage>(
      `SELECT i.id_image, i.id_product, i.cover, pl.link_rewrite AS product_slug
       FROM ${this.t('image')} i
       JOIN ${this.t('product_lang')} pl
         ON pl.id_product = i.id_product AND pl.id_lang = ? AND pl.id_shop = ?
       ORDER BY i.id_image`,
      [this.cfg.langId, this.cfg.shopId],
    );
  }

  close(): Promise<void> {
    return this.pool.end();
  }
}
