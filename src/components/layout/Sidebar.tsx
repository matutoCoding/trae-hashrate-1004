import { forwardRef } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  ScanLine,
  Search,
  Highlighter,
  FileText,
  Library,
  WifiOff,
  BookOpen,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface MenuItem {
  to: string;
  icon: React.ElementType;
  label: string;
}

const menuItems: MenuItem[] = [
  { to: '/', icon: LayoutDashboard, label: '仪表盘' },
  { to: '/capture', icon: ScanLine, label: '书页采集' },
  { to: '/search', icon: Search, label: '配纸检索' },
  { to: '/annotation', icon: Highlighter, label: '破损标注' },
  { to: '/archive', icon: FileText, label: '修复档案' },
  { to: '/library', icon: Library, label: '纸库管理' },
];

export interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  collapsed?: boolean;
  onToggle?: () => void;
  isOffline?: boolean;
}

export const Sidebar = forwardRef<HTMLDivElement, SidebarProps>(
  ({ className, collapsed = false, isOffline = false, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'flex flex-col h-full bg-paper-50 border-r border-paper-200 transition-all duration-300',
          collapsed ? 'w-16' : 'w-64',
          className
        )}
        {...props}
      >
        <div className="flex items-center h-16 px-4 border-b border-paper-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 flex items-center justify-center bg-ink-600 rounded-lg">
              <BookOpen className="w-6 h-6 text-paper-50" />
            </div>
            {!collapsed && (
              <span className="font-song font-semibold text-lg text-ink-700 whitespace-nowrap">
                古籍修复配纸系统
              </span>
            )}
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto scrollbar-thin">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200',
                    'hover:bg-paper-100',
                    isActive
                      ? 'bg-ink-600 text-paper-50 shadow-scroll'
                      : 'text-ink-500 hover:text-ink-700',
                    collapsed && 'justify-center px-0'
                  )
                }
              >
                <Icon className={cn('w-5 h-5 flex-shrink-0')} />
                {!collapsed && (
                  <span className="font-medium text-sm">{item.label}</span>
                )}
              </NavLink>
            );
          })}
        </nav>

        <div className="p-3 border-t border-paper-200">
          <div
            className={cn(
              'flex items-center gap-2 px-3 py-2 text-xs text-ink-400',
              collapsed && 'justify-center px-0'
            )}
          >
            {isOffline && (
              <WifiOff className="w-4 h-4 text-warning-wood animate-breathe" />
            )}
            {!collapsed && (
              <>
                <span>v1.0.0</span>
                {isOffline && <span className="text-warning-wood">· 离线模式</span>}
              </>
            )}
          </div>
        </div>
      </div>
    );
  }
);

Sidebar.displayName = 'Sidebar';
