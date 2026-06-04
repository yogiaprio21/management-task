import { MigrationInterface, QueryRunner } from 'typeorm';

export class NeonSchemaHardening1760000001000 implements MigrationInterface {
  name = 'NeonSchemaHardening1760000001000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

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
    await queryRunner.query(`ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "workspaceId" uuid`);
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

    await queryRunner.query(`
      WITH user_workspace AS (
        SELECT u."id" AS "userId", u."name" AS "userName"
        FROM "users" u
        WHERE NOT EXISTS (
          SELECT 1
          FROM "workspace_members" wm
          JOIN "workspaces" w ON w."id" = wm."workspaceId"
          WHERE wm."userId" = u."id" AND w."type" = 'personal'
        )
      )
      INSERT INTO "workspaces" ("name", "description", "type", "ownerId")
      SELECT CONCAT(COALESCE(user_workspace."userName", 'Personal'), '''s Workspace'), 'Private workspace for personal projects and tasks.', 'personal', user_workspace."userId"
      FROM user_workspace
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
      INSERT INTO "workspace_members" ("workspaceId", "userId", "role")
      SELECT p."workspaceId", pm."usersId", 'member'
      FROM "project_members" pm
      JOIN "projects" p ON p."id" = pm."projectsId"
      WHERE p."workspaceId" IS NOT NULL
      ON CONFLICT ("workspaceId", "userId") DO NOTHING
    `);

