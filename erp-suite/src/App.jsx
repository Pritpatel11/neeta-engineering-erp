import { HashRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { TabProvider } from './contexts/TabContext';
import { ShortcutsProvider } from './contexts/ShortcutsContext';
import CommandPalette from './components/CommandPalette';
import QuickCreateModal from './components/QuickCreateModal';
import MainLayout from './components/layout/MainLayout';
import FinancialYearModal from './components/FinancialYearModal';
import Dashboard from './pages/Dashboard';
import ChallanPreview from './pages/ChallanPreview';
import Invoice from './pages/Invoice';
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

import { Toaster } from 'react-hot-toast';

function AppContent() {
  const [activeFinancialYear, setActiveFinancialYear] = useState(localStorage.getItem('activeFinancialYear'));
  const navigate = useNavigate();

  const handleSelectYear = (year) => {
    localStorage.setItem('activeFinancialYear', year);
    setActiveFinancialYear(year);
    // Reload the page to ensure all state and requests use the new year,
    // or just let the app react naturally. A hard reload is safest for a global tenant switch.
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
      <Toaster position="top-right" reverseOrder={false} />
      {!activeFinancialYear && <FinancialYearModal onSelectYear={handleSelectYear} />}
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="challan-management" element={<ChallanManagement />} />
          <Route path="create-challan" element={<CreateChallan />} />
          <Route path="statement-management" element={<StatementManagement />} />
          <Route path="create-statement" element={<CreateStatement />} />
          <Route path="remaining-material" element={<RemainingMaterial />} />
          <Route path="inventory-balance" element={<InventoryBalance />} />
          <Route path="invoice" element={<Invoice />} />
          <Route path="create-cr" element={<CreateCR />} />
          <Route path="cr-register" element={<CRRegister />} />
          <Route path="contractor-ledger" element={<ContractorLedger />} />
          <Route path="master-data" element={<MasterData />} />
          <Route path="enquiries" element={<EnquiryManagement />} />
          <Route path="quotations" element={<QuotationManagement />} />
          <Route path="create-quotation" element={<CreateQuotation />} />
          <Route path="create-receipt" element={<ReceiptGenerator />} />
          <Route path="receipt-management" element={<ReceiptManagement />} />
        </Route>
        
        {/* Full-page routes outside of MainLayout */}
        <Route path="/challan-preview" element={<ChallanPreview />} />
        <Route path="/statement-preview" element={<StatementPreview />} />
        <Route path="/statement-register" element={<StatementRegister />} />
        <Route path="/quotation-preview" element={<QuotationPreview />} />
        <Route path="/receipt-preview" element={<ReceiptPreview />} />
        <Route path="/indemnity-bond" element={<IndemnityBond />} />
      </Routes>
    </>
  );
}

function App() {
  return (
    <Router>
      <TabProvider>
        <ShortcutsProvider>
          <AppContent />
          <CommandPalette />
          <QuickCreateModal />
        </ShortcutsProvider>
      </TabProvider>
    </Router>
  );
}

export default App;
