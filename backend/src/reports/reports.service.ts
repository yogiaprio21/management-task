import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Not, Repository } from 'typeorm';
import { DailyReport } from './daily-report.entity';
import { User } from '../users/user.entity';
import { CreateReportDto } from './dto/create-report.dto';
import { Project } from '../projects/project.entity';
import { Task } from '../tasks/task.entity';
import { Sprint } from '../sprints/sprint.entity';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(DailyReport)
    private reportsRepository: Repository<DailyReport>,
    @InjectRepository(Project)
    private projectsRepository: Repository<Project>,
    @InjectRepository(Task)
    private tasksRepository: Repository<Task>,
    @InjectRepository(Sprint)
    private sprintsRepository: Repository<Sprint>,
  ) {}

  private async assertProjectAccess(projectId: string, user: User): Promise<Project> {
    const project = await this.projectsRepository.findOne({
      where: { id: projectId },
      relations: ['members'],
    });

    if (!project) throw new NotFoundException('Project not found');

    const isOwner = project.ownerId === user.id;
    const isMember = project.members?.some((member) => member.id === user.id);
    if (!isOwner && !isMember && user.role !== 'admin') {
      throw new ForbiddenException('You do not have access to this project');
    }

    return project;
  }

  async create(reportData: CreateReportDto, user: User): Promise<DailyReport> {
    await this.assertProjectAccess(reportData.projectId, user);
    const report = this.reportsRepository.create({ ...reportData, user, userId: user.id });
    return this.reportsRepository.save(report);
  }

  async findAllByProject(projectId: string, user: User): Promise<DailyReport[]> {
    await this.assertProjectAccess(projectId, user);
    return this.reportsRepository.find({
      where: { projectId },
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
  }

  async getAnalytics(projectId: string, user: User) {
    await this.assertProjectAccess(projectId, user);

    const sprints = await this.sprintsRepository.find({
      where: { projectId },
      order: { startDate: 'ASC' },
      relations: ['tasks', 'tasks.assignee'],
    });

    const sprintIds = sprints.map((sprint) => sprint.id);
    const tasks = sprintIds.length
      ? await this.tasksRepository.find({
          where: sprintIds.map((sprintId) => ({ sprintId })),
          relations: ['assignee'],
        })
      : [];

    const now = new Date();
    const overdueTasks = sprintIds.length
      ? await this.tasksRepository.count({
          where: sprintIds.map((sprintId) => ({
            sprintId,
            deadline: LessThan(now),
            status: Not('done'),
          })),
        })
      : 0;

    const velocity = sprints.map((sprint, index) => {
      const sprintTasks = tasks.filter((task) => task.sprintId === sprint.id);
      return {
        name: sprint.name || `Sprint ${index + 1}`,
        planned: sprintTasks.length,
        completed: sprintTasks.filter((task) => task.status === 'done').length,
      };
    });

    const statusCounts = ['todo', 'in_progress', 'review', 'done'].map((status) => ({
      status,
      count: tasks.filter((task) => task.status === status).length,
    }));

    const workloadMap = new Map<string, { name: string; total: number; done: number }>();
    tasks.forEach((task) => {
      const key = task.assigneeId || 'unassigned';
      const current = workloadMap.get(key) || {
        name: task.assignee?.name || 'Unassigned',
        total: 0,
        done: 0,
      };
      current.total += 1;
      if (task.status === 'done') current.done += 1;
      workloadMap.set(key, current);
    });

    return {
      summary: {
        totalTasks: tasks.length,
        completedTasks: tasks.filter((task) => task.status === 'done').length,
        activeSprints: sprints.filter((sprint) => sprint.status === 'active').length,
        overdueTasks,
      },
      velocity,
      statusCounts,
      workload: Array.from(workloadMap.values()),
    };
  }
}
