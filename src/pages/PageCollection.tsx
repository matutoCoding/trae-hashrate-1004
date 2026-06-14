import React, { useState, useCallback } from 'react';
import { Save, Send, RotateCcw, Upload, Image as ImageIcon, X, Plus, Ruler } from 'lucide-react';
import { useAppStore } from '@/store';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Slider } from '@/components/ui/Slider';
import { ColorPicker } from '@/components/business/ColorPicker';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';
import type { BookPage, Dynasty, PaperType } from '@/types';

interface FormData {
  bookId: string;
  volumeNumber: number;
  pageNumber: number;
  curtainPatternSpacing: number;
  fiberComposition: string;
  fiberNote: string;
  thickness: number;
  colorL: number;
  colorA: number;
  colorB: number;
  pHValue: number;
  frontImage: string;
  backImage: string;
  detailImages: string[];
  scaleReference: string;
}

interface FormErrors {
  bookId?: string;
  volumeNumber?: string;
  pageNumber?: string;
  curtainPatternSpacing?: string;
  fiberComposition?: string;
  thickness?: string;
  pHValue?: string;
  frontImage?: string;
  backImage?: string;
  scaleReference?: string;
}

const fiberOptions: { value: PaperType | '混合'; label: string }[] = [
  { value: '宣纸', label: '宣纸' },
  { value: '皮纸', label: '皮纸' },
  { value: '竹纸', label: '竹纸' },
  { value: '棉纸', label: '棉纸' },
  { value: '麻纸', label: '麻纸' },
  { value: '混合', label: '混合' },
];

const initialFormData: FormData = {
  bookId: '',
  volumeNumber: 1,
  pageNumber: 1,
  curtainPatternSpacing: 1.5,
  fiberComposition: '',
  fiberNote: '',
  thickness: 0.08,
  colorL: 80,
  colorA: 5,
  colorB: 20,
  pHValue: 7.0,
  frontImage: '',
  backImage: '',
  detailImages: [],
  scaleReference: '',
};

const mockImages = [
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=600&fit=crop',
  'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=600&fit=crop',
  'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&h=600&fit=crop',
];

