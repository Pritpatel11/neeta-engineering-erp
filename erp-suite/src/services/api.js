import axios from 'axios';

const api = axios.create({
  baseURL: window.location.protocol === 'file:' ? 'http://127.0.0.1:5000/api' : '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercept requests to add the financial year header
api.interceptors.request.use(
  (config) => {
    const fy = localStorage.getItem('activeFinancialYear');
    if (fy) {
      config.headers['x-financial-year'] = fy;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

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

// Receipts
export const getReceipts = async () => await api.get('/receipts').then(res => res.data);
export const getNextReceiptNo = async () => await api.get('/receipts/next-no').then(res => res.data);
export const createReceipt = async (data) => await api.post('/receipts', data).then(res => res.data);
export const updateReceipt = async (id, data) => await api.put(`/receipts/${id}`, data).then(res => res.data);
export const deleteReceipt = async (id) => await api.delete(`/receipts/${id}`).then(res => res.data);

export const triggerBackup = async () => await api.post('/backup').then(res => res.data);
export const getBackups = async () => await api.get('/backups').then(res => res.data);
export const restoreBackup = async (filename) => await api.post('/restore', { filename }).then(res => res.data);

export default api;
