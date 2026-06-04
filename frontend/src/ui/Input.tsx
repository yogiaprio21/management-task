import React from 'react';
import { cn } from './utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, icon, id, ...props }, ref) => {
    const errorId = `${id}-error`;
    return (
      <div className="w-full space-y-1.5">
        {label && <label htmlFor={id} className="ml-0.5 text-sm font-semibold text-slate-700 dark:text-slate-300">{label}</label>}
        <div className="relative group">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            id={id}
            aria-invalid={!!error}
            aria-describedby={error ? errorId : undefined}
            className={cn(
              'h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm outline-none transition-all duration-200 dark:border-slate-700 dark:bg-slate-900',
              'focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-primary/10 focus:border-primary shadow-sm',
              'placeholder:text-slate-400 dark:placeholder:text-slate-500 font-medium text-slate-900 dark:text-white',
              icon && 'pl-11',
              error && 'border-red-500 focus:ring-red-500/20 focus:border-red-500 bg-red-50/50',
              className
            )}
            {...props}
          />
        </div>
        {error && <p id={errorId} className="text-xs text-red-500 font-medium">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
