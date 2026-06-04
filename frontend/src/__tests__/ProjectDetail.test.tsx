import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import ProjectDetail from '../pages/ProjectDetail';

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: { id: '1', name: 'Test User', role: 'admin' },
    isAuthenticated: true,
  }),
}));

vi.mock('../api/projects', () => ({
  getProject: vi.fn().mockResolvedValue({
    id: '1',
    name: 'Test Project',
    description: 'Project description',
    ownerId: '1',
    owner: { id: '1', name: 'Test User', email: 'test@example.com', role: 'admin' },
    members: [{ id: '1', name: 'Test User', email: 'test@example.com', role: 'admin' }],
    createdAt: new Date().toISOString(),
  }),
  addProjectMember: vi.fn(),
  removeProjectMember: vi.fn(),
}));

vi.mock('../api/backlog', () => ({
  getBacklogItems: vi.fn().mockResolvedValue([]),
  createBacklogItem: vi.fn(),
}));

vi.mock('../api/sprints', () => ({
  getSprints: vi.fn().mockResolvedValue([
    { id: 's1', name: 'Sprint 1', status: 'active', projectId: '1', startDate: new Date().toISOString(), endDate: new Date().toISOString() },
  ]),
  createSprint: vi.fn(),
  updateSprint: vi.fn(),
}));

vi.mock('../api/reports', () => ({
  getReports: vi.fn().mockResolvedValue([]),
  createReport: vi.fn(),
}));

vi.mock('../api/users', () => ({
  getUsers: vi.fn().mockResolvedValue([]),
}));

vi.mock('../api/tasks', () => ({
  getTasks: vi.fn().mockResolvedValue([
    { id: 't1', title: 'Task 1', description: '', status: 'todo', priority: 'medium', comments: [], attachments: [] },
  ]),
  getTask: vi.fn().mockResolvedValue({ id: 't1', title: 'Task 1', description: '', status: 'todo', priority: 'medium', comments: [], attachments: [] }),
  updateTask: vi.fn(),
  deleteTask: vi.fn(),
  addComment: vi.fn(),
  addAttachment: vi.fn(),
  getTaskHistory: vi.fn().mockResolvedValue([]),
}));

const renderProjectDetail = () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/projects/1']}>
        <Routes>
          <Route path="/projects/:id" element={<ProjectDetail />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
};

describe('ProjectDetail Component', () => {
  it('renders project title', async () => {
    renderProjectDetail();
    expect(await screen.findByText('Test Project')).toBeDefined();
  });

  it('opens task modal when a task is clicked', async () => {
    renderProjectDetail();
    fireEvent.click(await screen.findByText('Active Sprint'));
    fireEvent.click(await screen.findByText('Task 1'));
    expect(await screen.findByText('Details')).toBeDefined();
    expect(await screen.findByText('Comments')).toBeDefined();
  });
});
