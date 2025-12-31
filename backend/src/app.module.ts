import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';

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

// Entities
import { User } from './users/user.entity';
import { Project } from './projects/project.entity';
import { Sprint } from './sprints/sprint.entity';
import { BacklogItem } from './backlog/backlog-item.entity';
import { Task } from './tasks/task.entity';
import { Notification } from './notifications/notification.entity';
import { DailyReport } from './reports/daily-report.entity';
import { AuditLog } from './audit/audit-log.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false, 
      },
      entities: [
        User,
        Project,
        Sprint,
        BacklogItem,
        Task,
        Notification,
        DailyReport,
        AuditLog,
      ],
      synchronize: false,
      logging: false,
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
  ],
})
export class AppModule {}
