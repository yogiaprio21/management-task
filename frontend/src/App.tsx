import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { ThemeProvider } from './context/ThemeContext';
import Layout from './components/Layout';
import { PageLoader } from './components/Spinner';

const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const ProjectList = lazy(() => import('./pages/ProjectList'));
const ProjectDetail = lazy(() => import('./pages/ProjectDetail'));
const TaskList = lazy(() => import('./pages/TaskList'));
const UserList = lazy(() => import('./pages/UserList'));
const SprintBoard = lazy(() => import('./pages/SprintBoard'));
const ProductBacklog = lazy(() => import('./pages/ProductBacklog'));
const ReportsDashboard = lazy(() => import('./pages/ReportsDashboard'));
const AuditLogs = lazy(() => import('./pages/AuditLogs'));
const SystemHealth = lazy(() => import('./pages/SystemHealth'));
const Integrations = lazy(() => import('./pages/Integrations'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
  },
});

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) return <PageLoader />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  
  return <>{children}</>;
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <SocketProvider>
            <Router>
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/" element={
                    <ProtectedRoute>
                      <Layout />
                    </ProtectedRoute>
                  }>
                    <Route index element={<Dashboard />} />
                    <Route path="projects" element={<ProjectList />} />
                    <Route path="projects/:id" element={<ProjectDetail />} />
                    <Route path="sprints" element={<SprintBoard />} />
                    <Route path="backlog" element={<ProductBacklog />} />
                    <Route path="reports" element={<ReportsDashboard />} />
                    <Route path="tasks" element={<TaskList />} />
                    <Route path="users" element={<UserList />} />
                    <Route path="admin/audit" element={<AuditLogs />} />
                    <Route path="admin/health" element={<SystemHealth />} />
                    <Route path="settings/integrations" element={<Integrations />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Route>
                </Routes>
              </Suspense>
            </Router>
            <Toaster position="top-right" />
          </SocketProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
