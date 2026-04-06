import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProjectsService } from './projects.service';
import { ProjectsController } from './projects.controller';
import { Project } from './project.entity';
import { User } from '../users/user.entity';
import { AuditModule } from '../audit/audit.module';
import { MailModule } from '../integrations/mail/mail.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Project, User]),
    AuditModule,
    MailModule,
  ],
  providers: [ProjectsService],
  controllers: [ProjectsController],
  exports: [ProjectsService],
})
export class ProjectsModule {}
