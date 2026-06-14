import { forwardRef } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'children'> {
  label?: string;
  placeholder?: string;
  options: SelectOption[];
  error?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      className,
      label,
      placeholder,
      options,
      error,
      id,
      ...props
    },
    ref
  ) => {
    const selectId = id || `select-${Math.random().toString(36).substr(2, 9)}`;

    return (
      <div className={cn('w-full', className)}>
        {label && (
          <label
            htmlFor={selectId}
            className="block text-sm font-medium text-ink-500 mb-1"
          >
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            className={cn(
              'w-full px-3 py-2 bg-paper-50 border rounded-lg text-ink-700 cursor-pointer appearance-none pr-10',
              'focus:outline-none focus:border-azure-400 focus:ring-1 focus:ring-azure-400',
              'transition-all duration-200',
              error
                ? 'border-seal-400 focus:border-seal-400 focus:ring-seal-400'
                : 'border-paper-300'
            )}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((option) => (
              <option
                key={option.value}
                value={option.value}
                disabled={option.disabled}
              >
                {option.label}
              </option>
            ))}
          </select>
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none">
            <ChevronDown className="w-4 h-4" />
          </div>
        </div>
        {error && (
          <p className="mt-1 text-xs text-seal-500">{error}</p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';
