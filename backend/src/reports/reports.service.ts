import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DailyReport } from './daily-report.entity';
import { User } from '../users/user.entity';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(DailyReport)
    private reportsRepository: Repository<DailyReport>,
  ) {}

  async create(reportData: Partial<DailyReport>, user: User): Promise<DailyReport> {
    const report = this.reportsRepository.create({ ...reportData, user, userId: user.id });
    return this.reportsRepository.save(report);
  }

  async findAllByProject(projectId: string): Promise<DailyReport[]> {
    return this.reportsRepository.find({ where: { projectId }, relations: ['user'] });
  }
}
