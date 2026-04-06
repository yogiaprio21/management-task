import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Sprint } from './sprint.entity';
import { User } from '../users/user.entity';
import { AuditService } from 'src/audit/audit.service';

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

  async findAllByProject(projectId: string, user: User): Promise<Sprint[]> {
    // Check if user has access to project
    const project = await this.sprintsRepository.manager.getRepository('Project').findOne({
      where: { id: projectId },
      relations: ['members']
    }) as any;

    if (!project) throw new NotFoundException('Project not found');

    const isMember = project.members.some(m => m.id === user.id);
    const isOwner = project.ownerId === user.id;

    if (!isOwner && !isMember && user.role !== 'admin') {
      throw new ForbiddenException('You do not have access to this project');
    }

    return this.sprintsRepository.find({ where: { projectId } });
  }

  async findOne(id: string, user: User): Promise<Sprint> {
    const sprint = await this.sprintsRepository.findOne({ where: { id }, relations: ['tasks', 'project', 'project.owner', 'project.members'] });
    if (!sprint) throw new NotFoundException('Sprint not found');

    const isMember = sprint.project.members.some(m => m.id === user.id);
    const isOwner = sprint.project.ownerId === user.id;

    if (!isOwner && !isMember && user.role !== 'admin') {
      throw new ForbiddenException('You do not have access to this sprint');
    }

    return sprint;
  }

  async update(id: string, sprintData: Partial<Sprint>, user: User): Promise<Sprint> {
    const sprint = await this.findOne(id, user);

    // RBAC: Admin or Project Manager (Owner of the project)
    const isProjectManager = sprint.project?.ownerId === user.id;
    if (user.role !== 'admin' && !isProjectManager) {
      throw new ForbiddenException('You are not authorized to update this sprint');
    }

    await this.sprintsRepository.update(id, sprintData);
    await this.auditService.log('update', 'Sprint', id, user, sprintData);
    return this.findOne(id, user);
  }

  async remove(id: string, user: User): Promise<void> {
    const sprint = await this.findOne(id, user);

    // RBAC: Admin or Project Manager
    const isProjectManager = sprint.project?.ownerId === user.id;
    if (user.role !== 'admin' && !isProjectManager) {
      throw new ForbiddenException('You are not authorized to delete this sprint');
    }

    await this.sprintsRepository.softDelete(id);
    await this.auditService.log('delete', 'Sprint', id, user);
  }
}
