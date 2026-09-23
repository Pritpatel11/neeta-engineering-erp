import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

export default function MainLayout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen w-full flex relative overflow-x-hidden bg-slate-50">
      {/* Mobile Drawer Backdrop */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-40 transition-opacity lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      <Sidebar 
        isOpen={isMobileMenuOpen} 
        onClose={() => setIsMobileMenuOpen(false)} 
      />

      <div className="flex-1 flex flex-col w-full min-w-0 transition-[margin] duration-300 lg:ml-[280px]">
        <Header 
          onToggleMobileMenu={() => setIsMobileMenuOpen(prev => !prev)} 
        />
        
        <main className="flex-1 min-w-0 bg-slate-50 overflow-y-auto p-4 md:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
