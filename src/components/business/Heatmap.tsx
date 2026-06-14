import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  Tooltip,
  Cell,
  XAxis,
  YAxis,
} from 'recharts';
import { CartesianGrid } from 'recharts';
import { ScatterChart, Scatter, ZAxis } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { cn } from '@/lib/utils';

interface HeatmapCell {
  x: number;
  y: number;
  value: number;
}

interface HeatmapProps {
  data?: HeatmapCell[];
  title?: string;
  description?: string;
  className?: string;
  height?: number;
  gridSize?: number;
  overallScore?: number;
  showLegend?: boolean;
}

const generateDefaultData = (): HeatmapCell[] => {
  const data: HeatmapCell[] = [];
  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 10; x++) {
      const centerDist = Math.sqrt(Math.pow(x - 4.5, 2) + Math.pow(y - 3.5, 2));
      const baseValue = 70 + Math.random() * 25;
      const edgeFactor = Math.max(0, (centerDist - 3) * 5);
      const value = Math.max(0, Math.min(100, baseValue - edgeFactor - Math.random() * 10));
      data.push({ x, y, value: Math.round(value) });
    }
  }
  return data;
};

const getHeatColor = (value: number): string => {
  if (value >= 85) return '#6B8E23';
  if (value >= 70) return '#A6C868';
  if (value >= 55) return '#D4A017';
  if (value >= 40) return '#DC6F5E';
  return '#C83C23';
};

const getHeatLabel = (value: number): { label: string; color: string } => {
  if (value >= 85) return { label: '平整', color: 'text-bamboo-600' };
  if (value >= 70) return { label: '基本平整', color: 'text-bamboo-500' };
  if (value >= 55) return { label: '轻微翘曲', color: 'text-warning-wood' };
  if (value >= 40) return { label: '中度翘曲', color: 'text-seal-500' };
  return { label: '严重翘曲', color: 'text-seal-600' };
};

