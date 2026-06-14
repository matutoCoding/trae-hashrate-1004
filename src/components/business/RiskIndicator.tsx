import React from 'react';
import { AlertTriangle, TrendingDown, TrendingUp, Info } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { cn } from '@/lib/utils';
import type { RiskLevel } from '@/types';

interface RiskItem {
  name: string;
  level: RiskLevel;
  description: string;
  icon?: React.ReactNode;
}

interface RiskIndicatorProps {
  warpingRisk?: RiskLevel;
  collapseRisk?: RiskLevel;
  title?: string;
  description?: string;
  className?: string;
  showDetails?: boolean;
  customRisks?: RiskItem[];
}

const getRiskStyle = (level: RiskLevel): {
  color: string;
  bgColor: string;
  borderColor: string;
  textColor: string;
  label: string;
} => {
  switch (level) {
    case '低':
      return {
        color: '#6B8E23',
        bgColor: 'bg-bamboo-50',
        borderColor: 'border-bamboo-300',
        textColor: 'text-bamboo-700',
        label: '低风险',
      };
    case '中':
      return {
        color: '#D4A017',
        bgColor: 'bg-amber-50',
        borderColor: 'border-amber-300',
        textColor: 'text-amber-700',
        label: '中风险',
      };
    case '高':
      return {
        color: '#C83C23',
        bgColor: 'bg-seal-50',
        borderColor: 'border-seal-300',
        textColor: 'text-seal-700',
        label: '高风险',
      };
  }
};

const getRiskSuggestion = (level: RiskLevel, riskType: 'warping' | 'collapse'): string[] => {
  if (riskType === 'warping') {
    switch (level) {
      case '低':
        return [
          '纸张稳定性良好，可正常托裱',
          '建议采用常规托裱工艺',
        ];
      case '中':
        return [
          '存在轻微翘曲风险，建议使用稍稠糨糊',
          '托裱后需适当加压',
          '建议控制环境湿度在50-60%',
        ];
      case '高':
        return [
          '翘曲风险较高，建议先进行湿润处理',
          '采用分次托裱，避免一次性上浆过重',
          '托裱后需重压平置阴干',
          '必要时使用压板辅助定型',
        ];
    }
  } else {
    switch (level) {
      case '低':
        return [
          '纸张结构稳定，塌陷风险低',
          '可正常托裱',
        ];
      case '中':
        return [
          '存在轻微塌陷风险，注意托裱时需小心操作',
          '建议使用稍厚补纸增强支撑',
        ];
      case '高':
        return [
          '塌陷风险较高，必须使用衬纸加固',
          '建议采用双层托裱',
          '操作时避免过度拉伸纸张',
          '修复后需平放阴干，避免悬挂',
        ];
    }
  }
};

const RiskLight: React.FC<{ level: RiskLevel; size?: 'sm' | 'md' | 'lg' }> = ({ level, size = 'md' }) => {
  const style = getRiskStyle(level);
  const sizeClass = {
    sm: 'w-6 h-6',
    md: 'w-10 h-10',
    lg: 'w-14 h-14',
  }[size];

  return (
    <div className={cn('relative flex items-center justify-center', sizeClass)}>
      {level === '高' && (
        <div
          className="absolute inset-0 rounded-full animate-pulse"
          style={{ backgroundColor: style.color, opacity: 0.3 }}
        />
      )}
      <div
        className="relative rounded-full border-4 flex items-center justify-center"
        style={{
          width: '100%',
          height: '100%',
          borderColor: style.color,
          backgroundColor: style.bgColor,
        }}
      >
        <div
          className="rounded-full"
          style={{
            width: '40%',
            height: '40%',
            backgroundColor: style.color,
            boxShadow: level === '高' ? `0 0 12px ${style.color}80` : 'none',
          }}
        />
      </div>
    </div>
  );
};

const RiskBar: React.FC<{ level: RiskLevel }> = ({ level }) => {
  const style = getRiskStyle(level);
  const percentage = level === '低' ? 33 : level === '中' ? 66 : 100;

  return (
    <div className="flex-1 h-2 bg-paper-200 rounded-full overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-700 ease-out"
        style={{
          width: `${percentage}%`,
          backgroundColor: style.color,
          backgroundImage: `linear-gradient(90deg, ${style.color}cc, ${style.color})`,
        }}
      />
    </div>
  );
};

