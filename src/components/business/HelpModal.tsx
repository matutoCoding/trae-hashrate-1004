import React, { useState, useMemo } from 'react';
import { X, BookOpen, ScanLine, Search, Highlighter, FileText, Library, DatabaseBackup, ChevronRight, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Tabs, TabsContent } from '@/components/ui/Tabs';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface HelpStep {
  icon: React.ReactNode;
  title: string;
  description: string;
  tips: string[];
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState('capture');

  if (!isOpen) return null;

  const captureSteps: HelpStep[] = [
    {
      icon: <BookOpen size={20} />,
      title: '选择古籍书目',
      description: '在左侧下拉菜单中选择要修复的古籍，或点击"新增古籍"创建新书目。',
      tips: ['确保古籍名称、朝代等信息准确', '同一古籍的不同册数分开管理'],
    },
    {
      icon: <ScanLine size={20} />,
      title: '采集书页信息',
      description: '录入册数、页码等基本信息，然后依次采集各项物理指标。',
      tips: ['帘纹间距：使用卡尺测量，精确到0.1mm', '纤维成分：可通过显微镜观察确定', '厚度：多点测量取平均值'],
    },
    {
      icon: <DatabaseBackup size={20} />,
      title: '上传书页影像',
      description: '上传书页正背面高清照片，建议添加比例尺参照便于后续尺寸计算。',
      tips: ['使用600dpi以上分辨率扫描', '保证光照均匀，避免反光', '正面、背面、局部特写分别拍摄'],
    },
    {
      icon: <CheckCircle2 size={20} />,
      title: '提交采集',
      description: '确认所有信息无误后点击"提交采集"，书页状态将更新为"待修复"。',
      tips: ['可先保存草稿，稍后继续编辑', '提交后仍可修改信息'],
    },
  ];

  const matchSteps: HelpStep[] = [
    {
      icon: <Search size={20} />,
      title: '选择待配纸书页',
      description: '在顶部选择需要配纸的书页，系统会自动加载其物理指标。',
      tips: ['确保书页已完成所有指标采集', '可在"书页采集"页补充缺失信息'],
    },
    {
      icon: <DatabaseBackup size={20} />,
      title: '设置匹配权重',
      description: '根据修复需求调整各项指标的权重，帘纹和色度通常权重较高。',
      tips: ['追求外观一致：提高色度权重', '追求物理特性：提高厚度和纤维权重', '追求耐久性：提高pH值权重'],
    },
    {
      icon: <Search size={20} />,
      title: '查看匹配结果',
      description: '点击"开始匹配"，系统会按综合相似度排序显示所有可用补纸。',
      tips: ['综合匹配度80分以上为优秀', '可点击卡片查看补纸详情', '注意酸碱度相容性提示'],
    },
    {
      icon: <CheckCircle2 size={20} />,
      title: '选用补纸',
      description: '确认补纸参数合适后，点击"选用此纸"将补纸与书页关联。',
      tips: ['注意库存是否充足', '记录批次号便于追溯', '考虑翘曲和塌陷风险'],
    },
  ];

  const archiveSteps: HelpStep[] = [
    {
      icon: <Highlighter size={20} />,
      title: '完成破损标注',
      description: '在"破损标注"页完成所有破损区域的标注和修复方案制定。',
      tips: ['确保所有破损区域都已标注', '确认搭口宽度和下捻方向合理'],
    },
    {
      icon: <Library size={20} />,
      title: '确认配纸信息',
      description: '确认所用补纸的批次、用量等信息准确无误。',
      tips: ['核对补纸批次号', '记录实际用量', '更新纸库库存'],
    },
    {
      icon: <FileText size={20} />,
      title: '上传修复影像',
      description: '上传修复完成后的书页照片，建议与修复前同机位拍摄便于对比。',
      tips: ['同机位、同光照拍摄', '修复后需阴干72小时再拍照', '可上传多张细节特写'],
    },
    {
      icon: <CheckCircle2 size={20} />,
      title: '归档保存',
      description: '填写修复备注，确认所有信息后点击"完成归档"，修复记录将永久保存。',
      tips: ['详细记录修复过程中的特殊处理', '记录修复师姓名和日期', '定期备份所有档案数据'],
    },
  ];

  const renderStep = (step: HelpStep, index: number) => (
    <div key={index} className="flex gap-4">
      <div className="flex flex-col items-center">
        <div className="w-10 h-10 rounded-full bg-ink-600 text-paper-50 flex items-center justify-center flex-shrink-0">
          {step.icon}
        </div>
        {index < 3 && (
          <div className="w-0.5 flex-1 bg-paper-200 my-2" />
        )}
      </div>
      <div className="flex-1 pb-6">
        <div className="flex items-center gap-2 mb-2">
          <span className="seal-mark text-xs">步骤 {index + 1}</span>
          <h4 className="font-song font-semibold text-ink-700">{step.title}</h4>
        </div>
        <p className="text-sm text-ink-500 mb-3">{step.description}</p>
        <div className="bg-paper-100 rounded-lg p-3 border border-paper-200">
          <div className="text-xs font-medium text-ink-400 mb-2">💡 小贴士</div>
          <ul className="space-y-1">
            {step.tips.map((tip, i) => (
              <li key={i} className="text-xs text-ink-500 flex items-start gap-2">
                <ChevronRight size={12} className="mt-0.5 flex-shrink-0 text-ink-400" />
                {tip}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center animate-fade-in">
      <div
        className="absolute inset-0 bg-ink-900/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-paper-50 rounded-xl shadow-scroll-hover border border-paper-200 w-full max-w-3xl max-h-[85vh] overflow-hidden animate-slide-up">
        <div className="flex items-center justify-between p-6 border-b border-paper-200">
          <div>
            <h2 className="font-song text-xl font-bold text-ink-700">使用帮助</h2>
            <p className="text-sm text-ink-500 mt-1">了解系统各功能模块的使用方法</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-ink-400 hover:text-ink-700 hover:bg-paper-100 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            className="mb-6"
            items={[
              { key: 'capture', label: '书页采集' },
              { key: 'match', label: '配纸检索' },
              { key: 'archive', label: '导出档案' },
            ]}
          />

          <div className="max-h-[55vh] overflow-y-auto pr-2 scrollbar-thin">
            <TabsContent
              activeKey={activeTab}
              items={[
                {
                  key: 'capture',
                  content: (
                    <div className="space-y-2">
                      {captureSteps.map((step, index) => renderStep(step, index))}
                    </div>
                  ),
                },
                {
                  key: 'match',
                  content: (
                    <div className="space-y-2">
                      {matchSteps.map((step, index) => renderStep(step, index))}
                    </div>
                  ),
                },
                {
                  key: 'archive',
                  content: (
                    <div className="space-y-2">
                      {archiveSteps.map((step, index) => renderStep(step, index))}
                    </div>
                  ),
                },
              ]}
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 p-4 border-t border-paper-200 bg-paper-100">
          <div className="text-xs text-ink-400">
            提示：按 <kbd className="px-1.5 py-0.5 bg-paper-200 rounded text-ink-600 mx-1">F1</kbd> 可随时打开此帮助
          </div>
          <Button variant="primary" onClick={onClose}>
            我知道了
          </Button>
        </div>
      </div>
    </div>
  );
};

export default HelpModal;
