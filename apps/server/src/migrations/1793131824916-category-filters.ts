import {MigrationInterface, QueryRunner} from "typeorm";

export class CategoryFilters1793131824916 implements MigrationInterface {

   public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "collection" ADD "customFieldsFilterfacetids" text`, undefined);
   }

   public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "collection" DROP COLUMN "customFieldsFilterfacetids"`, undefined);
   }

}
