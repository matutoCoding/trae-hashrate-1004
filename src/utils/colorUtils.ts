/**
 * Lab颜色空间转RGB颜色空间
 * 使用标准D65白点作为参考白点
 * @param L - 亮度分量 (0-100)
 * @param a - 绿-红轴分量 (-128~127)
 * @param b - 蓝-黄轴分量 (-128~127)
 * @returns RGB颜色对象 {r, g, b}，值范围 0-255
 */
export function labToRgb(
  L: number,
  a: number,
  b: number
): { r: number; g: number; b: number } {
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
  y *= 1.0;
  z *= 1.08883;

  let r = x * 3.2406 + y * -1.5372 + z * -0.4986;
  let g = x * -0.9689 + y * 1.8758 + z * 0.0415;
  let bl = x * 0.0557 + y * -0.204 + z * 1.057;

  r = r > 0.0031308 ? 1.055 * Math.pow(r, 1 / 2.4) - 0.055 : 12.92 * r;
  g = g > 0.0031308 ? 1.055 * Math.pow(g, 1 / 2.4) - 0.055 : 12.92 * g;
  bl = bl > 0.0031308 ? 1.055 * Math.pow(bl, 1 / 2.4) - 0.055 : 12.92 * bl;

  r = Math.min(Math.max(Math.round(r * 255), 0), 255);
  g = Math.min(Math.max(Math.round(g * 255), 0), 255);
  bl = Math.min(Math.max(Math.round(bl * 255), 0), 255);

  return { r, g, b: bl };
}

/**
 * RGB颜色转HEX十六进制字符串
 * @param r - 红色分量 (0-255)
 * @param g - 绿色分量 (0-255)
 * @param b - 蓝色分量 (0-255)
 * @returns HEX颜色字符串，格式如 "#FF0000"
 */
export function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (value: number): number => Math.min(Math.max(Math.round(value), 0), 255);

  const hr = clamp(r).toString(16).padStart(2, '0');
  const hg = clamp(g).toString(16).padStart(2, '0');
  const hb = clamp(b).toString(16).padStart(2, '0');

  return `#${hr}${hg}${hb}`.toUpperCase();
}

/**
 * 获取Lab颜色的预览HEX字符串
 * @param L - 亮度分量 (0-100)
 * @param a - 绿-红轴分量 (-128~127)
 * @param b - 蓝-黄轴分量 (-128~127)
 * @returns HEX颜色字符串
 */
export function getColorPreview(L: number, a: number, b: number): string {
  const rgb = labToRgb(L, a, b);
  return rgbToHex(rgb.r, rgb.g, rgb.b);
}

/**
 * HEX颜色字符串转RGB
 * @param hex - HEX颜色字符串，支持 "#FF0000" 或 "FF0000" 格式
 * @returns RGB颜色对象
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

/**
 * RGB转Lab颜色空间
 * @param r - 红色分量 (0-255)
 * @param g - 绿色分量 (0-255)
 * @param b - 蓝色分量 (0-255)
 * @returns Lab颜色对象
 */
export function rgbToLab(
  r: number,
  g: number,
  b: number
): { L: number; a: number; b: number } {
  let rn = r / 255;
  let gn = g / 255;
  let bn = b / 255;

  rn = rn > 0.04045 ? Math.pow((rn + 0.055) / 1.055, 2.4) : rn / 12.92;
  gn = gn > 0.04045 ? Math.pow((gn + 0.055) / 1.055, 2.4) : gn / 12.92;
  bn = bn > 0.04045 ? Math.pow((bn + 0.055) / 1.055, 2.4) : bn / 12.92;

  rn *= 100;
  gn *= 100;
  bn *= 100;

  let x = rn * 0.4124 + gn * 0.3576 + bn * 0.1805;
  let y = rn * 0.2126 + gn * 0.7152 + bn * 0.0722;
  let z = rn * 0.0193 + gn * 0.1192 + bn * 0.9505;

  x /= 95.047;
  y /= 100.0;
  z /= 108.883;

  const f = (t: number): number =>
    t > 0.008856 ? Math.pow(t, 1 / 3) : 7.787 * t + 16 / 116;

  const fx = f(x);
  const fy = f(y);
  const fz = f(z);

  const L = 116 * fy - 16;
  const aLab = 500 * (fx - fy);
  const bLab = 200 * (fy - fz);

  return { L, a: aLab, b: bLab };
}

/**
 * 获取颜色的名称描述（基于粗略的Lab值判断）
 * @param L - 亮度分量
 * @param a - 绿-红轴分量
 * @param b - 蓝-黄轴分量
 * @returns 颜色名称描述
 */
export function getColorName(L: number, a: number, b: number): string {
  if (L < 20) return '深褐色';
  if (L > 90) return '白色';

  const saturation = Math.sqrt(a * a + b * b);

  if (saturation < 10) {
    if (L > 80) return '白色';
    if (L > 60) return '浅灰色';
    if (L > 40) return '灰色';
    return '深灰色';
  }

  const hue = Math.atan2(b, a) * (180 / Math.PI);

  if (hue >= -10 && hue < 40) {
    if (L > 70) return '米黄色';
    if (L > 50) return '黄褐色';
    return '深褐色';
  }
  if (hue >= 40 && hue < 80) {
    if (L > 70) return '淡黄色';
    if (L > 50) return '黄色';
    return '暗黄色';
  }
  if (hue >= 80 && hue < 160) {
    if (L > 70) return '嫩绿色';
    if (L > 50) return '绿色';
    return '深绿色';
  }
  if (hue >= 160 || hue < -100) {
    if (L > 70) return '淡蓝色';
    if (L > 50) return '蓝色';
    return '深蓝色';
  }
  if (hue >= -100 && hue < -10) {
    if (L > 70) return '淡红色';
    if (L > 50) return '红色';
    return '深红色';
  }

  return '未知色';
}

/**
 * 生成颜色渐变数组
 * @param startL - 起始L值
 * @param startA - 起始a值
 * @param startB - 起始b值
 * @param endL - 结束L值
 * @param endA - 结束a值
 * @param endB - 结束b值
 * @param steps - 渐变步数
 * @returns HEX颜色数组
 */
export function generateColorGradient(
  startL: number,
  startA: number,
  startB: number,
  endL: number,
  endA: number,
  endB: number,
  steps: number
): string[] {
  const result: string[] = [];
  for (let i = 0; i < steps; i++) {
    const t = i / (steps - 1);
    const L = startL + (endL - startL) * t;
    const a = startA + (endA - startA) * t;
    const b = startB + (endB - startB) * t;
    result.push(getColorPreview(L, a, b));
  }
  return result;
}
