import React, { useState, useMemo } from 'react';
import {
  Search,
  Upload,
  Edit3,
  FileDown,
  BookOpen,
  Clock,
  User,
  Package,
  Calendar,
  ChevronRight,
  X,
  Save,
  AlertCircle,
  CheckCircle2,
  Layers,
} from 'lucide-react';
import { useAppStore } from '@/store';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { ImageComparison } from '@/components/business/ImageComparison';
import { Heatmap } from '@/components/business/Heatmap';
import { RiskIndicator } from '@/components/business/RiskIndicator';
import { Tabs, TabsContent } from '@/components/ui/Tabs';
import { cn } from '@/lib/utils';
import type { Book, BookPage, RestorationRecord, PaperStock, Dynasty, PageStatus } from '@/types';

const mockBeforeImage = 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=800&h=600&fit=crop';
const mockAfterImage = 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800&h=600&fit=crop';

const getStatusVariant = (status: PageStatus): 'success' | 'warning' | 'danger' | 'info' | 'default' => {
  const variants: Record<PageStatus, 'success' | 'warning' | 'danger' | 'info' | 'default'> = {
    '待检测': 'info',
    '已检测': 'default',
    '待修复': 'warning',
    '修复中': 'warning',
    '已修复': 'success',
    '已归档': 'success',
  };
  return variants[status];
};

interface BookWithStatus extends Book {
  totalPages: number;
  restoredPages: number;
  status: PageStatus;
}

