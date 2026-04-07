import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import ProjectDetail from '../pages/ProjectDetail'; // Note: This tests the full page, but we might want to test BoardView specifically if exported
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

// Mock AuthContext
vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: { id: '1', name: 'Test User', role: 'admin' },
    isAuthenticated: true,
  }),
}));

// Mock API
vi.mock('../api/projects', () => ({
  getProject: vi.fn().mockResolvedValue({ id: '1', name: 'Test Project', ownerId: '1' }),
}));

vi.mock('../api/tasks', () => ({
  getTasks: vi.fn().mockResolvedValue([
    { id: 't1', title: 'Task 1', status: 'todo', priority: 'medium' }
  ]),
  updateTask: vi.fn(),
  deleteTask: vi.fn(),
}));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>
    <MemoryRouter initialEntries={['/projects/1']}>
      <Routes>
        <Route path="/projects/:id" element={children} />
      </Routes>
    </MemoryRouter>
  </QueryClientProvider>
);

describe('ProjectDetail Component', () => {
  it('renders project title', async () => {
    render(<ProjectDetail />, { wrapper: Wrapper });
    expect(await screen.findByText('Test Project')).toBeDefined();
  });

  it('opens task modal when a task is clicked', async () => {
    render(<ProjectDetail />, { wrapper: Wrapper });
    
    // Switch to board tab
    const boardTab = await screen.findByText('Active Sprint');
    boardTab.click();

    // Find task and click it
    const taskElement = await screen.findByText('Task 1');
    taskElement.click();

    // Check if modal title appears
    expect(await screen.findByText('Task 1')).toBeDefined();
    expect(await screen.findByText('Details')).toBeDefined();
    expect(await screen.findByText('Comments')).toBeDefined();
  });
});
