import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BacklogService } from './backlog.service';
import { BacklogController } from './backlog.controller';
import { BacklogItem } from './backlog-item.entity';
import { WorkspacesModule } from '../workspaces/workspaces.module';

@Module({
  imports: [TypeOrmModule.forFeature([BacklogItem]), WorkspacesModule],
  providers: [BacklogService],
  controllers: [BacklogController],
  exports: [BacklogService],
})
export class BacklogModule {}
