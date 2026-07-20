import { Outlet, useNavigate } from 'react-router-dom';
import { X, LayoutTemplate } from 'lucide-react';
import { motion } from 'framer-motion';
import Sidebar from './Sidebar';
import Header from './Header';
import { useTabs } from '../../contexts/TabContext';
import { getRouteConfig } from '../../routeConfig';
import './Layout.css';

export default function MainLayout() {
  const { tabs, activeTab, setActiveTab, closeTab, closeAllTabs } = useTabs();
  const navigate = useNavigate();

  const handleTabClick = (path) => {
    setActiveTab(path);
    navigate(path);
  };

  return (
    <div className="layout-container">
      <Sidebar />
      <div className="main-wrapper">
        <Header />
        
        {/* IDE-Style Tab Bar */}
        <div className="ide-tab-bar">
          <div className="tab-scroll-area">
            {tabs.map((tab) => (
              <div
                key={tab.path}
                className={`ide-tab ${activeTab === tab.path ? 'active' : ''}`}
                onClick={() => handleTabClick(tab.path)}
                title={tab.label}
              >
                <span className="tab-label">{tab.label}</span>
                {tab.path !== '/' && (
                  <button 
                    className="tab-close-btn" 
                    onClick={(e) => closeTab(tab.path, e)}
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
          
          {tabs.length > 1 && (
            <button className="tab-close-all-btn" onClick={closeAllTabs} title="Close All Tabs">
              <LayoutTemplate size={16} />
            </button>
          )}
        </div>

        <main className="main-content has-tabs">
          {/* Render all open tabs, but hide inactive ones using CSS */}
          {tabs.map(tab => {
            const route = getRouteConfig(tab.path);
            if (!route) return null;
            
            const isActive = activeTab === tab.path;
            
            return (
              <div 
                key={tab.path} 
                className="tab-content-wrapper" 
                style={{ display: isActive ? 'block' : 'none', height: '100%' }}
              >
                <motion.div
                  initial={false}
                  animate={isActive ? { opacity: 1, y: 0 } : { opacity: 0, y: 15 }}
                  transition={{ duration: 0.25, ease: 'easeOut' }}
                  style={{ height: '100%' }}
                >
                  {route.component}
                </motion.div>
              </div>
            );
          })}
          
          {/* Fallback for routes not managed by tabs (if any) */}
          {tabs.length === 0 && <Outlet />}
        </main>
      </div>
    </div>
  );
}
