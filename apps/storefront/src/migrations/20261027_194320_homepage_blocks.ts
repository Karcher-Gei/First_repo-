import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_homepage_blocks_product_carousel_source" AS ENUM('collection', 'best-sellers', 'newest', 'catalog');
  CREATE TABLE "homepage_blocks_home_hero" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"text" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "homepage_blocks_universes" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "homepage_blocks_category_grid" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "homepage_blocks_pro_banner" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "homepage_blocks_services" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "homepage_blocks_after_sales" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_name" varchar
  );
  
  ALTER TABLE "homepage_blocks_product_carousel" ALTER COLUMN "collection_slug" DROP NOT NULL;
  ALTER TABLE "homepage_blocks_product_carousel" ALTER COLUMN "limit" SET DEFAULT 8;
  ALTER TABLE "homepage_blocks_product_carousel" ADD COLUMN "source" "enum_homepage_blocks_product_carousel_source" DEFAULT 'collection' NOT NULL;
  ALTER TABLE "homepage_blocks_product_carousel" ADD COLUMN "link" varchar;
  ALTER TABLE "homepage_blocks_home_hero" ADD CONSTRAINT "homepage_blocks_home_hero_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_blocks_universes" ADD CONSTRAINT "homepage_blocks_universes_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_blocks_category_grid" ADD CONSTRAINT "homepage_blocks_category_grid_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_blocks_pro_banner" ADD CONSTRAINT "homepage_blocks_pro_banner_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_blocks_services" ADD CONSTRAINT "homepage_blocks_services_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_blocks_after_sales" ADD CONSTRAINT "homepage_blocks_after_sales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "homepage_blocks_home_hero_order_idx" ON "homepage_blocks_home_hero" USING btree ("_order");
  CREATE INDEX "homepage_blocks_home_hero_parent_id_idx" ON "homepage_blocks_home_hero" USING btree ("_parent_id");
  CREATE INDEX "homepage_blocks_home_hero_path_idx" ON "homepage_blocks_home_hero" USING btree ("_path");
  CREATE INDEX "homepage_blocks_universes_order_idx" ON "homepage_blocks_universes" USING btree ("_order");
  CREATE INDEX "homepage_blocks_universes_parent_id_idx" ON "homepage_blocks_universes" USING btree ("_parent_id");
  CREATE INDEX "homepage_blocks_universes_path_idx" ON "homepage_blocks_universes" USING btree ("_path");
  CREATE INDEX "homepage_blocks_category_grid_order_idx" ON "homepage_blocks_category_grid" USING btree ("_order");
  CREATE INDEX "homepage_blocks_category_grid_parent_id_idx" ON "homepage_blocks_category_grid" USING btree ("_parent_id");
  CREATE INDEX "homepage_blocks_category_grid_path_idx" ON "homepage_blocks_category_grid" USING btree ("_path");
  CREATE INDEX "homepage_blocks_pro_banner_order_idx" ON "homepage_blocks_pro_banner" USING btree ("_order");
  CREATE INDEX "homepage_blocks_pro_banner_parent_id_idx" ON "homepage_blocks_pro_banner" USING btree ("_parent_id");
  CREATE INDEX "homepage_blocks_pro_banner_path_idx" ON "homepage_blocks_pro_banner" USING btree ("_path");
  CREATE INDEX "homepage_blocks_services_order_idx" ON "homepage_blocks_services" USING btree ("_order");
  CREATE INDEX "homepage_blocks_services_parent_id_idx" ON "homepage_blocks_services" USING btree ("_parent_id");
  CREATE INDEX "homepage_blocks_services_path_idx" ON "homepage_blocks_services" USING btree ("_path");
  CREATE INDEX "homepage_blocks_after_sales_order_idx" ON "homepage_blocks_after_sales" USING btree ("_order");
  CREATE INDEX "homepage_blocks_after_sales_parent_id_idx" ON "homepage_blocks_after_sales" USING btree ("_parent_id");
  CREATE INDEX "homepage_blocks_after_sales_path_idx" ON "homepage_blocks_after_sales" USING btree ("_path");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "homepage_blocks_home_hero" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "homepage_blocks_universes" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "homepage_blocks_category_grid" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "homepage_blocks_pro_banner" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "homepage_blocks_services" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "homepage_blocks_after_sales" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "homepage_blocks_home_hero" CASCADE;
  DROP TABLE "homepage_blocks_universes" CASCADE;
  DROP TABLE "homepage_blocks_category_grid" CASCADE;
  DROP TABLE "homepage_blocks_pro_banner" CASCADE;
  DROP TABLE "homepage_blocks_services" CASCADE;
  DROP TABLE "homepage_blocks_after_sales" CASCADE;
  ALTER TABLE "homepage_blocks_product_carousel" ALTER COLUMN "collection_slug" SET NOT NULL;
  ALTER TABLE "homepage_blocks_product_carousel" ALTER COLUMN "limit" SET DEFAULT 6;
  ALTER TABLE "homepage_blocks_product_carousel" DROP COLUMN "source";
  ALTER TABLE "homepage_blocks_product_carousel" DROP COLUMN "link";
  DROP TYPE "public"."enum_homepage_blocks_product_carousel_source";`)
}
