import React, { useState, useEffect, useRef } from 'react';
import { Search, FileText, Truck, Package, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useShortcuts } from '../contexts/ShortcutsContext';
import { routeConfig } from '../routeConfig';

export default function CommandPalette() {
  const { isCommandPaletteOpen, setIsCommandPaletteOpen } = useShortcuts();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);

  // Filter routes based on query
  const filteredRoutes = routeConfig.filter((route) =>
    route.label.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    if (isCommandPaletteOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isCommandPaletteOpen]);

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < filteredRoutes.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredRoutes[selectedIndex]) {
        handleSelect(filteredRoutes[selectedIndex]);
      }
    }
  };

  const handleSelect = (route) => {
    navigate(route.path);
    setIsCommandPaletteOpen(false);
  };

  if (!isCommandPaletteOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-slate-900/40 backdrop-blur-xs" 
      onClick={() => setIsCommandPaletteOpen(false)}
    >
      <div 
        className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col" 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-3.5 border-b border-slate-200 flex items-center gap-3 bg-white">
          <Search size={20} className="text-slate-400 shrink-0 ml-1" />
          <input
            ref={inputRef}
            type="text"
            className="flex-1 text-sm bg-transparent outline-none text-slate-900 placeholder:text-slate-400 font-medium"
            placeholder="Search pages, actions (e.g. Invoice, Challan)..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
          />
          <button 
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer" 
            onClick={() => setIsCommandPaletteOpen(false)}
          >
            <X size={18} />
          </button>
        </div>
        
        <div className="max-h-72 overflow-y-auto p-2 divide-y divide-slate-50">
          {filteredRoutes.length > 0 ? (
            filteredRoutes.map((route, index) => (
              <div
                key={route.path}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm transition-colors cursor-pointer ${
                  index === selectedIndex 
                    ? 'bg-blue-50 text-[#0059bb] font-semibold' 
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
                onClick={() => handleSelect(route)}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-1.5 rounded-lg ${index === selectedIndex ? 'bg-[#0059bb] text-white' : 'bg-slate-100 text-slate-600'}`}>
                    <FileText size={16} />
                  </div>
                  <span>{route.label}</span>
                </div>
                <span className="text-xs text-slate-400">Jump to page</span>
              </div>
            ))
          ) : (
            <div className="py-8 text-center text-xs text-slate-400">No results found for "{query}"</div>
          )}
        </div>
        <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
          <span><kbd className="px-1.5 py-0.5 rounded bg-white border border-slate-200 font-mono text-[10px]">↑</kbd> <kbd className="px-1.5 py-0.5 rounded bg-white border border-slate-200 font-mono text-[10px]">↓</kbd> to navigate</span>
          <span><kbd className="px-1.5 py-0.5 rounded bg-white border border-slate-200 font-mono text-[10px]">Enter</kbd> to select</span>
          <span><kbd className="px-1.5 py-0.5 rounded bg-white border border-slate-200 font-mono text-[10px]">Esc</kbd> to close</span>
        </div>
      </div>
    </div>
  );
}
