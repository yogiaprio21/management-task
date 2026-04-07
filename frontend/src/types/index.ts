export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'manager' | 'user';
}

export interface Project {
  id: string;
  name: string;
  description: string;
  ownerId: string;
  owner?: User;
  members: User[];
  deadline?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  version?: number;
}

export interface Sprint {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  status: 'planned' | 'active' | 'completed';
  projectId: string;
  project?: Project;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string;
  version?: number;
}

export interface BacklogItem {
  id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  status: 'todo' | 'in_progress' | 'done';
  projectId: string;
  assigneeId?: string;
  assignee?: User;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string;
  version?: number;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: 'todo' | 'in_progress' | 'review' | 'done';
  priority: 'medium' | 'high' | 'low';
  deadline?: string;
  creatorId?: string;
  assigneeId?: string;
  sprintId?: string;
  backlogItemId?: string;
  assignee?: User;
  creator?: User;
  comments: Comment[];
  attachments: Attachment[];
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string;
  version?: number;
}

export interface Comment {
  id: string;
  content: string;
  createdAt: string;
  user: User;
}

export interface Attachment {
  id: string;
  filename: string;
  url: string;
  mimetype: string;
  createdAt: string;
  user: User;
}

export interface AuditLog {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  details: string;
  createdAt: string;
  user: User;
}

export interface Report {
  id: string;
  content: string;
  type: 'daily' | 'weekly';
  projectId: string;
  authorId: string;
  createdAt: string;
}

export interface AuthResponse {
  access_token: string;
}

// DTOs
export interface RegisterDto {
  email: string;
  password: string;
  name: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface CreateProjectDto {
  name: string;
  description: string;
  deadline?: string;
}

export type UpdateProjectDto = Partial<CreateProjectDto>;

export interface CreateSprintDto {
  name: string;
  startDate: string;
  endDate: string;
  projectId: string;
}

export interface UpdateSprintDto extends Partial<CreateSprintDto> {
  status?: 'planned' | 'active' | 'completed';
}

export interface CreateBacklogDto {
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  projectId: string;
}

export interface UpdateBacklogDto extends Partial<CreateBacklogDto> {
  status?: 'todo' | 'in_progress' | 'done';
}

export interface CreateTaskDto {
  title: string;
  description: string;
  priority: 'medium' | 'high' | 'low';
  sprintId?: string;
  backlogItemId?: string;
  assigneeId?: string;
}

export interface UpdateTaskDto extends Partial<CreateTaskDto> {
  status?: 'todo' | 'in_progress' | 'review' | 'done';
}

export interface CreateReportDto {
  content: string;
  projectId: string;
  type: 'daily' | 'weekly';
}
