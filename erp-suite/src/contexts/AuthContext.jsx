import React, { createContext, useContext, useState, useEffect } from 'react';
import { loginApi, getMeApi } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('erp_user') || sessionStorage.getItem('erp_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() => {
    return localStorage.getItem('erp_token') || sessionStorage.getItem('erp_token') || null;
  });

  const [isLoading, setIsLoading] = useState(true);

  // Verify session on initial load
  useEffect(() => {
    const verifySession = async () => {
      const activeToken = localStorage.getItem('erp_token') || sessionStorage.getItem('erp_token');
      if (!activeToken) {
        setIsLoading(false);
        return;
      }

      try {
        const userData = await getMeApi();
        setUser(userData);
        if (localStorage.getItem('erp_token')) {
          localStorage.setItem('erp_user', JSON.stringify(userData));
        } else {
          sessionStorage.setItem('erp_user', JSON.stringify(userData));
        }
      } catch (err) {
        console.warn('Session verification failed, logging out:', err);
        logout();
      } finally {
        setIsLoading(false);
      }
    };

    verifySession();

    // Listen for auth expiration events triggered by api interceptor
    const handleAuthExpired = () => {
      logout();
    };

    window.addEventListener('erp_auth_expired', handleAuthExpired);
    return () => window.removeEventListener('erp_auth_expired', handleAuthExpired);
  }, []);

  const login = async (username, password, rememberMe = true) => {
    const data = await loginApi(username, password);
    const { token: receivedToken, user: receivedUser } = data;

    setToken(receivedToken);
    setUser(receivedUser);

    if (rememberMe) {
      localStorage.setItem('erp_token', receivedToken);
      localStorage.setItem('erp_user', JSON.stringify(receivedUser));
      sessionStorage.removeItem('erp_token');
      sessionStorage.removeItem('erp_user');
    } else {
      sessionStorage.setItem('erp_token', receivedToken);
      sessionStorage.setItem('erp_user', JSON.stringify(receivedUser));
      localStorage.removeItem('erp_token');
      localStorage.removeItem('erp_user');
    }

    return receivedUser;
  };

  const logout = () => {
    localStorage.removeItem('erp_token');
    localStorage.removeItem('erp_user');
    sessionStorage.removeItem('erp_token');
    sessionStorage.removeItem('erp_user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
