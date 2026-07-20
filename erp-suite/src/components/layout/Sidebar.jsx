import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FileText, 
  Receipt, 
  Settings, 
  Factory, 
  Briefcase,
  Truck,
  ClipboardList,
  PackagePlus,
  Building2,
  Globe
} from 'lucide-react';

export default function Sidebar() {
  const navItems = [
    { path: '/', label: 'Dashboard', icon: <LayoutDashboard /> },
    { path: '/create-cr', label: 'Material Inward (CR)', icon: <PackagePlus /> },
    { path: '/cr-register', label: 'Inward Register (CR)', icon: <ClipboardList /> },
    { path: '/create-statement', label: 'Create Statement (MR)', icon: <FileText /> },
    { path: '/statement-register', label: 'Statement Register (MR)', icon: <FileText /> },
    { path: '/statement-management', label: 'Statement Management (MR)', icon: <ClipboardList /> },
    { path: '/create-challan', label: 'Create Delivery Challan', icon: <Truck /> },
    { path: '/challan-management', label: 'Challan & Billing', icon: <Receipt /> },
    { path: '/inventory-balance', label: 'Inventory Balance', icon: <Factory /> },
    { path: '/remaining-material', label: 'Pending Material', icon: <ClipboardList /> },
    // { path: '/contractor-ledger', label: 'Material Ledger (WIP)', icon: <Building2 /> },
    { path: '/quotations', label: 'Quotations', icon: <FileText /> },
    { path: '/invoice', label: 'GST Invoice', icon: <FileText /> },
    { path: '/receipt-management', label: 'Receipt Management', icon: <FileText /> },
    { path: '/create-receipt', label: 'Create Receipt', icon: <FileText /> },
    { path: '/indemnity-bond', label: 'Indemnity Bond', icon: <FileText /> },
    // { path: '/production-entry', label: 'Production Entry', icon: <Factory /> },
    // { path: '/tender-details', label: 'Tender Management', icon: <Briefcase /> },
    { path: '/enquiries', label: 'Website Enquiries', icon: <Globe /> },
  ];

  return (
    <aside className="sidebar-container">
      <div className="sidebar-logo" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', padding: '20px 15px', textAlign: 'center' }}>
        <div style={{ background: 'white', padding: '15px', borderRadius: '12px', display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
          <img src="./logo.png" alt="Neeta Engineering Works" style={{ width: '100%', maxHeight: '90px', objectFit: 'contain' }} />
        </div>
        <span className="sidebar-logo-text" style={{ fontSize: '15px', fontWeight: 'bold', lineHeight: '1.3', marginTop: '5px', letterSpacing: '0.5px' }}>Neeta Engineering Works</span>
      </div>
      
      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <NavLink 
            key={item.path} 
            to={item.path} 
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            {item.icon}
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
      
      <div className="sidebar-footer" style={{ padding: '24px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
        <div style={{ marginBottom: '15px', background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '8px', textAlign: 'center' }}>
          <p style={{ fontSize: '12px', color: '#cbd5e1', marginBottom: '4px' }}>Operating Year</p>
          <p style={{ fontSize: '16px', fontWeight: 'bold', color: '#fff' }}>FY {localStorage.getItem('activeFinancialYear') || 'N/A'}</p>
          <button 
            onClick={() => {
              localStorage.removeItem('activeFinancialYear');
              window.location.reload();
            }}
            style={{ marginTop: '8px', fontSize: '12px', color: '#818cf8', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
          >
            Change Year
          </button>
        </div>
        <NavLink to="/master-data" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} style={{ padding: 0 }}>
          <Settings />
          <span>Settings</span>
        </NavLink>
      </div>
    </aside>
  );
}
