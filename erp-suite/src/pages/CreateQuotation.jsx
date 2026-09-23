import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Save, Plus, Trash2, ArrowLeft, CheckCircle2, AlertCircle, RefreshCw, X, ShieldCheck, Building2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatIndianNumber } from '../utils/numberFormat';
import { getNextQuotationNo, createQuotation, updateQuotation, getPrivateMaterials, getPrivateParties, getHsnCodes, verifyGstinApi } from '../services/api';

const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/i;

export default function CreateQuotation() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isSaving, setIsSaving] = useState(false);
  const [materials, setMaterials] = useState([]);
  const [privateParties, setPrivateParties] = useState([]);
  const [hsnCodes, setHsnCodes] = useState([]);
  const [isPartyDropdownOpen, setIsPartyDropdownOpen] = useState(false);
  const [activeDropdownId, setActiveDropdownId] = useState(null);
  
  const editData = location.state?.editData;
  const enquiryData = location.state?.enquiryData;
  const defaultTerms = "1. Payment: Full payment must be completed immediately upon delivery.\n2. Taxes: As applicable and mentioned in the estimate.\n3. This Proforma Invoice is issued for estimation purposes only and is valid for 15 (Fifteen) days from the date of issue.";

  const [formData, setFormData] = useState(() => {
    if (editData) {
      return {
        ...editData,
        items: (editData.items || []).map((item, index) => ({
          ...item,
          id: item.id || item._id || Date.now() + index
        }))
      };
    }
    return {
      quotationNo: '',
      date: new Date().toISOString().split('T')[0],
      clientName: enquiryData?.name || '',
      companyName: '',
      clientEmail: enquiryData?.email || '',
      clientPhone: enquiryData?.phone || '',
      clientAddress: '',
      clientCity: '',
      clientDistrict: '',
      clientPincode: '',
      clientGST: '',
      documentType: 'Proforma Invoice',
      subject: enquiryData?.subject ? `Quotation for: ${enquiryData.subject}` : '',
      items: [{ id: Date.now(), description: '', hsn: '', quantity: 1, unit: 'Nos', rate: 0, amount: 0 }],
      taxPercentage: 18,
      terms: defaultTerms,
      status: 'Draft',
      isInterState: editData?.isInterState || false,
      buyerState: editData?.buyerState || '',
      buyerStateCode: editData?.buyerStateCode || ''
    };
  });

  const [isVerifyingGst, setIsVerifyingGst] = useState(false);
  const [gstVerification, setGstVerification] = useState(() => {
    if (editData?.clientGST) {
      return {
        gstin: editData.clientGST,
        tradeName: editData.clientName,
        legalName: editData.companyName || editData.clientName,
        stateName: editData.buyerState || '',
        stateCode: editData.buyerStateCode || (editData.clientGST.length >= 2 ? editData.clientGST.substring(0, 2) : ''),
        isInterState: editData.isInterState || (editData.clientGST.substring(0, 2) !== '24'),
        phone: editData.clientPhone || '',
        email: editData.clientEmail || '',
        address: editData.clientAddress || '',
        city: editData.clientCity || '',
        district: editData.clientDistrict || '',
        pincode: editData.clientPincode || '',
        hasContactInfo: Boolean(editData.clientPhone || editData.clientEmail),
        status: 'Saved in Record'
      };
    }
    return null;
  });
  const [gstError, setGstError] = useState('');

  useEffect(() => {
    const fetchNextNoAndMaterials = async () => {
      try {
        if (!editData) {
          const { nextNo } = await getNextQuotationNo();
          setFormData(prev => ({ ...prev, quotationNo: nextNo }));
        }
        
        const mats = await getPrivateMaterials();
        setMaterials(mats || []);
      } catch (err) {
        console.error("Failed to fetch next quo no or materials", err);
      }
      
      try {
        const parties = await getPrivateParties();
        setPrivateParties(parties);
      } catch (err) {
        console.error("Failed to fetch private parties", err);
      }
      
      try {
        const hsnList = await getHsnCodes();
        setHsnCodes(hsnList);
      } catch (err) {
        console.error("Failed to fetch HSN codes", err);
      }
    };
    fetchNextNoAndMaterials();
  }, [editData]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      let updatedData = { ...prev, [name]: value };
      
      if (name === 'documentType' && updatedData.terms) {
        const regex = /This (Proforma Invoice|Quotation|Estimate) is issued for (estimation|quotation) purposes only and is valid for 15 \(Fifteen\) days from the date of issue\./g;
        const purpose = value === 'Quotation' ? 'quotation' : 'estimation';
        const replaceStr = `This ${value} is issued for ${purpose} purposes only and is valid for 15 (Fifteen) days from the date of issue.`;
        updatedData.terms = updatedData.terms.replace(regex, replaceStr);
      }
      
      return updatedData;
    });
  };

  const handlePartySelect = (party) => {
    const gstin = party.gst ? party.gst.trim().toUpperCase() : '';
    const stateCode = party.stateCode || (gstin.length >= 2 ? gstin.substring(0, 2) : '');
    const isInterState = stateCode ? stateCode !== '24' : (gstin.length >= 2 && gstin.substring(0, 2) !== '24');
    const pan = party.pan || (gstin.length >= 12 ? gstin.substring(2, 12) : '');
    const buyerState = party.state || (isInterState ? 'Other State' : 'Gujarat');

    setFormData(prev => ({
      ...prev,
      clientName: party.name,
      companyName: party.name,
      clientPhone: party.phone || prev.clientPhone,
      clientEmail: party.email || prev.clientEmail,
      clientAddress: party.address || prev.clientAddress,
      clientCity: party.city || prev.clientCity,
      clientPincode: party.pincode || prev.clientPincode,
      clientGST: gstin || prev.clientGST,
      pan: pan || prev.pan,
      buyerState: buyerState,
      isInterState: !!isInterState,
      buyerStateCode: stateCode || prev.buyerStateCode,
    }));

    if (gstin) {
      setGstVerification({
        source: 'database',
        isExistingParty: true,
        tradeName: party.name,
        legalName: party.name,
        gstin: gstin,
        address: party.address,
        phone: party.phone || '',
        email: party.email || '',
        hasContactInfo: Boolean(party.phone || party.email),
        contactSource: 'customer_master',
        stateCode,
        isInterState,
        status: 'Active (Saved Customer)'
      });
      setGstError('');
    }

    setIsPartyDropdownOpen(false);
  };

  const handleVerifyGstin = async () => {
    const gstin = (formData.clientGST || '').trim().toUpperCase();
    if (!gstin) {
      setGstError('Please enter a GSTIN to verify.');
      toast.error('Please enter a GSTIN.');
      return;
    }

    if (!GSTIN_REGEX.test(gstin)) {
      setGstError('Invalid GSTIN format. Expected 15-character alphanumeric (e.g. 24ABHPP5386L1Z3).');
      toast.error('Invalid GSTIN format. Expected 15 characters.');
      return;
    }

    setGstError('');
    setIsVerifyingGst(true);

    try {
      const res = await verifyGstinApi(gstin);
      if (res.success && res.data) {
        const vData = res.data;
        setGstVerification({
          source: res.source,
          isExistingParty: res.isExistingParty,
          ...vData
        });

        // Auto-populate form fields - NEVER overwrite user-entered contact info if API returns empty
        setFormData(prev => ({
          ...prev,
          clientGST: vData.gstin || gstin,
          clientName: vData.tradeName || vData.legalName || prev.clientName,
          companyName: vData.legalName || vData.tradeName || prev.companyName,
          clientAddress: vData.address || prev.clientAddress,
          clientPhone: vData.phone || prev.clientPhone || '',
          clientEmail: vData.email || prev.clientEmail || '',
          clientCity: vData.city || prev.clientCity || '',
          clientDistrict: vData.district || prev.clientDistrict || '',
          clientPincode: vData.pincode || prev.clientPincode || '',
          isInterState: typeof vData.isInterState === 'boolean' ? vData.isInterState : (vData.stateCode !== '24'),
          buyerState: vData.stateName || prev.buyerState,
          buyerStateCode: vData.stateCode || prev.buyerStateCode,
        }));

        if (res.isExistingParty) {
          toast.success(`Existing Customer Found: ${vData.tradeName || vData.legalName}`);
        } else if (vData.hasContactInfo) {
          toast.success(`GSTIN Verified: ${vData.tradeName || vData.legalName} (Contact info auto-populated)`);
        } else {
          toast.success(`GSTIN Verified: ${vData.tradeName || vData.legalName || 'Active'}`);
        }
      } else {
        setGstError(res.message || 'Verification failed.');
        toast.error(res.message || 'GSTIN verification failed.');
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'GST verification failed. Please try again.';
      setGstError(msg);
      toast.error(msg);
    } finally {
      setIsVerifyingGst(false);
    }
  };

  const handleClearGst = () => {
    setFormData(prev => ({
      ...prev,
      clientGST: '',
      isInterState: false,
      buyerState: '',
      buyerStateCode: ''
    }));
    setGstVerification(null);
    setGstError('');
  };

  const handleItemChange = (id, field, value) => {
    setFormData(prev => {
      const newItems = prev.items.map(item => {
        if (item.id === id) {
          const updatedItem = { ...item, [field]: value };
          if (field === 'description' && value.toUpperCase().includes('STAY CLAMP')) {
            updatedItem.unit = 'Pair';
          }
          if (field === 'quantity' || field === 'rate') {
            updatedItem.amount = Number(updatedItem.quantity || 0) * Number(updatedItem.rate || 0);
          }
          return updatedItem;
        }
        return item;
      });
      return { ...prev, items: newItems };
    });
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { id: Date.now(), description: '', hsn: '', quantity: 1, unit: 'Nos', rate: 0, amount: 0 }]
    }));
  };

  const removeItem = (id) => {
    if (formData.items.length > 1) {
      setFormData(prev => ({
        ...prev,
        items: prev.items.filter(item => item.id !== id)
      }));
    }
  };

  const calculateTotals = () => {
    const subTotal = formData.items.reduce((sum, item) => sum + (item.amount || 0), 0);
    const taxRate = Number(formData.taxPercentage) || 0;
    const taxAmount = (subTotal * taxRate) / 100;
    const totalAmount = subTotal + taxAmount;

    // Determine whether Intra-state (Gujarat - 24) or Inter-state (outside Gujarat)
    const gstinState = formData.clientGST && formData.clientGST.length >= 2 ? formData.clientGST.substring(0, 2) : '';
    const isInterState = typeof formData.isInterState === 'boolean' 
      ? formData.isInterState 
      : (gstinState && gstinState !== '24');

    const igstAmount = isInterState ? taxAmount : 0;
    const cgstAmount = isInterState ? 0 : taxAmount / 2;
    const sgstAmount = isInterState ? 0 : taxAmount / 2;

    return { subTotal, taxAmount, totalAmount, cgstAmount, sgstAmount, igstAmount, isInterState };
  };

  const handleSave = async () => {
    if (!formData.clientName && !formData.companyName) {
      toast.error("Please enter either Client Name or Company Name.");
      return;
    }
    if (formData.items.length === 0) {
      toast.error("Please add at least one line item.");
      return;
    }

    let quotationNoToUse = formData.quotationNo;
    if (!quotationNoToUse && !editData) {
      try {
        const { nextNo } = await getNextQuotationNo();
        quotationNoToUse = nextNo;
      } catch (e) {
        console.error("Error fetching fallback quotation number:", e);
      }
    }

    const totals = calculateTotals();
    const payload = {
      ...formData,
      quotationNo: quotationNoToUse,
      items: formData.items.map(({ id, ...rest }) => rest), // Remove temp id
      subTotal: totals.subTotal,
      taxAmount: totals.taxAmount,
      totalAmount: totals.totalAmount,
      cgstAmount: totals.cgstAmount,
      sgstAmount: totals.sgstAmount,
      igstAmount: totals.igstAmount,
      isInterState: totals.isInterState,
    };

    try {
      setIsSaving(true);

      if (editData) {
        await updateQuotation(editData._id, payload);
        toast.success('Quotation updated successfully!');
      } else {
        await createQuotation(payload);
        toast.success('Quotation saved successfully!');
      }
      navigate('/quotations');
    } catch (error) {
      console.error('Error saving quotation:', error);
      const serverMsg = error.response?.data?.message || 'Failed to save quotation.';
      toast.error(serverMsg);
    } finally {
      setIsSaving(false);
    }
  };

  const totals = calculateTotals();

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 pb-24">
      <form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
        <div className="flex flex-wrap items-center justify-between gap-4 p-5 bg-white border border-slate-200/90 rounded-2xl shadow-sm mb-6">
          <div className="flex items-center gap-4">
            <button type="button" className="p-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl text-slate-600 transition-colors cursor-pointer" onClick={() => navigate(-1)}>
              <ArrowLeft size={18} />
            </button>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-800 m-0">{editData ? 'Edit Quotation' : 'Create New Quotation'}</h1>
              <p className="text-xs sm:text-sm text-slate-500 m-0">{editData ? 'Modify your existing quotation details' : 'Generate a professional estimate or quotation'}</p>
            </div>
          </div>
          <button 
            type="submit" 
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#0059bb] hover:bg-[#004c9e] text-white rounded-xl font-semibold text-sm shadow-sm transition-all cursor-pointer disabled:opacity-50" 
            disabled={isSaving}
          >
            <Save size={18} /> {isSaving ? 'Saving...' : 'Save Quotation'}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm flex flex-col gap-4">
            <h3 className="text-base font-bold text-slate-800 border-b border-slate-100 pb-2 mb-1">Document Details</h3>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-600">Quotation No</label>
              <input type="text" name="quotationNo" value={formData.quotationNo} onChange={handleInputChange} className="w-full px-3.5 py-2 text-sm text-slate-800 bg-slate-100 border border-slate-200 rounded-xl focus:outline-none" readOnly />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-600">Date <span className="text-red-500">*</span></label>
              <input type="text" placeholder="dd/mm/yyyy" name="date" value={formData.date} onChange={handleInputChange} className="w-full px-3.5 py-2 text-sm text-slate-800 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0059bb]/20 focus:border-[#0059bb] transition-all" required />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-600">Document Type</label>
              <select name="documentType" value={formData.documentType} onChange={handleInputChange} className="w-full px-3.5 py-2 text-sm text-slate-800 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0059bb]/20 focus:border-[#0059bb] transition-all">
                <option value="Proforma Invoice">Proforma Invoice</option>
                <option value="Quotation">Quotation</option>
                <option value="Estimate">Estimate</option>
              </select>
            </div>
          </div>

          <div className="lg:col-span-2 bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2 mb-4">
              <h3 className="text-base font-bold text-slate-800 m-0">Client & Party Details</h3>
              <span className="text-xs text-slate-500 flex items-center gap-1">
                <ShieldCheck size={14} className="text-[#0059bb]" /> GSTIN Auto-Fill Enabled
              </span>
            </div>

            {/* GSTIN Verification Input & Auto-fill Section */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 mb-4">
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  GSTIN / Tax Identification
                </label>
                {formData.clientGST && (
                  <span className={`text-xs font-semibold ${GSTIN_REGEX.test(formData.clientGST.trim()) ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {GSTIN_REGEX.test(formData.clientGST.trim()) ? '✓ Valid Format' : '15-char required (e.g. 24ABHPP5386L1Z3)'}
                  </span>
                )}
              </div>

              <div className="flex gap-2">
                <input 
                  type="text" 
                  name="clientGST" 
                  value={formData.clientGST} 
                  onChange={(e) => {
                    const val = e.target.value.toUpperCase().replace(/[^0-9A-Z]/g, '');
                    setFormData(prev => ({ ...prev, clientGST: val }));
                    setGstError('');
                  }}
                  className="flex-1 px-3.5 py-2 text-sm text-slate-800 bg-white border border-slate-300 rounded-xl font-mono tracking-wider font-semibold uppercase focus:outline-none focus:ring-2 focus:ring-[#0059bb]/20 focus:border-[#0059bb] transition-all" 
                  placeholder="Enter 15-digit GSTIN (e.g. 24ABHPP5386L1Z3)"
                  maxLength={15}
                />
                <button 
                  type="button" 
                  className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-[#0059bb] hover:bg-[#004c9e] text-white rounded-xl font-semibold text-xs sm:text-sm whitespace-nowrap min-w-[120px] transition-all cursor-pointer disabled:opacity-50" 
                  onClick={handleVerifyGstin}
                  disabled={isVerifyingGst}
                >
                  {isVerifyingGst ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" /> Verifying...
                    </>
                  ) : (
                    <>
                      <ShieldCheck size={16} /> Verify GST
                    </>
                  )}
                </button>
                {formData.clientGST && (
                  <button 
                    type="button" 
                    className="inline-flex items-center justify-center px-2.5 py-2 bg-white border border-slate-300 text-slate-600 hover:bg-slate-50 rounded-xl transition-all cursor-pointer"
                    onClick={handleClearGst}
                    title="Clear GSTIN"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>

              {gstError && (
                <div className="mt-2 text-xs text-red-600 flex items-center gap-1">
                  <AlertCircle size={14} /> {gstError}
                </div>
              )}

              {gstVerification && (
                <div className="mt-2.5 p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl">
                  <div className="flex justify-between items-start flex-wrap gap-1.5">
                    <div className="flex items-center gap-1.5 text-emerald-700 font-bold text-xs sm:text-sm">
                      <CheckCircle2 size={16} />
                      <span>
                        {gstVerification.isExistingParty ? 'Existing Customer Verified' : 'GSTIN Verified Active'}
                      </span>
                      {gstVerification.source && (
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded uppercase font-semibold">
                          {gstVerification.source}
                        </span>
                      )}
                    </div>
                    <span className="text-xs font-bold bg-sky-100 text-sky-800 px-2 py-0.5 rounded">
                      {totals.isInterState ? 'Inter-State (IGST)' : 'Intra-State (CGST + SGST)'}
                    </span>
                  </div>

                  <div className="mt-2 text-xs text-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-x-3.5 gap-y-1">
                    <div><strong>Legal Entity:</strong> {gstVerification.legalName || gstVerification.tradeName || '—'}</div>
                    <div><strong>Trade Name:</strong> {gstVerification.tradeName || gstVerification.legalName || '—'}</div>
                    <div><strong>State:</strong> {gstVerification.stateName || 'Gujarat'} ({gstVerification.stateCode || '24'})</div>
                    <div><strong>Status:</strong> <span className="text-emerald-600 font-semibold">{gstVerification.status || 'Active'}</span></div>
                    {gstVerification.constitution && <div><strong>Constitution:</strong> {gstVerification.constitution}</div>}
                    {gstVerification.pincode && <div><strong>Pincode:</strong> {gstVerification.pincode}</div>}
                    {(gstVerification.city || gstVerification.district) && (
                      <div><strong>City / District:</strong> {[gstVerification.city, gstVerification.district].filter(Boolean).filter((v, i, a) => a.indexOf(v) === i).join(', ')}</div>
                    )}
                  </div>

                  {/* Contact Information Status Banner */}
                  <div className="mt-2.5 pt-2 border-t border-emerald-200 text-xs">
                    {(gstVerification.hasContactInfo || gstVerification.phone || gstVerification.email) ? (
                      <div className="flex items-center justify-between flex-wrap gap-2 bg-emerald-100/60 p-2 rounded-lg border border-emerald-300">
                        <div className="flex items-center gap-3.5 flex-wrap">
                          {gstVerification.phone && (
                            <span>📞 <strong>Phone:</strong> {gstVerification.phone}</span>
                          )}
                          {gstVerification.email && (
                            <span>✉️ <strong>Email:</strong> {gstVerification.email}</span>
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
                      <div className="flex items-center gap-1.5 text-slate-500 text-xs bg-slate-100 p-2 rounded-lg border border-slate-200">
                        <span>ℹ️</span>
                        <span>
                          <strong>Contact Info Note:</strong> Public GST registry protects taxpayer privacy and does not publish Email/Phone. You can enter contact details manually below or pick from saved customer master.
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-1.5 mb-4 relative">
              <label className="text-xs font-semibold text-slate-600">Client / Trade Name <span className="text-red-500">*</span></label>
              <input 
                type="text" 
                name="clientName" 
                value={formData.clientName} 
                onChange={handleInputChange} 
                onFocus={() => setIsPartyDropdownOpen(true)}
                onBlur={() => setTimeout(() => setIsPartyDropdownOpen(false), 200)}
                className="w-full px-3.5 py-2 text-sm text-slate-800 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0059bb]/20 focus:border-[#0059bb] transition-all" 
                placeholder="M/s ABC Enterprises or Type to search..." 
                required 
                autoComplete="off"
              />
              {isPartyDropdownOpen && (
                <div className="absolute top-full left-0 w-full max-h-60 overflow-y-auto bg-white border border-slate-300 rounded-xl z-50 shadow-lg mt-1">
                  {privateParties
                    .filter(p => p.name.toLowerCase().includes((formData.clientName || '').toLowerCase()))
                    .map((party) => (
                      <div 
                        key={party._id} 
                        className="px-3.5 py-2 hover:bg-slate-100 cursor-pointer border-b border-slate-100 text-xs"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          handlePartySelect(party);
                        }}
                      >
                        <div className="font-bold text-slate-800">{party.name}</div>
                        {(party.address || party.phone || party.gst) && (
                          <div className="text-[11px] text-slate-500">
                            {party.gst && `GST: ${party.gst} | `}{party.address} {party.phone && `| ${party.phone}`}
                          </div>
                        )}
                      </div>
                  ))}
                  {privateParties.filter(p => p.name.toLowerCase().includes((formData.clientName || '').toLowerCase())).length === 0 && (
                     <div className="px-3.5 py-2 text-xs text-slate-400 italic">
                       No matches found. Enter custom name or add in Master Data.
                     </div>
                  )}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-600">Company Legal Name</label>
                <input type="text" name="companyName" value={formData.companyName} onChange={handleInputChange} className="w-full px-3.5 py-2 text-sm text-slate-800 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0059bb]/20 focus:border-[#0059bb] transition-all" placeholder="Company legal entity" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-600 flex justify-between items-center">
                  <span>Phone</span>
                  {formData.clientPhone && (gstVerification?.phone || gstVerification?.contactSource) && (
                    <span className="text-[11px] text-emerald-600 font-semibold">✓ Auto-populated</span>
                  )}
                </label>
                <input type="text" name="clientPhone" value={formData.clientPhone} onChange={handleInputChange} className="w-full px-3.5 py-2 text-sm text-slate-800 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0059bb]/20 focus:border-[#0059bb] transition-all" placeholder="Phone number" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-600 flex justify-between items-center">
                  <span>Email</span>
                  {formData.clientEmail && (gstVerification?.email || gstVerification?.contactSource) && (
                    <span className="text-[11px] text-emerald-600 font-semibold">✓ Auto-populated</span>
                  )}
                </label>
                <input type="email" name="clientEmail" value={formData.clientEmail} onChange={handleInputChange} className="w-full px-3.5 py-2 text-sm text-slate-800 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0059bb]/20 focus:border-[#0059bb] transition-all" placeholder="client@company.com" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-600">Place of Supply (State)</label>
                <input 
                  type="text" 
                  name="placeOfSupply" 
                  value={formData.placeOfSupply ? `${formData.placeOfSupply} (${totals.isInterState ? 'Inter-State / IGST' : 'Intra-State / CGST+SGST'})` : ''} 
                  readOnly 
                  className={`w-full px-3.5 py-2 text-sm rounded-xl font-semibold bg-slate-100 border border-slate-200 focus:outline-none ${totals.isInterState ? 'text-sky-600' : 'text-emerald-600'}`}
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-600">Billing Address <span className="text-red-500">*</span></label>
              <input type="text" name="clientAddress" value={formData.clientAddress} onChange={handleInputChange} className="w-full px-3.5 py-2 text-sm text-slate-800 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0059bb]/20 focus:border-[#0059bb] transition-all" required placeholder="Full registered address" />
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm mt-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-base font-bold text-slate-800 m-0">Line Items <span className="text-red-500">*</span></h3>
            <button type="button" className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-300 text-[#0059bb] hover:bg-slate-50 rounded-xl font-semibold text-xs sm:text-sm transition-all cursor-pointer" onClick={addItem}>
              <Plus size={16} /> Add Item
            </button>
          </div>
          
          <div className="w-full overflow-x-auto">
            <table className="w-full min-w-[700px] border-collapse border border-slate-200 text-sm">
            <thead>
              <tr className="bg-slate-50">
                <th className="border border-slate-200 p-2.5 text-left font-bold text-xs text-slate-700 w-[32%]">Description</th>
                <th className="border border-slate-200 p-2.5 text-center font-bold text-xs text-slate-700 w-[10%]">HSN</th>
                <th className="border border-slate-200 p-2.5 text-right font-bold text-xs text-slate-700 w-[10%]">Qty</th>
                <th className="border border-slate-200 p-2.5 text-center font-bold text-xs text-slate-700 w-[10%]">Unit</th>
                <th className="border border-slate-200 p-2.5 text-right font-bold text-xs text-slate-700 w-[15%]">Rate (₹)</th>
                <th className="border border-slate-200 p-2.5 text-right font-bold text-xs text-slate-700 w-[15%]">Amount (₹)</th>
                <th className="border border-slate-200 p-2.5 text-center font-bold text-xs text-slate-700 w-[8%]"></th>
              </tr>
            </thead>
            <tbody>
              {formData.items.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/50">
                  <td className="border border-slate-200 p-2 relative">
                    <input 
                      type="text"
                      value={item.description}
                      onChange={(e) => handleItemChange(item.id, 'description', e.target.value)}
                      onFocus={() => setActiveDropdownId(item.id)}
                      onBlur={() => setTimeout(() => setActiveDropdownId(null), 200)}
                      className="w-full px-2.5 py-1.5 text-sm text-slate-800 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0059bb]"
                      placeholder="Select or type material..."
                      required
                    />
                    {activeDropdownId === item.id && (
                      <div className="absolute top-full left-0 w-full max-h-52 overflow-y-auto bg-white border border-slate-300 rounded-xl z-50 shadow-xl mt-1 p-1">
                        {materials
                          .filter(m => {
                            const name = typeof m === 'string' ? m : (m.name || '');
                            return name.toLowerCase().includes((item.description || '').toLowerCase());
                          })
                          .map((mat, idx) => {
                            const matName = typeof mat === 'string' ? mat : mat.name;
                            const matRate = typeof mat === 'object' ? mat.rate : 0;
                            const matHsn = typeof mat === 'object' ? mat.hsn : '';
                            const matUnit = typeof mat === 'object' ? mat.unit : 'Nos';

                            return (
                              <div 
                                key={idx} 
                                className="p-2 hover:bg-blue-50 cursor-pointer border-b border-slate-100 last:border-b-0 text-xs rounded-lg transition-colors"
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                  setFormData(prev => {
                                    const newItems = prev.items.map(it => {
                                      if (it.id === item.id) {
                                        const rate = matRate > 0 ? matRate : (it.rate || 0);
                                        const qty = Number(it.quantity || 1);
                                        return {
                                          ...it,
                                          description: matName,
                                          hsn: matHsn || it.hsn || '',
                                          unit: matUnit || it.unit || 'Nos',
                                          rate: rate,
                                          amount: Number((qty * rate).toFixed(2))
                                        };
                                      }
                                      return it;
                                    });
                                    return { ...prev, items: newItems };
                                  });
                                  setActiveDropdownId(null);
                                }}
                              >
                                <div className="flex justify-between items-center">
                                  <span className="font-bold text-slate-900">{matName}</span>
                                  {matRate > 0 && <span className="font-mono text-[#0059bb] font-bold">₹{matRate}</span>}
                                </div>
                                {(matHsn || matUnit) && (
                                  <div className="text-[10px] text-slate-400 flex gap-2 mt-0.5">
                                    {matHsn && <span>HSN: {matHsn}</span>}
                                    <span>Unit: {matUnit}</span>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        {materials.filter(m => {
                          const name = typeof m === 'string' ? m : (m.name || '');
                          return name.toLowerCase().includes((item.description || '').toLowerCase());
                        }).length === 0 && (
                          <div className="p-2 text-xs text-slate-400 italic text-center">Type custom material...</div>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="border border-slate-200 p-2">
                    <input type="text" value={item.hsn || ''} onChange={(e) => handleItemChange(item.id, 'hsn', e.target.value)} className="w-full px-2 py-1.5 text-sm text-center text-slate-800 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0059bb]" placeholder="HSN" list="hsn-list" />
                  </td>
                  <td className="border border-slate-200 p-2">
                    <input type="number" value={item.quantity} onChange={(e) => handleItemChange(item.id, 'quantity', e.target.value)} className="w-full px-2 py-1.5 text-sm text-right font-mono text-slate-800 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0059bb]" min="1" />
                  </td>
                  <td className="border border-slate-200 p-2">
                    <input type="text" value={item.unit} onChange={(e) => handleItemChange(item.id, 'unit', e.target.value)} className="w-full px-2 py-1.5 text-sm text-center text-slate-800 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0059bb]" />
                  </td>
                  <td className="border border-slate-200 p-2">
                    <input type="number" value={item.rate} onChange={(e) => handleItemChange(item.id, 'rate', e.target.value)} className="w-full px-2 py-1.5 text-sm text-right font-mono text-slate-800 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0059bb]" min="0" step="0.01" />
                  </td>
                  <td className="border border-slate-200 p-2">
                    <input type="text" value={formatIndianNumber(item.amount)} className="w-full px-2 py-1.5 text-sm text-right font-mono font-bold text-slate-900 bg-slate-50 border border-slate-200 rounded-lg" readOnly />
                  </td>
                  <td className="border border-slate-200 p-2 text-center">
                    <button type="button" onClick={() => removeItem(item.id)} className="p-1 text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer">
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
          
          <datalist id="hsn-list">
            {hsnCodes.map(h => <option key={h} value={h} />)}
          </datalist>

          <div className="flex flex-col md:flex-row gap-6 mt-6">
            <div className="flex-1 md:flex-2">
              <h4 className="text-sm font-semibold text-slate-700 mb-2">Terms & Conditions</h4>
              <textarea 
                name="terms" 
                value={formData.terms} 
                onChange={handleInputChange} 
                className="w-full px-3.5 py-2 text-sm text-slate-800 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0059bb]/20 focus:border-[#0059bb] transition-all" 
                rows="5"
              />
            </div>
            
            <div className="flex-1 bg-slate-50 p-5 rounded-2xl border border-slate-200 flex flex-col gap-3">
              <div className="flex justify-between text-sm text-slate-600">
                <span>Sub Total:</span>
                <span className="font-mono font-semibold text-slate-800">₹{formatIndianNumber(totals.subTotal)}</span>
              </div>
              <div className="flex items-center justify-between text-sm text-slate-600">
                <span className="flex items-center gap-2">
                  GST Slab:
                  <select 
                    name="taxPercentage" 
                    value={formData.taxPercentage} 
                    onChange={handleInputChange} 
                    className="bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs text-slate-800 font-medium focus:outline-none focus:ring-1 focus:ring-[#0059bb]"
                  >
                    <option value="0">0% (No GST)</option>
                    <option value="5">5% (2.5% + 2.5%)</option>
                    <option value="12">12% (6% + 6%)</option>
                    <option value="18">18% (9% + 9%)</option>
                    <option value="28">28% (14% + 14%)</option>
                  </select>
                </span>
              </div>
              {formData.taxPercentage > 0 && (
                <>
                  {totals.isInterState ? (
                    <div className="flex justify-between text-xs font-semibold text-sky-600">
                      <span>IGST ({formData.taxPercentage}% - Inter-State):</span>
                      <span className="font-mono">₹{formatIndianNumber(totals.taxAmount)}</span>
                    </div>
                  ) : (
                    <>
                      <div className="flex justify-between text-xs text-slate-500">
                        <span>CGST ({formData.taxPercentage / 2}%):</span>
                        <span className="font-mono">₹{formatIndianNumber(totals.taxAmount / 2)}</span>
                      </div>
                      <div className="flex justify-between text-xs text-slate-500">
                        <span>SGST ({formData.taxPercentage / 2}%):</span>
                        <span className="font-mono">₹{formatIndianNumber(totals.taxAmount / 2)}</span>
                      </div>
                    </>
                  )}
                </>
              )}
              <div className="flex justify-between font-bold text-lg text-slate-900 border-t-2 border-slate-300 pt-3 mt-1">
                <span>Grand Total:</span>
                <span className="font-mono text-[#0059bb]">₹{formatIndianNumber(totals.totalAmount)}</span>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
