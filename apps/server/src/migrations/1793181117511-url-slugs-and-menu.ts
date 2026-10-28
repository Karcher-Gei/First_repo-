import {MigrationInterface, QueryRunner} from "typeorm";

export class UrlSlugsAndMenu1793181117511 implements MigrationInterface {

   public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "collection_translation" ADD "customFieldsMenulabel" character varying(255)`, undefined);
        await queryRunner.query(`ALTER TABLE "collection" ADD "customFieldsUrlslug" character varying(255)`, undefined);
        await queryRunner.query(`ALTER TABLE "collection" ADD "customFieldsHidefrommenu" boolean NOT NULL DEFAULT false`, undefined);
        await queryRunner.query(`ALTER TABLE "product" ADD "customFieldsUrlslug" character varying(255)`, undefined);
        await queryRunner.query(`ALTER TABLE "product" ADD "customFieldsDefaultcategoryid" integer`, undefined);
   }

   public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "product" DROP COLUMN "customFieldsDefaultcategoryid"`, undefined);
        await queryRunner.query(`ALTER TABLE "product" DROP COLUMN "customFieldsUrlslug"`, undefined);
        await queryRunner.query(`ALTER TABLE "collection" DROP COLUMN "customFieldsHidefrommenu"`, undefined);
        await queryRunner.query(`ALTER TABLE "collection" DROP COLUMN "customFieldsUrlslug"`, undefined);
        await queryRunner.query(`ALTER TABLE "collection_translation" DROP COLUMN "customFieldsMenulabel"`, undefined);
   }

}
