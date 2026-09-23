import axios from 'axios';

const api = axios.create({
  baseURL: window.location.protocol === 'file:' ? 'http://127.0.0.1:5000/api' : '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercept requests to add the financial year and auth header
api.interceptors.request.use(
  (config) => {
    const fy = localStorage.getItem('activeFinancialYear');
    if (fy) {
      config.headers['x-financial-year'] = fy;
    }
    const token = localStorage.getItem('erp_token') || sessionStorage.getItem('erp_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Intercept responses for auth expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Don't wipe token if the request was to login itself
      if (!error.config?.url?.includes('/auth/login')) {
        localStorage.removeItem('erp_token');
        sessionStorage.removeItem('erp_token');
        localStorage.removeItem('erp_user');
        window.dispatchEvent(new Event('erp_auth_expired'));
      }
    }
    return Promise.reject(error);
  }
);

// Auth
export const loginApi = async (username, password) => {
  const res = await api.post('/auth/login', { username, password });
  return res.data;
};

export const getMeApi = async () => {
  const res = await api.get('/auth/me');
  return res.data;
};

export const seedAdminApi = async () => {
  const res = await api.post('/auth/seed');
  return res.data;
};

// Health check
export const checkHealth = async () => {
  const response = await api.get('/health');
  return response.data;
};

// Challans
export const getChallans = async () => await api.get('/challans').then(res => res.data);
export const createChallan = async (data) => await api.post('/challans', data).then(res => res.data);
export const updateChallan = async (id, data) => await api.put(`/challans/${id}`, data).then(res => res.data);
export const deleteChallan = async (id) => await api.delete(`/challans/${id}`).then(res => res.data);

// Statements
export const getStatements = async () => await api.get('/statements').then(res => res.data);
export const createStatement = async (data) => await api.post('/statements', data).then(res => res.data);
export const updateStatement = async (id, data) => await api.put(`/statements/${id}`, data).then(res => res.data);
export const deleteStatement = async (id) => await api.delete(`/statements/${id}`).then(res => res.data);

// Remaining Materials
export const getSubDivisions = async () => {
  try {
    const [statements, challans] = await Promise.all([getStatements(), getChallans()]);
    const subDivs = new Set();
    statements.forEach(s => s.subDivisionName && subDivs.add(s.subDivisionName));
    challans.forEach(c => c.subDivisionName && subDivs.add(c.subDivisionName));
    return Array.from(subDivs).sort();
  } catch (err) {
    return [];
  }
};

export const getRemainingMaterials = async () => await api.get('/remaining-materials').then(res => res.data);
export const createRemainingMaterial = async (data) => await api.post('/remaining-materials', data).then(res => res.data);
export const updateRemainingMaterial = async (id, data) => await api.put(`/remaining-materials/${id}`, data).then(res => res.data);
export const deleteRemainingMaterial = async (id) => await api.delete(`/remaining-materials/${id}`).then(res => res.data);

// Inventory
export const getInventoryBalances = async () => await api.get('/inventory').then(res => res.data);
export const updateInventoryBalance = async (data) => await api.post('/inventory/update', data).then(res => res.data);

// Store Receipts (CR)
export const getStoreReceipts = async () => await api.get('/store-receipts').then(res => res.data);
export const createStoreReceipt = async (data) => await api.post('/store-receipts', data).then(res => res.data);
export const updateStoreReceipt = async (id, data) => await api.put(`/store-receipts/${id}`, data).then(res => res.data);
export const deleteStoreReceipt = async (id) => await api.delete(`/store-receipts/${id}`).then(res => res.data);

// Master Data
export const seedMasterData = async () => await api.post('/master-data/seed').then(res => res.data);

export const getMaterials = async () => await api.get('/master-data/materials').then(res => res.data);
export const addMaterial = async (data) => await api.post('/master-data/materials', data).then(res => res.data);
export const updateMaterial = async (id, data) => await api.put(`/master-data/materials/${id}`, data).then(res => res.data);
export const deleteMaterial = async (id) => await api.delete(`/master-data/materials/${id}`).then(res => res.data);

export const getPrivateMaterials = async () => await api.get('/master-data/private-materials').then(res => res.data);
export const addPrivateMaterial = async (data) => await api.post('/master-data/private-materials', data).then(res => res.data);
export const updatePrivateMaterial = async (id, data) => await api.put(`/master-data/private-materials/${id}`, data).then(res => res.data);
export const deletePrivateMaterial = async (id) => await api.delete(`/master-data/private-materials/${id}`).then(res => res.data);

// Raw Materials (For Purchase Management & Procurement)
export const getRawMaterials = async (params) => await api.get('/master-data/raw-materials', { params }).then(res => res.data);
export const getRawMaterialById = async (id) => await api.get(`/master-data/raw-materials/${id}`).then(res => res.data);
export const addRawMaterial = async (data) => await api.post('/master-data/raw-materials', data).then(res => res.data);
export const updateRawMaterial = async (id, data) => await api.put(`/master-data/raw-materials/${id}`, data).then(res => res.data);
export const deleteRawMaterial = async (id) => await api.delete(`/master-data/raw-materials/${id}`).then(res => res.data);

export const getDivisions = async () => await api.get('/master-data/divisions').then(res => res.data);
export const addDivision = async (data) => await api.post('/master-data/divisions', data).then(res => res.data);
export const updateDivision = async (id, data) => await api.put(`/master-data/divisions/${id}`, data).then(res => res.data);
export const deleteDivision = async (id) => await api.delete(`/master-data/divisions/${id}`).then(res => res.data);

export const getContractors = async () => await api.get('/master-data/contractors').then(res => res.data);
export const addContractor = async (data) => await api.post('/master-data/contractors', data).then(res => res.data);
export const updateContractor = async (id, data) => await api.put(`/master-data/contractors/${id}`, data).then(res => res.data);
export const deleteContractor = async (id) => await api.delete(`/master-data/contractors/${id}`).then(res => res.data);

export const getInvoiceDivisions = async () => await api.get('/master-data/invoice-divisions').then(res => res.data);
export const addInvoiceDivision = async (data) => await api.post('/master-data/invoice-divisions', data).then(res => res.data);
export const updateInvoiceDivision = async (id, data) => await api.put(`/master-data/invoice-divisions/${id}`, data).then(res => res.data);
export const deleteInvoiceDivision = async (id) => await api.delete(`/master-data/invoice-divisions/${id}`).then(res => res.data);

export const getReceiptParties = async () => await api.get('/master-data/receipt-parties').then(res => res.data);
export const addReceiptParty = async (data) => await api.post('/master-data/receipt-parties', data).then(res => res.data);
export const updateReceiptParty = async (id, data) => await api.put(`/master-data/receipt-parties/${id}`, data).then(res => res.data);
export const deleteReceiptParty = async (id) => await api.delete(`/master-data/receipt-parties/${id}`).then(res => res.data);

export const getFinancialYears = async () => await api.get('/master-data/financial-years').then(res => res.data);
export const addFinancialYear = async (data) => await api.post('/master-data/financial-years', data).then(res => res.data);
export const updateFinancialYear = async (id, data) => await api.put(`/master-data/financial-years/${id}`, data).then(res => res.data);
export const deleteFinancialYear = async (id) => await api.delete(`/master-data/financial-years/${id}`).then(res => res.data);

export const getPrivateParties = async () => await api.get('/master-data/private-parties').then(res => res.data);
export const addPrivateParty = async (data) => await api.post('/master-data/private-parties', data).then(res => res.data);
export const updatePrivateParty = async (id, data) => await api.put(`/master-data/private-parties/${id}`, data).then(res => res.data);
export const deletePrivateParty = async (id) => await api.delete(`/master-data/private-parties/${id}`).then(res => res.data);

// Enquiries
export const getEnquiries = async () => await api.get('/enquiries').then(res => res.data);
export const syncEnquiries = async () => await api.post('/enquiries/sync').then(res => res.data);
export const updateEnquiry = async (id, data) => await api.put(`/enquiries/${id}`, data).then(res => res.data);
export const getPendingEnquiriesCount = async () => await api.get('/enquiries/pending-count').then(res => res.data);

// Quotations
export const getQuotations = async () => await api.get('/quotations').then(res => res.data);
export const getHsnCodes = async () => {
  try {
    const quotations = await getQuotations();
    const hsnSet = new Set();
    quotations.forEach(q => {
      if (q.items && Array.isArray(q.items)) {
        q.items.forEach(item => item.hsn && hsnSet.add(item.hsn));
      }
    });
    return Array.from(hsnSet).sort();
  } catch (err) {
    return [];
  }
};
export const getQuotation = async (id) => await api.get(`/quotations/${id}`).then(res => res.data);
export const getNextQuotationNo = async () => await api.get('/quotations/next-no').then(res => res.data);
export const createQuotation = async (data) => await api.post('/quotations', data).then(res => res.data);
export const updateQuotation = async (id, data) => await api.put(`/quotations/${id}`, data).then(res => res.data);
export const deleteQuotation = async (id) => await api.delete(`/quotations/${id}`).then(res => res.data);

// Private Invoices
export const getPrivateInvoices = async (params) => await api.get('/private-invoices', { params }).then(res => res.data);
export const getPrivateInvoice = async (id) => await api.get(`/private-invoices/${id}`).then(res => res.data);
export const getNextPrivateInvoiceNo = async () => await api.get('/private-invoices/next-no').then(res => res.data);
export const createPrivateInvoice = async (data) => await api.post('/private-invoices', data).then(res => res.data);
export const updatePrivateInvoice = async (id, data) => await api.put(`/private-invoices/${id}`, data).then(res => res.data);
export const deletePrivateInvoice = async (id) => await api.delete(`/private-invoices/${id}`).then(res => res.data);
export const sendPrivateInvoiceEmail = async (id, payload) => {
  const url = id && id !== 'direct' ? `/private-invoices/${id}/send-email` : '/private-invoices/send-email';
  return await api.post(url, payload).then(res => res.data);
};

// Receipts
export const getReceipts = async () => await api.get('/receipts').then(res => res.data);
export const getNextReceiptNo = async () => await api.get('/receipts/next-no').then(res => res.data);
export const createReceipt = async (data) => await api.post('/receipts', data).then(res => res.data);
export const updateReceipt = async (id, data) => await api.put(`/receipts/${id}`, data).then(res => res.data);
export const deleteReceipt = async (id) => await api.delete(`/receipts/${id}`).then(res => res.data);

export const triggerBackup = async () => await api.post('/backup').then(res => res.data);
export const getBackups = async () => await api.get('/backups').then(res => res.data);
export const restoreBackup = async (filename) => await api.post('/restore', { filename }).then(res => res.data);

// Users Management (Admin)
export const getUsers = async () => await api.get('/users').then(res => res.data);
export const createUser = async (data) => await api.post('/users', data).then(res => res.data);
export const updateUser = async (id, data) => await api.put(`/users/${id}`, data).then(res => res.data);
export const deleteUser = async (id) => await api.delete(`/users/${id}`).then(res => res.data);

// Tasks & Work Progress (Owner & Team)
export const getTasks = async (params) => await api.get('/tasks', { params }).then(res => res.data);
export const createTask = async (data) => await api.post('/tasks', data).then(res => res.data);
export const updateTask = async (id, data) => await api.put(`/tasks/${id}`, data).then(res => res.data);
export const addTaskComment = async (id, data) => await api.post(`/tasks/${id}/comments`, data).then(res => res.data);
export const deleteTask = async (id) => await api.delete(`/tasks/${id}`).then(res => res.data);
export const checkTaskReminders = async () => await api.post('/tasks/check-reminders').then(res => res.data);
export const getOwnerSummary = async () => await api.get('/tasks/owner-summary').then(res => res.data);

// Real-Time In-App Notifications
export const getNotifications = async () => await api.get('/notifications').then(res => res.data);
export const markNotificationRead = async (id) => await api.put(`/notifications/${id}/read`).then(res => res.data);
export const markAllNotificationsRead = async () => await api.put('/notifications/mark-all-read').then(res => res.data);
export const deleteNotification = async (id) => await api.delete(`/notifications/${id}`).then(res => res.data);

// AI Accounting Chatbot (Groq Tool Calling)
export const chatWithAi = async (messages, confirmedAction = null) => {
  const res = await api.post('/ai/chat', { messages, confirmedAction });
  return res.data;
};
export const getAiAuditLogs = async () => await api.get('/ai/audit-logs').then(res => res.data);
export const saveGroqApiKey = async (apiKey) => await api.post('/ai/save-key', { apiKey }).then(res => res.data);
// Role-Based Dashboards (Real Database Data)
export const getAdminDashboardData = async (params) => await api.get('/dashboards/admin', { params }).then(res => res.data);
export const getOwnerDashboardData = async (params) => await api.get('/dashboards/owner', { params }).then(res => res.data);
export const getAccountsDashboardData = async (params) => await api.get('/dashboards/accounts', { params }).then(res => res.data);
export const getStoreDashboardData = async (params) => await api.get('/dashboards/store', { params }).then(res => res.data);
export const getProductionDashboardData = async (params) => await api.get('/dashboards/production', { params }).then(res => res.data);
export const getQualityDashboardData = async (params) => await api.get('/dashboards/quality', { params }).then(res => res.data);
export const getEmployeeDashboardData = async (params) => await api.get('/dashboards/employee', { params }).then(res => res.data);


// GSTIN Verification & Compliance
export const verifyGstinApi = async (gstin) => await api.post('/gst/verify', { gstin }).then(r => r.data);
export const getGstVerificationHistory = async () => await api.get('/gst/history').then(r => r.data);

// Private Party Payment Tracking & Ledger (Khata / Hisab)
export const recordPrivatePayment = async (data) => await api.post('/private-payments', data).then(r => r.data);
export const deletePrivatePayment = async (id) => await api.delete(`/private-payments/${id}`).then(r => r.data);
export const getPrivatePartyLedger = async (partyId) => await api.get(`/private-payments/party/${partyId}`).then(r => r.data);
export const getAllPartiesLedgerSummary = async () => await api.get('/private-payments/summary').then(r => r.data);
export const sendLedgerEmail = async (partyId, data) => await api.post(`/private-payments/party/${partyId}/send-email`, data).then(r => r.data);

// Purchase Management & Vendor APIs (Private Materials)
export const getVendors = async (params) => await api.get('/vendors', { params }).then(r => r.data);
export const getVendorById = async (id) => await api.get(`/vendors/${id}`).then(r => r.data);
export const createVendor = async (data) => await api.post('/vendors', data).then(r => r.data);
export const updateVendor = async (id, data) => await api.put(`/vendors/${id}`, data).then(r => r.data);
export const deleteVendor = async (id) => await api.delete(`/vendors/${id}`).then(r => r.data);

export const getPurchaseOrders = async (params) => await api.get('/purchases', { params }).then(r => r.data);
export const getPurchaseOrderById = async (id) => await api.get(`/purchases/${id}`).then(r => r.data);
export const createPurchaseRequirement = async (data) => await api.post('/purchases', data).then(r => r.data);
export const sendQuotationRequests = async (id, data) => await api.post(`/purchases/${id}/send-rfq`, data).then(r => r.data);
export const recordVendorEstimate = async (id, data) => await api.post(`/purchases/${id}/estimates`, data).then(r => r.data);
export const submitForOwnerApproval = async (id, data) => await api.post(`/purchases/${id}/submit-approval`, data).then(r => r.data);
export const ownerApprovalAction = async (id, data) => await api.post(`/purchases/${id}/owner-action`, data).then(r => r.data);
export const recordMaterialReceipt = async (id, data) => await api.post(`/purchases/${id}/receive-material`, data).then(r => r.data);
export const recordAccountsPayment = async (id, data) => await api.post(`/purchases/${id}/payments`, data).then(r => r.data);
export const deletePurchaseOrder = async (id) => await api.delete(`/purchases/${id}`).then(r => r.data);

export default api;

