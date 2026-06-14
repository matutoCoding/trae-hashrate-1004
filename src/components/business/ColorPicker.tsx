import React, { useState, useMemo, useCallback } from 'react';
import { RotateCcw, Pipette } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

interface LabColor {
  L: number;
  a: number;
  b: number;
}

interface ColorPickerProps {
  value?: Partial<LabColor>;
  onChange?: (color: LabColor) => void;
  title?: string;
  description?: string;
  className?: string;
  showPreview?: boolean;
  showSliders?: boolean;
  showInputs?: boolean;
  disabled?: boolean;
}

const DEFAULT_COLOR: LabColor = { L: 80, a: 5, b: 20 };

const labToRgb = (L: number, a: number, b: number): { r: number; g: number; b: number; hex: string } => {
  let y = (L + 16) / 116;
  let x = a / 500 + y;
  let z = y - b / 200;

  const y3 = Math.pow(y, 3);
  const x3 = Math.pow(x, 3);
  const z3 = Math.pow(z, 3);

  y = y3 > 0.008856 ? y3 : (y - 16 / 116) / 7.787;
  x = x3 > 0.008856 ? x3 : (x - 16 / 116) / 7.787;
  z = z3 > 0.008856 ? z3 : (z - 16 / 116) / 7.787;

  x *= 0.95047;
  y *= 1.00000;
  z *= 1.08883;

  let r = x * 3.2406 + y * -1.5372 + z * -0.4986;
  let g = x * -0.9689 + y * 1.8758 + z * 0.0415;
  let bVal = x * 0.0557 + y * -0.2040 + z * 1.0570;

  const gammaCorrect = (c: number): number => {
    return c > 0.0031308 ? 1.055 * Math.pow(c, 1 / 2.4) - 0.055 : 12.92 * c;
  };

  r = gammaCorrect(r);
  g = gammaCorrect(g);
  bVal = gammaCorrect(bVal);

  const clamp = (v: number) => Math.max(0, Math.min(1, v));
  const toHex = (v: number) => {
    const hex = Math.round(v * 255).toString(16).padStart(2, '0');
    return hex.toUpperCase();
  };

  return {
    r: Math.round(clamp(r) * 255),
    g: Math.round(clamp(g) * 255),
    b: Math.round(clamp(bVal) * 255),
    hex: `#${toHex(clamp(r))}${toHex(clamp(g))}${toHex(clamp(bVal))}`,
  };
};

const getColorName = (L: number, a: number, b: number): string => {
  const saturation = Math.sqrt(a * a + b * b);
  
  if (saturation < 8) {
    if (L > 85) return '亮白色';
    if (L > 70) return '米白色';
    if (L > 50) return '灰白色';
    if (L > 30) return '灰褐色';
    return '深灰色';
  }

  const hue = Math.atan2(b, a) * (180 / Math.PI);
  
  if (hue > -30 && hue <= 30) {
    if (L > 70) return '淡红色';
    if (L > 50) return '红色调';
    return '深红色';
  }
  if (hue > 30 && hue <= 90) {
    if (L > 70) return '淡黄色';
    if (L > 50) return '黄色调';
    return '黄褐色';
  }
  if (hue > 90 && hue <= 150) {
    if (L > 70) return '淡绿色';
    if (L > 50) return '绿色调';
    return '深绿色';
  }
  if (hue > 150 || hue <= -150) {
    if (L > 70) return '淡青色';
    if (L > 50) return '青色调';
    return '深青色';
  }
  if (hue > -150 && hue <= -90) {
    if (L > 70) return '淡蓝色';
    if (L > 50) return '蓝色调';
    return '深蓝色';
  }
  if (hue > -90 && hue <= -30) {
    if (L > 70) return '淡紫色';
    if (L > 50) return '紫色调';
    return '深紫色';
  }

  return '自定义色';
};

