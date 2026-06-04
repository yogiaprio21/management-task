import React from 'react';
import { cn } from './utils';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, id, className, ...props }, ref) => (
    <div className="w-full space-y-1.5">
      {label && (
        <label htmlFor={id} className="ml-0.5 text-sm font-semibold text-slate-700 dark:text-slate-300">
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        id={id}
        aria-invalid={!!error}
        className={cn(
          'min-h-[112px] w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-800 outline-none transition',
          'placeholder:text-slate-400 focus:border-primary focus:ring-4 focus:ring-primary/10 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100',
          error && 'border-red-500 focus:border-red-500 focus:ring-red-500/10',
          className,
        )}
        {...props}
      />
      {error && <p className="text-xs font-medium text-red-600">{error}</p>}
    </div>
  ),
);

Textarea.displayName = 'Textarea';
