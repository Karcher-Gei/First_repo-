import {MigrationInterface, QueryRunner} from "typeorm";

export class BrandAndAltFields1793127922372 implements MigrationInterface {

   public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "facet_value_translation" ADD "customFieldsDescription" text`, undefined);
        await queryRunner.query(`ALTER TABLE "facet_value_translation" ADD "customFieldsMetatitle" character varying(255)`, undefined);
        await queryRunner.query(`ALTER TABLE "facet_value_translation" ADD "customFieldsMetadescription" text`, undefined);
        await queryRunner.query(`ALTER TABLE "facet_value" ADD "customFieldsLegacymanufacturerid" integer`, undefined);
        await queryRunner.query(`ALTER TABLE "asset" ADD "customFieldsAlt" character varying(255)`, undefined);
   }

   public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "asset" DROP COLUMN "customFieldsAlt"`, undefined);
        await queryRunner.query(`ALTER TABLE "facet_value" DROP COLUMN "customFieldsLegacymanufacturerid"`, undefined);
        await queryRunner.query(`ALTER TABLE "facet_value_translation" DROP COLUMN "customFieldsMetadescription"`, undefined);
        await queryRunner.query(`ALTER TABLE "facet_value_translation" DROP COLUMN "customFieldsMetatitle"`, undefined);
        await queryRunner.query(`ALTER TABLE "facet_value_translation" DROP COLUMN "customFieldsDescription"`, undefined);
   }

}
