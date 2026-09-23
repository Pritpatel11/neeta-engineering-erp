import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Save, Plus, Trash2, ArrowLeft, CheckCircle2, AlertCircle, 
  RefreshCw, X, ShieldCheck, Building2, Copy, Eye, Search, Package, ChevronDown 
} from 'lucide-react';
import toast from 'react-hot-toast';
import { 
  getNextPrivateInvoiceNo, createPrivateInvoice, updatePrivateInvoice, 
  getPrivateMaterials, getPrivateParties, getHsnCodes, verifyGstinApi 
} from '../services/api';

const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/i;

export default function CreatePrivateInvoice() {
  const navigate = useNavigate();
  const location = useLocation();
  const editData = location.state?.editData;

  const [isSaving, setIsSaving] = useState(false);
  const [materials, setMaterials] = useState([]);
  const [privateParties, setPrivateParties] = useState([]);
  const [hsnCodes, setHsnCodes] = useState([]);
  const [isPartyDropdownOpen, setIsPartyDropdownOpen] = useState(false);
  const [partySearch, setPartySearch] = useState('');
  const [activeDropdownId, setActiveDropdownId] = useState(null);

  const defaultTerms = "1. Payment: Full payment must be completed immediately upon delivery.\n2. Goods once sold will not be taken back or exchanged.\n3. Subject to Banaskantha/Palanpur jurisdiction.";

  const [formData, setFormData] = useState(() => {
    if (editData) {
      return {
        ...editData,
        items: (editData.items || []).map((item, idx) => ({
          ...item,
          id: item.id || item._id || Date.now() + idx
        }))
      };
    }
    return {
      invoiceNo: '',
      date: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0],
      poNumber: '',
      clientName: '',
      companyName: '',
      clientEmail: '',
      clientPhone: '',
      clientAddress: '',
      clientCity: '',
      clientDistrict: '',
      clientPincode: '',
      clientGST: '',
      pan: '',
      buyerState: 'Gujarat',
      buyerStateCode: '24',
      isInterState: false,
      documentType: 'TAX INVOICE',
      items: [
        { id: Date.now(), description: '', hsn: '', quantity: 1, unit: 'Nos', rate: 0, amount: 0 }
      ],
      taxPercentage: 18,
      notes: 'Thank you for your business!',
      terms: defaultTerms,
      bankDetails: {
        bankName: 'The Mehsana Urban Co-operative Bank Ltd.',
        accountNo: '00141101001022',
        ifsc: 'MSNU0000014',
        branch: 'Deesa Branch'
      },
      status: 'Draft'
    };
  });

  const [isVerifyingGst, setIsVerifyingGst] = useState(false);
  const [gstError, setGstError] = useState('');
  const [gstVerification, setGstVerification] = useState(null);

  useEffect(() => {
    const initData = async () => {
      try {
        if (!editData) {
          const { nextNo } = await getNextPrivateInvoiceNo();
          setFormData(prev => ({ ...prev, invoiceNo: nextNo }));
        }
      } catch (err) {
        console.error('Failed to fetch next invoice number:', err);
      }

      try {
        const mats = await getPrivateMaterials();
        setMaterials(mats || []);
      } catch (err) {
        console.warn('Could not load materials:', err);
      }

      try {
        const parties = await getPrivateParties();
        setPrivateParties(parties || []);
      } catch (err) {
        console.warn('Could not load parties:', err);
      }

      try {
        const hsns = await getHsnCodes();
        setHsnCodes(hsns || []);
      } catch (err) {
        console.warn('Could not load HSN codes:', err);
      }
    };

    initData();
  }, [editData]);

  // Recalculate totals whenever items or taxPercentage changes
  const subTotal = (formData.items || []).reduce((acc, item) => acc + (Number(item.amount) || 0), 0);
  const taxAmount = Number(((subTotal * (Number(formData.taxPercentage) || 0)) / 100).toFixed(2));
  const isInterState = formData.isInterState || (formData.clientGST && formData.clientGST.substring(0, 2) !== '24');
  const cgstAmount = isInterState ? 0 : Number((taxAmount / 2).toFixed(2));
  const sgstAmount = isInterState ? 0 : Number((taxAmount / 2).toFixed(2));
  const igstAmount = isInterState ? taxAmount : 0;
  const totalAmount = Number((subTotal + taxAmount).toFixed(2));

  const handleItemChange = (id, field, value) => {
    setFormData(prev => {
      const newItems = prev.items.map(item => {
        if (item.id !== id) return item;
        const updated = { ...item, [field]: value };
        if (field === 'quantity' || field === 'rate') {
          const qty = field === 'quantity' ? Number(value) : Number(item.quantity);
          const rate = field === 'rate' ? Number(value) : Number(item.rate);
          updated.amount = Number((qty * rate).toFixed(2));
        }
        return updated;
      });
      return { ...prev, items: newItems };
    });
  };

  // Material selection from dropdown or datalist
  const handleSelectMaterial = (itemId, mat) => {
    setFormData(prev => {
      const newItems = prev.items.map(item => {
        if (item.id !== itemId) return item;
        const rate = Number(mat.rate || 0);
        const qty = Number(item.quantity || 1);
        return {
          ...item,
          description: mat.name,
          hsn: mat.hsn || item.hsn || '',
          unit: mat.unit || item.unit || 'Nos',
          rate: rate > 0 ? rate : (item.rate || 0),
          amount: Number((qty * (rate > 0 ? rate : (item.rate || 0))).toFixed(2))
        };
      });
      return { ...prev, items: newItems };
    });
    setActiveDropdownId(null);
    toast.success(`Selected material: ${mat.name}`);
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [
        ...prev.items,
        { id: Date.now(), description: '', hsn: '', quantity: 1, unit: 'Nos', rate: 0, amount: 0 }
      ]
    }));
  };

  const removeItem = (id) => {
    if (formData.items.length <= 1) {
      toast.error('At least one item is required in the invoice');
      return;
    }
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter(item => item.id !== id)
    }));
  };

  const duplicateItem = (id) => {
    const itemToDup = formData.items.find(i => i.id === id);
    if (!itemToDup) return;
    setFormData(prev => ({
      ...prev,
      items: [
        ...prev.items,
        { ...itemToDup, id: Date.now() }
      ]
    }));
  };

  // Client party auto-fill
  const selectParty = (party) => {
    const gst = party.gst ? party.gst.trim().toUpperCase() : '';
    const stateCode = party.stateCode || (gst.length >= 2 ? gst.substring(0, 2) : '24');
    const isInter = stateCode !== '24';
    const pan = party.pan || (gst.length >= 12 ? gst.substring(2, 12) : '');

    setFormData(prev => ({
      ...prev,
      clientName: party.name,
      companyName: party.name,
      clientPhone: party.phone || prev.clientPhone,
      clientEmail: party.email || prev.clientEmail,
      clientAddress: party.address || prev.clientAddress,
      clientCity: party.city || prev.clientCity,
      clientDistrict: party.district || prev.clientDistrict,
      clientPincode: party.pincode || prev.clientPincode,
      clientGST: gst,
      pan: pan,
      buyerState: party.state || (isInter ? 'Other State' : 'Gujarat'),
      buyerStateCode: stateCode,
      isInterState: isInter
    }));

    if (gst) {
      setGstVerification({
        source: 'database',
        isExistingParty: true,
        tradeName: party.name,
        legalName: party.name,
        status: 'Saved Customer',
        stateName: party.state || (isInter ? 'Other State' : 'Gujarat'),
        stateCode: stateCode,
        pincode: party.pincode,
        city: party.city,
        district: party.district,
        phone: party.phone,
        email: party.email,
        contactPerson: party.contactPerson,
        hasContactInfo: Boolean(party.phone || party.email),
        contactSource: 'database_match'
      });
      setGstError('');
    }

    setIsPartyDropdownOpen(false);
    toast.success(`Selected Party: ${party.name}`);
  };

  // GSTIN live verification (Calls Sandbox API and auto-fills all details)
  const handleVerifyGstin = async () => {
    const gstin = (formData.clientGST || '').trim().toUpperCase();
    if (!gstin) {
      setGstError('Enter a GSTIN to verify');
      toast.error('Please enter a GSTIN to verify');
      return;
    }
    if (!GSTIN_REGEX.test(gstin)) {
      setGstError('Invalid GSTIN format (15 characters alphanumeric e.g. 24ABHPP5386L1Z3)');
      toast.error('Invalid GSTIN format. Expected 15 characters.');
      return;
    }

    try {
      setIsVerifyingGst(true);
      setGstError('');
      const res = await verifyGstinApi(gstin);

      // Support response format: res.data contains the verified details
      const vData = res.data || res;

      if (vData && (vData.tradeName || vData.legalName)) {
        const stateCode = vData.stateCode || (gstin.length >= 2 ? gstin.substring(0, 2) : '24');
        const isInter = typeof vData.isInterState === 'boolean' ? vData.isInterState : (stateCode !== '24');
        const panFromGst = vData.pan || (gstin.length >= 12 ? gstin.substring(2, 12) : '');

        // Auto-populate all form fields from Sandbox API
        setFormData(prev => ({
          ...prev,
          clientName: vData.tradeName || vData.legalName,
          companyName: vData.legalName || vData.tradeName,
          clientAddress: vData.address || prev.clientAddress,
          clientCity: vData.city || prev.clientCity,
          clientDistrict: vData.district || prev.clientDistrict,
          clientPincode: vData.pincode || prev.clientPincode,
          clientPhone: vData.phone || prev.clientPhone,
          clientEmail: vData.email || prev.clientEmail,
          clientGST: vData.gstin || gstin,
          buyerState: vData.stateName || (stateCode === '24' ? 'Gujarat' : 'Other State'),
          buyerStateCode: stateCode,
          pan: panFromGst || prev.pan,
          isInterState: isInter
        }));

        setGstVerification({
          source: res.source || 'sandbox',
          isExistingParty: res.isExistingParty,
          ...vData
        });

        toast.success(`GSTIN Verified: ${vData.tradeName || vData.legalName}`);
      } else {
        const errMessage = res.message || 'No registered business records found for this GSTIN.';
        setGstError(errMessage);
        toast.error(errMessage);
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'GST verification failed. Please try again.';
      setGstError(msg);
      toast.error(msg);
    } finally {
      setIsVerifyingGst(false);
    }
  };

  // Save invoice handler
  const handleSave = async (andView = false) => {
    if (!formData.clientName?.trim()) {
      toast.error('Client name is required');
      return;
    }
    if (!formData.invoiceNo?.trim()) {
      toast.error('Invoice number is required');
      return;
    }
    if (formData.items.some(i => !i.description?.trim())) {
      toast.error('All items must have a description');
      return;
    }

    try {
      setIsSaving(true);
      const payload = {
        ...formData,
        subTotal,
        taxAmount,
        cgstAmount,
        sgstAmount,
        igstAmount,
        totalAmount,
        isInterState
      };

      let result;
      if (editData?._id) {
        result = await updatePrivateInvoice(editData._id, payload);
        toast.success('Private invoice updated successfully!');
      } else {
        result = await createPrivateInvoice(payload);
        toast.success('Private invoice created successfully!');
      }

      if (andView && result?._id) {
        navigate(`/private-invoice?id=${result._id}`, { state: { invoiceData: result } });
      } else {
        navigate('/private-invoices');
      }
    } catch (err) {
      console.error('Failed to save private invoice:', err);
      toast.error('Failed to save invoice: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsSaving(false);
    }
  };

  // Matching parties for autocomplete dropdown
  const matchingParties = privateParties.filter(p => {
    if (!formData.clientName) return true;
    const q = formData.clientName.toLowerCase();
    return (
      (p.name || '').toLowerCase().includes(q) ||
      (p.gst || '').toLowerCase().includes(q) ||
      (p.phone || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <button 
            type="button" 
            onClick={() => navigate('/private-invoices')}
            className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer text-slate-600"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
              {editData ? 'Edit Private Invoice' : 'Create Private Invoice'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Select saved clients & materials from Master Data or verify GSTIN to auto-fill details instantly
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => handleSave(false)}
            disabled={isSaving}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs sm:text-sm rounded-xl transition-all cursor-pointer disabled:opacity-50"
          >
            <Save size={16} /> Save
          </button>
          <button
            type="button"
            onClick={() => handleSave(true)}
            disabled={isSaving}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#0059bb] hover:bg-[#004c9e] text-white font-semibold text-xs sm:text-sm rounded-xl shadow-sm transition-all cursor-pointer disabled:opacity-50"
          >
            <Eye size={16} /> Save & View
          </button>
        </div>
      </div>

      {/* Form Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Client & Line Items */}
        <div className="lg:col-span-2 space-y-6">
          {/* Client Details Section */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 flex-wrap gap-2">
              <h2 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                <Building2 size={16} className="text-[#0059bb]" /> Client (Bill To) Information
              </h2>
              
              {/* Quick Select Saved Party Dropdown */}
              {privateParties.length > 0 && (
                <div className="flex items-center gap-2">
                  <select
                    onChange={(e) => {
                      const p = privateParties.find(item => item._id === e.target.value || item.name === e.target.value);
                      if (p) selectParty(p);
                    }}
                    value={privateParties.find(p => p.name === formData.clientName)?._id || ''}
                    className="text-xs font-semibold px-3 py-1.5 rounded-xl border border-[#0059bb]/30 bg-blue-50 text-[#0059bb] hover:bg-blue-100 cursor-pointer focus:outline-none"
                  >
                    <option value="">▼ Quick Pick Saved Party ({privateParties.length})</option>
                    {privateParties.map(p => (
                      <option key={p._id || p.name} value={p._id || p.name}>
                        {p.name} {p.gst ? `[${p.gst}]` : ''} {p.city ? `(${p.city})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Client / Trade Name with Attached Dropdown Autocomplete */}
              <div className="relative">
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex justify-between items-center">
                  <span>Client / Trade Name <span className="text-rose-500">*</span></span>
                  <span className="text-[10px] text-slate-400 font-normal">Type to search saved parties</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="Type client name or click to search..."
                    value={formData.clientName}
                    onChange={(e) => {
                      setFormData({ ...formData, clientName: e.target.value });
                      setIsPartyDropdownOpen(true);
                    }}
                    onFocus={() => setIsPartyDropdownOpen(true)}
                    onBlur={() => setTimeout(() => setIsPartyDropdownOpen(false), 250)}
                    autoComplete="off"
                    className="w-full px-3 py-2 pr-8 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0059bb]/20 focus:border-[#0059bb]"
                  />
                  <ChevronDown size={16} className="absolute right-2.5 top-2.5 text-slate-400 pointer-events-none" />
                </div>

                {/* Autocomplete Party Dropdown */}
                {isPartyDropdownOpen && privateParties.length > 0 && (
                  <div className="absolute left-0 right-0 mt-1 bg-white border border-slate-300 rounded-xl shadow-2xl z-50 max-h-60 overflow-y-auto p-1 animate-in fade-in duration-100">
                    <div className="px-2 py-1 text-[10px] font-bold uppercase text-slate-400 bg-slate-50 rounded mb-1 flex justify-between items-center">
                      <span>Saved Parties ({matchingParties.length})</span>
                      <span className="text-[9px]">Click to auto-fill</span>
                    </div>
                    {matchingParties.slice(0, 10).map((party) => (
                      <div
                        key={party._id || party.name}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          selectParty(party);
                        }}
                        className="p-2.5 hover:bg-blue-50 text-xs cursor-pointer rounded-lg border-b border-slate-100 last:border-b-0 transition-colors"
                      >
                        <div className="font-bold text-slate-900">{party.name}</div>
                        <div className="text-[11px] text-slate-500 flex flex-wrap gap-2 mt-0.5">
                          {party.gst && <span className="font-mono text-[#0059bb] font-semibold">GST: {party.gst}</span>}
                          {party.phone && <span>📞 {party.phone}</span>}
                          {party.state && <span>📍 {party.state}</span>}
                        </div>
                        {party.address && (
                          <div className="text-[10px] text-slate-400 truncate mt-0.5">{party.address}</div>
                        )}
                      </div>
                    ))}
                    {matchingParties.length === 0 && (
                      <div className="p-3 text-center text-xs text-slate-400 italic">
                        No saved parties match "{formData.clientName}". Continue typing custom name.
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* GSTIN with Sandbox Verification Button */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  GSTIN / UIN
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. 24ALKPP4729L1ZM"
                    value={formData.clientGST}
                    onChange={(e) => setFormData({ ...formData, clientGST: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 uppercase font-mono focus:outline-none focus:ring-2 focus:ring-[#0059bb]/20 focus:border-[#0059bb]"
                  />
                  <button
                    type="button"
                    onClick={handleVerifyGstin}
                    disabled={isVerifyingGst}
                    className="px-3.5 py-2 bg-[#0059bb] hover:bg-[#004c9e] text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shrink-0 disabled:opacity-50 flex items-center gap-1.5 shadow-xs"
                    title="Verify GSTIN with Sandbox API & Auto-Fill Details"
                  >
                    {isVerifyingGst ? <RefreshCw size={14} className="animate-spin" /> : <ShieldCheck size={14} />}
                    <span>Verify</span>
                  </button>
                </div>
                {gstError && <p className="text-xs text-rose-500 mt-1">{gstError}</p>}
              </div>

              {/* Rich GST Verification Details Card */}
              {gstVerification && (
                <div className="sm:col-span-2 p-3 sm:p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-2xl animate-in fade-in duration-150 shadow-xs">
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
                      {formData.isInterState ? 'Inter-State (IGST)' : 'Intra-State (CGST + SGST)'}
                    </span>
                  </div>

                  <div className="mt-2.5 text-xs text-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5">
                    <div><strong>Legal Entity:</strong> {gstVerification.legalName || gstVerification.tradeName || '—'}</div>
                    <div><strong>Trade Name:</strong> {gstVerification.tradeName || gstVerification.legalName || '—'}</div>
                    <div><strong>State:</strong> {gstVerification.stateName || formData.buyerState || 'Gujarat'} ({gstVerification.stateCode || formData.buyerStateCode || '24'})</div>
                    <div><strong>Status:</strong> <span className="text-emerald-600 font-semibold">{gstVerification.status || 'Active'}</span></div>
                    {gstVerification.constitution && <div><strong>Constitution:</strong> {gstVerification.constitution}</div>}
                    {(gstVerification.pincode || formData.clientPincode) && (
                      <div><strong>Pincode:</strong> {gstVerification.pincode || formData.clientPincode}</div>
                    )}
                    {(gstVerification.city || gstVerification.district || formData.clientCity) && (
                      <div><strong>City / District:</strong> {[gstVerification.city || formData.clientCity, gstVerification.district || formData.clientDistrict].filter(Boolean).filter((v, i, a) => a.indexOf(v) === i).join(', ')}</div>
                    )}
                  </div>

                  {/* Contact Information Status Banner */}
                  <div className="mt-2.5 pt-2.5 border-t border-emerald-200 text-xs">
                    {(gstVerification.hasContactInfo || gstVerification.phone || gstVerification.email || formData.clientPhone || formData.clientEmail) ? (
                      <div className="flex items-center justify-between flex-wrap gap-2 bg-emerald-100/60 p-2.5 rounded-xl border border-emerald-300">
                        <div className="flex items-center gap-3.5 flex-wrap text-emerald-950">
                          {(gstVerification.phone || formData.clientPhone) && (
                            <span>📞 <strong>Phone:</strong> {gstVerification.phone || formData.clientPhone}</span>
                          )}
                          {(gstVerification.email || formData.clientEmail) && (
                            <span>✉️ <strong>Email:</strong> {gstVerification.email || formData.clientEmail}</span>
                          )}
                          {gstVerification.contactPerson && (
                            <span>👤 <strong>Contact:</strong> {gstVerification.contactPerson}</span>
                          )}
                        </div>
                        <span className="text-[10px] bg-emerald-200 text-emerald-900 px-1.5 py-0.5 rounded font-semibold">
                          ✓ Contact {gstVerification.contactSource === 'database_match' ? 'Matched from Master' : 'Auto-populated'}
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

              {/* Billing Address */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Billing Address
                </label>
                <textarea
                  rows={2}
                  placeholder="Plot/Street, Industrial Area, City, State, PIN"
                  value={formData.clientAddress}
                  onChange={(e) => setFormData({ ...formData, clientAddress: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0059bb]/20 focus:border-[#0059bb]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Contact Phone</label>
                <input
                  type="text"
                  placeholder="+91 98765 43210"
                  value={formData.clientPhone}
                  onChange={(e) => setFormData({ ...formData, clientPhone: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0059bb]/20 focus:border-[#0059bb]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  placeholder="client@example.com"
                  value={formData.clientEmail}
                  onChange={(e) => setFormData({ ...formData, clientEmail: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0059bb]/20 focus:border-[#0059bb]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">PAN Number</label>
                <input
                  type="text"
                  placeholder="ABCDE1234F"
                  value={formData.pan || ''}
                  onChange={(e) => setFormData({ ...formData, pan: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 uppercase font-mono focus:outline-none focus:ring-2 focus:ring-[#0059bb]/20 focus:border-[#0059bb]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">State & State Code</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Gujarat"
                    value={formData.buyerState}
                    onChange={(e) => setFormData({ ...formData, buyerState: e.target.value })}
                    className="w-2/3 px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0059bb]/20 focus:border-[#0059bb]"
                  />
                  <input
                    type="text"
                    placeholder="24"
                    value={formData.buyerStateCode}
                    onChange={(e) => setFormData({ ...formData, buyerStateCode: e.target.value })}
                    className="w-1/3 px-3 py-2 text-sm rounded-xl border border-slate-300 text-center font-mono focus:outline-none focus:ring-2 focus:ring-[#0059bb]/20 focus:border-[#0059bb]"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-6 sm:col-span-2">
                <input
                  type="checkbox"
                  id="isInterState"
                  checked={isInterState}
                  onChange={(e) => setFormData({ ...formData, isInterState: e.target.checked })}
                  className="w-4 h-4 text-[#0059bb] rounded border-slate-300 focus:ring-[#0059bb]"
                />
                <label htmlFor="isInterState" className="text-xs font-semibold text-slate-700 cursor-pointer">
                  Inter-State Supply (Apply IGST instead of CGST + SGST)
                </label>
              </div>
            </div>
          </div>

          {/* Line Items Section */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 flex-wrap gap-2">
              <div>
                <h2 className="font-bold text-sm text-slate-800">Goods & Service Line Items</h2>
                <p className="text-[11px] text-slate-400">Pick from saved materials dropdown to auto-populate description, HSN, unit, and default rate</p>
              </div>
              <button
                type="button"
                onClick={addItem}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-[#0059bb] hover:bg-blue-100 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                <Plus size={14} /> Add Row
              </button>
            </div>

            <div className="overflow-x-visible pb-12">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                    <th className="p-2 w-8 text-center">#</th>
                    <th className="p-2 min-w-[260px]">Description / Material</th>
                    <th className="p-2 w-24">HSN/SAC</th>
                    <th className="p-2 w-20 text-right">Qty</th>
                    <th className="p-2 w-20 text-center">Unit</th>
                    <th className="p-2 w-24 text-right">Rate (₹)</th>
                    <th className="p-2 w-28 text-right">Amount (₹)</th>
                    <th className="p-2 w-16 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {formData.items.map((item, idx) => (
                    <tr key={item.id} className="hover:bg-slate-50/50">
                      <td className="p-2 text-center text-slate-400">{idx + 1}</td>
                      <td className="p-2 relative">
                        {/* Material Selector Dropdown */}
                        {materials.length > 0 && (
                          <select
                            onChange={(e) => {
                              const mat = materials.find(m => (m._id === e.target.value || m.name === e.target.value));
                              if (mat) handleSelectMaterial(item.id, mat);
                            }}
                            value=""
                            className="w-full mb-1 text-[11px] font-semibold text-[#0059bb] bg-blue-50/80 border border-blue-200 rounded-lg px-2 py-1 cursor-pointer hover:bg-blue-100 focus:outline-none"
                          >
                            <option value="">▼ Pick from Saved Materials ({materials.length})</option>
                            {materials.map(m => (
                              <option key={m._id || m.name} value={m._id || m.name}>
                                {m.name} {m.rate > 0 ? `— ₹${m.rate}` : ''} {m.unit ? `(${m.unit})` : ''} {m.hsn ? `[HSN: ${m.hsn}]` : ''}
                              </option>
                            ))}
                          </select>
                        )}

                        {/* Editable Description Input with Dropdown Autocomplete */}
                        <div className="relative">
                          <input
                            type="text"
                            required
                            placeholder="Type or pick material..."
                            value={item.description}
                            onChange={(e) => {
                              handleItemChange(item.id, 'description', e.target.value);
                              setActiveDropdownId(item.id);
                            }}
                            onFocus={() => setActiveDropdownId(item.id)}
                            onBlur={() => setTimeout(() => setActiveDropdownId(null), 250)}
                            className="w-full px-2 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-[#0059bb]"
                          />
                        </div>

                        {/* Autocomplete Popup */}
                        {activeDropdownId === item.id && materials.length > 0 && (
                          <div className="absolute left-2 right-2 mt-1 bg-white border border-slate-300 rounded-xl shadow-2xl z-50 max-h-52 overflow-y-auto p-1 animate-in fade-in duration-100">
                            <div className="px-2 py-1 text-[10px] font-bold uppercase text-slate-400 bg-slate-50 rounded">
                              Matching Materials
                            </div>
                            {materials
                              .filter(m => !item.description || (m.name || '').toLowerCase().includes(item.description.toLowerCase()) || (m.code || '').toLowerCase().includes(item.description.toLowerCase()))
                              .slice(0, 10)
                              .map((m, mIdx) => (
                                <div
                                  key={m._id || mIdx}
                                  onMouseDown={(e) => {
                                    e.preventDefault();
                                    handleSelectMaterial(item.id, m);
                                  }}
                                  className="p-2 hover:bg-blue-50 text-xs cursor-pointer rounded-lg border-b border-slate-100 last:border-b-0 transition-colors"
                                >
                                  <div className="flex justify-between items-center">
                                    <span className="font-bold text-slate-900">{m.name}</span>
                                    {m.rate > 0 && (
                                      <span className="font-mono text-[#0059bb] font-bold">₹{m.rate}</span>
                                    )}
                                  </div>
                                  <div className="text-[10px] text-slate-500 flex gap-2 mt-0.5">
                                    {m.code && <span>SKU: {m.code}</span>}
                                    {m.hsn && <span>HSN: {m.hsn}</span>}
                                    <span>Unit: {m.unit || 'Nos'}</span>
                                    {m.gstRate !== undefined && <span>GST: {m.gstRate}%</span>}
                                  </div>
                                </div>
                              ))}
                          </div>
                        )}
                      </td>

                      <td className="p-2">
                        <input
                          type="text"
                          placeholder="HSN"
                          value={item.hsn}
                          onChange={(e) => handleItemChange(item.id, 'hsn', e.target.value)}
                          className="w-full px-2 py-1.5 text-xs rounded-lg border border-slate-300 text-center font-mono focus:outline-none focus:ring-1 focus:ring-[#0059bb]"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          min="0"
                          step="any"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(item.id, 'quantity', e.target.value)}
                          className="w-full px-2 py-1.5 text-xs rounded-lg border border-slate-300 text-right font-mono focus:outline-none focus:ring-1 focus:ring-[#0059bb]"
                        />
                      </td>
                      <td className="p-2">
                        <select
                          value={item.unit}
                          onChange={(e) => handleItemChange(item.id, 'unit', e.target.value)}
                          className="w-full px-1.5 py-1.5 text-xs rounded-lg border border-slate-300 text-center focus:outline-none focus:ring-1 focus:ring-[#0059bb]"
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
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          min="0"
                          step="any"
                          value={item.rate}
                          onChange={(e) => handleItemChange(item.id, 'rate', e.target.value)}
                          className="w-full px-2 py-1.5 text-xs rounded-lg border border-slate-300 text-right font-mono focus:outline-none focus:ring-1 focus:ring-[#0059bb]"
                        />
                      </td>
                      <td className="p-2 text-right font-bold font-mono">
                        {Number(item.amount || 0).toFixed(2)}
                      </td>
                      <td className="p-2 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => duplicateItem(item.id)}
                            title="Duplicate"
                            className="p-1 text-slate-400 hover:text-slate-600 rounded cursor-pointer"
                          >
                            <Copy size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => removeItem(item.id)}
                            title="Remove"
                            className="p-1 text-rose-400 hover:text-rose-600 rounded cursor-pointer"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Terms & Conditions */}
            <div className="pt-3 border-t border-slate-100">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Terms & Conditions
              </label>
              <textarea
                rows={3}
                value={formData.terms}
                onChange={(e) => setFormData({ ...formData, terms: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0059bb]/20 focus:border-[#0059bb]"
              />
            </div>
          </div>
        </div>

        {/* Right 1 Col: Invoice Settings & Billing Summary */}
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h2 className="font-bold text-sm text-slate-800 border-b border-slate-100 pb-3">
              Invoice Settings
            </h2>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Document Title
              </label>
              <select
                value={formData.documentType}
                onChange={(e) => setFormData({ ...formData, documentType: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-1 focus:ring-[#0059bb]"
              >
                <option value="TAX INVOICE">TAX INVOICE</option>
                <option value="PROFORMA INVOICE">PROFORMA INVOICE</option>
                <option value="COMMERCIAL INVOICE">COMMERCIAL INVOICE</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Invoice Number <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.invoiceNo}
                onChange={(e) => setFormData({ ...formData, invoiceNo: e.target.value })}
                className="w-full px-3 py-2 text-sm font-semibold rounded-xl border border-slate-300 focus:outline-none focus:ring-1 focus:ring-[#0059bb]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Invoice Date
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-2.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-1 focus:ring-[#0059bb]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Due Date
                </label>
                <input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  className="w-full px-2.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-1 focus:ring-[#0059bb]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                PO / Buyer's Ref No.
              </label>
              <input
                type="text"
                placeholder="e.g. PO-88992"
                value={formData.poNumber}
                onChange={(e) => setFormData({ ...formData, poNumber: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-1 focus:ring-[#0059bb]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                GST / Tax Percentage
              </label>
              <select
                value={formData.taxPercentage}
                onChange={(e) => setFormData({ ...formData, taxPercentage: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 focus:outline-none focus:ring-1 focus:ring-[#0059bb]"
              >
                <option value="0">0% (Nil / Exempted)</option>
                <option value="5">5% GST</option>
                <option value="12">12% GST</option>
                <option value="18">18% GST (Standard)</option>
                <option value="28">28% GST</option>
              </select>
            </div>
          </div>

          {/* Amount Calculation Summary */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <h2 className="font-bold text-sm text-slate-800 border-b border-slate-100 pb-3">
              Payment Summary
            </h2>

            <div className="flex justify-between text-xs text-slate-600">
              <span>Sub-Total:</span>
              <span className="font-mono font-semibold">₹{subTotal.toFixed(2)}</span>
            </div>

            {Number(formData.taxPercentage) > 0 && (
              <>
                {isInterState ? (
                  <div className="flex justify-between text-xs text-sky-700">
                    <span>IGST ({formData.taxPercentage}%):</span>
                    <span className="font-mono font-semibold">₹{igstAmount.toFixed(2)}</span>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between text-xs text-slate-600">
                      <span>CGST ({formData.taxPercentage / 2}%):</span>
                      <span className="font-mono font-semibold">₹{cgstAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-xs text-slate-600">
                      <span>SGST ({formData.taxPercentage / 2}%):</span>
                      <span className="font-mono font-semibold">₹{sgstAmount.toFixed(2)}</span>
                    </div>
                  </>
                )}
              </>
            )}

            <div className="pt-3 border-t border-slate-200 flex justify-between items-baseline">
              <span className="font-bold text-sm text-slate-900">Total Payable:</span>
              <span className="font-bold text-lg text-[#0059bb] font-mono">₹{totalAmount.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
