import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'default';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  dot?: boolean;
}

const variantStyles: Record<BadgeVariant, string> = {
  success: 'bg-bamboo-100 text-bamboo-700 border-bamboo-200',
  warning: 'bg-amber-100 text-amber-700 border-amber-200',
  danger: 'bg-seal-100 text-seal-700 border-seal-200',
  info: 'bg-azure-100 text-azure-700 border-azure-200',
  default: 'bg-paper-100 text-ink-600 border-paper-300',
};

const dotColors: Record<BadgeVariant, string> = {
  success: 'bg-bamboo-500',
  warning: 'bg-amber-500',
  danger: 'bg-seal-500',
  info: 'bg-azure-500',
  default: 'bg-ink-400',
};

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'default', dot = false, children, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(
          'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border transition-colors',
          variantStyles[variant],
          className
        )}
        {...props}
      >
        {dot && (
          <span
            className={cn(
              'w-1.5 h-1.5 rounded-full',
              dotColors[variant]
            )}
          />
        )}
        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';
