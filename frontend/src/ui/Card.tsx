import React from 'react';
import { cn } from './utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
}

export const Card: React.FC<CardProps> = ({ className, children, hover = true, ...props }) => {
  return (
    <div
      className={cn(
        'card-gradient relative overflow-hidden rounded-lg p-5',
        hover && 'hover:shadow-md',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
