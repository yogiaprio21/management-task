import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task } from './task.entity';
import { Comment } from './comment.entity';
import { Attachment } from './attachment.entity';
import { NotificationsGateway } from '../notifications/notifications.gateway';
import { User } from '../users/user.entity';
import { AuditService } from '../audit/audit.service';

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
  ) {}

  async create(taskData: Partial<Task>, user: User): Promise<Task> {
    const task = this.tasksRepository.create({
      ...taskData,
      creatorId: user.id,
    });
    const savedTask = await this.tasksRepository.save(task);
    
    // Notify assignee
    if (savedTask.assigneeId && savedTask.assigneeId !== user.id) {
      this.notificationsGateway.sendNotificationToUser(
        savedTask.assigneeId, 
        'New Task Assigned',
        `You have been assigned to task: ${savedTask.title}`
      );
    }
    
    await this.auditService.log('create', 'Task', savedTask.id, user, taskData);
    return savedTask;
  }

  async findAll(user: User, sprintId?: string): Promise<Task[]> {
    const query = this.tasksRepository.createQueryBuilder('task')
      .leftJoinAndSelect('task.assignee', 'assignee')
      .leftJoinAndSelect('task.creator', 'creator')
      .leftJoinAndSelect('task.sprint', 'sprint')
      .leftJoinAndSelect('sprint.project', 'project')
      .leftJoinAndSelect('project.members', 'member');

    if (sprintId) {
      query.where('task.sprintId = :sprintId', { sprintId });
    }

    if (user.role !== 'admin') {
      query.andWhere('(project.ownerId = :userId OR member.id = :userId)', { userId: user.id });
    }

    return query.getMany();
  }

  async findOne(id: string, user: User): Promise<Task> {
    const task = await this.tasksRepository.findOne({ 
      where: { id }, 
      relations: [
        'assignee', 'creator', 'sprint', 'sprint.project', 
        'sprint.project.members', 'backlogItem', 
        'comments', 'comments.user', 'attachments'
      ] 
    });
    if (!task) throw new NotFoundException('Task not found');

    const isMember = task.sprint.project.members.some(m => m.id === user.id);
    const isOwner = task.sprint.project.ownerId === user.id;

    if (!isOwner && !isMember && user.role !== 'admin') {
      throw new ForbiddenException('You do not have access to this task');
    }

    return task;
  }

  async update(id: string, taskData: Partial<Task>, user: User): Promise<Task> {
    const task = await this.findOne(id, user);

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
       this.notificationsGateway.sendNotificationToUser(
          taskData.assigneeId,
          'Task Reassigned',
          `You have been assigned to task: ${updatedTask.title}`
       );
    }

    await this.auditService.log('update', 'Task', id, user, taskData);
    return updatedTask;
  }

  async remove(id: string, user: User): Promise<void> {
    const task = await this.findOne(id, user);

    // RBAC: Admin only (for deletion, per strict interpretation)
    // Adding logic: If the user is the Project Owner (via Sprint->Project), they should be able to delete too.
    if (user.role !== 'admin' && task.sprint.project.ownerId !== user.id) {
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
    return this.tasksRepository.manager.getRepository('AuditLog').find({
      where: { entityType: 'Task', entityId: taskId },
      order: { createdAt: 'DESC' },
      relations: ['user']
    });
  }
}
