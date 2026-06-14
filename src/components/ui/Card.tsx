import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean;
  bordered?: boolean;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, hoverable = false, bordered = false, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'bg-paper-50 rounded-lg border shadow-scroll transition-all duration-200',
          bordered ? 'border-2 border-double border-paper-300' : 'border-paper-200',
          hoverable && 'hover:shadow-scroll-hover cursor-pointer',
          className
        )}
        {...props}
      />
    );
  }
);

Card.displayName = 'Card';

export interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {}

export const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('px-5 py-4 border-b border-paper-200', className)}
        {...props}
      />
    );
  }
);

CardHeader.displayName = 'CardHeader';

export interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {}

export const CardTitle = forwardRef<HTMLHeadingElement, CardTitleProps>(
  ({ className, ...props }, ref) => {
    return (
      <h3
        ref={ref}
        className={cn('font-song font-semibold text-lg text-ink-700', className)}
        {...props}
      />
    );
  }
);

CardTitle.displayName = 'CardTitle';

export interface CardDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {}

export const CardDescription = forwardRef<HTMLParagraphElement, CardDescriptionProps>(
  ({ className, ...props }, ref) => {
    return (
      <p
        ref={ref}
        className={cn('text-sm text-ink-400 mt-1', className)}
        {...props}
      />
    );
  }
);

CardDescription.displayName = 'CardDescription';

export interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {}

export const CardContent = forwardRef<HTMLDivElement, CardContentProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('px-5 py-4', className)}
        {...props}
      />
    );
  }
);

CardContent.displayName = 'CardContent';

export interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {}

export const CardFooter = forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('px-5 py-4 border-t border-paper-200 flex items-center', className)}
        {...props}
      />
    );
  }
);

CardFooter.displayName = 'CardFooter';
