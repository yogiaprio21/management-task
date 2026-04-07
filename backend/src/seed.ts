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
      await dataSource.query('SELECT count(*) FROM "users"');
      tablesExist = true;
      console.log(`✅ Database tables detected.`);
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

  // --- DATABASE SCHEMA PATCH (FORCED) ---
  console.log('🛠️  Checking database schema consistency...');
  try {
    // Manually add title column to notifications if it doesn't exist
    await dataSource.query(`ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "title" CHARACTER VARYING;`);
    // Manually add deadline column to projects if it doesn't exist
    await dataSource.query(`ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "deadline" TIMESTAMP WITH TIME ZONE;`);
    console.log('✅ Database schema patched (title & deadline columns verified).');
  } catch (error) {
    console.log('⚠️  Could not patch database schema manually, it might already be correct.');
  }

  const isForceSeed = process.env.FORCE_SEED === 'true';

  if (isForceSeed) {
    console.log('🗑️  Cleaning database (Cascade truncate) due to FORCE_SEED...');
    try {
      await dataSource.query(`TRUNCATE TABLE "audit_logs", "notifications", "daily_reports", "tasks", "backlog_items", "sprints", "projects", "users" RESTART IDENTITY CASCADE;`);
      await dataSource.query(`TRUNCATE TABLE "project_members" RESTART IDENTITY CASCADE;`).catch(() => {});
      console.log('✅ Database cleaned via FORCE_SEED.');
    } catch (error) {
      console.log('⚠️  Could not clean database entirely, proceeding...', error);
    }
  }

  const password = await bcrypt.hash('password123', 10);

  // --- IDEMPOTENT USER CREATION ---
  const getOrCreateUser = async (userData: any) => {
    let user = await usersService.findOneByEmail(userData.email);
    if (!user) {
      console.log(`👤 Creating user: ${userData.email}`);
      user = await usersService.create({ ...userData, password });
    }
    return user;
  };

  console.log('Checking/Creating Accounts...');
  const admin = await getOrCreateUser({ email: 'admin@example.com', name: 'System Admin', role: 'admin' });
  const engLead = await getOrCreateUser({ email: 'lead@engineering.com', name: 'Lead Engineer', role: 'manager' });
  const marketingDir = await getOrCreateUser({ email: 'director@marketing.com', name: 'Marketing Director', role: 'manager' });
  const eng1 = await getOrCreateUser({ email: 'dev1@engineering.com', name: 'Frontend Dev', role: 'user' });
  const eng2 = await getOrCreateUser({ email: 'dev2@engineering.com', name: 'Backend Dev', role: 'user' });
  const mkt1 = await getOrCreateUser({ email: 'marketer@marketing.com', name: 'Content Creator', role: 'user' });

  // --- IDEMPOTENT PROJECT CREATION ---
  const getOrCreateProject = async (projectData: any, owner: any) => {
    const repo = dataSource.getRepository('Project');
    let project = await repo.findOne({ where: { name: projectData.name } }) as any;
    if (!project) {
      console.log(`📁 Creating project: ${projectData.name}`);
      project = await projectsService.create(projectData, owner);
    }
    return project;
  };

  console.log('Checking Projects...');
  const engineeringProject = await getOrCreateProject({
    name: 'V2 Platform Engineering',
    description: 'Core application redesign, building multi-tenant capabilities, and performance optimizations.',
  }, engLead);
  
  await projectsService.addMember(engineeringProject.id, { userId: eng1.id }, engLead).catch(() => {});
  await projectsService.addMember(engineeringProject.id, { userId: eng2.id }, engLead).catch(() => {});

  const marketingProject = await getOrCreateProject({
    name: 'Q3 Product Launch',
    description: 'Marketing campaigns, SEO strategy, and branding assets for the upcoming product drop.',
  }, marketingDir);

  await projectsService.addMember(marketingProject.id, { userId: mkt1.id }, marketingDir).catch(() => {});

  // --- IDEMPOTENT BACKLOG ITEMS ---
  const seedBacklogItems = async (items: any[], projectId: string, owner: any) => {
    const repo = dataSource.getRepository('BacklogItem');
    for (const item of items) {
      const exists = await repo.findOne({ where: { title: item.title, projectId } });
      if (!exists) {
        console.log(`📋 Creating backlog item: ${item.title}`);
        await backlogService.create({ ...item, description: `Task description for ${item.title}`, projectId }, owner);
      }
    }
  };

  console.log('Building Engineering Backlogs...');
  await seedBacklogItems([
    { title: 'Database Indexing', priority: 'high', status: 'todo' },
    { title: 'User Multi-tenant Isolation', priority: 'high', status: 'done' },
    { title: 'GraphQL API Setup', priority: 'medium', status: 'in_progress' },
  ], engineeringProject.id, engLead);

  console.log('Building Marketing Backlogs...');
  await seedBacklogItems([
    { title: 'Social Media Copy Q3', priority: 'high', status: 'todo' },
    { title: 'Ad Spend Allocation', priority: 'medium', status: 'todo' },
  ], marketingProject.id, marketingDir);

  // --- IDEMPOTENT SPRINTS ---
  const getOrCreateSprint = async (sprintData: any, owner: any) => {
    const repo = dataSource.getRepository('Sprint');
    let sprint = await repo.findOne({ where: { name: sprintData.name, projectId: sprintData.projectId } }) as any;
    if (!sprint) {
      console.log(`🏃 Creating sprint: ${sprintData.name}`);
      sprint = await sprintsService.create(sprintData, owner);
    }
    return sprint;
  };

  const engSprint = await getOrCreateSprint({
    name: 'Engineering Sprint 1: Foundation', 
    startDate: new Date(), 
    endDate: new Date(new Date().setDate(new Date().getDate() + 14)), 
    status: 'active', 
    projectId: engineeringProject.id,
  }, engLead);

  const mktSprint = await getOrCreateSprint({
    name: 'Marketing Sprint A', 
    startDate: new Date(), 
    endDate: new Date(new Date().setDate(new Date().getDate() + 14)), 
    status: 'active', 
    projectId: marketingProject.id,
  }, marketingDir);

  // --- IDEMPOTENT TASKS ---
  const seedTasks = async (tasks: any[], owner: any) => {
    const repo = dataSource.getRepository('Task');
    const backlogRepo = dataSource.getRepository('BacklogItem');
    for (const task of tasks) {
      const exists = await repo.findOne({ where: { title: task.title, sprintId: task.sprintId } });
      if (!exists) {
        console.log(`✅ Creating task: ${task.title}`);
        const backlogItem = await backlogRepo.findOne({ where: { title: task.backlogTitle, projectId: task.projectId } }) as any;
        await tasksService.create({
          title: task.title,
          description: task.description,
          status: task.status as any,
          priority: task.priority as any,
          sprintId: task.sprintId,
          backlogItemId: backlogItem?.id,
          assigneeId: task.assigneeId,
          deadline: new Date()
        }, owner);
      }
    }
  };

  const engBacklog = await backlogService.findAllByProject(engineeringProject.id, engLead);
  await seedTasks([
    { title: 'Migrate Neon Database schema', backlogTitle: 'Database Indexing', projectId: engineeringProject.id, description: 'Truncate logic setup', status: 'done', priority: 'high', sprintId: engSprint.id, assigneeId: eng2.id },
    { title: 'Update React Components', backlogTitle: 'Database Indexing', projectId: engineeringProject.id, description: 'Add modal to backlog and task lists', status: 'in_progress', priority: 'medium', sprintId: engSprint.id, assigneeId: eng1.id },
  ], engLead);

  await seedTasks([
    { title: 'Post 3 TikTok Videos', backlogTitle: 'Social Media Copy Q3', projectId: marketingProject.id, description: 'Engaging content regarding the V2 Release', status: 'in_progress', priority: 'high', sprintId: mktSprint.id, assigneeId: mkt1.id },
  ], marketingDir);

  console.log('🌱 Seed Completed/Verified Successfully!');
}

export async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  await runSeed(app);
  await app.close();
}

if (require.main === module) {
  bootstrap();
}
