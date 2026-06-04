import { MigrationInterface, QueryRunner } from 'typeorm';

export class PortfolioUpgrade1760000000000 implements MigrationInterface {
  name = 'PortfolioUpgrade1760000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "webhooks" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "url" character varying NOT NULL,
        "events" text NOT NULL DEFAULT '',
        "active" boolean NOT NULL DEFAULT true,
        "projectId" uuid NOT NULL,
        "secret" character varying,
        "lastStatus" character varying,
        "lastTriggeredAt" TIMESTAMP,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "deletedAt" TIMESTAMP,
        CONSTRAINT "PK_webhooks_id" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_webhooks_projectId" ON "webhooks" ("projectId")`);

    await queryRunner.query(`ALTER TABLE "daily_reports" ADD COLUMN IF NOT EXISTS "content" text`);
    await queryRunner.query(`ALTER TABLE "daily_reports" ADD COLUMN IF NOT EXISTS "type" character varying NOT NULL DEFAULT 'daily'`);
    await queryRunner.query(`
      UPDATE "daily_reports"
      SET "content" = COALESCE(
        "content",
        NULLIF(
          CONCAT_WS(
            E'\\n\\n',
            CASE WHEN "completedYesterday" IS NOT NULL THEN CONCAT('Completed: ', "completedYesterday") END,
            CASE WHEN "planForToday" IS NOT NULL THEN CONCAT('Plan: ', "planForToday") END,
            CASE WHEN "blockers" IS NOT NULL THEN CONCAT('Blockers: ', "blockers") END
          ),
          ''
        ),
        'Report imported from legacy fields.'
      )
      WHERE "content" IS NULL
    `);
    await queryRunner.query(`ALTER TABLE "daily_reports" ALTER COLUMN "content" SET NOT NULL`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_webhooks_projectId"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "webhooks"`);
    await queryRunner.query(`ALTER TABLE "daily_reports" DROP COLUMN IF EXISTS "type"`);
    await queryRunner.query(`ALTER TABLE "daily_reports" DROP COLUMN IF EXISTS "content"`);
  }
}
