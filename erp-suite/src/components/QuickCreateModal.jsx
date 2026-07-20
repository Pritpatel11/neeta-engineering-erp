import React from 'react';
import { X, FileText, Truck, Receipt, PackagePlus, FilePlus2 } from 'lucide-react';
import { useShortcuts } from '../contexts/ShortcutsContext';
import { useTabs } from '../contexts/TabContext';

export default function QuickCreateModal() {
  const { isQuickCreateOpen, setIsQuickCreateOpen } = useShortcuts();
  const { openTab } = useTabs();

  if (!isQuickCreateOpen) return null;

  const quickActions = [
    { label: 'New Invoice', path: '/invoice', icon: <FileText size={24} /> },
    { label: 'New Quotation', path: '/create-quotation', icon: <FilePlus2 size={24} /> },
    { label: 'New Challan', path: '/create-challan', icon: <Truck size={24} /> },
    { label: 'New Statement', path: '/create-statement', icon: <Receipt size={24} /> },
    { label: 'New Material Inward (CR)', path: '/create-cr', icon: <PackagePlus size={24} /> },
    { label: 'New Receipt', path: '/create-receipt', icon: <FileText size={24} /> },
  ];

  const handleSelect = (path, label) => {
    openTab(path, label);
    setIsQuickCreateOpen(false);
  };

  return (
    <div className="modal-overlay glass-overlay" onClick={() => setIsQuickCreateOpen(false)}>
      <div 
        className="quick-create-container" 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="quick-create-header">
          <h3>Quick Create</h3>
          <button className="command-close-btn" onClick={() => setIsQuickCreateOpen(false)}>
            <X size={20} />
          </button>
        </div>
        
        <div className="quick-create-grid">
          {quickActions.map((action) => (
            <div 
              key={action.path} 
              className="quick-create-card"
              onClick={() => handleSelect(action.path, action.label)}
            >
              <div className="quick-create-icon">{action.icon}</div>
              <div className="quick-create-label">{action.label}</div>
            </div>
          ))}
        </div>
        
        <div className="command-palette-footer" style={{ borderTop: 'none', paddingTop: '10px' }}>
          <span><kbd>Esc</kbd> to close</span>
        </div>
      </div>
    </div>
  );
}
