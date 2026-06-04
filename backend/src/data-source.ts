import 'dotenv/config';
import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { User } from './users/user.entity';
import { Project } from './projects/project.entity';
import { Sprint } from './sprints/sprint.entity';
import { BacklogItem } from './backlog/backlog-item.entity';
import { Task } from './tasks/task.entity';
import { Comment } from './tasks/comment.entity';
import { Attachment } from './tasks/attachment.entity';
import { Notification } from './notifications/notification.entity';
import { DailyReport } from './reports/daily-report.entity';
import { AuditLog } from './audit/audit-log.entity';
import { Webhook } from './integrations/webhooks/webhook.entity';
import { Workspace } from './workspaces/workspace.entity';
import { WorkspaceMember } from './workspaces/workspace-member.entity';

export default new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  entities: [
    User,
    Project,
    Sprint,
    BacklogItem,
    Task,
    Comment,
    Attachment,
    Notification,
    DailyReport,
    AuditLog,
    Webhook,
    Workspace,
    WorkspaceMember,
  ],
  migrations: ['dist/migrations/*.js'],
  synchronize: false,
});
