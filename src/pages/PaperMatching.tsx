import React, { useState, useMemo, useEffect } from 'react';
import { Search, Filter, ChevronRight, X, Package, MapPin, Clock, AlertTriangle, CheckCircle, FileText } from 'lucide-react';
import { useAppStore } from '@/store';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Slider } from '@/components/ui/Slider';
import { Badge } from '@/components/ui/Badge';
import { MatchScoreRing } from '@/components/business/MatchScoreRing';
import { RadarChart } from '@/components/business/RadarChart';
import { PHCompatibilityCard } from '@/components/business/PHCompatibilityCard';
import { RiskIndicator } from '@/components/business/RiskIndicator';
import { cn } from '@/lib/utils';
import type { MatchResult, PaperStock, BookPage, Dynasty, PaperType, MatchWeights, RiskLevel } from '@/types';

interface FilterState {
  dynasty: string;
  paperType: string;
  stockStatus: string;
}

const dynastyOptions = [
  { value: '', label: '全部朝代' },
  { value: '唐', label: '唐代' },
  { value: '宋', label: '宋代' },
  { value: '元', label: '元代' },
  { value: '明', label: '明代' },
  { value: '清', label: '清代' },
  { value: '现代', label: '现代' },
];

const paperTypeOptions = [
  { value: '', label: '全部纸种' },
  { value: '宣纸', label: '宣纸' },
  { value: '皮纸', label: '皮纸' },
  { value: '竹纸', label: '竹纸' },
  { value: '棉纸', label: '棉纸' },
  { value: '麻纸', label: '麻纸' },
];

const stockStatusOptions = [
  { value: '', label: '全部状态' },
  { value: 'inStock', label: '库存充足（≥50张）' },
  { value: 'lowStock', label: '库存紧张（<50张）' },
  { value: 'outOfStock', label: '缺货（0张）' },
];

const weightLabels: Record<keyof MatchWeights, string> = {
  curtainPattern: '帘纹间距',
  fiber: '纤维成分',
  thickness: '厚度',
  color: '色度',
  ph: 'pH值',
};

