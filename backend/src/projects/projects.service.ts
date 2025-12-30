import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project } from './project.entity';
import { User } from '../users/user.entity';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project)
    private projectsRepository: Repository<Project>,
    private auditService: AuditService,
  ) {}

  async create(projectData: Partial<Project>, user: User): Promise<Project> {
    const project = this.projectsRepository.create({ ...projectData, owner: user });
    const savedProject = await this.projectsRepository.save(project);
    await this.auditService.log('create', 'Project', savedProject.id, user, projectData);
    return savedProject;
  }

  async findAll(): Promise<Project[]> {
    return this.projectsRepository.find({ relations: ['owner'] });
  }

  async findOne(id: string): Promise<Project> {
    const project = await this.projectsRepository.findOne({ where: { id }, relations: ['owner', 'sprints', 'backlogItems'] });
    if (!project) throw new NotFoundException('Project not found');
    return project;
  }

  async update(id: string, projectData: Partial<Project>, user: User): Promise<Project> {
    const project = await this.findOne(id);

    // RBAC: Admin or Owner
    if (user.role !== 'admin' && project.ownerId !== user.id) {
      throw new ForbiddenException('You are not authorized to update this project');
    }

    await this.projectsRepository.update(id, projectData);
    await this.auditService.log('update', 'Project', id, user, projectData);
    return this.findOne(id);
  }

  async remove(id: string, user: User): Promise<void> {
    const project = await this.findOne(id);

    // RBAC: Admin or Owner
    if (user.role !== 'admin' && project.ownerId !== user.id) {
      throw new ForbiddenException('You are not authorized to delete this project');
    }

    await this.projectsRepository.softDelete(id);
    await this.auditService.log('delete', 'Project', id, user);
  }
}
