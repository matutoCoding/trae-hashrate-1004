import { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
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

export function AppLayout({ className, isOffline = false, ...props }: AppLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

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

  const currentTitle = pageTitles[location.pathname] || '古籍修复配纸系统';

  const handleMenuToggle = () => {
    if (window.innerWidth < 768) {
      setMobileMenuOpen(!mobileMenuOpen);
    } else {
      setSidebarCollapsed(!sidebarCollapsed);
    }
  };

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
        />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 scrollbar-thin">
          <div className="animate-slide-up">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
