/**
 * Role-Based Access Control (RBAC) Permission Utility Functions & Job Role Mappings
 */

export const ALL_MODULES = [
  // Accounts & Billing
  { path: '/invoice', label: 'GST Invoice', department: 'accounts', category: 'Accounts & Billing' },
  { path: '/private-invoices', label: 'Private Invoice', department: 'accounts', category: 'Accounts & Billing' },
  { path: '/create-private-invoice', label: 'Create Private Invoice', department: 'accounts', category: 'Accounts & Billing' },
  { path: '/private-invoice', label: 'Private Invoice Preview', department: 'accounts', category: 'Accounts & Billing' },
  { path: '/private-party-ledger', label: 'Party Ledger (Khata)', department: 'accounts', category: 'Accounts & Billing' },
  { path: '/create-statement', label: 'Create Statement (MR)', department: 'accounts', category: 'Accounts & Billing' },
  { path: '/statement-management', label: 'Statement Management', department: 'accounts', category: 'Accounts & Billing' },
  { path: '/statement-register', label: 'Statement Register', department: 'accounts', category: 'Accounts & Billing' },
  { path: '/create-receipt', label: 'Create Receipt', department: 'accounts', category: 'Accounts & Billing' },
  { path: '/receipt-management', label: 'Receipt Management', department: 'accounts', category: 'Accounts & Billing' },
  { path: '/indemnity-bond', label: 'Indemnity Bond', department: 'accounts', category: 'Accounts & Billing' },

  // Logistics & Store
  { path: '/create-cr', label: 'Material Inward (CR)', department: 'logistics', category: 'Logistics & Store' },
  { path: '/cr-register', label: 'Inward Register (CR)', department: 'logistics', category: 'Logistics & Store' },
  { path: '/create-challan', label: 'Create Delivery Challan', department: 'logistics', category: 'Logistics & Store' },
  { path: '/challan-management', label: 'Challan & Billing', department: 'logistics', category: 'Logistics & Store' },
  { path: '/inventory-balance', label: 'Inventory Balance', department: 'logistics', category: 'Logistics & Store' },
  { path: '/remaining-material', label: 'Pending Material', department: 'logistics', category: 'Logistics & Store' },
  { path: '/contractor-ledger', label: 'Material Ledger', department: 'logistics', category: 'Logistics & Store' },

  // Procurement & Vendors
  { path: '/purchase-management', label: 'Purchase Management', department: 'purchase', category: 'Procurement & Vendors' },
  { path: '/vendors', label: 'Manage Vendors', department: 'purchase', category: 'Procurement & Vendors' },
  { path: '/purchase-order-preview', label: 'Purchase Order Preview', department: 'purchase', category: 'Procurement & Vendors' },

  // Sales & CRM
  { path: '/enquiries', label: 'Website Enquiries', department: 'sales', category: 'Sales & CRM' },
  { path: '/quotations', label: 'Quotations', department: 'sales', category: 'Sales & CRM' },
  { path: '/create-quotation', label: 'Create Quotation', department: 'sales', category: 'Sales & CRM' },

  // Operations & Tasks
  { path: '/my-tasks', label: 'My Assigned Tasks', department: 'all', category: 'Operations & Tasks' },

  // Executive Portal
  { path: '/owner-dashboard', label: 'Executive Summary Portal', department: 'management', category: 'Executive Leadership' },

  // Admin & System
  { path: '/user-management', label: 'User & Role Management', department: 'all', category: 'System Administration' },
  { path: '/master-data', label: 'System Settings', department: 'all', category: 'System Administration' },
];

/**
 * Standard Categories for Grouped Module Display
 */
export const MODULE_CATEGORIES = [
  'Accounts & Billing',
  'Logistics & Store',
  'Procurement & Vendors',
  'Sales & CRM',
  'Operations & Tasks',
  'System Administration',
];

/**
 * 1-Click Job Role Presets for Easy User Role & Permission Assignment
 */
