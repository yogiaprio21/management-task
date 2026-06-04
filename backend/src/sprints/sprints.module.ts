import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SprintsService } from './sprints.service';
import { SprintsController } from './sprints.controller';
import { Sprint } from './sprint.entity';
import { WebhooksModule } from '../integrations/webhooks/webhooks.module';

@Module({
  imports: [TypeOrmModule.forFeature([Sprint]), WebhooksModule],
  providers: [SprintsService],
  controllers: [SprintsController],
  exports: [SprintsService],
})
export class SprintsModule {}
