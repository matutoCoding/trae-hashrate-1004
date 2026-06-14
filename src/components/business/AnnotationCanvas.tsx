import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  MousePointer2,
  PenTool,
  Square,
  Undo2,
  Redo2,
  ZoomIn,
  ZoomOut,
  Trash2,
  Download,
  Move,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import type { DamageType, Point, DamageArea } from '@/types';

type ToolType = 'select' | 'polygon' | 'rectangle' | 'pan';

interface AnnotationArea {
  id: string;
  type: DamageType;
  points: Point[];
  area: number;
}

interface AnnotationCanvasProps {
  backgroundImage?: string;
  damageType?: DamageType;
  onChange?: (areas: AnnotationArea[]) => void;
  onExport?: (areas: AnnotationArea[]) => void;
  defaultAreas?: AnnotationArea[];
  pageId?: string;
}

const DAMAGE_COLORS: Record<DamageType, { stroke: string; fill: string }> = {
  虫蛀: { stroke: '#C83C23', fill: 'rgba(200, 60, 35, 0.2)' },
  霉蚀: { stroke: '#6B6B6B', fill: 'rgba(107, 107, 107, 0.2)' },
  撕裂: { stroke: '#2E4A62', fill: 'rgba(46, 74, 98, 0.2)' },
  缺角: { stroke: '#6B8E23', fill: 'rgba(107, 142, 35, 0.2)' },
  酸化: { stroke: '#D4A017', fill: 'rgba(212, 160, 23, 0.2)' },
  折痕: { stroke: '#7D6B48', fill: 'rgba(125, 107, 72, 0.2)' },
  磨损: { stroke: '#A89B8D', fill: 'rgba(168, 155, 141, 0.2)' },
  水渍: { stroke: '#5C93BF', fill: 'rgba(92, 147, 191, 0.2)' },
};

const DAMAGE_TYPE_KEYS: DamageType[] = ['虫蛀', '霉蚀', '撕裂', '缺角', '酸化', '折痕', '磨损', '水渍'];

