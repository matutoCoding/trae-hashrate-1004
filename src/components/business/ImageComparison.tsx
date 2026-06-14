import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

interface ImageComparisonProps {
  beforeImage: string;
  afterImage: string;
  beforeLabel?: string;
  afterLabel?: string;
  className?: string;
  showControls?: boolean;
  allowZoom?: boolean;
  onSliderChange?: (position: number) => void;
}

export const ImageComparison: React.FC<ImageComparisonProps> = ({
  beforeImage,
  afterImage,
  beforeLabel = '修复前',
  afterLabel = '修复后',
  className,
  showControls = true,
  allowZoom = true,
  onSliderChange,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomPosition, setZoomPosition] = useState({ x: 50, y: 50 });
  const [isHovering, setIsHovering] = useState(false);
  const [beforeLoaded, setBeforeLoaded] = useState(false);
  const [afterLoaded, setAfterLoaded] = useState(false);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging || !containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      const newPosition = x * 100;
      setSliderPosition(newPosition);
      onSliderChange?.(newPosition);
    },
    [isDragging, onSliderChange]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleContainerMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!containerRef.current || !isZoomed) return;

      const rect = containerRef.current.getBoundingClientRect();
      setZoomPosition({
        x: ((e.clientX - rect.left) / rect.width) * 100,
        y: ((e.clientY - rect.top) / rect.height) * 100,
      });
    },
    [isZoomed]
  );

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const handleZoomIn = () => {
    setZoom((z) => Math.min(3, z + 0.5));
    setIsZoomed(true);
  };

  const handleZoomOut = () => {
    setZoom((z) => {
      const newZoom = Math.max(1, z - 0.5);
      if (newZoom === 1) setIsZoomed(false);
      return newZoom;
    });
  };

  const handleResetZoom = () => {
    setZoom(1);
    setIsZoomed(false);
  };

  const handleToggleZoom = () => {
    if (isZoomed) {
      handleResetZoom();
    } else {
      setZoom(2);
      setIsZoomed(true);
    }
  };

  const allLoaded = beforeLoaded && afterLoaded;

  return (
    <div
      className={cn(
        'relative bg-paper-100 rounded-lg overflow-hidden border border-paper-200',
        isDragging && 'cursor-col-resize',
        className
      )}
      ref={containerRef}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      onMouseMove={handleContainerMouseMove}
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            transform: isZoomed
              ? `scale(${zoom}) translate(${(50 - zoomPosition.x) * (zoom - 1) / zoom}%, ${(50 - zoomPosition.y) * (zoom - 1) / zoom}%)`
              : 'none',
            transition: 'transform 0.2s ease-out',
          }}
        >
          <img
            src={afterImage}
            alt={afterLabel}
            className="absolute inset-0 w-full h-full object-contain bg-paper-200"
            onLoad={() => setAfterLoaded(true)}
            draggable={false}
          />

          <div
            className="absolute inset-0 overflow-hidden"
            style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
          >
            <img
              src={beforeImage}
              alt={beforeLabel}
              className="absolute inset-0 w-full h-full object-contain bg-paper-200"
              onLoad={() => setBeforeLoaded(true)}
              draggable={false}
            />
          </div>
        </div>

        {!allLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-paper-100">
            <div className="text-ink-400 text-sm animate-pulse">加载中...</div>
          </div>
        )}

        <div
          className={cn(
            'absolute top-0 bottom-0 w-1 bg-ink-600 cursor-col-resize z-10',
            'transition-opacity duration-200',
            isHovering || isDragging ? 'opacity-100' : 'opacity-70'
          )}
          style={{ left: `${sliderPosition}%`, transform: 'translateX(-50%)' }}
          onMouseDown={handleMouseDown}
        >
          <div
            className={cn(
              'absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
              'w-12 h-12 bg-ink-600 rounded-full flex items-center justify-center',
              'shadow-lg border-2 border-paper-50',
              'transition-transform duration-200',
              isDragging ? 'scale-110' : 'hover:scale-105'
            )}
          >
            <div className="flex items-center gap-1">
              <ChevronLeft size={18} className="text-paper-50 -ml-1" />
              <div className="w-0.5 h-5 bg-paper-300 rounded-full" />
              <ChevronRight size={18} className="text-paper-50 -mr-1" />
            </div>
          </div>

          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-0.5 h-full bg-ink-600 opacity-50" />
        </div>

        <div
          className={cn(
            'absolute top-4 left-4 px-4 py-2 rounded-lg',
            'bg-ink-600/90 text-paper-50 font-song text-sm',
            'shadow-md backdrop-blur-sm',
            'transition-opacity duration-200',
            isHovering ? 'opacity-100' : 'opacity-80'
          )}
        >
          {beforeLabel}
        </div>

        <div
          className={cn(
            'absolute top-4 right-4 px-4 py-2 rounded-lg',
            'bg-bamboo-600/90 text-paper-50 font-song text-sm',
            'shadow-md backdrop-blur-sm',
            'transition-opacity duration-200',
            isHovering ? 'opacity-100' : 'opacity-80'
          )}
        >
          {afterLabel}
        </div>

        {isZoomed && (
          <div className="absolute bottom-4 left-4 px-3 py-1.5 rounded-lg bg-ink-600/90 text-paper-50 text-sm shadow-md backdrop-blur-sm">
            {Math.round(zoom * 100)}%
          </div>
        )}

        {showControls && allowZoom && allLoaded && (
          <div
            className={cn(
              'absolute bottom-4 right-4 flex items-center gap-2',
              'transition-opacity duration-200',
              isHovering ? 'opacity-100' : 'opacity-0'
            )}
          >
            <div className="flex items-center gap-1 bg-paper-50/95 rounded-lg shadow-md border border-paper-200 backdrop-blur-sm">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleZoomOut}
                disabled={zoom <= 1}
                className="h-8 w-8 px-0 rounded-none rounded-l-lg"
              >
                <ZoomOut size={16} />
              </Button>
              <div className="w-px h-5 bg-paper-200" />
              <Button
                variant="ghost"
                size="sm"
                onClick={handleToggleZoom}
                className="h-8 w-8 px-0 rounded-none"
              >
                <Maximize2 size={16} />
              </Button>
              <div className="w-px h-5 bg-paper-200" />
              <Button
                variant="ghost"
                size="sm"
                onClick={handleZoomIn}
                disabled={zoom >= 3}
                className="h-8 w-8 px-0 rounded-none rounded-r-lg"
              >
                <ZoomIn size={16} />
              </Button>
            </div>
          </div>
        )}

        {isZoomed && (
          <div
            className={cn(
              'absolute top-16 right-4 w-24 h-24 rounded-lg overflow-hidden',
              'border-2 border-paper-300 bg-paper-100 shadow-md'
            )}
          >
            <div className="relative w-full h-full">
              <img
                src={afterImage}
                alt="缩略图"
                className="absolute inset-0 w-full h-full object-cover opacity-50"
                draggable={false}
              />
              <img
                src={beforeImage}
                alt="缩略图"
                className="absolute inset-0 w-full h-full object-cover"
                style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
                draggable={false}
              />
              <div
                className="absolute border-2 border-seal-500 bg-seal-500/20 rounded"
                style={{
                  width: `${100 / zoom}%`,
                  height: `${100 / zoom}%`,
                  left: `${zoomPosition.x - 50 / zoom}%`,
                  top: `${zoomPosition.y - 50 / zoom}%`,
                }}
              />
              <div
                className="absolute top-0 bottom-0 w-px bg-ink-600"
                style={{ left: `${sliderPosition}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {showControls && (
        <div className="px-4 py-3 bg-paper-50 border-t border-paper-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm text-ink-500">分割位置:</span>
            <span className="text-sm font-medium text-ink-700 font-mono">
              {Math.round(sliderPosition)}%
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setSliderPosition(0);
                onSliderChange?.(0);
              }}
            >
              显示修复前
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setSliderPosition(50);
                onSliderChange?.(50);
              }}
            >
              中间
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setSliderPosition(100);
                onSliderChange?.(100);
              }}
            >
              显示修复后
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageComparison;
