import React from 'react';
import Dashboard from './pages/Dashboard';
import ChallanManagement from './pages/ChallanManagement';
import CreateChallan from './pages/CreateChallan';
import CreateStatement from './pages/CreateStatement';
import StatementManagement from './pages/StatementManagement';
import RemainingMaterial from './pages/RemainingMaterial';
import InventoryBalance from './pages/InventoryBalance';
import Invoice from './pages/Invoice';
import CreateCR from './pages/CreateCR';
import CRRegister from './pages/CRRegister';
import MasterData from './pages/MasterData';
import ContractorLedger from './pages/ContractorLedger';
import EnquiryManagement from './pages/EnquiryManagement';
import QuotationManagement from './pages/QuotationManagement';
import CreateQuotation from './pages/CreateQuotation';
import ReceiptGenerator from './pages/ReceiptGenerator';
import ReceiptManagement from './pages/ReceiptManagement';

export const routeConfig = [
  { path: '/', label: 'Dashboard', component: <Dashboard /> },
  { path: '/challan-management', label: 'Challan & Billing', component: <ChallanManagement /> },
  { path: '/create-challan', label: 'Create Delivery Challan', component: <CreateChallan /> },
  { path: '/statement-management', label: 'Statement Management', component: <StatementManagement /> },
  { path: '/create-statement', label: 'Create Statement', component: <CreateStatement /> },
  { path: '/remaining-material', label: 'Pending Material', component: <RemainingMaterial /> },
  { path: '/inventory-balance', label: 'Inventory Balance', component: <InventoryBalance /> },
  { path: '/invoice', label: 'GST Invoice', component: <Invoice /> },
  { path: '/create-cr', label: 'Material Inward', component: <CreateCR /> },
  { path: '/cr-register', label: 'Inward Register', component: <CRRegister /> },
  { path: '/contractor-ledger', label: 'Material Ledger', component: <ContractorLedger /> },
  { path: '/master-data', label: 'Settings', component: <MasterData /> },
  { path: '/enquiries', label: 'Website Enquiries', component: <EnquiryManagement /> },
  { path: '/quotations', label: 'Quotations', component: <QuotationManagement /> },
  { path: '/create-quotation', label: 'Create Quotation', component: <CreateQuotation /> },
  { path: '/create-receipt', label: 'Create Receipt', component: <ReceiptGenerator /> },
  { path: '/receipt-management', label: 'Receipt Management', component: <ReceiptManagement /> },
];

export const getRouteConfig = (path) => {
  return routeConfig.find(route => route.path === path);
};
