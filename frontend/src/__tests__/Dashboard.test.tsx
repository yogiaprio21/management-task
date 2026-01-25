import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Dashboard from '../pages/Dashboard';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';

// Mock dependencies
vi.mock('../api/projects', () => ({
  getProjects: vi.fn().mockResolvedValue([]),
  createProject: vi.fn().mockResolvedValue({ id: '1', name: 'Test Project' }),
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

describe('Dashboard Component', () => {
  it('renders correctly', async () => {
    render(<Dashboard />, { wrapper: Wrapper });
    expect(await screen.findByText('Dashboard Overview')).toBeDefined();
  });

  it('opens create project modal when button is clicked', async () => {
    render(<Dashboard />, { wrapper: Wrapper });
    
    const createButton = await screen.findByText('New Project');
    fireEvent.click(createButton);
    
    expect(screen.getByText('Create New Project')).toBeDefined();
    expect(screen.getByPlaceholderText('e.g., Website Redesign')).toBeDefined();
  });

  it('closes modal when cancel is clicked', () => {
    render(<Dashboard />, { wrapper: Wrapper });
    
    fireEvent.click(screen.getByText('New Project'));
    fireEvent.click(screen.getByText('Cancel'));
    
    expect(screen.queryByText('Create New Project')).toBeNull();
  });
});
