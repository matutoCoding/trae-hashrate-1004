import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  MousePointer2,
  PenTool,
  Square,
  Undo2,
  Redo2,
  Trash2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Save,
  FileText,
  Download,
  AlertTriangle,
  CheckCircle,
  Info,
  Move,
} from 'lucide-react';
import { useAppStore } from '@/store';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Slider } from '@/components/ui/Slider';
import { Badge } from '@/components/ui/Badge';
import { AnnotationCanvas } from '@/components/business/AnnotationCanvas';
import { PHCompatibilityCard } from '@/components/business/PHCompatibilityCard';
import { RiskIndicator } from '@/components/business/RiskIndicator';
import { cn } from '@/lib/utils';
import type {
  DamageType,
  DamageArea,
  BookPage,
  TwistDirection,
  Point,
  RiskLevel,
} from '@/types';

type ToolType = 'select' | 'polygon' | 'rectangle';

interface AnnotationArea {
  id: string;
  type: DamageType;
  points: Point[];
  area: number;
}

const DAMAGE_TYPES: { value: DamageType | '其他'; label: string; color: string }[] = [
  { value: '虫蛀', label: '虫蛀', color: '#C83C23' },
  { value: '霉蚀', label: '霉斑', color: '#6B6B6B' },
  { value: '酸化', label: '絮化', color: '#D4A017' },
  { value: '撕裂', label: '撕裂', color: '#2E4A62' },
  { value: '缺角', label: '缺角', color: '#6B8E23' },
  { value: '折痕', label: '其他', color: '#7D6B48' },
];

const getPositionDescription = (points: Point[]): string => {
  const centerX = points.reduce((sum, p) => sum + p.x, 0) / points.length;
  const centerY = points.reduce((sum, p) => sum + p.y, 0) / points.length;

  let position = '';
  if (centerY < 300) position += '上';
  else if (centerY < 600) position += '中';
  else position += '下';

  if (centerX < 200) position += '左';
  else if (centerX < 400) position += '中';
  else position += '右';

  return position + '部';
};

const calculateLapWidth = (area: number): number => {
  const baseWidth = Math.sqrt(area) * 0.15;
  return Math.max(2, Math.min(8, Math.round(baseWidth)));
};

const suggestTwistDirection = (area: number): TwistDirection => {
  return area > 50 ? '逆时针' : '顺时针';
};

