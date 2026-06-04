import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TasksService } from './tasks.service';
import { TasksController } from './tasks.controller';
import { Task } from './task.entity';
import { Comment } from './comment.entity';
import { Attachment } from './attachment.entity';
import { NotificationsModule } from '../notifications/notifications.module';
import { WebhooksModule } from '../integrations/webhooks/webhooks.module';
import { WorkspacesModule } from '../workspaces/workspaces.module';

@Module({
  imports: [TypeOrmModule.forFeature([Task, Comment, Attachment]), NotificationsModule, WebhooksModule, WorkspacesModule],
  providers: [TasksService],
  controllers: [TasksController],
  exports: [TasksService],
})
export class TasksModule {}
