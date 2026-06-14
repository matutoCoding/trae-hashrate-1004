/**
 * 朝代类型
 */
export type Dynasty = '唐' | '宋' | '元' | '明' | '清' | '现代';

/**
 * 纸张类型
 */
export type PaperType = '宣纸' | '皮纸' | '竹纸' | '棉纸' | '麻纸';

/**
 * 纸张子类型
 */
export type PaperSubType =
  | '净皮'
  | '棉料'
  | '特净'
  | '红星'
  | '汪六吉'
  | '普通'
  | '上品';

/**
 * 损坏类型
 */
export type DamageType =
  | '虫蛀'
  | '霉蚀'
  | '撕裂'
  | '缺角'
  | '酸化'
  | '折痕'
  | '磨损'
  | '水渍';

/**
 * 书页状态
 */
export type PageStatus =
  | '待检测'
  | '已检测'
  | '待修复'
  | '修复中'
  | '已修复'
  | '已归档';

/**
 * 下捻方向
 */
export type TwistDirection = '顺时针' | '逆时针';

/**
 * 风险等级
 */
export type RiskLevel = '低' | '中' | '高';

/**
 * 相容性等级
 */
export type CompatibilityLevel = '优秀' | '良好' | '一般' | '较差' | '危险';

/**
 * 多边形点坐标
 */
export interface Point {
  x: number;
  y: number;
}

/**
 * 古籍书目
 */
export interface Book {
  id: string;
  name: string;
  dynasty: Dynasty;
  author: string;
  totalVolumes: number;
  description: string;
  createdAt: string;
}

/**
 * 古籍书页
 */
export interface BookPage {
  id: string;
  bookId: string;
  volumeNumber: number;
  pageNumber: number;
  curtainPatternSpacing: number;
  fiberComposition: string;
  thickness: number;
  colorL: number;
  colorA: number;
  colorB: number;
  pHValue: number;
  frontImage: string;
  backImage: string;
  status: PageStatus;
  createdAt: string;
}

/**
 * 损坏区域
 */
export interface DamageArea {
  id: string;
  pageId: string;
  type: DamageType;
  polygonPoints: Point[];
  area: number;
  lapWidth: number;
  twistDirection: TwistDirection;
  patchPaperId: string | null;
  notes: string;
}

/**
 * 补纸分类
 */
export interface PaperCategory {
  id: string;
  dynasty: Dynasty;
  paperType: PaperType;
  subType: PaperSubType;
  description: string;
}

/**
 * 补纸库存
 */
export interface PaperStock {
  id: string;
  categoryId: string;
  batchNumber: string;
  curtainPatternSpacing: number;
  fiberComposition: string;
  thickness: number;
  colorL: number;
  colorA: number;
  colorB: number;
  pHValue: number;
  stockQuantity: number;
  unit: string;
  storageLocation: string;
  purchaseDate: string;
  supplier: string;
  notes: string;
}

/**
 * 匹配结果
 */
export interface MatchResult {
  paperId: string;
  overallScore: number;
  curtainPatternScore: number;
  fiberScore: number;
  thicknessScore: number;
  colorScore: number;
  phScore: number;
}

/**
 * 修复记录
 */
export interface RestorationRecord {
  id: string;
  pageId: string;
  paperId: string;
  restorationDate: string;
  restorer: string;
  paperUsed: number;
  beforeImage: string;
  afterImage: string;
  flatnessScore: number;
  warpingRisk: RiskLevel;
  collapseRisk: RiskLevel;
  notes: string;
  createdAt: string;
}

/**
 * 匹配权重配置
 */
export interface MatchWeights {
  curtainPattern: number;
  fiber: number;
  thickness: number;
  color: number;
  ph: number;
}

/**
 * 酸碱度相容性评估结果
 */
export interface PHCompatibilityResult {
  level: CompatibilityLevel;
  diff: number;
  isAcidic: boolean;
  warning: string;
}

/**
 * 存储键名
 */
export const STORAGE_KEYS = {
  BOOKS: 'ancient_books',
  PAGES: 'book_pages',
  DAMAGE_AREAS: 'damage_areas',
  PAPER_CATEGORIES: 'paper_categories',
  PAPER_STOCK: 'paper_stock',
  RESTORATION_RECORDS: 'restoration_records',
} as const;

/**
 * 存储键类型
 */
export type StorageKey = typeof STORAGE_KEYS[keyof typeof STORAGE_KEYS];

/**
 * 完整数据导出类型
 */
export interface ExportData {
  books: Book[];
  pages: BookPage[];
  damageAreas: DamageArea[];
  paperCategories: PaperCategory[];
  paperStock: PaperStock[];
  restorationRecords: RestorationRecord[];
  exportedAt: string;
  version: string;
}
