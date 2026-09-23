import React from 'react';
import { X, FileText, Truck, Receipt, PackagePlus, FilePlus2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useShortcuts } from '../contexts/ShortcutsContext';

export default function QuickCreateModal() {
  const { isQuickCreateOpen, setIsQuickCreateOpen } = useShortcuts();
  const navigate = useNavigate();

  if (!isQuickCreateOpen) return null;

  const quickActions = [
    { label: 'New Invoice', path: '/invoice', icon: <FileText size={24} /> },
    { label: 'New Quotation', path: '/create-quotation', icon: <FilePlus2 size={24} /> },
    { label: 'New Challan', path: '/create-challan', icon: <Truck size={24} /> },
    { label: 'New Statement', path: '/create-statement', icon: <Receipt size={24} /> },
    { label: 'New Material Inward (CR)', path: '/create-cr', icon: <PackagePlus size={24} /> },
    { label: 'New Receipt', path: '/create-receipt', icon: <FileText size={24} /> },
  ];

  const handleSelect = (path) => {
    navigate(path);
    setIsQuickCreateOpen(false);
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150" 
      onClick={() => setIsQuickCreateOpen(false)}
    >
      <div 
        className="bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-150" 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h3 className="text-base font-bold text-slate-900">Quick Create</h3>
          <button 
            type="button"
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer" 
            onClick={() => setIsQuickCreateOpen(false)}
          >
            <X size={18} />
          </button>
        </div>
        
        <div className="p-5 grid grid-cols-2 sm:grid-cols-3 gap-3">
          {quickActions.map((action) => (
            <button
              type="button" 
              key={action.path} 
              className="flex flex-col items-center justify-center p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-blue-50/60 hover:border-blue-300 hover:shadow-xs transition-all cursor-pointer group text-center gap-2"
              onClick={() => handleSelect(action.path)}
            >
              <div className="w-11 h-11 rounded-xl bg-white border border-slate-200 shadow-2xs flex items-center justify-center text-slate-600 group-hover:text-[#0059bb] group-hover:scale-105 transition-all">
                {action.icon}
              </div>
              <span className="text-xs font-semibold text-slate-700 group-hover:text-[#0059bb] transition-colors leading-tight">
                {action.label}
              </span>
            </button>
          ))}
        </div>
        
        <div className="px-5 py-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-end text-xs text-slate-500">
          <span><kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-slate-600 font-mono shadow-2xs">Esc</kbd> to close</span>
        </div>
      </div>
    </div>
  );
}
