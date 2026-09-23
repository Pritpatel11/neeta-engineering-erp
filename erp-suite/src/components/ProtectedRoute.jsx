import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { canAccessModule } from '../utils/permissionUtils';
import { Loader2 } from 'lucide-react';

export default function ProtectedRoute({ children }) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-slate-900 p-4">
        <div className="bg-white border border-slate-200 p-9 rounded-2xl flex flex-col items-center gap-4 shadow-sm max-w-sm w-full">
          <Loader2 size={32} className="text-[#0059bb] animate-spin" />
          <div className="text-center">
            <h3 className="text-base font-semibold text-slate-900">
              Neeta Engineering ERP
            </h3>
            <p className="mt-1.5 text-sm text-slate-500">
              Verifying credentials & permissions...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check RBAC permission for restricted routes (e.g. /owner-dashboard or /user-management)
  const hasAccess = canAccessModule(user, location.pathname);

  if (!hasAccess) {
    // Gracefully redirect to home workspace without showing any restriction blocker
    return <Navigate to="/" replace />;
  }

  return children;
}
