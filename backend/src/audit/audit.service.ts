import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from './audit-log.entity';
import { User } from '../users/user.entity';

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private auditRepository: Repository<AuditLog>,
  ) {}

  async log(action: string, entityType: string, entityId: string, user: User, details: any = {}) {
    const log = this.auditRepository.create({
      action,
      entityType,
      entityId,
      userId: user?.id,
      details: JSON.stringify(details),
    });
    return this.auditRepository.save(log);
  }
}
