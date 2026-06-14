import React, { useState, useMemo } from 'react';
import {
  Search,
  Plus,
  ListChecks,
  FileText,
  ChevronRight,
  ChevronDown,
  Filter,
  SortAsc,
  SortDesc,
  Edit3,
  Trash2,
  Eye,
  X,
  Save,
  Package,
  MapPin,
  Clock,
  User,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  ArrowUpRight,
  ArrowDownRight,
  Download,
  Printer,
  BookOpen,
  Calculator,
  Layers,
} from 'lucide-react';
import { useAppStore } from '@/store';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Tabs, TabsContent } from '@/components/ui/Tabs';
import { Select } from '@/components/ui/Select';
import { cn } from '@/lib/utils';
import type {
  PaperStock,
  PaperCategory,
  Dynasty,
  PaperType,
  Book,
  BookPage,
  RestorationRecord,
} from '@/types';

interface CategoryNode {
  id: string;
  label: string;
  type: 'dynasty' | 'paperType' | 'stock';
  value: string;
  children?: CategoryNode[];
}

interface SortConfig {
  key: string;
  direction: 'asc' | 'desc';
}

export const PaperLibrary: React.FC = () => {
  const {
    paperStocks,
    paperCategories,
    books,
    pages,
    restorationRecords,
    getCategoryById,
    getRecordsByPaper,
    getBookById,
    getPageById,
    addPaperStock,
    updatePaperStock,
    deletePaperStock,
    updateStockQuantity,
  } = useAppStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<{ type: string; value: string } | null>(null);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(['dynasty', 'paperType', 'stock']));
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'batchNumber', direction: 'asc' });
  const [selectedPaperIds, setSelectedPaperIds] = useState<Set<string>>(new Set());
  const [showDetailDrawer, setShowDetailDrawer] = useState(false);
  const [selectedPaperId, setSelectedPaperId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editingPaper, setEditingPaper] = useState<Partial<PaperStock> | null>(null);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('info');
  const [showNewPaperModal, setShowNewPaperModal] = useState(false);
  const [newPaper, setNewPaper] = useState<Partial<PaperStock>>({
    batchNumber: '',
    curtainPatternSpacing: 1.5,
    fiberComposition: '',
    thickness: 0.08,
    colorL: 85,
    colorA: 2,
    colorB: 12,
    pHValue: 7.0,
    stockQuantity: 100,
    unit: '张',
    storageLocation: '',
    purchaseDate: new Date().toISOString().split('T')[0],
    supplier: '',
    notes: '',
  });

  const categoryTree: CategoryNode[] = [
    {
      id: 'dynasty',
      label: '按朝代分类',
      type: 'dynasty',
      value: '',
      children: (['唐', '宋', '元', '明', '清', '现代'] as Dynasty[]).map((d) => ({
        id: `dynasty-${d}`,
        label: `${d}代`,
        type: 'dynasty' as const,
        value: d,
      })),
    },
    {
      id: 'paperType',
      label: '按纸种分类',
      type: 'paperType',
      value: '',
      children: (['宣纸', '皮纸', '竹纸', '棉纸', '麻纸'] as PaperType[]).map((p) => ({
        id: `paperType-${p}`,
        label: p,
        type: 'paperType' as const,
        value: p,
      })),
    },
    {
      id: 'stock',
      label: '库存状态',
      type: 'stock',
      value: '',
      children: [
        { id: 'stock-normal', label: '库存充足（≥50）', type: 'stock' as const, value: 'normal' },
        { id: 'stock-low', label: '库存紧张（<50）', type: 'stock' as const, value: 'low' },
        { id: 'stock-out', label: '缺货（=0）', type: 'stock' as const, value: 'out' },
      ],
    },
  ];

  const filteredPapers = useMemo(() => {
    let result = [...paperStocks];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (p) =>
          p.batchNumber.toLowerCase().includes(term) ||
          p.fiberComposition.toLowerCase().includes(term) ||
          p.storageLocation.toLowerCase().includes(term) ||
          p.supplier.toLowerCase().includes(term)
      );
    }

    if (selectedCategory) {
      result = result.filter((paper) => {
        const category = getCategoryById(paper.categoryId);
        if (!category) return false;

        if (selectedCategory.type === 'dynasty') {
          return category.dynasty === selectedCategory.value;
        }
        if (selectedCategory.type === 'paperType') {
          return category.paperType === selectedCategory.value;
        }
        if (selectedCategory.type === 'stock') {
          if (selectedCategory.value === 'normal') return paper.stockQuantity >= 50;
          if (selectedCategory.value === 'low') return paper.stockQuantity > 0 && paper.stockQuantity < 50;
          if (selectedCategory.value === 'out') return paper.stockQuantity === 0;
        }
        return true;
      });
    }

    result.sort((a, b) => {
      let comparison = 0;
      switch (sortConfig.key) {
        case 'batchNumber':
          comparison = a.batchNumber.localeCompare(b.batchNumber);
          break;
        case 'dynasty': {
          const catA = getCategoryById(a.categoryId);
          const catB = getCategoryById(b.categoryId);
          comparison = (catA?.dynasty || '').localeCompare(catB?.dynasty || '');
          break;
        }
        case 'paperType': {
          const catA = getCategoryById(a.categoryId);
          const catB = getCategoryById(b.categoryId);
          comparison = (catA?.paperType || '').localeCompare(catB?.paperType || '');
          break;
        }
        case 'curtainPatternSpacing':
          comparison = a.curtainPatternSpacing - b.curtainPatternSpacing;
          break;
        case 'thickness':
          comparison = a.thickness - b.thickness;
          break;
        case 'pHValue':
          comparison = a.pHValue - b.pHValue;
          break;
        case 'stockQuantity':
          comparison = a.stockQuantity - b.stockQuantity;
          break;
        default:
          comparison = 0;
      }
      return sortConfig.direction === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [paperStocks, searchTerm, selectedCategory, sortConfig, getCategoryById]);

  const selectedPaper = selectedPaperId ? paperStocks.find((p) => p.id === selectedPaperId) : null;
  const selectedPaperCategory = selectedPaper ? getCategoryById(selectedPaper.categoryId) : null;
  const paperUsageRecords = selectedPaperId ? getRecordsByPaper(selectedPaperId) : [];

  const toggleNode = (nodeId: string) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  };

  const handleSort = (key: string) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const handleSelectAll = () => {
    if (selectedPaperIds.size === filteredPapers.length) {
      setSelectedPaperIds(new Set());
    } else {
      setSelectedPaperIds(new Set(filteredPapers.map((p) => p.id)));
    }
  };

  const handleSelectPaper = (paperId: string) => {
    setSelectedPaperIds((prev) => {
      const next = new Set(prev);
      if (next.has(paperId)) {
        next.delete(paperId);
      } else {
        next.add(paperId);
      }
      return next;
    });
  };

  const handleViewDetail = (paperId: string) => {
    setSelectedPaperId(paperId);
    setShowDetailDrawer(true);
    setIsEditing(false);
    setActiveTab('info');
  };

  const handleEditPaper = (paper: PaperStock) => {
    setEditingPaper({ ...paper });
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    if (!editingPaper || !editingPaper.id) return;
    updatePaperStock(editingPaper.id, editingPaper);
    setIsEditing(false);
    setEditingPaper(null);
  };

  const handleDeletePaper = (paperId: string) => {
    if (confirm('确定要删除此补纸库存吗？')) {
      deletePaperStock(paperId);
      setShowDetailDrawer(false);
      setSelectedPaperId(null);
    }
  };

  const handleAddNewPaper = () => {
    if (!newPaper.batchNumber) {
      alert('请输入批次号');
      return;
    }

    const category = paperCategories.find(
      (c) => c.dynasty === '现代' && c.paperType === '宣纸'
    );

    addPaperStock({
      categoryId: category?.id || paperCategories[0]?.id || '',
      batchNumber: newPaper.batchNumber,
      curtainPatternSpacing: newPaper.curtainPatternSpacing || 1.5,
      fiberComposition: newPaper.fiberComposition || '青檀皮',
      thickness: newPaper.thickness || 0.08,
      colorL: newPaper.colorL || 85,
      colorA: newPaper.colorA || 2,
      colorB: newPaper.colorB || 12,
      pHValue: newPaper.pHValue || 7.0,
      stockQuantity: newPaper.stockQuantity || 100,
      unit: newPaper.unit || '张',
      storageLocation: newPaper.storageLocation || '',
      purchaseDate: newPaper.purchaseDate || new Date().toISOString().split('T')[0],
      supplier: newPaper.supplier || '',
      notes: newPaper.notes || '',
    });

    setShowNewPaperModal(false);
    setNewPaper({
      batchNumber: '',
      curtainPatternSpacing: 1.5,
      fiberComposition: '',
      thickness: 0.08,
      colorL: 85,
      colorA: 2,
      colorB: 12,
      pHValue: 7.0,
      stockQuantity: 100,
      unit: '张',
      storageLocation: '',
      purchaseDate: new Date().toISOString().split('T')[0],
      supplier: '',
      notes: '',
    });
  };

  const calculatePaperUsage = () => {
    if (!selectedBookId) return [];

    const bookPages = pages.filter((p) => p.bookId === selectedBookId);
    const damagedPages = bookPages.filter(
      (p) => p.status === '待修复' || p.status === '修复中' || p.status === '待检测'
    );

    const usageByPaper = new Map<string, { paper: PaperStock; count: number }>();

    damagedPages.forEach((page) => {
      const records = restorationRecords.filter((r) => r.pageId === page.id);
      records.forEach((record) => {
        const paper = paperStocks.find((p) => p.id === record.paperId);
        if (paper) {
          const existing = usageByPaper.get(paper.id);
          if (existing) {
            existing.count += record.paperUsed;
          } else {
            usageByPaper.set(paper.id, { paper, count: record.paperUsed });
          }
        }
      });
    });

    if (usageByPaper.size === 0) {
      const matchingPaper = paperStocks[0];
      if (matchingPaper) {
        usageByPaper.set(matchingPaper.id, {
          paper: matchingPaper,
          count: Math.ceil(damagedPages.length * 1.5),
        });
      }
    }

    return Array.from(usageByPaper.values());
  };

  const handleExportList = () => {
    const paperUsage = calculatePaperUsage();
    const book = selectedBookId ? getBookById(selectedBookId) : null;

    let report = `
配补用纸量清单
==============
生成时间: ${new Date().toLocaleString('zh-CN')}
古籍: ${book?.name || '未知'}
预计修复页数: ${pages.filter((p) => p.bookId === selectedBookId && (p.status === '待修复' || p.status === '修复中')).length} 页

序号\t批次号\t\t朝代\t纸种\t所需数量\t单位\t库位\t当前库存\t状态
${'─'.repeat(100)}
`;

    paperUsage.forEach((item, index) => {
      const category = getCategoryById(item.paper.categoryId);
      const status = item.paper.stockQuantity >= item.count ? '充足' : '不足';
      report += `${index + 1}\t${item.paper.batchNumber}\t${category?.dynasty || ''}\t${category?.paperType || ''}\t${item.count}\t\t${item.paper.unit}\t${item.paper.storageLocation}\t${item.paper.stockQuantity}\t${status}\n`;
    });

    const totalNeeded = paperUsage.reduce((sum, item) => sum + item.count, 0);
    report += `
${'─'.repeat(100)}
总计: ${totalNeeded} 张
    `;

    const blob = new Blob([report], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `配纸清单_${book?.name || '古籍'}_${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  const renderCategoryNode = (node: CategoryNode, level = 0) => {
    const isExpanded = expandedNodes.has(node.id);
    const isSelected = selectedCategory?.type === node.type && selectedCategory?.value === node.value;
    const hasChildren = node.children && node.children.length > 0;

    return (
      <div key={node.id}>
        <button
          onClick={() => {
            if (hasChildren) {
              toggleNode(node.id);
            }
            if (node.value) {
              setSelectedCategory(isSelected ? null : { type: node.type, value: node.value });
            }
          }}
          className={cn(
            'w-full flex items-center gap-2 px-3 py-2 text-left text-sm transition-colors rounded-lg',
            isSelected
              ? 'bg-ink-600 text-paper-50'
              : 'text-ink-600 hover:bg-paper-100',
            level > 0 && 'pl-8'
          )}
        >
          {hasChildren ? (
            isExpanded ? (
              <ChevronDown size={14} className="flex-shrink-0" />
            ) : (
              <ChevronRight size={14} className="flex-shrink-0" />
            )
          ) : (
            <span className="w-3.5 flex-shrink-0" />
          )}
          <span className="truncate">{node.label}</span>
          {node.value && (
            <Badge variant="default" className="ml-auto text-xs py-0">
              {filteredPapers.filter((p) => {
                const cat = getCategoryById(p.categoryId);
                if (!cat) return false;
                if (node.type === 'dynasty') return cat.dynasty === node.value;
                if (node.type === 'paperType') return cat.paperType === node.value;
                if (node.type === 'stock') {
                  if (node.value === 'normal') return p.stockQuantity >= 50;
                  if (node.value === 'low') return p.stockQuantity > 0 && p.stockQuantity < 50;
                  if (node.value === 'out') return p.stockQuantity === 0;
                }
                return false;
              }).length}
            </Badge>
          )}
        </button>
        {hasChildren && isExpanded && (
          <div className="mt-1">
            {node.children!.map((child) => renderCategoryNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  const SortIcon = ({ columnKey }: { columnKey: string }) => {
    if (sortConfig.key !== columnKey) return <SortAsc size={14} className="opacity-30" />;
    return sortConfig.direction === 'asc' ? (
      <SortAsc size={14} className="text-ink-600" />
    ) : (
      <SortDesc size={14} className="text-ink-600" />
    );
  };

  const getStockBadge = (quantity: number, unit: string) => {
    if (quantity === 0) return <Badge variant="danger">缺货</Badge>;
    if (quantity < 10) return <Badge variant="danger">紧缺 {quantity}{unit}</Badge>;
    if (quantity < 50) return <Badge variant="warning">紧张 {quantity}{unit}</Badge>;
    return <Badge variant="success">充足 {quantity}{unit}</Badge>;
  };

  const paperUsage = calculatePaperUsage();
  const selectedBook = selectedBookId ? getBookById(selectedBookId) : null;

  return (
    <div className="min-h-full bg-paper-100 p-4 lg:p-6">
      <div className="max-w-[1800px] mx-auto">
        {/* 页面标题 */}
        <div className="mb-6 animate-fade-in">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-song text-2xl font-bold text-ink-700">纸库管理</h1>
              <p className="text-sm text-ink-500 mt-1">管理补纸库存和出入库记录</p>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="info" className="text-sm">
                共 {filteredPapers.length} 条记录
              </Badge>
            </div>
          </div>
        </div>

        {/* 主内容区 */}
        <div className="grid grid-cols-12 gap-4 lg:gap-6">
          {/* 左侧：分类导航树 */}
          <div className="col-span-12 md:col-span-3 lg:col-span-2">
            <Card className="h-[calc(100vh-160px)] flex flex-col animate-fade-in">
              <CardHeader className="flex-shrink-0">
                <CardTitle className="text-base">分类导航</CardTitle>
                <CardDescription>按条件筛选补纸</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto scrollbar-thin p-3">
                <div className="space-y-1">
                  <button
                    onClick={() => setSelectedCategory(null)}
                    className={cn(
                      'w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors',
                      !selectedCategory
                        ? 'bg-ink-600 text-paper-50'
                        : 'text-ink-600 hover:bg-paper-100'
                    )}
                  >
                    <Package size={16} />
                    <span>全部补纸</span>
                    <Badge variant="default" className="ml-auto text-xs py-0">
                      {paperStocks.length}
                    </Badge>
                  </button>

                  <div className="divide-y divide-paper-200">
                    {categoryTree.map((node) => renderCategoryNode(node))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 右侧主区域 */}
          <div className="col-span-12 md:col-span-9 lg:col-span-10 space-y-4 lg:space-y-6">
            {/* 顶部工具栏 */}
            <Card className="animate-fade-in" style={{ animationDelay: '50ms' }}>
              <CardContent className="p-4">
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex-1 min-w-[200px] max-w-md">
                    <Input
                      placeholder="搜索批次号、成分、库位、供应商..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      prefix={<Search size={16} className="text-ink-400" />}
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    {selectedCategory && (
                      <Badge variant="default" className="text-sm">
                        {selectedCategory.value}
                        <button
                          onClick={() => setSelectedCategory(null)}
                          className="ml-2 hover:text-seal-600"
                        >
                          <X size={12} />
                        </button>
                      </Badge>
                    )}
                    <Badge variant="default" className="text-sm">
                      <Filter size={12} className="mr-1" />
                      {filteredPapers.length} / {paperStocks.length}
                    </Badge>
                  </div>

                  <div className="flex-1" />

                  <div className="flex items-center gap-2">
                    <Button variant="secondary" onClick={() => setShowNewPaperModal(true)}>
                      <Plus size={16} className="mr-2" />
                      新增补纸
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => {}}
                      disabled={selectedPaperIds.size === 0}
                    >
                      <ListChecks size={16} className="mr-2" />
                      批量操作
                      {selectedPaperIds.size > 0 && (
                        <span className="ml-1 px-1.5 py-0.5 bg-ink-600 text-paper-50 text-xs rounded">
                          {selectedPaperIds.size}
                        </span>
                      )}
                    </Button>
                    <Button variant="primary" onClick={() => setShowGenerateModal(true)}>
                      <FileText size={16} className="mr-2" />
                      生成清单
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 补纸库存表格 */}
            <Card className="animate-fade-in overflow-hidden" style={{ animationDelay: '100ms' }}>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-paper-100 sticky top-0 z-10">
                    <tr>
                      <th className="px-4 py-3 text-left w-10">
                        <input
                          type="checkbox"
                          checked={selectedPaperIds.size === filteredPapers.length && filteredPapers.length > 0}
                          onChange={handleSelectAll}
                          className="w-4 h-4 rounded border-paper-300 text-ink-600 focus:ring-ink-500"
                        />
                      </th>
                      <th
                        className="px-4 py-3 text-left font-medium text-ink-600 cursor-pointer hover:bg-paper-200/50 transition-colors"
                        onClick={() => handleSort('batchNumber')}
                      >
                        <div className="flex items-center gap-1">
                          批次号
                          <SortIcon columnKey="batchNumber" />
                        </div>
                      </th>
                      <th
                        className="px-4 py-3 text-left font-medium text-ink-600 cursor-pointer hover:bg-paper-200/50 transition-colors"
                        onClick={() => handleSort('dynasty')}
                      >
                        <div className="flex items-center gap-1">
                          朝代
                          <SortIcon columnKey="dynasty" />
                        </div>
                      </th>
                      <th
                        className="px-4 py-3 text-left font-medium text-ink-600 cursor-pointer hover:bg-paper-200/50 transition-colors"
                        onClick={() => handleSort('paperType')}
                      >
                        <div className="flex items-center gap-1">
                          纸种
                          <SortIcon columnKey="paperType" />
                        </div>
                      </th>
                      <th
                        className="px-4 py-3 text-left font-medium text-ink-600 cursor-pointer hover:bg-paper-200/50 transition-colors"
                        onClick={() => handleSort('curtainPatternSpacing')}
                      >
                        <div className="flex items-center gap-1">
                          帘纹间距
                          <SortIcon columnKey="curtainPatternSpacing" />
                        </div>
                      </th>
                      <th
                        className="px-4 py-3 text-left font-medium text-ink-600 cursor-pointer hover:bg-paper-200/50 transition-colors"
                        onClick={() => handleSort('thickness')}
                      >
                        <div className="flex items-center gap-1">
                          厚度
                          <SortIcon columnKey="thickness" />
                        </div>
                      </th>
                      <th
                        className="px-4 py-3 text-left font-medium text-ink-600 cursor-pointer hover:bg-paper-200/50 transition-colors"
                        onClick={() => handleSort('pHValue')}
                      >
                        <div className="flex items-center gap-1">
                          pH值
                          <SortIcon columnKey="pHValue" />
                        </div>
                      </th>
                      <th
                        className="px-4 py-3 text-left font-medium text-ink-600 cursor-pointer hover:bg-paper-200/50 transition-colors"
                        onClick={() => handleSort('stockQuantity')}
                      >
                        <div className="flex items-center gap-1">
                          库存量
                          <SortIcon columnKey="stockQuantity" />
                        </div>
                      </th>
                      <th className="px-4 py-3 text-left font-medium text-ink-600">单位</th>
                      <th className="px-4 py-3 text-left font-medium text-ink-600">库位</th>
                      <th className="px-4 py-3 text-left font-medium text-ink-600">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-paper-200">
                    {filteredPapers.map((paper) => {
                      const category = getCategoryById(paper.categoryId);
                      const isLowStock = paper.stockQuantity < 50 && paper.stockQuantity > 0;
                      const isOutOfStock = paper.stockQuantity === 0;
                      const isSelected = selectedPaperIds.has(paper.id);

                      return (
                        <tr
                          key={paper.id}
                          className={cn(
                            'transition-colors cursor-pointer',
                            isSelected && 'bg-ink-50',
                            isOutOfStock && 'bg-seal-50/50',
                            isLowStock && 'bg-amber-50/50',
                            !isSelected && !isLowStock && !isOutOfStock && 'hover:bg-paper-50'
                          )}
                          onClick={() => handleViewDetail(paper.id)}
                        >
                          <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleSelectPaper(paper.id)}
                              className="w-4 h-4 rounded border-paper-300 text-ink-600 focus:ring-ink-500"
                            />
                          </td>
                          <td className="px-4 py-3 font-mono text-xs text-ink-700">
                            {paper.batchNumber}
                          </td>
                          <td className="px-4 py-3 text-ink-700">{category?.dynasty || '-'}</td>
                          <td className="px-4 py-3 text-ink-700">{category?.paperType || '-'}</td>
                          <td className="px-4 py-3 text-ink-700">{paper.curtainPatternSpacing}mm</td>
                          <td className="px-4 py-3 text-ink-700">{paper.thickness}mm</td>
                          <td className="px-4 py-3 text-ink-700">{paper.pHValue}</td>
                          <td className="px-4 py-3">
                            <span className={cn(
                              'font-medium',
                              isOutOfStock && 'text-seal-600',
                              isLowStock && 'text-amber-600'
                            )}>
                              {paper.stockQuantity}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-ink-600">{paper.unit}</td>
                          <td className="px-4 py-3 text-ink-600">{paper.storageLocation}</td>
                          <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 px-2"
                                onClick={() => handleViewDetail(paper.id)}
                              >
                                <Eye size={14} className="mr-1" />
                                查看
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 px-2"
                                onClick={() => handleEditPaper(paper)}
                              >
                                <Edit3 size={14} className="mr-1" />
                                编辑
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 px-2 text-seal-600 hover:text-seal-700 hover:bg-seal-50"
                                onClick={() => handleDeletePaper(paper.id)}
                              >
                                <Trash2 size={14} className="mr-1" />
                                删除
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {filteredPapers.length === 0 && (
                <div className="text-center py-12 text-ink-400">
                  <Package size={48} className="mx-auto mb-3 opacity-50" />
                  <p>暂无符合条件的补纸</p>
                  <p className="text-sm mt-1">请调整筛选条件后重试</p>
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>

      {/* 右侧：补纸详情/编辑抽屉 */}
      {showDetailDrawer && selectedPaper && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="absolute inset-0 bg-ink-900/30"
            onClick={() => {
              setShowDetailDrawer(false);
              setSelectedPaperId(null);
              setIsEditing(false);
              setEditingPaper(null);
            }}
          />
          <div className="relative w-[480px] h-full bg-paper-50 shadow-2xl overflow-y-auto animate-slide-up">
            {/* 抽屉头部 */}
            <div className="sticky top-0 bg-paper-50 border-b border-paper-200 p-4 z-10">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-song text-xl font-bold text-ink-700">
                    {isEditing ? '编辑补纸' : '补纸详情'}
                  </h2>
                  <p className="text-sm text-ink-500">{selectedPaper.batchNumber}</p>
                </div>
                <div className="flex items-center gap-2">
                  {!isEditing && (
                    <Button variant="secondary" size="sm" onClick={() => handleEditPaper(selectedPaper)}>
                      <Edit3 size={14} className="mr-2" />
                      编辑
                    </Button>
                  )}
                  {isEditing && (
                    <Button variant="primary" size="sm" onClick={handleSaveEdit}>
                      <Save size={14} className="mr-2" />
                      保存
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowDetailDrawer(false);
                      setSelectedPaperId(null);
                      setIsEditing(false);
                      setEditingPaper(null);
                    }}
                    className="h-8 w-8 p-0"
                  >
                    <X size={18} />
                  </Button>
                </div>
              </div>
            </div>

            <div className="p-6">
              {isEditing && editingPaper ? (
                /* 编辑模式 */
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="label-text">批次号</label>
                      <input
                        type="text"
                        value={editingPaper.batchNumber || ''}
                        onChange={(e) => setEditingPaper({ ...editingPaper, batchNumber: e.target.value })}
                        className="input-field"
                      />
                    </div>
                    <div>
                      <label className="label-text">库位</label>
                      <input
                        type="text"
                        value={editingPaper.storageLocation || ''}
                        onChange={(e) => setEditingPaper({ ...editingPaper, storageLocation: e.target.value })}
                        className="input-field"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="label-text">帘纹间距 (mm)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={editingPaper.curtainPatternSpacing || ''}
                        onChange={(e) => setEditingPaper({ ...editingPaper, curtainPatternSpacing: parseFloat(e.target.value) || 0 })}
                        className="input-field"
                      />
                    </div>
                    <div>
                      <label className="label-text">厚度 (mm)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={editingPaper.thickness || ''}
                        onChange={(e) => setEditingPaper({ ...editingPaper, thickness: parseFloat(e.target.value) || 0 })}
                        className="input-field"
                      />
                    </div>
                    <div>
                      <label className="label-text">pH值</label>
                      <input
                        type="number"
                        step="0.1"
                        value={editingPaper.pHValue || ''}
                        onChange={(e) => setEditingPaper({ ...editingPaper, pHValue: parseFloat(e.target.value) || 0 })}
                        className="input-field"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="label-text">色度 L*</label>
                      <input
                        type="number"
                        step="0.1"
                        value={editingPaper.colorL || ''}
                        onChange={(e) => setEditingPaper({ ...editingPaper, colorL: parseFloat(e.target.value) || 0 })}
                        className="input-field"
                      />
                    </div>
                    <div>
                      <label className="label-text">色度 a*</label>
                      <input
                        type="number"
                        step="0.1"
                        value={editingPaper.colorA || ''}
                        onChange={(e) => setEditingPaper({ ...editingPaper, colorA: parseFloat(e.target.value) || 0 })}
                        className="input-field"
                      />
                    </div>
                    <div>
                      <label className="label-text">色度 b*</label>
                      <input
                        type="number"
                        step="0.1"
                        value={editingPaper.colorB || ''}
                        onChange={(e) => setEditingPaper({ ...editingPaper, colorB: parseFloat(e.target.value) || 0 })}
                        className="input-field"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="label-text">纤维成分</label>
                    <input
                      type="text"
                      value={editingPaper.fiberComposition || ''}
                      onChange={(e) => setEditingPaper({ ...editingPaper, fiberComposition: e.target.value })}
                      className="input-field"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="label-text">库存量</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={editingPaper.stockQuantity || ''}
                          onChange={(e) => setEditingPaper({ ...editingPaper, stockQuantity: parseInt(e.target.value) || 0 })}
                          className="input-field"
                        />
                        <span className="text-ink-500 text-sm">{editingPaper.unit || '张'}</span>
                      </div>
                    </div>
                    <div>
                      <label className="label-text">供应商</label>
                      <input
                        type="text"
                        value={editingPaper.supplier || ''}
                        onChange={(e) => setEditingPaper({ ...editingPaper, supplier: e.target.value })}
                        className="input-field"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="label-text">备注</label>
                    <textarea
                      value={editingPaper.notes || ''}
                      onChange={(e) => setEditingPaper({ ...editingPaper, notes: e.target.value })}
                      className="input-field min-h-[80px] resize-none"
                    />
                  </div>
                </div>
              ) : (
                /* 查看模式 - Tab切换 */
                <div className="space-y-6">
                  {/* 状态和库存 */}
                  <div className="flex items-center justify-between">
                    {selectedPaperCategory && (
                      <div className="flex items-center gap-2">
                        <Badge variant="info">{selectedPaperCategory.dynasty}代</Badge>
                        <Badge variant="info">{selectedPaperCategory.paperType}</Badge>
                        <Badge variant="default">{selectedPaperCategory.subType}</Badge>
                      </div>
                    )}
                    {getStockBadge(selectedPaper.stockQuantity, selectedPaper.unit)}
                  </div>

                  <Tabs
                    items={[
                      { key: 'info', label: '基本信息' },
                      { key: 'records', label: '出入库记录' },
                      { key: 'usage', label: '历史使用' },
                    ]}
                    activeKey={activeTab}
                    onChange={setActiveTab}
                  />

                  <TabsContent
                    activeKey={activeTab}
                    items={[
                      {
                        key: 'info',
                        content: (
                          <div className="space-y-6 animate-fade-in">
                            {/* 基本信息 */}
                            <Card>
                              <CardHeader>
                                <CardTitle className="text-sm">基本信息</CardTitle>
                              </CardHeader>
                              <CardContent className="space-y-3">
                                <div className="flex items-center justify-between">
                                  <span className="text-ink-500 flex items-center gap-2">
                                    <Package size={14} />
                                    批次号
                                  </span>
                                  <span className="font-mono text-ink-700">{selectedPaper.batchNumber}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-ink-500 flex items-center gap-2">
                                    <MapPin size={14} />
                                    库位
                                  </span>
                                  <span className="text-ink-700">{selectedPaper.storageLocation}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-ink-500 flex items-center gap-2">
                                    <Clock size={14} />
                                    入库日期
                                  </span>
                                  <span className="text-ink-700">{selectedPaper.purchaseDate}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-ink-500 flex items-center gap-2">
                                    <User size={14} />
                                    供应商
                                  </span>
                                  <span className="text-ink-700">{selectedPaper.supplier}</span>
                                </div>
                              </CardContent>
                            </Card>

                            {/* 物理参数 */}
                            <Card>
                              <CardHeader>
                                <CardTitle className="text-sm">物理参数</CardTitle>
                              </CardHeader>
                              <CardContent>
                                <div className="grid grid-cols-2 gap-3">
                                  <div className="p-3 bg-paper-100 rounded-lg">
                                    <div className="text-xs text-ink-400 mb-1">帘纹间距</div>
                                    <div className="text-lg font-semibold text-ink-700">
                                      {selectedPaper.curtainPatternSpacing}mm
                                    </div>
                                  </div>
                                  <div className="p-3 bg-paper-100 rounded-lg">
                                    <div className="text-xs text-ink-400 mb-1">厚度</div>
                                    <div className="text-lg font-semibold text-ink-700">
                                      {selectedPaper.thickness}mm
                                    </div>
                                  </div>
                                  <div className="p-3 bg-paper-100 rounded-lg">
                                    <div className="text-xs text-ink-400 mb-1">pH值</div>
                                    <div className="text-lg font-semibold text-ink-700">
                                      {selectedPaper.pHValue}
                                    </div>
                                  </div>
                                  <div className="p-3 bg-paper-100 rounded-lg">
                                    <div className="text-xs text-ink-400 mb-1">库存</div>
                                    <div className="text-lg font-semibold text-ink-700">
                                      {selectedPaper.stockQuantity} {selectedPaper.unit}
                                    </div>
                                  </div>
                                </div>

                                <div className="mt-3 p-3 bg-paper-100 rounded-lg">
                                  <div className="text-xs text-ink-400 mb-1">纤维成分</div>
                                  <div className="text-sm font-medium text-ink-700">
                                    {selectedPaper.fiberComposition}
                                  </div>
                                </div>

                                <div className="mt-3 p-3 bg-paper-100 rounded-lg">
                                  <div className="text-xs text-ink-400 mb-2">色度Lab值</div>
                                  <div className="grid grid-cols-3 gap-2">
                                    <div className="text-center">
                                      <span className="text-xs text-seal-500">L* </span>
                                      <span className="font-mono font-semibold text-ink-700">
                                        {selectedPaper.colorL.toFixed(1)}
                                      </span>
                                    </div>
                                    <div className="text-center">
                                      <span className="text-xs text-bamboo-600">a* </span>
                                      <span className="font-mono font-semibold text-ink-700">
                                        {selectedPaper.colorA.toFixed(1)}
                                      </span>
                                    </div>
                                    <div className="text-center">
                                      <span className="text-xs text-warning-wood">b* </span>
                                      <span className="font-mono font-semibold text-ink-700">
                                        {selectedPaper.colorB.toFixed(1)}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>

                            {/* 备注 */}
                            {selectedPaper.notes && (
                              <Card>
                                <CardHeader>
                                  <CardTitle className="text-sm">备注</CardTitle>
                                </CardHeader>
                                <CardContent>
                                  <p className="text-sm text-ink-600">{selectedPaper.notes}</p>
                                </CardContent>
                              </Card>
                            )}
                          </div>
                        ),
                      },
                      {
                        key: 'records',
                        content: (
                          <div className="space-y-4 animate-fade-in">
                            {/* 出入库记录 */}
                            <Card>
                              <CardHeader>
                                <CardTitle className="text-sm">出入库记录</CardTitle>
                                <CardDescription>共 0 条记录</CardDescription>
                              </CardHeader>
                              <CardContent>
                                <div className="text-center py-8 text-ink-400">
                                  <Calendar size={32} className="mx-auto mb-2 opacity-50" />
                                  <p className="text-sm">暂无出入库记录</p>
                                </div>
                              </CardContent>
                            </Card>

                            {/* 快速入库/出库 */}
                            <Card>
                              <CardHeader>
                                <CardTitle className="text-sm">库存调整</CardTitle>
                              </CardHeader>
                              <CardContent>
                                <div className="flex items-center gap-3">
                                  <div className="flex-1">
                                    <label className="label-text">调整数量</label>
                                    <div className="flex items-center gap-2">
                                      <input
                                        type="number"
                                        defaultValue={10}
                                        id="stockAdjust"
                                        className="input-field"
                                        min="1"
                                      />
                                      <span className="text-ink-500 text-sm">{selectedPaper.unit}</span>
                                    </div>
                                  </div>
                                  <div className="flex flex-col gap-2 pt-6">
                                    <Button
                                      variant="primary"
                                      size="sm"
                                      onClick={() => {
                                        const input = document.getElementById('stockAdjust') as HTMLInputElement;
                                        const amount = parseInt(input.value) || 0;
                                        if (amount > 0) {
                                          updateStockQuantity(
                                            selectedPaper.id,
                                            selectedPaper.stockQuantity + amount
                                          );
                                        }
                                      }}
                                    >
                                      <ArrowUpRight size={14} className="mr-1" />
                                      入库
                                    </Button>
                                    <Button
                                      variant="secondary"
                                      size="sm"
                                      onClick={() => {
                                        const input = document.getElementById('stockAdjust') as HTMLInputElement;
                                        const amount = parseInt(input.value) || 0;
                                        if (amount > 0 && amount <= selectedPaper.stockQuantity) {
                                          updateStockQuantity(
                                            selectedPaper.id,
                                            selectedPaper.stockQuantity - amount
                                          );
                                        }
                                      }}
                                      disabled={selectedPaper.stockQuantity === 0}
                                    >
                                      <ArrowDownRight size={14} className="mr-1" />
                                      出库
                                    </Button>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          </div>
                        ),
                      },
                      {
                        key: 'usage',
                        content: (
                          <div className="space-y-4 animate-fade-in">
                            <Card>
                              <CardHeader>
                                <CardTitle className="text-sm">历史使用记录</CardTitle>
                                <CardDescription>共 {paperUsageRecords.length} 条记录</CardDescription>
                              </CardHeader>
                              <CardContent>
                                {paperUsageRecords.length === 0 ? (
                                  <div className="text-center py-8 text-ink-400">
                                    <FileText size={32} className="mx-auto mb-2 opacity-50" />
                                    <p className="text-sm">暂无使用记录</p>
                                  </div>
                                ) : (
                                  <div className="relative">
                                    <div className="absolute left-3 top-2 bottom-2 w-0.5 bg-paper-200" />
                                    <div className="space-y-4">
                                      {paperUsageRecords.map((record) => {
                                        const page = getPageById(record.pageId);
                                        const book = page ? getBookById(page.bookId) : null;
                                        return (
                                          <div key={record.id} className="relative pl-8">
                                            <div className="absolute left-1.5 top-1.5 w-3 h-3 rounded-full border-2 bg-paper-50 border-bamboo-500" />
                                            <div className="p-3 bg-paper-100 rounded-lg">
                                              <div className="flex items-center justify-between mb-1">
                                                <span className="text-sm font-medium text-ink-700">
                                                  {book?.name || '未知古籍'}
                                                </span>
                                                <span className="text-xs text-ink-400">
                                                  {record.restorationDate}
                                                </span>
                                              </div>
                                              <div className="text-xs text-ink-500 mb-2">
                                                {page ? `第${page.volumeNumber}册第${page.pageNumber}页` : ''}
                                                {' · '}
                                                修复师: {record.restorer}
                                              </div>
                                              <div className="flex items-center gap-2">
                                                <Badge variant="default" className="text-xs">
                                                  用纸 {record.paperUsed}{selectedPaper.unit}
                                                </Badge>
                                                <Badge variant="info" className="text-xs">
                                                  平整度 {record.flatnessScore}分
                                                </Badge>
                                              </div>
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                )}
                              </CardContent>
                            </Card>

                            {/* 使用统计 */}
                            <Card>
                              <CardHeader>
                                <CardTitle className="text-sm">使用统计</CardTitle>
                              </CardHeader>
                              <CardContent>
                                <div className="grid grid-cols-2 gap-4">
                                  <div className="p-4 bg-bamboo-50 rounded-lg border border-bamboo-200 text-center">
                                    <div className="text-2xl font-song font-bold text-bamboo-600">
                                      {paperUsageRecords.length}
                                    </div>
                                    <div className="text-xs text-bamboo-700 font-song">累计使用次数</div>
                                  </div>
                                  <div className="p-4 bg-azure-50 rounded-lg border border-azure-200 text-center">
                                    <div className="text-2xl font-song font-bold text-azure-600">
                                      {paperUsageRecords.reduce((sum, r) => sum + r.paperUsed, 0)}
                                    </div>
                                    <div className="text-xs text-azure-700 font-song">累计使用量</div>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          </div>
                        ),
                      },
                    ]}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 底部弹窗：配补用纸量清单生成 */}
      <Modal
        open={showGenerateModal}
        onClose={() => setShowGenerateModal(false)}
        title="配补用纸量清单生成"
        className="max-w-3xl"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowGenerateModal(false)}>
              取消
            </Button>
            <Button variant="secondary" onClick={handlePrint}>
              <Printer size={16} className="mr-2" />
              打印
            </Button>
            <Button variant="primary" onClick={handleExportList} disabled={!selectedBookId}>
              <Download size={16} className="mr-2" />
              导出清单
            </Button>
          </>
        }
      >
        <div className="space-y-6">
          {/* 选择古籍 */}
          <div>
            <label className="label-text">选择古籍</label>
            <Select
              value={selectedBookId || ''}
              onChange={(e) => setSelectedBookId(e.target.value || null)}
              options={[
                { value: '', label: '请选择古籍' },
                ...books.map((book) => ({
                  value: book.id,
                  label: `${book.name}（${book.dynasty}代）`,
                })),
              ]}
            />
          </div>

          {/* 预计修复页数 */}
          {selectedBookId && (
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 bg-paper-100 rounded-lg text-center">
                <div className="text-2xl font-song font-bold text-ink-700">
                  {pages.filter((p) => p.bookId === selectedBookId).length}
                </div>
                <div className="text-xs text-ink-500 font-song">总页数</div>
              </div>
              <div className="p-4 bg-amber-50 rounded-lg border border-amber-200 text-center">
                <div className="text-2xl font-song font-bold text-amber-600">
                  {pages.filter(
                    (p) => p.bookId === selectedBookId && (p.status === '待修复' || p.status === '修复中')
                  ).length}
                </div>
                <div className="text-xs text-amber-700 font-song">待修复页数</div>
              </div>
              <div className="p-4 bg-bamboo-50 rounded-lg border border-bamboo-200 text-center">
                <div className="text-2xl font-song font-bold text-bamboo-600">
                  {pages.filter(
                    (p) => p.bookId === selectedBookId && (p.status === '已修复' || p.status === '已归档')
                  ).length}
                </div>
                <div className="text-xs text-bamboo-700 font-song">已修复页数</div>
              </div>
            </div>
          )}

          {/* 配纸用量计算结果 */}
          {selectedBookId && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-song font-medium text-ink-700 flex items-center gap-2">
                  <Calculator size={18} className="text-ink-500" />
                  配纸用量清单预览
                </h4>
                <Badge variant="info">
                  共 {paperUsage.length} 种补纸
                </Badge>
              </div>

              <div className="overflow-x-auto rounded-lg border border-paper-200">
                <table className="w-full text-sm">
                  <thead className="bg-paper-100">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium text-ink-600">批次号</th>
                      <th className="px-4 py-3 text-left font-medium text-ink-600">朝代</th>
                      <th className="px-4 py-3 text-left font-medium text-ink-600">纸种</th>
                      <th className="px-4 py-3 text-center font-medium text-ink-600">所需数量</th>
                      <th className="px-4 py-3 text-center font-medium text-ink-600">单位</th>
                      <th className="px-4 py-3 text-center font-medium text-ink-600">库位</th>
                      <th className="px-4 py-3 text-center font-medium text-ink-600">当前库存</th>
                      <th className="px-4 py-3 text-center font-medium text-ink-600">状态</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-paper-200">
                    {paperUsage.map((item, index) => {
                      const category = getCategoryById(item.paper.categoryId);
                      const isEnough = item.paper.stockQuantity >= item.count;
                      return (
                        <tr key={item.paper.id} className={!isEnough ? 'bg-seal-50/50' : ''}>
                          <td className="px-4 py-3 font-mono text-xs text-ink-700">
                            {item.paper.batchNumber}
                          </td>
                          <td className="px-4 py-3 text-ink-700">{category?.dynasty || '-'}</td>
                          <td className="px-4 py-3 text-ink-700">{category?.paperType || '-'}</td>
                          <td className="px-4 py-3 text-center font-semibold text-ink-700">
                            {item.count}
                          </td>
                          <td className="px-4 py-3 text-center text-ink-600">{item.paper.unit}</td>
                          <td className="px-4 py-3 text-center text-ink-600">
                            {item.paper.storageLocation}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={cn(
                              'font-medium',
                              !isEnough ? 'text-seal-600' : 'text-bamboo-600'
                            )}>
                              {item.paper.stockQuantity}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            {isEnough ? (
                              <Badge variant="success">
                                <CheckCircle2 size={12} className="mr-1" />
                                充足
                              </Badge>
                            ) : (
                              <Badge variant="danger">
                                <AlertTriangle size={12} className="mr-1" />
                                不足
                              </Badge>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* 总计 */}
              <div className="flex items-center justify-between p-4 bg-paper-100 rounded-lg">
                <div className="flex items-center gap-2 text-ink-600">
                  <Layers size={18} />
                  <span className="font-medium">总计需要补纸</span>
                </div>
                <div className="text-2xl font-song font-bold text-ink-700">
                  {paperUsage.reduce((sum, item) => sum + item.count, 0)}
                  <span className="text-sm font-normal text-ink-500 ml-1">张</span>
                </div>
              </div>

              {/* 库存不足提示 */}
              {paperUsage.some((item) => item.paper.stockQuantity < item.count) && (
                <div className="p-4 bg-amber-50 rounded-lg border border-amber-200 flex items-start gap-3">
                  <AlertTriangle size={20} className="text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-amber-800">库存不足提醒</p>
                    <p className="text-sm text-amber-700 mt-1">
                      部分补纸库存不足，请及时采购或调整配纸方案。
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {!selectedBookId && (
            <div className="text-center py-12 text-ink-400">
              <BookOpen size={40} className="mx-auto mb-3 opacity-50" />
              <p>请选择古籍以生成配纸用量清单</p>
            </div>
          )}
        </div>
      </Modal>

      {/* 新增补纸弹窗 */}
      <Modal
        open={showNewPaperModal}
        onClose={() => setShowNewPaperModal(false)}
        title="新增补纸"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowNewPaperModal(false)}>
              取消
            </Button>
            <Button variant="primary" onClick={handleAddNewPaper}>
              <Plus size={16} className="mr-2" />
              新增
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label-text">批次号 *</label>
              <input
                type="text"
                value={newPaper.batchNumber}
                onChange={(e) => setNewPaper({ ...newPaper, batchNumber: e.target.value })}
                className="input-field"
                placeholder="如：BATCH-2024-001"
              />
            </div>
            <div>
              <label className="label-text">库位</label>
              <input
                type="text"
                value={newPaper.storageLocation}
                onChange={(e) => setNewPaper({ ...newPaper, storageLocation: e.target.value })}
                className="input-field"
                placeholder="如：A-01-01"
              />
            </div>
          </div>

          <div>
            <label className="label-text">纤维成分</label>
            <input
              type="text"
              value={newPaper.fiberComposition}
              onChange={(e) => setNewPaper({ ...newPaper, fiberComposition: e.target.value })}
              className="input-field"
              placeholder="如：青檀皮、沙田稻草"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="label-text">帘纹间距 (mm)</label>
              <input
                type="number"
                step="0.1"
                value={newPaper.curtainPatternSpacing}
                onChange={(e) => setNewPaper({ ...newPaper, curtainPatternSpacing: parseFloat(e.target.value) || 0 })}
                className="input-field"
              />
            </div>
            <div>
              <label className="label-text">厚度 (mm)</label>
              <input
                type="number"
                step="0.01"
                value={newPaper.thickness}
                onChange={(e) => setNewPaper({ ...newPaper, thickness: parseFloat(e.target.value) || 0 })}
                className="input-field"
              />
            </div>
            <div>
              <label className="label-text">pH值</label>
              <input
                type="number"
                step="0.1"
                value={newPaper.pHValue}
                onChange={(e) => setNewPaper({ ...newPaper, pHValue: parseFloat(e.target.value) || 0 })}
                className="input-field"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="label-text">色度 L*</label>
              <input
                type="number"
                step="0.1"
                value={newPaper.colorL}
                onChange={(e) => setNewPaper({ ...newPaper, colorL: parseFloat(e.target.value) || 0 })}
                className="input-field"
              />
            </div>
            <div>
              <label className="label-text">色度 a*</label>
              <input
                type="number"
                step="0.1"
                value={newPaper.colorA}
                onChange={(e) => setNewPaper({ ...newPaper, colorA: parseFloat(e.target.value) || 0 })}
                className="input-field"
              />
            </div>
            <div>
              <label className="label-text">色度 b*</label>
              <input
                type="number"
                step="0.1"
                value={newPaper.colorB}
                onChange={(e) => setNewPaper({ ...newPaper, colorB: parseFloat(e.target.value) || 0 })}
                className="input-field"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label-text">库存量</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={newPaper.stockQuantity}
                  onChange={(e) => setNewPaper({ ...newPaper, stockQuantity: parseInt(e.target.value) || 0 })}
                  className="input-field"
                  min="0"
                />
                <span className="text-ink-500 text-sm">{newPaper.unit}</span>
              </div>
            </div>
            <div>
              <label className="label-text">单位</label>
              <Select
                value={newPaper.unit}
                onChange={(e) => setNewPaper({ ...newPaper, unit: e.target.value })}
                options={[
                  { value: '张', label: '张' },
                  { value: '卷', label: '卷' },
                  { value: '令', label: '令' },
                  { value: '米', label: '米' },
                ]}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label-text">入库日期</label>
              <input
                type="date"
                value={newPaper.purchaseDate}
                onChange={(e) => setNewPaper({ ...newPaper, purchaseDate: e.target.value })}
                className="input-field"
              />
            </div>
            <div>
              <label className="label-text">供应商</label>
              <input
                type="text"
                value={newPaper.supplier}
                onChange={(e) => setNewPaper({ ...newPaper, supplier: e.target.value })}
                className="input-field"
                placeholder="如：安徽泾县宣纸厂"
              />
            </div>
          </div>

          <div>
            <label className="label-text">备注</label>
            <textarea
              value={newPaper.notes}
              onChange={(e) => setNewPaper({ ...newPaper, notes: e.target.value })}
              className="input-field min-h-[80px] resize-none"
              placeholder="记录补纸的特殊说明、来源、质量情况等..."
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default PaperLibrary;
