import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

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
        {label && <label htmlFor={id} className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">{label}</label>}
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
              'w-full bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-3 outline-none transition-all duration-300',
              'focus:bg-white dark:focus:bg-slate-800 focus:ring-4 focus:ring-primary-glass focus:border-primary shadow-subtle',
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
