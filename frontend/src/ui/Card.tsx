import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
}

export const Card: React.FC<CardProps> = ({ className, children, hover = true, ...props }) => {
  return (
    <div
      className={cn(
        'card-gradient rounded-3xl p-6 relative overflow-hidden',
        hover && 'hover:-translate-y-1',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