    await queryRunner.query(`DELETE FROM "workspace_members" wm WHERE NOT EXISTS (SELECT 1 FROM "workspaces" w WHERE w."id" = wm."workspaceId")`);
    await queryRunner.query(`DELETE FROM "workspace_members" wm WHERE NOT EXISTS (SELECT 1 FROM "users" u WHERE u."id" = wm."userId")`);
    await queryRunner.query(`UPDATE "projects" p SET "workspaceId" = NULL WHERE p."workspaceId" IS NOT NULL AND NOT EXISTS (SELECT 1 FROM "workspaces" w WHERE w."id" = p."workspaceId")`);
    await queryRunner.query(`DELETE FROM "webhooks" wh WHERE NOT EXISTS (SELECT 1 FROM "projects" p WHERE p."id" = wh."projectId")`);
    await queryRunner.query(`DELETE FROM "daily_reports" dr WHERE NOT EXISTS (SELECT 1 FROM "projects" p WHERE p."id" = dr."projectId")`);
    await queryRunner.query(`DELETE FROM "daily_reports" dr WHERE NOT EXISTS (SELECT 1 FROM "users" u WHERE u."id" = dr."userId")`);
    await queryRunner.query(`DELETE FROM "project_members" pm WHERE NOT EXISTS (SELECT 1 FROM "projects" p WHERE p."id" = pm."projectsId")`);
    await queryRunner.query(`DELETE FROM "project_members" pm WHERE NOT EXISTS (SELECT 1 FROM "users" u WHERE u."id" = pm."usersId")`);
    await queryRunner.query(`DELETE FROM "sprints" s WHERE NOT EXISTS (SELECT 1 FROM "projects" p WHERE p."id" = s."projectId")`);
    await queryRunner.query(`DELETE FROM "backlog_items" bi WHERE NOT EXISTS (SELECT 1 FROM "projects" p WHERE p."id" = bi."projectId")`);
    await queryRunner.query(`UPDATE "backlog_items" bi SET "assigneeId" = NULL WHERE bi."assigneeId" IS NOT NULL AND NOT EXISTS (SELECT 1 FROM "users" u WHERE u."id" = bi."assigneeId")`);
    await queryRunner.query(`UPDATE "tasks" t SET "creatorId" = NULL WHERE t."creatorId" IS NOT NULL AND NOT EXISTS (SELECT 1 FROM "users" u WHERE u."id" = t."creatorId")`);
    await queryRunner.query(`UPDATE "tasks" t SET "assigneeId" = NULL WHERE t."assigneeId" IS NOT NULL AND NOT EXISTS (SELECT 1 FROM "users" u WHERE u."id" = t."assigneeId")`);
    await queryRunner.query(`UPDATE "tasks" t SET "sprintId" = NULL WHERE t."sprintId" IS NOT NULL AND NOT EXISTS (SELECT 1 FROM "sprints" s WHERE s."id" = t."sprintId")`);
    await queryRunner.query(`UPDATE "tasks" t SET "backlogItemId" = NULL WHERE t."backlogItemId" IS NOT NULL AND NOT EXISTS (SELECT 1 FROM "backlog_items" bi WHERE bi."id" = t."backlogItemId")`);
    await queryRunner.query(`DELETE FROM "comments" c WHERE NOT EXISTS (SELECT 1 FROM "tasks" t WHERE t."id" = c."taskId")`);
    await queryRunner.query(`DELETE FROM "comments" c WHERE NOT EXISTS (SELECT 1 FROM "users" u WHERE u."id" = c."userId")`);
    await queryRunner.query(`DELETE FROM "attachments" a WHERE NOT EXISTS (SELECT 1 FROM "tasks" t WHERE t."id" = a."taskId")`);
    await queryRunner.query(`DELETE FROM "attachments" a WHERE NOT EXISTS (SELECT 1 FROM "users" u WHERE u."id" = a."userId")`);
    await queryRunner.query(`DELETE FROM "notifications" n WHERE NOT EXISTS (SELECT 1 FROM "users" u WHERE u."id" = n."userId")`);
    await queryRunner.query(`UPDATE "audit_logs" al SET "userId" = NULL WHERE al."userId" IS NOT NULL AND NOT EXISTS (SELECT 1 FROM "users" u WHERE u."id" = al."userId")`);

    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_workspaces_name" ON "workspaces" ("name")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_workspaces_ownerId" ON "workspaces" ("ownerId")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_workspace_members_workspaceId" ON "workspace_members" ("workspaceId")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_workspace_members_userId" ON "workspace_members" ("userId")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_projects_workspaceId" ON "projects" ("workspaceId")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_sprints_projectId" ON "sprints" ("projectId")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_backlog_items_projectId" ON "backlog_items" ("projectId")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_daily_reports_projectId" ON "daily_reports" ("projectId")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_daily_reports_userId" ON "daily_reports" ("userId")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_webhooks_projectId" ON "webhooks" ("projectId")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_notifications_userId" ON "notifications" ("userId")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_audit_logs_userId" ON "audit_logs" ("userId")`);

    await this.addForeignKey(queryRunner, 'FK_projects_owner', 'projects', 'ownerId', 'users', 'id', 'CASCADE');
    await this.addForeignKey(queryRunner, 'FK_project_members_project', 'project_members', 'projectsId', 'projects', 'id', 'CASCADE');
    await this.addForeignKey(queryRunner, 'FK_project_members_user', 'project_members', 'usersId', 'users', 'id', 'CASCADE');
    await this.addForeignKey(queryRunner, 'FK_workspaces_owner', 'workspaces', 'ownerId', 'users', 'id', 'SET NULL');
    await this.addForeignKey(queryRunner, 'FK_workspace_members_workspace', 'workspace_members', 'workspaceId', 'workspaces', 'id', 'CASCADE');
    await this.addForeignKey(queryRunner, 'FK_workspace_members_user', 'workspace_members', 'userId', 'users', 'id', 'CASCADE');
    await this.addForeignKey(queryRunner, 'FK_projects_workspace', 'projects', 'workspaceId', 'workspaces', 'id', 'SET NULL');
    await this.addForeignKey(queryRunner, 'FK_sprints_project', 'sprints', 'projectId', 'projects', 'id', 'CASCADE');
    await this.addForeignKey(queryRunner, 'FK_backlog_items_project', 'backlog_items', 'projectId', 'projects', 'id', 'CASCADE');
    await this.addForeignKey(queryRunner, 'FK_backlog_items_assignee', 'backlog_items', 'assigneeId', 'users', 'id', 'SET NULL');
    await this.addForeignKey(queryRunner, 'FK_webhooks_project', 'webhooks', 'projectId', 'projects', 'id', 'CASCADE');
    await this.addForeignKey(queryRunner, 'FK_daily_reports_project', 'daily_reports', 'projectId', 'projects', 'id', 'CASCADE');
    await this.addForeignKey(queryRunner, 'FK_daily_reports_user', 'daily_reports', 'userId', 'users', 'id', 'CASCADE');
    await this.addForeignKey(queryRunner, 'FK_tasks_creator', 'tasks', 'creatorId', 'users', 'id', 'SET NULL');
    await this.addForeignKey(queryRunner, 'FK_tasks_assignee', 'tasks', 'assigneeId', 'users', 'id', 'SET NULL');
    await this.addForeignKey(queryRunner, 'FK_tasks_sprint', 'tasks', 'sprintId', 'sprints', 'id', 'SET NULL');
    await this.addForeignKey(queryRunner, 'FK_tasks_backlog_item', 'tasks', 'backlogItemId', 'backlog_items', 'id', 'SET NULL');
    await this.addForeignKey(queryRunner, 'FK_comments_task', 'comments', 'taskId', 'tasks', 'id', 'CASCADE');
    await this.addForeignKey(queryRunner, 'FK_comments_user', 'comments', 'userId', 'users', 'id', 'CASCADE');
    await this.addForeignKey(queryRunner, 'FK_attachments_task', 'attachments', 'taskId', 'tasks', 'id', 'CASCADE');
    await this.addForeignKey(queryRunner, 'FK_attachments_user', 'attachments', 'userId', 'users', 'id', 'CASCADE');
    await this.addForeignKey(queryRunner, 'FK_notifications_user', 'notifications', 'userId', 'users', 'id', 'CASCADE');
    await this.addForeignKey(queryRunner, 'FK_audit_logs_user', 'audit_logs', 'userId', 'users', 'id', 'SET NULL');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "tasks" DROP CONSTRAINT IF EXISTS "FK_tasks_backlog_item"`);
    await queryRunner.query(`ALTER TABLE "audit_logs" DROP CONSTRAINT IF EXISTS "FK_audit_logs_user"`);
    await queryRunner.query(`ALTER TABLE "notifications" DROP CONSTRAINT IF EXISTS "FK_notifications_user"`);
    await queryRunner.query(`ALTER TABLE "attachments" DROP CONSTRAINT IF EXISTS "FK_attachments_user"`);
    await queryRunner.query(`ALTER TABLE "attachments" DROP CONSTRAINT IF EXISTS "FK_attachments_task"`);
    await queryRunner.query(`ALTER TABLE "comments" DROP CONSTRAINT IF EXISTS "FK_comments_user"`);
    await queryRunner.query(`ALTER TABLE "comments" DROP CONSTRAINT IF EXISTS "FK_comments_task"`);
    await queryRunner.query(`ALTER TABLE "tasks" DROP CONSTRAINT IF EXISTS "FK_tasks_sprint"`);
    await queryRunner.query(`ALTER TABLE "tasks" DROP CONSTRAINT IF EXISTS "FK_tasks_assignee"`);
    await queryRunner.query(`ALTER TABLE "tasks" DROP CONSTRAINT IF EXISTS "FK_tasks_creator"`);
    await queryRunner.query(`ALTER TABLE "daily_reports" DROP CONSTRAINT IF EXISTS "FK_daily_reports_user"`);
    await queryRunner.query(`ALTER TABLE "daily_reports" DROP CONSTRAINT IF EXISTS "FK_daily_reports_project"`);
    await queryRunner.query(`ALTER TABLE "webhooks" DROP CONSTRAINT IF EXISTS "FK_webhooks_project"`);
    await queryRunner.query(`ALTER TABLE "backlog_items" DROP CONSTRAINT IF EXISTS "FK_backlog_items_assignee"`);
    await queryRunner.query(`ALTER TABLE "backlog_items" DROP CONSTRAINT IF EXISTS "FK_backlog_items_project"`);
    await queryRunner.query(`ALTER TABLE "sprints" DROP CONSTRAINT IF EXISTS "FK_sprints_project"`);
    await queryRunner.query(`ALTER TABLE "projects" DROP CONSTRAINT IF EXISTS "FK_projects_workspace"`);
    await queryRunner.query(`ALTER TABLE "workspace_members" DROP CONSTRAINT IF EXISTS "FK_workspace_members_user"`);
    await queryRunner.query(`ALTER TABLE "workspace_members" DROP CONSTRAINT IF EXISTS "FK_workspace_members_workspace"`);
    await queryRunner.query(`ALTER TABLE "workspaces" DROP CONSTRAINT IF EXISTS "FK_workspaces_owner"`);
    await queryRunner.query(`ALTER TABLE "project_members" DROP CONSTRAINT IF EXISTS "FK_project_members_user"`);
    await queryRunner.query(`ALTER TABLE "project_members" DROP CONSTRAINT IF EXISTS "FK_project_members_project"`);
    await queryRunner.query(`ALTER TABLE "projects" DROP CONSTRAINT IF EXISTS "FK_projects_owner"`);
  }

  private async addForeignKey(
    queryRunner: QueryRunner,
    constraint: string,
    table: string,
    column: string,
    targetTable: string,
    targetColumn: string,
    onDelete: 'CASCADE' | 'SET NULL',
  ): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '${constraint}') THEN
          ALTER TABLE "${table}"
          ADD CONSTRAINT "${constraint}"
          FOREIGN KEY ("${column}") REFERENCES "${targetTable}"("${targetColumn}")
          ON DELETE ${onDelete};
        END IF;
      END $$;
    `);
  }
}