export const PageCollection: React.FC = () => {
  const { books, addPage, updatePage, currentBookId, setCurrentBook, currentPageId, getBookById } = useAppStore();
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDragOver, setIsDragOver] = useState<string | null>(null);

  const currentBook = formData.bookId ? getBookById(formData.bookId) : null;

  const updateField = useCallback(<K extends keyof FormData>(field: K, value: FormData[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (field in errors) {
      setErrors(prev => ({ ...prev, [field as keyof FormErrors]: undefined }));
    }
  }, [errors]);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.bookId) newErrors.bookId = '请选择古籍书目';
    if (formData.volumeNumber < 1) newErrors.volumeNumber = '册数必须大于0';
    if (formData.pageNumber < 1) newErrors.pageNumber = '页码必须大于0';
    if (formData.curtainPatternSpacing <= 0 || formData.curtainPatternSpacing > 50) {
      newErrors.curtainPatternSpacing = '帘纹间距必须在0-50mm之间';
    }
    if (!formData.fiberComposition) newErrors.fiberComposition = '请选择纤维成分';
    if (formData.thickness <= 0.01 || formData.thickness > 1.00) {
      newErrors.thickness = '厚度必须在0.01-1.00mm之间';
    }
    if (formData.pHValue < 3.0 || formData.pHValue > 10.0) {
      newErrors.pHValue = 'pH值必须在3.0-10.0之间';
    }
    if (!formData.frontImage) newErrors.frontImage = '请上传正面图';
    if (!formData.backImage) newErrors.backImage = '请上传背面图';
    if (!formData.scaleReference) newErrors.scaleReference = '请输入比例尺参照';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (status: '待检测' | '已检测') => {
    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const pageData: Omit<BookPage, 'id' | 'createdAt'> = {
        bookId: formData.bookId,
        volumeNumber: formData.volumeNumber,
        pageNumber: formData.pageNumber,
        curtainPatternSpacing: formData.curtainPatternSpacing,
        fiberComposition: formData.fiberNote
          ? `${formData.fiberComposition}（${formData.fiberNote}）`
          : formData.fiberComposition,
        thickness: formData.thickness,
        colorL: formData.colorL,
        colorA: formData.colorA,
        colorB: formData.colorB,
        pHValue: formData.pHValue,
        frontImage: formData.frontImage,
        backImage: formData.backImage,
        status,
      };

      if (currentPageId) {
        updatePage(currentPageId, pageData);
      } else {
        const newPage = addPage(pageData);
        setCurrentBook(formData.bookId);
        useAppStore.getState().setCurrentPage(newPage.id);
      }

      if (status === '已检测') {
        alert('书页信息已提交，状态流转为"已检测"');
      } else {
        alert('草稿已保存');
      }
    } catch (error) {
      console.error('保存失败:', error);
      alert('保存失败，请重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setFormData(initialFormData);
    setErrors({});
    setCurrentBook(null);
    useAppStore.getState().setCurrentPage(null);
  };

  const handleImageUpload = (type: 'front' | 'back' | 'detail') => {
    const mockImage = mockImages[Math.floor(Math.random() * mockImages.length)];
    if (type === 'front') {
      updateField('frontImage', mockImage);
    } else if (type === 'back') {
      updateField('backImage', mockImage);
    } else {
      updateField('detailImages', [...formData.detailImages, mockImage]);
    }
  };

  const handleRemoveDetailImage = (index: number) => {
    updateField('detailImages', formData.detailImages.filter((_, i) => i !== index));
  };

  const handleDragOver = (e: React.DragEvent, type: string) => {
    e.preventDefault();
    setIsDragOver(type);
  };

  const handleDragLeave = () => {
    setIsDragOver(null);
  };

  const handleDrop = (e: React.DragEvent, type: 'front' | 'back' | 'detail') => {
    e.preventDefault();
    setIsDragOver(null);
    handleImageUpload(type);
  };

  const UploadZone: React.FC<{
    type: 'front' | 'back' | 'detail';
    image?: string;
    label: string;
  }> = ({ type, image, label }) => (
    <div
      className={cn(
        'relative border-2 border-dashed rounded-lg p-4 transition-all duration-200',
        isDragOver === type
          ? 'border-azure-400 bg-azure-50'
          : image
          ? 'border-paper-300 bg-paper-50'
          : 'border-paper-300 bg-paper-100 hover:border-azure-300 hover:bg-paper-50',
        errors[type === 'front' ? 'frontImage' : type === 'back' ? 'backImage' : ''] && 'border-seal-400'
      )}
      onDragOver={(e) => handleDragOver(e, type)}
      onDragLeave={handleDragLeave}
      onDrop={(e) => handleDrop(e, type)}
    >
      {image ? (
        <div className="relative group">
          <img
            src={image}
            alt={label}
            className="w-full h-40 object-cover rounded-lg"
          />
          <button
            onClick={() => updateField(type === 'front' ? 'frontImage' : 'backImage', '')}
            className="absolute top-2 right-2 p-1.5 bg-seal-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <X size={14} />
          </button>
          <div className="mt-2 text-center text-sm text-ink-500">{label} ✓</div>
        </div>
      ) : (
        <div
          className="flex flex-col items-center justify-center h-40 cursor-pointer"
          onClick={() => handleImageUpload(type)}
        >
          <Upload size={32} className="text-ink-400 mb-2" />
          <div className="text-sm text-ink-500">{label}</div>
          <div className="text-xs text-ink-400 mt-1">点击或拖拽上传</div>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-full bg-paper-100 p-6">
      <div className="max-w-[1800px] mx-auto">
        <div className="mb-6">
          <h1 className="font-song text-2xl font-bold text-ink-700">书页采集</h1>
          <p className="text-sm text-ink-500 mt-1">录入古籍书页的物理指标与影像资料</p>
        </div>

        <div className="grid grid-cols-12 gap-6">
          {/* 左侧：书目选择区 */}
          <div className="col-span-3 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>古籍书目</CardTitle>
                <CardDescription>选择待采集的古籍</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Select
                  label="古籍名称"
                  placeholder="请选择古籍"
                  value={formData.bookId}
                  onChange={(e) => updateField('bookId', e.target.value)}
                  options={books.map(book => ({ value: book.id, label: book.name }))}
                  error={errors.bookId}
                />

                {currentBook && (
                  <div className="p-3 bg-paper-100 rounded-lg border border-paper-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="default">
                        {currentBook.dynasty}代
                      </Badge>
                    </div>
                    <div className="text-sm text-ink-600 mb-1">
                      <span className="text-ink-400">作者：</span>
                      {currentBook.author}
                    </div>
                    <div className="text-sm text-ink-600 mb-1">
                      <span className="text-ink-400">总册数：</span>
                      {currentBook.totalVolumes} 册
                    </div>
                    <div className="text-xs text-ink-400 mt-2 line-clamp-2">
                      {currentBook.description}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="册数"
                    type="number"
                    min={1}
                    value={formData.volumeNumber}
                    onChange={(e) => updateField('volumeNumber', parseInt(e.target.value) || 1)}
                    error={errors.volumeNumber}
                  />
                  <Input
                    label="页码"
                    type="number"
                    min={1}
                    value={formData.pageNumber}
                    onChange={(e) => updateField('pageNumber', parseInt(e.target.value) || 1)}
                    error={errors.pageNumber}
                  />
                </div>

                {currentBook && (
                  <div className="p-4 bg-azure-50 border border-azure-200 rounded-lg">
                    <div className="flex items-center gap-2 text-azure-700">
                      <Ruler size={16} />
                      <span className="text-sm font-medium">朝代：{currentBook.dynasty}代</span>
                    </div>
                    <p className="text-xs text-azure-600 mt-1">
                      {currentBook.dynasty === '唐' && '唐代纸张多为麻纸、皮纸，帘纹细密'}
                      {currentBook.dynasty === '宋' && '宋代纸张以皮纸、竹纸为主，质地坚韧'}
                      {currentBook.dynasty === '元' && '元代纸张延续宋代风格，帘纹较宽'}
                      {currentBook.dynasty === '明' && '明代纸张种类丰富，棉纸开始流行'}
                      {currentBook.dynasty === '清' && '清代纸张工艺成熟，宣纸为上品'}
                      {currentBook.dynasty === '现代' && '现代仿古建筑用纸，需注意鉴别'}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* 中间：物理指标采集区 */}
          <div className="col-span-5 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>物理指标采集</CardTitle>
                <CardDescription>录入书页的物理特性参数</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  {/* 帘纹间距 */}
                  <div className="space-y-3">
                    <Slider
                      label="帘纹间距"
                      min={0}
                      max={50}
                      step={0.1}
                      value={formData.curtainPatternSpacing}
                      onChange={(v) => updateField('curtainPatternSpacing', v)}
                      unit="mm"
                    />
                    {errors.curtainPatternSpacing && (
                      <p className="text-xs text-seal-500">{errors.curtainPatternSpacing}</p>
                    )}
                    <Input
                      type="number"
                      min={0}
                      max={50}
                      step={0.1}
                      value={formData.curtainPatternSpacing}
                      onChange={(e) => updateField('curtainPatternSpacing', parseFloat(e.target.value) || 0)}
                      suffix="mm"
                    />
                  </div>

                  {/* 纤维成分 */}
                  <div className="space-y-3">
                    <Select
                      label="纤维成分"
                      placeholder="请选择"
                      value={formData.fiberComposition}
                      onChange={(e) => updateField('fiberComposition', e.target.value)}
                      options={fiberOptions}
                      error={errors.fiberComposition}
                    />
                    <Input
                      label="备注"
                      placeholder="如：青檀皮、沙田稻草"
                      value={formData.fiberNote}
                      onChange={(e) => updateField('fiberNote', e.target.value)}
                    />
                  </div>

                  {/* 厚度 */}
                  <div className="space-y-3">
                    <Slider
                      label="厚度"
                      min={0.01}
                      max={1.00}
                      step={0.01}
                      value={formData.thickness}
                      onChange={(v) => updateField('thickness', v)}
                      unit="mm"
                    />
                    {errors.thickness && (
                      <p className="text-xs text-seal-500">{errors.thickness}</p>
                    )}
                    <Input
                      type="number"
                      min={0.01}
                      max={1.00}
                      step={0.01}
                      value={formData.thickness}
                      onChange={(e) => updateField('thickness', parseFloat(e.target.value) || 0.01)}
                      suffix="mm"
                    />
                  </div>

                  {/* pH值 */}
                  <div className="space-y-3">
                    <Slider
                      label="pH值"
                      min={3.0}
                      max={10.0}
                      step={0.1}
                      value={formData.pHValue}
                      onChange={(v) => updateField('pHValue', v)}
                    />
                    {errors.pHValue && (
                      <p className="text-xs text-seal-500">{errors.pHValue}</p>
                    )}
                    <Input
                      type="number"
                      min={3.0}
                      max={10.0}
                      step={0.1}
                      value={formData.pHValue}
                      onChange={(e) => updateField('pHValue', parseFloat(e.target.value) || 7.0)}
                    />
                  </div>
                </div>

                {/* 色度Lab值 */}
                <ColorPicker
                  value={{
                    L: formData.colorL,
                    a: formData.colorA,
                    b: formData.colorB,
                  }}
                  onChange={(color) => {
                    updateField('colorL', color.L);
                    updateField('colorA', color.a);
                    updateField('colorB', color.b);
                  }}
                  title="色度Lab值"
                  description="使用分光光度计测量的纸张颜色"
                />
              </CardContent>
            </Card>
          </div>

          {/* 右侧：影像上传区 */}
          <div className="col-span-4 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>影像资料</CardTitle>
                <CardDescription>上传书页的高清影像</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <UploadZone type="front" image={formData.frontImage} label="正面图" />
                  <UploadZone type="back" image={formData.backImage} label="背面图" />
                </div>

                {errors.frontImage && (
                  <p className="text-xs text-seal-500">{errors.frontImage}</p>
                )}
                {errors.backImage && (
                  <p className="text-xs text-seal-500">{errors.backImage}</p>
                )}

                {/* 局部特写 */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-medium text-ink-500">局部特写（可多张）</label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleImageUpload('detail')}
                      className="h-7"
                    >
                      <Plus size={14} className="mr-1" />
                      添加
                    </Button>
                  </div>
                  {formData.detailImages.length > 0 ? (
                    <div className="grid grid-cols-3 gap-2">
                      {formData.detailImages.map((img, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={img}
                            alt={`特写${index + 1}`}
                            className="w-full h-20 object-cover rounded-lg border border-paper-200"
                          />
                          <button
                            onClick={() => handleRemoveDetailImage(index)}
                            className="absolute top-1 right-1 p-1 bg-seal-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div
                      className={cn(
                        'border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-all',
                        isDragOver === 'detail'
                          ? 'border-azure-400 bg-azure-50'
                          : 'border-paper-300 bg-paper-100 hover:border-azure-300'
                      )}
                      onDragOver={(e) => handleDragOver(e, 'detail')}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, 'detail')}
                      onClick={() => handleImageUpload('detail')}
                    >
                      <ImageIcon size={24} className="text-ink-400 mx-auto mb-2" />
                      <div className="text-sm text-ink-500">点击或拖拽上传特写图片</div>
                    </div>
                  )}
                </div>

                {/* 比例尺参照 */}
                <Input
                  label="比例尺参照"
                  placeholder="如：1cm = 50px 或 比例尺：1:10"
                  value={formData.scaleReference}
                  onChange={(e) => updateField('scaleReference', e.target.value)}
                  error={errors.scaleReference}
                  prefix={<Ruler size={16} />}
                />

                {/* 已上传图片预览 */}
                {(formData.frontImage || formData.backImage || formData.detailImages.length > 0) && (
                  <div className="pt-4 border-t border-paper-200">
                    <div className="text-sm font-medium text-ink-500 mb-3">已上传图片预览</div>
                    <div className="flex gap-2 overflow-x-auto pb-2">
                      {formData.frontImage && (
                        <div className="flex-shrink-0">
                          <img
                            src={formData.frontImage}
                            alt="正面预览"
                            className="w-16 h-20 object-cover rounded border border-paper-200"
                          />
                          <div className="text-xs text-center text-ink-400 mt-1">正面</div>
                        </div>
                      )}
                      {formData.backImage && (
                        <div className="flex-shrink-0">
                          <img
                            src={formData.backImage}
                            alt="背面预览"
                            className="w-16 h-20 object-cover rounded border border-paper-200"
                          />
                          <div className="text-xs text-center text-ink-400 mt-1">背面</div>
                        </div>
                      )}
                      {formData.detailImages.map((img, index) => (
                        <div key={index} className="flex-shrink-0">
                          <img
                            src={img}
                            alt={`特写预览${index + 1}`}
                            className="w-16 h-20 object-cover rounded border border-paper-200"
                          />
                          <div className="text-xs text-center text-ink-400 mt-1">特写{index + 1}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* 底部：操作按钮 */}
        <div className="mt-6 flex items-center justify-end gap-3 p-4 bg-paper-50 rounded-lg border border-paper-200">
          <Button
            variant="secondary"
            onClick={handleReset}
            disabled={isSubmitting}
          >
            <RotateCcw size={16} className="mr-2" />
            重置表单
          </Button>
          <Button
            variant="secondary"
            onClick={() => handleSubmit('待检测')}
            disabled={isSubmitting}
          >
            <Save size={16} className="mr-2" />
            保存草稿
          </Button>
          <Button
            variant="primary"
            onClick={() => handleSubmit('已检测')}
            disabled={isSubmitting}
            loading={isSubmitting}
          >
            <Send size={16} className="mr-2" />
            提交采集
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PageCollection;