const CustomTooltip: React.FC<any> = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const heatInfo = getHeatLabel(data.value);
    return (
      <div className="bg-paper-50 border border-paper-300 rounded-lg shadow-scroll px-4 py-3 min-w-[140px]">
        <div className="flex items-center gap-2 mb-2">
          <div
            className="w-4 h-4 rounded"
            style={{ backgroundColor: getHeatColor(data.value) }}
          />
          <span className={cn('font-medium', heatInfo.color)}>{heatInfo.label}</span>
        </div>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-ink-500">平整度:</span>
            <span className="font-medium text-ink-700 font-mono">{data.value}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-ink-500">位置:</span>
            <span className="font-medium text-ink-700 font-mono">({data.x}, {data.y})</span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

export const Heatmap: React.FC<HeatmapProps> = ({
  data,
  title,
  description,
  className,
  height = 320,
  gridSize = 40,
  overallScore,
  showLegend = true,
}) => {
  const heatmapData = useMemo(() => data || generateDefaultData(), [data]);

  const calculatedScore = useMemo(() => {
    if (overallScore !== undefined) return overallScore;
    const avg = heatmapData.reduce((sum, d) => sum + d.value, 0) / heatmapData.length;
    return Math.round(avg);
  }, [heatmapData, overallScore]);

  const scoreInfo = getHeatLabel(calculatedScore);

  const maxX = Math.max(...heatmapData.map(d => d.x)) + 1;
  const maxY = Math.max(...heatmapData.map(d => d.y)) + 1;

  return (
    <Card className={cn('', className)}>
      {(title || description) && (
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              {title && <CardTitle>{title}</CardTitle>}
              {description && <CardDescription>{description}</CardDescription>}
            </div>
            <div className="text-right">
              <div
                className={cn(
                  'text-3xl font-song font-bold',
                  scoreInfo.color
                )}
              >
                {calculatedScore}%
              </div>
              <div className={cn('text-sm font-medium', scoreInfo.color)}>
                {scoreInfo.label}
              </div>
            </div>
          </div>
        </CardHeader>
      )}
      <CardContent>
        <div className="w-full" style={{ height }}>
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart
              margin={{ top: 10, right: 10, bottom: 10, left: 10 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#D4C49A"
                vertical={true}
                horizontal={true}
              />
              <XAxis
                type="number"
                dataKey="x"
                domain={[0, maxX]}
                tick={false}
                axisLine={{ stroke: '#B8A37A' }}
                tickLine={false}
              />
              <YAxis
                type="number"
                dataKey="y"
                domain={[0, maxY]}
                tick={false}
                axisLine={{ stroke: '#B8A37A' }}
                tickLine={false}
                orientation="left"
              />
              <ZAxis
                type="number"
                dataKey="value"
                domain={[0, 100]}
                range={[gridSize * gridSize * 0.8, gridSize * gridSize * 0.8]}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#7D6B48', strokeWidth: 1 }} />
              <Scatter
                name="平整度"
                data={heatmapData}
                isAnimationActive={true}
                animationBegin={0}
                animationDuration={800}
              >
                {heatmapData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={getHeatColor(entry.value)}
                    stroke="#FBF8F0"
                    strokeWidth={2}
                  />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>

        {showLegend && (
          <div className="mt-4 pt-4 border-t border-paper-200">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-ink-500">平整度图例</span>
              <span className="text-sm text-ink-500">
                检测区域: {maxY}×{maxX} 格
              </span>
            </div>
            <div className="flex items-center gap-1">
              {[
                { value: 100, label: '平整' },
                { value: 85, label: '' },
                { value: 70, label: '' },
                { value: 55, label: '' },
                { value: 40, label: '' },
                { value: 0, label: '翘曲' },
              ].map((item, index) => (
                <React.Fragment key={index}>
                  <div
                    className="flex-1 h-8 rounded first:rounded-l-lg last:rounded-r-lg relative"
                    style={{ backgroundColor: getHeatColor(item.value) }}
                  >
                    {item.label && (
                      <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-paper-50 drop-shadow">
                        {item.label}
                      </span>
                    )}
                  </div>
                  {index < 5 && (
                    <div className="w-px h-8 bg-paper-100" />
                  )}
                </React.Fragment>
              ))}
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-xs text-ink-400">100%</span>
              <span className="text-xs text-ink-400">85%</span>
              <span className="text-xs text-ink-400">70%</span>
              <span className="text-xs text-ink-400">55%</span>
              <span className="text-xs text-ink-400">40%</span>
              <span className="text-xs text-ink-400">0%</span>
            </div>
          </div>
        )}

        <div className="mt-4 pt-4 border-t border-paper-200">
          <div className="grid grid-cols-4 gap-3 text-center">
            <div className="p-3 bg-bamboo-50 rounded-lg border border-bamboo-200">
              <div className="text-2xl font-song font-bold text-bamboo-600">
                {heatmapData.filter(d => d.value >= 85).length}
              </div>
              <div className="text-xs text-bamboo-700 font-song">平整区域</div>
            </div>
            <div className="p-3 bg-bamboo-50/50 rounded-lg border border-bamboo-200/50">
              <div className="text-2xl font-song font-bold text-bamboo-500">
                {heatmapData.filter(d => d.value >= 70 && d.value < 85).length}
              </div>
              <div className="text-xs text-bamboo-600 font-song">基本平整</div>
            </div>
            <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
              <div className="text-2xl font-song font-bold text-warning-wood">
                {heatmapData.filter(d => d.value >= 55 && d.value < 70).length}
              </div>
              <div className="text-xs text-amber-700 font-song">轻微翘曲</div>
            </div>
            <div className="p-3 bg-seal-50 rounded-lg border border-seal-200">
              <div className="text-2xl font-song font-bold text-seal-600">
                {heatmapData.filter(d => d.value < 55).length}
              </div>
              <div className="text-xs text-seal-700 font-song">需关注</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default Heatmap;
