import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-ink-600 text-paper-50 border border-ink-700 hover:bg-ink-500 hover:shadow-scroll active:bg-ink-700',
  secondary:
    'bg-paper-50 text-ink-600 border border-paper-300 hover:bg-paper-100 hover:border-paper-400 hover:shadow-scroll active:bg-paper-200',
  danger:
    'bg-seal-500 text-white border border-seal-600 hover:bg-seal-400 hover:shadow-scroll active:bg-seal-600',
  ghost:
    'bg-transparent text-ink-600 border border-transparent hover:bg-paper-100 active:bg-paper-200',
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      loading = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          'inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-all duration-200',
          'active:scale-[0.96]',
          'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none disabled:active:scale-100',
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        {...props}
      >
        {loading && (
          <svg
            className="animate-spin h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
