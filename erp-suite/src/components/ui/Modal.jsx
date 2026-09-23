import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export default function Modal({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = 'max-w-xl',
  showClose = true,
  className = '',
}) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose?.();
      }
    };

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-slate-900/60 backdrop-blur-sm animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        className={`w-full ${maxWidth} bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-scaleUp ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        {(title || showClose) && (
          <div className="flex items-center justify-between px-5 py-4 sm:px-6 border-b border-slate-100 bg-slate-50/50">
            <div>
              {title && (
                <h3 id="modal-title" className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                  {title}
                </h3>
              )}
              {subtitle && (
                <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
              )}
            </div>

            {showClose && (
              <button
                type="button"
                onClick={onClose}
                aria-label="Close dialog"
                className="text-slate-400 hover:text-slate-700 hover:bg-slate-100 p-2 rounded-lg transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center -mr-1"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        )}

        {/* Modal Body with vertical scroll */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 overscroll-contain">
          {children}
        </div>
      </div>
    </div>
  );
}
