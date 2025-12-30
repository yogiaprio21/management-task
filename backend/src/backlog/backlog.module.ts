import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BacklogService } from './backlog.service';
import { BacklogController } from './backlog.controller';
import { BacklogItem } from './backlog-item.entity';

@Module({
  imports: [TypeOrmModule.forFeature([BacklogItem])],
  providers: [BacklogService],
  controllers: [BacklogController],
  exports: [BacklogService],
})
export class BacklogModule {}
