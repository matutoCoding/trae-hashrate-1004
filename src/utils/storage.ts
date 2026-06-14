import type {
  Book,
  BookPage,
  DamageArea,
  ExportData,
  PaperCategory,
  PaperStock,
  RestorationRecord,
  StorageKey,
} from '../types';

/**
 * 存储键名常量
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
 * 当前数据版本号
 */
export const DATA_VERSION = '1.0.0';

/**
 * 检测浏览器环境是否支持localStorage
 * @returns 是否支持localStorage
 */
function isLocalStorageAvailable(): boolean {
  try {
    const testKey = '__storage_test__';
    localStorage.setItem(testKey, testKey);
    localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

/**
 * 保存数据到localStorage
 * @param key - 存储键名
 * @param data - 要保存的数据
 * @returns 是否保存成功
 */
export function saveToStorage<T>(key: StorageKey, data: T): boolean {
  if (!isLocalStorageAvailable()) {
    console.warn('localStorage 不可用');
    return false;
  }

  try {
    const serializedData = JSON.stringify(data);
    localStorage.setItem(key, serializedData);
    return true;
  } catch (e) {
    console.error(`保存数据到 localStorage 失败 [${key}]:`, e);
    return false;
  }
}

/**
 * 从localStorage加载数据
 * @param key - 存储键名
 * @param defaultValue - 默认值，当数据不存在时返回
 * @returns 解析后的数据或默认值
 */
export function loadFromStorage<T>(key: StorageKey, defaultValue?: T): T | null {
  if (!isLocalStorageAvailable()) {
    console.warn('localStorage 不可用');
    return defaultValue ?? null;
  }

  try {
    const serializedData = localStorage.getItem(key);
    if (serializedData === null) {
      return defaultValue ?? null;
    }
    return JSON.parse(serializedData) as T;
  } catch (e) {
    console.error(`从 localStorage 加载数据失败 [${key}]:`, e);
    return defaultValue ?? null;
  }
}

/**
 * 从localStorage删除数据
 * @param key - 存储键名
 * @returns 是否删除成功
 */
export function removeFromStorage(key: StorageKey): boolean {
  if (!isLocalStorageAvailable()) {
    console.warn('localStorage 不可用');
    return false;
  }

  try {
    localStorage.removeItem(key);
    return true;
  } catch (e) {
    console.error(`从 localStorage 删除数据失败 [${key}]:`, e);
    return false;
  }
}

/**
 * 清空所有相关数据
 * @returns 是否清空成功
 */
export function clearAllStorage(): boolean {
  if (!isLocalStorageAvailable()) {
    console.warn('localStorage 不可用');
    return false;
  }

  try {
    Object.values(STORAGE_KEYS).forEach((key) => {
      localStorage.removeItem(key);
    });
    return true;
  } catch (e) {
    console.error('清空 localStorage 数据失败:', e);
    return false;
  }
}

/**
 * 导出所有数据
 * @returns 完整的导出数据对象
 */
export function exportAllData(): ExportData {
  const books = loadFromStorage<Book[]>(STORAGE_KEYS.BOOKS, []) ?? [];
  const pages = loadFromStorage<BookPage[]>(STORAGE_KEYS.PAGES, []) ?? [];
  const damageAreas = loadFromStorage<DamageArea[]>(STORAGE_KEYS.DAMAGE_AREAS, []) ?? [];
  const paperCategories = loadFromStorage<PaperCategory[]>(STORAGE_KEYS.PAPER_CATEGORIES, []) ?? [];
  const paperStock = loadFromStorage<PaperStock[]>(STORAGE_KEYS.PAPER_STOCK, []) ?? [];
  const restorationRecords = loadFromStorage<RestorationRecord[]>(STORAGE_KEYS.RESTORATION_RECORDS, []) ?? [];

  return {
    books,
    pages,
    damageAreas,
    paperCategories,
    paperStock,
    restorationRecords,
    exportedAt: new Date().toISOString(),
    version: DATA_VERSION,
  };
}

/**
 * 导出数据为JSON字符串
 * @returns JSON格式的字符串
 */
export function exportToJSON(): string {
  const data = exportAllData();
  return JSON.stringify(data, null, 2);
}

/**
 * 导出数据并下载为文件
 * @param filename - 文件名，默认为 'ancient-book-restoration-data.json'
 */
export function exportToFile(filename: string = 'ancient-book-restoration-data.json'): void {
  try {
    const jsonStr = exportToJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (e) {
    console.error('导出数据文件失败:', e);
    throw e;
  }
}

/**
 * 导入所有数据
 * @param data - 要导入的数据对象
 * @param merge - 是否与现有数据合并，默认为false（覆盖）
 * @returns 是否导入成功
 */
export function importAllData(data: ExportData, merge: boolean = false): boolean {
  try {
    if (!data || typeof data !== 'object') {
      throw new Error('无效的导入数据格式');
    }

    const saveData = <T>(key: StorageKey, newData: T[], mergeFlag: boolean): void => {
      if (mergeFlag) {
        const existingData = loadFromStorage<T[]>(key, []) ?? [];
        const mergedData = [...existingData, ...newData];
        saveToStorage(key, mergedData);
      } else {
        saveToStorage(key, newData);
      }
    };

    saveData(STORAGE_KEYS.BOOKS, data.books || [], merge);
    saveData(STORAGE_KEYS.PAGES, data.pages || [], merge);
    saveData(STORAGE_KEYS.DAMAGE_AREAS, data.damageAreas || [], merge);
    saveData(STORAGE_KEYS.PAPER_CATEGORIES, data.paperCategories || [], merge);
    saveData(STORAGE_KEYS.PAPER_STOCK, data.paperStock || [], merge);
    saveData(STORAGE_KEYS.RESTORATION_RECORDS, data.restorationRecords || [], merge);

    return true;
  } catch (e) {
    console.error('导入数据失败:', e);
    return false;
  }
}

/**
 * 从JSON字符串导入数据
 * @param jsonStr - JSON格式的字符串
 * @param merge - 是否与现有数据合并，默认为false（覆盖）
 * @returns 是否导入成功
 */
export function importFromJSON(jsonStr: string, merge: boolean = false): boolean {
  try {
    const data = JSON.parse(jsonStr) as ExportData;
    return importAllData(data, merge);
  } catch (e) {
    console.error('解析JSON数据失败:', e);
    return false;
  }
}

/**
 * 从文件导入数据
 * @param file - 要导入的文件对象
 * @param merge - 是否与现有数据合并，默认为false（覆盖）
 * @returns Promise<boolean> 是否导入成功
 */
export async function importFromFile(
  file: File,
  merge: boolean = false
): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const success = importFromJSON(content, merge);
        resolve(success);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => {
      reject(new Error('读取文件失败'));
    };

    reader.readAsText(file);
  });
}

