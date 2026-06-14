import { forwardRef } from 'react';
import { User, DatabaseBackup, HelpCircle, Menu } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface HeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  onMenuToggle?: () => void;
  userName?: string;
  onBackup?: () => void;
  onHelp?: () => void;
}

export const Header = forwardRef<HTMLDivElement, HeaderProps>(
  (
    {
      className,
      title,
      onMenuToggle,
      userName = '修复师',
      onBackup,
      onHelp,
      ...props
    },
    ref
  ) => {
    return (
      <header
        ref={ref}
        className={cn(
          'flex items-center justify-between h-16 px-4 md:px-6 bg-paper-50 border-b border-paper-200',
          className
        )}
        {...props}
      >
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onMenuToggle}
            className={cn(
              'md:hidden p-2 rounded-lg text-ink-500 hover:bg-paper-100 transition-colors'
            )}
          >
            <Menu className="w-5 h-5" />
          </button>
          <h1 className="font-song font-semibold text-xl text-ink-700">{title}</h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onHelp}
            className="p-2 rounded-lg text-ink-500 hover:bg-paper-100 hover:text-ink-700 transition-colors"
            title="帮助"
          >
            <HelpCircle className="w-5 h-5" />
          </button>

          <button
            type="button"
            onClick={onBackup}
            className="p-2 rounded-lg text-ink-500 hover:bg-paper-100 hover:text-ink-700 transition-colors"
            title="数据备份"
          >
            <DatabaseBackup className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 px-3 py-1.5 ml-1 bg-paper-100 rounded-lg border border-paper-200">
            <div className="w-7 h-7 flex items-center justify-center bg-ink-600 rounded-full">
              <User className="w-4 h-4 text-paper-50" />
            </div>
            <span className="text-sm font-medium text-ink-600">{userName}</span>
          </div>
        </div>
      </header>
    );
  }
);

Header.displayName = 'Header';
