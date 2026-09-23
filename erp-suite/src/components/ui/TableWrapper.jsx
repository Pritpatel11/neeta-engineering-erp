import React from 'react';

export default function TableWrapper({
  children,
  className = '',
  loading = false,
  containerClassName = '',
  minWidth = '100%',
}) {
  const minWidthStyle = typeof minWidth === 'number' ? `${minWidth}px` : minWidth;

  return (
    <div className={`w-full bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden flex flex-col ${containerClassName}`}>
      <div className={`w-full overflow-x-auto relative overscroll-x-contain ${className}`}>
        {loading && (
          <div className="absolute inset-0 bg-white/70 backdrop-blur-[1px] z-10 flex items-center justify-center min-h-[140px]">
            <div className="flex items-center gap-2 text-sm text-slate-600 font-medium">
              <span className="w-4 h-4 border-2 border-[#0059bb] border-t-transparent rounded-full animate-spin" />
              Loading records...
            </div>
          </div>
        )}
        <div style={{ minWidth: minWidthStyle, width: '100%' }}>
          {children}
        </div>
      </div>
    </div>
  );
}