export const AnnotationCanvas: React.FC<AnnotationCanvasProps> = ({
  backgroundImage,
  damageType = '虫蛀',
  onChange,
  onExport,
  defaultAreas = [],
  pageId = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [tool, setTool] = useState<ToolType>('select');
  const [areas, setAreas] = useState<AnnotationArea[]>(defaultAreas);
  const [history, setHistory] = useState<AnnotationArea[][]>([defaultAreas]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [selectedAreaId, setSelectedAreaId] = useState<string | null>(null);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState<Point>({ x: 0, y: 0 });
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPoints, setCurrentPoints] = useState<Point[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<Point>({ x: 0, y: 0 });
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const imageRef = useRef<HTMLImageElement | null>(null);

  const pushHistory = useCallback((newAreas: AnnotationArea[]) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newAreas);
    if (newHistory.length > 50) {
      newHistory.shift();
    }
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [history, historyIndex]);

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setAreas(history[newIndex]);
      setSelectedAreaId(null);
      onChange?.(history[newIndex]);
    }
  }, [historyIndex, history, onChange]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setAreas(history[newIndex]);
      setSelectedAreaId(null);
      onChange?.(history[newIndex]);
    }
  }, [historyIndex, history, onChange]);

  const screenToImage = useCallback((screenX: number, screenY: number): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: (screenX - rect.left - offset.x) / scale,
      y: (screenY - rect.top - offset.y) / scale,
    };
  }, [offset, scale]);

  const calculatePolygonArea = (points: Point[]): number => {
    if (points.length < 3) return 0;
    let area = 0;
    for (let i = 0; i < points.length; i++) {
      const j = (i + 1) % points.length;
      area += points[i].x * points[j].y;
      area -= points[j].x * points[i].y;
    }
    return Math.abs(area) / 2;
  };

  const isPointInPolygon = (point: Point, polygon: Point[]): boolean => {
    if (polygon.length < 3) return false;
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i].x, yi = polygon[i].y;
      const xj = polygon[j].x, yj = polygon[j].y;
      const intersect = ((yi > point.y) !== (yj > point.y)) &&
        (point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi);
      if (intersect) inside = !inside;
    }
    return inside;
  };

  const hitTest = useCallback((x: number, y: number): string | null => {
    const point = screenToImage(x, y);
    for (let i = areas.length - 1; i >= 0; i--) {
      if (isPointInPolygon(point, areas[i].points)) {
        return areas[i].id;
      }
    }
    return null;
  }, [areas, screenToImage]);

  const finishDrawing = useCallback(() => {
    if (currentPoints.length >= 3) {
      const newArea: AnnotationArea = {
        id: `area-${Date.now()}`,
        type: damageType,
        points: [...currentPoints],
        area: calculatePolygonArea(currentPoints),
      };
      const newAreas = [...areas, newArea];
      setAreas(newAreas);
      pushHistory(newAreas);
      onChange?.(newAreas);
      setSelectedAreaId(newArea.id);
    }
    setIsDrawing(false);
    setCurrentPoints([]);
  }, [currentPoints, damageType, areas, pushHistory, onChange]);

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { clientX, clientY } = e;

    if (isSpacePressed || tool === 'pan') {
      setIsDragging(true);
      setDragStart({ x: clientX - offset.x, y: clientY - offset.y });
      return;
    }

    if (tool === 'select') {
      const hitId = hitTest(clientX, clientY);
      setSelectedAreaId(hitId);
      return;
    }

    if (tool === 'polygon') {
      if (!isDrawing) {
        setIsDrawing(true);
        const point = screenToImage(clientX, clientY);
        setCurrentPoints([point]);
      } else {
        const point = screenToImage(clientX, clientY);
        const firstPoint = currentPoints[0];
        const distance = Math.sqrt(
          Math.pow(point.x - firstPoint.x, 2) + Math.pow(point.y - firstPoint.y, 2)
        );
        if (distance < 15 && currentPoints.length >= 3) {
          finishDrawing();
        } else {
          setCurrentPoints([...currentPoints, point]);
        }
      }
      return;
    }

    if (tool === 'rectangle') {
      setIsDrawing(true);
      const point = screenToImage(clientX, clientY);
      setCurrentPoints([point]);
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { clientX, clientY } = e;

    if (isDragging) {
      setOffset({
        x: clientX - dragStart.x,
        y: clientY - dragStart.y,
      });
      return;
    }

    if (isDrawing && tool === 'rectangle' && currentPoints.length === 1) {
      const point = screenToImage(clientX, clientY);
      const start = currentPoints[0];
      setCurrentPoints([
        start,
        { x: point.x, y: start.y },
        point,
        { x: start.x, y: point.y },
      ]);
    }
  };

  const handleCanvasMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isDragging) {
      setIsDragging(false);
      return;
    }

    if (isDrawing && tool === 'rectangle' && currentPoints.length === 4) {
      finishDrawing();
    }
  };

  const handleCanvasDoubleClick = () => {
    if (isDrawing && tool === 'polygon' && currentPoints.length >= 3) {
      finishDrawing();
    }
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newScale = Math.max(0.2, Math.min(5, scale * delta));
    const canvas = canvasRef.current;
    if (canvas) {
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      const newOffsetX = e.clientX - rect.left - (mouseX - offset.x) * (newScale / scale);
      const newOffsetY = e.clientY - rect.top - (mouseY - offset.y) * (newScale / scale);
      setScale(newScale);
      setOffset({ x: newOffsetX, y: newOffsetY });
    }
  };

  const handleZoomIn = () => setScale(s => Math.min(5, s * 1.2));
  const handleZoomOut = () => setScale(s => Math.max(0.2, s / 1.2));
  const handleResetView = () => {
    setScale(1);
    setOffset({ x: 0, y: 0 });
  };

  const handleDeleteSelected = () => {
    if (selectedAreaId) {
      const newAreas = areas.filter(a => a.id !== selectedAreaId);
      setAreas(newAreas);
      pushHistory(newAreas);
      onChange?.(newAreas);
      setSelectedAreaId(null);
    }
  };

  const handleExport = () => {
    onExport?.(areas);
    const dataStr = JSON.stringify(areas, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `annotations-${pageId || Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat) {
        e.preventDefault();
        setIsSpacePressed(true);
      }
      if (e.code === 'Escape') {
        if (isDrawing) {
          setIsDrawing(false);
          setCurrentPoints([]);
        } else {
          setSelectedAreaId(null);
        }
      }
      if (e.code === 'Delete' || e.code === 'Backspace') {
        if (selectedAreaId && document.activeElement?.tagName !== 'INPUT') {
          handleDeleteSelected();
        }
      }
      if (e.ctrlKey && e.code === 'KeyZ' && !e.shiftKey) {
        e.preventDefault();
        undo();
      }
      if ((e.ctrlKey && e.shiftKey && e.code === 'KeyZ') || (e.ctrlKey && e.code === 'KeyY')) {
        e.preventDefault();
        redo();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setIsSpacePressed(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [selectedAreaId, isDrawing, undo, redo]);

  useEffect(() => {
    if (backgroundImage) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        imageRef.current = img;
        setImageSize({ width: img.width, height: img.height });
        setImageLoaded(true);
      };
      img.src = backgroundImage;
    }
  }, [backgroundImage]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, rect.width, rect.height);
    ctx.save();
    ctx.translate(offset.x, offset.y);
    ctx.scale(scale, scale);

    if (imageLoaded && imageRef.current) {
      ctx.drawImage(imageRef.current, 0, 0);
    } else {
      ctx.fillStyle = '#F5F0E6';
      ctx.fillRect(0, 0, rect.width / scale, rect.height / scale);
      ctx.strokeStyle = '#D4C49A';
      ctx.lineWidth = 1 / scale;
      for (let i = 0; i < rect.width / scale; i += 40) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, rect.height / scale);
        ctx.stroke();
      }
      for (let i = 0; i < rect.height / scale; i += 40) {
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(rect.width / scale, i);
        ctx.stroke();
      }
    }

    areas.forEach(area => {
      const colors = DAMAGE_COLORS[area.type] || DAMAGE_COLORS['虫蛀'];
      const isSelected = area.id === selectedAreaId;

      ctx.beginPath();
      if (area.points.length > 0) {
        ctx.moveTo(area.points[0].x, area.points[0].y);
        for (let i = 1; i < area.points.length; i++) {
          ctx.lineTo(area.points[i].x, area.points[i].y);
        }
        ctx.closePath();
      }

      ctx.fillStyle = colors.fill;
      ctx.fill();
      ctx.strokeStyle = colors.stroke;
      ctx.lineWidth = isSelected ? 3 / scale : 2 / scale;
      ctx.stroke();

      if (isSelected) {
        ctx.setLineDash([5 / scale, 5 / scale]);
        ctx.strokeStyle = '#2C1810';
        ctx.lineWidth = 1 / scale;
        ctx.stroke();
        ctx.setLineDash([]);

        area.points.forEach(point => {
          ctx.beginPath();
          ctx.arc(point.x, point.y, 4 / scale, 0, Math.PI * 2);
          ctx.fillStyle = '#2C1810';
          ctx.fill();
          ctx.strokeStyle = '#F5F0E6';
          ctx.lineWidth = 2 / scale;
          ctx.stroke();
        });
      }

      const centerX = area.points.reduce((sum, p) => sum + p.x, 0) / area.points.length;
      const centerY = area.points.reduce((sum, p) => sum + p.y, 0) / area.points.length;

      ctx.font = `${12 / scale}px "Noto Sans SC", sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      const labelText = `${area.type} ${Math.round(area.area)}px²`;
      const labelWidth = ctx.measureText(labelText).width + 16 / scale;
      const labelHeight = 24 / scale;

      ctx.fillStyle = 'rgba(44, 24, 16, 0.8)';
      ctx.beginPath();
      ctx.roundRect(centerX - labelWidth / 2, centerY - labelHeight / 2, labelWidth, labelHeight, 4 / scale);
      ctx.fill();

      ctx.fillStyle = '#F5F0E6';
      ctx.fillText(labelText, centerX, centerY);
    });

    if (isDrawing && currentPoints.length > 0) {
      const colors = DAMAGE_COLORS[damageType];

      ctx.beginPath();
      ctx.moveTo(currentPoints[0].x, currentPoints[0].y);
      for (let i = 1; i < currentPoints.length; i++) {
        ctx.lineTo(currentPoints[i].x, currentPoints[i].y);
      }
      if (currentPoints.length >= 3 && tool === 'rectangle') {
        ctx.closePath();
      }

      ctx.fillStyle = colors.fill;
      ctx.fill();
      ctx.strokeStyle = colors.stroke;
      ctx.lineWidth = 2 / scale;
      ctx.setLineDash([5 / scale, 5 / scale]);
      ctx.stroke();
      ctx.setLineDash([]);

      currentPoints.forEach((point, index) => {
        ctx.beginPath();
        ctx.arc(point.x, point.y, index === 0 ? 6 / scale : 4 / scale, 0, Math.PI * 2);
        ctx.fillStyle = index === 0 ? '#6B8E23' : '#C83C23';
        ctx.fill();
        ctx.strokeStyle = '#F5F0E6';
        ctx.lineWidth = 2 / scale;
        ctx.stroke();
      });
    }

    ctx.restore();

    if (isSpacePressed || isDragging) {
      ctx.fillStyle = 'rgba(44, 24, 16, 0.05)';
      ctx.fillRect(0, 0, rect.width, rect.height);
    }
  }, [areas, currentPoints, selectedAreaId, isDrawing, offset, scale, imageLoaded, damageType, tool, isSpacePressed, isDragging, imageSize]);

  useEffect(() => {
    setAreas(defaultAreas);
    setHistory([defaultAreas]);
    setHistoryIndex(0);
  }, [defaultAreas]);

  const selectedArea = areas.find(a => a.id === selectedAreaId);

  const ToolButton: React.FC<{
    active: boolean;
    onClick: () => void;
    icon: React.ReactNode;
    title: string;
  }> = ({ active, onClick, icon, title }) => (
    <button
      onClick={onClick}
      title={title}
      className={cn(
        'p-2 rounded-lg border transition-all duration-200',
        active
          ? 'bg-ink-600 text-paper-50 border-ink-700'
          : 'bg-paper-50 text-ink-600 border-paper-300 hover:bg-paper-100 hover:border-paper-400'
      )}
    >
      {icon}
    </button>
  );

  return (
    <div className="flex h-full bg-paper-100 rounded-lg overflow-hidden border border-paper-200">
      <div className="w-14 bg-paper-50 border-r border-paper-200 p-2 flex flex-col gap-2">
        <ToolButton
          active={tool === 'select'}
          onClick={() => setTool('select')}
          icon={<MousePointer2 size={20} />}
          title="选择工具 (V)"
        />
        <ToolButton
          active={tool === 'polygon'}
          onClick={() => setTool('polygon')}
          icon={<PenTool size={20} />}
          title="多边形工具 (P)"
        />
        <ToolButton
          active={tool === 'rectangle'}
          onClick={() => setTool('rectangle')}
          icon={<Square size={20} />}
          title="矩形工具 (R)"
        />
        <ToolButton
          active={tool === 'pan' || isSpacePressed}
          onClick={() => setTool(tool === 'pan' ? 'select' : 'pan')}
          icon={<Move size={20} />}
          title="平移工具 (H/空格)"
        />

        <div className="h-px bg-paper-200 my-1" />

        <ToolButton
          active={false}
          onClick={undo}
          icon={<Undo2 size={20} />}
          title="撤销 (Ctrl+Z)"
        />
        <ToolButton
          active={false}
          onClick={redo}
          icon={<Redo2 size={20} />}
          title="重做 (Ctrl+Y)"
        />

        <div className="h-px bg-paper-200 my-1" />

        <ToolButton
          active={false}
          onClick={handleZoomIn}
          icon={<ZoomIn size={20} />}
          title="放大"
        />
        <ToolButton
          active={false}
          onClick={handleZoomOut}
          icon={<ZoomOut size={20} />}
          title="缩小"
        />

        <div className="flex-1" />

        <ToolButton
          active={false}
          onClick={handleDeleteSelected}
          icon={<Trash2 size={20} />}
          title="删除选中 (Delete)"
        />
        <ToolButton
          active={false}
          onClick={handleExport}
          icon={<Download size={20} />}
          title="导出标注数据"
        />
      </div>

      <div className="flex-1 flex flex-col">
        <div className="h-10 bg-paper-50 border-b border-paper-200 px-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-sm text-ink-500">
              缩放: <span className="text-ink-700 font-medium">{Math.round(scale * 100)}%</span>
            </span>
            <span className="text-sm text-ink-500">
              标注数: <span className="text-ink-700 font-medium">{areas.length}</span>
            </span>
            {imageLoaded && (
              <span className="text-sm text-ink-500">
                图像: <span className="text-ink-700 font-medium">{imageSize.width}×{imageSize.height}</span>
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-ink-400">空格拖拽平移 | 滚轮缩放 | ESC取消</span>
            <Button variant="secondary" size="sm" onClick={handleResetView}>
              重置视图
            </Button>
          </div>
        </div>

        <div ref={containerRef} className="flex-1 relative overflow-hidden bg-paper-200">
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full"
            onMouseDown={handleCanvasMouseDown}
            onMouseMove={handleCanvasMouseMove}
            onMouseUp={handleCanvasMouseUp}
            onMouseLeave={handleCanvasMouseUp}
            onDoubleClick={handleCanvasDoubleClick}
            onWheel={handleWheel}
            style={{
              cursor: isSpacePressed || isDragging
                ? 'grabbing'
                : tool === 'pan'
                ? 'grab'
                : tool === 'select'
                ? 'default'
                : 'crosshair',
            }}
          />
        </div>
      </div>

      {selectedArea && (
        <Card className="w-64 m-2 border-paper-300 shadow-scroll animate-fade-in">
          <CardHeader className="py-3">
            <CardTitle className="text-base">属性面板</CardTitle>
          </CardHeader>
          <CardContent className="py-3 space-y-4">
            <div>
              <label className="label-text">破损类型</label>
              <div
                className="px-3 py-2 rounded-lg border font-medium"
                style={{
                  backgroundColor: DAMAGE_COLORS[selectedArea.type].fill,
                  borderColor: DAMAGE_COLORS[selectedArea.type].stroke,
                  color: DAMAGE_COLORS[selectedArea.type].stroke,
                }}
              >
                {selectedArea.type}
              </div>
            </div>
            <div>
              <label className="label-text">区域面积</label>
              <div className="px-3 py-2 bg-paper-100 rounded-lg border border-paper-200 font-mono text-ink-700">
                {Math.round(selectedArea.area)} px²
              </div>
            </div>
            <div>
              <label className="label-text">顶点数量</label>
              <div className="px-3 py-2 bg-paper-100 rounded-lg border border-paper-200 font-mono text-ink-700">
                {selectedArea.points.length} 个
              </div>
            </div>
            <div className="pt-2">
              <Button
                variant="danger"
                className="w-full"
                onClick={handleDeleteSelected}
              >
                <Trash2 size={16} className="mr-2" />
                删除此区域
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AnnotationCanvas;
