import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Workspace } from './workspace.entity';
import { WorkspaceMember, WorkspaceRole } from './workspace-member.entity';
import { User } from '../users/user.entity';
import { AuditService } from '../audit/audit.service';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { AddWorkspaceMemberDto } from './dto/add-workspace-member.dto';

@Injectable()
export class WorkspacesService {
  constructor(
    @InjectRepository(Workspace)
    private workspacesRepository: Repository<Workspace>,
    @InjectRepository(WorkspaceMember)
    private membersRepository: Repository<WorkspaceMember>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private auditService: AuditService,
  ) {}

  private cleanWorkspace(workspace: Workspace): Workspace {
    if (!workspace.members) return workspace;
    return {
      ...workspace,
      members: workspace.members.map((member) => ({
        ...member,
        user: member.user
          ? {
              id: member.user.id,
              name: member.user.name,
              email: member.user.email,
              role: member.user.role,
              createdAt: member.user.createdAt,
            } as User
          : member.user,
      })),
    };
  }

  async ensurePersonalWorkspace(user: User): Promise<Workspace> {
    const existing = await this.workspacesRepository
      .createQueryBuilder('workspace')
      .innerJoin('workspace.members', 'member', 'member.userId = :userId', { userId: user.id })
      .where('workspace.type = :type', { type: 'personal' })
      .getOne();

    if (existing) return existing;

    const workspace = this.workspacesRepository.create({
      name: `${user.name || 'Personal'} Workspace`,
      description: 'Private workspace for personal projects and tasks.',
      type: 'personal',
      ownerId: user.id,
    });
    const savedWorkspace = await this.workspacesRepository.save(workspace);
    await this.membersRepository.save(
      this.membersRepository.create({
        workspaceId: savedWorkspace.id,
        userId: user.id,
        role: 'owner',
      }),
    );
    await this.auditService.log('create', 'Workspace', savedWorkspace.id, user, { type: 'personal' });
    return savedWorkspace;
  }

  async create(data: CreateWorkspaceDto, user: User): Promise<Workspace> {
    const workspace = this.workspacesRepository.create({
      name: data.name,
      description: data.description,
      type: data.type || 'team',
      ownerId: user.id,
    });
    const savedWorkspace = await this.workspacesRepository.save(workspace);
    await this.membersRepository.save(
      this.membersRepository.create({
        workspaceId: savedWorkspace.id,
        userId: user.id,
        role: 'owner',
      }),
    );
    await this.auditService.log('create', 'Workspace', savedWorkspace.id, user, data);
    return this.findOne(savedWorkspace.id, user);
  }

  async findAll(user: User): Promise<Workspace[]> {
    const query = this.workspacesRepository
      .createQueryBuilder('workspace')
      .leftJoinAndSelect('workspace.members', 'workspaceMember')
      .leftJoinAndSelect('workspaceMember.user', 'memberUser')
      .leftJoinAndSelect('workspace.projects', 'project')
      .orderBy('workspace.createdAt', 'ASC')
      .addOrderBy('project.createdAt', 'DESC');

    if (user.role !== 'admin') {
      query.innerJoin('workspace.members', 'accessMember', 'accessMember.userId = :userId', { userId: user.id });
    }

    const workspaces = await query.getMany();
    return workspaces.map((workspace) => this.cleanWorkspace(workspace));
  }

  async findOne(id: string, user: User): Promise<Workspace> {
    const workspace = await this.workspacesRepository.findOne({
      where: { id },
      relations: ['members', 'members.user', 'projects', 'projects.owner'],
      order: { projects: { createdAt: 'DESC' } },
    });
    if (!workspace) throw new NotFoundException('Workspace not found');

    const membership = workspace.members?.find((member) => member.userId === user.id);
    if (!membership && workspace.ownerId !== user.id && user.role !== 'admin') {
      throw new ForbiddenException('You do not have access to this workspace');
    }

    return this.cleanWorkspace(workspace);
  }

  async assertMember(workspaceId: string, user: User): Promise<WorkspaceMember | null> {
    const membership = await this.membersRepository.findOne({ where: { workspaceId, userId: user.id } });
    if (!membership && user.role !== 'admin') {
      throw new ForbiddenException('You do not have access to this workspace');
    }
    return membership;
  }

  async assertCanManage(workspaceId: string, user: User): Promise<WorkspaceMember | null> {
    const membership = await this.assertMember(workspaceId, user);
    if (user.role === 'admin') return membership;
    if (!membership || !['owner', 'admin'].includes(membership.role)) {
      throw new ForbiddenException('Only workspace owners and admins can manage this workspace');
    }
    return membership;
  }

  async addMember(workspaceId: string, data: AddWorkspaceMemberDto, user: User): Promise<Workspace> {
    await this.assertCanManage(workspaceId, user);

    const memberUser = data.email
      ? await this.usersRepository.findOne({ where: { email: data.email } })
      : await this.usersRepository.findOne({ where: { id: data.userId } });

    if (!memberUser) throw new NotFoundException('User not found');

    const existing = await this.membersRepository.findOne({ where: { workspaceId, userId: memberUser.id } });
    if (existing) throw new BadRequestException('User is already a workspace member');

    await this.membersRepository.save(
      this.membersRepository.create({
        workspaceId,
        userId: memberUser.id,
        role: data.role || 'member',
      }),
    );
    await this.auditService.log('add_member', 'Workspace', workspaceId, user, { memberId: memberUser.id, role: data.role || 'member' });
    return this.findOne(workspaceId, user);
  }

  async removeMember(workspaceId: string, userId: string, user: User): Promise<Workspace> {
    await this.assertCanManage(workspaceId, user);
    const workspace = await this.findOne(workspaceId, user);
    if (workspace.ownerId === userId) {
      throw new BadRequestException('Cannot remove the workspace owner');
    }
    await this.membersRepository.delete({ workspaceId, userId });
    await this.auditService.log('remove_member', 'Workspace', workspaceId, user, { memberId: userId });
    return this.findOne(workspaceId, user);
  }

  async getMemberIds(workspaceId: string): Promise<string[]> {
    const members = await this.membersRepository.find({ where: { workspaceId }, select: ['userId'] });
    return members.map((member) => member.userId);
  }

  async assertUserInWorkspace(workspaceId: string, userId?: string | null): Promise<void> {
    if (!userId) return;
    const membership = await this.membersRepository.findOne({ where: { workspaceId, userId } });
    if (!membership) {
      throw new BadRequestException('Assignee must be a member of the workspace');
    }
  }
}
