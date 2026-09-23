import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FileText, 
  Receipt, 
  Settings, 
  Factory, 
  Truck, 
  ClipboardList, 
  PackagePlus, 
  Building2, 
  Globe, 
  Users, 
  TrendingUp, 
  BookOpen,
  CheckSquare,
  ShoppingBag,
  Store,
  X 
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { canAccessModule } from '../../utils/permissionUtils';

export default function Sidebar({ isOpen = false, onClose }) {
  const { user } = useAuth();

  const getDashboardLabel = () => {
    if (user?.role === 'admin') return 'Admin Dashboard';
    if (user?.role === 'owner') return 'Executive Dashboard';
    if (user?.role === 'manager') {
      const deptName = user.department ? user.department.charAt(0).toUpperCase() + user.department.slice(1) : 'Dept';
      return `${deptName} Dashboard`;
    }
    return 'My Dashboard';
  };

  const navSections = [
    {
      title: 'Overview',
      items: [
        { path: '/', label: getDashboardLabel(), icon: <LayoutDashboard className="w-5 h-5" /> },
        { path: '/owner-dashboard', label: 'Owner Portal & Tasks', icon: <TrendingUp className="w-5 h-5" /> },
        { path: '/my-tasks', label: 'My Assigned Tasks', icon: <CheckSquare className="w-5 h-5" /> },
      ]
    },
    {
      title: 'Operations & Inventory',
      items: [
        { path: '/create-cr', label: 'Material Inward (CR)', icon: <PackagePlus className="w-5 h-5" /> },
        { path: '/cr-register', label: 'Inward Register (CR)', icon: <ClipboardList className="w-5 h-5" /> },
        { path: '/create-statement', label: 'Create Statement (MR)', icon: <FileText className="w-5 h-5" /> },
        { path: '/statement-register', label: 'Statement Register (MR)', icon: <FileText className="w-5 h-5" /> },
        { path: '/statement-management', label: 'Statement Management', icon: <ClipboardList className="w-5 h-5" /> },
        { path: '/create-challan', label: 'Create Delivery Challan', icon: <Truck className="w-5 h-5" /> },
        { path: '/challan-management', label: 'Challan & Billing', icon: <Receipt className="w-5 h-5" /> },
        { path: '/inventory-balance', label: 'Inventory Balance', icon: <Factory className="w-5 h-5" /> },
        { path: '/remaining-material', label: 'Pending Material', icon: <ClipboardList className="w-5 h-5" /> },
        { path: '/contractor-ledger', label: 'Material Ledger', icon: <Building2 className="w-5 h-5" /> },
      ]
    },
    {
      title: 'Commercial & Sales',
      items: [
        { path: '/enquiries', label: 'Website Enquiries', icon: <Globe className="w-5 h-5" /> },
        { path: '/quotations', label: 'Quotations', icon: <FileText className="w-5 h-5" /> },
        { path: '/invoice', label: 'GST Invoice', icon: <FileText className="w-5 h-5" /> },
        { path: '/private-invoices', label: 'Private Invoice', icon: <Receipt className="w-5 h-5" /> },
        { path: '/private-party-ledger', label: 'Party Ledger (Khata)', icon: <BookOpen className="w-5 h-5" /> },
        { path: '/receipt-management', label: 'Receipt Management', icon: <FileText className="w-5 h-5" /> },
        { path: '/create-receipt', label: 'Create Receipt', icon: <FileText className="w-5 h-5" /> },
        { path: '/indemnity-bond', label: 'Indemnity Bond', icon: <FileText className="w-5 h-5" /> },
      ]
    },
    {
      title: 'Procurement & Purchase',
      items: [
        { path: '/purchase-management', label: 'Purchase Management', icon: <ShoppingBag className="w-5 h-5" /> },
        { path: '/vendors', label: 'Manage Vendors', icon: <Store className="w-5 h-5" /> },
      ]
    },
    {
      title: 'Administration',
      items: [
        { path: '/user-management', label: 'User & Access (RBAC)', icon: <Users className="w-5 h-5" /> },
        { path: '/master-data', label: 'System Master Settings', icon: <Settings className="w-5 h-5" /> },
      ]
    }
  ];

  const filterItem = (item) => {
    if (user?.role === 'owner') {
      return item.path === '/' || item.path === '/owner-dashboard';
    }
    if (item.path === '/owner-dashboard' && user?.role !== 'admin') {
      return false;
    }
    return canAccessModule(user, item.path);
  };

  const visibleSections = navSections
    .map(section => ({
      ...section,
      items: section.items.filter(filterItem)
    }))
    .filter(section => section.items.length > 0);

  return (
    <aside 
      className={`fixed top-0 left-0 bottom-0 w-[280px] bg-[#e4ecf7] border-r border-slate-200/80 text-slate-700 flex flex-col z-50 transition-transform duration-300 ease-in-out lg:translate-x-0 ${
        isOpen ? 'translate-x-0 shadow-xl' : '-translate-x-full'
      }`}
    >
      {/* Brand Header */}
      <div className="flex flex-col items-center gap-2 p-5 text-center relative border-b border-slate-200/80">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close sidebar navigation"
          className="lg:hidden absolute top-3 right-3 p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
        >
          <X size={20} />
        </button>

        <div className="bg-white/80 p-2.5 rounded-xl border border-slate-200/80 flex items-center justify-center w-full shadow-xs">
          <img 
            src="/logo.png" 
            alt="Neeta Engineering Works" 
            className="w-full max-h-16 object-contain" 
          />
        </div>
        <span className="text-sm font-bold leading-tight mt-1 tracking-wide text-slate-900">
          Neeta Engineering Works
        </span>
        {user?.role && (
          <span className="text-[11px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded bg-blue-50 text-[#0059bb] border border-blue-200">
            {user.role === 'owner' ? 'Executive Portal' : `${user.role} workspace`}
          </span>
        )}
      </div>
      
      {/* Navigation List Organized by Category */}
      <nav className="flex-1 overflow-y-auto py-3 px-2.5 space-y-4">
        {visibleSections.map((section) => (
          <div key={section.title} className="space-y-1">
            <div className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              {section.title}
            </div>
            {section.items.map((item) => (
              <NavLink 
                key={item.path} 
                to={item.path} 
                onClick={() => onClose?.()}
                className={({ isActive }) => `flex items-center gap-3 px-3.5 py-2 rounded-xl text-sm font-medium transition-all ${
                  isActive 
                    ? 'bg-[#0059bb] text-white shadow-sm font-semibold' 
                    : 'text-slate-600 hover:bg-white/70 hover:text-slate-900'
                }`}
              >
                <span className="shrink-0">{item.icon}</span>
                <span className="truncate">{item.label}</span>
              </NavLink>
            ))}
          </div>
        ))}
      </nav>
      
      {/* Footer / Operating Year */}
      <div className="p-4 border-t border-slate-200/80 bg-white/50">
        <div className="bg-white/70 border border-slate-200/70 p-3 rounded-xl text-center mb-2">
          <p className="text-xs text-slate-500 mb-0.5 font-medium">Operating Year</p>
          <p className="text-base font-bold text-slate-900">FY {localStorage.getItem('activeFinancialYear') || 'N/A'}</p>
          {user?.role !== 'owner' && (
            <button 
              onClick={() => {
                localStorage.removeItem('activeFinancialYear');
                window.location.reload();
              }}
              className="mt-1 text-xs text-[#0059bb] hover:text-[#004899] font-medium underline cursor-pointer"
            >
              Change Year
            </button>
          )}
        </div>

        {canAccessModule(user, '/master-data') && (
          <NavLink 
            to="/master-data" 
            className={({ isActive }) => `flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
              isActive 
                ? 'bg-[#0059bb] text-white font-semibold shadow-sm' 
                : 'text-slate-600 hover:bg-white/70 hover:text-slate-900'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Settings</span>
          </NavLink>
        )}
      </div>
    </aside>
  );
}
