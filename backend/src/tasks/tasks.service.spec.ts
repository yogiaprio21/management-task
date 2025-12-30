import { Test, TestingModule } from '@nestjs/testing';
import { TasksService } from './tasks.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Task } from './task.entity';
import { NotificationsGateway } from '../notifications/notifications.gateway';
import { AuditService } from '../audit/audit.service';
import { User } from '../users/user.entity';
import { ForbiddenException, NotFoundException } from '@nestjs/common';

const mockTaskRepository = () => ({
  create: jest.fn(),
  save: jest.fn(),
  findOne: jest.fn(),
  find: jest.fn(),
  createQueryBuilder: jest.fn(() => ({
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    getMany: jest.fn().mockReturnValue([]),
  })),
  update: jest.fn(),
  softDelete: jest.fn(),
});

const mockNotificationsGateway = () => ({
  sendNotificationToUser: jest.fn(),
});

const mockAuditService = () => ({
  log: jest.fn(),
});

describe('TasksService', () => {
  let service: TasksService;
  let repository: any;
  let notificationsGateway: any;
  let auditService: any;

  const adminUser = { id: 'admin-id', role: 'admin' } as User;
  const managerUser = { id: 'manager-id', role: 'manager' } as User;
  const staffUser = { id: 'staff-id', role: 'staff' } as User;
  const otherUser = { id: 'other-id', role: 'staff' } as User;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TasksService,
        { provide: getRepositoryToken(Task), useFactory: mockTaskRepository },
        { provide: NotificationsGateway, useFactory: mockNotificationsGateway },
        { provide: AuditService, useFactory: mockAuditService },
      ],
    }).compile();

    service = module.get<TasksService>(TasksService);
    repository = module.get(getRepositoryToken(Task));
    notificationsGateway = module.get<NotificationsGateway>(NotificationsGateway);
    auditService = module.get<AuditService>(AuditService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a task and set creatorId', async () => {
      const taskData = { title: 'New Task' };
      const createdTask = { id: 'task-id', ...taskData, creatorId: adminUser.id };
      
      repository.create.mockReturnValue(createdTask);
      repository.save.mockResolvedValue(createdTask);

      const result = await service.create(taskData, adminUser);

      expect(repository.create).toHaveBeenCalledWith({ ...taskData, creatorId: adminUser.id });
      expect(repository.save).toHaveBeenCalled();
      expect(auditService.log).toHaveBeenCalledWith('create', 'Task', 'task-id', adminUser, taskData);
      expect(result).toEqual(createdTask);
    });

    it('should notify assignee if assigned', async () => {
        const taskData = { title: 'New Task', assigneeId: 'staff-id' };
        const createdTask = { id: 'task-id', ...taskData, creatorId: adminUser.id };
        
        repository.create.mockReturnValue(createdTask);
        repository.save.mockResolvedValue(createdTask);
  
        await service.create(taskData, adminUser);
  
        expect(notificationsGateway.sendNotificationToUser).toHaveBeenCalledWith('staff-id', expect.stringContaining('assigned'));
      });
  });

  describe('update', () => {
    it('should allow admin to update any task', async () => {
      const task = { id: 'task-id', creatorId: 'other-id', assigneeId: 'other-id' } as Task;
      repository.findOne.mockResolvedValue(task);
      repository.update.mockResolvedValue({ affected: 1 });

      await service.update('task-id', { title: 'Updated Title' }, adminUser);

      expect(repository.update).toHaveBeenCalledWith('task-id', { title: 'Updated Title' });
    });

    it('should allow manager to update their own task', async () => {
        const task = { id: 'task-id', creatorId: managerUser.id, assigneeId: 'other-id' } as Task;
        repository.findOne.mockResolvedValue(task);
        repository.update.mockResolvedValue({ affected: 1 });
  
        await service.update('task-id', { title: 'Updated Title' }, managerUser);
  
        expect(repository.update).toHaveBeenCalledWith('task-id', { title: 'Updated Title' });
    });

    it('should NOT allow manager to update others task', async () => {
        const task = { id: 'task-id', creatorId: 'other-id', assigneeId: 'other-id' } as Task;
        repository.findOne.mockResolvedValue(task);
  
        await expect(service.update('task-id', { title: 'Updated Title' }, managerUser)).rejects.toThrow(ForbiddenException);
    });

    it('should allow staff/assignee to update status ONLY', async () => {
        const task = { id: 'task-id', creatorId: 'other-id', assigneeId: staffUser.id } as Task;
        repository.findOne.mockResolvedValue(task);
        repository.update.mockResolvedValue({ affected: 1 });
  
        await service.update('task-id', { status: 'in_progress' }, staffUser);
  
        expect(repository.update).toHaveBeenCalledWith('task-id', { status: 'in_progress' });
    });

    it('should NOT allow staff/assignee to update other fields', async () => {
        const task = { id: 'task-id', creatorId: 'other-id', assigneeId: staffUser.id } as Task;
        repository.findOne.mockResolvedValue(task);
  
        await expect(service.update('task-id', { title: 'New Title' }, staffUser)).rejects.toThrow(ForbiddenException);
    });

    it('should NOT allow random user to update task', async () => {
        const task = { id: 'task-id', creatorId: 'some-one-else', assigneeId: 'some-one-else' } as Task;
        repository.findOne.mockResolvedValue(task);
  
        await expect(service.update('task-id', { status: 'done' }, otherUser)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('delete', () => {
      it('should allow admin to delete task', async () => {
        const task = { id: 'task-id' } as Task;
        repository.findOne.mockResolvedValue(task);
        repository.softDelete.mockResolvedValue({ affected: 1 });

        await service.remove('task-id', adminUser);

        expect(repository.softDelete).toHaveBeenCalledWith('task-id');
      });

      it('should NOT allow non-admin to delete task', async () => {
        const task = { id: 'task-id' } as Task;
        repository.findOne.mockResolvedValue(task);

        await expect(service.remove('task-id', managerUser)).rejects.toThrow(ForbiddenException);
      });
  });
});
