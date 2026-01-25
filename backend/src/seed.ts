import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { UsersService } from './users/users.service';
import { ProjectsService } from './projects/projects.service';
import { SprintsService } from './sprints/sprints.service';
import { BacklogService } from './backlog/backlog.service';
import { TasksService } from './tasks/tasks.service';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  
  // Get all services
  const dataSource = app.get(DataSource);
  const usersService = app.get(UsersService);
  const projectsService = app.get(ProjectsService);
  const sprintsService = app.get(SprintsService);
  const backlogService = app.get(BacklogService);
  const tasksService = app.get(TasksService);

  console.log('🌱 Starting Seed...');

  // 0. Clean Database (Optional: Only if FORCE_SEED is true)
  if (process.env.FORCE_SEED === 'true') {
    console.log('🗑️  Cleaning database...');
    try {
      await dataSource.query(`TRUNCATE TABLE "audit_logs", "notifications", "daily_reports", "tasks", "backlog_items", "sprints", "projects", "users" RESTART IDENTITY CASCADE;`);
      console.log('✅ Database cleaned');
    } catch (error) {
      console.log('⚠️  Could not clean database (tables might not exist yet), proceeding...');
    }
  } else {
    console.log('ℹ️  Skipping database cleanup (FORCE_SEED not set). Checking for existing data...');
  }

  // 1. Create Users
  console.log('Creating Users...');
  const password = await bcrypt.hash('password123', 10);
  
  // Admin
  let adminUser = await usersService.findOneByEmail('admin@example.com');
  if (!adminUser) {
    adminUser = await usersService.create({
      email: 'admin@example.com',
      password: password,
      name: 'Admin User',
      role: 'admin',
    });
    console.log('✅ Admin user created');
  }

  // Project Manager
  let managerUser = await usersService.findOneByEmail('manager@example.com');
  if (!managerUser) {
    managerUser = await usersService.create({
      email: 'manager@example.com',
      password: password,
      name: 'Project Manager',
      role: 'manager',
    });
    console.log('✅ Manager user created');
  }

  // Developer
  let devUser = await usersService.findOneByEmail('dev@example.com');
  if (!devUser) {
    devUser = await usersService.create({
      email: 'dev@example.com',
      password: password,
      name: 'John Developer',
      role: 'user',
    });
    console.log('✅ Developer user created');
  }

  // 2. Create Project
  console.log('Creating Project...');
  let project = (await projectsService.findAll())[0];
  if (!project) {
    project = await projectsService.create({
      name: 'E-Commerce Platform Redesign',
      description: 'Revamping the legacy e-commerce site with modern tech stack.',
    }, managerUser);
    console.log('✅ Sample project created');
  }

  // 3. Create Backlog Items
  console.log('Creating Backlog Items...');
  const existingBacklog = await backlogService.findAllByProject(project.id);
  if (existingBacklog.length === 0) {
    const items = [
      { title: 'User Authentication', priority: 'high', status: 'todo' },
      { title: 'Product Catalog', priority: 'high', status: 'todo' },
      { title: 'Shopping Cart', priority: 'medium', status: 'todo' },
      { title: 'Payment Gateway Integration', priority: 'high', status: 'todo' },
    ];

    for (const item of items) {
      await backlogService.create({
        ...item,
        projectId: project.id,
        description: `Implement ${item.title} functionality`,
      }, adminUser);
    }
    console.log('✅ Backlog items created');
  }

  // 4. Create Sprint
  console.log('Creating Sprint...');
  let sprint = (await sprintsService.findAllByProject(project.id))[0];
  if (!sprint) {
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 14); // 2 weeks sprint

    sprint = await sprintsService.create({
      name: 'Sprint 1: Core Foundation',
      startDate: startDate,
      endDate: endDate,
      status: 'active',
      projectId: project.id,
    }, managerUser);
    console.log('✅ Sprint 1 created');
  }

  // 5. Create Tasks
  console.log('Creating Tasks...');
  const existingTasks = await tasksService.findAll(sprint.id);
  if (existingTasks.length === 0) {
    const backlogItems = await backlogService.findAllByProject(project.id);
    
    // Create tasks for the first backlog item
    if (backlogItems.length > 0) {
      const tasks = [
        { title: 'Setup JWT Auth', assigneeId: devUser.id },
        { title: 'Design Login Page', assigneeId: devUser.id },
        { title: 'API for User Registration', assigneeId: devUser.id },
      ];

      for (const t of tasks) {
        await tasksService.create({
          title: t.title,
          description: `Detailed description for ${t.title}`,
          status: 'todo',
          priority: 'high',
          sprintId: sprint.id,
          backlogItemId: backlogItems[0].id,
          assigneeId: t.assigneeId,
        }, adminUser);
      }
      console.log('✅ Tasks created for Sprint 1');
    }
  }

  await app.close();
  console.log('🚀 Seeding completed successfully!');
}
bootstrap();