export const JOB_ROLE_PRESETS = [
  {
    id: 'billing_executive',
    title: 'Billing Executive',
    role: 'user',
    department: 'accounts',
    designation: 'Billing Executive',
    description: 'Generates GST & Private invoices, receipts, party khata & statements',
    modules: [
      '/invoice',
      '/private-invoices',
      '/create-private-invoice',
      '/private-party-ledger',
      '/create-statement',
      '/statement-management',
      '/statement-register',
      '/create-receipt',
      '/receipt-management',
      '/indemnity-bond',
      '/my-tasks',
    ],
  },
  {
    id: 'accounts_manager',
    title: 'Accounts & Finance Head',
    role: 'manager',
    department: 'accounts',
    designation: 'Accounts & Finance Manager',
    description: 'Complete commercial accounts, billing oversight & vendor payment review',
    modules: [
      '/invoice',
      '/private-invoices',
      '/create-private-invoice',
      '/private-party-ledger',
      '/create-statement',
      '/statement-management',
      '/statement-register',
      '/create-receipt',
      '/receipt-management',
      '/indemnity-bond',
      '/purchase-management',
      '/my-tasks',
    ],
  },
  {
    id: 'store_assistant',
    title: 'Store Assistant / Dispatch',
    role: 'user',
    department: 'logistics',
    designation: 'Store & Dispatch Assistant',
    description: 'Receives raw material (CR), issues delivery challans & monitors inventory stock',
    modules: [
      '/create-cr',
      '/cr-register',
      '/create-challan',
      '/challan-management',
      '/inventory-balance',
      '/remaining-material',
      '/my-tasks',
    ],
  },
  {
    id: 'logistics_manager',
    title: 'Logistics & Store Head',
    role: 'manager',
    department: 'logistics',
    designation: 'Logistics & Store Manager',
    description: 'Full oversight of inwards, delivery challans, contractor ledgers & stock',
    modules: [
      '/create-cr',
      '/cr-register',
      '/create-challan',
      '/challan-management',
      '/inventory-balance',
      '/remaining-material',
      '/contractor-ledger',
      '/my-tasks',
    ],
  },
  {
    id: 'purchase_manager',
    title: 'Purchase & Procurement Head',
    role: 'purchase_manager',
    department: 'purchase',
    designation: 'Purchase & Procurement Manager',
    description: 'Manages vendor relations, requisitions, purchase orders & stock checks',
    modules: [
      '/purchase-management',
      '/vendors',
      '/purchase-order-preview',
      '/inventory-balance',
      '/cr-register',
      '/my-tasks',
    ],
  },
  {
    id: 'sales_executive',
    title: 'Sales & Quotation Executive',
    role: 'user',
    department: 'sales',
    designation: 'Sales & CRM Executive',
    description: 'Tracks website leads, generates client quotations & follow-ups',
    modules: [
      '/enquiries',
      '/quotations',
      '/create-quotation',
      '/my-tasks',
    ],
  },
  {
    id: 'production_manager',
    title: 'Production Manager',
    role: 'manager',
    department: 'production',
    designation: 'Production & Shop Floor Manager',
    description: 'Tracks shop floor inventory balance, material challans & return scrap',
    modules: [
      '/inventory-balance',
      '/challan-management',
      '/remaining-material',
      '/contractor-ledger',
      '/my-tasks',
    ],
  },
  {
    id: 'quality_lead',
    title: 'Quality Assurance Lead',
    role: 'manager',
    department: 'quality',
    designation: 'Quality Assurance Lead',
    description: 'Verifies incoming raw materials, tests dispatches & checks inventory logs',
    modules: [
      '/cr-register',
      '/inventory-balance',
      '/challan-management',
      '/my-tasks',
    ],
  },
  {
    id: 'owner',
    title: 'Managing Director / Owner',
    role: 'owner',
    department: 'management',
    designation: 'Managing Director / Owner',
    description: 'High-level business health summary, owner approvals & purchase authorizations',
    modules: [
      '/owner-dashboard',
      '/purchase-management',
      '/purchase-order-preview',
    ],
  },
  {
    id: 'admin',
    title: 'System Administrator',
    role: 'admin',
    department: 'all',
    designation: 'ERP Administrator',
    description: 'Unrestricted full access to all system modules, master data & user administration',
    modules: ['*'],
  },
];

/**
 * Check if a given user can access a specific route
 */
export const canAccessModule = (user, path) => {
  if (!user) return false;

  // Clean path (strip hash or trailing slash)
  const cleanPath = path.startsWith('#') ? path.substring(1) : path;

  // 1. Admin has full access to everything
  if (user.role === 'admin') {
    return true;
  }

  // 2. Owner has access to Dashboard, Executive Summary Portal, and Purchase Approval
  if (user.role === 'owner') {
    return (
      cleanPath === '/owner-dashboard' ||
      cleanPath === '/' ||
      cleanPath === '' ||
      cleanPath === '/purchase-management' ||
      cleanPath === '/purchase-order-preview'
    );
  }

  // Owner Portal is strictly for owner and admin
  if (cleanPath === '/owner-dashboard') {
    return user.role === 'owner' || user.role === 'admin';
  }

  // User Management & Master Data are restricted to Admin
  if (cleanPath === '/user-management' || cleanPath === '/master-data') {
    return user.role === 'admin';
  }

  // Dashboard is accessible to all authenticated roles (smart router renders role view)
  if (cleanPath === '/' || cleanPath === '') {
    return true;
  }

  // My Tasks is accessible to team members
  if (cleanPath === '/my-tasks') {
    return user.role !== 'owner';
  }

  // Purchase Manager role or department
  if (user.role === 'purchase_manager' || user.department === 'purchase') {
    if (
      cleanPath === '/purchase-management' ||
      cleanPath === '/vendors' ||
      cleanPath === '/purchase-order-preview'
    ) {
      return true;
    }
  }

  // Accounts department has access to purchase payments
  if (user.department === 'accounts' && (cleanPath === '/purchase-management' || cleanPath === '/purchase-order-preview')) {
    return true;
  }

  // Print preview routes check base permission
  if (cleanPath === '/challan-preview') return canAccessModule(user, '/challan-management');
  if (cleanPath === '/statement-preview' || cleanPath === '/statement-register') return canAccessModule(user, '/statement-management');
  if (cleanPath === '/quotation-preview') return canAccessModule(user, '/quotations');
  if (cleanPath === '/receipt-preview') return canAccessModule(user, '/receipt-management');
  if (cleanPath === '/private-invoice' || cleanPath === '/create-private-invoice') {
    return canAccessModule(user, '/private-invoices') || canAccessModule(user, '/invoice');
  }
  if (cleanPath === '/purchase-order-preview') return canAccessModule(user, '/purchase-management');

  // All operational ERP modules (e.g. inventory balance, invoices, challans, statements, inwards, receipts, etc.)
  // are accessible to operational team members without restriction
  return true;
};

/**
 * Get default starting route for a user based on their role
 */
export const getDefaultRouteForUser = (user) => {
  if (!user) return '/login';
  return '/';
};

