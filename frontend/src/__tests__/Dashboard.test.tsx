import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import Dashboard from '../pages/Dashboard';

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'user-1', name: 'Test User', role: 'manager' },
    isAuthenticated: true,
  }),
}));

vi.mock('../api/projects', () => ({
  getProjects: vi.fn().mockResolvedValue([]),
  createProject: vi.fn().mockResolvedValue({ id: '1', name: 'Test Project' }),
}));

vi.mock('../api/tasks', () => ({
  getTasks: vi.fn().mockResolvedValue([]),
}));

vi.mock('../api/sprints', () => ({
  getSprints: vi.fn().mockResolvedValue([]),
}));

const renderDashboard = () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    </QueryClientProvider>,
  );
};

describe('Dashboard Component', () => {
  it('renders correctly', async () => {
    renderDashboard();
    expect(await screen.findByText('Project Dashboard')).toBeDefined();
  });

  it('opens create project modal when button is clicked', async () => {
    renderDashboard();
    fireEvent.click(await screen.findByText('New Project'));
    expect(screen.getByText('Define your project workspace')).toBeDefined();
    expect(screen.getByPlaceholderText('e.g. Next-Gen App')).toBeDefined();
  });

  it('closes modal when cancel is clicked', async () => {
    renderDashboard();
    fireEvent.click(await screen.findByText('New Project'));
    fireEvent.click(screen.getByText('Cancel'));
    await waitFor(() => expect(screen.queryByText('Define your project workspace')).toBeNull());
  });
});
