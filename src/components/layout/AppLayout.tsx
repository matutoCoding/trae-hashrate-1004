import { useState, useEffect, useCallback } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { HelpModal } from '@/components/business/HelpModal';
import { exportToFile, getStorageStats } from '@/utils/storage';
import { useAppStore } from '@/store';
import { cn } from '@/lib/utils';

const pageTitles: Record<string, string> = {
  '/': '仪表盘',
  '/capture': '书页采集',
  '/search': '配纸检索',
  '/annotation': '破损标注',
  '/archive': '修复档案',
  '/library': '纸库管理',
};

export interface AppLayoutProps extends React.HTMLAttributes<HTMLDivElement> {
  isOffline?: boolean;
}

export function AppLayout({ className, isOffline = true, ...props }: AppLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [backupToast, setBackupToast] = useState<{ show: boolean; success: boolean; message: string }>({
    show: false,
    success: false,
    message: '',
  });
  const location = useLocation();
  const { books, pages, paperStocks, restorationRecords, damageAreas } = useAppStore();

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F1') {
        e.preventDefault();
        setHelpOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const currentTitle = pageTitles[location.pathname] || '古籍修复配纸系统';

  const handleMenuToggle = () => {
    if (window.innerWidth < 768) {
      setMobileMenuOpen(!mobileMenuOpen);
    } else {
      setSidebarCollapsed(!sidebarCollapsed);
    }
  };

  const handleBackup = useCallback(() => {
    try {
      const stats = getStorageStats();
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `古籍修复数据备份-${timestamp}.json`;
      
      exportToFile(filename);
      
      setBackupToast({
        show: true,
        success: true,
        message: `数据备份成功！共 ${books.length} 本书籍、${pages.length} 页书页、${paperStocks.length} 种补纸、${restorationRecords.length} 条修复记录、${damageAreas.length} 处破损标注，总计 ${(stats.totalSize / 1024).toFixed(2)} KB`,
      });
    } catch (error) {
      console.error('备份失败:', error);
      setBackupToast({
        show: true,
        success: false,
        message: '数据备份失败，请检查浏览器存储权限',
      });
    }

    setTimeout(() => {
      setBackupToast(prev => ({ ...prev, show: false }));
    }, 6000);
  }, [books.length, pages.length, paperStocks.length, restorationRecords.length, damageAreas.length]);

  const handleHelp = useCallback(() => {
    setHelpOpen(true);
  }, []);

  return (
    <div
      className={cn(
        'flex h-screen overflow-hidden bg-paper-100',
        className
      )}
      {...props}
    >
      <div
        className={cn(
          'fixed md:relative inset-y-0 left-0 z-40 transform transition-transform duration-300 md:translate-x-0',
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        )}
      >
        <Sidebar
          collapsed={sidebarCollapsed && window.innerWidth >= 768}
          isOffline={isOffline}
          className="h-full"
        />
      </div>

      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-30 bg-ink-900/50 md:hidden animate-fade-in"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <div className="flex flex-col flex-1 overflow-hidden">
        <Header
          title={currentTitle}
          onMenuToggle={handleMenuToggle}
          onBackup={handleBackup}
          onHelp={handleHelp}
        />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 scrollbar-thin">
          <div className="animate-slide-up">
            <Outlet />
          </div>
        </main>
      </div>

      <HelpModal isOpen={helpOpen} onClose={() => setHelpOpen(false)} />

      {backupToast.show && (
        <div className="fixed bottom-6 right-6 z-50 animate-slide-up">
          <div
            className={cn(
              'flex items-start gap-3 p-4 rounded-lg shadow-scroll-hover max-w-md border',
              backupToast.success
                ? 'bg-bamboo-50 border-bamboo-300'
                : 'bg-seal-50 border-seal-300'
            )}
          >
            <div
              className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
                backupToast.success ? 'bg-bamboo-100' : 'bg-seal-100'
              )}
            >
              <svg
                className={cn(
                  'w-5 h-5',
                  backupToast.success ? 'text-bamboo-600' : 'text-seal-600'
                )}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {backupToast.success ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                )}
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <div
                className={cn(
                  'font-medium text-sm',
                  backupToast.success ? 'text-bamboo-800' : 'text-seal-800'
                )}
              >
                {backupToast.success ? '数据备份成功' : '数据备份失败'}
              </div>
              <div
                className={cn(
                  'text-xs mt-1',
                  backupToast.success ? 'text-bamboo-600' : 'text-seal-600'
                )}
              >
                {backupToast.message}
              </div>
            </div>
            <button
              onClick={() => setBackupToast(prev => ({ ...prev, show: false }))}
              className={cn(
                'p-1 rounded hover:bg-black/5 transition-colors',
                backupToast.success ? 'text-bamboo-600' : 'text-seal-600'
              )}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
