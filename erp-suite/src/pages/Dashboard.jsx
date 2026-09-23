import React, { useState, useEffect, useCallback } from 'react';
import { 
  RefreshCcw, 
  Layers, 
  Calendar, 
  LayoutDashboard, 
  Shield, 
  Building2, 
  DollarSign, 
  Boxes, 
  Factory, 
  ShieldCheck, 
  Clock, 
  TrendingUp,
  ChevronDown
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { 
  getAdminDashboardData,
  getOwnerDashboardData,
  getAccountsDashboardData,
  getStoreDashboardData,
  getProductionDashboardData,
  getQualityDashboardData,
  getEmployeeDashboardData
} from '../services/api';
import AdminDashboardView from './dashboards/AdminDashboardView';
import AccountsDashboardView from './dashboards/AccountsDashboardView';
import StoreDashboardView from './dashboards/StoreDashboardView';
import ProductionDashboardView from './dashboards/ProductionDashboardView';
import QualityDashboardView from './dashboards/QualityDashboardView';
import EmployeeDashboardView from './dashboards/EmployeeDashboardView';
import OwnerDashboard from './OwnerDashboard';
import toast from 'react-hot-toast';

export default function Dashboard() {
  const { user } = useAuth();

  // Selected date period: 'all', 'today', 'this_week', 'this_month'
  const [period, setPeriod] = useState('all');

  // Admin preview switcher (Admin can inspect any department dashboard)
  const [adminPreview, setAdminPreview] = useState(null);

  // Data states
  const [dashboardData, setDashboardData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Determine active view based on role, department, and admin preview
  const determineActiveView = useCallback(() => {
    if (user?.role === 'admin' && adminPreview) {
      return adminPreview;
    }
    if (user?.role === 'admin') return 'admin';
    if (user?.role === 'owner') return 'owner';
    if (user?.role === 'manager') {
      if (user.department === 'accounts') return 'accounts';
      if (user.department === 'logistics' || user.department === 'store') return 'store';
      if (user.department === 'production') return 'production';
      if (user.department === 'quality') return 'quality';
      return 'accounts';
    }
    return 'employee'; // default for regular user / worker
  }, [user, adminPreview]);

  const activeView = determineActiveView();

  // Fetch real database data for the active view
  const fetchDashboard = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = { period };
      let data = null;

      switch (activeView) {
        case 'admin':
          data = await getAdminDashboardData(params);
          break;
        case 'owner':
          data = await getOwnerDashboardData(params);
          break;
        case 'accounts':
          data = await getAccountsDashboardData(params);
          break;
        case 'store':
          data = await getStoreDashboardData(params);
          break;
        case 'production':
          data = await getProductionDashboardData(params);
          break;
        case 'quality':
          data = await getQualityDashboardData(params);
          break;
        case 'employee':
          data = await getEmployeeDashboardData(params);
          break;
        default:
          data = await getEmployeeDashboardData(params);
      }

      setDashboardData(data);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
      const msg = err.response?.data?.message || err.message || 'Failed to load dashboard data';
      setError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  }, [activeView, period]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  // Titles and meta info per view
  const viewMetadata = {
    admin: {
      title: 'Administrator Control Center',
      subtitle: 'System-wide activity, user accounts, audit logs, and operational overview',
      icon: <Shield size={22} color="#2563eb" />,
      badge: 'Super Admin',
      badgeClass: 'info',
    },
    owner: {
      title: 'Executive Business Summary',
      subtitle: 'High-level operational throughput, department milestones, and employee performance',
      icon: <TrendingUp size={22} color="#059669" />,
      badge: 'Executive Portal',
      badgeClass: 'success',
    },
    accounts: {
      title: 'Accounts & Billing Dashboard',
      subtitle: 'GST invoices, material statements (MR), receipts, and accounting task workflows',
      icon: <DollarSign size={22} color="#059669" />,
      badge: user?.role === 'manager' ? 'Accounts Manager' : 'Accounts Workspace',
      badgeClass: 'success',
    },
    store: {
      title: 'Store & Logistics Dashboard',
      subtitle: 'Real warehouse stock balances, inward consignments (CR), and delivery challans',
      icon: <Boxes size={22} color="#d97706" />,
      badge: user?.role === 'manager' ? 'Store Manager' : 'Logistics Workspace',
      badgeClass: 'warning',
    },
    production: {
      title: 'Production & Manufacturing Dashboard',
      subtitle: 'Fabrication jobs, machine cell status, shift schedules, and material draws',
      icon: <Factory size={22} color="#2563eb" />,
      badge: user?.role === 'manager' ? 'Production Manager' : 'Shopfloor Workspace',
      badgeClass: 'info',
    },
    quality: {
      title: 'Quality Assurance & IPQC Dashboard',
      subtitle: 'Inward lot verification, pre-dispatch inspections, and compliance benchmarks',
      icon: <ShieldCheck size={22} color="#059669" />,
      badge: user?.role === 'manager' ? 'Quality Assurance Lead' : 'IPQC Workspace',
      badgeClass: 'success',
    },
    employee: {
      title: 'My Daily Work & Tasks',
      subtitle: 'Assigned operational tasks, performance scorecard, and permitted module shortcuts',
      icon: <Clock size={22} color="#2563eb" />,
      badge: `${user?.department?.toUpperCase() || 'GENERAL'} STAFF`,
      badgeClass: 'info',
    },
  };

  const currentMeta = viewMetadata[activeView] || viewMetadata.employee;

  return (
    <div className="flex flex-col gap-6 pb-12">
      {/* Top Header & Filter Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex flex-col gap-1">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex flex-wrap items-center gap-2.5 m-0">
            {currentMeta.icon}
            {currentMeta.title}
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
              currentMeta.badgeClass === 'success' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
              currentMeta.badgeClass === 'warning' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
              'bg-blue-100 text-blue-800 border border-blue-200'
            }`}>
              {currentMeta.badge}
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 m-0">{currentMeta.subtitle}</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Admin Dashboard Switcher: Lets Admin preview any department's dashboard */}
          {user?.role === 'admin' && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500">
                View as:
              </span>
              <select
                value={adminPreview || 'admin'}
                onChange={(e) => setAdminPreview(e.target.value === 'admin' ? null : e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0059bb]/20 focus:border-[#0059bb] cursor-pointer"
              >
                <option value="admin">Admin Central View</option>
                <option value="owner">Owner Executive Portal</option>
                <option value="accounts">Accounts & Billing</option>
                <option value="store">Store & Logistics</option>
                <option value="production">Production & Fabrication</option>
                <option value="quality">Quality Assurance / IPQC</option>
                <option value="employee">Worker / My Tasks View</option>
              </select>
            </div>
          )}

          {/* Date Filter Tabs */}
          <div className="flex bg-slate-100 p-1 rounded-xl gap-1">
            {[
              { key: 'all', label: 'All Time' },
              { key: 'today', label: 'Today' },
              { key: 'this_week', label: 'This Week' },
              { key: 'this_month', label: 'This Month' },
            ].map((tab) => (
              <button
                key={tab.key}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                  period === tab.key 
                    ? 'bg-white text-slate-900 shadow-xs' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                onClick={() => setPeriod(tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Refresh Button */}
          <button 
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            onClick={fetchDashboard}
            disabled={isLoading}
          >
            <RefreshCcw size={14} className={isLoading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && !dashboardData && (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-28 bg-slate-200/70 rounded-2xl animate-pulse" />
            ))}
          </div>
          <div className="h-80 bg-slate-200/70 rounded-2xl animate-pulse" />
        </div>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-8 text-center">
          <p className="text-sm font-semibold text-rose-600 mb-3">
            {error}
          </p>
          <button 
            className="inline-flex items-center gap-1.5 px-4 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer" 
            onClick={fetchDashboard}
          >
            Retry Fetching Real Database Data
          </button>
        </div>
      )}

      {/* Render Selected Role View with Live Data */}
      {!isLoading && dashboardData && (
        <>
          {activeView === 'admin' && (
            <AdminDashboardView 
              data={dashboardData} 
              onSwitchDashboard={(dept) => setAdminPreview(dept)} 
            />
          )}

          {activeView === 'owner' && (
            <OwnerDashboard />
          )}

          {activeView === 'accounts' && (
            <AccountsDashboardView 
              data={dashboardData} 
              isManager={user?.role === 'manager'} 
            />
          )}

          {activeView === 'store' && (
            <StoreDashboardView 
              data={dashboardData} 
              isManager={user?.role === 'manager'} 
            />
          )}

          {activeView === 'production' && (
            <ProductionDashboardView 
              data={dashboardData} 
              isManager={user?.role === 'manager'} 
            />
          )}

          {activeView === 'quality' && (
            <QualityDashboardView 
              data={dashboardData} 
              isManager={user?.role === 'manager'} 
            />
          )}

          {activeView === 'employee' && (
            <EmployeeDashboardView 
              data={dashboardData} 
              onTaskUpdated={fetchDashboard} 
            />
          )}
        </>
      )}
    </div>
  );
}
