import React, { useState, useEffect, useRef } from 'react';
import { Search, FileText, Truck, Package, X } from 'lucide-react';
import { useShortcuts } from '../contexts/ShortcutsContext';
import { useTabs } from '../contexts/TabContext';
import { routeConfig } from '../routeConfig';

export default function CommandPalette() {
  const { isCommandPaletteOpen, setIsCommandPaletteOpen } = useShortcuts();
  const { openTab } = useTabs();
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
    openTab(route.path, route.label);
    setIsCommandPaletteOpen(false);
  };

  if (!isCommandPaletteOpen) return null;

  return (
    <div className="modal-overlay glass-overlay" onClick={() => setIsCommandPaletteOpen(false)}>
      <div 
        className="command-palette-container" 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="command-palette-header">
          <Search size={20} className="command-search-icon" />
          <input
            ref={inputRef}
            type="text"
            className="command-search-input"
            placeholder="Search pages, actions (e.g. Invoice, Challan)..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
          />
          <button className="command-close-btn" onClick={() => setIsCommandPaletteOpen(false)}>
            <X size={18} />
          </button>
        </div>
        
        <div className="command-palette-results">
          {filteredRoutes.length > 0 ? (
            filteredRoutes.map((route, index) => (
              <div
                key={route.path}
                className={`command-palette-item ${index === selectedIndex ? 'selected' : ''}`}
                onClick={() => handleSelect(route)}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                <div className="command-item-icon">
                  <FileText size={16} />
                </div>
                <div className="command-item-label">{route.label}</div>
                <div className="command-item-shortcut">Jump to page</div>
              </div>
            ))
          ) : (
            <div className="command-palette-empty">No results found for "{query}"</div>
          )}
        </div>
        <div className="command-palette-footer">
          <span><kbd>↑</kbd> <kbd>↓</kbd> to navigate</span>
          <span><kbd>Enter</kbd> to select</span>
          <span><kbd>Esc</kbd> to close</span>
        </div>
      </div>
    </div>
  );
}
