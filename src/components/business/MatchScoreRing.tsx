import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';

interface MatchScoreRingProps {
  score: number;
  title?: string;
  description?: string;
  size?: number;
  strokeWidth?: number;
  animated?: boolean;
  animationDuration?: number;
  className?: string;
  showLabel?: boolean;
  label?: string;
}

const getScoreColor = (score: number): {
  primary: string;
  secondary: string;
  bg: string;
  text: string;
  label: string;
} => {
  if (score >= 90) {
    return {
      primary: '#6B8E23',
      secondary: '#8EB93E',
      bg: 'rgba(107, 142, 35, 0.1)',
      text: 'text-bamboo-600',
      label: '优秀',
    };
  }
  if (score >= 80) {
    return {
      primary: '#2E4A62',
      secondary: '#3E75AD',
      bg: 'rgba(46, 74, 98, 0.1)',
      text: 'text-azure-600',
      label: '良好',
    };
  }
  if (score >= 70) {
    return {
      primary: '#D4A017',
      secondary: '#E8B84C',
      bg: 'rgba(212, 160, 23, 0.1)',
      text: 'text-warning-wood',
      label: '一般',
    };
  }
  return {
    primary: '#C83C23',
    secondary: '#D1442F',
    bg: 'rgba(200, 60, 35, 0.1)',
    text: 'text-seal-600',
    label: '较差',
  };
};

export const MatchScoreRing: React.FC<MatchScoreRingProps> = ({
  score,
  title,
  description,
  size = 200,
  strokeWidth = 12,
  animated = true,
  animationDuration = 1500,
  className,
  showLabel = true,
  label,
}) => {
  const [displayScore, setDisplayScore] = useState(animated ? 0 : score);
  const colors = getScoreColor(score);
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (displayScore / 100) * circumference;

  useEffect(() => {
    if (!animated) {
      setDisplayScore(score);
      return;
    }

    const startTime = Date.now();
    const startValue = 0;
    const endValue = score;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / animationDuration, 1);
      const easeOutCubic = 1 - Math.pow(1 - progress, 3);
      const currentValue = Math.round(startValue + (endValue - startValue) * easeOutCubic);
      setDisplayScore(currentValue);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [score, animated, animationDuration]);

  const displayLabel = label || colors.label;

  return (
    <Card className={cn('', className)}>
      {(title || description) && (
        <CardHeader>
          {title && <CardTitle>{title}</CardTitle>}
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
      )}
      <CardContent className="flex flex-col items-center justify-center py-6">
        <div className="relative" style={{ width: size, height: size }}>
          <svg
            width={size}
            height={size}
            className="-rotate-90"
            style={{ filter: 'drop-shadow(0 2px 4px rgba(44, 24, 16, 0.1))' }}
          >
            <defs>
              <linearGradient
                id={`score-gradient-${score}`}
                x1="0%"
                y1="0%"
                x2="100%"
                y2="100%"
              >
                <stop offset="0%" stopColor={colors.secondary} />
                <stop offset="100%" stopColor={colors.primary} />
              </linearGradient>
              <filter id={`score-glow-${score}`}>
                <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke="#E8DFC7"
              strokeWidth={strokeWidth}
            />

            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={`url(#score-gradient-${score})`}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              filter={`url(#score-glow-${score})`}
              style={{
                transition: animated ? 'stroke-dashoffset 0.5s ease-out' : 'none',
              }}
            />

            <circle
              cx={size / 2 + Math.sin((displayScore / 100) * 2 * Math.PI) * radius}
              cy={size / 2 - Math.cos((displayScore / 100) * 2 * Math.PI) * radius}
              r={strokeWidth / 2 + 2}
              fill={colors.primary}
              stroke="#FBF8F0"
              strokeWidth={3}
            />
          </svg>

          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="flex items-baseline">
              <span
                className={cn(
                  'font-song font-bold',
                  colors.text
                )}
                style={{ fontSize: size * 0.25 }}
              >
                {displayScore}
              </span>
              <span
                className={cn(
                  'font-song font-medium ml-1',
                  colors.text
                )}
                style={{ fontSize: size * 0.12 }}
              >
                %
              </span>
            </div>
            {showLabel && (
              <div
                className={cn(
                  'px-3 py-1 rounded-full mt-2 font-song text-sm font-medium',
                  colors.text
                )}
                style={{ backgroundColor: colors.bg }}
              >
                {displayLabel}
              </div>
            )}
          </div>
        </div>

        {animated && displayScore < score && (
          <div className="mt-4 h-1 w-32 bg-paper-200 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${(displayScore / score) * 100}%`,
                backgroundColor: colors.primary,
              }}
            />
          </div>
        )}

        <div className="mt-6 grid grid-cols-4 gap-3 w-full">
          {[
            { threshold: 90, label: '优秀', color: '#6B8E23' },
            { threshold: 80, label: '良好', color: '#2E4A62' },
            { threshold: 70, label: '一般', color: '#D4A017' },
            { threshold: 0, label: '较差', color: '#C83C23' },
          ].map((item, index) => (
            <div
              key={index}
              className={cn(
                'text-center p-2 rounded-lg border transition-all duration-300',
                score >= item.threshold && (index === 0 || score < [90, 80, 70, 0][index - 1])
                  ? 'border-paper-400 bg-paper-100'
                  : 'border-paper-200 bg-paper-50 opacity-50'
              )}
            >
              <div
                className="w-3 h-3 rounded-full mx-auto mb-1"
                style={{ backgroundColor: item.color }}
              />
              <div className="text-xs text-ink-500 font-song">{item.label}</div>
              <div className="text-xs font-medium text-ink-700">
                ≥{item.threshold}%
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default MatchScoreRing;
