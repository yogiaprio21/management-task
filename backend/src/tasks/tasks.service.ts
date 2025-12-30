import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task } from './task.entity';
import { NotificationsGateway } from '../notifications/notifications.gateway';
import { User } from '../users/user.entity';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private tasksRepository: Repository<Task>,
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
        `You have been assigned to task: ${savedTask.title}`
      );
    }
    
    await this.auditService.log('create', 'Task', savedTask.id, user, taskData);
    return savedTask;
  }

  async findAll(sprintId?: string): Promise<Task[]> {
    const query = this.tasksRepository.createQueryBuilder('task')
      .leftJoinAndSelect('task.assignee', 'assignee')
      .leftJoinAndSelect('task.creator', 'creator');

    if (sprintId) {
      query.where('task.sprintId = :sprintId', { sprintId });
    }

    return query.getMany();
  }

  async findOne(id: string): Promise<Task> {
    const task = await this.tasksRepository.findOne({ 
      where: { id }, 
      relations: ['assignee', 'creator', 'sprint', 'backlogItem'] 
    });
    if (!task) throw new NotFoundException('Task not found');
    return task;
  }

  async update(id: string, taskData: Partial<Task>, user: User): Promise<Task> {
    const task = await this.findOne(id);

    // RBAC Logic
    const isAdmin = user.role === 'admin';
    const isCreator = task.creatorId === user.id;
    const isAssignee = task.assigneeId === user.id;

    if (isAdmin) {
      // Admin can do anything
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
    const updatedTask = await this.findOne(id);
    
    // Notify if assignee changed or status updated
    if (taskData.assigneeId && taskData.assigneeId !== task.assigneeId) {
       this.notificationsGateway.sendNotificationToUser(
          taskData.assigneeId,
          `You have been assigned to task: ${updatedTask.title}`
       );
    }

    await this.auditService.log('update', 'Task', id, user, taskData);
    return updatedTask;
  }

  async remove(id: string, user: User): Promise<void> {
    const task = await this.findOne(id);

    // RBAC: Admin only (for deletion, per strict interpretation)
    // Adding logic: If the user is the Project Owner (via Sprint->Project), they should be able to delete too.
    // However, for now, let's stick to "Admin can delete all". 
    if (user.role !== 'admin') {
       throw new ForbiddenException('Only admins can delete tasks');
    }

    await this.tasksRepository.softDelete(id);
    await this.auditService.log('delete', 'Task', id, user);
  }
}
