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

  // --- AUTOMATIC SCHEMA SYNC ---
  console.log('🔄 Synchronizing database schema (Auto-creating tables)...');
  try {
    await dataSource.synchronize();
    console.log('✅ Database schema synchronized.');
  } catch (error) {
    console.log('⚠️  Could not synchronize schema, proceeding anyway...', error);
  }

  // --- AUTOMATIC SCHEMA SYNC ---
  console.log('🔄 Synchronizing database schema (Auto-creating tables)...');
  try {
    await dataSource.synchronize();
    console.log('✅ Database schema synchronized.');
  } catch (error) {
    console.log('⚠️  Could not synchronize schema, proceeding anyway...', error);
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

  console.log('Checking Accounts...');
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
  const getOrCreateBacklogItem = async (itemData: any, owner: any) => {
    const repo = dataSource.getRepository('BacklogItem');
    let item = await repo.findOne({ where: { title: itemData.title, projectId: itemData.projectId } }) as any;
    if (!item) {
      console.log(`📋 Creating backlog item: ${itemData.title}`);
      item = await backlogService.create({ ...itemData, description: `Task description for ${itemData.title}` }, owner);
    }
    return item;
  };

  console.log('Building Engineering Backlogs...');
  const bDatabase = await getOrCreateBacklogItem({ title: 'Database Schema Design', priority: 'high', status: 'done', projectId: engineeringProject.id }, engLead);
  const bDashboard = await getOrCreateBacklogItem({ title: 'Responsive Dashboard UI', priority: 'high', status: 'in_progress', projectId: engineeringProject.id }, engLead);
  const bAuth = await getOrCreateBacklogItem({ title: 'Microservices Auth Audit', priority: 'medium', status: 'todo', projectId: engineeringProject.id }, engLead);
  const bTesting = await getOrCreateBacklogItem({ title: 'Unit Test Suite', priority: 'low', status: 'todo', projectId: engineeringProject.id }, engLead);

  console.log('Building Marketing Backlogs...');
  await getOrCreateBacklogItem({ title: 'Social Media Strategy', priority: 'high', status: 'todo', projectId: marketingProject.id }, marketingDir);

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

  // 3 Cycle Sprints for Engineering
  console.log('Scheduling Sprints...');
  const engSprintPast = await getOrCreateSprint({
    name: 'Iteration 0: Setup', 
    startDate: new Date(new Date().setDate(new Date().getDate() - 20)), 
    endDate: new Date(new Date().setDate(new Date().getDate() - 7)), 
    status: 'completed', 
    projectId: engineeringProject.id,
  }, engLead);

  const engSprintCurrent = await getOrCreateSprint({
    name: 'Iteration 1: Implementation', 
    startDate: new Date(), 
    endDate: new Date(new Date().setDate(new Date().getDate() + 14)), 
    status: 'active', 
    projectId: engineeringProject.id,
  }, engLead);

  const engSprintFuture = await getOrCreateSprint({
    name: 'Iteration 2: Polishing', 
    startDate: new Date(new Date().setDate(new Date().getDate() + 15)), 
    endDate: new Date(new Date().setDate(new Date().getDate() + 29)), 
    status: 'planned', 
    projectId: engineeringProject.id,
  }, engLead);

  // --- IDEMPOTENT TASKS ---
  const getOrCreateTask = async (taskData: any, owner: any) => {
    const repo = dataSource.getRepository('Task');
    let task = await repo.findOne({ where: { title: taskData.title, sprintId: taskData.sprintId } }) as any;
    if (!task) {
      console.log(`✅ Creating task: ${taskData.title}`);
      task = await tasksService.create(taskData, owner);
    }
    return task;
  };

  const seedTaskDetails = async (task: any, comments: string[], owner: any) => {
    // Add comments if they don't exist
    const commentRepo = dataSource.getRepository('Comment');
    for (const content of comments) {
      const exists = await commentRepo.findOne({ where: { content, taskId: task.id } });
      if (!exists) {
        await tasksService.addComment(task.id, content, owner);
      }
    }
  };

  console.log('Seeding Tasks...');
  // Past Tasks (Sprint 0)
  const t1 = await getOrCreateTask({
    title: 'Model Database Relations',
    description: 'Setup TypeORM entities and relations',
    status: 'done',
    priority: 'high',
    sprintId: engSprintPast.id,
    backlogItemId: bDatabase.id,
    assigneeId: eng2.id,
    deadline: new Date(new Date().setDate(new Date().getDate() - 10))
  }, engLead);
  await seedTaskDetails(t1, ["Schema logic is solid.", "Already deployed to Neon."], engLead);

  // Current Tasks (Sprint 1) - Assigned to Dev1 and Dev2
  const t2 = await getOrCreateTask({
    title: 'Component Library Integration',
    description: 'Setup Tailwind and headless UI components',
    status: 'in_progress',
    priority: 'high',
    sprintId: engSprintCurrent.id,
    backlogItemId: bDashboard.id,
    assigneeId: eng1.id, // Frontend Dev
    deadline: new Date(new Date().setDate(new Date().getDate() + 5))
  }, engLead);
  await seedTaskDetails(t2, ["Working on the primary theme.", "@dev2 how's the API progress?"], eng1);

  const t3 = await getOrCreateTask({
    title: 'Connect Sprint Board to API',
    description: 'Implement drag-and-drop syncing with backend',
    status: 'todo',
    priority: 'high',
    sprintId: engSprintCurrent.id,
    backlogItemId: bDashboard.id,
    assigneeId: eng2.id, // Backend Dev
    deadline: new Date(new Date().setDate(new Date().getDate() + 7))
  }, engLead);

  // Future Tasks (Sprint 2)
  await getOrCreateTask({
    title: 'Penetration Testing',
    description: 'Security audit for JWT and RBAC',
    status: 'todo',
    priority: 'medium',
    sprintId: engSprintFuture.id,
    backlogItemId: bAuth.id,
    assigneeId: eng2.id,
    deadline: new Date(new Date().setDate(new Date().getDate() + 20))
  }, engLead);

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
