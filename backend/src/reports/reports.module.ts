import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { DailyReport } from './daily-report.entity';
import { Project } from '../projects/project.entity';
import { Task } from '../tasks/task.entity';
import { Sprint } from '../sprints/sprint.entity';

@Module({
  imports: [TypeOrmModule.forFeature([DailyReport, Project, Task, Sprint])],
  providers: [ReportsService],
  controllers: [ReportsController],
})
export class ReportsModule {}