const SliderWithInput: React.FC<{
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit?: string;
  onChange: (value: number) => void;
  color: string;
  disabled?: boolean;
}> = ({ label, value, min, max, step, unit = '', onChange, color, disabled }) => {
  const [inputValue, setInputValue] = useState(value.toString());

  const handleSliderChange = (newValue: number) => {
    setInputValue(newValue.toString());
    onChange(newValue);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputValue(val);
    const num = parseFloat(val);
    if (!isNaN(num) && num >= min && num <= max) {
      onChange(Math.round(num * (1 / step)) / (1 / step));
    }
  };

  const handleInputBlur = () => {
    const num = parseFloat(inputValue);
    if (isNaN(num) || num < min) {
      setInputValue(min.toString());
      onChange(min);
    } else if (num > max) {
      setInputValue(max.toString());
      onChange(max);
    } else {
      const rounded = Math.round(num * (1 / step)) / (1 / step);
      setInputValue(rounded.toString());
      onChange(rounded);
    }
  };

  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label
          className="text-sm font-medium"
          style={{ color }}
        >
          {label}
        </label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={inputValue}
            onChange={handleInputChange}
            onBlur={handleInputBlur}
            min={min}
            max={max}
            step={step}
            disabled={disabled}
            className={cn(
              'w-20 px-2 py-1 text-right text-sm font-mono rounded-lg border',
              'bg-paper-50 border-paper-300 text-ink-700',
              'focus:outline-none focus:border-azure-400 focus:ring-1 focus:ring-azure-400',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          />
          <span className="text-sm text-ink-400 w-4">{unit}</span>
        </div>
      </div>
      <div className="relative">
        <div
          className="absolute left-0 top-1/2 -translate-y-1/2 h-2 rounded-lg pointer-events-none"
          style={{
            width: `${percentage}%`,
            backgroundColor: color,
            opacity: 0.3,
          }}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => handleSliderChange(parseFloat(e.target.value))}
          disabled={disabled}
          className="relative w-full h-2 bg-paper-200 rounded-lg appearance-none cursor-pointer z-10 disabled:opacity-50 disabled:cursor-not-allowed"
        />
      </div>
      <div className="flex justify-between">
        <span className="text-xs text-ink-400 font-mono">{min}</span>
        <span className="text-xs text-ink-400 font-mono">{max}</span>
      </div>
    </div>
  );
};

