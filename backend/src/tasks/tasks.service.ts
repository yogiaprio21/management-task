import { BadRequestException, Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task } from './task.entity';
import { Comment } from './comment.entity';
import { Attachment } from './attachment.entity';
import { NotificationsGateway } from '../notifications/notifications.gateway';
import { User } from '../users/user.entity';
import { AuditService } from '../audit/audit.service';
import { AuditLog } from '../audit/audit-log.entity';
import { WebhooksService } from '../integrations/webhooks/webhooks.service';
import { WorkspacesService } from '../workspaces/workspaces.service';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private tasksRepository: Repository<Task>,
    @InjectRepository(Comment)
    private commentsRepository: Repository<Comment>,
    @InjectRepository(Attachment)
    private attachmentsRepository: Repository<Attachment>,
    private notificationsGateway: NotificationsGateway,
    private auditService: AuditService,
    private webhooksService: WebhooksService,
    private workspacesService: WorkspacesService,
  ) {}

  private async resolveProjectContext(task: Partial<Task>, user?: User): Promise<{ projectId?: string; workspaceId?: string; ownerId?: string }> {
    if (task.sprintId) {
      const sprint = await this.tasksRepository.manager.getRepository('Sprint').findOne({
        where: { id: task.sprintId },
        relations: ['project', 'project.workspace', 'project.workspace.members', 'project.members'],
      }) as any;
      if (!sprint) throw new NotFoundException('Sprint not found');
      if (user) this.assertProjectAccess(sprint.project, user);
      return { projectId: sprint.projectId, workspaceId: sprint.project?.workspaceId, ownerId: sprint.project?.ownerId };
    }

    if (task.backlogItemId) {
      const backlogItem = await this.tasksRepository.manager.getRepository('BacklogItem').findOne({
        where: { id: task.backlogItemId },
        relations: ['project', 'project.workspace', 'project.workspace.members', 'project.members'],
      }) as any;
      if (!backlogItem) throw new NotFoundException('Backlog item not found');
      if (user) this.assertProjectAccess(backlogItem.project, user);
      return { projectId: backlogItem.projectId, workspaceId: backlogItem.project?.workspaceId, ownerId: backlogItem.project?.ownerId };
    }

    return {};
  }

  private assertProjectAccess(project: any, user: User): void {
    const isProjectMember = project?.members?.some((member) => member.id === user.id);
    const isWorkspaceMember = project?.workspace?.members?.some((member) => member.userId === user.id);
    const isOwner = project?.ownerId === user.id;
    if (!isOwner && !isProjectMember && !isWorkspaceMember && user.role !== 'admin') {
      throw new ForbiddenException('You do not have access to this project');
    }
  }

  async create(taskData: Partial<Task>, user: User): Promise<Task> {
    if (!taskData.sprintId && !taskData.backlogItemId) {
      throw new BadRequestException('Task must be attached to a sprint or backlog item');
    }
    const context = await this.resolveProjectContext(taskData, user);
    await this.workspacesService.assertUserInWorkspace(context.workspaceId, taskData.assigneeId);

    const task = this.tasksRepository.create({
      ...taskData,
      creatorId: user.id,
    });
    const savedTask = await this.tasksRepository.save(task);
    
    // Notify assignee
    if (savedTask.assigneeId && savedTask.assigneeId !== user.id) {
      await this.notificationsGateway.sendNotificationToUser(
        savedTask.assigneeId, 
        'New Task Assigned',
        `You have been assigned to task: ${savedTask.title}`
      );
    }
    
    await this.auditService.log('create', 'Task', savedTask.id, user, taskData);

    if (context.projectId) {
      await this.webhooksService.dispatch(context.projectId, 'task.created', {
        title: 'Task created',
        message: `${user.name} created "${savedTask.title}".`,
        taskId: savedTask.id,
      });
    }

    return savedTask;
  }

  async findAll(user: User, sprintId?: string): Promise<Task[]> {
    const query = this.tasksRepository.createQueryBuilder('task')
      .leftJoinAndSelect('task.assignee', 'assignee')
      .leftJoinAndSelect('task.creator', 'creator')
      .leftJoinAndSelect('task.sprint', 'sprint')
      .leftJoinAndSelect('sprint.project', 'project')
      .leftJoinAndSelect('project.workspace', 'workspace')
      .leftJoinAndSelect('task.backlogItem', 'backlogItem')
      .leftJoinAndSelect('backlogItem.project', 'backlogProject')
      .leftJoinAndSelect('backlogProject.workspace', 'backlogWorkspace');

    if (user.role !== 'admin') {
      // Use leftJoin (not select) for checking membership to avoid circular JSON
      query.leftJoin('project.members', 'member')
        .leftJoin('workspace.members', 'workspaceMember')
        .leftJoin('backlogProject.members', 'backlogProjectMember')
        .leftJoin('backlogWorkspace.members', 'backlogWorkspaceMember')
        .where(
          `(
            project.ownerId = :userId OR member.id = :userId OR workspaceMember.userId = :userId
            OR backlogProject.ownerId = :userId OR backlogProjectMember.id = :userId OR backlogWorkspaceMember.userId = :userId
          )`,
          { userId: user.id },
        );
    }

    if (sprintId) {
      query.andWhere('task.sprintId = :sprintId', { sprintId });
    }

    return query.getMany();
  }

  async findOne(id: string, user: User): Promise<Task> {
    const task = await this.tasksRepository.findOne({ 
      where: { id }, 
      relations: [
        'assignee', 'creator', 'sprint', 'sprint.project', 
        'sprint.project.members', 'backlogItem', 'backlogItem.project',
        'backlogItem.project.members', 'comments', 'comments.user', 'attachments'
      ] 
    });
    
    if (!task) throw new NotFoundException('Task not found');

    // Robust Project Context Detection
    const project = task.sprint?.project || task.backlogItem?.project;
    
    if (!project) {
      // If task is orphan (no sprint AND no backlogItem), only Admin or Creator can access
      if (user.role !== 'admin' && task.creatorId !== user.id) {
        throw new ForbiddenException('You do not have access to this orphan task');
      }
      return task;
    }

    const isMember = project.members?.some(m => m.id === user.id) || false;
    const isOwner = project.ownerId === user.id;

    if (!isOwner && !isMember && user.role !== 'admin') {
      throw new ForbiddenException('You do not have access to this task');
    }

    /**
     * CLEAN CIRCULAR REFERENCES FOR JSON SERIALIZATION
     * TypeORM loads full entities. If we load Task -> Assignee (User), 
     * then User entity contains links back to Tasks/Projects, 
     * creating a circular graph that JSON.stringify cannot handle (500 Error).
     */
    const cleanUser = (u: any) => {
      if (!u) return u;
      return {
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        createdAt: u.createdAt
      };
    };

    const taskData = { ...task };
    taskData.assignee = cleanUser(task.assignee);
    taskData.creator = cleanUser(task.creator);

    if (taskData.sprint?.project) {
        // Deep copy of project to avoid affecting original
        taskData.sprint = { ...taskData.sprint };
        taskData.sprint.project = { ...taskData.sprint.project };
        delete taskData.sprint.project.members;
    }
    
    if (taskData.backlogItem?.project) {
        taskData.backlogItem = { ...taskData.backlogItem };
        taskData.backlogItem.project = { ...taskData.backlogItem.project };
        delete taskData.backlogItem.project.members;
    }

    if (taskData.comments) {
        taskData.comments = task.comments.map(c => ({
          ...c,
          user: cleanUser(c.user)
        }));
    }

    return taskData as Task;
  }

  async update(id: string, taskData: Partial<Task>, user: User): Promise<Task> {
    const task = await this.findOne(id, user);
    const existingContext = await this.resolveProjectContext(task);
    await this.workspacesService.assertUserInWorkspace(existingContext.workspaceId, taskData.assigneeId);

    // RBAC Logic
    const isAdmin = user.role === 'admin';
    const isCreator = task.creatorId === user.id;
    const isAssignee = task.assigneeId === user.id;
    const isProjectOwner = task.sprint?.project?.ownerId === user.id;

    if (isAdmin || isProjectOwner) {
      // Admin or Project Owner can do anything
    } else if (user.role === 'manager' && isCreator) {
      // Manager can edit their own tasks
    } else if (isAssignee) {
      // Staff/Assignee can ONLY update status
      const allowedUpdates = ['status'];
      const updates = Object.keys(taskData);
      const hasUnauthorizedUpdates = updates.some(key => !allowedUpdates.includes(key));
      
      if (hasUnauthorizedUpdates) {
        throw new ForbiddenException('As an assignee, you can only update the task status');
      }
    } else {
      throw new ForbiddenException('You are not authorized to update this task');
    }

    await this.tasksRepository.update(id, taskData);
    const updatedTask = await this.findOne(id, user);
    
    // Notify if assignee changed or status updated
    if (taskData.assigneeId && taskData.assigneeId !== task.assigneeId) {
       await this.notificationsGateway.sendNotificationToUser(
          taskData.assigneeId,
          'Task Reassigned',
          `You have been assigned to task: ${updatedTask.title}`
       );
    }

    await this.auditService.log('update', 'Task', id, user, taskData);

    const context = await this.resolveProjectContext(updatedTask);
    if (context.projectId && taskData.status && taskData.status !== task.status) {
      await this.webhooksService.dispatch(context.projectId, 'task.status_changed', {
        title: 'Task status changed',
        message: `${user.name} moved "${updatedTask.title}" to ${taskData.status}.`,
        taskId: updatedTask.id,
        status: taskData.status,
      });
    }

    return updatedTask;
  }

  async remove(id: string, user: User): Promise<void> {
    const task = await this.findOne(id, user);

    // RBAC: Admin only (for deletion, per strict interpretation)
    // Adding logic: If the user is the Project Owner (via Sprint->Project), they should be able to delete too.
    const project = task.sprint?.project || task.backlogItem?.project;
    const isOwner = project?.ownerId === user.id;

    if (user.role !== 'admin' && !isOwner) {
       throw new ForbiddenException('Only admins or project owners can delete tasks');
    }

    await this.tasksRepository.softDelete(id);
    await this.auditService.log('delete', 'Task', id, user);
  }

  async addComment(taskId: string, content: string, user: User): Promise<Comment> {
    const task = await this.findOne(taskId, user);
    const comment = this.commentsRepository.create({
      content,
      task,
      user,
    });
    const savedComment = await this.commentsRepository.save(comment);
    await this.auditService.log('add_comment', 'Task', taskId, user, { commentId: savedComment.id });
    return savedComment;
  }

  async addAttachment(taskId: string, attachmentData: Partial<Attachment>, user: User): Promise<Attachment> {
    const task = await this.findOne(taskId, user);
    const attachment = this.attachmentsRepository.create({
      ...attachmentData,
      task,
      user,
    });
    const savedAttachment = await this.attachmentsRepository.save(attachment);
    await this.auditService.log('add_attachment', 'Task', taskId, user, { attachmentId: savedAttachment.id });
    return savedAttachment;
  }

  async getActivityHistory(taskId: string, user: User): Promise<any[]> {
    await this.findOne(taskId, user);
    const logs = await this.tasksRepository.manager.getRepository(AuditLog).find({
      where: { entityType: 'Task', entityId: taskId },
      order: { createdAt: 'DESC' },
      relations: ['user']
    });

    // ROBUST CLEAN CIRCULAR REFERENCES
    return logs.map(log => {
      const cleanLog = { ...log };
      if (cleanLog.user) {
        cleanLog.user = {
          id: cleanLog.user.id,
          name: cleanLog.user.name,
          email: cleanLog.user.email,
          role: cleanLog.user.role,
        } as any;
      }
      return cleanLog;
    });
  }
}
