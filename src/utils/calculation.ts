import type {
  PHCompatibilityResult,
  Point,
  RiskLevel,
  TwistDirection,
} from '../types';

/**
 * 计算搭口宽度
 * 根据破损区域面积计算修复时所需的搭口宽度
 * @param area - 破损区域面积 (cm²)
 * @returns 搭口宽度 (mm)
 */
export function calculateLapWidth(area: number): number {
  if (area <= 0) return 0;

  const sqrtArea = Math.sqrt(area);

  if (sqrtArea < 2) {
    return 2;
  }
  if (sqrtArea < 5) {
    return 3;
  }
  if (sqrtArea < 10) {
    return 4;
  }
  if (sqrtArea < 15) {
    return 5;
  }
  return 6;
}

/**
 * 计算下捻方向
 * 根据破损区域和位置确定下捻方向
 * @param area - 破损区域面积
 * @param position - 破损区域在页面中的位置索引 (0-3 分别代表左上、右上、左下、右下)
 * @returns 下捻方向
 */
export function calculateTwistDirection(
  area: number,
  position: number
): TwistDirection {
  const normalizedPosition = ((position % 4) + 4) % 4;

  if (area > 50) {
    return normalizedPosition < 2 ? '顺时针' : '逆时针';
  }

  return normalizedPosition % 2 === 0 ? '顺时针' : '逆时针';
}

/**
 * 检查酸碱度相容性
 * @param pH1 - 第一个pH值
 * @param pH2 - 第二个pH值
 * @returns 相容性评估结果
 */
export function checkPHCompatibility(
  pH1: number,
  pH2: number
): PHCompatibilityResult {
  const diff = Math.abs(pH1 - pH2);
  const avgPH = (pH1 + pH2) / 2;
  const isAcidic = avgPH < 6.5;

  let level: PHCompatibilityResult['level'];
  let warning: string;

  if (diff < 0.3) {
    level = '优秀';
    warning = '酸碱度非常匹配，可以安全使用';
  } else if (diff < 0.6) {
    level = '良好';
    warning = '酸碱度匹配度较好，适合使用';
  } else if (diff < 1.0) {
    level = '一般';
    warning = '酸碱度有一定差异，建议谨慎使用';
  } else if (diff < 1.5) {
    level = '较差';
    warning = '酸碱度差异较大，可能影响纸张寿命';
  } else {
    level = '危险';
    warning = '酸碱度差异过大，严禁使用，可能造成严重损害';
  }

  if (isAcidic && level !== '危险') {
    warning += '。注意：纸张偏酸性，建议进行脱酸处理';
  }

  if (avgPH > 9.5 && level !== '危险') {
    warning += '。注意：纸张偏强碱性，可能加速纤维素降解';
  }

  return {
    level,
    diff: Number(diff.toFixed(2)),
    isAcidic,
    warning,
  };
}

/**
 * 预测翘曲风险
 * @param pageThickness - 书页厚度 (mm)
 * @param paperThickness - 补纸厚度 (mm)
 * @param fiberDiff - 纤维成分相似度差异 (0-100)
 * @param colorDiff - 颜色差异值
 * @returns 翘曲风险等级
 */
export function predictWarpingRisk(
  pageThickness: number,
  paperThickness: number,
  fiberDiff: number,
  colorDiff: number
): RiskLevel {
  const thicknessRatio = Math.max(pageThickness, paperThickness) / Math.min(pageThickness, paperThickness);
  const thicknessPenalty = thicknessRatio > 1.5 ? 2 : thicknessRatio > 1.2 ? 1 : 0;
  const fiberPenalty = fiberDiff < 60 ? 2 : fiberDiff < 80 ? 1 : 0;
  const colorPenalty = colorDiff > 30 ? 1 : 0;

  const totalScore = thicknessPenalty + fiberPenalty + colorPenalty;

  if (totalScore >= 4) return '高';
  if (totalScore >= 2) return '中';
  return '低';
}

/**
 * 预测塌陷风险
 * @param pageThickness - 书页厚度 (mm)
 * @param paperThickness - 补纸厚度 (mm)
 * @returns 塌陷风险等级
 */
