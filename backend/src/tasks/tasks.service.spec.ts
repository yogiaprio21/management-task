import { Test, TestingModule } from '@nestjs/testing';
import { TasksService } from './tasks.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Task } from './task.entity';
import { Comment } from './comment.entity';
import { Attachment } from './attachment.entity';
import { NotificationsGateway } from '../notifications/notifications.gateway';
import { AuditService } from '../audit/audit.service';
import { User } from '../users/user.entity';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { WebhooksService } from '../integrations/webhooks/webhooks.service';

const mockRepository = () => ({
  create: jest.fn(),
  save: jest.fn(),
  findOne: jest.fn(),
  find: jest.fn(),
  createQueryBuilder: jest.fn(() => ({
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    getMany: jest.fn().mockReturnValue([]),
  })),
  update: jest.fn(),
  softDelete: jest.fn(),
  manager: {
    getRepository: jest.fn(() => ({
      find: jest.fn().mockReturnValue([]),
      findOne: jest.fn().mockReturnValue(null),
    })),
  },
});

const mockNotificationsGateway = () => ({
  sendNotificationToUser: jest.fn(),
});

const mockAuditService = () => ({
  log: jest.fn(),
});

const mockWebhooksService = () => ({
  dispatch: jest.fn(),
});

describe('TasksService', () => {
  let service: TasksService;
  let taskRepo: any;
  let commentRepo: any;
  let attachmentRepo: any;
  let notificationsGateway: any;
  let auditService: any;

  const adminUser = { id: 'admin-id', role: 'admin' } as User;
  const projectOwner = { id: 'owner-id', role: 'manager' } as User;
  const staffUser = { id: 'staff-id', role: 'user' } as User;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TasksService,
        { provide: getRepositoryToken(Task), useFactory: mockRepository },
        { provide: getRepositoryToken(Comment), useFactory: mockRepository },
        { provide: getRepositoryToken(Attachment), useFactory: mockRepository },
        { provide: NotificationsGateway, useFactory: mockNotificationsGateway },
        { provide: AuditService, useFactory: mockAuditService },
        { provide: WebhooksService, useFactory: mockWebhooksService },
      ],
    }).compile();

    service = module.get<TasksService>(TasksService);
    taskRepo = module.get(getRepositoryToken(Task));
    commentRepo = module.get(getRepositoryToken(Comment));
    attachmentRepo = module.get(getRepositoryToken(Attachment));
    notificationsGateway = module.get<NotificationsGateway>(NotificationsGateway);
    auditService = module.get<AuditService>(AuditService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findOne', () => {
    it('should throw NotFoundException if task not found', async () => {
      taskRepo.findOne.mockResolvedValue(null);
      await expect(service.findOne('id', adminUser)).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user has no access', async () => {
      const task = { 
        id: 'task-id', 
        sprint: { project: { ownerId: 'other-id', members: [] } } 
      } as any;
      taskRepo.findOne.mockResolvedValue(task);
      await expect(service.findOne('task-id', staffUser)).rejects.toThrow(ForbiddenException);
    });

    it('should return task if user is admin', async () => {
      const task = { 
        id: 'task-id', 
        sprint: { project: { ownerId: 'other-id', members: [] } } 
      } as any;
      taskRepo.findOne.mockResolvedValue(task);
      const result = await service.findOne('task-id', adminUser);
      expect(result.sprint.project.members).toBeUndefined();
      expect(result.id).toBe(task.id);
    });
  });

  describe('update', () => {
    it('should allow project owner to update any task in their project', async () => {
      const task = { 
        id: 'task-id', 
        sprint: { project: { ownerId: projectOwner.id, members: [] } } 
      } as any;
      taskRepo.findOne.mockResolvedValue(task);
      taskRepo.update.mockResolvedValue({ affected: 1 });

      await service.update('task-id', { title: 'Updated' }, projectOwner);
      expect(taskRepo.update).toHaveBeenCalled();
    });

    it('should allow assignee to ONLY update status', async () => {
      const task = { 
        id: 'task-id', 
        assigneeId: staffUser.id,
        sprint: { project: { ownerId: 'other-id', members: [{ id: staffUser.id }] } } 
      } as any;
      taskRepo.findOne.mockResolvedValue(task);
      taskRepo.update.mockResolvedValue({ affected: 1 });

      // Valid update
      await service.update('task-id', { status: 'in_progress' }, staffUser);
      expect(taskRepo.update).toHaveBeenCalled();

      // Invalid update
      await expect(service.update('task-id', { title: 'New Title' }, staffUser))
        .rejects.toThrow(ForbiddenException);
    });
  });

  describe('addComment', () => {
    it('should add a comment and log audit', async () => {
      const task = { id: 'task-id', sprint: { project: { ownerId: projectOwner.id, members: [] } } } as any;
      const comment = { id: 'comment-id', content: 'hello' };
      
      taskRepo.findOne.mockResolvedValue(task);
      commentRepo.create.mockReturnValue(comment);
      commentRepo.save.mockResolvedValue(comment);

      const result = await service.addComment('task-id', 'hello', projectOwner);
      
      expect(commentRepo.create).toHaveBeenCalledWith({
        content: 'hello',
        task: expect.objectContaining({ id: task.id }),
        user: projectOwner,
      });
      expect(commentRepo.save).toHaveBeenCalled();
      expect(auditService.log).toHaveBeenCalledWith('add_comment', 'Task', 'task-id', projectOwner, { commentId: 'comment-id' });
      expect(result).toEqual(comment);
    });
  });
});
