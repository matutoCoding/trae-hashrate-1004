import React from 'react';
import {
  Radar,
  RadarChart as RechartsRadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { cn } from '@/lib/utils';

interface RadarDataPoint {
  dimension: string;
  original: number;
  patch: number;
  fullMark?: number;
}

interface RadarChartProps {
  data: RadarDataPoint[];
  title?: string;
  description?: string;
  className?: string;
  height?: number;
  showLegend?: boolean;
  originalLabel?: string;
  patchLabel?: string;
}

const defaultDimensions: RadarDataPoint[] = [
  { dimension: '帘纹间距', original: 85, patch: 82, fullMark: 100 },
  { dimension: '纤维成分', original: 78, patch: 80, fullMark: 100 },
  { dimension: '厚度', original: 90, patch: 88, fullMark: 100 },
  { dimension: '色度', original: 75, patch: 76, fullMark: 100 },
  { dimension: 'pH值', original: 88, patch: 90, fullMark: 100 },
];

const CustomTooltip: React.FC<any> = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-paper-50 border border-paper-300 rounded-lg shadow-scroll px-4 py-3">
        <p className="font-song font-medium text-ink-700 mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2 text-sm">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-ink-500">{entry.name}:</span>
            <span className="font-medium text-ink-700">{entry.value}%</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export const RadarChart: React.FC<RadarChartProps> = ({
  data = defaultDimensions,
  title,
  description,
  className,
  height = 350,
  showLegend = true,
  originalLabel = '原纸',
  patchLabel = '补纸',
}) => {
  return (
    <Card className={cn('', className)}>
      {(title || description) && (
        <CardHeader>
          {title && <CardTitle>{title}</CardTitle>}
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
      )}
      <CardContent>
        <div className="w-full" style={{ height }}>
          <ResponsiveContainer width="100%" height="100%">
            <RechartsRadarChart
              cx="50%"
              cy="50%"
              outerRadius="70%"
              innerRadius="20%"
              data={data}
            >
              <PolarGrid
                stroke="#D4C49A"
                strokeWidth={1}
                strokeDasharray="3 3"
              />
              <PolarAngleAxis
                dataKey="dimension"
                tick={{
                  fill: '#50403F',
                  fontSize: 13,
                  fontFamily: '"Noto Serif SC", "SimSun", serif',
                  fontWeight: 500,
                }}
                stroke="#B8A37A"
              />
              <PolarRadiusAxis
                angle={90}
                domain={[0, 100]}
                tick={{
                  fill: '#7D6B48',
                  fontSize: 11,
                }}
                tickCount={6}
                stroke="#B8A37A"
              />
              <Radar
                name={originalLabel}
                dataKey="original"
                stroke="#2E4A62"
                fill="#2E4A62"
                fillOpacity={0.3}
                strokeWidth={2}
                dot={{
                  r: 5,
                  fill: '#2E4A62',
                  strokeWidth: 2,
                  stroke: '#FBF8F0',
                }}
                activeDot={{
                  r: 7,
                  fill: '#2E4A62',
                  strokeWidth: 3,
                  stroke: '#FBF8F0',
                }}
              />
              <Radar
                name={patchLabel}
                dataKey="patch"
                stroke="#C83C23"
                fill="#C83C23"
                fillOpacity={0.3}
                strokeWidth={2}
                dot={{
                  r: 5,
                  fill: '#C83C23',
                  strokeWidth: 2,
                  stroke: '#FBF8F0',
                }}
                activeDot={{
                  r: 7,
                  fill: '#C83C23',
                  strokeWidth: 3,
                  stroke: '#FBF8F0',
                }}
              />
              <Tooltip content={<CustomTooltip />} />
              {showLegend && (
                <Legend
                  formatter={(value) => (
                    <span className="text-ink-600 font-hei text-sm">{value}</span>
                  )}
                  iconType="circle"
                  wrapperStyle={{
                    paddingTop: '20px',
                  }}
                />
              )}
            </RechartsRadarChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-4 pt-4 border-t border-paper-200">
          <div className="grid grid-cols-5 gap-2 text-center">
            {data.map((item, index) => {
              const diff = item.patch - item.original;
              return (
                <div key={index} className="space-y-1">
                  <div className="text-xs text-ink-400 font-song">{item.dimension}</div>
                  <div className="flex items-center justify-center gap-1">
                    <span className="text-sm font-medium text-azure-600">
                      {item.original}
                    </span>
                    <span className="text-xs text-ink-300">vs</span>
                    <span className="text-sm font-medium text-seal-600">
                      {item.patch}
                    </span>
                  </div>
                  <div
                    className={cn(
                      'text-xs font-medium',
                      Math.abs(diff) <= 3
                        ? 'text-bamboo-600'
                        : Math.abs(diff) <= 8
                        ? 'text-warning-wood'
                        : 'text-seal-600'
                    )}
                  >
                    {diff > 0 ? '+' : ''}
                    {diff}%
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default RadarChart;
