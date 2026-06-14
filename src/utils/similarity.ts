import type { BookPage, MatchResult, MatchWeights, PaperStock } from '../types';

/**
 * 计算CIE76色差（欧几里得距离）
 * @param L1 - 第一个颜色的L分量
 * @param a1 - 第一个颜色的a分量
 * @param b1 - 第一个颜色的b分量
 * @param L2 - 第二个颜色的L分量
 * @param a2 - 第二个颜色的a分量
 * @param b2 - 第二个颜色的b分量
 * @returns 色差距离值，值越小颜色越接近
 */
export function calculateColorDistance(
  L1: number,
  a1: number,
  b1: number,
  L2: number,
  a2: number,
  b2: number
): number {
  const dL = L2 - L1;
  const da = a2 - a1;
  const db = b2 - b1;
  return Math.sqrt(dL * dL + da * da + db * db);
}

/**
 * 计算帘纹间距相似度评分
 * @param spacing1 - 第一个帘纹间距
 * @param spacing2 - 第二个帘纹间距
 * @returns 相似度评分 0-100
 */
export function calculateCurtainPatternScore(
  spacing1: number,
  spacing2: number
): number {
  if (spacing1 <= 0 || spacing2 <= 0) {
    return 0;
  }
  const diff = Math.abs(spacing1 - spacing2);
  const maxDiff = Math.max(spacing1, spacing2) * 0.5;
  const normalizedDiff = Math.min(diff / maxDiff, 1);
  return Math.round((1 - normalizedDiff) * 100);
}

/**
 * 计算纤维成分相似度评分
 * @param fiber1 - 第一个纤维成分描述
 * @param fiber2 - 第二个纤维成分描述
 * @returns 相似度评分 0-100
 */
export function calculateFiberScore(fiber1: string, fiber2: string): number {
  if (!fiber1 || !fiber2) {
    return 0;
  }

  const f1 = fiber1.toLowerCase();
  const f2 = fiber2.toLowerCase();

  if (f1 === f2) {
    return 100;
  }

  const keywords1 = f1.split(/[、,，\s]+/).filter((k) => k.length > 0);
  const keywords2 = f2.split(/[、,，\s]+/).filter((k) => k.length > 0);

  if (keywords1.length === 0 || keywords2.length === 0) {
    return 30;
  }

  let matchCount = 0;
  for (const kw1 of keywords1) {
    for (const kw2 of keywords2) {
      if (kw1 === kw2 || kw1.includes(kw2) || kw2.includes(kw1)) {
        matchCount++;
        break;
      }
    }
  }

  const maxKeywords = Math.max(keywords1.length, keywords2.length);
  const baseScore = (matchCount / maxKeywords) * 70;

  const containsSimilar =
    (f1.includes('檀') && f2.includes('檀')) ||
    (f1.includes('楮') && f2.includes('楮')) ||
    (f1.includes('桑') && f2.includes('桑')) ||
    (f1.includes('竹') && f2.includes('竹')) ||
    (f1.includes('麻') && f2.includes('麻')) ||
    (f1.includes('棉') && f2.includes('棉'));

  const bonusScore = containsSimilar ? 30 : 10;

  return Math.min(Math.round(baseScore + bonusScore), 100);
}

/**
 * 计算厚度相似度评分
 * @param th1 - 第一个厚度值（mm）
 * @param th2 - 第二个厚度值（mm）
 * @returns 相似度评分 0-100
 */
export function calculateThicknessScore(th1: number, th2: number): number {
  if (th1 <= 0 || th2 <= 0) {
    return 0;
  }
  const diff = Math.abs(th1 - th2);
  const maxDiff = Math.max(th1, th2) * 0.6;
  const normalizedDiff = Math.min(diff / maxDiff, 1);
  return Math.round((1 - normalizedDiff) * 100);
}

/**
 * 计算pH值相似度评分
 * @param pH1 - 第一个pH值
 * @param pH2 - 第二个pH值
 * @returns 相似度评分 0-100
 */
export function calculatePHScore(pH1: number, pH2: number): number {
  const diff = Math.abs(pH1 - pH2);
  const maxDiff = 3;
  const normalizedDiff = Math.min(diff / maxDiff, 1);
  return Math.round((1 - normalizedDiff) * 100);
}

/**
 * 计算颜色相似度评分（基于CIE76色差）
 * @param L1 - 第一个颜色的L分量
 * @param a1 - 第一个颜色的a分量
 * @param b1 - 第一个颜色的b分量
 * @param L2 - 第二个颜色的L分量
 * @param a2 - 第二个颜色的a分量
 * @param b2 - 第二个颜色的b分量
 * @returns 颜色相似度评分 0-100
 */
export function calculateColorScore(
  L1: number,
  a1: number,
  b1: number,
  L2: number,
  a2: number,
  b2: number
): number {
  const distance = calculateColorDistance(L1, a1, b1, L2, a2, b2);
  const maxDistance = 100;
  const normalizedDistance = Math.min(distance / maxDistance, 1);
  return Math.round((1 - normalizedDistance) * 100);
}

/**
 * 默认匹配权重配置
 */
export const DEFAULT_MATCH_WEIGHTS: MatchWeights = {
  curtainPattern: 0.2,
  fiber: 0.25,
  thickness: 0.15,
  color: 0.25,
  ph: 0.15,
};

/**
 * 计算书页与补纸的综合匹配度
 * @param page - 书页数据
 * @param paper - 补纸库存数据
 * @param weights - 匹配权重配置，默认使用 DEFAULT_MATCH_WEIGHTS
 * @returns 匹配结果对象，包含各项得分和综合得分
 */
export function calculateOverallMatch(
  page: BookPage,
  paper: PaperStock,
  weights: MatchWeights = DEFAULT_MATCH_WEIGHTS
): MatchResult {
  const curtainPatternScore = calculateCurtainPatternScore(
    page.curtainPatternSpacing,
    paper.curtainPatternSpacing
  );

  const fiberScore = calculateFiberScore(
    page.fiberComposition,
    paper.fiberComposition
  );

  const thicknessScore = calculateThicknessScore(
    page.thickness,
    paper.thickness
  );

  const colorScore = calculateColorScore(
    page.colorL,
    page.colorA,
    page.colorB,
    paper.colorL,
    paper.colorA,
    paper.colorB
  );

  const phScore = calculatePHScore(page.pHValue, paper.pHValue);

  const overallScore = Math.round(
    curtainPatternScore * weights.curtainPattern +
      fiberScore * weights.fiber +
      thicknessScore * weights.thickness +
      colorScore * weights.color +
      phScore * weights.ph
  );

  return {
    paperId: paper.id,
    overallScore,
    curtainPatternScore,
    fiberScore,
    thicknessScore,
    colorScore,
    phScore,
  };
}

/**
 * 批量计算书页与多张补纸的匹配度并按得分排序
 * @param page - 书页数据
 * @param papers - 补纸库存数组
 * @param weights - 匹配权重配置
 * @param minScore - 最低匹配分数过滤，默认60
 * @returns 按综合得分降序排列的匹配结果数组
 */
export function calculateBatchMatches(
  page: BookPage,
  papers: PaperStock[],
  weights: MatchWeights = DEFAULT_MATCH_WEIGHTS,
  minScore: number = 60
): MatchResult[] {
  return papers
    .map((paper) => calculateOverallMatch(page, paper, weights))
    .filter((result) => result.overallScore >= minScore)
    .sort((a, b) => b.overallScore - a.overallScore);
}