export const ColorPicker: React.FC<ColorPickerProps> = ({
  value,
  onChange,
  title,
  description,
  className,
  showPreview = true,
  showSliders = true,
  showInputs = true,
  disabled = false,
}) => {
  const [internalColor, setInternalColor] = useState<LabColor>({
    ...DEFAULT_COLOR,
    ...value,
  });

  const color = useMemo(
    () => ({ ...DEFAULT_COLOR, ...value, ...internalColor }),
    [value, internalColor]
  );

  const rgb = useMemo(() => labToRgb(color.L, color.a, color.b), [color.L, color.a, color.b]);
  const colorName = useMemo(() => getColorName(color.L, color.a, color.b), [color.L, color.a, color.b]);

  const handleChange = useCallback(
    (key: keyof LabColor, newValue: number) => {
      const newColor = { ...color, [key]: newValue };
      setInternalColor(newColor);
      onChange?.(newColor);
    },
    [color, onChange]
  );

  const handleReset = () => {
    setInternalColor(DEFAULT_COLOR);
    onChange?.(DEFAULT_COLOR);
  };

  const handleRandomize = () => {
    const newColor: LabColor = {
      L: Math.round(30 + Math.random() * 60),
      a: Math.round(-50 + Math.random() * 100),
      b: Math.round(-50 + Math.random() * 100),
    };
    setInternalColor(newColor);
    onChange?.(newColor);
  };

  return (
    <Card className={cn('', className)}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            {title && <CardTitle>{title}</CardTitle>}
            {description && <CardDescription>{description}</CardDescription>}
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRandomize}
              disabled={disabled}
              className="h-8"
            >
              <Pipette size={14} className="mr-1" />
              随机
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReset}
              disabled={disabled}
              className="h-8"
            >
              <RotateCcw size={14} className="mr-1" />
              重置
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {showPreview && (
          <div className="flex items-center gap-6 p-4 bg-paper-100 rounded-lg border border-paper-200">
            <div className="relative">
              <div
                className="w-28 h-28 rounded-lg border-2 border-paper-300 shadow-inner"
                style={{ backgroundColor: rgb.hex }}
              />
              <div
                className="absolute -bottom-2 -right-2 px-2 py-0.5 rounded-full text-xs font-medium border-2 border-paper-50 shadow"
                style={{ backgroundColor: rgb.hex, color: color.L > 50 ? '#2C1810' : '#FBF8F0' }}
              >
                {colorName}
              </div>
            </div>
            <div className="flex-1 space-y-3">
              <div>
                <div className="text-xs text-ink-400 font-song mb-1">Lab 数值</div>
                <div className="flex gap-4">
                  <div className="font-mono text-lg font-bold" style={{ color: '#DC6F5E' }}>
                    L* {color.L.toFixed(1)}
                  </div>
                  <div className="font-mono text-lg font-bold" style={{ color: '#6B8E23' }}>
                    a* {color.a.toFixed(1)}
                  </div>
                  <div className="font-mono text-lg font-bold" style={{ color: '#D4A017' }}>
                    b* {color.b.toFixed(1)}
                  </div>
                </div>
              </div>
              <div className="h-px bg-paper-200" />
              <div>
                <div className="text-xs text-ink-400 font-song mb-1">RGB / Hex</div>
                <div className="flex gap-4">
                  <div className="font-mono text-sm text-ink-600">
                    ({rgb.r}, {rgb.g}, {rgb.b})
                  </div>
                  <div className="font-mono text-sm text-ink-700 font-medium">
                    {rgb.hex}
                  </div>
                </div>
              </div>
              <div>
                <div className="text-xs text-ink-400 font-song mb-1">色彩属性</div>
                <div className="flex gap-4 text-xs">
                  <span className="text-ink-500">
                    亮度: <span className="font-medium text-ink-700">{color.L > 60 ? '明亮' : color.L > 40 ? '适中' : '较暗'}</span>
                  </span>
                  <span className="text-ink-500">
                    饱和度: <span className="font-medium text-ink-700">{Math.sqrt(color.a * color.a + color.b * color.b) > 30 ? '鲜艳' : '柔和'}</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {showSliders && (
          <div className="space-y-5">
            <SliderWithInput
              label="L* (明度)"
              value={color.L}
              min={0}
              max={100}
              step={0.1}
              onChange={(v) => handleChange('L', v)}
              color="#DC6F5E"
              disabled={disabled}
            />
            <SliderWithInput
              label="a* (红/绿色度)"
              value={color.a}
              min={-128}
              max={127}
              step={0.1}
              onChange={(v) => handleChange('a', v)}
              color="#6B8E23"
              disabled={disabled}
            />
            <SliderWithInput
              label="b* (黄/蓝色度)"
              value={color.b}
              min={-128}
              max={127}
              step={0.1}
              onChange={(v) => handleChange('b', v)}
              color="#D4A017"
              disabled={disabled}
            />
          </div>
        )}

        <div className="pt-4 border-t border-paper-200">
          <div className="text-xs text-ink-400 font-song mb-3">Lab 色彩空间说明</div>
          <div className="grid grid-cols-3 gap-3 text-xs">
            <div className="p-2 bg-paper-100 rounded-lg">
              <div className="font-medium text-ink-600 mb-1">L* 通道</div>
              <div className="text-ink-400">0 = 纯黑，100 = 纯白</div>
            </div>
            <div className="p-2 bg-paper-100 rounded-lg">
              <div className="font-medium text-ink-600 mb-1">a* 通道</div>
              <div className="text-ink-400">负值绿，正值红</div>
            </div>
            <div className="p-2 bg-paper-100 rounded-lg">
              <div className="font-medium text-ink-600 mb-1">b* 通道</div>
              <div className="text-ink-400">负值蓝，正值黄</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ColorPicker;
