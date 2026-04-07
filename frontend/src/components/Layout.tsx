import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getProjects } from '../api/projects';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { LayoutDashboard, FolderKanban, CheckSquare, LogOut, Menu, X, Users, Moon, Sun, KanbanSquare, LayoutList, BarChart3, Activity, ScrollText, Webhook } from 'lucide-react';
import clsx from 'clsx';
import Logo from './Logo';
import NotificationBell from './notifications/NotificationBell';
import { motion } from 'framer-motion';

const Layout: React.FC = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const { data: projects } = useQuery({
    queryKey: ['projects'],
    queryFn: getProjects,
    enabled: !!user,
  });

  const hasProjects = projects && projects.length > 0;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Projects', href: '/projects', icon: FolderKanban },
  ];

  if (hasProjects) {
    navItems.push(
      { name: 'Sprints', href: '/sprints', icon: KanbanSquare },
      { name: 'Backlog', href: '/backlog', icon: LayoutList },
      { name: 'Reports', href: '/reports', icon: BarChart3 },
      { name: 'My Tasks', href: '/tasks', icon: CheckSquare }
    );
  }

  if (user?.role === 'admin') {
    navItems.push(
      { name: 'Users', href: '/users', icon: Users },
      { name: 'Audit Logs', href: '/admin/audit', icon: ScrollText },
      { name: 'Health', href: '/admin/health', icon: Activity },
      { name: 'Integrations', href: '/settings/integrations', icon: Webhook }
    );
  }

  return (
    <div className="flex flex-col md:flex-row h-screen bg-transparent transition-colors duration-300 overflow-hidden text-slate-800 dark:text-slate-100">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 glass-panel border-b-0 shadow-sm z-50">
        <Link to="/" className="flex items-center gap-2">
          <Logo size={28} />
        </Link>
        <div className="flex items-center gap-2">
          <NotificationBell />
          <button
            onClick={toggleTheme}
            className="p-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
          >
            {theme === 'light' ? <Moon className="w-6 h-6" /> : <Sun className="w-6 h-6" />}
          </button>
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Sidebar - Mobile */}
      <div className={clsx(
        'md:hidden bg-white dark:bg-gray-800 shadow-lg z-10 transition-all duration-300 ease-in-out',
        mobileMenuOpen ? 'max-h-screen' : 'max-h-0 overflow-hidden'
      )}>
        <nav className="p-4 space-y-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={clsx(
                  'flex items-center gap-4 px-5 py-3.5 rounded-2xl transition-all duration-300 font-bold relative group overflow-hidden',
                  isActive
                    ? 'bg-gradient-to-r from-primary to-primary-hover text-white shadow-md shadow-primary/30'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100/50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white hover:-translate-y-0.5'
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeTabMobile"
                    className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent pointer-events-none"
                  />
                )}
                <item.icon className={clsx("w-5 h-5 transition-transform duration-300 group-hover:scale-110", isActive ? "text-white" : "text-slate-400 group-hover:text-primary")} />
                {item.name}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-primary font-bold">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">{user?.name}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{user?.role}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </div>

      {/* Sidebar - Desktop */}
      <div className="hidden md:flex w-72 glass-panel m-4 rounded-3xl flex-col transition-all duration-300 shadow-glass border-white/40 dark:border-white/10 z-20">
        <div className="p-8 border-b border-slate-200/50 dark:border-slate-700/50 flex justify-center">
          <Link to="/" className="flex items-center gap-2">
            <Logo size={32} />
          </Link>
        </div>
        
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto custom-scrollbar">
          {navItems.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={clsx(
                  'flex items-center gap-4 px-5 py-3.5 rounded-2xl transition-all duration-300 font-bold group relative overflow-hidden',
                  isActive
                    ? 'bg-gradient-to-r from-primary to-primary-hover text-white shadow-glow scale-[1.02]'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-white/60 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white hover:scale-[1.01]'
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent pointer-events-none"
                  />
                )}
                <item.icon className={clsx("w-5 h-5 transition-transform duration-300 group-hover:scale-110", isActive ? "text-white" : "text-slate-400 group-hover:text-primary")} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <div className="flex items-center gap-3 px-4 py-3 border-b dark:border-gray-700">
             <NotificationBell />
             <span className="text-gray-600 dark:text-gray-400 font-medium text-sm">Notifications</span>
          </div>

          <button
            onClick={toggleTheme}
            className="w-full flex items-center gap-3 px-4 py-3 mb-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            <span>{theme === 'light' ? 'Dark Mode' : 'Light Mode'}</span>
          </button>

          <div className="flex items-center gap-3 mb-4 px-4">
            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-primary font-bold">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{user?.name}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{user?.role}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-x-hidden overflow-y-auto bg-transparent relative z-10 scroll-smooth">
        <div className="p-4 md:p-8 md:pt-10 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default Layout;