/**
 * 获取存储使用统计
 * @returns 存储统计信息
 */
export function getStorageStats(): {
  totalSize: number;
  itemCount: number;
  items: { key: StorageKey; size: number; count: number }[];
} {
  let totalSize = 0;
  let itemCount = 0;
  const items: { key: StorageKey; size: number; count: number }[] = [];

  Object.values(STORAGE_KEYS).forEach((key) => {
    const data = localStorage.getItem(key);
    if (data) {
      const size = new Blob([data]).size;
      let count = 1;
      try {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) {
          count = parsed.length;
        }
      } catch {
        // 忽略解析错误
      }
      items.push({ key, size, count });
      totalSize += size;
      itemCount += count;
    }
  });

  return {
    totalSize,
    itemCount,
    items,
  };
}

/**
 * 检查数据是否存在
 * @param key - 存储键名
 * @returns 是否存在数据
 */
export function hasData(key: StorageKey): boolean {
  if (!isLocalStorageAvailable()) {
    return false;
  }
  return localStorage.getItem(key) !== null;
}

/**
 * 初始化存储（如果为空则使用默认数据）
 * @param defaultData - 默认数据对象
 * @param force - 是否强制覆盖现有数据
 */
export function initializeStorage(
  defaultData: Omit<ExportData, 'exportedAt' | 'version'>,
  force: boolean = false
): void {
  const shouldInitialize =
    force ||
    !hasData(STORAGE_KEYS.BOOKS) ||
    !hasData(STORAGE_KEYS.PAPER_CATEGORIES) ||
    !hasData(STORAGE_KEYS.PAPER_STOCK);

  if (shouldInitialize) {
    saveToStorage(STORAGE_KEYS.BOOKS, defaultData.books);
    saveToStorage(STORAGE_KEYS.PAGES, defaultData.pages);
    saveToStorage(STORAGE_KEYS.DAMAGE_AREAS, defaultData.damageAreas);
    saveToStorage(STORAGE_KEYS.PAPER_CATEGORIES, defaultData.paperCategories);
    saveToStorage(STORAGE_KEYS.PAPER_STOCK, defaultData.paperStock);
    saveToStorage(STORAGE_KEYS.RESTORATION_RECORDS, defaultData.restorationRecords);
  }
}
