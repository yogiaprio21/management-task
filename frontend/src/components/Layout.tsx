import React, { useMemo, useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Activity,
  BarChart3,
  CheckSquare,
  FolderKanban,
  KanbanSquare,
  LayoutDashboard,
  LayoutList,
  LogOut,
  Menu,
  Moon,
  ScrollText,
  Settings,
  Sun,
  Users,
  Webhook,
  X,
} from 'lucide-react';
import clsx from 'clsx';
import { getProjects } from '../api/projects';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import Logo from './Logo';
import NotificationBell from './notifications/NotificationBell';
import { Badge } from '../ui/Badge';

type NavItem = {
  name: string;
  href: string;
  icon: React.ElementType;
  requiresProject?: boolean;
  adminOnly?: boolean;
};

const navGroups: Array<{ label: string; items: NavItem[] }> = [
  {
    label: 'Workspace',
    items: [
      { name: 'Dashboard', href: '/', icon: LayoutDashboard },
      { name: 'Projects', href: '/projects', icon: FolderKanban },
    ],
  },
  {
    label: 'Planning',
    items: [
      { name: 'Backlog', href: '/backlog', icon: LayoutList, requiresProject: true },
      { name: 'Sprints', href: '/sprints', icon: KanbanSquare, requiresProject: true },
    ],
  },
  {
    label: 'Execution',
    items: [
      { name: 'My Tasks', href: '/tasks', icon: CheckSquare, requiresProject: true },
      { name: 'Reports', href: '/reports', icon: BarChart3, requiresProject: true },
    ],
  },
  {
    label: 'Administration',
    items: [
      { name: 'Users', href: '/users', icon: Users, adminOnly: true },
      { name: 'Audit Logs', href: '/admin/audit', icon: ScrollText, adminOnly: true },
      { name: 'Health', href: '/admin/health', icon: Activity, adminOnly: true },
      { name: 'Integrations', href: '/settings/integrations', icon: Webhook, adminOnly: true, requiresProject: true },
    ],
  },
];

const Layout: React.FC = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: getProjects,
    enabled: !!user,
  });

  const hasProjects = projects.length > 0;

  const visibleGroups = useMemo(
    () =>
      navGroups
        .map((group) => ({
          ...group,
          items: group.items.filter((item) => !item.adminOnly || user?.role === 'admin'),
        }))
        .filter((group) => group.items.length > 0),
    [user?.role],
  );

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const renderNav = (isMobile = false) => (
    <nav className="space-y-6">
      {visibleGroups.map((group) => (
        <div key={group.label} className="space-y-2">
          <p className="px-3 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">{group.label}</p>
          <div className="space-y-1">
            {group.items.map((item) => {
              const isActive = item.href === '/' ? location.pathname === '/' : location.pathname.startsWith(item.href);
              const isDisabled = item.requiresProject && !hasProjects;
              const Icon = item.icon;

              const content = (
                <>
                  <Icon className={clsx('h-4 w-4 flex-shrink-0', isActive ? 'text-white' : 'text-slate-500')} />
                  <span className="truncate">{item.name}</span>
                  {isDisabled && <Badge className="ml-auto" tone="amber">Setup</Badge>}
                </>
              );

              if (isDisabled) {
                return (
                  <div
                    key={item.name}
                    className="flex cursor-not-allowed items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-slate-400 opacity-80"
                    title="Create a project first"
                  >
                    {content}
                  </div>
                );
              }

              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => isMobile && setMobileMenuOpen(false)}
                  className={clsx(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition',
                    isActive
                      ? 'bg-primary text-white shadow-sm'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-900 dark:hover:text-white',
                  )}
                >
                  {content}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 md:flex-row">
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-950 md:hidden">
        <Link to="/" className="flex items-center gap-2">
          <Logo size={30} />
        </Link>
        <div className="flex items-center gap-1">
          <NotificationBell />
          <button type="button" onClick={toggleTheme} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-900">
            {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
          </button>
          <button type="button" onClick={() => setMobileMenuOpen((open) => !open)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-900">
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </header>

      {mobileMenuOpen && (
        <div className="border-b border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950 md:hidden">
          {renderNav(true)}
          <div className="mt-6 border-t border-slate-200 pt-4 dark:border-slate-800">
            <button type="button" onClick={handleLogout} className="flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50">
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          </div>
        </div>
      )}

      <aside className="hidden w-72 flex-shrink-0 border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950 md:flex md:flex-col">
        <div className="flex h-20 items-center justify-center border-b border-slate-200 px-6 dark:border-slate-800">
          <Link to="/" className="flex items-center gap-2">
            <Logo size={34} />
          </Link>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-5">
          {renderNav()}
        </div>

        <div className="border-t border-slate-200 p-4 dark:border-slate-800">
          <div className="mb-3 flex items-center gap-3 rounded-lg bg-slate-50 p-3 dark:bg-slate-900">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 font-bold text-primary">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{user?.name}</p>
              <p className="flex items-center gap-1.5 text-xs capitalize text-slate-500">
                <Settings className="h-3 w-3" />
                {user?.role}
              </p>
            </div>
            <NotificationBell />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={toggleTheme} className="flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-900">
              {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
              Theme
            </button>
            <button type="button" onClick={handleLogout} className="flex items-center justify-center gap-2 rounded-lg border border-red-100 px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 dark:border-red-950 dark:hover:bg-red-950/30">
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        </div>
      </aside>

      <main className="min-w-0 flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-7xl px-4 py-6 md:px-8 md:py-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;
