import { forwardRef, useState } from 'react';
import { cn } from '@/lib/utils';

export interface SliderProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'onChange'> {
  label?: string;
  min?: number;
  max?: number;
  step?: number;
  value?: number;
  onChange?: (value: number) => void;
  showValue?: boolean;
  unit?: string;
}

export const Slider = forwardRef<HTMLInputElement, SliderProps>(
  (
    {
      className,
      label,
      min = 0,
      max = 100,
      step = 1,
      value: controlledValue,
      onChange,
      showValue = true,
      unit,
      id,
      ...props
    },
    ref
  ) => {
    const [internalValue, setInternalValue] = useState(min);
    const value = controlledValue !== undefined ? controlledValue : internalValue;
    const sliderId = id || `slider-${Math.random().toString(36).substr(2, 9)}`;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = Number(e.target.value);
      if (controlledValue === undefined) {
        setInternalValue(newValue);
      }
      onChange?.(newValue);
    };

    const percentage = ((value - min) / (max - min)) * 100;

    return (
      <div className={cn('w-full', className)}>
        <div className="flex items-center justify-between mb-2">
          {label && (
            <label
              htmlFor={sliderId}
              className="text-sm font-medium text-ink-500"
            >
              {label}
            </label>
          )}
          {showValue && (
            <span className="text-sm font-medium text-ink-700">
              {value}
              {unit && <span className="text-ink-400 ml-0.5">{unit}</span>}
            </span>
          )}
        </div>
        <div className="relative">
          <div
            className="absolute left-0 top-1/2 -translate-y-1/2 h-2 bg-ink-500 rounded-lg pointer-events-none"
            style={{ width: `${percentage}%` }}
          />
          <input
            ref={ref}
            id={sliderId}
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={handleChange}
            className="relative w-full h-2 bg-paper-200 rounded-lg appearance-none cursor-pointer z-10"
            {...props}
          />
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-xs text-ink-400">{min}</span>
          <span className="text-xs text-ink-400">{max}</span>
        </div>
      </div>
    );
  }
);

Slider.displayName = 'Slider';