const calculatePatchSize = (points: Point[]): { width: number; height: number } => {
  const xs = points.map(p => p.x);
  const ys = points.map(p => p.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const lap = 10;
  return {
    width: Math.round(maxX - minX + lap * 2),
    height: Math.round(maxY - minY + lap * 2),
  };
};

export const DamageAnnotation: React.FC = () => {
  const {
    pages,
    damageAreas,
    paperStocks,
    addDamageArea,
    updateDamageArea,
    deleteDamageArea,
    getDamageAreasByPage,
    getPageById,
    getBookById,
    getPaperById,
    currentPageId,
    setCurrentPage,
    updatePage,
  } = useAppStore();

  const [selectedPageId, setSelectedPageId] = useState<string>(currentPageId || pages[0]?.id || '');
  const [damageType, setDamageType] = useState<DamageType>('虫蛀');
  const [selectedAreaId, setSelectedAreaId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedPaperId, setSelectedPaperId] = useState<string | null>(null);

  const currentPage = getPageById(selectedPageId);
  const currentBook = currentPage ? getBookById(currentPage.bookId) : null;
  const pageDamageAreas = currentPage ? getDamageAreasByPage(currentPage.id) : [];
  const selectedPaper = selectedPaperId ? getPaperById(selectedPaperId) : null;

  const [annotations, setAnnotations] = useState<AnnotationArea[]>([]);
  const [history, setHistory] = useState<AnnotationArea[][]>([[]]);
  const [historyIndex, setHistoryIndex] = useState(0);

  useEffect(() => {
    if (currentPage) {
      const existingAnnotations: AnnotationArea[] = pageDamageAreas.map(area => ({
        id: area.id,
        type: area.type,
        points: area.polygonPoints,
        area: area.area,
      }));
      setAnnotations(existingAnnotations);
      setHistory([existingAnnotations]);
      setHistoryIndex(0);
      setSelectedAreaId(null);
    }
  }, [currentPage?.id]);

  const selectedArea = useMemo(() => {
    return annotations.find(a => a.id === selectedAreaId) || null;
  }, [annotations, selectedAreaId]);

  const selectedDamageArea = useMemo(() => {
    return selectedAreaId ? damageAreas.find(d => d.id === selectedAreaId) : null;
  }, [damageAreas, selectedAreaId]);

  const pushHistory = useCallback((newAnnotations: AnnotationArea[]) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newAnnotations);
    if (newHistory.length > 50) {
      newHistory.shift();
    }
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [history, historyIndex]);

  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setAnnotations(history[newIndex]);
      setSelectedAreaId(null);
    }
  }, [historyIndex, history]);

  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setAnnotations(history[newIndex]);
      setSelectedAreaId(null);
    }
  }, [historyIndex, history]);

  const handleAnnotationsChange = useCallback((newAnnotations: AnnotationArea[]) => {
    setAnnotations(newAnnotations);
    pushHistory(newAnnotations);
  }, [pushHistory]);

  const handleClearAll = () => {
    if (annotations.length === 0) return;
    if (!confirm('确定要清除所有标注吗？此操作不可撤销。')) return;
    setAnnotations([]);
    pushHistory([]);
    setSelectedAreaId(null);
  };

  const handleDeleteSelected = () => {
    if (!selectedAreaId) return;
    const newAnnotations = annotations.filter(a => a.id !== selectedAreaId);
    setAnnotations(newAnnotations);
    pushHistory(newAnnotations);
    setSelectedAreaId(null);
    deleteDamageArea(selectedAreaId);
  };

  const handleSaveAnnotations = async () => {
    if (!currentPage) return;
    setIsSaving(true);

    try {
      const existingIds = pageDamageAreas.map(d => d.id);

      for (const annotation of annotations) {
        const lapWidth = calculateLapWidth(annotation.area);
        const twistDirection = suggestTwistDirection(annotation.area);

        if (existingIds.includes(annotation.id)) {
          updateDamageArea(annotation.id, {
            type: annotation.type,
            polygonPoints: annotation.points,
            area: annotation.area,
            lapWidth,
            twistDirection,
          });
        } else {
          addDamageArea({
            pageId: currentPage.id,
            type: annotation.type,
            polygonPoints: annotation.points,
            area: annotation.area,
            lapWidth,
            twistDirection,
            patchPaperId: null,
            notes: '',
          });
        }
      }

      for (const existingId of existingIds) {
        if (!annotations.some(a => a.id === existingId)) {
          deleteDamageArea(existingId);
        }
      }

      updatePage(currentPage.id, { status: '待修复' });
      alert('标注已保存，页面状态更新为"待修复"');
    } catch (error) {
      console.error('保存失败:', error);
      alert('保存失败，请重试');
    } finally {
      setIsSaving(false);
    }
  };

  const handleGeneratePlan = () => {
    if (annotations.length === 0) {
      alert('请先标注破损区域');
      return;
    }

    const damageCount = annotations.length;
    const totalArea = annotations.reduce((sum, a) => sum + a.area, 0);

    const plan = `修复方案生成完成：

📋 修复概览
• 破损区域数量：${damageCount} 处
• 总破损面积：${totalArea.toFixed(2)} px²
• 预计用纸量：${Math.ceil(totalArea / 1000)} 张

🔧 修复建议
${annotations.map((a, i) => {
  const lapWidth = calculateLapWidth(a.area);
  const direction = suggestTwistDirection(a.area);
  const size = calculatePatchSize(a.points);
  return `
  ${i + 1}. ${a.type}（${getPositionDescription(a.points)}）
     • 面积：${a.area.toFixed(2)} px²
     • 搭口宽度：${lapWidth}mm
     • 下捻方向：${direction}
     • 补纸尺寸：${size.width}×${size.height}px
`;
}).join('')}

⚠️ 注意事项
• 请确保工作环境温湿度适宜
• 修复前先进行纸张脱酸处理
• 选用与原纸特性相近的补纸
• 修复后需平放阴干至少72小时`;

    alert(plan);
  };

  const handleExport = () => {
    if (!currentPage) return;

    const exportData = {
      pageId: currentPage.id,
      bookName: currentBook?.name,
      pageInfo: `第${currentPage.volumeNumber}册第${currentPage.pageNumber}页`,
      exportTime: new Date().toISOString(),
      annotations: annotations.map(a => ({
        id: a.id,
        type: a.type,
        area: a.area,
        position: getPositionDescription(a.points),
        lapWidth: calculateLapWidth(a.area),
        twistDirection: suggestTwistDirection(a.area),
        patchSize: calculatePatchSize(a.points),
        points: a.points,
      })),
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `damage-annotation-${currentPage.id}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);

    alert('标注数据已导出');
  };

  const getRiskLevel = (area: number): RiskLevel => {
    if (area < 20) return '低';
    if (area < 50) return '中';
    return '高';
  };

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col bg-paper-100">
      {/* 顶部标题 */}
      <div className="flex-shrink-0 p-4 bg-paper-50 border-b border-paper-200">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-song text-xl font-bold text-ink-700">破损标注</h1>
            <p className="text-sm text-ink-500 mt-0.5">在书页图像上标注破损区域并生成修复方案</p>
          </div>
          <div className="flex items-center gap-4">
            <Select
              className="w-72"
              value={selectedPageId}
              onChange={(e) => {
                setSelectedPageId(e.target.value);
                setCurrentPage(e.target.value);
              }}
              options={pages.map(p => {
                const book = getBookById(p.bookId);
                return {
                  value: p.id,
                  label: `${book?.name || '未知'} - 第${p.volumeNumber}册第${p.pageNumber}页 (${p.status})`,
                };
              })}
            />
            {currentBook && (
              <Badge variant="default">{currentBook.dynasty}代</Badge>
            )}
          </div>
        </div>
      </div>

      {/* 主内容区 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 左侧：工具栏 + 破损类型选择 */}
        <div className="w-56 flex-shrink-0 bg-paper-50 border-r border-paper-200 flex flex-col">
          {/* 工具选择 */}
          <div className="p-4 border-b border-paper-200">
            <div className="text-sm font-medium text-ink-500 mb-3">标注工具</div>
            <div className="flex gap-2">
              <button
                onClick={() => {}}
                className={cn(
                  'flex-1 p-3 rounded-lg border transition-all',
                  'bg-paper-50 text-ink-600 border-paper-300 hover:bg-paper-100 hover:border-paper-400'
                )}
                title="选择工具"
              >
                <MousePointer2 size={20} className="mx-auto mb-1" />
                <div className="text-xs">选择</div>
              </button>
              <button
                onClick={() => {}}
                className={cn(
                  'flex-1 p-3 rounded-lg border transition-all',
                  'bg-ink-600 text-paper-50 border-ink-700'
                )}
                title="多边形工具"
              >
                <PenTool size={20} className="mx-auto mb-1" />
                <div className="text-xs">多边形</div>
              </button>
              <button
                onClick={() => {}}
                className={cn(
                  'flex-1 p-3 rounded-lg border transition-all',
                  'bg-paper-50 text-ink-600 border-paper-300 hover:bg-paper-100 hover:border-paper-400'
                )}
                title="矩形工具"
              >
                <Square size={20} className="mx-auto mb-1" />
                <div className="text-xs">矩形</div>
              </button>
            </div>
          </div>

          {/* 操作按钮 */}
          <div className="p-4 border-b border-paper-200">
            <div className="text-sm font-medium text-ink-500 mb-3">操作</div>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="ghost" size="sm" onClick={handleUndo} disabled={historyIndex <= 0}>
                <Undo2 size={16} className="mr-1" />
                撤销
              </Button>
              <Button variant="ghost" size="sm" onClick={handleRedo} disabled={historyIndex >= history.length - 1}>
                <Redo2 size={16} className="mr-1" />
                重做
              </Button>
              <Button variant="ghost" size="sm" onClick={handleDeleteSelected} disabled={!selectedAreaId}>
                <Trash2 size={16} className="mr-1" />
                删除
              </Button>
              <Button variant="ghost" size="sm" onClick={handleClearAll} disabled={annotations.length === 0}>
                <RotateCcw size={16} className="mr-1" />
                清除
              </Button>
            </div>
          </div>

          {/* 破损类型 */}
          <div className="p-4 border-b border-paper-200 flex-1 overflow-y-auto">
            <div className="text-sm font-medium text-ink-500 mb-3">破损类型</div>
            <div className="space-y-2">
              {DAMAGE_TYPES.map(dt => (
                <button
                  key={dt.value}
                  onClick={() => setDamageType(dt.value as DamageType)}
                  className={cn(
                    'w-full flex items-center gap-3 p-2.5 rounded-lg border transition-all text-left',
                    damageType === dt.value
                      ? 'border-ink-600 bg-ink-50'
                      : 'border-paper-200 bg-paper-50 hover:border-paper-300 hover:bg-paper-100'
                  )}
                >
                  <div
                    className="w-4 h-4 rounded-full flex-shrink-0"
                    style={{ backgroundColor: dt.color }}
                  />
                  <span className={cn(
                    'text-sm font-medium',
                    damageType === dt.value ? 'text-ink-700' : 'text-ink-600'
                  )}>
                    {dt.label}
                  </span>
                  <span className="ml-auto text-xs text-ink-400">
                    {annotations.filter(a => a.type === dt.value).length}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* 缩放控制 */}
          <div className="p-4 border-t border-paper-200">
            <div className="text-sm font-medium text-ink-500 mb-3">缩放控制</div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" className="flex-1">
                <ZoomOut size={16} />
              </Button>
              <span className="text-sm font-medium text-ink-700 w-16 text-center">100%</span>
              <Button variant="ghost" size="sm" className="flex-1">
                <ZoomIn size={16} />
              </Button>
            </div>
          </div>
        </div>

        {/* 中间：标注画布区域 */}
        <div className="flex-1 overflow-hidden p-4">
          <AnnotationCanvas
            backgroundImage={currentPage?.frontImage}
            damageType={damageType}
            defaultAreas={annotations}
            pageId={currentPage?.id}
            onChange={handleAnnotationsChange}
            onSelectArea={setSelectedAreaId}
          />
        </div>

        {/* 右侧：标注列表 + 修复方案 */}
        <div className="w-80 flex-shrink-0 bg-paper-50 border-l border-paper-200 flex flex-col">
          {/* 标注列表 */}
          <div className="flex-1 overflow-hidden flex flex-col">
            <div className="p-4 border-b border-paper-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-song font-semibold text-ink-700">破损区域</h3>
                  <p className="text-xs text-ink-400 mt-0.5">共 {annotations.length} 处</p>
                </div>
                <Badge variant="info">{annotations.length}</Badge>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {annotations.length === 0 ? (
                <div className="text-center py-12 text-ink-400">
                  <Info size={32} className="mx-auto mb-2" />
                  <p className="text-sm">暂无标注</p>
                  <p className="text-xs mt-1">使用多边形工具在画布上标注破损区域</p>
                </div>
              ) : (
                annotations.map((annotation, index) => {
                  const dt = DAMAGE_TYPES.find(d => d.value === annotation.type);
                  const position = getPositionDescription(annotation.points);
                  const lapWidth = calculateLapWidth(annotation.area);
                  const riskLevel = getRiskLevel(annotation.area);

                  return (
                    <div
                      key={annotation.id}
                      onClick={() => setSelectedAreaId(annotation.id)}
                      className={cn(
                        'p-3 rounded-lg border cursor-pointer transition-all',
                        selectedAreaId === annotation.id
                          ? 'border-ink-500 bg-ink-50 shadow-md'
                          : 'border-paper-200 bg-paper-50 hover:border-paper-300 hover:bg-paper-100'
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className="w-3 h-3 rounded-full mt-1 flex-shrink-0"
                          style={{ backgroundColor: dt?.color || '#7D6B48' }}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium text-ink-700">
                              {index + 1}. {dt?.label || annotation.type}
                            </span>
                            <Badge
                              variant={riskLevel === '低' ? 'success' : riskLevel === '中' ? 'warning' : 'danger'}
                              className="text-xs"
                            >
                              {riskLevel}风险
                            </Badge>
                          </div>
                          <div className="text-xs text-ink-500 space-y-0.5">
                            <div className="flex justify-between">
                              <span>面积</span>
                              <span className="font-mono">{annotation.area.toFixed(1)} px²</span>
                            </div>
                            <div className="flex justify-between">
                              <span>位置</span>
                              <span>{position}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>搭口宽度</span>
                              <span>{lapWidth}mm</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* 选中区域的修复方案 */}
          {selectedArea && (
            <div className="border-t border-paper-200 bg-paper-100">
              <div className="p-4">
                <h3 className="font-song font-semibold text-ink-700 mb-4">修复方案</h3>

                <div className="space-y-4">
                  {/* 搭口宽度 */}
                  <div>
                    <label className="block text-sm font-medium text-ink-500 mb-2">
                      搭口宽度（自动计算）
                    </label>
                    <div className="flex items-center gap-3">
                      <Slider
                        min={1}
                        max={15}
                        step={0.5}
                        value={selectedDamageArea?.lapWidth || calculateLapWidth(selectedArea.area)}
                        onChange={(v) => {
                          if (selectedAreaId) {
                            updateDamageArea(selectedAreaId, { lapWidth: v });
                          }
                        }}
                        unit="mm"
                        className="flex-1"
                      />
                    </div>
                  </div>

                  {/* 下捻方向 */}
                  <div>
                    <label className="block text-sm font-medium text-ink-500 mb-2">
                      下捻方向建议
                    </label>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={selectedDamageArea?.twistDirection === '顺时针' ? 'info' : 'default'}
                        className="text-xs px-3 py-1.5"
                      >
                        {selectedDamageArea?.twistDirection || suggestTwistDirection(selectedArea.area)}
                      </Badge>
                      <span className="text-xs text-ink-400">
                        {selectedArea.area > 50
                          ? '大面积破损建议逆时针下捻'
                          : '小面积破损建议顺时针下捻'}
                      </span>
                    </div>
                  </div>

                  {/* 补纸裁切尺寸 */}
                  <div>
                    <label className="block text-sm font-medium text-ink-500 mb-2">
                      补纸裁切尺寸
                    </label>
                    {(() => {
                      const size = calculatePatchSize(selectedArea.points);
                      return (
                        <div className="p-3 bg-paper-50 rounded-lg border border-paper-200">
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <div className="text-xs text-ink-400">宽度</div>
                              <div className="font-mono font-semibold text-ink-700">{size.width} px</div>
                            </div>
                            <div>
                              <div className="text-xs text-ink-400">高度</div>
                              <div className="font-mono font-semibold text-ink-700">{size.height} px</div>
                            </div>
                          </div>
                          <div className="text-xs text-ink-400 mt-2">
                            含10px搭口余量
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  {/* 配纸选择 */}
                  <div>
                    <label className="block text-sm font-medium text-ink-500 mb-2">
                      选用配纸
                    </label>
                    <Select
                      placeholder="选择配纸"
                      value={selectedPaperId || ''}
                      onChange={(e) => {
                        setSelectedPaperId(e.target.value);
                        if (selectedAreaId && e.target.value) {
                          updateDamageArea(selectedAreaId, { patchPaperId: e.target.value });
                        }
                      }}
                      options={paperStocks.map(p => ({
                        value: p.id,
                        label: `${p.batchNumber} - 库存${p.stockQuantity}${p.unit}`,
                      }))}
                    />
                  </div>

                  {/* 酸碱度校验 */}
                  {selectedPaper && currentPage && (
                    <PHCompatibilityCard
                      originalPH={currentPage.pHValue}
                      patchPH={selectedPaper.pHValue}
                      showDetails={false}
                    />
                  )}

                  {/* 风险提示 */}
                  <RiskIndicator
                    warpingRisk={getRiskLevel(selectedArea.area)}
                    collapseRisk={selectedArea.area > 80 ? '中' : '低'}
                    showDetails={false}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 底部：操作按钮 */}
      <div className="flex-shrink-0 p-4 bg-paper-50 border-t border-paper-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-bamboo-600" />
              <span className="text-sm text-ink-500">
                已标注 <span className="font-medium text-ink-700">{annotations.length}</span> 处破损
              </span>
            </div>
            {selectedArea && (
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-azure-600" />
                <span className="text-sm text-ink-500">
                  选中 <span className="font-medium text-ink-700">{selectedArea.type}</span>，
                  面积 <span className="font-mono text-ink-700">{selectedArea.area.toFixed(1)} px²</span>
                </span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-3">
            <Button variant="secondary" onClick={handleClearAll} disabled={annotations.length === 0}>
              <Trash2 size={16} className="mr-2" />
              清除全部
            </Button>
            <Button variant="secondary" onClick={handleExport} disabled={annotations.length === 0}>
              <Download size={16} className="mr-2" />
              导出标注数据
            </Button>
            <Button
              variant="primary"
              onClick={handleSaveAnnotations}
              disabled={annotations.length === 0 || isSaving}
              loading={isSaving}
            >
              <Save size={16} className="mr-2" />
              保存标注
            </Button>
            <Button
              variant="primary"
              onClick={handleGeneratePlan}
              disabled={annotations.length === 0}
            >
              <FileText size={16} className="mr-2" />
              生成修复方案
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DamageAnnotation;
