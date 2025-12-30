import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import ProjectDetail from '../pages/ProjectDetail'; // Note: This tests the full page, but we might want to test BoardView specifically if exported
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';

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
    <BrowserRouter>
      {children}
    </BrowserRouter>
  </QueryClientProvider>
);

describe('ProjectDetail Component', () => {
  it('renders project title', async () => {
    render(<ProjectDetail />, { wrapper: Wrapper });
    // Since we rely on async data, we might need waitFor or findBy
    // For simplicity in this mockup:
    expect(await screen.findByText('Test Project')).toBeDefined();
  });

  // Test for BoardView interactions would go here
  // simulating click on edit/delete buttons
});