export const RiskIndicator: React.FC<RiskIndicatorProps> = ({
  warpingRisk = '低',
  collapseRisk = '低',
  title = '风险评估',
  description,
  className,
  showDetails = true,
  customRisks,
}) => {
  const defaultRisks: RiskItem[] = [
    {
      name: '翘曲风险',
      level: warpingRisk,
      description: '托裱后纸张发生翘曲的可能性',
      icon: <TrendingUp size={18} />,
    },
    {
      name: '塌陷风险',
      level: collapseRisk,
      description: '纸张失去支撑导致塌陷的可能性',
      icon: <TrendingDown size={18} />,
    },
  ];

  const risks = customRisks || defaultRisks;

  const overallLevel: RiskLevel =
    risks.some((r) => r.level === '高')
      ? '高'
      : risks.some((r) => r.level === '中')
      ? '中'
      : '低';

  const overallStyle = getRiskStyle(overallLevel);

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
              overallStyle.bgColor,
              overallStyle.borderColor,
              overallStyle.textColor
            )}
          >
            {overallLevel === '低' ? '安全' : overallLevel === '中' ? '需关注' : '危险'}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          {risks.map((risk, index) => {
            const style = getRiskStyle(risk.level);
            const riskType = index === 0 ? 'warping' : 'collapse';
            return (
              <div
                key={index}
                className={cn(
                  'p-4 rounded-lg border transition-all duration-300',
                  style.bgColor,
                  style.borderColor
                )}
              >
                <div className="flex items-center gap-4">
                  <RiskLight level={risk.level} size="md" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {risk.icon && (
                        <span className={style.textColor}>{risk.icon}</span>
                      )}
                      <span className={cn('font-medium font-song', style.textColor)}>
                        {risk.name}
                      </span>
                      <span
                        className="ml-auto px-2 py-0.5 rounded text-xs font-medium"
                        style={{ backgroundColor: style.color + '20', color: style.color }}
                      >
                        {style.label}
                      </span>
                    </div>
                    <div className="text-xs text-ink-500">{risk.description}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 mt-3">
                  <div className="flex gap-1">
                    {(['低', '中', '高'] as RiskLevel[]).map((level, i) => {
                      const indicatorStyle = getRiskStyle(level);
                      return (
                        <div
                          key={i}
                          className={cn(
                            'w-8 h-1.5 rounded-full transition-all duration-300',
                            risk.level === level
                              ? 'scale-110'
                              : 'opacity-30'
                          )}
                          style={{
                            backgroundColor: indicatorStyle.color
                          }}
                        />
                      );
                    })}
                  </div>
                  <RiskBar level={risk.level} />
                </div>
                {showDetails && (
                  <div className="mt-4 pt-3 border-t border-paper-200/50">
                    <div className="text-xs text-ink-500 font-song mb-2">
                      <Info size={12} className="inline mr-1" />
                      修复建议
                    </div>
                    <ul className="space-y-1">
                      {getRiskSuggestion(risk.level, riskType as 'warping' | 'collapse').map((suggestion, i) => (
                        <li
                          key={i}
                          className="text-xs text-ink-600 flex items-start gap-2"
                        >
                          <span
                            className="w-1 h-1 rounded-full mt-1.5 flex-shrink-0"
                            style={{ backgroundColor: style.color }}
                          />
                          {suggestion}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="pt-4 border-t border-paper-200">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-ink-500 font-song">整体风险评估</span>
            <span className="text-sm text-ink-500 font-song">风险等级说明</span>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {(['低', '中', '高'] as RiskLevel[]).map((level) => {
              const style = getRiskStyle(level);
              const isActive = overallLevel === level;
              return (
                <div
                  key={level}
                  className={cn(
                    'p-3 rounded-lg border text-center transition-all duration-300',
                    isActive
                      ? `${style.bgColor} ${style.borderColor} ${style.textColor} border-2`
                      : 'bg-paper-50 border-paper-200 text-ink-400 opacity-60'
                  )}
                >
                  <div className="flex justify-center mb-2">
                    <RiskLight level={level} size="sm" />
                  </div>
                  <div className="font-song font-medium text-sm">{level}</div>
                  <div className="text-xs mt-0.5">
                    {level === '低' ? '可正常修复' : level === '中' ? '需采取预防措施' : '必须先处理'}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {overallLevel !== '低' && (
          <div
            className={cn(
              'p-4 rounded-lg border flex items-start gap-3',
              overallLevel === '高' ? 'bg-seal-50 border-seal-200' : 'bg-amber-50 border-amber-200'
            )}
          >
            <AlertTriangle
              size={20}
              className={overallLevel === '高' ? 'text-seal-600' : 'text-amber-600'}
            />
            <div>
              <p
                className={cn(
                  'font-medium',
                  overallLevel === '高' ? 'text-seal-700' : 'text-amber-700'
                )}
              >
                {overallLevel === '高'
                  ? '高风险警告'
                  : '注意事项'}
              </p>
              <p className="text-sm text-ink-600 mt-1">
                {overallLevel === '高'
                  ? '此修复方案存在较高风险，建议由经验丰富的修复师操作，或先进行小范围测试后再全面修复。'
                  : '修复过程中需注意控制环境温湿度，遵循建议操作步骤，确保修复质量。'}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RiskIndicator;
