import React, { useEffect, useState, useCallback } from 'react';
import {
  BookOpen,
  FileText,
  Package,
  CheckCircle2,
  ScanLine,
  Search,
  Highlighter,
  Library,
  Database,
  AlertTriangle,
  Clock,
  TrendingUp,
  ChevronRight,
  Calendar,
  User,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/store';
import { exportToFile, getStorageStats } from '@/utils/storage';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';
import type { RestorationRecord, PaperStock, BookPage } from '@/types';

interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  trend?: { value: number; isUp: boolean; label: string };
  color?: 'primary' | 'success' | 'warning' | 'danger' | 'info';
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, trend, color = 'primary' }) => {
  const colorClasses = {
    primary: 'bg-ink-50 text-ink-600 border-ink-200',
    success: 'bg-bamboo-50 text-bamboo-600 border-bamboo-200',
    warning: 'bg-amber-50 text-amber-600 border-amber-200',
    danger: 'bg-seal-50 text-seal-600 border-seal-200',
    info: 'bg-azure-50 text-azure-600 border-azure-200',
  };

  return (
    <Card className="overflow-hidden animate-fade-in">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm text-ink-500 font-medium mb-1">{title}</p>
            <p className="text-3xl font-song font-bold text-ink-700">{value}</p>
            {trend && (
              <div className="flex items-center gap-1 mt-2 text-xs">
                {trend.isUp ? (
                  <ArrowUpRight size={14} className="text-bamboo-600" />
                ) : (
                  <ArrowDownRight size={14} className="text-seal-600" />
                )}
                <span className={trend.isUp ? 'text-bamboo-600' : 'text-seal-600'}>
                  {trend.value}%
                </span>
                <span className="text-ink-400 ml-1">{trend.label}</span>
              </div>
            )}
          </div>
          <div
            className={cn(
              'w-12 h-12 rounded-lg border flex items-center justify-center',
              colorClasses[color]
            )}
          >
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

interface QuickActionProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
  delay?: number;
}

const QuickAction: React.FC<QuickActionProps> = ({ icon, title, description, onClick, delay = 0 }) => {
  return (
    <button
      onClick={onClick}
      className="group p-6 bg-paper-50 rounded-lg border border-paper-200 text-left hover:border-ink-300 hover:shadow-scroll-hover transition-all duration-300 animate-slide-up"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="w-12 h-12 rounded-lg bg-ink-600 text-paper-50 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
        {icon}
      </div>
      <h3 className="font-song font-semibold text-ink-700 mb-1">{title}</h3>
      <p className="text-sm text-ink-500 mb-3">{description}</p>
      <div className="flex items-center text-sm text-ink-400 group-hover:text-ink-600 transition-colors">
        立即使用 <ChevronRight size={16} className="ml-1 group-hover:translate-x-1 transition-transform" />
      </div>
    </button>
  );
};

const getStatusBadge = (status: string) => {
  const variants: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'default'> = {
    '待检测': 'info',
    '已检测': 'default',
    '待修复': 'warning',
    '修复中': 'warning',
    '已修复': 'success',
    '已归档': 'success',
  };
  return variants[status] || 'default';
};

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const {
    books,
    pages,
    paperStocks,
    restorationRecords,
    damageAreas,
    getStatistics,
    getPageById,
    getBookById,
    getPaperById,
    initializeWithMockData,
    isInitialized,
  } = useAppStore();

  const [currentTime, setCurrentTime] = useState(new Date());
  const [backupToast, setBackupToast] = useState<{ show: boolean; success: boolean; message: string }>({
    show: false,
    success: false,
    message: '',
  });

  useEffect(() => {
    if (!isInitialized) {
      initializeWithMockData();
    }
  }, [isInitialized, initializeWithMockData]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const stats = getStatistics();

  const recentRecords = [...restorationRecords]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const lowStockPapers = paperStocks
    .filter((p) => p.stockQuantity < 50)
    .sort((a, b) => a.stockQuantity - b.stockQuantity)
    .slice(0, 5);

  const pendingTasks = pages
    .filter((p) => p.status === '待修复' || p.status === '待检测' || p.status === '修复中')
    .sort((a, b) => {
      const priority = { '修复中': 0, '待修复': 1, '待检测': 2 };
      return priority[a.status] - priority[b.status];
    })
    .slice(0, 5);

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 6) return '夜深了，注意休息';
    if (hour < 9) return '早上好';
    if (hour < 12) return '上午好';
    if (hour < 14) return '中午好';
    if (hour < 18) return '下午好';
    if (hour < 22) return '晚上好';
    return '夜深了，注意休息';
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}月${date.getDate()}日`;
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

  const quickActions = [
    { icon: <ScanLine size={24} />, title: '书页采集', description: '扫描并录入古籍书页', path: '/capture', action: null },
    { icon: <Search size={24} />, title: '配纸检索', description: '智能匹配最优补纸', path: '/search', action: null },
    { icon: <Highlighter size={24} />, title: '破损标注', description: '标注书页破损区域', path: '/annotation', action: null },
    { icon: <FileText size={24} />, title: '修复档案', description: '查看和管理修复记录', path: '/archive', action: null },
    { icon: <Library size={24} />, title: '纸库管理', description: '管理补纸库存', path: '/library', action: null },
    { icon: <Database size={24} />, title: '数据备份', description: '导出和备份数据', path: null, action: handleBackup },
  ];

  return (
    <div className="min-h-full bg-paper-100 p-6">
      <div className="max-w-[1600px] mx-auto">
        {/* 顶部欢迎区 */}
        <div className="mb-8 animate-fade-in">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h1 className="font-song text-2xl font-bold text-ink-700">
                {getGreeting()}，修复师
              </h1>
              <p className="text-sm text-ink-500 mt-1">
                今天是 {currentTime.getFullYear()}年{currentTime.getMonth() + 1}月{currentTime.getDate()}日
                {' · '}
                {['日', '一', '二', '三', '四', '五', '六'][currentTime.getDay()]}
              </p>
            </div>
            <div className="flex items-center gap-2 text-ink-500">
              <Calendar size={16} />
              <span className="text-sm">{currentTime.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' })}</span>
            </div>
          </div>
        </div>

        {/* 快速统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="古籍总数"
            value={stats.totalBooks}
            icon={<BookOpen size={24} />}
            color="primary"
            trend={{ value: 12, isUp: true, label: '较上月' }}
          />
          <StatCard
            title="待修复页数"
            value={stats.pendingPages}
            icon={<Clock size={24} />}
            color="warning"
            trend={{ value: 8, isUp: false, label: '较上月' }}
          />
          <StatCard
            title="补纸库存量"
            value={stats.totalPapers}
            icon={<Package size={24} />}
            color="info"
            trend={{ value: 5, isUp: true, label: '较上月' }}
          />
          <StatCard
            title="本月完成修复"
            value={stats.totalRestored}
            icon={<CheckCircle2 size={24} />}
            color="success"
            trend={{ value: 23, isUp: true, label: '较上月' }}
          />
        </div>

        {/* 功能快捷入口 */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-song text-lg font-semibold text-ink-700">功能快捷入口</h2>
            <Badge variant="default" className="text-xs">
              常用功能
            </Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {quickActions.map((action, index) => (
              <QuickAction
                key={action.title}
                icon={action.icon}
                title={action.title}
                description={action.description}
                onClick={() => {
                  if (action.action) {
                    action.action();
                  } else if (action.path) {
                    navigate(action.path);
                  }
                }}
                delay={index * 50}
              />
            ))}
          </div>
        </div>

        {/* 下部分栏：最近修复记录 + 库存预警和任务提醒 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 左侧：最近修复记录 */}
          <Card className="animate-fade-in">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>最近修复记录</CardTitle>
                  <CardDescription>最新完成的修复工作</CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/archive')}
                  className="text-ink-500 hover:text-ink-700"
                >
                  查看全部 <ChevronRight size={16} className="ml-1" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {recentRecords.length === 0 ? (
                <div className="text-center py-12 text-ink-400">
                  <FileText size={48} className="mx-auto mb-3 opacity-50" />
                  <p>暂无修复记录</p>
                </div>
              ) : (
                <div className="relative">
                  <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-paper-200" />
                  <div className="space-y-4">
                    {recentRecords.map((record: RestorationRecord, index: number) => {
                      const page = getPageById(record.pageId);
                      const book = page ? getBookById(page.bookId) : null;
                      const paper = getPaperById(record.paperId);

                      return (
                        <div
                          key={record.id}
                          className="relative pl-10 group"
                        >
                          <div className="absolute left-2.5 top-3 w-3 h-3 rounded-full border-2 bg-paper-50 border-ink-400 group-hover:border-bamboo-500 group-hover:bg-bamboo-100 transition-colors" />
                          <div className="p-4 bg-paper-50 rounded-lg border border-paper-200 group-hover:border-paper-300 group-hover:shadow-sm transition-all">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <h4 className="font-medium text-ink-700">
                                  {book?.name || '未知古籍'}
                                </h4>
                                <p className="text-xs text-ink-500">
                                  {page ? `第${page.volumeNumber}册第${page.pageNumber}页` : ''}
                                </p>
                              </div>
                              <Badge variant="default" className="text-xs">
                                {record.restorationDate}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-4 text-xs text-ink-500">
                              <span className="flex items-center gap-1">
                                <User size={12} />
                                {record.restorer}
                              </span>
                              <span className="flex items-center gap-1">
                                <Package size={12} />
                                {paper?.batchNumber || '未知批次'}
                              </span>
                              <span className="flex items-center gap-1">
                                <TrendingUp size={12} />
                                {record.flatnessScore}分
                              </span>
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

          {/* 右侧：库存预警和待修复任务 */}
          <div className="space-y-6">
            {/* 补纸库存预警 */}
            <Card className="animate-fade-in" style={{ animationDelay: '100ms' }}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle size={18} className="text-warning-wood" />
                      补纸库存预警
                    </CardTitle>
                    <CardDescription>库存不足的补纸批次</CardDescription>
                  </div>
                  <Badge variant="warning" className="text-xs">
                    {lowStockPapers.length} 项
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {lowStockPapers.length === 0 ? (
                  <div className="text-center py-8 text-ink-400">
                    <CheckCircle2 size={40} className="mx-auto mb-2 opacity-50" />
                    <p className="text-sm">库存充足，暂无预警</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {lowStockPapers.map((paper: PaperStock) => (
                      <div
                        key={paper.id}
                        className="flex items-center justify-between p-3 bg-paper-50 rounded-lg border border-paper-200 hover:border-amber-300 transition-colors cursor-pointer"
                        onClick={() => navigate('/library')}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-ink-700 text-sm truncate">
                              {paper.batchNumber}
                            </span>
                            <Badge
                              variant={paper.stockQuantity < 10 ? 'danger' : 'warning'}
                              className="text-xs"
                            >
                              {paper.stockQuantity < 10 ? '紧缺' : '紧张'}
                            </Badge>
                          </div>
                          <p className="text-xs text-ink-500">
                            库位: {paper.storageLocation}
                          </p>
                        </div>
                        <div className="text-right ml-4">
                          <div className={cn(
                            'font-semibold',
                            paper.stockQuantity < 10 ? 'text-seal-600' : 'text-warning-wood'
                          )}>
                            {paper.stockQuantity}
                            <span className="text-xs font-normal text-ink-500 ml-1">{paper.unit}</span>
                          </div>
                          <div className="w-20 h-1.5 bg-paper-200 rounded-full mt-1 overflow-hidden">
                            <div
                              className={cn(
                                'h-full rounded-full transition-all duration-500',
                                paper.stockQuantity < 10 ? 'bg-seal-500' : 'bg-amber-500'
                              )}
                              style={{ width: `${Math.min(100, (paper.stockQuantity / 50) * 100)}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 待修复任务提醒 */}
            <Card className="animate-fade-in" style={{ animationDelay: '200ms' }}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Clock size={18} className="text-azure-500" />
                      待修复任务
                    </CardTitle>
                    <CardDescription>需要处理的书页</CardDescription>
                  </div>
                  <Badge variant="info" className="text-xs">
                    {pendingTasks.length} 项
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {pendingTasks.length === 0 ? (
                  <div className="text-center py-8 text-ink-400">
                    <CheckCircle2 size={40} className="mx-auto mb-2 opacity-50" />
                    <p className="text-sm">暂无待处理任务</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {pendingTasks.map((page: BookPage) => {
                      const book = getBookById(page.bookId);
                      return (
                        <div
                          key={page.id}
                          className="flex items-center justify-between p-3 bg-paper-50 rounded-lg border border-paper-200 hover:border-azure-300 transition-colors cursor-pointer"
                          onClick={() => navigate('/annotation')}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-ink-700 text-sm truncate">
                                {book?.name || '未知古籍'}
                              </span>
                              <Badge variant={getStatusBadge(page.status)} className="text-xs">
                                {page.status}
                              </Badge>
                            </div>
                            <p className="text-xs text-ink-500">
                              第{page.volumeNumber}册 · 第{page.pageNumber}页 · {formatDate(page.createdAt)}
                            </p>
                          </div>
                          <ChevronRight size={16} className="text-ink-400" />
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

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
};

export default Dashboard;
