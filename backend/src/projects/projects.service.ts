import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Project } from './project.entity';
import { User } from '../users/user.entity';
import { AuditService } from '../audit/audit.service';
import { AddMemberDto } from './dto/add-member.dto';
import { MailService } from '../integrations/mail/mail.service';
import { WorkspacesService } from '../workspaces/workspaces.service';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project)
    private projectsRepository: Repository<Project>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private auditService: AuditService,
    private mailService: MailService,
    private workspacesService: WorkspacesService,
  ) {}

  async create(projectData: Partial<Project>, user: User): Promise<Project> {
    const workspace = projectData.workspaceId
      ? await this.workspacesService.findOne(projectData.workspaceId, user)
      : await this.workspacesService.ensurePersonalWorkspace(user);

    await this.workspacesService.assertCanManage(workspace.id, user);

    const project = this.projectsRepository.create({ ...projectData, workspaceId: workspace.id, owner: user, members: [user] });
    const savedProject = await this.projectsRepository.save(project);
    await this.auditService.log('create', 'Project', savedProject.id, user, { ...projectData, workspaceId: workspace.id });
    return savedProject;
  }

  async findAll(user: User): Promise<Project[]> {
    // Only return projects where user is a workspace member, project owner, or legacy project member.
    return this.projectsRepository.createQueryBuilder('project')
      .leftJoinAndSelect('project.owner', 'owner')
      .leftJoin('project.members', 'member')
      .leftJoin('project.workspace', 'workspace')
      .leftJoin('workspace.members', 'workspaceMember')
      .where(
        user.role === 'admin'
          ? '1 = 1'
          : '(project.ownerId = :userId OR member.id = :userId OR workspaceMember.userId = :userId)',
        { userId: user.id },
      )
      .select([
        'project.id', 'project.name', 'project.description', 'project.createdAt', 'project.updatedAt', 'project.ownerId', 'project.workspaceId',
        'owner.id', 'owner.name', 'owner.email'
      ])
      .orderBy('project.createdAt', 'DESC')
      .getMany();
  }

  async findOne(id: string, user: User): Promise<Project> {
    const project = await this.projectsRepository.findOne({ 
      where: { id }, 
      relations: ['owner', 'members', 'sprints', 'backlogItems', 'workspace', 'workspace.members', 'workspace.members.user'] 
    });
    
    if (!project) throw new NotFoundException('Project not found');

    const isMember = project.members.some(m => m.id === user.id);
    const isWorkspaceMember = project.workspace?.members?.some(m => m.userId === user.id);
    const isOwner = project.ownerId === user.id;

    if (!isOwner && !isMember && !isWorkspaceMember && user.role !== 'admin') {
      throw new ForbiddenException('You do not have access to this project');
    }

    return project;
  }

  async addMember(id: string, addMemberDto: AddMemberDto, currentUser: User): Promise<Project> {
    const project = await this.findOne(id, currentUser);
    
    if (project.ownerId !== currentUser.id && currentUser.role !== 'admin') {
      throw new ForbiddenException('Only project owners can add members');
    }

    let userToAdd: User;
    if (addMemberDto.email) {
      userToAdd = await this.usersRepository.findOne({ where: { email: addMemberDto.email } });
    } else if (addMemberDto.userId) {
      userToAdd = await this.usersRepository.findOne({ where: { id: addMemberDto.userId } });
    }

    if (!userToAdd) {
      if (addMemberDto.email) {
        // Send invitation email to unregistered user
        await this.mailService.sendInvitation(addMemberDto.email, project.name, currentUser.name);
        return project; // Return current project state, but email sent
      }
      throw new NotFoundException(`User with email "${addMemberDto.email}" not found`);
    }

    if (project.members.some(m => m.id === userToAdd.id)) {
      throw new BadRequestException('User is already a member of this project');
    }

    project.members.push(userToAdd);
    const savedProject = await this.projectsRepository.save(project);
    if (project.workspaceId) {
      await this.workspacesService.addMember(project.workspaceId, { userId: userToAdd.id, role: 'member' }, currentUser).catch(() => undefined);
    }
    
    // Send notification email to existing user
    await this.mailService.sendProjectJoinNotification(userToAdd.email, project.name, currentUser.name);
    
    await this.auditService.log('add_member', 'Project', id, currentUser, { memberId: userToAdd.id });
    return savedProject;
  }

  async removeMember(id: string, userId: string, currentUser: User): Promise<Project> {
    const project = await this.findOne(id, currentUser);
    
    if (project.ownerId !== currentUser.id && currentUser.role !== 'admin' && currentUser.id !== userId) {
      throw new ForbiddenException('You are not authorized to remove this member');
    }

    if (project.ownerId === userId) {
      throw new BadRequestException('Cannot remove the project owner');
    }

    project.members = project.members.filter(m => m.id !== userId);
    const savedProject = await this.projectsRepository.save(project);
    await this.auditService.log('remove_member', 'Project', id, currentUser, { memberId: userId });
    return savedProject;
  }

  async update(id: string, projectData: Partial<Project>, user: User): Promise<Project> {
    const project = await this.findOne(id, user);

    // RBAC: Admin or Owner
    if (user.role !== 'admin' && project.ownerId !== user.id) {
      throw new ForbiddenException('You are not authorized to update this project');
    }

    await this.projectsRepository.update(id, projectData);
    await this.auditService.log('update', 'Project', id, user, projectData);
    return this.findOne(id, user);
  }

  async remove(id: string, user: User): Promise<void> {
    const project = await this.findOne(id, user);

    // RBAC: Admin or Owner
    if (user.role !== 'admin' && project.ownerId !== user.id) {
      throw new ForbiddenException('You are not authorized to delete this project');
    }

    await this.projectsRepository.softDelete(id);
    await this.auditService.log('delete', 'Project', id, user);
  }
}
