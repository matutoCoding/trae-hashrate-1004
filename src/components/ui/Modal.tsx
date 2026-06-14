import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './Button';

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  showCloseButton?: boolean;
  closeOnOverlayClick?: boolean;
  closeOnEsc?: boolean;
  className?: string;
}

export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  showCloseButton = true,
  closeOnOverlayClick = true,
  closeOnEsc = true,
  className,
}: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (closeOnEsc && e.key === 'Escape' && open) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [open, onClose, closeOnEsc]);

  useEffect(() => {
    if (open) {
      modalRef.current?.focus();
    }
  }, [open]);

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (closeOnOverlayClick && e.target === overlayRef.current) {
      onClose();
    }
  };

  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-900/60 animate-fade-in"
      onClick={handleOverlayClick}
    >
      <div
        ref={modalRef}
        tabIndex={-1}
        className={cn(
          'relative w-full max-w-lg bg-paper-50 rounded-xl shadow-scroll-hover border border-paper-200 animate-slide-up',
          'focus:outline-none',
          className
        )}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-paper-200">
          {title && (
            <h3 className="font-song font-semibold text-lg text-ink-700">
              {title}
            </h3>
          )}
          {showCloseButton && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="p-1 h-auto"
              aria-label="关闭"
            >
              <X className="w-5 h-5" />
            </Button>
          )}
        </div>

        <div className="px-6 py-4 max-h-[70vh] overflow-y-auto scrollbar-thin">
          {children}
        </div>

        {footer && (
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-paper-200">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

export interface ModalFooterProps {
  children: React.ReactNode;
  className?: string;
}

export function ModalFooter({ children, className }: ModalFooterProps) {
  return (
    <div className={cn('flex items-center justify-end gap-3', className)}>
      {children}
    </div>
  );
}
