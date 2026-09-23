import { 
  getMaterials, addMaterial, deleteMaterial, updateMaterial,
  getPrivateMaterials, addPrivateMaterial, deletePrivateMaterial, updatePrivateMaterial,
  getRawMaterials, addRawMaterial, deleteRawMaterial, updateRawMaterial,
  getDivisions, addDivision, deleteDivision, updateDivision,
  getContractors, addContractor, deleteContractor, updateContractor,
  getInvoiceDivisions, addInvoiceDivision, deleteInvoiceDivision, updateInvoiceDivision,
  getReceiptParties, addReceiptParty, deleteReceiptParty, updateReceiptParty,
  getFinancialYears, addFinancialYear, deleteFinancialYear, updateFinancialYear,
  getPrivateParties, addPrivateParty, deletePrivateParty, updatePrivateParty,
  verifyGstinApi, seedMasterData 
} from '../services/api';
import { 
  Settings, Plus, Trash2, RefreshCw, Edit, X, Save, 
  Search, Eye, CheckCircle2, AlertCircle, Building2, Package, ShieldCheck, BookOpen, Wrench 
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/i;

const EMPTY_PARTY = {
  name: '',
  contactPerson: '',
  phone: '',
  email: '',
  address: '',
  shippingAddress: '',
  gst: '',
  pan: '',
  state: 'Gujarat',
  stateCode: '24',
  city: '',
  district: '',
  pincode: '',
  notes: ''
};

const EMPTY_MATERIAL = {
  name: '',
  code: '',
  description: '',
  unit: 'Nos',
  hsn: '',
  gstRate: 18,
  rate: 0
};

const EMPTY_RAW_MATERIAL = {
  name: '',
  category: 'Angles',
  size: '',
  grade: 'IS 2062 E250',
  unit: 'KG',
  hsn: '7216',
  gstRate: 18,
  defaultRate: 0,
  description: '',
  isActive: true
};

export default function MasterData() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('raw-materials');
  const [materials, setMaterials] = useState([]);
  const [privateMaterials, setPrivateMaterials] = useState([]);
  const [rawMaterials, setRawMaterials] = useState([]);
  const [divisions, setDivisions] = useState([]);
  const [invoiceDivisions, setInvoiceDivisions] = useState([]);
  const [contractors, setContractors] = useState([]);
  const [receiptParties, setReceiptParties] = useState([]);
  const [financialYears, setFinancialYears] = useState([]);
  const [privateParties, setPrivateParties] = useState([]);
  
  // Single input for simple master data categories
  const [newItemName, setNewItemName] = useState('');
  
  // Private Party state
  const [partyForm, setPartyForm] = useState(EMPTY_PARTY);
  const [partySearch, setPartySearch] = useState('');
  const [isVerifyingGst, setIsVerifyingGst] = useState(false);
  const [gstVerifyMessage, setGstVerifyMessage] = useState(null);
  const [gstVerification, setGstVerification] = useState(null);
  const [viewingParty, setViewingParty] = useState(null);

  // Private Material state
  const [materialForm, setMaterialForm] = useState(EMPTY_MATERIAL);
  const [materialSearch, setMaterialSearch] = useState('');
  const [viewingMaterial, setViewingMaterial] = useState(null);

  // Raw Material state (for Purchase Management)
  const [rawMaterialForm, setRawMaterialForm] = useState(EMPTY_RAW_MATERIAL);
  const [rawMaterialSearch, setRawMaterialSearch] = useState('');
  const [rawMaterialCategoryFilter, setRawMaterialCategoryFilter] = useState('all');
  const [viewingRawMaterial, setViewingRawMaterial] = useState(null);
  
  const [editingItem, setEditingItem] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [mats, pmats, rawMats, divs, invDivs, conts, rParties, fYears, pParties] = await Promise.all([
        getMaterials(),
        getPrivateMaterials(),
        getRawMaterials(),
        getDivisions(),
        getInvoiceDivisions(),
        getContractors(),
        getReceiptParties(),
        getFinancialYears(),
        getPrivateParties()
      ]);
      setMaterials(mats || []);
      setPrivateMaterials(pmats || []);
      setRawMaterials(rawMats || []);
      setDivisions(divs || []);
      setInvoiceDivisions(invDivs || []);
      setContractors(conts || []);
      setReceiptParties(rParties || []);
      setFinancialYears(fYears || []);
      setPrivateParties(pParties || []);
    } catch (error) {
      console.error('Failed to fetch master data:', error);
      toast.error('Failed to load master data');
    }
  };

  // Clear edit state when changing tabs
  useEffect(() => {
    cancelEdit();
  }, [activeTab]);

  const cancelEdit = () => {
    setEditingItem(null);
    setNewItemName('');
    setPartyForm(EMPTY_PARTY);
    setMaterialForm(EMPTY_MATERIAL);
    setRawMaterialForm(EMPTY_RAW_MATERIAL);
    setGstVerifyMessage(null);
    setGstVerification(null);
  };

  const handleEditItem = (item) => {
    setEditingItem({ id: item._id });
    if (activeTab === 'private-parties') {
      setPartyForm({
        name: item.name || '',
        contactPerson: item.contactPerson || '',
        phone: item.phone || '',
        email: item.email || '',
        address: item.address || '',
        shippingAddress: item.shippingAddress || '',
        gst: item.gst || '',
        pan: item.pan || '',
        state: item.state || 'Gujarat',
        stateCode: item.stateCode || '24',
        city: item.city || '',
        district: item.district || '',
        pincode: item.pincode || '',
        notes: item.notes || ''
      });
      setGstVerifyMessage(item.gst ? { success: true, text: 'Saved GSTIN in record' } : null);
      if (item.gst) {
        setGstVerification({
          source: 'database',
          isExistingParty: true,
          tradeName: item.name,
          legalName: item.name,
          status: 'Saved Customer',
          stateName: item.state,
          stateCode: item.stateCode,
          pincode: item.pincode,
          city: item.city,
          district: item.district,
          phone: item.phone,
          email: item.email,
          contactPerson: item.contactPerson,
          hasContactInfo: Boolean(item.phone || item.email),
          contactSource: 'database_match'
        });
      } else {
        setGstVerification(null);
      }
    } else if (activeTab === 'private-materials') {
      setMaterialForm({
        name: item.name || '',
        code: item.code || '',
        description: item.description || '',
        unit: item.unit || 'Nos',
        hsn: item.hsn || '',
        gstRate: item.gstRate !== undefined ? item.gstRate : 18,
        rate: item.rate || 0
      });
    } else if (activeTab === 'raw-materials') {
      setRawMaterialForm({
        name: item.name || '',
        category: item.category || 'Angles',
        size: item.size || '',
        grade: item.grade || 'IS 2062',
        unit: item.unit || 'KG',
        hsn: item.hsn || '7216',
        gstRate: item.gstRate !== undefined ? item.gstRate : 18,
        defaultRate: item.defaultRate || 0,
        description: item.description || '',
        isActive: item.isActive !== undefined ? item.isActive : true
      });
    } else {
      setNewItemName(item.name || item.year || '');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // GST Verification Handler for Private Party
  const handleVerifyGst = async () => {
    const gstin = (partyForm.gst || '').trim().toUpperCase();
    if (!gstin) {
      setGstVerifyMessage({ error: true, text: 'Please enter a GSTIN to verify' });
      toast.error('Please enter a GSTIN to verify');
      return;
    }
    if (!GSTIN_REGEX.test(gstin)) {
      setGstVerifyMessage({ error: true, text: 'Invalid GSTIN format (15 characters alphanumeric)' });
      toast.error('Invalid GSTIN format');
      return;
    }

    try {
      setIsVerifyingGst(true);
      setGstVerifyMessage(null);
      const res = await verifyGstinApi(gstin);
      const data = res?.data || res;

      if (data && (data.tradeName || data.legalName)) {
        const stateCode = data.stateCode || gstin.substring(0, 2);
        const panFromGst = data.pan || (gstin.length >= 12 ? gstin.substring(2, 12) : '');

        setPartyForm(prev => ({
          ...prev,
          name: data.tradeName || data.legalName || prev.name,
          gst: data.gstin || gstin,
          address: data.address || prev.address,
          city: data.city || prev.city,
          district: data.district || prev.district,
          pincode: data.pincode || prev.pincode,
          state: data.stateName || (stateCode === '24' ? 'Gujarat' : prev.state),
          stateCode: stateCode,
          pan: panFromGst || prev.pan,
          phone: data.phone || prev.phone,
          email: data.email || prev.email,
          contactPerson: data.contactPerson || prev.contactPerson,
        }));

        setGstVerification({
          source: res?.source || 'sandbox',
          isExistingParty: res?.isExistingParty,
          ...data
        });

        setGstVerifyMessage({
          success: true,
          text: `Verified: ${data.tradeName || data.legalName} (${data.status || 'Active'})`
        });
        toast.success(`GSTIN Verified: ${data.tradeName || data.legalName}`);
      } else {
        const errText = res?.message || 'No business records found for this GSTIN';
        setGstVerifyMessage({ error: true, text: errText });
        toast.error(errText);
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'GSTIN verification failed';
      setGstVerifyMessage({ error: true, text: msg });
      toast.error(msg);
    } finally {
      setIsVerifyingGst(false);
    }
  };

  // Auto-fill PAN when GSTIN is entered
  const handleGstChange = (val) => {
    const cleanGst = val.toUpperCase().trim();
    const panFromGst = cleanGst.length >= 12 ? cleanGst.substring(2, 12) : partyForm.pan;
    const stateCode = cleanGst.length >= 2 ? cleanGst.substring(0, 2) : partyForm.stateCode;
    const isGujarat = stateCode === '24';

    setPartyForm(prev => ({
      ...prev,
      gst: cleanGst,
      pan: panFromGst,
      stateCode: stateCode || prev.stateCode,
      state: cleanGst.length >= 2 ? (isGujarat ? 'Gujarat' : prev.state) : prev.state
    }));
  };

  // Submit Private Party
  const handleAddOrUpdatePrivateParty = async (e) => {
    e.preventDefault();
    if (!partyForm.name.trim()) {
      toast.error('Party Name is required');
      return;
    }

    try {
      if (editingItem) {
        await updatePrivateParty(editingItem.id, partyForm);
        toast.success('Private Party updated successfully');
      } else {
        await addPrivateParty(partyForm);
        toast.success('Private Party added successfully');
      }
      cancelEdit();
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.error || `Failed to ${editingItem ? 'update' : 'add'} Private Party`);
    }
  };

  // Submit Private Material
  const handleAddOrUpdatePrivateMaterial = async (e) => {
    e.preventDefault();
    if (!materialForm.name.trim()) {
      toast.error('Material Name is required');
      return;
    }

    try {
      if (editingItem) {
        await updatePrivateMaterial(editingItem.id, materialForm);
        toast.success('Private Material updated successfully');
      } else {
        await addPrivateMaterial(materialForm);
        toast.success('Private Material added successfully');
      }
      cancelEdit();
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.error || `Failed to ${editingItem ? 'update' : 'add'} Private Material`);
    }
  };

  // Submit Raw Material (For Purchase Management & Vendors)
  const handleAddOrUpdateRawMaterial = async (e) => {
    e.preventDefault();
    if (!rawMaterialForm.name.trim()) {
      toast.error('Raw Material Name is required');
      return;
    }
    if (!rawMaterialForm.category.trim()) {
      toast.error('Category is required');
      return;
    }

    try {
      if (editingItem) {
        await updateRawMaterial(editingItem.id, rawMaterialForm);
        toast.success('Raw Material updated successfully');
      } else {
        await addRawMaterial(rawMaterialForm);
        toast.success('Raw Material added successfully');
      }
      cancelEdit();
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.error || `Failed to ${editingItem ? 'update' : 'add'} Raw Material`);
    }
  };

  // Submit simple master data
  const handleAddOrUpdateItem = async (e) => {
    e.preventDefault();
    if (!newItemName.trim()) return;

    try {
      if (editingItem) {
        const payload = activeTab === 'financial-years' ? { year: newItemName } : { name: newItemName };
        if (activeTab === 'materials') await updateMaterial(editingItem.id, payload);
        else if (activeTab === 'divisions') await updateDivision(editingItem.id, payload);
        else if (activeTab === 'invoice-divisions') await updateInvoiceDivision(editingItem.id, payload);
        else if (activeTab === 'contractors') await updateContractor(editingItem.id, payload);
        else if (activeTab === 'receipt-parties') await updateReceiptParty(editingItem.id, payload);
        else if (activeTab === 'financial-years') await updateFinancialYear(editingItem.id, payload);
        toast.success('Updated successfully');
      } else {
        if (activeTab === 'materials') await addMaterial({ name: newItemName });
        else if (activeTab === 'divisions') await addDivision({ name: newItemName });
        else if (activeTab === 'invoice-divisions') await addInvoiceDivision({ name: newItemName });
        else if (activeTab === 'contractors') await addContractor({ name: newItemName });
        else if (activeTab === 'receipt-parties') await addReceiptParty({ name: newItemName });
        else if (activeTab === 'financial-years') await addFinancialYear({ year: newItemName });
        toast.success('Added successfully');
      }
      setNewItemName('');
      setEditingItem(null);
      fetchData();
    } catch (error) {
      toast.error(`Failed to ${editingItem ? 'update' : 'add'} item`);
    }
  };

  const handleDeleteItem = async (id, name = 'item') => {
    if (!window.confirm(`Are you sure you want to delete "${name}"? This could affect past records if they use this name.`)) return;
    
    try {
      if (activeTab === 'raw-materials') await deleteRawMaterial(id);
      else if (activeTab === 'materials') await deleteMaterial(id);
      else if (activeTab === 'private-materials') await deletePrivateMaterial(id);
      else if (activeTab === 'divisions') await deleteDivision(id);
      else if (activeTab === 'invoice-divisions') await deleteInvoiceDivision(id);
      else if (activeTab === 'contractors') await deleteContractor(id);
      else if (activeTab === 'receipt-parties') await deleteReceiptParty(id);
      else if (activeTab === 'financial-years') await deleteFinancialYear(id);
      else if (activeTab === 'private-parties') await deletePrivateParty(id);
      
      toast.success('Deleted successfully');
      fetchData();
    } catch (error) {
      toast.error(`Failed to delete item`);
    }
  };

  const handleSeed = async () => {
    if (window.confirm("This will auto-fill the database with default materials and divisions if they are currently empty. Continue?")) {
      setLoading(true);
      try {
        await seedMasterData();
        await fetchData();
        toast.success('Database seeded successfully!');
      } catch (error) {
        toast.error('Failed to seed database');
      }
      setLoading(false);
    }
  };

  // Filtered lists
  const filteredParties = privateParties.filter(p => {
    const s = partySearch.toLowerCase();
    return (
      (p.name || '').toLowerCase().includes(s) ||
      (p.gst || '').toLowerCase().includes(s) ||
      (p.phone || '').toLowerCase().includes(s) ||
      (p.email || '').toLowerCase().includes(s) ||
      (p.state || '').toLowerCase().includes(s) ||
      (p.city || '').toLowerCase().includes(s)
    );
  });

  const filteredMaterials = privateMaterials.filter(m => {
    const s = materialSearch.toLowerCase();
    return (
      (m.name || '').toLowerCase().includes(s) ||
      (m.code || '').toLowerCase().includes(s) ||
      (m.hsn || '').toLowerCase().includes(s) ||
      (m.description || '').toLowerCase().includes(s)
    );
  });

  const filteredRawMaterials = rawMaterials.filter(m => {
    const matchesCat = rawMaterialCategoryFilter === 'all' || m.category === rawMaterialCategoryFilter;
    const q = rawMaterialSearch.toLowerCase().trim();
    if (!matchesCat) return false;
    if (!q) return true;
    return (
      (m.name || '').toLowerCase().includes(q) ||
      (m.category || '').toLowerCase().includes(q) ||
      (m.size || '').toLowerCase().includes(q) ||
      (m.grade || '').toLowerCase().includes(q) ||
      (m.hsn || '').toLowerCase().includes(q) ||
      (m.description || '').toLowerCase().includes(q)
    );
  });

  const getActiveList = () => {
    if (activeTab === 'materials') return materials;
    if (activeTab === 'divisions') return divisions;
    if (activeTab === 'invoice-divisions') return invoiceDivisions;
    if (activeTab === 'contractors') return contractors;
    if (activeTab === 'receipt-parties') return receiptParties;
    if (activeTab === 'financial-years') return financialYears;
    return [];
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
            <Settings size={28} className="text-[#0059bb]" /> Settings & Master Data
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Manage raw materials for procurement, private parties, finished goods catalog, and system settings.
          </p>
        </div>
        <button 
          onClick={handleSeed} 
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-semibold transition-colors cursor-pointer shadow-xs disabled:opacity-50" 
          disabled={loading}
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Auto-Fill Default Data
        </button>
      </header>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar Tabs */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs w-full md:w-64 p-4 h-fit shrink-0">
          <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500">Data Categories</h3>
          <ul className="flex flex-row md:flex-col gap-1.5 overflow-x-auto md:overflow-visible pb-2 md:pb-0 list-none p-0 m-0">
            {[
              { id: 'raw-materials', label: 'Manage Raw Materials', icon: '🔩', badge: rawMaterials.length },
              { id: 'private-parties', label: 'Manage Private Parties', icon: '🤝', badge: privateParties.length },
              { id: 'private-materials', label: 'Manage Private Materials', icon: '🛍️', badge: privateMaterials.length },
              { id: 'materials', label: 'Govt Materials', icon: '📦' },
              { id: 'divisions', label: 'Divisions', icon: '🏢' },
              { id: 'invoice-divisions', label: 'Invoice Divisions', icon: '🧾' },
              { id: 'contractors', label: 'Contractors', icon: '👷' },
              { id: 'receipt-parties', label: 'Receipt Parties', icon: '🏛️' },
              { id: 'financial-years', label: 'Financial Years', icon: '📅' },
            ].map(cat => (
              <li key={cat.id} className="shrink-0 md:shrink">
                <button 
                  onClick={() => setActiveTab(cat.id)}
                  className={`w-full flex items-center justify-between text-left px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-colors whitespace-nowrap cursor-pointer ${
                    activeTab === cat.id 
                      ? 'bg-blue-50 text-[#0059bb] font-semibold shadow-2xs' 
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span>{cat.icon}</span>
                    <span>{cat.label}</span>
                  </span>
                  {cat.badge !== undefined && (
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                      activeTab === cat.id ? 'bg-[#0059bb] text-white' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {cat.badge}
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Content Area */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs flex-1 p-4 sm:p-6 min-w-0">

          {/* ============================================================
              0. MANAGE RAW MATERIALS (FOR PURCHASE MANAGEMENT & VENDORS)
             ============================================================ */}
          {activeTab === 'raw-materials' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 pb-3 border-b border-slate-200">
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
                    <Wrench className="text-[#0059bb]" size={22} /> Manage Raw Materials
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Catalog of raw steel materials (Angles, Channels, Round Bars, etc.) used strictly for Purchase Management & Vendor RFQ estimates
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold px-2.5 py-1 bg-blue-50 text-[#0059bb] rounded-lg border border-blue-200">
                    Separate from Finished Goods
                  </span>
                </div>
              </div>

              {/* Add / Edit Form */}
              <form onSubmit={handleAddOrUpdateRawMaterial} className="bg-slate-50 p-4 sm:p-6 rounded-2xl border border-slate-200 space-y-4">
                <div className="flex justify-between items-center pb-2 border-b border-slate-200/80">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    {editingItem ? 'Edit Raw Material' : 'Add New Raw Material'}
                  </h3>
                  {editingItem && (
                    <button
                      type="button"
                      onClick={cancelEdit}
                      className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer"
                    >
                      <X size={14} /> Cancel Edit
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  {/* Category */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Category <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={rawMaterialForm.category}
                      onChange={e => {
                        const cat = e.target.value;
                        const defaultHsn = cat === 'Round Bars' ? '7214' : cat === 'Fasteners' ? '7318' : '7216';
                        setRawMaterialForm(prev => {
                          const suggestedName = prev.size ? `${cat.replace(/s$/, '')} ${prev.size}` : prev.name;
                          return {
                            ...prev,
                            category: cat,
                            hsn: defaultHsn,
                            name: prev.name.startsWith('Angle') || prev.name.startsWith('Channel') || prev.name.startsWith('Round') || !prev.name ? suggestedName : prev.name
                          };
                        });
                      }}
                      className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0059bb]/20 focus:border-[#0059bb]"
                    >
                      <option value="Angles">Angles (L-Angle)</option>
                      <option value="Channels">Channels (ISMC)</option>
                      <option value="Round Bars">Round Bars</option>
                      <option value="Flats">Flats (Patti)</option>
                      <option value="Plates">Plates / Sheets</option>
                      <option value="Pipes / Tubes">Pipes / Tubes</option>
                      <option value="Beams / Joists">Beams / Joists</option>
                      <option value="Fasteners">Fasteners / Hardware</option>
                      <option value="Other">Other Raw Material</option>
                    </select>
                  </div>

                  {/* Size / Dimension */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Size / Dimension
                    </label>
                    <input 
                      type="text" 
                      className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0059bb]/20 focus:border-[#0059bb]" 
                      placeholder="e.g. 65 × 65 × 6 or 20 mm" 
                      value={rawMaterialForm.size} 
                      onChange={e => {
                        const val = e.target.value;
                        setRawMaterialForm(prev => {
                          const prefix = prev.category === 'Angles' ? 'Angle' : prev.category === 'Channels' ? 'Channel' : prev.category === 'Round Bars' ? 'Round Bar' : prev.category === 'Flats' ? 'Flat' : prev.category;
                          const autoName = val ? `${prefix} ${val}` : prev.name;
                          return { ...prev, size: val, name: prev.name ? autoName : prev.name };
                        });
                      }} 
                    />
                    {/* Quick Size Suggestions based on category */}
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {rawMaterialForm.category === 'Angles' && ['65 × 65 × 6', '50 × 50 × 5', '40 × 40 × 5', '75 × 75 × 6'].map(sz => (
                        <button
                          key={sz}
                          type="button"
                          onClick={() => setRawMaterialForm(prev => ({ ...prev, size: sz, name: `Angle ${sz}` }))}
                          className="text-[10px] px-1.5 py-0.5 bg-slate-200/80 hover:bg-blue-100 hover:text-[#0059bb] rounded text-slate-700 transition-colors cursor-pointer"
                        >
                          {sz}
                        </button>
                      ))}
                      {rawMaterialForm.category === 'Channels' && ['100 × 50', '75 × 40', '125 × 65', '150 × 75'].map(sz => (
                        <button
                          key={sz}
                          type="button"
                          onClick={() => setRawMaterialForm(prev => ({ ...prev, size: sz, name: `Channel ${sz}` }))}
                          className="text-[10px] px-1.5 py-0.5 bg-slate-200/80 hover:bg-blue-100 hover:text-[#0059bb] rounded text-slate-700 transition-colors cursor-pointer"
                        >
                          {sz}
                        </button>
                      ))}
                      {rawMaterialForm.category === 'Round Bars' && ['16 mm', '20 mm', '25 mm', '32 mm'].map(sz => (
                        <button
                          key={sz}
                          type="button"
                          onClick={() => setRawMaterialForm(prev => ({ ...prev, size: sz, name: `Round Bar ${sz}` }))}
                          className="text-[10px] px-1.5 py-0.5 bg-slate-200/80 hover:bg-blue-100 hover:text-[#0059bb] rounded text-slate-700 transition-colors cursor-pointer"
                        >
                          {sz}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Raw Material Name */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Raw Material Name <span className="text-rose-500">*</span>
                    </label>
                    <input 
                      type="text" 
                      required
                      className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0059bb]/20 focus:border-[#0059bb]" 
                      placeholder="e.g. Angle 65 × 65 × 6" 
                      value={rawMaterialForm.name} 
                      onChange={e => setRawMaterialForm({...rawMaterialForm, name: e.target.value})} 
                    />
                  </div>

                  {/* Grade / Specification */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Grade / Specification</label>
                    <input 
                      type="text" 
                      className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0059bb]/20 focus:border-[#0059bb]" 
                      placeholder="e.g. IS 2062 E250" 
                      value={rawMaterialForm.grade} 
                      onChange={e => setRawMaterialForm({...rawMaterialForm, grade: e.target.value})} 
                    />
                  </div>

                  {/* Unit */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Unit of Measurement</label>
                    <select
                      value={rawMaterialForm.unit}
                      onChange={e => setRawMaterialForm({...rawMaterialForm, unit: e.target.value})}
                      className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0059bb]/20 focus:border-[#0059bb]"
                    >
                      <option value="KG">KG (Kilogram)</option>
                      <option value="MT">MT (Metric Ton)</option>
                      <option value="NOS">NOS (Numbers)</option>
                      <option value="MTR">MTR (Meter)</option>
                      <option value="PCS">PCS (Pieces)</option>
                    </select>
                  </div>

                  {/* HSN Code */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">HSN Code</label>
                    <input 
                      type="text" 
                      className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 bg-white text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-[#0059bb]/20 focus:border-[#0059bb]" 
                      placeholder="e.g. 7216" 
                      value={rawMaterialForm.hsn} 
                      onChange={e => setRawMaterialForm({...rawMaterialForm, hsn: e.target.value})} 
                    />
                  </div>

                  {/* GST Rate */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">GST Rate (%)</label>
                    <select
                      value={rawMaterialForm.gstRate}
                      onChange={e => setRawMaterialForm({...rawMaterialForm, gstRate: Number(e.target.value)})}
                      className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0059bb]/20 focus:border-[#0059bb]"
                    >
                      <option value={18}>18% (Standard GST on Steel)</option>
                      <option value={12}>12%</option>
                      <option value={5}>5%</option>
                      <option value={0}>0% (Exempt)</option>
                      <option value={28}>28%</option>
                    </select>
                  </div>

                  {/* Default / Last Purchase Rate */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Last / Reference Purchase Rate (₹/{rawMaterialForm.unit || 'KG'})
                    </label>
                    <input 
                      type="number" 
                      min="0"
                      step="0.01"
                      className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0059bb]/20 focus:border-[#0059bb]" 
                      placeholder="0.00" 
                      value={rawMaterialForm.defaultRate || ''} 
                      onChange={e => setRawMaterialForm({...rawMaterialForm, defaultRate: parseFloat(e.target.value) || 0})} 
                    />
                  </div>

                  {/* Description / Notes */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Description / Technical Notes</label>
                    <input 
                      type="text" 
                      className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0059bb]/20 focus:border-[#0059bb]" 
                      placeholder="e.g. Standard structural mild steel angle" 
                      value={rawMaterialForm.description} 
                      onChange={e => setRawMaterialForm({...rawMaterialForm, description: e.target.value})} 
                    />
                  </div>

                  {/* Active Status */}
                  <div className="flex items-center gap-2 pt-6">
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                      <input
                        type="checkbox"
                        checked={rawMaterialForm.isActive}
                        onChange={e => setRawMaterialForm({...rawMaterialForm, isActive: e.target.checked})}
                        className="w-4 h-4 rounded text-[#0059bb] focus:ring-[#0059bb]"
                      />
                      Active for Purchase Requirements
                    </label>
                  </div>
                </div>

                <div className="flex gap-2.5 pt-2">
                  <button 
                    type="submit" 
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0059bb] hover:bg-[#004899] text-white text-xs sm:text-sm font-semibold transition-colors cursor-pointer shadow-xs disabled:opacity-50" 
                    disabled={!rawMaterialForm.name.trim()}
                  >
                    {editingItem ? <><Save size={16} /> Update Raw Material</> : <><Plus size={16} /> Save Raw Material</>}
                  </button>
                  {editingItem && (
                    <button 
                      type="button" 
                      onClick={cancelEdit} 
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 text-xs sm:text-sm font-medium transition-colors cursor-pointer"
                    >
                      <X size={16} /> Cancel
                    </button>
                  )}
                </div>
              </form>

              {/* Category Filter Tabs & Search */}
              <div className="space-y-3">
                {/* Category Chips */}
                <div className="flex flex-wrap gap-2 items-center">
                  <span className="text-xs font-semibold text-slate-500 mr-1">Filter by Category:</span>
                  {[
                    { id: 'all', label: 'All Raw Materials', count: rawMaterials.length },
                    { id: 'Angles', label: 'Angles', count: rawMaterials.filter(m => m.category === 'Angles').length },
                    { id: 'Channels', label: 'Channels', count: rawMaterials.filter(m => m.category === 'Channels').length },
                    { id: 'Round Bars', label: 'Round Bars', count: rawMaterials.filter(m => m.category === 'Round Bars').length },
                    { id: 'Flats', label: 'Flats', count: rawMaterials.filter(m => m.category === 'Flats').length },
                    { id: 'Plates', label: 'Plates', count: rawMaterials.filter(m => m.category === 'Plates').length },
                    { id: 'Other', label: 'Other', count: rawMaterials.filter(m => !['Angles','Channels','Round Bars','Flats','Plates'].includes(m.category)).length },
                  ].map(cat => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setRawMaterialCategoryFilter(cat.id)}
                      className={`text-xs px-3 py-1.5 rounded-xl font-medium transition-colors cursor-pointer ${
                        rawMaterialCategoryFilter === cat.id
                          ? 'bg-[#0059bb] text-white shadow-xs font-semibold'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {cat.label} ({cat.count})
                    </button>
                  ))}
                </div>

                {/* Search Bar */}
                <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
                  <div className="relative w-full max-w-sm">
                    <Search size={16} className="absolute left-3 top-2.5 text-slate-400 pointer-events-none" />
                    <input
                      type="text"
                      placeholder="Search by material name, category, size, or grade..."
                      value={rawMaterialSearch}
                      onChange={e => setRawMaterialSearch(e.target.value)}
                      className="w-full pl-9 pr-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0059bb]/20 focus:border-[#0059bb]"
                    />
                  </div>
                  <div className="text-xs text-slate-500 flex items-center gap-1">
                    Showing <strong>{filteredRawMaterials.length}</strong> of {rawMaterials.length} raw materials
                  </div>
                </div>
              </div>

              {/* Raw Materials Table */}
              <div className="overflow-x-auto w-full bg-white rounded-2xl border border-slate-200">
                <table className="w-full text-xs sm:text-sm text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/80">
                      <th className="px-4 py-3 font-semibold text-xs text-slate-500 uppercase tracking-wider">Category & Material Name</th>
                      <th className="px-4 py-3 font-semibold text-xs text-slate-500 uppercase tracking-wider">Size / Dimension</th>
                      <th className="px-4 py-3 font-semibold text-xs text-slate-500 uppercase tracking-wider">Grade & Specs</th>
                      <th className="px-4 py-3 font-semibold text-xs text-slate-500 uppercase tracking-wider">Unit</th>
                      <th className="px-4 py-3 font-semibold text-xs text-slate-500 uppercase tracking-wider">HSN & GST</th>
                      <th className="px-4 py-3 font-semibold text-xs text-slate-500 uppercase tracking-wider">Ref Rate</th>
                      <th className="px-4 py-3 font-semibold text-xs text-slate-500 uppercase tracking-wider">Status</th>
                      <th className="px-4 py-3 font-semibold text-xs text-slate-500 uppercase tracking-wider text-right w-28">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredRawMaterials.length === 0 ? (
                      <tr>
                        <td colSpan="8" className="py-12 text-center text-slate-400">
                          {rawMaterialSearch ? 'No raw materials matching search criteria.' : 'No raw materials added yet. Click "Auto-Fill Default Data" or add one using the form above.'}
                        </td>
                      </tr>
                    ) : (
                      filteredRawMaterials.map(rm => (
                        <tr key={rm._id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                                rm.category === 'Angles' ? 'bg-blue-100 text-blue-800' :
                                rm.category === 'Channels' ? 'bg-indigo-100 text-indigo-800' :
                                rm.category === 'Round Bars' ? 'bg-emerald-100 text-emerald-800' :
                                rm.category === 'Flats' ? 'bg-purple-100 text-purple-800' :
                                rm.category === 'Plates' ? 'bg-amber-100 text-amber-800' :
                                'bg-slate-100 text-slate-800'
                              }`}>
                                {rm.category}
                              </span>
                              <div className="font-bold text-slate-900">{rm.name}</div>
                            </div>
                            {rm.description && (
                              <div className="text-[11px] text-slate-500 mt-0.5">{rm.description}</div>
                            )}
                          </td>
                          <td className="px-4 py-3 font-semibold text-slate-800">
                            {rm.size ? (
                              <span className="font-mono px-2 py-0.5 bg-slate-100 rounded text-slate-800">
                                {rm.size}
                              </span>
                            ) : '—'}
                          </td>
                          <td className="px-4 py-3 text-slate-600">
                            {rm.grade || 'IS 2062'}
                          </td>
                          <td className="px-4 py-3 font-semibold text-slate-700">
                            {rm.unit || 'KG'}
                          </td>
                          <td className="px-4 py-3">
                            <span className="font-mono text-xs text-[#0059bb] font-semibold">{rm.hsn || '7216'}</span>
                            <span className="text-xs text-slate-500 ml-1">({rm.gstRate || 18}%)</span>
                          </td>
                          <td className="px-4 py-3 font-semibold text-slate-800">
                            {rm.defaultRate ? `₹${rm.defaultRate.toLocaleString('en-IN')}` : '—'}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${
                              rm.isActive !== false ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${rm.isActive !== false ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                              {rm.isActive !== false ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex gap-1.5 justify-end">
                              <button 
                                onClick={() => setViewingRawMaterial(rm)} 
                                className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer" 
                                title="View Details"
                              >
                                <Eye size={16} />
                              </button>
                              <button 
                                onClick={() => handleEditItem(rm)} 
                                className="p-1.5 text-[#0059bb] hover:bg-blue-50 rounded-lg transition-colors cursor-pointer" 
                                title="Edit Raw Material"
                              >
                                <Edit size={16} />
                              </button>
                              <button 
                                onClick={() => handleDeleteItem(rm._id, rm.name)} 
                                className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer" 
                                title="Delete Raw Material"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ============================================================
              1. MANAGE PRIVATE PARTIES
             ============================================================ */}
          {activeTab === 'private-parties' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 pb-3 border-b border-slate-200">
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
                    <Building2 className="text-[#0059bb]" size={22} /> Manage Private Parties / Clients
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Register private clients with verified GSTIN, billing, and shipping details for Private Invoices & Quotations
                  </p>
                </div>
              </div>

              {/* Add / Edit Form */}
              <form onSubmit={handleAddOrUpdatePrivateParty} className="bg-slate-50 p-4 sm:p-6 rounded-2xl border border-slate-200 space-y-4">
                <div className="flex justify-between items-center pb-2 border-b border-slate-200/80">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    {editingItem ? 'Edit Private Party Details' : 'Add New Private Party / Client'}
                  </h3>
                  {editingItem && (
                    <button
                      type="button"
                      onClick={cancelEdit}
                      className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer"
                    >
                      <X size={14} /> Cancel Edit
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {/* GSTIN with Live Verification */}
                  <div className="sm:col-span-2 md:col-span-1">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      GSTIN / UIN
                    </label>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 bg-white text-slate-900 font-mono uppercase focus:outline-none focus:ring-2 focus:ring-[#0059bb]/20 focus:border-[#0059bb]" 
                        placeholder="e.g. 24ALKPP4729L1ZM" 
                        value={partyForm.gst} 
                        onChange={e => handleGstChange(e.target.value)} 
                      />
                      <button
                        type="button"
                        onClick={handleVerifyGst}
                        disabled={isVerifyingGst}
                        className="px-3 py-2 bg-[#0059bb] hover:bg-[#004c9e] text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shrink-0 disabled:opacity-50 flex items-center gap-1"
                        title="Verify GSTIN with Sandbox API"
                      >
                        {isVerifyingGst ? <RefreshCw size={14} className="animate-spin" /> : <ShieldCheck size={14} />}
                        <span>Verify</span>
                      </button>
                    </div>
                    {gstVerifyMessage && (
                      <div className={`mt-1.5 text-xs flex items-center gap-1 ${
                        gstVerifyMessage.success ? 'text-emerald-700 font-semibold' : 'text-rose-600'
                      }`}>
                        {gstVerifyMessage.success ? <CheckCircle2 size={13} /> : <AlertCircle size={13} />}
                        <span>{gstVerifyMessage.text}</span>
                      </div>
                    )}
                  </div>

                  {/* Rich GST Verification Details Card */}
                  {gstVerification && (
                    <div className="sm:col-span-2 md:col-span-3 p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-2xl animate-in fade-in duration-150 shadow-xs">
                      <div className="flex justify-between items-start flex-wrap gap-2">
                        <div className="flex items-center gap-1.5 text-emerald-700 font-bold text-xs sm:text-sm">
                          <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                          <span>
                            {gstVerification.isExistingParty ? 'Existing Customer Verified' : 'GSTIN Verified Active'}
                          </span>
                          {gstVerification.source && (
                            <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded uppercase font-semibold">
                              {gstVerification.source}
                            </span>
                          )}
                        </div>
                        <span className="text-xs font-bold bg-sky-100 text-sky-800 px-2.5 py-0.5 rounded-full">
                          {(gstVerification.stateCode || partyForm.stateCode) !== '24' ? 'Inter-State (IGST)' : 'Intra-State (CGST + SGST)'}
                        </span>
                      </div>

                      <div className="mt-2.5 text-xs text-slate-800 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-1.5">
                        <div><strong>Legal Entity:</strong> {gstVerification.legalName || gstVerification.tradeName || '—'}</div>
                        <div><strong>Trade Name:</strong> {gstVerification.tradeName || gstVerification.legalName || '—'}</div>
                        <div><strong>State:</strong> {gstVerification.stateName || partyForm.state || 'Gujarat'} ({gstVerification.stateCode || partyForm.stateCode || '24'})</div>
                        <div><strong>Status:</strong> <span className="text-emerald-600 font-semibold">{gstVerification.status || 'Active'}</span></div>
                        {gstVerification.constitution && <div><strong>Constitution:</strong> {gstVerification.constitution}</div>}
                        {(gstVerification.pincode || partyForm.pincode) && (
                          <div><strong>Pincode:</strong> {gstVerification.pincode || partyForm.pincode}</div>
                        )}
                        {(gstVerification.city || gstVerification.district || partyForm.city) && (
                          <div className="sm:col-span-2"><strong>City / District:</strong> {[gstVerification.city || partyForm.city, gstVerification.district || partyForm.district].filter(Boolean).filter((v, i, a) => a.indexOf(v) === i).join(', ')}</div>
                        )}
                      </div>

                      {/* Contact Information Status Banner */}
                      <div className="mt-2.5 pt-2.5 border-t border-emerald-200 text-xs">
                        {(gstVerification.hasContactInfo || gstVerification.phone || gstVerification.email || partyForm.phone || partyForm.email) ? (
                          <div className="flex items-center justify-between flex-wrap gap-2 bg-emerald-100/60 p-2.5 rounded-xl border border-emerald-300">
                            <div className="flex items-center gap-3.5 flex-wrap text-emerald-950">
                              {(gstVerification.phone || partyForm.phone) && (
                                <span>📞 <strong>Phone:</strong> {gstVerification.phone || partyForm.phone}</span>
                              )}
                              {(gstVerification.email || partyForm.email) && (
                                <span>✉️ <strong>Email:</strong> {gstVerification.email || partyForm.email}</span>
                              )}
                              {(gstVerification.contactPerson || partyForm.contactPerson) && (
                                <span>👤 <strong>Contact:</strong> {gstVerification.contactPerson || partyForm.contactPerson}</span>
                              )}
                            </div>
                            <span className="text-[10px] bg-emerald-200 text-emerald-900 px-1.5 py-0.5 rounded font-semibold">
                              ✓ Contact Auto-populated
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-slate-600 text-xs bg-slate-100 p-2.5 rounded-xl border border-slate-200">
                            <span className="text-blue-500 font-bold shrink-0">ℹ️</span>
                            <span>
                              <strong>Contact Info Note:</strong> Public GST registry protects taxpayer privacy and does not publish Email/Phone. You can enter contact details manually below or pick from saved customer master.
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Party / Company Name */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Party / Company Name <span className="text-rose-500">*</span>
                    </label>
                    <input 
                      type="text" 
                      required
                      className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0059bb]/20 focus:border-[#0059bb]" 
                      placeholder="e.g. Maruti Precision Works Pvt Ltd" 
                      value={partyForm.name} 
                      onChange={e => setPartyForm({...partyForm, name: e.target.value})} 
                    />
                  </div>

                  {/* Contact Person */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Contact Person</label>
                    <input 
                      type="text" 
                      className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0059bb]/20 focus:border-[#0059bb]" 
                      placeholder="e.g. Ramesh Patel" 
                      value={partyForm.contactPerson} 
                      onChange={e => setPartyForm({...partyForm, contactPerson: e.target.value})} 
                    />
                  </div>

                  {/* Mobile Phone */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Mobile / Phone</label>
                    <input 
                      type="text" 
                      className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0059bb]/20 focus:border-[#0059bb]" 
                      placeholder="+91 98765 43210" 
                      value={partyForm.phone} 
                      onChange={e => setPartyForm({...partyForm, phone: e.target.value})} 
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
                    <input 
                      type="email" 
                      className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0059bb]/20 focus:border-[#0059bb]" 
                      placeholder="contact@company.com" 
                      value={partyForm.email} 
                      onChange={e => setPartyForm({...partyForm, email: e.target.value})} 
                    />
                  </div>

                  {/* PAN */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">PAN Number</label>
                    <input 
                      type="text" 
                      className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 bg-white text-slate-900 font-mono uppercase focus:outline-none focus:ring-2 focus:ring-[#0059bb]/20 focus:border-[#0059bb]" 
                      placeholder="ABCDE1234F" 
                      value={partyForm.pan} 
                      onChange={e => setPartyForm({...partyForm, pan: e.target.value.toUpperCase()})} 
                    />
                  </div>

                  {/* State & State Code */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">State & State Code</label>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        className="w-2/3 px-3.5 py-2 text-sm rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0059bb]/20 focus:border-[#0059bb]" 
                        placeholder="Gujarat" 
                        value={partyForm.state} 
                        onChange={e => setPartyForm({...partyForm, state: e.target.value})} 
                      />
                      <input 
                        type="text" 
                        className="w-1/3 px-3.5 py-2 text-sm rounded-xl border border-slate-300 bg-white text-slate-900 text-center font-mono focus:outline-none focus:ring-2 focus:ring-[#0059bb]/20 focus:border-[#0059bb]" 
                        placeholder="24" 
                        value={partyForm.stateCode} 
                        onChange={e => setPartyForm({...partyForm, stateCode: e.target.value})} 
                      />
                    </div>
                  </div>

                  {/* City & Pincode */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">City & Pincode</label>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        className="w-2/3 px-3.5 py-2 text-sm rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0059bb]/20 focus:border-[#0059bb]" 
                        placeholder="Ahmedabad" 
                        value={partyForm.city} 
                        onChange={e => setPartyForm({...partyForm, city: e.target.value})} 
                      />
                      <input 
                        type="text" 
                        className="w-1/3 px-3.5 py-2 text-sm rounded-xl border border-slate-300 bg-white text-slate-900 text-center font-mono focus:outline-none focus:ring-2 focus:ring-[#0059bb]/20 focus:border-[#0059bb]" 
                        placeholder="380001" 
                        value={partyForm.pincode} 
                        onChange={e => setPartyForm({...partyForm, pincode: e.target.value})} 
                      />
                    </div>
                  </div>

                  {/* Billing Address */}
                  <div className="sm:col-span-2 md:col-span-3">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Billing Address (Registered Office)
                    </label>
                    <textarea 
                      rows={2}
                      className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0059bb]/20 focus:border-[#0059bb]" 
                      placeholder="Plot No., Industrial Estate, Street, City, State, PIN" 
                      value={partyForm.address} 
                      onChange={e => setPartyForm({...partyForm, address: e.target.value})} 
                    />
                  </div>

                  {/* Shipping Address */}
                  <div className="sm:col-span-2 md:col-span-3">
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-xs font-semibold text-slate-700">Shipping Address (Optional)</label>
                      <button
                        type="button"
                        onClick={() => setPartyForm(p => ({ ...p, shippingAddress: p.address }))}
                        className="text-xs text-[#0059bb] hover:underline font-semibold cursor-pointer"
                      >
                        Copy from Billing Address
                      </button>
                    </div>
                    <textarea 
                      rows={2}
                      className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0059bb]/20 focus:border-[#0059bb]" 
                      placeholder="Site/Delivery address if different from billing address" 
                      value={partyForm.shippingAddress} 
                      onChange={e => setPartyForm({...partyForm, shippingAddress: e.target.value})} 
                    />
                  </div>
                </div>

                <div className="flex gap-2.5 pt-2">
                  <button 
                    type="submit" 
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0059bb] hover:bg-[#004899] text-white text-xs sm:text-sm font-semibold transition-colors cursor-pointer shadow-xs disabled:opacity-50" 
                    disabled={!partyForm.name.trim()}
                  >
                    {editingItem ? <><Save size={16} /> Update Party</> : <><Plus size={16} /> Save Party</>}
                  </button>
                  {editingItem && (
                    <button 
                      type="button" 
                      onClick={cancelEdit} 
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 text-xs sm:text-sm font-medium transition-colors cursor-pointer"
                    >
                      <X size={16} /> Cancel
                    </button>
                  )}
                </div>
              </form>

              {/* Search Bar */}
              <div className="flex justify-between items-center gap-4">
                <div className="relative w-full max-w-sm">
                  <Search size={16} className="absolute left-3 top-2.5 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Search by party name, GSTIN, phone, or state..."
                    value={partySearch}
                    onChange={e => setPartySearch(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0059bb]/20 focus:border-[#0059bb]"
                  />
                </div>
                <div className="text-xs text-slate-500">
                  Showing <strong>{filteredParties.length}</strong> of {privateParties.length} parties
                </div>
              </div>

              {/* Parties Table */}
              <div className="overflow-x-auto w-full bg-white rounded-2xl border border-slate-200">
                <table className="w-full text-xs sm:text-sm text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/80">
                      <th className="px-4 py-3 font-semibold text-xs text-slate-500 uppercase tracking-wider">Party / Trade Name</th>
                      <th className="px-4 py-3 font-semibold text-xs text-slate-500 uppercase tracking-wider">GSTIN & PAN</th>
                      <th className="px-4 py-3 font-semibold text-xs text-slate-500 uppercase tracking-wider">Contact</th>
                      <th className="px-4 py-3 font-semibold text-xs text-slate-500 uppercase tracking-wider">State / City</th>
                      <th className="px-4 py-3 font-semibold text-xs text-slate-500 uppercase tracking-wider text-right w-32">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredParties.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="py-12 text-center text-slate-400">
                          {partySearch ? 'No parties matching search criteria.' : 'No private parties added yet. Use the form above to add your first party.'}
                        </td>
                      </tr>
                    ) : (
                      filteredParties.map(party => (
                        <tr key={party._id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-4 py-3">
                            <div className="font-bold text-slate-900">{party.name}</div>
                            {party.contactPerson && (
                              <div className="text-xs text-slate-500">Contact: {party.contactPerson}</div>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {party.gst ? (
                              <div className="font-mono text-xs font-semibold text-[#0059bb]">{party.gst}</div>
                            ) : (
                              <div className="text-xs text-slate-400">No GSTIN</div>
                            )}
                            {party.pan && (
                              <div className="font-mono text-[11px] text-slate-500">PAN: {party.pan}</div>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {party.phone && <div className="text-xs text-slate-700">{party.phone}</div>}
                            {party.email && <div className="text-xs text-slate-400">{party.email}</div>}
                          </td>
                          <td className="px-4 py-3 text-xs text-slate-700">
                            <div>{party.state || 'Gujarat'} {party.stateCode ? `(${party.stateCode})` : ''}</div>
                            {party.city && <div className="text-slate-400">{party.city}</div>}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex gap-1.5 justify-end">
                              <button 
                                onClick={() => navigate(`/private-party-ledger?partyId=${party._id}`)} 
                                className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer" 
                                title="Party Ledger (Khata / Hisab)"
                              >
                                <BookOpen size={16} />
                              </button>
                              <button 
                                onClick={() => setViewingParty(party)} 
                                className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer" 
                                title="View Details"
                              >
                                <Eye size={16} />
                              </button>
                              <button 
                                onClick={() => handleEditItem(party)} 
                                className="p-1.5 text-[#0059bb] hover:bg-blue-50 rounded-lg transition-colors cursor-pointer" 
                                title="Edit Party"
                              >
                                <Edit size={16} />
                              </button>
                              <button 
                                onClick={() => handleDeleteItem(party._id, party.name)} 
                                className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer" 
                                title="Delete Party"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ============================================================
              2. MANAGE PRIVATE MATERIALS
             ============================================================ */}
          {activeTab === 'private-materials' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 pb-3 border-b border-slate-200">
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
                    <Package className="text-[#0059bb]" size={22} /> Manage Private Materials & Services
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Configure goods, fabrication items, SKU codes, HSN/SAC codes, and default rates for Private Invoices & Quotations
                  </p>
                </div>
              </div>

              {/* Add / Edit Form */}
              <form onSubmit={handleAddOrUpdatePrivateMaterial} className="bg-slate-50 p-4 sm:p-6 rounded-2xl border border-slate-200 space-y-4">
                <div className="flex justify-between items-center pb-2 border-b border-slate-200/80">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    {editingItem ? 'Edit Private Material Details' : 'Add New Private Material / Service'}
                  </h3>
                  {editingItem && (
                    <button
                      type="button"
                      onClick={cancelEdit}
                      className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer"
                    >
                      <X size={14} /> Cancel Edit
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  {/* Material Name */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Material / Item Name <span className="text-rose-500">*</span>
                    </label>
                    <input 
                      type="text" 
                      required
                      className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0059bb]/20 focus:border-[#0059bb]" 
                      placeholder="e.g. MS Angle 50x50x6 mm" 
                      value={materialForm.name} 
                      onChange={e => setMaterialForm({...materialForm, name: e.target.value})} 
                    />
                  </div>

                  {/* SKU / Material Code */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Material Code / SKU</label>
                    <input 
                      type="text" 
                      className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 bg-white text-slate-900 font-mono uppercase focus:outline-none focus:ring-2 focus:ring-[#0059bb]/20 focus:border-[#0059bb]" 
                      placeholder="e.g. MAT-ANG-05" 
                      value={materialForm.code} 
                      onChange={e => setMaterialForm({...materialForm, code: e.target.value.toUpperCase()})} 
                    />
                  </div>

                  {/* HSN / SAC */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">HSN / SAC Code</label>
                    <input 
                      type="text" 
                      className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 bg-white text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-[#0059bb]/20 focus:border-[#0059bb]" 
                      placeholder="e.g. 7216 or 9987" 
                      value={materialForm.hsn} 
                      onChange={e => setMaterialForm({...materialForm, hsn: e.target.value})} 
                    />
                  </div>

                  {/* Unit */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Unit of Measurement</label>
                    <select
                      value={materialForm.unit}
                      onChange={e => setMaterialForm({...materialForm, unit: e.target.value})}
                      className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0059bb]/20 focus:border-[#0059bb]"
                    >
                      <option value="Nos">Nos</option>
                      <option value="Kg">Kg</option>
                      <option value="Mtr">Mtr</option>
                      <option value="Set">Set</option>
                      <option value="Lot">Lot</option>
                      <option value="Pair">Pair</option>
                      <option value="Pcs">Pcs</option>
                      <option value="Hrs">Hrs</option>
                    </select>
                  </div>

                  {/* GST Rate */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Default GST Rate (%)</label>
                    <select
                      value={materialForm.gstRate}
                      onChange={e => setMaterialForm({...materialForm, gstRate: Number(e.target.value)})}
                      className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 bg-white text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-[#0059bb]/20 focus:border-[#0059bb]"
                    >
                      <option value="0">0% (Nil / Exempt)</option>
                      <option value="5">5% GST</option>
                      <option value="12">12% GST</option>
                      <option value="18">18% GST (Standard)</option>
                      <option value="28">28% GST</option>
                    </select>
                  </div>

                  {/* Default Rate / Price */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Default Rate / Price (₹)</label>
                    <input 
                      type="number"
                      min="0"
                      step="any"
                      className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 bg-white text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-[#0059bb]/20 focus:border-[#0059bb]" 
                      placeholder="0.00" 
                      value={materialForm.rate} 
                      onChange={e => setMaterialForm({...materialForm, rate: Number(e.target.value)})} 
                    />
                  </div>

                  {/* Description */}
                  <div className="sm:col-span-2 md:col-span-4">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Detailed Description (Optional)</label>
                    <textarea 
                      rows={2}
                      className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0059bb]/20 focus:border-[#0059bb]" 
                      placeholder="Specifications, surface treatment, fabrication details..." 
                      value={materialForm.description} 
                      onChange={e => setMaterialForm({...materialForm, description: e.target.value})} 
                    />
                  </div>
                </div>

                <div className="flex gap-2.5 pt-2">
                  <button 
                    type="submit" 
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0059bb] hover:bg-[#004899] text-white text-xs sm:text-sm font-semibold transition-colors cursor-pointer shadow-xs disabled:opacity-50" 
                    disabled={!materialForm.name.trim()}
                  >
                    {editingItem ? <><Save size={16} /> Update Material</> : <><Plus size={16} /> Save Material</>}
                  </button>
                  {editingItem && (
                    <button 
                      type="button" 
                      onClick={cancelEdit} 
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 text-xs sm:text-sm font-medium transition-colors cursor-pointer"
                    >
                      <X size={16} /> Cancel
                    </button>
                  )}
                </div>
              </form>

              {/* Search Bar */}
              <div className="flex justify-between items-center gap-4">
                <div className="relative w-full max-w-sm">
                  <Search size={16} className="absolute left-3 top-2.5 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Search by material name, code, or HSN..."
                    value={materialSearch}
                    onChange={e => setMaterialSearch(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0059bb]/20 focus:border-[#0059bb]"
                  />
                </div>
                <div className="text-xs text-slate-500">
                  Showing <strong>{filteredMaterials.length}</strong> of {privateMaterials.length} materials
                </div>
              </div>

              {/* Materials Table */}
              <div className="overflow-x-auto w-full bg-white rounded-2xl border border-slate-200">
                <table className="w-full text-xs sm:text-sm text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/80">
                      <th className="px-4 py-3 font-semibold text-xs text-slate-500 uppercase tracking-wider">Material Name</th>
                      <th className="px-4 py-3 font-semibold text-xs text-slate-500 uppercase tracking-wider">Code / SKU</th>
                      <th className="px-4 py-3 font-semibold text-xs text-slate-500 uppercase tracking-wider">HSN/SAC</th>
                      <th className="px-4 py-3 font-semibold text-xs text-slate-500 uppercase tracking-wider text-center">Unit</th>
                      <th className="px-4 py-3 font-semibold text-xs text-slate-500 uppercase tracking-wider text-center">GST Rate</th>
                      <th className="px-4 py-3 font-semibold text-xs text-slate-500 uppercase tracking-wider text-right">Default Rate</th>
                      <th className="px-4 py-3 font-semibold text-xs text-slate-500 uppercase tracking-wider text-right w-28">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredMaterials.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="py-12 text-center text-slate-400">
                          {materialSearch ? 'No materials matching search criteria.' : 'No private materials added yet. Use the form above to add your first material.'}
                        </td>
                      </tr>
                    ) : (
                      filteredMaterials.map(mat => (
                        <tr key={mat._id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-4 py-3">
                            <div className="font-bold text-slate-900">{mat.name}</div>
                            {mat.description && <div className="text-xs text-slate-500 truncate max-w-xs">{mat.description}</div>}
                          </td>
                          <td className="px-4 py-3 font-mono text-xs text-slate-600">
                            {mat.code || '—'}
                          </td>
                          <td className="px-4 py-3 font-mono text-xs text-slate-600">
                            {mat.hsn || '—'}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="bg-slate-100 px-2 py-0.5 rounded text-xs font-semibold text-slate-700">
                              {mat.unit || 'Nos'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center text-xs font-semibold text-slate-700">
                            {mat.gstRate !== undefined ? `${mat.gstRate}%` : '18%'}
                          </td>
                          <td className="px-4 py-3 text-right font-mono font-bold text-[#0059bb]">
                            ₹{Number(mat.rate || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex gap-1.5 justify-end">
                              <button 
                                onClick={() => handleEditItem(mat)} 
                                className="p-1.5 text-[#0059bb] hover:bg-blue-50 rounded-lg transition-colors cursor-pointer" 
                                title="Edit Material"
                              >
                                <Edit size={16} />
                              </button>
                              <button 
                                onClick={() => handleDeleteItem(mat._id, mat.name)} 
                                className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer" 
                                title="Delete Material"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ============================================================
              3. OTHER SIMPLE MASTER DATA TABS (Govt Materials, Divisions, etc.)
             ============================================================ */}
          {activeTab !== 'private-parties' && activeTab !== 'private-materials' && (
            <div>
              <h2 className="text-lg sm:text-xl font-bold capitalize text-slate-900 pb-3 mb-6 border-b border-slate-200">
                Manage {activeTab.replace('-', ' ')}
              </h2>

              <form onSubmit={handleAddOrUpdateItem} className="flex flex-col sm:flex-row gap-3 mb-6">
                <input 
                  type="text" 
                  className="flex-1 px-3.5 py-2 text-sm rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0059bb]/20 focus:border-[#0059bb] transition-all" 
                  placeholder={`Enter new ${activeTab === 'financial-years' ? 'Financial Year (e.g. 2026-27)' : activeTab.slice(0, -1)}`}
                  value={newItemName}
                  onChange={e => setNewItemName(e.target.value)}
                />
                <div className="flex gap-2">
                  <button 
                    type="submit" 
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0059bb] hover:bg-[#004899] text-white text-xs sm:text-sm font-semibold transition-colors cursor-pointer shadow-xs disabled:opacity-50" 
                    disabled={!newItemName.trim()}
                  >
                    {editingItem ? <><Save size={16} /> Update</> : <><Plus size={16} /> Add</>}
                  </button>
                  {editingItem && (
                    <button 
                      type="button" 
                      onClick={cancelEdit} 
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 text-xs sm:text-sm font-medium transition-colors cursor-pointer"
                    >
                      <X size={16} /> Cancel
                    </button>
                  )}
                </div>
              </form>

              <div className="overflow-x-auto w-full bg-white rounded-2xl border border-slate-200">
                <table className="w-full text-xs sm:text-sm text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/80">
                      <th className="px-4 py-3 font-semibold text-xs text-slate-500 uppercase tracking-wider">Name</th>
                      <th className="px-4 py-3 font-semibold text-xs text-slate-500 uppercase tracking-wider text-right w-28">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {getActiveList().length === 0 ? (
                      <tr>
                        <td colSpan="2" className="py-12 text-center text-slate-400">
                          No {activeTab} found. Add one above or auto-fill default data.
                        </td>
                      </tr>
                    ) : (
                      getActiveList().map(item => (
                        <tr key={item._id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-4 py-3 font-medium text-slate-800">{item.name || item.year}</td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex gap-1.5 justify-end">
                              <button 
                                onClick={() => handleEditItem(item)} 
                                className="p-1.5 text-[#0059bb] hover:bg-blue-50 rounded-lg transition-colors cursor-pointer" 
                                title="Edit"
                              >
                                <Edit size={16} />
                              </button>
                              <button 
                                onClick={() => handleDeleteItem(item._id, item.name || item.year)} 
                                className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer" 
                                title="Delete"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="mt-6 p-4 bg-amber-50 border-l-4 border-amber-400 rounded-xl text-xs sm:text-sm text-amber-800">
            <strong className="font-semibold">Note:</strong> Data saved here in Private Parties and Private Materials is instantly accessible in dropdowns across Private Invoices and Quotations.
          </div>
        </div>
      </div>

      {/* ============================================================
          VIEW PARTY DETAILS MODAL
         ============================================================ */}
      {viewingParty && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 bg-[#0059bb] text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 size={20} />
                <h3 className="font-bold text-base">Party Details Profile</h3>
              </div>
              <button 
                onClick={() => setViewingParty(null)}
                className="p-1 hover:bg-white/20 rounded-lg transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400">Trade / Company Name</span>
                <div className="text-base font-bold text-slate-900">{viewingParty.name}</div>
              </div>

              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                <div>
                  <span className="text-slate-500 block">GSTIN / UIN</span>
                  <span className="font-mono font-bold text-[#0059bb]">{viewingParty.gst || 'Not Provided'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">PAN</span>
                  <span className="font-mono font-bold text-slate-800">{viewingParty.pan || '—'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">State (Place of Supply)</span>
                  <span className="font-semibold text-slate-800">{viewingParty.state || 'Gujarat'} ({viewingParty.stateCode || '24'})</span>
                </div>
                <div>
                  <span className="text-slate-500 block">City / Pincode</span>
                  <span className="font-semibold text-slate-800">{[viewingParty.city, viewingParty.pincode].filter(Boolean).join(' - ') || '—'}</span>
                </div>
              </div>

              <div className="space-y-2 text-xs">
                <div>
                  <span className="text-slate-500 block">Contact Person</span>
                  <span className="font-semibold text-slate-800">{viewingParty.contactPerson || '—'}</span>
                </div>
                <div className="flex gap-4">
                  <div>
                    <span className="text-slate-500 block">Mobile Phone</span>
                    <span className="font-semibold text-slate-800">{viewingParty.phone || '—'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Email Address</span>
                    <span className="font-semibold text-slate-800">{viewingParty.email || '—'}</span>
                  </div>
                </div>
                <div>
                  <span className="text-slate-500 block">Registered Billing Address</span>
                  <p className="text-slate-800 whitespace-pre-line mt-0.5">{viewingParty.address || '—'}</p>
                </div>
                {viewingParty.shippingAddress && (
                  <div>
                    <span className="text-slate-500 block">Shipping / Delivery Address</span>
                    <p className="text-slate-800 whitespace-pre-line mt-0.5">{viewingParty.shippingAddress}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  const p = viewingParty;
                  setViewingParty(null);
                  handleEditItem(p);
                }}
                className="px-4 py-2 bg-[#0059bb] hover:bg-[#004c9e] text-white rounded-xl text-xs font-semibold cursor-pointer"
              >
                Edit Party Details
              </button>
              <button
                type="button"
                onClick={() => setViewingParty(null)}
                className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================
          VIEW RAW MATERIAL MODAL
         ============================================================ */}
      {viewingRawMaterial && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 bg-slate-900 text-white flex justify-between items-center">
              <div className="flex items-center gap-2.5">
                <span className="p-2 bg-blue-500/20 text-blue-400 rounded-xl">
                  <Wrench size={18} />
                </span>
                <div>
                  <h3 className="font-bold text-base">Raw Material Specifications</h3>
                  <p className="text-xs text-slate-400">Used strictly for Purchase Requisitions & Vendor RFQs</p>
                </div>
              </div>
              <button 
                onClick={() => setViewingRawMaterial(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400">Raw Material Name</span>
                <div className="text-lg font-bold text-slate-900">{viewingRawMaterial.name}</div>
              </div>

              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                <div>
                  <span className="text-slate-500 block">Category</span>
                  <span className="font-bold text-slate-800">{viewingRawMaterial.category}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Size / Dimension</span>
                  <span className="font-mono font-bold text-[#0059bb]">{viewingRawMaterial.size || '—'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Grade / Specification</span>
                  <span className="font-semibold text-slate-800">{viewingRawMaterial.grade || 'IS 2062'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Unit of Measurement</span>
                  <span className="font-semibold text-slate-800">{viewingRawMaterial.unit || 'KG'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">HSN Code</span>
                  <span className="font-mono font-bold text-slate-800">{viewingRawMaterial.hsn || '7216'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Applicable GST</span>
                  <span className="font-semibold text-slate-800">{viewingRawMaterial.gstRate || 18}%</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Ref / Last Purchase Rate</span>
                  <span className="font-bold text-emerald-600">
                    {viewingRawMaterial.defaultRate ? `₹${viewingRawMaterial.defaultRate.toLocaleString('en-IN')} / ${viewingRawMaterial.unit || 'KG'}` : 'Not set'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Status</span>
                  <span className={`inline-flex items-center gap-1 font-bold ${viewingRawMaterial.isActive !== false ? 'text-emerald-700' : 'text-slate-500'}`}>
                    {viewingRawMaterial.isActive !== false ? '● Active' : '○ Inactive'}
                  </span>
                </div>
              </div>

              {viewingRawMaterial.description && (
                <div className="text-xs">
                  <span className="text-slate-500 block font-semibold mb-1">Description / Notes</span>
                  <p className="text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-200">{viewingRawMaterial.description}</p>
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  const m = viewingRawMaterial;
                  setViewingRawMaterial(null);
                  handleEditItem(m);
                }}
                className="px-4 py-2 bg-[#0059bb] hover:bg-[#004c9e] text-white rounded-xl text-xs font-semibold cursor-pointer"
              >
                Edit Raw Material
              </button>
              <button
                type="button"
                onClick={() => setViewingRawMaterial(null)}
                className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
