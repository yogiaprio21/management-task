import { MigrationInterface, QueryRunner } from 'typeorm';

export class PortfolioUpgrade1760000000000 implements MigrationInterface {
  name = 'PortfolioUpgrade1760000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "users" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "email" character varying NOT NULL,
        "password" character varying NOT NULL,
        "name" character varying NOT NULL,
        "role" character varying NOT NULL DEFAULT 'user',
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_users_email" UNIQUE ("email"),
        CONSTRAINT "PK_users_id" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "projects" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying NOT NULL,
        "description" character varying,
        "ownerId" uuid NOT NULL,
        "deadline" TIMESTAMP,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "deletedAt" TIMESTAMP,
        "version" integer NOT NULL DEFAULT 1,
        CONSTRAINT "PK_projects_id" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "project_members" (
        "projectsId" uuid NOT NULL,
        "usersId" uuid NOT NULL,
        CONSTRAINT "PK_project_members" PRIMARY KEY ("projectsId", "usersId")
      )
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "sprints" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying NOT NULL,
        "startDate" TIMESTAMP NOT NULL,
        "endDate" TIMESTAMP NOT NULL,
        "status" character varying NOT NULL DEFAULT 'planned',
        "projectId" uuid NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "deletedAt" TIMESTAMP,
        "version" integer NOT NULL DEFAULT 1,
        CONSTRAINT "PK_sprints_id" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "backlog_items" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "title" character varying NOT NULL,
        "description" character varying,
        "priority" character varying NOT NULL DEFAULT 'low',
        "status" character varying NOT NULL DEFAULT 'todo',
        "projectId" uuid NOT NULL,
        "assigneeId" uuid,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "deletedAt" TIMESTAMP,
        "version" integer NOT NULL DEFAULT 1,
        CONSTRAINT "PK_backlog_items_id" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "tasks" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "title" character varying NOT NULL,
        "description" character varying,
        "status" character varying NOT NULL DEFAULT 'todo',
        "priority" character varying NOT NULL DEFAULT 'medium',
        "deadline" TIMESTAMP,
        "creatorId" uuid,
        "assigneeId" uuid,
        "sprintId" uuid,
        "backlogItemId" uuid,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "deletedAt" TIMESTAMP,
        "version" integer NOT NULL DEFAULT 1,
        CONSTRAINT "PK_tasks_id" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "comments" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "content" text NOT NULL,
        "taskId" uuid NOT NULL,
        "userId" uuid NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_comments_id" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "attachments" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "filename" character varying NOT NULL,
        "url" character varying NOT NULL,
        "mimetype" character varying NOT NULL,
        "taskId" uuid NOT NULL,
        "userId" uuid NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_attachments_id" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "notifications" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "title" character varying,
        "message" character varying NOT NULL,
        "isRead" boolean NOT NULL DEFAULT false,
        "userId" uuid NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_notifications_id" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "audit_logs" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "action" character varying NOT NULL,
        "entityType" character varying NOT NULL,
        "entityId" character varying NOT NULL,
        "details" text,
        "userId" uuid,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_audit_logs_id" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "daily_reports" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "content" text,
        "type" character varying NOT NULL DEFAULT 'daily',
        "completedYesterday" text,
        "planForToday" text,
        "blockers" text,
        "userId" uuid NOT NULL,
        "projectId" uuid NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_daily_reports_id" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_projects_ownerId" ON "projects" ("ownerId")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_projects_deadline" ON "projects" ("deadline")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_projects_createdAt" ON "projects" ("createdAt")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_project_members_projectsId" ON "project_members" ("projectsId")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_project_members_usersId" ON "project_members" ("usersId")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_tasks_title" ON "tasks" ("title")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_tasks_status" ON "tasks" ("status")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_tasks_priority" ON "tasks" ("priority")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_tasks_creatorId" ON "tasks" ("creatorId")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_tasks_assigneeId" ON "tasks" ("assigneeId")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_tasks_sprintId" ON "tasks" ("sprintId")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_tasks_backlogItemId" ON "tasks" ("backlogItemId")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_tasks_createdAt" ON "tasks" ("createdAt")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_comments_taskId" ON "comments" ("taskId")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_comments_userId" ON "comments" ("userId")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_attachments_taskId" ON "attachments" ("taskId")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_attachments_userId" ON "attachments" ("userId")`);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "workspaces" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying NOT NULL,
        "description" character varying,
        "type" character varying NOT NULL DEFAULT 'team',
        "ownerId" uuid,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "deletedAt" TIMESTAMP,
        CONSTRAINT "PK_workspaces_id" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_workspaces_name" ON "workspaces" ("name")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_workspaces_ownerId" ON "workspaces" ("ownerId")`);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "workspace_members" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "workspaceId" uuid NOT NULL,
        "userId" uuid NOT NULL,
        "role" character varying NOT NULL DEFAULT 'member',
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_workspace_members_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_workspace_members_workspace_user" UNIQUE ("workspaceId", "userId")
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_workspace_members_workspaceId" ON "workspace_members" ("workspaceId")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_workspace_members_userId" ON "workspace_members" ("userId")`);
    await queryRunner.query(`ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "workspaceId" uuid`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_projects_workspaceId" ON "projects" ("workspaceId")`);
    await queryRunner.query(`
      WITH owners AS (
        SELECT DISTINCT p."ownerId", COALESCE(u."name", 'Personal') AS "ownerName"
        FROM "projects" p
        LEFT JOIN "users" u ON u."id" = p."ownerId"
        WHERE p."ownerId" IS NOT NULL
      )
      INSERT INTO "workspaces" ("name", "description", "type", "ownerId")
      SELECT CONCAT(owners."ownerName", '''s Workspace'), 'Default workspace migrated from existing projects.', 'personal', owners."ownerId"
      FROM owners
      WHERE NOT EXISTS (
        SELECT 1 FROM "workspaces" w WHERE w."ownerId" = owners."ownerId" AND w."type" = 'personal'
      )
    `);
    await queryRunner.query(`
      INSERT INTO "workspace_members" ("workspaceId", "userId", "role")
      SELECT w."id", w."ownerId", 'owner'
      FROM "workspaces" w
      WHERE w."ownerId" IS NOT NULL
      ON CONFLICT ("workspaceId", "userId") DO NOTHING
    `);
    await queryRunner.query(`
      UPDATE "projects" p
      SET "workspaceId" = w."id"
      FROM "workspaces" w
      WHERE p."workspaceId" IS NULL
        AND p."ownerId" = w."ownerId"
        AND w."type" = 'personal'
    `);
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
    await queryRunner.query(`ALTER TABLE "daily_reports" ADD COLUMN IF NOT EXISTS "completedYesterday" text`);
    await queryRunner.query(`ALTER TABLE "daily_reports" ADD COLUMN IF NOT EXISTS "planForToday" text`);
    await queryRunner.query(`ALTER TABLE "daily_reports" ADD COLUMN IF NOT EXISTS "blockers" text`);
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
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_projects_workspaceId"`);
    await queryRunner.query(`ALTER TABLE "projects" DROP COLUMN IF EXISTS "workspaceId"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_workspace_members_userId"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_workspace_members_workspaceId"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "workspace_members"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_workspaces_ownerId"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_workspaces_name"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "workspaces"`);
    await queryRunner.query(`ALTER TABLE "daily_reports" DROP COLUMN IF EXISTS "type"`);
    await queryRunner.query(`ALTER TABLE "daily_reports" DROP COLUMN IF EXISTS "content"`);
  }
}
