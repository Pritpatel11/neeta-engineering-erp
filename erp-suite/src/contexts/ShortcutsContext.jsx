import React, { createContext, useContext, useState, useEffect } from 'react';
import toast from 'react-hot-toast';

const ShortcutsContext = createContext();

export const useShortcuts = () => useContext(ShortcutsContext);

export const ShortcutsProvider = ({ children }) => {
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isQuickCreateOpen, setIsQuickCreateOpen] = useState(false);

  const toggleCommandPalette = () => setIsCommandPaletteOpen((prev) => !prev);
  const toggleQuickCreate = () => setIsQuickCreateOpen((prev) => !prev);
  const closeAllModals = () => {
    setIsCommandPaletteOpen(false);
    setIsQuickCreateOpen(false);
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl + K for Command Palette
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsQuickCreateOpen(false);
        toggleCommandPalette();
      }

      // Ctrl + N for Quick Create
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        setIsCommandPaletteOpen(false);
        toggleQuickCreate();
      }

      // Ctrl + S for Save Draft (Dispatch custom event)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        // Dispatching a custom event that any page component can listen to
        window.dispatchEvent(new CustomEvent('save-draft'));
        // Basic fallback toast
        toast('Draft save triggered!', { icon: '💾' });
      }

      // Escape to close modals
      if (e.key === 'Escape') {
        closeAllModals();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <ShortcutsContext.Provider
      value={{
        isCommandPaletteOpen,
        setIsCommandPaletteOpen,
        isQuickCreateOpen,
        setIsQuickCreateOpen,
        closeAllModals,
      }}
    >
      {children}
    </ShortcutsContext.Provider>
  );
};
