import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

type InputType = 'text' | 'number' | 'password' | 'email' | 'search' | 'tel' | 'url';

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'prefix' | 'suffix'> {
  type?: InputType;
  label?: string;
  error?: string;
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
  min?: number;
  max?: number;
  step?: number;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type = 'text',
      label,
      error,
      prefix,
      suffix,
      min,
      max,
      step,
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

    return (
      <div className={cn('w-full', className)}>
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-ink-500 mb-1"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {prefix && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400">
              {prefix}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            type={type}
            min={min}
            max={max}
            step={step}
            className={cn(
              'w-full px-3 py-2 bg-paper-50 border rounded-lg text-ink-700 placeholder-paper-400',
              'focus:outline-none focus:border-azure-400 focus:ring-1 focus:ring-azure-400',
              'transition-all duration-200',
              prefix && 'pl-10',
              suffix && 'pr-10',
              error
                ? 'border-seal-400 focus:border-seal-400 focus:ring-seal-400'
                : 'border-paper-300'
            )}
            {...props}
          />
          {suffix && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400">
              {suffix}
            </div>
          )}
        </div>
        {error && (
          <p className="mt-1 text-xs text-seal-500">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