export function predictCollapseRisk(
  pageThickness: number,
  paperThickness: number
): RiskLevel {
  if (pageThickness <= 0 || paperThickness <= 0) {
    return '高';
  }

  const ratio = paperThickness / pageThickness;

  if (ratio < 0.4) {
    return '高';
  }
  if (ratio < 0.6) {
    return '中';
  }
  if (ratio > 1.6) {
    return '中';
  }
  return '低';
}

/**
 * 使用鞋带公式计算多边形面积
 * @param points - 多边形顶点坐标数组
 * @param scale - 坐标缩放比例，默认为1（像素到厘米的转换比例）
 * @returns 多边形面积 (根据scale参数确定单位)
 */
export function calculatePolygonArea(points: Point[], scale: number = 1): number {
  if (points.length < 3) {
    return 0;
  }

  let area = 0;
  const n = points.length;

  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    area += points[i].x * points[j].y;
    area -= points[j].x * points[i].y;
  }

  area = Math.abs(area) / 2;

  return Number((area * scale * scale).toFixed(4));
}

/**
 * 计算多边形的中心点
 * @param points - 多边形顶点坐标数组
 * @returns 中心点坐标
 */
export function calculatePolygonCenter(points: Point[]): Point {
  if (points.length === 0) {
    return { x: 0, y: 0 };
  }

  let sumX = 0;
  let sumY = 0;

  for (const point of points) {
    sumX += point.x;
    sumY += point.y;
  }

  return {
    x: sumX / points.length,
    y: sumY / points.length,
  };
}

/**
 * 计算纸张面积利用率
 * @param damageArea - 破损区域总面积
 * @param patchArea - 补纸使用面积
 * @returns 利用率百分比 (0-100)
 */
export function calculatePaperUtilization(
  damageArea: number,
  patchArea: number
): number {
  if (patchArea <= 0) return 0;
  const utilization = (damageArea / patchArea) * 100;
  return Math.min(Math.round(utilization), 100);
}

/**
 * 估算修复所需补纸面积
 * @param damageArea - 破损区域面积
 * @param lapWidth - 搭口宽度 (mm)
 * @returns 估算的补纸面积 (cm²)
 */
export function estimatePatchPaperArea(
  damageArea: number,
  lapWidth: number
): number {
  if (damageArea <= 0) return 0;

  const sqrtArea = Math.sqrt(damageArea);
  const lapInCm = lapWidth / 10;
  const sideLength = sqrtArea + lapInCm * 2;

  return Number((sideLength * sideLength).toFixed(2));
}

/**
 * 计算修复平整度评分
 * @param beforeThickness - 修复前厚度
 * @param afterThickness - 修复后厚度
 * @param targetThickness - 目标厚度
 * @returns 平整度评分 (0-100)
 */
export function calculateFlatnessScore(
  beforeThickness: number,
  afterThickness: number,
  targetThickness: number
): number {
  if (targetThickness <= 0) return 0;

  const beforeDiff = Math.abs(beforeThickness - targetThickness);
  const afterDiff = Math.abs(afterThickness - targetThickness);

  const improvement = beforeDiff - afterDiff;
  const maxPossibleImprovement = beforeDiff;

  if (maxPossibleImprovement <= 0) {
    return afterDiff < targetThickness * 0.1 ? 100 : 80;
  }

  const improvementRatio = Math.max(improvement / maxPossibleImprovement, 0);
  const baseScore = improvementRatio * 60;

  const thicknessAccuracy = 1 - Math.min(afterDiff / targetThickness, 1);
  const accuracyScore = thicknessAccuracy * 40;

  return Math.round(baseScore + accuracyScore);
}

/**
 * 获取风险等级对应的颜色
 * @param risk - 风险等级
 * @returns 颜色HEX字符串
 */
export function getRiskColor(risk: RiskLevel): string {
  switch (risk) {
    case '低':
      return '#10B981';
    case '中':
      return '#F59E0B';
    case '高':
      return '#EF4444';
    default:
      return '#6B7280';
  }
}

/**
 * 获取相容性等级对应的颜色
 * @param level - 相容性等级
 * @returns 颜色HEX字符串
 */
export function getCompatibilityColor(
  level: PHCompatibilityResult['level']
): string {
  switch (level) {
    case '优秀':
      return '#10B981';
    case '良好':
      return '#3B82F6';
    case '一般':
      return '#F59E0B';
    case '较差':
      return '#F97316';
    case '危险':
      return '#EF4444';
    default:
      return '#6B7280';
  }
}