export const PaperMatching: React.FC = () => {
  const {
    pages,
    paperStocks,
    books,
    matchResults,
    matchWeights,
    setMatchWeights,
    calculateMatches,
    getPageById,
    getBookById,
    getPaperById,
    getCategoryById,
    getRecordsByPaper,
    addRestorationRecord,
    currentPageId,
    setCurrentPage,
  } = useAppStore();

  const [selectedPageId, setSelectedPageId] = useState<string>(currentPageId || pages[0]?.id || '');
  const [filters, setFilters] = useState<FilterState>({
    dynasty: '',
    paperType: '',
    stockStatus: '',
  });
  const [showDetailDrawer, setShowDetailDrawer] = useState(false);
  const [selectedPaperId, setSelectedPaperId] = useState<string | null>(null);
  const [isMatching, setIsMatching] = useState(false);
  const [localWeights, setLocalWeights] = useState<MatchWeights>(matchWeights);

  const currentPage = getPageById(selectedPageId);
  const currentBook = currentPage ? getBookById(currentPage.bookId) : null;
  const selectedPaper = selectedPaperId ? getPaperById(selectedPaperId) : null;
  const selectedPaperCategory = selectedPaper ? getCategoryById(selectedPaper.categoryId) : null;
  const paperUsageRecords = selectedPaperId ? getRecordsByPaper(selectedPaperId) : [];

  const totalWeight = useMemo(() => {
    return Object.values(localWeights).reduce((sum, w) => sum + w, 0);
  }, [localWeights]);

  useEffect(() => {
    if (currentPage && matchResults.length === 0) {
      handleStartMatching();
    }
  }, [currentPage?.id]);

  const filteredResults = useMemo(() => {
    return matchResults.filter(result => {
      const paper = getPaperById(result.paperId);
      if (!paper) return false;

      const category = getCategoryById(paper.categoryId);
      if (!category) return false;

      if (filters.dynasty && category.dynasty !== filters.dynasty) return false;
      if (filters.paperType && category.paperType !== filters.paperType) return false;

      if (filters.stockStatus === 'inStock' && paper.stockQuantity < 50) return false;
      if (filters.stockStatus === 'lowStock' && (paper.stockQuantity >= 50 || paper.stockQuantity === 0)) return false;
      if (filters.stockStatus === 'outOfStock' && paper.stockQuantity !== 0) return false;

      return true;
    });
  }, [matchResults, filters, getPaperById, getCategoryById]);

  const handleWeightChange = (key: keyof MatchWeights, value: number) => {
    const newWeights = { ...localWeights, [key]: value };
    setLocalWeights(newWeights);
  };

  const handleApplyWeights = () => {
    if (totalWeight !== 100) {
      alert('权重总和必须为100%');
      return;
    }
    setMatchWeights(localWeights);
    if (currentPage) {
      handleStartMatching();
    }
  };

  const handleStartMatching = () => {
    if (!currentPage) return;
    setIsMatching(true);
    setTimeout(() => {
      calculateMatches(currentPage);
      setIsMatching(false);
    }, 500);
  };

  const handleViewDetail = (paperId: string) => {
    setSelectedPaperId(paperId);
    setShowDetailDrawer(true);
  };

  const handleSelectPaper = async (paperId: string) => {
    if (!currentPage) return;

    const confirmed = confirm('确定选用此补纸吗？这将记录到修复记录中。');
    if (!confirmed) return;

    addRestorationRecord({
      pageId: currentPage.id,
      paperId,
      restorationDate: new Date().toISOString().split('T')[0],
      restorer: '当前修复师',
      paperUsed: 1,
      beforeImage: currentPage.frontImage,
      afterImage: '',
      flatnessScore: 0,
      warpingRisk: '低',
      collapseRisk: '低',
      notes: '系统自动记录选用配纸',
    });

    alert('配纸已成功选用！');
    setShowDetailDrawer(false);
  };

  const getRadarData = (result: MatchResult, paper: PaperStock, page: BookPage) => {
    return [
      { dimension: '帘纹间距', original: result.curtainPatternScore, patch: result.curtainPatternScore },
      { dimension: '纤维成分', original: result.fiberScore, patch: result.fiberScore },
      { dimension: '厚度', original: result.thicknessScore, patch: result.thicknessScore },
      { dimension: '色度', original: result.colorScore, patch: result.colorScore },
      { dimension: 'pH值', original: result.phScore, patch: result.phScore },
    ];
  };

  const getRiskLevel = (value: number): RiskLevel => {
    if (value >= 85) return '低';
    if (value >= 70) return '中';
    return '高';
  };

  return (
    <div className="min-h-full bg-paper-100 p-6">
      <div className="max-w-[1600px] mx-auto">
        <div className="mb-6">
          <h1 className="font-song text-2xl font-bold text-ink-700">配纸检索</h1>
          <p className="text-sm text-ink-500 mt-1">为待修复书页匹配最合适的补纸</p>
        </div>

        {/* 顶部：检索条件区 */}
        <div className="grid grid-cols-12 gap-6 mb-6">
          {/* 当前书页信息卡片 */}
          <div className="col-span-4">
            <Card>
              <CardHeader>
                <CardTitle>当前书页信息</CardTitle>
                <CardDescription>选择待匹配的书页</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Select
                  label="选择书页"
                  value={selectedPageId}
                  onChange={(e) => {
                    setSelectedPageId(e.target.value);
                    setCurrentPage(e.target.value);
                  }}
                  options={pages.map(p => {
                    const book = getBookById(p.bookId);
                    return {
                      value: p.id,
                      label: `${book?.name || '未知'} - 第${p.volumeNumber}册第${p.pageNumber}页`,
                    };
                  })}
                />

                {currentPage && currentBook && (
                  <div className="p-4 bg-paper-100 rounded-lg border border-paper-200">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="font-song font-semibold text-ink-700">{currentBook.name}</h3>
                        <p className="text-sm text-ink-500">第{currentPage.volumeNumber}册 · 第{currentPage.pageNumber}页</p>
                      </div>
                      <Badge variant="default">{currentBook.dynasty}代</Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-ink-400">帘纹间距</span>
                        <span className="text-ink-700 font-medium">{currentPage.curtainPatternSpacing}mm</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-ink-400">厚度</span>
                        <span className="text-ink-700 font-medium">{currentPage.thickness}mm</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-ink-400">纤维成分</span>
                        <span className="text-ink-700 font-medium">{currentPage.fiberComposition}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-ink-400">pH值</span>
                        <span className="text-ink-700 font-medium">{currentPage.pHValue}</span>
                      </div>
                      <div className="flex justify-between col-span-2">
                        <span className="text-ink-400">色度Lab</span>
                        <span className="text-ink-700 font-mono font-medium">
                          L*{currentPage.colorL.toFixed(1)} a*{currentPage.colorA.toFixed(1)} b*{currentPage.colorB.toFixed(1)}
                        </span>
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-paper-200">
                      <div className="flex items-center gap-2">
                        <Badge variant="info" className={cn(
                          currentPage.status === '待修复' ? 'bg-seal-500' :
                          currentPage.status === '修复中' ? 'bg-warning-wood' :
                          'bg-bamboo-600'
                        )}>
                          {currentPage.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* 权重设置面板 */}
          <div className="col-span-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>权重设置</CardTitle>
                    <CardDescription>调整各指标的匹配权重</CardDescription>
                  </div>
                  <Badge variant={totalWeight === 100 ? 'success' : 'danger'}>
                    总计: {totalWeight}%
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {(Object.keys(localWeights) as (keyof MatchWeights)[]).map(key => (
                  <div key={key} className="space-y-2">
                    <Slider
                      label={weightLabels[key]}
                      min={0}
                      max={50}
                      step={5}
                      value={localWeights[key]}
                      onChange={(v) => handleWeightChange(key, v)}
                      unit="%"
                    />
                  </div>
                ))}

                <Button
                  variant="primary"
                  className="w-full"
                  onClick={handleApplyWeights}
                  disabled={totalWeight !== 100}
                >
                  应用权重
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* 高级筛选 + 开始匹配 */}
          <div className="col-span-4 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>高级筛选</CardTitle>
                <CardDescription>缩小匹配范围</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Select
                  label="朝代筛选"
                  value={filters.dynasty}
                  onChange={(e) => setFilters(prev => ({ ...prev, dynasty: e.target.value }))}
                  options={dynastyOptions}
                />
                <Select
                  label="纸种筛选"
                  value={filters.paperType}
                  onChange={(e) => setFilters(prev => ({ ...prev, paperType: e.target.value }))}
                  options={paperTypeOptions}
                />
                <Select
                  label="库存状态"
                  value={filters.stockStatus}
                  onChange={(e) => setFilters(prev => ({ ...prev, stockStatus: e.target.value }))}
                  options={stockStatusOptions}
                />
              </CardContent>
            </Card>

            <Button
              variant="primary"
              size="lg"
              className="w-full"
              onClick={handleStartMatching}
              disabled={!currentPage || isMatching}
              loading={isMatching}
            >
              <Search size={18} className="mr-2" />
              开始匹配
            </Button>

            <div className="p-3 bg-paper-50 rounded-lg border border-paper-200">
              <div className="flex items-center justify-between text-sm">
                <span className="text-ink-500">匹配结果</span>
                <span className="font-medium text-ink-700">
                  {filteredResults.length} / {matchResults.length} 条
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 中部：匹配结果列表区 */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-song text-lg font-semibold text-ink-700">匹配结果</h2>
            <div className="flex items-center gap-2">
              <Filter size={16} className="text-ink-400" />
              <span className="text-sm text-ink-500">
                按匹配度降序排列
              </span>
            </div>
          </div>

          {filteredResults.length === 0 ? (
            <Card className="p-12 text-center">
              <div className="text-ink-400 mb-2">
                <Search size={48} className="mx-auto" />
              </div>
              <p className="text-ink-500">暂无匹配结果</p>
              <p className="text-sm text-ink-400 mt-1">请调整筛选条件或权重设置后重试</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredResults.map((result, index) => {
                const paper = getPaperById(result.paperId);
                const category = paper ? getCategoryById(paper.categoryId) : null;
                if (!paper || !category || !currentPage) return null;

                return (
                  <Card key={result.paperId} className="hover:shadow-scroll-hover transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex gap-6">
                        {/* 匹配度评分环 */}
                        <div className="flex-shrink-0">
                          <MatchScoreRing
                            score={result.overallScore}
                            size={140}
                            strokeWidth={10}
                            showLabel={true}
                          />
                        </div>

                        {/* 补纸信息 */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h3 className="font-song font-semibold text-lg text-ink-700">
                                {category.dynasty}代 {category.paperType}
                              </h3>
                              <p className="text-sm text-ink-500">{paper.batchNumber}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="default">{category.subType}</Badge>
                              <Badge
                                variant={paper.stockQuantity >= 50 ? 'success' : paper.stockQuantity > 0 ? 'warning' : 'danger'}
                              >
                                库存 {paper.stockQuantity}{paper.unit}
                              </Badge>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-sm mb-4">
                            <div className="flex justify-between">
                              <span className="text-ink-400">帘纹间距</span>
                              <span className="text-ink-700">{paper.curtainPatternSpacing}mm</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-ink-400">厚度</span>
                              <span className="text-ink-700">{paper.thickness}mm</span>
                            </div>
                            <div className="flex justify-between col-span-2">
                              <span className="text-ink-400">纤维成分</span>
                              <span className="text-ink-700">{paper.fiberComposition}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-ink-400">pH值</span>
                              <span className="text-ink-700">{paper.pHValue}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-ink-400">色度</span>
                              <span className="text-ink-700 font-mono text-xs">
                                L*{paper.colorL.toFixed(0)} a*{paper.colorA.toFixed(0)} b*{paper.colorB.toFixed(0)}
                              </span>
                            </div>
                          </div>

                          {/* 指标对比雷达图 */}
                          <div className="mb-4">
                            <RadarChart
                              data={getRadarData(result, paper, currentPage)}
                              height={200}
                              showLegend={false}
                              originalLabel="原纸"
                              patchLabel="补纸"
                            />
                          </div>

                          {/* 酸碱度相容性提示 */}
                          <div className="mb-4">
                            <PHCompatibilityCard
                              originalPH={currentPage.pHValue}
                              patchPH={paper.pHValue}
                              showDetails={false}
                            />
                          </div>

                          {/* 操作按钮 */}
                          <div className="flex gap-3">
                            <Button
                              variant="secondary"
                              className="flex-1"
                              onClick={() => handleViewDetail(result.paperId)}
                            >
                              <FileText size={16} className="mr-2" />
                              查看详情
                            </Button>
                            <Button
                              variant="primary"
                              className="flex-1"
                              onClick={() => handleSelectPaper(result.paperId)}
                              disabled={paper.stockQuantity === 0}
                            >
                              <CheckCircle size={16} className="mr-2" />
                              选用此纸
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* 右侧：配纸详情抽屉 */}
        {showDetailDrawer && selectedPaper && selectedPaperCategory && currentPage && (
          <div className="fixed inset-0 z-50 flex justify-end">
            <div
              className="absolute inset-0 bg-ink-900/30"
              onClick={() => setShowDetailDrawer(false)}
            />
            <div className="relative w-[480px] h-full bg-paper-50 shadow-2xl overflow-y-auto">
              <div className="sticky top-0 bg-paper-50 border-b border-paper-200 p-4 z-10">
                <div className="flex items-center justify-between">
                  <h2 className="font-song text-xl font-bold text-ink-700">配纸详情</h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowDetailDrawer(false)}
                    className="h-8 w-8 p-0"
                  >
                    <X size={18} />
                  </Button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* 基本信息 */}
                <Card>
                  <CardHeader>
                    <CardTitle>基本信息</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-ink-500">批次号</span>
                      <span className="font-mono text-ink-700">{selectedPaper.batchNumber}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-ink-500">朝代</span>
                      <Badge variant="default">{selectedPaperCategory.dynasty}代</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-ink-500">纸种</span>
                      <span className="text-ink-700">{selectedPaperCategory.paperType}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-ink-500">品级</span>
                      <span className="text-ink-700">{selectedPaperCategory.subType}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-ink-500">库存</span>
                      <span className={cn(
                        'font-medium',
                        selectedPaper.stockQuantity >= 50 ? 'text-bamboo-600' :
                        selectedPaper.stockQuantity > 0 ? 'text-warning-wood' : 'text-seal-600'
                      )}>
                        {selectedPaper.stockQuantity} {selectedPaper.unit}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin size={16} className="text-ink-400" />
                      <span className="text-ink-600">库存位置: {selectedPaper.storageLocation}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Package size={16} className="text-ink-400" />
                      <span className="text-ink-600">供应商: {selectedPaper.supplier}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock size={16} className="text-ink-400" />
                      <span className="text-ink-600">入库日期: {selectedPaper.purchaseDate}</span>
                    </div>
                  </CardContent>
                </Card>

                {/* 完整参数 */}
                <Card>
                  <CardHeader>
                    <CardTitle>物理参数</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-paper-100 rounded-lg">
                        <div className="text-xs text-ink-400 mb-1">帘纹间距</div>
                        <div className="text-lg font-semibold text-ink-700">{selectedPaper.curtainPatternSpacing}mm</div>
                      </div>
                      <div className="p-3 bg-paper-100 rounded-lg">
                        <div className="text-xs text-ink-400 mb-1">厚度</div>
                        <div className="text-lg font-semibold text-ink-700">{selectedPaper.thickness}mm</div>
                      </div>
                      <div className="p-3 bg-paper-100 rounded-lg">
                        <div className="text-xs text-ink-400 mb-1">pH值</div>
                        <div className="text-lg font-semibold text-ink-700">{selectedPaper.pHValue}</div>
                      </div>
                      <div className="p-3 bg-paper-100 rounded-lg">
                        <div className="text-xs text-ink-400 mb-1">纤维成分</div>
                        <div className="text-sm font-semibold text-ink-700">{selectedPaper.fiberComposition}</div>
                      </div>
                    </div>
                    <div className="p-3 bg-paper-100 rounded-lg">
                      <div className="text-xs text-ink-400 mb-1">色度Lab值</div>
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <span className="text-xs text-seal-500">L* </span>
                          <span className="font-mono font-semibold text-ink-700">{selectedPaper.colorL.toFixed(1)}</span>
                        </div>
                        <div>
                          <span className="text-xs text-bamboo-600">a* </span>
                          <span className="font-mono font-semibold text-ink-700">{selectedPaper.colorA.toFixed(1)}</span>
                        </div>
                        <div>
                          <span className="text-xs text-warning-wood">b* </span>
                          <span className="font-mono font-semibold text-ink-700">{selectedPaper.colorB.toFixed(1)}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* 酸碱度相容性 */}
                <PHCompatibilityCard
                  originalPH={currentPage.pHValue}
                  patchPH={selectedPaper.pHValue}
                />

                {/* 风险评估 */}
                <RiskIndicator
                  warpingRisk={getRiskLevel(matchResults.find(r => r.paperId === selectedPaperId)?.overallScore || 0)}
                  collapseRisk={getRiskLevel(matchResults.find(r => r.paperId === selectedPaperId)?.phScore || 0)}
                />

                {/* 历史使用记录 */}
                <Card>
                  <CardHeader>
                    <CardTitle>历史使用记录</CardTitle>
                    <CardDescription>共 {paperUsageRecords.length} 条记录</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {paperUsageRecords.length === 0 ? (
                      <div className="text-center py-6 text-ink-400">
                        <Clock size={32} className="mx-auto mb-2" />
                        <p>暂无使用记录</p>
                      </div>
                    ) : (
                      <div className="relative">
                        <div className="absolute left-3 top-2 bottom-2 w-0.5 bg-paper-200" />
                        <div className="space-y-4">
                          {paperUsageRecords.map((record, index) => {
                            const page = getPageById(record.pageId);
                            const book = page ? getBookById(page.bookId) : null;
                            return (
                              <div key={record.id} className="relative pl-8">
                                <div className={cn(
                                  'absolute left-1.5 top-1.5 w-3 h-3 rounded-full border-2 bg-paper-50',
                                  record.warpingRisk === '低' ? 'border-bamboo-600' :
                                  record.warpingRisk === '中' ? 'border-warning-wood' : 'border-seal-600'
                                )} />
                                <div className="p-3 bg-paper-100 rounded-lg">
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="text-sm font-medium text-ink-700">
                                      {book?.name || '未知书籍'}
                                    </span>
                                    <span className="text-xs text-ink-400">{record.restorationDate}</span>
                                  </div>
                                  <div className="text-xs text-ink-500 mb-2">
                                    修复师: {record.restorer} · 用纸: {record.paperUsed}{selectedPaper.unit}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Badge variant="default" className="text-xs">
                                      平整度 {record.flatnessScore}分
                                    </Badge>
                                    <Badge variant={record.warpingRisk === '低' ? 'success' : record.warpingRisk === '中' ? 'warning' : 'danger'} className="text-xs">
                                      翘曲{record.warpingRisk}
                                    </Badge>
                                    <Badge variant={record.collapseRisk === '低' ? 'success' : record.collapseRisk === '中' ? 'warning' : 'danger'} className="text-xs">
                                      塌陷{record.collapseRisk}
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

                {/* 备注 */}
                {selectedPaper.notes && (
                  <Card>
                    <CardHeader>
                      <CardTitle>备注信息</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-ink-600">{selectedPaper.notes}</p>
                    </CardContent>
                  </Card>
                )}

                {/* 底部操作 */}
                <div className="sticky bottom-0 bg-paper-50 pt-4 border-t border-paper-200">
                  <Button
                    variant="primary"
                    size="lg"
                    className="w-full"
                    onClick={() => handleSelectPaper(selectedPaperId!)}
                    disabled={selectedPaper.stockQuantity === 0}
                  >
                    <CheckCircle size={18} className="mr-2" />
                    选用此补纸
                  </Button>
                  {selectedPaper.stockQuantity === 0 && (
                    <p className="text-xs text-seal-500 text-center mt-2">
                      <AlertTriangle size={12} className="inline mr-1" />
                      库存不足，无法选用
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaperMatching;
