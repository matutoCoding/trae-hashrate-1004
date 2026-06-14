import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type {
  Book,
  BookPage,
  DamageArea,
  PaperCategory,
  PaperStock,
  RestorationRecord,
  MatchResult,
  MatchWeights,
} from '@/types';
import {
  mockBooks,
  mockPages,
  mockDamageAreas,
  mockPaperCategories,
  mockPaperStock,
  mockRestorationRecords,
} from '@/utils/mockData';
import { calculateBatchMatches } from '@/utils/similarity';
import { loadFromStorage, saveToStorage, STORAGE_KEYS } from '@/utils/storage';

interface AppState {
  books: Book[];
  pages: BookPage[];
  damageAreas: DamageArea[];
  paperCategories: PaperCategory[];
  paperStocks: PaperStock[];
  restorationRecords: RestorationRecord[];

  currentBookId: string | null;
  currentPageId: string | null;
  matchResults: MatchResult[];
  matchWeights: MatchWeights;
  isInitialized: boolean;

  setCurrentBook: (id: string | null) => void;
  setCurrentPage: (id: string | null) => void;
  setMatchWeights: (weights: Partial<MatchWeights>) => void;

  addBook: (book: Omit<Book, 'id' | 'createdAt'>) => Book;
  updateBook: (id: string, updates: Partial<Book>) => void;
  deleteBook: (id: string) => void;

  addPage: (page: Omit<BookPage, 'id' | 'createdAt'>) => BookPage;
  updatePage: (id: string, updates: Partial<BookPage>) => void;
  deletePage: (id: string) => void;

  addDamageArea: (area: Omit<DamageArea, 'id'> & { id?: string }) => DamageArea;
  updateDamageArea: (id: string, updates: Partial<DamageArea>) => void;
  deleteDamageArea: (id: string) => void;
  getDamageAreasByPage: (pageId: string) => DamageArea[];
  replaceDamageAreasForPage: (pageId: string, areas: DamageArea[]) => void;

  addPaperStock: (stock: Omit<PaperStock, 'id'>) => PaperStock;
  updatePaperStock: (id: string, updates: Partial<PaperStock>) => void;
  deletePaperStock: (id: string) => void;
  updateStockQuantity: (id: string, quantity: number) => void;

  addRestorationRecord: (record: Omit<RestorationRecord, 'id' | 'createdAt'>) => RestorationRecord;
  updateRestorationRecord: (id: string, updates: Partial<RestorationRecord>) => void;
  deleteRestorationRecord: (id: string) => void;
  getRecordsByPage: (pageId: string) => RestorationRecord[];
  getRecordsByPaper: (paperId: string) => RestorationRecord[];

  calculateMatches: (page: BookPage) => MatchResult[];
  getPaperById: (id: string) => PaperStock | undefined;
  getCategoryById: (id: string) => PaperCategory | undefined;
  getBookById: (id: string) => Book | undefined;
  getPageById: (id: string) => BookPage | undefined;

  getStatistics: () => {
    totalBooks: number;
    totalPages: number;
    totalPapers: number;
    totalRestored: number;
    pendingPages: number;
    lowStockPapers: number;
  };

  initializeWithMockData: () => void;
  clearAllData: () => void;
}

const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

