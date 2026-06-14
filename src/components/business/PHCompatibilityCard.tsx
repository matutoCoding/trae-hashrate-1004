import React, { useMemo } from 'react';
import { AlertTriangle, CheckCircle2, Info, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { cn } from '@/lib/utils';
import type { PHCompatibilityResult, CompatibilityLevel } from '@/types';

interface PHCompatibilityCardProps {
  originalPH: number;
  patchPH: number;
  title?: string;
  description?: string;
  className?: string;
  showDetails?: boolean;
}

const PH_SCALE_MIN = 0;
const PH_SCALE_MAX = 14;
const NEUTRAL_PH = 7;

const getCompatibilityInfo = (diff: number, originalPH: number, patchPH: number): PHCompatibilityResult => {
  const absDiff = Math.abs(diff);
  const isAcidic = originalPH < NEUTRAL_PH || patchPH < NEUTRAL_PH;
  const eitherAcidic = originalPH < 6 || patchPH < 6;

  let level: CompatibilityLevel;
  let warning: string;

  if (eitherAcidic) {
    level = '危险';
    warning = '检测到酸性纸张，存在酸化风险，建议先进行脱酸处理';
  } else if (absDiff <= 0.3) {
    level = '优秀';
    warning = 'pH值非常接近，相容性极佳';
  } else if (absDiff <= 0.5) {
    level = '良好';
    warning = 'pH值相近，相容性良好';
  } else if (absDiff <= 0.8) {
    level = '一般';
    warning = 'pH值存在一定差异，需注意观察';
  } else if (absDiff <= 1.2) {
    level = '较差';
    warning = 'pH值差异较大，可能影响修复效果';
  } else {
    level = '危险';
    warning = 'pH值差异过大，存在严重相容性风险，不建议使用';
  }

  return {
    level,
    diff: absDiff,
    isAcidic,
    warning,
  };
};

const getLevelStyle = (level: CompatibilityLevel): {
  bg: string;
  border: string;
  text: string;
  icon: React.ReactNode;
  iconBg: string;
} => {
  switch (level) {
    case '优秀':
      return {
        bg: 'bg-bamboo-50',
        border: 'border-bamboo-300',
        text: 'text-bamboo-700',
        icon: <CheckCircle2 size={24} className="text-bamboo-600" />,
        iconBg: 'bg-bamboo-100',
      };
    case '良好':
      return {
        bg: 'bg-azure-50',
        border: 'border-azure-300',
        text: 'text-azure-700',
        icon: <CheckCircle2 size={24} className="text-azure-600" />,
        iconBg: 'bg-azure-100',
      };
    case '一般':
      return {
        bg: 'bg-amber-50',
        border: 'border-amber-300',
        text: 'text-amber-700',
        icon: <Info size={24} className="text-warning-wood" />,
        iconBg: 'bg-amber-100',
      };
    case '较差':
      return {
        bg: 'bg-orange-50',
        border: 'border-orange-300',
        text: 'text-orange-700',
        icon: <AlertTriangle size={24} className="text-orange-600" />,
        iconBg: 'bg-orange-100',
      };
    case '危险':
      return {
        bg: 'bg-seal-50',
        border: 'border-seal-300',
        text: 'text-seal-700',
        icon: <XCircle size={24} className="text-seal-600" />,
        iconBg: 'bg-seal-100',
      };
  }
};

const getPHColor = (ph: number): string => {
  if (ph < 4.5) return '#C83C23';
  if (ph < 5.5) return '#DC6F5E';
  if (ph < 6.5) return '#D4A017';
  if (ph < 7.5) return '#6B8E23';
  if (ph < 9) return '#3E75AD';
  return '#2E4A62';
};

const getPHLabel = (ph: number): string => {
  if (ph < 4.5) return '强酸性';
  if (ph < 5.5) return '酸性';
  if (ph < 6.5) return '弱酸性';
  if (ph < 7.5) return '中性';
  if (ph < 9) return '弱碱性';
  return '碱性';
};

export const PHCompatibilityCard: React.FC<PHCompatibilityCardProps> = ({
  originalPH,
  patchPH,
  title = '酸碱度相容性',
  description,
  className,
  showDetails = true,
}) => {
  const compatibility = useMemo(
    () => getCompatibilityInfo(patchPH - originalPH, originalPH, patchPH),
    [originalPH, patchPH]
  );

  const style = getLevelStyle(compatibility.level);

  const phPosition = (ph: number) =>
    ((ph - PH_SCALE_MIN) / (PH_SCALE_MAX - PH_SCALE_MIN)) * 100;

  return (
    <Card className={cn('', className)}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle>{title}</CardTitle>
            {description && <CardDescription>{description}</CardDescription>}
          </div>
          <div
            className={cn(
              'px-3 py-1.5 rounded-full border-2 font-song font-semibold text-sm',
              style.bg,
              style.border,
              style.text
            )}
          >
            {compatibility.level}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className={cn('p-4 rounded-lg border', style.bg, style.border)}>
          <div className="flex items-start gap-4">
            <div className={cn('p-3 rounded-full', style.iconBg)}>{style.icon}</div>
            <div className="flex-1">
              <p className={cn('font-medium', style.text)}>{compatibility.warning}</p>
              <p className="text-sm text-ink-500 mt-1">
                pH差值: <span className="font-mono font-medium text-ink-700">{compatibility.diff.toFixed(2)}</span>
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="relative h-12">
            <div className="absolute inset-x-0 top-4 h-4 rounded-full overflow-hidden">
              <div
                className="h-full w-full"
                style={{
                  background:
                    'linear-gradient(to right, #C83C23 0%, #DC6F5E 15%, #D4A017 30%, #A6C868 45%, #6B8E23 50%, #A6C868 55%, #5C93BF 70%, #3E75AD 85%, #2E4A62 100%)',
                }}
              />
            </div>

            <div
              className="absolute top-0 transition-all duration-500"
              style={{ left: `${phPosition(originalPH)}%`, transform: 'translateX(-50%)' }}
            >
              <div className="text-center">
                <div
                  className="w-1.5 h-1.5 rounded-full mx-auto mb-1"
                  style={{ backgroundColor: getPHColor(originalPH) }}
                />
                <div
                  className="text-xs font-medium px-2 py-0.5 rounded whitespace-nowrap"
                  style={{
                    backgroundColor: getPHColor(originalPH) + '20',
                    color: getPHColor(originalPH),
                  }}
                >
                  原纸 {originalPH.toFixed(1)}
                </div>
              </div>
            </div>

            <div
              className="absolute top-8 transition-all duration-500"
              style={{ left: `${phPosition(patchPH)}%`, transform: 'translateX(-50%)' }}
            >
              <div className="text-center">
                <div
                  className="text-xs font-medium px-2 py-0.5 rounded whitespace-nowrap"
                  style={{
                    backgroundColor: getPHColor(patchPH) + '20',
                    color: getPHColor(patchPH),
                  }}
                >
                  补纸 {patchPH.toFixed(1)}
                </div>
                <div
                  className="w-1.5 h-1.5 rounded-full mx-auto mt-1"
                  style={{ backgroundColor: getPHColor(patchPH) }}
                />
              </div>
            </div>

            <svg
              className="absolute inset-x-0 top-4 h-4 pointer-events-none"
              style={{ transform: 'translateY(-2px)' }}
            >
              <defs>
                <marker
                  id="arrowhead"
                  markerWidth="10"
                  markerHeight="7"
                  refX="9"
                  refY="3.5"
                  orient="auto"
                >
                  <polygon
                    points="0 0, 10 3.5, 0 7"
                    fill={compatibility.diff > 0.5 ? '#C83C23' : '#7D6B48'}
                  />
                </marker>
              </defs>
              <line
                x1={`${phPosition(Math.min(originalPH, patchPH))}%`}
                y1="8"
                x2={`${phPosition(Math.max(originalPH, patchPH))}%`}
                y2="8"
                stroke={compatibility.diff > 0.5 ? '#C83C23' : '#7D6B48'}
                strokeWidth="2"
                strokeDasharray={compatibility.diff > 0.5 ? '4 2' : 'none'}
                markerEnd="url(#arrowhead)"
              />
            </svg>
          </div>

          <div className="flex justify-between text-xs text-ink-400 px-1">
            <span>0</span>
            <span>强酸</span>
            <span>弱酸</span>
            <span>中性</span>
            <span>弱碱</span>
            <span>强碱</span>
            <span>14</span>
          </div>
        </div>

        {showDetails && (
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-paper-200">
            <div className="space-y-2">
              <div className="text-sm text-ink-500 font-song">原纸特性</div>
              <div className="flex items-center justify-between p-3 bg-paper-100 rounded-lg">
                <div className="flex items-center gap-2">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-paper-50 font-bold text-sm"
                    style={{ backgroundColor: getPHColor(originalPH) }}
                  >
                    {originalPH.toFixed(1)}
                  </div>
                  <div>
                    <div className="font-medium text-ink-700">pH值</div>
                    <div className="text-xs text-ink-400">{getPHLabel(originalPH)}</div>
                  </div>
                </div>
              </div>
              {originalPH < 6 && (
                <div className="p-2 bg-seal-50 border border-seal-200 rounded-lg text-xs text-seal-700">
                  <AlertTriangle size={12} className="inline mr-1" />
                  酸性纸张，需脱酸处理
                </div>
              )}
            </div>

            <div className="space-y-2">
              <div className="text-sm text-ink-500 font-song">补纸特性</div>
              <div className="flex items-center justify-between p-3 bg-paper-100 rounded-lg">
                <div className="flex items-center gap-2">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-paper-50 font-bold text-sm"
                    style={{ backgroundColor: getPHColor(patchPH) }}
                  >
                    {patchPH.toFixed(1)}
                  </div>
                  <div>
                    <div className="font-medium text-ink-700">pH值</div>
                    <div className="text-xs text-ink-400">{getPHLabel(patchPH)}</div>
                  </div>
                </div>
              </div>
              {patchPH < 6 && (
                <div className="p-2 bg-seal-50 border border-seal-200 rounded-lg text-xs text-seal-700">
                  <AlertTriangle size={12} className="inline mr-1" />
                  酸性补纸，不建议使用
                </div>
              )}
            </div>
          </div>
        )}

        <div className="pt-4 border-t border-paper-200">
          <div className="text-sm text-ink-500 mb-3 font-song">修复建议</div>
          <div className="space-y-2">
            {compatibility.level === '优秀' && (
              <div className="flex items-start gap-2 text-sm text-bamboo-700">
                <CheckCircle2 size={16} className="mt-0.5 flex-shrink-0" />
                <span>纸张相容性极佳，可直接用于修复</span>
              </div>
            )}
            {compatibility.level === '良好' && (
              <div className="flex items-start gap-2 text-sm text-azure-700">
                <CheckCircle2 size={16} className="mt-0.5 flex-shrink-0" />
                <span>纸张相容性良好，适合用于修复</span>
              </div>
            )}
            {compatibility.level === '一般' && (
              <>
                <div className="flex items-start gap-2 text-sm text-amber-700">
                  <Info size={16} className="mt-0.5 flex-shrink-0" />
                  <span>建议先进行小范围测试，观察纸张反应</span>
                </div>
                <div className="flex items-start gap-2 text-sm text-amber-700">
                  <Info size={16} className="mt-0.5 flex-shrink-0" />
                  <span>可考虑使用中间层或缓冲材料</span>
                </div>
              </>
            )}
            {compatibility.level === '较差' && (
              <>
                <div className="flex items-start gap-2 text-sm text-orange-700">
                  <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
                  <span>不建议直接使用，可能导致纸张损伤</span>
                </div>
                <div className="flex items-start gap-2 text-sm text-orange-700">
                  <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
                  <span>建议寻找pH值更接近的补纸</span>
                </div>
              </>
            )}
            {compatibility.level === '危险' && (
              <>
                <div className="flex items-start gap-2 text-sm text-seal-700">
                  <XCircle size={16} className="mt-0.5 flex-shrink-0" />
                  <span>禁止使用，会严重损害文物</span>
                </div>
                <div className="flex items-start gap-2 text-sm text-seal-700">
                  <XCircle size={16} className="mt-0.5 flex-shrink-0" />
                  <span>酸性纸张必须先进行脱酸处理</span>
                </div>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PHCompatibilityCard;
