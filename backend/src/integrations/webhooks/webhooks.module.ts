import { Module } from '@nestjs/common';
import { WebhooksService } from './webhooks.service';
import { HttpModule } from '@nestjs/axios';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Webhook } from './webhook.entity';
import { Project } from '../../projects/project.entity';
import { WebhooksController } from './webhooks.controller';
import { AuditModule } from '../../audit/audit.module';

@Module({
  imports: [HttpModule, TypeOrmModule.forFeature([Webhook, Project]), AuditModule],
  providers: [WebhooksService],
  controllers: [WebhooksController],
  exports: [WebhooksService],
})
export class WebhooksModule {}
