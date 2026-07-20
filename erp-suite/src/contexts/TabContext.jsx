import React, { createContext, useContext, useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getRouteConfig } from '../routeConfig';

const TabContext = createContext();

export const useTabs = () => useContext(TabContext);

export const TabProvider = ({ children }) => {
  const [tabs, setTabs] = useState([]);
  const [activeTab, setActiveTab] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();

  // On mount and route change, ensure the current path is open as a tab
  useEffect(() => {
    // Only handle routes that are in our routeConfig
    const route = getRouteConfig(location.pathname);
    if (route) {
      openTab(location.pathname, route.label);
    }
  }, [location.pathname]);

  const openTab = (path, label) => {
    setTabs((prevTabs) => {
      const existingTab = prevTabs.find((t) => t.path === path);
      if (existingTab) {
        return prevTabs;
      }
      // Max limit check, optional. E.g., limit to 10 tabs
      if (prevTabs.length >= 10) {
        alert("Maximum tabs reached. Please close some tabs.");
        return prevTabs;
      }
      return [...prevTabs, { path, label }];
    });
    setActiveTab(path);
    // Sync the router URL without causing a full re-render of the outlet
    if (location.pathname !== path) {
      navigate(path);
    }
  };

  const closeTab = (path, e) => {
    if (e) {
      e.stopPropagation();
    }
    
    setTabs((prevTabs) => {
      const newTabs = prevTabs.filter((t) => t.path !== path);
      
      // If we closed the active tab, switch to another tab (the last one)
      if (activeTab === path) {
        if (newTabs.length > 0) {
          const nextTabPath = newTabs[newTabs.length - 1].path;
          setActiveTab(nextTabPath);
          navigate(nextTabPath);
        } else {
          // If no tabs left, navigate to dashboard
          setActiveTab('/');
          navigate('/');
        }
      }
      return newTabs;
    });
  };

  const closeAllTabs = () => {
    setTabs([{ path: '/', label: 'Dashboard' }]);
    setActiveTab('/');
    navigate('/');
  };

  return (
    <TabContext.Provider value={{ tabs, activeTab, openTab, closeTab, closeAllTabs, setActiveTab }}>
      {children}
    </TabContext.Provider>
  );
};
