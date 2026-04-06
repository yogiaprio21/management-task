import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BacklogItem } from './backlog-item.entity';
import { User } from 'src/users/user.entity';
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

  async findAllByProject(projectId: string, user: User): Promise<BacklogItem[]> {
    // Check access
    const project = await this.backlogRepository.manager.getRepository('Project').findOne({
      where: { id: projectId },
      relations: ['members']
    }) as any;

    if (!project) throw new NotFoundException('Project not found');

    const isMember = project.members.some(m => m.id === user.id);
    const isOwner = project.ownerId === user.id;

    if (!isOwner && !isMember && user.role !== 'admin') {
      throw new ForbiddenException('You do not have access to this project');
    }

    return this.backlogRepository.find({ where: { projectId } });
  }

  async findOne(id: string, user: User): Promise<BacklogItem> {
    const item = await this.backlogRepository.findOne({ 
      where: { id },
      relations: ['project', 'project.members']
    }) as any;
    if (!item) throw new NotFoundException('Backlog item not found');

    const isMember = item.project.members.some(m => m.id === user.id);
    const isOwner = item.project.ownerId === user.id;

    if (!isOwner && !isMember && user.role !== 'admin') {
      throw new ForbiddenException('You do not have access to this backlog item');
    }

    return item;
  }

  async update(id: string, itemData: Partial<BacklogItem>, user: User): Promise<BacklogItem> {
    const item = await this.findOne(id, user);

    // RBAC: Admin or Assignee or Project Owner
    const isAssignee = item.assigneeId === user.id;
    const isProjectOwner = (item.project as any).ownerId === user.id;

    if (user.role !== 'admin' && !isAssignee && !isProjectOwner) {
      throw new ForbiddenException('You are not authorized to update this backlog item');
    }

    await this.backlogRepository.update(id, itemData);
    await this.auditService.log('update', 'BacklogItem', id, user, itemData);
    return this.findOne(id, user);
  }

  async remove(id: string, user: User): Promise<void> {
    const item = await this.findOne(id, user);

    // RBAC: Admin or Project Owner
    const isProjectOwner = (item.project as any).ownerId === user.id;
    if (user.role !== 'admin' && !isProjectOwner) {
      throw new ForbiddenException('Only admins or project owners can delete backlog items');
    }

    await this.backlogRepository.softDelete(id);
    await this.auditService.log('delete', 'BacklogItem', id, user);
  }
}
