import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

export interface TabItem {
  key: string;
  label: string;
  disabled?: boolean;
}

export interface TabsProps {
  items: TabItem[];
  activeKey?: string;
  defaultActiveKey?: string;
  onChange?: (key: string) => void;
  className?: string;
}

export function Tabs({
  items,
  activeKey: controlledActiveKey,
  defaultActiveKey,
  onChange,
  className,
}: TabsProps) {
  const [internalActiveKey, setInternalActiveKey] = useState(
    defaultActiveKey || items[0]?.key || ''
  );
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });
  const tabsRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<Map<string, HTMLButtonElement>>(new Map());

  const activeKey = controlledActiveKey !== undefined ? controlledActiveKey : internalActiveKey;

  useEffect(() => {
    const updateIndicator = () => {
      const activeTab = tabRefs.current.get(activeKey);
      if (activeTab) {
        const { offsetLeft, offsetWidth } = activeTab;
        setIndicatorStyle({
          left: offsetLeft,
          width: offsetWidth,
        });
      }
    };

    updateIndicator();
    window.addEventListener('resize', updateIndicator);
    return () => window.removeEventListener('resize', updateIndicator);
  }, [activeKey, items]);

  const handleTabClick = (key: string) => {
    if (controlledActiveKey === undefined) {
      setInternalActiveKey(key);
    }
    onChange?.(key);
  };

  return (
    <div className={cn('w-full', className)}>
      <div
        ref={tabsRef}
        className="relative flex border-b border-paper-200 overflow-x-auto scrollbar-thin"
      >
        {items.map((item) => (
          <button
            key={item.key}
            ref={(el) => {
              if (el) {
                tabRefs.current.set(item.key, el);
              }
            }}
            type="button"
            disabled={item.disabled}
            onClick={() => !item.disabled && handleTabClick(item.key)}
            className={cn(
              'px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors relative z-10',
              activeKey === item.key
                ? 'text-ink-700'
                : 'text-ink-400 hover:text-ink-600',
              item.disabled && 'opacity-50 cursor-not-allowed'
            )}
          >
            {item.label}
          </button>
        ))}
        <div
          className="absolute bottom-0 h-0.5 bg-ink-600 transition-all duration-300 ease-out"
          style={{
            left: `${indicatorStyle.left}px`,
            width: `${indicatorStyle.width}px`,
          }}
        />
      </div>
    </div>
  );
}

export interface TabsContentProps {
  activeKey: string;
  items: { key: string; content: React.ReactNode }[];
  className?: string;
}

export function TabsContent({ activeKey, items, className }: TabsContentProps) {
  const activeItem = items.find((item) => item.key === activeKey);

  return (
    <div className={cn('pt-4', className)}>
      {activeItem?.content}
    </div>
  );
}
