import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

// Modules
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ProjectsModule } from './projects/projects.module';
import { SprintsModule } from './sprints/sprints.module';
import { BacklogModule } from './backlog/backlog.module';
import { TasksModule } from './tasks/tasks.module';
import { NotificationsModule } from './notifications/notifications.module';
import { ReportsModule } from './reports/reports.module';
import { MailModule } from './integrations/mail/mail.module';
import { WebhooksModule } from './integrations/webhooks/webhooks.module';
import { AuditModule } from './audit/audit.module';
import { HealthModule } from './health/health.module';
import { WorkspacesModule } from './workspaces/workspaces.module';

// Entities
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

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [{
        ttl: config.get('THROTTLE_TTL') || 60000,
        limit: config.get('THROTTLE_LIMIT') || 100,
      }],
    }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        url: configService.get<string>('DATABASE_URL'),
        ssl: configService.get<string>('DB_SSL') === 'true' ? { rejectUnauthorized: false } : false,
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
        synchronize: String(configService.get('DB_SYNCHRONIZE')).toLowerCase() === 'true',
        logging: String(configService.get('DB_LOGGING')).toLowerCase() === 'true',
      }),
    }),

    AuthModule,
    UsersModule,
    ProjectsModule,
    SprintsModule,
    BacklogModule,
    TasksModule,
    NotificationsModule,
    ReportsModule,
    MailModule,
    WebhooksModule,
    AuditModule,
    HealthModule,
    WorkspacesModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