export const RestorationArchive: React.FC = () => {
  const {
    books,
    pages,
    paperStocks,
    restorationRecords,
    getBookById,
    getPageById,
    getPaperById,
    getCategoryById,
    getRecordsByPage,
    updateRestorationRecord,
    addRestorationRecord,
  } = useAppStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBookId, setSelectedBookId] = useState<string | null>(books[0]?.id || null);
  const [selectedPageId, setSelectedPageId] = useState<string | null>(null);
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState<Partial<RestorationRecord> | null>(null);
  const [activeTab, setActiveTab] = useState('timeline');

  const booksWithStatus = useMemo((): BookWithStatus[] => {
    return books.map((book) => {
      const bookPages = pages.filter((p) => p.bookId === book.id);
      const restoredCount = bookPages.filter(
        (p) => p.status === '已修复' || p.status === '已归档'
      ).length;

      let status: PageStatus = '待检测';
      if (restoredCount === bookPages.length && bookPages.length > 0) {
        status = '已归档';
      } else if (restoredCount > 0) {
        status = '修复中';
      } else if (bookPages.some((p) => p.status === '待修复')) {
        status = '待修复';
      } else if (bookPages.some((p) => p.status === '已检测')) {
        status = '已检测';
      }

      return {
        ...book,
        totalPages: bookPages.length,
        restoredPages: restoredCount,
        status,
      };
    }).filter((book) =>
      book.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      book.dynasty.includes(searchTerm)
    );
  }, [books, pages, searchTerm]);

  const selectedBook = selectedBookId ? getBookById(selectedBookId) : null;
  const selectedPages = selectedBookId
    ? pages.filter((p) => p.bookId === selectedBookId)
    : [];

  const allRecordsForBook = useMemo(() => {
    if (!selectedBookId) return [];
    const bookPageIds = selectedPages.map((p) => p.id);
    return restorationRecords
      .filter((r) => bookPageIds.includes(r.pageId))
      .sort((a, b) => new Date(b.restorationDate).getTime() - new Date(a.restorationDate).getTime());
  }, [selectedBookId, selectedPages, restorationRecords]);

  const selectedRecord = selectedRecordId
    ? restorationRecords.find((r) => r.id === selectedRecordId)
    : null;

  const selectedRecordPage = selectedRecord ? getPageById(selectedRecord.pageId) : null;
  const selectedRecordBook = selectedRecordPage ? getBookById(selectedRecordPage.bookId) : null;
  const selectedRecordPaper = selectedRecord ? getPaperById(selectedRecord.paperId) : null;
  const selectedRecordPaperCategory = selectedRecordPaper
    ? getCategoryById(selectedRecordPaper.categoryId)
    : null;

  const handleEditRecord = (record: RestorationRecord) => {
    setEditingRecord({ ...record });
    setShowEditModal(true);
  };

  const handleSaveRecord = () => {
    if (!editingRecord || !editingRecord.id) {
      if (editingRecord && selectedPageId) {
        addRestorationRecord({
          pageId: selectedPageId,
          paperId: editingRecord.paperId || paperStocks[0]?.id || '',
          restorationDate: editingRecord.restorationDate || new Date().toISOString().split('T')[0],
          restorer: editingRecord.restorer || '当前修复师',
          paperUsed: editingRecord.paperUsed || 1,
          beforeImage: editingRecord.beforeImage || mockBeforeImage,
          afterImage: editingRecord.afterImage || mockAfterImage,
          flatnessScore: editingRecord.flatnessScore || 85,
          warpingRisk: editingRecord.warpingRisk || '低',
          collapseRisk: editingRecord.collapseRisk || '低',
          notes: editingRecord.notes || '',
        });
      }
    } else {
      updateRestorationRecord(editingRecord.id, editingRecord);
    }
    setShowEditModal(false);
    setEditingRecord(null);
  };

  const handleExportReport = () => {
    if (!selectedRecord) return;

    const report = `
古籍修复报告
============
生成时间: ${new Date().toLocaleString('zh-CN')}

古籍信息
--------
书名: ${selectedRecordBook?.name || '未知'}
朝代: ${selectedRecordBook?.dynasty || '未知'}
册数: 第${selectedRecordPage?.volumeNumber || '?'}册 第${selectedRecordPage?.pageNumber || '?'}页

修复信息
--------
修复日期: ${selectedRecord.restorationDate}
修复师: ${selectedRecord.restorer}
配纸批次: ${selectedRecordPaper?.batchNumber || '未知'}
配纸类型: ${selectedRecordPaperCategory ? `${selectedRecordPaperCategory.dynasty}代${selectedRecordPaperCategory.paperType}` : '未知'}
用纸量: ${selectedRecord.paperUsed}${selectedRecordPaper?.unit || '张'}

修复参数
--------
平整度评分: ${selectedRecord.flatnessScore}分
翘曲风险: ${selectedRecord.warpingRisk}
塌陷风险: ${selectedRecord.collapseRisk}

修复备注
--------
${selectedRecord.notes || '无'}
    `.trim();

    const blob = new Blob([report], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `修复报告_${selectedRecordBook?.name || '古籍'}_${selectedRecord.restorationDate}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleUploadImage = (type: 'before' | 'after') => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e: Event) => {
      const target = e.target as HTMLInputElement;
      const file = target.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const result = event.target?.result as string;
          if (editingRecord) {
            setEditingRecord({
              ...editingRecord,
              [type === 'before' ? 'beforeImage' : 'afterImage']: result,
            });
          }
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  const generateHeatmapData = (score: number) => {
    const data = [];
    for (let y = 0; y < 8; y++) {
      for (let x = 0; x < 10; x++) {
        const centerDist = Math.sqrt(Math.pow(x - 4.5, 2) + Math.pow(y - 3.5, 2));
        const baseValue = score - 10 + Math.random() * 20;
        const edgeFactor = Math.max(0, (centerDist - 3) * 3);
        const value = Math.max(0, Math.min(100, baseValue - edgeFactor));
        data.push({ x, y, value: Math.round(value) });
      }
    }
    return data;
  };

  const totalPaperUsed = useMemo(() => {
    return allRecordsForBook.reduce((sum, r) => sum + r.paperUsed, 0);
  }, [allRecordsForBook]);

  return (
    <div className="min-h-full bg-paper-100 p-4 lg:p-6">
      <div className="max-w-[1800px] mx-auto">
        {/* 页面标题 */}
        <div className="mb-6 animate-fade-in">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-song text-2xl font-bold text-ink-700">修复档案</h1>
              <p className="text-sm text-ink-500 mt-1">查看和管理古籍修复记录</p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="secondary" onClick={() => {}}>
                <Upload size={16} className="mr-2" />
                上传图片
              </Button>
              <Button variant="primary" onClick={handleExportReport} disabled={!selectedRecord}>
                <FileDown size={16} className="mr-2" />
                导出报告
              </Button>
            </div>
          </div>
        </div>

        {/* 主内容区 - 四栏布局 */}
        <div className="grid grid-cols-12 gap-4 lg:gap-6">
          {/* 左侧：古籍书目列表 */}
          <div className="col-span-12 md:col-span-3 lg:col-span-2">
            <Card className="h-[calc(100vh-160px)] flex flex-col animate-fade-in">
              <CardHeader className="flex-shrink-0">
                <CardTitle className="text-base">古籍书目</CardTitle>
                <CardDescription>共 {booksWithStatus.length} 部</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col overflow-hidden p-0">
                <div className="px-4 pb-3 flex-shrink-0">
                  <Input
                    placeholder="搜索书名、朝代..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    prefix={<Search size={16} className="text-ink-400" />}
                  />
                </div>
                <div className="flex-1 overflow-y-auto scrollbar-thin px-2 pb-4">
                  {booksWithStatus.length === 0 ? (
                    <div className="text-center py-8 text-ink-400">
                      <BookOpen size={32} className="mx-auto mb-2 opacity-50" />
                      <p className="text-sm">暂无古籍</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {booksWithStatus.map((book) => (
                        <button
                          key={book.id}
                          onClick={() => {
                            setSelectedBookId(book.id);
                            setSelectedPageId(null);
                            setSelectedRecordId(null);
                          }}
                          className={cn(
                            'w-full p-3 rounded-lg text-left transition-all duration-200',
                            selectedBookId === book.id
                              ? 'bg-ink-600 text-paper-50 shadow-scroll'
                              : 'bg-paper-50 border border-paper-200 hover:border-ink-300'
                          )}
                        >
                          <div className="flex items-start justify-between mb-1">
                            <span className={cn(
                              'font-song font-medium text-sm truncate',
                              selectedBookId === book.id ? 'text-paper-50' : 'text-ink-700'
                            )}>
                              {book.name}
                            </span>
                            <ChevronRight size={14} className={cn(
                              'flex-shrink-0',
                              selectedBookId === book.id ? 'text-paper-300' : 'text-ink-400'
                            )} />
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <span className={selectedBookId === book.id ? 'text-paper-300' : 'text-ink-500'}>
                              {book.dynasty}代 · {book.totalVolumes}册
                            </span>
                            <Badge
                              variant={getStatusVariant(book.status)}
                              className="text-xs"
                            >
                              {book.status}
                            </Badge>
                          </div>
                          <div className={cn(
                            'mt-2 text-xs',
                            selectedBookId === book.id ? 'text-paper-300' : 'text-ink-400'
                          )}>
                            已修复 {book.restoredPages}/{book.totalPages} 页
                          </div>
                          <div className="w-full h-1 bg-paper-200/50 rounded-full mt-2 overflow-hidden">
                            <div
                              className="h-full bg-bamboo-500 rounded-full transition-all duration-500"
                              style={{
                                width: book.totalPages > 0
                                  ? `${(book.restoredPages / book.totalPages) * 100}%`
                                  : '0%',
                              }}
                            />
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 中间区域 */}
          <div className="col-span-12 md:col-span-9 lg:col-span-7 space-y-4 lg:space-y-6">
            {/* 中间上部：修复记录时间线 */}
            <Card className="animate-fade-in" style={{ animationDelay: '100ms' }}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Clock size={18} className="text-ink-500" />
                      修复记录时间线
                    </CardTitle>
                    <CardDescription>
                      {selectedBook
                        ? `${selectedBook.name} · 共 ${allRecordsForBook.length} 条记录`
                        : '请选择古籍查看修复记录'}
                    </CardDescription>
                  </div>
                  <Tabs
                    items={[
                      { key: 'timeline', label: '时间线视图' },
                      { key: 'list', label: '列表视图' },
                    ]}
                    activeKey={activeTab}
                    onChange={setActiveTab}
                    className="w-auto"
                  />
                </div>
              </CardHeader>
              <CardContent className="max-h-[400px] overflow-y-auto scrollbar-thin">
                {allRecordsForBook.length === 0 ? (
                  <div className="text-center py-12 text-ink-400">
                    <FileDown size={40} className="mx-auto mb-3 opacity-50" />
                    <p>暂无修复记录</p>
                    <p className="text-sm mt-1">选择古籍后可查看修复历史</p>
                  </div>
                ) : activeTab === 'timeline' ? (
                  <div className="relative">
                    <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-paper-200" />
                    <div className="space-y-6">
                      {allRecordsForBook.map((record, index) => {
                        const page = getPageById(record.pageId);
                        const paper = getPaperById(record.paperId);
                        const isSelected = selectedRecordId === record.id;

                        return (
                          <div
                            key={record.id}
                            className={cn(
                              'relative pl-10 cursor-pointer group',
                              isSelected && 'z-10'
                            )}
                            onClick={() => setSelectedRecordId(record.id)}
                          >
                            <div className={cn(
                              'absolute left-2.5 top-3 w-3 h-3 rounded-full border-2 bg-paper-50 transition-colors',
                              isSelected
                                ? 'border-ink-600 bg-ink-600'
                                : 'border-paper-400 group-hover:border-ink-400'
                            )} />
                            <div className={cn(
                              'p-4 rounded-lg border transition-all duration-200',
                              isSelected
                                ? 'bg-ink-50 border-ink-300 shadow-scroll'
                                : 'bg-paper-50 border-paper-200 group-hover:border-paper-300 group-hover:shadow-sm'
                            )}>
                              <div className="flex items-start justify-between mb-3">
                                <div>
                                  <div className="flex items-center gap-2 mb-1">
                                    <Calendar size={14} className="text-ink-400" />
                                    <span className="font-medium text-ink-700">
                                      {record.restorationDate}
                                    </span>
                                  </div>
                                  <p className="text-xs text-ink-500">
                                    {page ? `第${page.volumeNumber}册第${page.pageNumber}页` : ''}
                                  </p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Badge variant={getStatusVariant(page?.status || '待修复')} className="text-xs">
                                    {page?.status || '待修复'}
                                  </Badge>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleEditRecord(record);
                                    }}
                                  >
                                    <Edit3 size={14} />
                                  </Button>
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-2 text-xs">
                                <div className="flex items-center gap-1 text-ink-500">
                                  <User size={12} />
                                  <span>{record.restorer}</span>
                                </div>
                                <div className="flex items-center gap-1 text-ink-500">
                                  <Package size={12} />
                                  <span className="truncate">{paper?.batchNumber || '未知'}</span>
                                </div>
                                <div className="flex items-center gap-1 text-ink-500">
                                  <Layers size={12} />
                                  <span>用纸 {record.paperUsed} 张</span>
                                </div>
                                <div className="flex items-center gap-1 text-ink-500">
                                  <CheckCircle2 size={12} />
                                  <span>平整度 {record.flatnessScore}分</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-paper-100 sticky top-0">
                        <tr>
                          <th className="px-4 py-3 text-left font-medium text-ink-600">修复日期</th>
                          <th className="px-4 py-3 text-left font-medium text-ink-600">修复师</th>
                          <th className="px-4 py-3 text-left font-medium text-ink-600">页码</th>
                          <th className="px-4 py-3 text-left font-medium text-ink-600">配纸批次</th>
                          <th className="px-4 py-3 text-left font-medium text-ink-600">平整度</th>
                          <th className="px-4 py-3 text-left font-medium text-ink-600">状态</th>
                          <th className="px-4 py-3 text-left font-medium text-ink-600">操作</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-paper-200">
                        {allRecordsForBook.map((record) => {
                          const page = getPageById(record.pageId);
                          const paper = getPaperById(record.paperId);
                          return (
                            <tr
                              key={record.id}
                              className={cn(
                                'hover:bg-paper-100 transition-colors cursor-pointer',
                                selectedRecordId === record.id && 'bg-ink-50'
                              )}
                              onClick={() => setSelectedRecordId(record.id)}
                            >
                              <td className="px-4 py-3 text-ink-700">{record.restorationDate}</td>
                              <td className="px-4 py-3 text-ink-700">{record.restorer}</td>
                              <td className="px-4 py-3 text-ink-700">
                                {page ? `${page.volumeNumber}册${page.pageNumber}页` : '-'}
                              </td>
                              <td className="px-4 py-3 text-ink-700 font-mono text-xs">
                                {paper?.batchNumber || '-'}
                              </td>
                              <td className="px-4 py-3">
                                <span className={cn(
                                  'font-medium',
                                  record.flatnessScore >= 85 ? 'text-bamboo-600' :
                                  record.flatnessScore >= 70 ? 'text-amber-600' : 'text-seal-600'
                                )}>
                                  {record.flatnessScore}分
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <Badge variant={getStatusVariant(page?.status || '待修复')}>
                                  {page?.status || '待修复'}
                                </Badge>
                              </td>
                              <td className="px-4 py-3">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 px-2"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEditRecord(record);
                                  }}
                                >
                                  <Edit3 size={14} className="mr-1" />
                                  编辑
                                </Button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 中间下部：选中记录的详情 */}
            {selectedRecord && (
              <Card className="animate-slide-up">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>修复记录详情</CardTitle>
                      <CardDescription>
                        {selectedRecordBook?.name} · {selectedRecord.restorationDate}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="default">
                        配纸用量统计: {totalPaperUsed} 张
                      </Badge>
                      <Button variant="secondary" size="sm" onClick={() => handleEditRecord(selectedRecord)}>
                        <Edit3 size={14} className="mr-2" />
                        编辑记录
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* 影像对比区 */}
                  <div>
                    <h4 className="font-song font-medium text-ink-700 mb-3">修复影像对比</h4>
                    <ImageComparison
                      beforeImage={selectedRecord.beforeImage || mockBeforeImage}
                      afterImage={selectedRecord.afterImage || mockAfterImage}
                      beforeLabel="修复前"
                      afterLabel="修复后"
                    />
                  </div>

                  {/* 修复参数卡片 */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">修复参数对比</CardTitle>
                      </CardHeader>
                      <CardContent className="p-0">
                        <table className="w-full text-sm">
                          <thead className="bg-paper-100">
                            <tr>
                              <th className="px-4 py-2 text-left font-medium text-ink-600">指标</th>
                              <th className="px-4 py-2 text-center font-medium text-ink-600">原纸</th>
                              <th className="px-4 py-2 text-center font-medium text-ink-600">补纸</th>
                              <th className="px-4 py-2 text-center font-medium text-ink-600">偏差</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-paper-200">
                            {[
                              { name: '帘纹间距', original: selectedRecordPage?.curtainPatternSpacing, patch: selectedRecordPaper?.curtainPatternSpacing, unit: 'mm' },
                              { name: '厚度', original: selectedRecordPage?.thickness, patch: selectedRecordPaper?.thickness, unit: 'mm' },
                              { name: 'pH值', original: selectedRecordPage?.pHValue, patch: selectedRecordPaper?.pHValue, unit: '' },
                              { name: '色度L*', original: selectedRecordPage?.colorL, patch: selectedRecordPaper?.colorL, unit: '' },
                              { name: '色度a*', original: selectedRecordPage?.colorA, patch: selectedRecordPaper?.colorA, unit: '' },
                              { name: '色度b*', original: selectedRecordPage?.colorB, patch: selectedRecordPaper?.colorB, unit: '' },
                            ].map((item, index) => {
                              const diff = item.original !== undefined && item.patch !== undefined
                                ? (item.patch - item.original).toFixed(2)
                                : '-';
                              const isDiffSignificant = item.original !== undefined && item.patch !== undefined
                                ? Math.abs(item.patch - item.original) > item.original * 0.15
                                : false;
                              return (
                                <tr key={index} className="hover:bg-paper-50">
                                  <td className="px-4 py-2 text-ink-600">{item.name}</td>
                                  <td className="px-4 py-2 text-center text-ink-700">
                                    {item.original !== undefined ? `${item.original}${item.unit}` : '-'}
                                  </td>
                                  <td className="px-4 py-2 text-center text-ink-700">
                                    {item.patch !== undefined ? `${item.patch}${item.unit}` : '-'}
                                  </td>
                                  <td className={cn(
                                    'px-4 py-2 text-center font-mono',
                                    isDiffSignificant ? 'text-seal-600' : 'text-bamboo-600'
                                  )}>
                                    {diff !== '-' && diff !== undefined ? `${parseFloat(diff) > 0 ? '+' : ''}${diff}${item.unit}` : '-'}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">配纸用量统计</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between p-3 bg-paper-100 rounded-lg">
                            <span className="text-ink-600">本次修复用纸</span>
                            <span className="font-semibold text-ink-700">
                              {selectedRecord.paperUsed} {selectedRecordPaper?.unit || '张'}
                            </span>
                          </div>
                          <div className="flex items-center justify-between p-3 bg-paper-100 rounded-lg">
                            <span className="text-ink-600">本书累计用纸</span>
                            <span className="font-semibold text-ink-700">
                              {totalPaperUsed} {selectedRecordPaper?.unit || '张'}
                            </span>
                          </div>
                          <div className="flex items-center justify-between p-3 bg-bamboo-50 rounded-lg border border-bamboo-200">
                            <span className="text-bamboo-700">配纸批次</span>
                            <span className="font-semibold text-bamboo-700 font-mono">
                              {selectedRecordPaper?.batchNumber || '-'}
                            </span>
                          </div>
                          <div className="flex items-center justify-between p-3 bg-azure-50 rounded-lg border border-azure-200">
                            <span className="text-azure-700">纸张类型</span>
                            <span className="font-semibold text-azure-700">
                              {selectedRecordPaperCategory
                                ? `${selectedRecordPaperCategory.dynasty}代${selectedRecordPaperCategory.paperType}`
                                : '-'}
                            </span>
                          </div>
                          {selectedRecord.notes && (
                            <div className="p-3 bg-paper-100 rounded-lg">
                              <div className="text-xs text-ink-500 mb-1">修复备注</div>
                              <p className="text-sm text-ink-700">{selectedRecord.notes}</p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* 右侧：模拟预测区 */}
          <div className="col-span-12 lg:col-span-3 space-y-4 lg:space-y-6">
            <Card className="animate-fade-in" style={{ animationDelay: '200ms' }}>
              <CardHeader>
                <CardTitle className="text-base">模拟预测分析</CardTitle>
                <CardDescription>基于AI的修复效果预测</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* 平整度热力图 */}
                <Heatmap
                  data={selectedRecord ? generateHeatmapData(selectedRecord.flatnessScore) : undefined}
                  title="平整度热力图"
                  description="修复后页面平整度分布"
                  height={280}
                  showLegend={true}
                />

                {/* 风险指示器 */}
                <RiskIndicator
                  warpingRisk={selectedRecord?.warpingRisk || '低'}
                  collapseRisk={selectedRecord?.collapseRisk || '低'}
                  title="风险评估"
                  description="基于配纸参数的风险预测"
                />

                {/* 风险说明和修复建议 */}
                {selectedRecord && (selectedRecord.warpingRisk !== '低' || selectedRecord.collapseRisk !== '低') && (
                  <Card className="bg-amber-50 border-amber-200">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <AlertCircle size={20} className="text-amber-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <h5 className="font-medium text-amber-800 mb-2">修复建议</h5>
                          <ul className="space-y-1 text-sm text-amber-700">
                            {selectedRecord.warpingRisk === '高' && (
                              <li>• 建议使用稍稠糨糊，托裱后适当加压</li>
                            )}
                            {selectedRecord.warpingRisk === '中' && (
                              <li>• 注意控制环境湿度在50-60%</li>
                            )}
                            {selectedRecord.collapseRisk === '高' && (
                              <li>• 必须使用衬纸加固，建议双层托裱</li>
                            )}
                            {selectedRecord.collapseRisk === '中' && (
                              <li>• 建议使用稍厚补纸增强支撑</li>
                            )}
                            <li>• 修复后需平放阴干，避免悬挂</li>
                          </ul>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* 编辑修复记录模态框 */}
      <Modal
        open={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingRecord(null);
        }}
        title={editingRecord?.id ? '编辑修复记录' : '新增修复记录'}
        footer={
          <>
            <Button variant="secondary" onClick={() => {
              setShowEditModal(false);
              setEditingRecord(null);
            }}>
              取消
            </Button>
            <Button variant="primary" onClick={handleSaveRecord}>
              <Save size={16} className="mr-2" />
              保存
            </Button>
          </>
        }
      >
        {editingRecord && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-ink-500 mb-1">修复日期</label>
                <input
                  type="date"
                  value={editingRecord.restorationDate || ''}
                  onChange={(e) => setEditingRecord({ ...editingRecord, restorationDate: e.target.value })}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink-500 mb-1">修复师</label>
                <input
                  type="text"
                  value={editingRecord.restorer || ''}
                  onChange={(e) => setEditingRecord({ ...editingRecord, restorer: e.target.value })}
                  className="input-field"
                  placeholder="请输入修复师姓名"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-ink-500 mb-1">配纸批次</label>
                <select
                  value={editingRecord.paperId || ''}
                  onChange={(e) => setEditingRecord({ ...editingRecord, paperId: e.target.value })}
                  className="input-field-select"
                >
                  {paperStocks.map((paper) => (
                    <option key={paper.id} value={paper.id}>
                      {paper.batchNumber}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-ink-500 mb-1">用纸量</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={editingRecord.paperUsed || 1}
                    onChange={(e) => setEditingRecord({ ...editingRecord, paperUsed: parseInt(e.target.value) || 0 })}
                    className="input-field"
                    min="1"
                  />
                  <span className="text-ink-500">张</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-ink-500 mb-1">平整度评分</label>
                <input
                  type="number"
                  value={editingRecord.flatnessScore || 0}
                  onChange={(e) => setEditingRecord({ ...editingRecord, flatnessScore: parseInt(e.target.value) || 0 })}
                  className="input-field"
                  min="0"
                  max="100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink-500 mb-1">翘曲风险</label>
                <select
                  value={editingRecord.warpingRisk || '低'}
                  onChange={(e) => setEditingRecord({ ...editingRecord, warpingRisk: e.target.value as any })}
                  className="input-field-select"
                >
                  <option value="低">低</option>
                  <option value="中">中</option>
                  <option value="高">高</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-ink-500 mb-1">塌陷风险</label>
                <select
                  value={editingRecord.collapseRisk || '低'}
                  onChange={(e) => setEditingRecord({ ...editingRecord, collapseRisk: e.target.value as any })}
                  className="input-field-select"
                >
                  <option value="低">低</option>
                  <option value="中">中</option>
                  <option value="高">高</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-ink-500 mb-2">修复影像</label>
              <div className="grid grid-cols-2 gap-4">
                <div
                  className="relative aspect-[4/3] bg-paper-100 rounded-lg border-2 border-dashed border-paper-300 flex items-center justify-center cursor-pointer hover:border-ink-400 transition-colors overflow-hidden"
                  onClick={() => handleUploadImage('before')}
                >
                  {editingRecord.beforeImage ? (
                    <img src={editingRecord.beforeImage} alt="修复前" className="w-full h-full object-contain" />
                  ) : (
                    <div className="text-center text-ink-400">
                      <Upload size={24} className="mx-auto mb-2" />
                      <p className="text-sm">上传修复前图片</p>
                    </div>
                  )}
                  <div className="absolute top-2 left-2 px-2 py-0.5 bg-ink-600/80 text-paper-50 text-xs rounded">
                    修复前
                  </div>
                </div>
                <div
                  className="relative aspect-[4/3] bg-paper-100 rounded-lg border-2 border-dashed border-paper-300 flex items-center justify-center cursor-pointer hover:border-ink-400 transition-colors overflow-hidden"
                  onClick={() => handleUploadImage('after')}
                >
                  {editingRecord.afterImage ? (
                    <img src={editingRecord.afterImage} alt="修复后" className="w-full h-full object-contain" />
                  ) : (
                    <div className="text-center text-ink-400">
                      <Upload size={24} className="mx-auto mb-2" />
                      <p className="text-sm">上传修复后图片</p>
                    </div>
                  )}
                  <div className="absolute top-2 left-2 px-2 py-0.5 bg-bamboo-600/80 text-paper-50 text-xs rounded">
                    修复后
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-ink-500 mb-1">修复备注</label>
              <textarea
                value={editingRecord.notes || ''}
                onChange={(e) => setEditingRecord({ ...editingRecord, notes: e.target.value })}
                className="input-field min-h-[100px] resize-none"
                placeholder="请输入修复备注信息..."
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default RestorationArchive;
