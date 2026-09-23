import { HashRouter as Router, Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ShortcutsProvider } from './contexts/ShortcutsContext';
import ProtectedRoute from './components/ProtectedRoute';
import CommandPalette from './components/CommandPalette';
import QuickCreateModal from './components/QuickCreateModal';
import AiChatDrawer from './components/ai/AiChatDrawer';
import MainLayout from './components/layout/MainLayout';
import FinancialYearModal from './components/FinancialYearModal';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import OwnerDashboard from './pages/OwnerDashboard';
import UserManagement from './pages/UserManagement';
import ChallanPreview from './pages/ChallanPreview';
import Invoice from './pages/Invoice';
import PrivateInvoice from './pages/PrivateInvoice';
import PrivateInvoiceManagement from './pages/PrivateInvoiceManagement';
import CreatePrivateInvoice from './pages/CreatePrivateInvoice';
import PrivatePartyLedger from './pages/PrivatePartyLedger';
import ChallanManagement from './pages/ChallanManagement';
import CreateChallan from './pages/CreateChallan';
import CreateStatement from './pages/CreateStatement';
import StatementManagement from './pages/StatementManagement';
import StatementPreview from './pages/StatementPreview';
import StatementRegister from './pages/StatementRegister';
import RemainingMaterial from './pages/RemainingMaterial';
import InventoryBalance from './pages/InventoryBalance';
import CreateCR from './pages/CreateCR';
import CRRegister from './pages/CRRegister';
import MasterData from './pages/MasterData';
import ContractorLedger from './pages/ContractorLedger';
import EnquiryManagement from './pages/EnquiryManagement';
import QuotationManagement from './pages/QuotationManagement';
import CreateQuotation from './pages/CreateQuotation';
import QuotationPreview from './pages/QuotationPreview';
import ReceiptGenerator from './pages/ReceiptGenerator';
import ReceiptManagement from './pages/ReceiptManagement';
import ReceiptPreview from './pages/ReceiptPreview';
import IndemnityBond from './pages/IndemnityBond';
import MyTasks from './pages/MyTasks';
import PurchaseManagement from './pages/PurchaseManagement';
import ManageVendors from './pages/ManageVendors';
import PurchaseOrderPreview from './pages/PurchaseOrderPreview';

import { Toaster } from 'react-hot-toast';

function AppContent() {
  const [activeFinancialYear, setActiveFinancialYear] = useState(localStorage.getItem('activeFinancialYear'));
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleSelectYear = (year) => {
    localStorage.setItem('activeFinancialYear', year);
    setActiveFinancialYear(year);
    // Reload the page to ensure all state and requests use the new year
    window.location.reload();
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        window.print();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <>
      <Toaster 
        position="top-right" 
        reverseOrder={false}
        toastOptions={{
          style: {
            fontFamily: 'inherit',
            fontSize: '0.9rem',
          }
        }}
      />

      {/* Financial Year Modal only pops up for authenticated operational staff (not owner) */}
      {isAuthenticated && user?.role !== 'owner' && !activeFinancialYear && (
        <FinancialYearModal onSelectYear={handleSelectYear} />
      )}

      <Routes>
        {/* Public Login Route */}
        <Route path="/login" element={<Login />} />

        {/* Protected ERP Application Routes */}
        <Route 
          path="/" 
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="owner-dashboard" element={<OwnerDashboard />} />
          <Route path="user-management" element={<UserManagement />} />
          <Route path="challan-management" element={<ChallanManagement />} />
          <Route path="create-challan" element={<CreateChallan />} />
          <Route path="statement-management" element={<StatementManagement />} />
          <Route path="create-statement" element={<CreateStatement />} />
          <Route path="remaining-material" element={<RemainingMaterial />} />
          <Route path="inventory-balance" element={<InventoryBalance />} />
          <Route path="invoice" element={<Invoice />} />
          <Route path="private-invoices" element={<PrivateInvoiceManagement />} />
          <Route path="create-private-invoice" element={<CreatePrivateInvoice />} />
          <Route path="private-party-ledger" element={<PrivatePartyLedger />} />
          <Route path="create-cr" element={<CreateCR />} />
          <Route path="cr-register" element={<CRRegister />} />
          <Route path="contractor-ledger" element={<ContractorLedger />} />
          <Route path="master-data" element={<MasterData />} />
          <Route path="enquiries" element={<EnquiryManagement />} />
          <Route path="quotations" element={<QuotationManagement />} />
          <Route path="create-quotation" element={<CreateQuotation />} />
          <Route path="create-receipt" element={<ReceiptGenerator />} />
          <Route path="receipt-management" element={<ReceiptManagement />} />
          <Route path="my-tasks" element={<MyTasks />} />
          <Route path="purchase-management" element={<PurchaseManagement />} />
          <Route path="vendors" element={<ManageVendors />} />
        </Route>
        
        {/* Full-page printable preview routes (Protected) */}
        <Route path="/challan-preview" element={<ProtectedRoute><ChallanPreview /></ProtectedRoute>} />
        <Route path="/statement-preview" element={<ProtectedRoute><StatementPreview /></ProtectedRoute>} />
        <Route path="/statement-register" element={<ProtectedRoute><StatementRegister /></ProtectedRoute>} />
        <Route path="/quotation-preview" element={<ProtectedRoute><QuotationPreview /></ProtectedRoute>} />
        <Route path="/private-invoice" element={<ProtectedRoute><PrivateInvoice /></ProtectedRoute>} />
        <Route path="/receipt-preview" element={<ProtectedRoute><ReceiptPreview /></ProtectedRoute>} />
        <Route path="/indemnity-bond" element={<ProtectedRoute><IndemnityBond /></ProtectedRoute>} />
        <Route path="/purchase-order-preview" element={<ProtectedRoute><PurchaseOrderPreview /></ProtectedRoute>} />

        {/* Fallback route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {/* Power-user shortcuts only available when authenticated and not owner */}
      {isAuthenticated && user?.role !== 'owner' && (
        <>
          <CommandPalette />
          <QuickCreateModal />
        </>
      )}

      {/* AI Assistant Drawer (Groq Llama 3.3) */}
      {isAuthenticated && <AiChatDrawer />}
    </>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <ShortcutsProvider>
          <AppContent />
        </ShortcutsProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
