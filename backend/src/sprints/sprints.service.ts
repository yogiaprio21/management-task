import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Sprint } from './sprint.entity';
import { User } from '../users/user.entity';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class SprintsService {
  constructor(
    @InjectRepository(Sprint)
    private sprintsRepository: Repository<Sprint>,
    private auditService: AuditService,
  ) {}

  async create(sprintData: Partial<Sprint>, user: User): Promise<Sprint> {
    const sprint = this.sprintsRepository.create(sprintData);
    const savedSprint = await this.sprintsRepository.save(sprint);
    await this.auditService.log('create', 'Sprint', savedSprint.id, user, sprintData);
    return savedSprint;
  }

  async findAllByProject(projectId: string): Promise<Sprint[]> {
    return this.sprintsRepository.find({ where: { projectId } });
  }

  async findOne(id: string): Promise<Sprint> {
    const sprint = await this.sprintsRepository.findOne({ where: { id }, relations: ['tasks', 'project', 'project.owner'] });
    if (!sprint) throw new NotFoundException('Sprint not found');
    return sprint;
  }

  async update(id: string, sprintData: Partial<Sprint>, user: User): Promise<Sprint> {
    const sprint = await this.findOne(id);

    // RBAC: Admin or Project Manager (Owner of the project)
    const isProjectManager = sprint.project?.ownerId === user.id;
    if (user.role !== 'admin' && !isProjectManager) {
      throw new ForbiddenException('You are not authorized to update this sprint');
    }

    await this.sprintsRepository.update(id, sprintData);
    await this.auditService.log('update', 'Sprint', id, user, sprintData);
    return this.findOne(id);
  }

  async remove(id: string, user: User): Promise<void> {
    const sprint = await this.findOne(id);

    // RBAC: Admin or Project Manager
    const isProjectManager = sprint.project?.ownerId === user.id;
    if (user.role !== 'admin' && !isProjectManager) {
      throw new ForbiddenException('You are not authorized to delete this sprint');
    }

    await this.sprintsRepository.softDelete(id);
    await this.auditService.log('delete', 'Sprint', id, user);
  }
}