const defaultMatchWeights: MatchWeights = {
  curtainPattern: 25,
  fiber: 20,
  thickness: 20,
  color: 25,
  ph: 10,
};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      books: [],
      pages: [],
      damageAreas: [],
      paperCategories: [],
      paperStocks: [],
      restorationRecords: [],
      currentBookId: null,
      currentPageId: null,
      matchResults: [],
      matchWeights: defaultMatchWeights,
      isInitialized: false,

      setCurrentBook: (id) => set({ currentBookId: id }),
      setCurrentPage: (id) => set({ currentPageId: id }),
      setMatchWeights: (weights) =>
        set((state) => ({
          matchWeights: { ...state.matchWeights, ...weights },
        })),

      addBook: (book) => {
        const newBook: Book = {
          ...book,
          id: generateId(),
          createdAt: new Date(Date.now()).toISOString(),
        };
        set((state) => ({ books: [...state.books, newBook] }));
        return newBook;
      },
      updateBook: (id, updates) =>
        set((state) => ({
          books: state.books.map((b) => (b.id === id ? { ...b, ...updates } : b)),
        })),
      deleteBook: (id) =>
        set((state) => ({
          books: state.books.filter((b) => b.id !== id),
          pages: state.pages.filter((p) => p.bookId !== id),
        })),

      addPage: (page) => {
        const newPage: BookPage = {
          ...page,
          id: generateId(),
          createdAt: new Date(Date.now()).toISOString(),
        };
        set((state) => ({ pages: [...state.pages, newPage] }));
        return newPage;
      },
      updatePage: (id, updates) =>
        set((state) => ({
          pages: state.pages.map((p) => (p.id === id ? { ...p, ...updates } : p)),
        })),
      deletePage: (id) =>
        set((state) => ({
          pages: state.pages.filter((p) => p.id !== id),
          damageAreas: state.damageAreas.filter((d) => d.pageId !== id),
        })),

      addDamageArea: (area) => {
        const newArea: DamageArea = {
          ...area,
          id: area.id || generateId(),
        };
        set((state) => ({ damageAreas: [...state.damageAreas, newArea] }));
        return newArea;
      },
      updateDamageArea: (id, updates) =>
        set((state) => ({
          damageAreas: state.damageAreas.map((d) =>
            d.id === id ? { ...d, ...updates } : d
          ),
        })),
      deleteDamageArea: (id) =>
        set((state) => ({
          damageAreas: state.damageAreas.filter((d) => d.id !== id),
        })),
      getDamageAreasByPage: (pageId) =>
        get().damageAreas.filter((d) => d.pageId === pageId),
      replaceDamageAreasForPage: (pageId, areas) =>
        set((state) => ({
          damageAreas: [
            ...state.damageAreas.filter((d) => d.pageId !== pageId),
            ...areas,
          ],
        })),

      addPaperStock: (stock) => {
        const newStock: PaperStock = {
          ...stock,
          id: generateId(),
        };
        set((state) => ({ paperStocks: [...state.paperStocks, newStock] }));
        return newStock;
      },
      updatePaperStock: (id, updates) =>
        set((state) => ({
          paperStocks: state.paperStocks.map((p) =>
            p.id === id ? { ...p, ...updates } : p
          ),
        })),
      deletePaperStock: (id) =>
        set((state) => ({
          paperStocks: state.paperStocks.filter((p) => p.id !== id),
        })),
      updateStockQuantity: (id, quantity) =>
        set((state) => ({
          paperStocks: state.paperStocks.map((p) =>
            p.id === id ? { ...p, stockQuantity: quantity } : p
          ),
        })),

      addRestorationRecord: (record) => {
        const newRecord: RestorationRecord = {
          ...record,
          id: generateId(),
          createdAt: new Date(Date.now()).toISOString(),
        };
        set((state) => ({
          restorationRecords: [...state.restorationRecords, newRecord],
        }));
        return newRecord;
      },
      updateRestorationRecord: (id, updates) =>
        set((state) => ({
          restorationRecords: state.restorationRecords.map((r) =>
            r.id === id ? { ...r, ...updates } : r
          ),
        })),
      deleteRestorationRecord: (id) =>
        set((state) => ({
          restorationRecords: state.restorationRecords.filter((r) => r.id !== id),
        })),
      getRecordsByPage: (pageId) =>
        get().restorationRecords.filter((r) => r.pageId === pageId),
      getRecordsByPaper: (paperId) =>
        get().restorationRecords.filter((r) => r.paperId === paperId),

      calculateMatches: (page) => {
        const results = calculateBatchMatches(page, get().paperStocks, get().matchWeights);
        set({ matchResults: results });
        return results;
      },

      getPaperById: (id) => get().paperStocks.find((p) => p.id === id),
      getCategoryById: (id) => get().paperCategories.find((c) => c.id === id),
      getBookById: (id) => get().books.find((b) => b.id === id),
      getPageById: (id) => get().pages.find((p) => p.id === id),

      getStatistics: () => {
        const state = get();
        return {
          totalBooks: state.books.length,
          totalPages: state.pages.length,
          totalPapers: state.paperStocks.length,
          totalRestored: state.pages.filter((p) => p.status === '已归档').length,
          pendingPages: state.pages.filter(
            (p) => p.status === '待检测' || p.status === '已检测' || p.status === '待修复' || p.status === '修复中'
          ).length,
          lowStockPapers: state.paperStocks.filter(
            (p) => p.stockQuantity < 10 && p.unit === '张'
          ).length,
        };
      },

      initializeWithMockData: () => {
        const existingData = loadFromStorage<Book[]>(STORAGE_KEYS.BOOKS);
        if (existingData && existingData.length > 0) {
          set({ isInitialized: true });
          return;
        }

        set({
          books: mockBooks,
          pages: mockPages,
          damageAreas: mockDamageAreas,
          paperCategories: mockPaperCategories,
          paperStocks: mockPaperStock,
          restorationRecords: mockRestorationRecords,
          isInitialized: true,
        });

        saveToStorage(STORAGE_KEYS.BOOKS, mockBooks);
        saveToStorage(STORAGE_KEYS.PAGES, mockPages);
        saveToStorage(STORAGE_KEYS.DAMAGE_AREAS, mockDamageAreas);
        saveToStorage(STORAGE_KEYS.PAPER_CATEGORIES, mockPaperCategories);
        saveToStorage(STORAGE_KEYS.PAPER_STOCK, mockPaperStock);
        saveToStorage(STORAGE_KEYS.RESTORATION_RECORDS, mockRestorationRecords);
      },

      clearAllData: () => {
        set({
          books: [],
          pages: [],
          damageAreas: [],
          paperCategories: [],
          paperStocks: [],
          restorationRecords: [],
          currentBookId: null,
          currentPageId: null,
          matchResults: [],
          isInitialized: false,
        });
      },
    }),
    {
      name: 'guji-restoration-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        books: state.books,
        pages: state.pages,
        damageAreas: state.damageAreas,
        paperCategories: state.paperCategories,
        paperStocks: state.paperStocks,
        restorationRecords: state.restorationRecords,
        matchWeights: state.matchWeights,
        isInitialized: state.isInitialized,
      }),
    }
  )
);
