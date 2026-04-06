import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { UsersService } from './users/users.service';
import { ProjectsService } from './projects/projects.service';
import { SprintsService } from './sprints/sprints.service';
import { BacklogService } from './backlog/backlog.service';
import { TasksService } from './tasks/tasks.service';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { INestApplicationContext } from '@nestjs/common';

export async function runSeed(app: INestApplicationContext) {
  const dataSource = app.get(DataSource);
  const usersService = app.get(UsersService);
  const projectsService = app.get(ProjectsService);
  const sprintsService = app.get(SprintsService);
  const backlogService = app.get(BacklogService);
  const tasksService = app.get(TasksService);

  console.log('🌱 Starting Seed Process...');

  let tablesExist = false;
  let retries = 5;
  while (retries > 0 && !tablesExist) {
    try {
      await dataSource.query('SELECT count(*) FROM "users" LIMIT 1');
      tablesExist = true;
      console.log('✅ Database tables detected.');
    } catch (err: any) {
      console.log(`⏳ Database tables not ready yet. Error: ${err.message}. Retrying in 5s... (${retries} attempts left)`);
      retries--;
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }

  if (!tablesExist) {
    console.error('❌ Failed to connect to database tables after multiple attempts. Skipping seed.');
    return;
  }

  if (process.env.FORCE_SEED === 'true') {
    console.log('🗑️  Cleaning database (Cascade truncate)...');
    try {
      await dataSource.query(`TRUNCATE TABLE "audit_logs", "notifications", "daily_reports", "tasks", "backlog_items", "sprints", "projects", "users" RESTART IDENTITY CASCADE;`);
      // Also potentially clear project members many-to-many junction table:
      await dataSource.query(`TRUNCATE TABLE "project_members" RESTART IDENTITY CASCADE;`).catch(() => {});
      console.log('✅ Database cleaned via FORCE_SEED.');
    } catch (error) {
      console.log('⚠️  Could not clean database entirely, proceeding...', error);
    }
  }

  const password = await bcrypt.hash('password123', 10);

  console.log('Creating Accounts...');
  
  // Create Admins and Managers
  const admin = await usersService.create({ email: 'admin@example.com', password, name: 'System Admin', role: 'admin' });
  const engLead = await usersService.create({ email: 'lead@engineering.com', password, name: 'Lead Engineer', role: 'manager' });
  const marketingDir = await usersService.create({ email: 'director@marketing.com', password, name: 'Marketing Director', role: 'manager' });

  // Create Team Members
  const eng1 = await usersService.create({ email: 'dev1@engineering.com', password, name: 'Frontend Dev', role: 'user' });
  const eng2 = await usersService.create({ email: 'dev2@engineering.com', password, name: 'Backend Dev', role: 'user' });
  const mkt1 = await usersService.create({ email: 'marketer@marketing.com', password, name: 'Content Creator', role: 'user' });

  console.log('Creating Engineering Project...');
  const engineeringProject = await projectsService.create({
    name: 'V2 Platform Engineering',
    description: 'Core application redesign, building multi-tenant capabilities, and performance optimizations.',
  }, engLead);
  
  // Add members manually for team context
  await projectsService.addMember(engineeringProject.id, { userId: eng1.id }, engLead).catch(() => {});
  await projectsService.addMember(engineeringProject.id, { userId: eng2.id }, engLead).catch(() => {});

  console.log('Creating Marketing Project...');
  const marketingProject = await projectsService.create({
    name: 'Q3 Product Launch',
    description: 'Marketing campaigns, SEO strategy, and branding assets for the upcoming product drop.',
  }, marketingDir);

  await projectsService.addMember(marketingProject.id, { userId: mkt1.id }, marketingDir).catch(() => {});

  const engBacklogItems = [
    { title: 'Database Indexing', priority: 'high', status: 'todo' },
    { title: 'User Multi-tenant Isolation', priority: 'high', status: 'done' },
    { title: 'GraphQL API Setup', priority: 'medium', status: 'in_progress' },
  ];
  
  const mktBacklogItems = [
    { title: 'Social Media Copy Q3', priority: 'high', status: 'todo' },
    { title: 'Ad Spend Allocation', priority: 'medium', status: 'todo' },
  ];

  console.log('Building Engineering Backlogs & Sprints...');
  for (const item of engBacklogItems) {
    await backlogService.create({
      title: item.title, description: `Task description for ${item.title}`, priority: item.priority as any, status: item.status as any, projectId: engineeringProject.id,
    }, engLead);
  }

  const engSprint = await sprintsService.create({
    name: 'Engineering Sprint 1: Foundation', startDate: new Date(), endDate: new Date(new Date().setDate(new Date().getDate() + 14)), status: 'active', projectId: engineeringProject.id,
  }, engLead);

  const engBacklog = await backlogService.findAllByProject(engineeringProject.id, engLead);
  await tasksService.create({
    title: 'Migrate Neon Database schema', description: 'Truncate logic setup', status: 'done', priority: 'high', sprintId: engSprint.id, backlogItemId: engBacklog[0].id, assigneeId: eng2.id, deadline: new Date()
  }, engLead);
  await tasksService.create({
    title: 'Update React Components', description: 'Add modal to backlog and task lists', status: 'in_progress', priority: 'medium', sprintId: engSprint.id, backlogItemId: engBacklog[0].id, assigneeId: eng1.id, deadline: new Date()
  }, engLead);


  console.log('Building Marketing Backlogs & Sprints...');
  for (const item of mktBacklogItems) {
    await backlogService.create({
      title: item.title, description: `Content execution for ${item.title}`, priority: item.priority as any, status: item.status as any, projectId: marketingProject.id,
    }, marketingDir);
  }

  const mktSprint = await sprintsService.create({
    name: 'Marketing Sprint A', startDate: new Date(), endDate: new Date(new Date().setDate(new Date().getDate() + 14)), status: 'active', projectId: marketingProject.id,
  }, marketingDir);

  const mktBacklog = await backlogService.findAllByProject(marketingProject.id, marketingDir);
  await tasksService.create({
    title: 'Post 3 TikTok Videos', description: 'Engaging content regarding the V2 Release', status: 'in_progress', priority: 'high', sprintId: mktSprint.id, backlogItemId: mktBacklog[0].id, assigneeId: mkt1.id, deadline: new Date()
  }, marketingDir);


  console.log('🌱 Seed Completed Successfully with Team Data!');
}

export async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  await runSeed(app);
  await app.close();
}

if (require.main === module) {
  bootstrap();
}
