import React from 'react';
import { cn } from './utils';

interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  meta?: React.ReactNode;
  className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ title, description, icon, actions, meta, className }) => (
  <div className={cn('flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between', className)}>
    <div className="min-w-0 space-y-2">
      <div className="flex min-w-0 items-center gap-3">
        {icon && <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">{icon}</div>}
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-bold tracking-tight text-slate-950 dark:text-white md:text-3xl">{title}</h1>
          {meta && <div className="mt-2 flex flex-wrap gap-2">{meta}</div>}
        </div>
      </div>
      {description && <p className="max-w-3xl text-sm leading-6 text-slate-500 dark:text-slate-400 md:text-base">{description}</p>}
    </div>
    {actions && <div className="flex flex-wrap items-center gap-3">{actions}</div>}
  </div>
);
