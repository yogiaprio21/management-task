import React from 'react';
import { cn } from './utils';

type BadgeTone = 'slate' | 'blue' | 'green' | 'amber' | 'red' | 'purple';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
}

const tones: Record<BadgeTone, string> = {
  slate: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200',
  blue: 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-200',
  green: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-200',
  amber: 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-200',
  red: 'bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-200',
  purple: 'bg-violet-50 text-violet-700 dark:bg-violet-950/60 dark:text-violet-200',
};

export const Badge: React.FC<BadgeProps> = ({ tone = 'slate', className, children, ...props }) => (
  <span
    className={cn(
      'inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-semibold leading-none',
      tones[tone],
      className,
    )}
    {...props}
  >
    {children}
  </span>
);

export const priorityTone = (priority?: string): BadgeTone => {
  if (priority === 'high') return 'red';
  if (priority === 'medium') return 'amber';
  if (priority === 'low') return 'green';
  return 'slate';
};

export const statusTone = (status?: string): BadgeTone => {
  if (status === 'done' || status === 'completed' || status === 'active') return 'green';
  if (status === 'in_progress' || status === 'review') return 'blue';
  if (status === 'planned') return 'purple';
  return 'slate';
};
