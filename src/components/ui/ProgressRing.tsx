import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface ProgressRingProps extends React.HTMLAttributes<HTMLDivElement> {
  progress: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  bgColor?: string;
  showLabel?: boolean;
  label?: string;
}

export const ProgressRing = forwardRef<HTMLDivElement, ProgressRingProps>(
  (
    {
      progress,
      size = 120,
      strokeWidth = 8,
      color = '#2C1810',
      bgColor = '#E8DFC7',
      showLabel = true,
      label,
      className,
      ...props
    },
    ref
  ) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (progress / 100) * circumference;
    const safeProgress = Math.min(100, Math.max(0, progress));

    return (
      <div
        ref={ref}
        className={cn('relative inline-flex items-center justify-center', className)}
        style={{ width: size, height: size }}
        {...props}
      >
        <svg
          width={size}
          height={size}
          className="transform -rotate-90"
        >
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={bgColor}
            strokeWidth={strokeWidth}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-500 ease-out"
          />
        </svg>
        {showLabel && (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-song font-semibold text-2xl text-ink-700">
              {label || `${Math.round(safeProgress)}%`}
            </span>
            {!label && (
              <span className="text-xs text-ink-400 mt-0.5">
                完成进度
              </span>
            )}
          </div>
        )}
      </div>
    );
  }
);

ProgressRing.displayName = 'ProgressRing';
