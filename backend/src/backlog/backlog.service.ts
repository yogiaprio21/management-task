import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BacklogItem } from './backlog-item.entity';
import { User } from '../users/user.entity';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class BacklogService {
  constructor(
    @InjectRepository(BacklogItem)
    private backlogRepository: Repository<BacklogItem>,
    private auditService: AuditService,
  ) {}

  async create(itemData: Partial<BacklogItem>, user: User): Promise<BacklogItem> {
    const item = this.backlogRepository.create(itemData);
    const savedItem = await this.backlogRepository.save(item);
    await this.auditService.log('create', 'BacklogItem', savedItem.id, user, itemData);
    return savedItem;
  }

  async findAllByProject(projectId: string): Promise<BacklogItem[]> {
    return this.backlogRepository.find({ where: { projectId } });
  }

  async findOne(id: string): Promise<BacklogItem> {
    const item = await this.backlogRepository.findOne({ where: { id } });
    if (!item) throw new NotFoundException('Backlog item not found');
    return item;
  }

  async update(id: string, itemData: Partial<BacklogItem>, user: User): Promise<BacklogItem> {
    const item = await this.findOne(id);

    // RBAC: Admin or Assignee
    const isAssignee = item.assigneeId === user.id;
    if (user.role !== 'admin' && !isAssignee) {
      throw new ForbiddenException('You are not authorized to update this backlog item');
    }

    await this.backlogRepository.update(id, itemData);
    await this.auditService.log('update', 'BacklogItem', id, user, itemData);
    return this.findOne(id);
  }

  async remove(id: string, user: User): Promise<void> {
    const item = await this.findOne(id);

    // RBAC: Admin only
    if (user.role !== 'admin') {
      throw new ForbiddenException('Only admins can delete backlog items');
    }

    await this.backlogRepository.softDelete(id);
    await this.auditService.log('delete', 'BacklogItem', id, user);
  }
}
