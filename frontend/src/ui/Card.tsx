import React from 'react';
import { cn } from './utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
}

export const Card: React.FC<CardProps> = ({ className, children, hover = true, ...props }) => {
  return (
    <div
      className={cn(
        'card-gradient rounded-3xl p-6 relative overflow-hidden',
        'rounded-xl',
        hover && 'hover:shadow-md',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
