import {MigrationInterface, QueryRunner} from "typeorm";

export class MerchandisingFields1793128860778 implements MigrationInterface {

   public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "product" ADD "customFieldsAddedat" TIMESTAMP(6)`, undefined);
        await queryRunner.query(`ALTER TABLE "product" ADD "customFieldsUnitssold" integer NOT NULL DEFAULT '0'`, undefined);
        await queryRunner.query(`ALTER TABLE "product_variant" ADD "customFieldsRegularprice" integer`, undefined);
        await queryRunner.query(`ALTER TABLE "product_variant" ADD "customFieldsSaleendsat" TIMESTAMP(6)`, undefined);
   }

   public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "product_variant" DROP COLUMN "customFieldsSaleendsat"`, undefined);
        await queryRunner.query(`ALTER TABLE "product_variant" DROP COLUMN "customFieldsRegularprice"`, undefined);
        await queryRunner.query(`ALTER TABLE "product" DROP COLUMN "customFieldsUnitssold"`, undefined);
        await queryRunner.query(`ALTER TABLE "product" DROP COLUMN "customFieldsAddedat"`, undefined);
   }

}
