import { Search, Bell, HelpCircle, Plus } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPendingEnquiriesCount } from '../../services/api';
import { useShortcuts } from '../../contexts/ShortcutsContext';

export default function Header() {
  const [pendingCount, setPendingCount] = useState(0);
  const navigate = useNavigate();
  const { setIsCommandPaletteOpen, setIsQuickCreateOpen } = useShortcuts();

  useEffect(() => {
    if ('Notification' in window && Notification.permission !== 'granted' && Notification.permission !== 'denied') {
      Notification.requestPermission();
    }

    let isFirstLoad = true;

    const fetchCount = async () => {
      try {
        const { count } = await getPendingEnquiriesCount();
        setPendingCount(prev => {
          if (!isFirstLoad && count > prev && 'Notification' in window && Notification.permission === 'granted') {
            new Notification('New Website Enquiry!', {
              body: `You have ${count} pending enquiries awaiting review.`,
              icon: './logo.png'
            });
          }
          isFirstLoad = false;
          return count;
        });
      } catch (err) {
        console.error('Header polling error:', err);
      }
    };

    fetchCount();
    const interval = setInterval(fetchCount, 30000);
    return () => clearInterval(interval);
  }, []);
  return (
    <header className="top-header glass-header">
      <div 
        className="header-search" 
        onClick={() => setIsCommandPaletteOpen(true)}
        style={{ cursor: 'pointer', justifyContent: 'space-between' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Search size={18} color="var(--color-outline)" />
          <span style={{ color: 'var(--color-on-surface-variant)', fontSize: '0.9rem' }}>Search or jump to...</span>
        </div>
        <div className="shortcut-badge">Ctrl K</div>
      </div>
      
      <div className="header-actions">
        <button 
          className="btn-primary" 
          style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', fontSize: '0.85rem' }}
          onClick={() => setIsQuickCreateOpen(true)}
        >
          <Plus size={16} /> Create
          <span className="shortcut-badge dark">Ctrl N</span>
        </button>

        <button className="icon-btn">
          <HelpCircle size={20} />
        </button>
        <button className="icon-btn" style={{ position: 'relative' }} onClick={() => navigate('/enquiries')}>
          <Bell size={20} />
          {pendingCount > 0 && (
            <span style={{ 
              position: 'absolute', 
              top: '0px', 
              right: '2px', 
              width: '16px', 
              height: '16px', 
              backgroundColor: 'var(--color-error)', 
              color: 'white',
              fontSize: '10px',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '50%' 
            }}>
              {pendingCount > 99 ? '99+' : pendingCount}
            </span>
          )}
        </button>
        
        <div className="user-profile">
          <div className="avatar">A</div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '0.875rem', fontWeight: 'bold' }}>Admin User</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-on-surface-variant)' }}>Owner</span>
          </div>
        </div>
      </div>
    </header>
  );
}
