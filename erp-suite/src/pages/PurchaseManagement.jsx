import React, { useState, useEffect } from 'react';
import { 
  ShoppingBag, Plus, Search, Filter, RefreshCcw, Eye, Mail, 
  Send, CheckCircle2, Clock, AlertTriangle, FileText, CheckSquare, 
  Landmark, ArrowRight, Printer, Trash2, Award, ChevronRight, 
  Package, Truck, DollarSign, X, AlertCircle, Building2, Store,
  ShieldCheck
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  getPurchaseOrders, 
  createPurchaseRequirement, 
  sendQuotationRequests, 
  recordVendorEstimate, 
  submitForOwnerApproval, 
  ownerApprovalAction, 
  recordMaterialReceipt, 
  recordAccountsPayment, 
  deletePurchaseOrder, 
  getVendors, 
  getPrivateParties, 
  getRawMaterials, 
  getQuotations 
} from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

export default function PurchaseManagement() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const targetPrId = searchParams.get('prId');
  const targetPoId = searchParams.get('poId');

  const { user } = useAuth();
  const isOwner = user?.role === 'owner';
  const isAccounts = user?.department === 'accounts' || user?.role === 'admin';

  const [purchases, setPurchases] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [parties, setParties] = useState([]);
  const [materialsMaster, setMaterialsMaster] = useState([]);
  const [quotations, setQuotations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [partyFilter, setPartyFilter] = useState('all');

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isRfqModalOpen, setIsRfqModalOpen] = useState(false);
  const [isEstimateModalOpen, setIsEstimateModalOpen] = useState(false);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);
  const [isOwnerApprovalModalOpen, setIsOwnerApprovalModalOpen] = useState(false);
  const [isGrnModalOpen, setIsGrnModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  const [selectedPurchase, setSelectedPurchase] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Create Requirement Form State
  const [newRequirement, setNewRequirement] = useState({
    privatePartyId: '',
    privatePartyName: '',
    quotationId: '',
    quotationNo: '',
    requiredDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    materials: [
      { materialId: '', name: '', code: 'Angles', hsn: '7216', quantity: 1, unit: 'KG', specifications: '' }
    ],
    notes: '',
  });

  // RFQ Form State
  const [selectedVendorIds, setSelectedVendorIds] = useState([]);
  const [rfqNotes, setRfqNotes] = useState('');

  // Estimate Form State
  const [estimateForm, setEstimateForm] = useState({
    vendorId: '',
    quotationNo: '',
    quotationDate: new Date().toISOString().slice(0, 10),
    validity: '15 Days',
    deliveryTime: '3-5 Days',
    paymentTerms: '30 Days Net',
    materialPrices: [],
    subtotal: 0,
    gstPercentage: 18,
    gstAmount: 0,
    shippingCharges: 0,
    otherCharges: 0,
    totalAmount: 0,
    notes: '',
  });

  // Compare & Recommend Form State
  const [recommendedVendorId, setRecommendedVendorId] = useState('');
  const [recommendationNotes, setRecommendationNotes] = useState('');

  // Owner Approval Form State
  const [ownerActionType, setOwnerActionType] = useState('approve');
  const [ownerRemarks, setOwnerRemarks] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');

  // GRN Form State
  const [grnForm, setGrnForm] = useState({
    challanNo: '',
    receiptDate: new Date().toISOString().slice(0, 10),
    receivedItems: [],
    remarks: '',
  });

  // Payment Form State
  const [paymentForm, setPaymentForm] = useState({
    amount: 0,
    paymentMethod: 'Bank Transfer',
    reference: '',
    notes: '',
  });

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [pData, vData, partyData, matData, qData] = await Promise.all([
        getPurchaseOrders().catch(() => []),
        getVendors().catch(() => []),
        getPrivateParties().catch(() => []),
        getRawMaterials().catch(() => []),
        getQuotations().catch(() => []),
      ]);

      setPurchases(pData || []);
      setVendors(vData?.filter(v => v.status === 'active') || []);
      setParties(partyData || []);
      setMaterialsMaster(matData || []);
      setQuotations(qData || []);

      if (targetPrId || targetPoId) {
        const found = pData?.find(p => p._id === targetPrId || p._id === targetPoId);
        if (found) {
          setSelectedPurchase(found);
          if (found.status === 'Pending Owner Approval' && isOwner) {
            setIsOwnerApprovalModalOpen(true);
          } else if (found.status === 'Under Comparison' || found.vendorEstimates?.length > 1) {
            setIsCompareModalOpen(true);
          }
        }
      }
    } catch (err) {
      console.error('Failed to load purchase management data:', err);
      toast.error('Unable to load purchase records');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Handle party select in Create PR
  const handlePartyChange = (partyId) => {
    const selectedParty = parties.find(p => p._id === partyId);
    setNewRequirement(prev => ({
      ...prev,
      privatePartyId: partyId,
      privatePartyName: selectedParty?.name || '',
    }));
  };

  // Add line item in Create PR
  const addMaterialRow = () => {
    setNewRequirement(prev => ({
      ...prev,
      materials: [
        ...prev.materials,
        { materialId: '', name: '', code: 'Angles', hsn: '7216', quantity: 1, unit: 'KG', specifications: '' }
      ]
    }));
  };

  // Remove line item in Create PR
  const removeMaterialRow = (idx) => {
    if (newRequirement.materials.length <= 1) return;
    setNewRequirement(prev => ({
      ...prev,
      materials: prev.materials.filter((_, i) => i !== idx)
    }));
  };

  // Select material from Raw Materials master
  const handlePickMaterial = (idx, materialId) => {
    const mat = materialsMaster.find(m => m._id === materialId);
    if (!mat) return;

    setNewRequirement(prev => {
      const updated = [...prev.materials];
      const specList = [];
      if (mat.size) specList.push(`Size: ${mat.size}`);
      if (mat.grade) specList.push(`Grade: ${mat.grade}`);
      if (mat.description) specList.push(mat.description);

      updated[idx] = {
        ...updated[idx],
        materialId: mat._id,
        name: mat.name,
        code: mat.category || 'Angles',
        hsn: mat.hsn || '7216',
        unit: mat.unit || 'KG',
        specifications: specList.join(' | ') || updated[idx].specifications,
      };
      return { ...prev, materials: updated };
    });
  };

  // Quick 1-click add from Raw Material Category chips
  const handleQuickAddRawMaterial = (mat) => {
    const specList = [];
    if (mat.size) specList.push(`Size: ${mat.size}`);
    if (mat.grade) specList.push(`Grade: ${mat.grade}`);
    if (mat.description) specList.push(mat.description);

    const newItem = {
      materialId: mat._id,
      name: mat.name,
      code: mat.category || 'Angles',
      hsn: mat.hsn || '7216',
      quantity: 1,
      unit: mat.unit || 'KG',
      specifications: specList.join(' | '),
    };

    setNewRequirement(prev => {
      if (prev.materials.length === 1 && !prev.materials[0].name.trim()) {
        return { ...prev, materials: [newItem] };
      }
      return { ...prev, materials: [...prev.materials, newItem] };
    });
    toast.success(`Added ${mat.name} to requirement`);
  };

  // Create Requirement Submit
  const handleCreatePR = async (e) => {
    e.preventDefault();
    if (!newRequirement.privatePartyName) {
      toast.error('Please select or specify a Private Client');
      return;
    }

    const invalidItem = newRequirement.materials.find(m => !m.name.trim() || Number(m.quantity) <= 0);
    if (invalidItem) {
      toast.error('All material items must have a name and quantity > 0');
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await createPurchaseRequirement(newRequirement);
      setPurchases(prev => [created, ...prev]);
      setIsCreateModalOpen(false);
      setNewRequirement({
        privatePartyId: '',
        privatePartyName: '',
        quotationId: '',
        quotationNo: '',
        requiredDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
        materials: [{ materialId: '', name: '', code: '', hsn: '', quantity: 1, unit: 'Nos', specifications: '' }],
        notes: '',
      });
      toast.success(`Purchase Requirement ${created.prNo} generated successfully!`);
    } catch (err) {
      console.error('Create PR error:', err);
      toast.error(err.response?.data?.message || 'Failed to create requirement');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open RFQ Modal
  const openRfqModal = (purchase) => {
    setSelectedPurchase(purchase);
    // Pre-select already requested vendors if any
    setSelectedVendorIds(purchase.vendorQuotationRequests?.map(r => r.vendorId?._id || r.vendorId) || []);
    setRfqNotes('');
    setIsRfqModalOpen(true);
  };

  // Submit RFQ Emails
  const handleSendRfq = async (e) => {
    e.preventDefault();
    if (selectedVendorIds.length === 0) {
      toast.error('Please select at least one vendor');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await sendQuotationRequests(selectedPurchase._id, {
        vendorIds: selectedVendorIds,
        customNotes: rfqNotes,
      });

      setPurchases(prev => prev.map(p => p._id === selectedPurchase._id ? res.purchase : p));
      setSelectedPurchase(res.purchase);
      setIsRfqModalOpen(false);
      toast.success(`Quotation request emails dispatched to ${selectedVendorIds.length} vendor(s)!`);
    } catch (err) {
      console.error('RFQ dispatch error:', err);
      toast.error('Failed to dispatch RFQ emails');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open Record Estimate Modal
  const openEstimateModal = (purchase) => {
    setSelectedPurchase(purchase);
    const initialPrices = purchase.materials.map(m => ({
      materialId: m.materialId,
      name: m.name,
      quantity: m.quantity,
      rate: 0,
      subtotal: 0,
    }));

    setEstimateForm({
      vendorId: vendors[0]?._id || '',
      quotationNo: '',
      quotationDate: new Date().toISOString().slice(0, 10),
      validity: '15 Days',
      deliveryTime: '3-5 Days',
      paymentTerms: '30 Days Net',
      materialPrices: initialPrices,
      subtotal: 0,
      gstPercentage: 18,
      gstAmount: 0,
      shippingCharges: 0,
      otherCharges: 0,
      totalAmount: 0,
      notes: '',
    });
    setIsEstimateModalOpen(true);
  };

  // Calculate Estimate Totals
  const updateEstimateRate = (idx, rate) => {
    const numRate = Number(rate) || 0;
    setEstimateForm(prev => {
      const updatedPrices = [...prev.materialPrices];
      updatedPrices[idx] = {
        ...updatedPrices[idx],
        rate: numRate,
        subtotal: updatedPrices[idx].quantity * numRate,
      };

      const subtotal = updatedPrices.reduce((sum, item) => sum + item.subtotal, 0);
      const gstAmount = (subtotal * prev.gstPercentage) / 100;
      const totalAmount = subtotal + gstAmount + Number(prev.shippingCharges) + Number(prev.otherCharges);

      return {
        ...prev,
        materialPrices: updatedPrices,
        subtotal,
        gstAmount,
        totalAmount,
      };
    });
  };

  const updateEstimateCharges = (field, val) => {
    const numVal = Number(val) || 0;
    setEstimateForm(prev => {
      const updated = { ...prev, [field]: numVal };
      const gstAmount = (updated.subtotal * updated.gstPercentage) / 100;
      const totalAmount = updated.subtotal + gstAmount + updated.shippingCharges + updated.otherCharges;
      return { ...updated, gstAmount, totalAmount };
    });
  };

  // Save Estimate Submit
  const handleSaveEstimate = async (e) => {
    e.preventDefault();
    if (!estimateForm.vendorId) {
      toast.error('Please select a vendor');
      return;
    }
    if (estimateForm.totalAmount <= 0) {
      toast.error('Please enter rates for materials');
      return;
    }

    setIsSubmitting(true);
    try {
      const updated = await recordVendorEstimate(selectedPurchase._id, estimateForm);
      setPurchases(prev => prev.map(p => p._id === updated._id ? updated : p));
      setSelectedPurchase(updated);
      setIsEstimateModalOpen(false);
      toast.success('Vendor estimate recorded successfully');
    } catch (err) {
      console.error('Save estimate error:', err);
      toast.error('Failed to save vendor estimate');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open Compare Modal
  const openCompareModal = (purchase) => {
    setSelectedPurchase(purchase);
    const existingRec = purchase.vendorEstimates?.find(e => e.isRecommended);
    setRecommendedVendorId(existingRec?.vendorId?._id || existingRec?.vendorId || purchase.vendorEstimates?.[0]?.vendorId?._id || purchase.vendorEstimates?.[0]?.vendorId || '');
    setRecommendationNotes(purchase.recommendationNotes || '');
    setIsCompareModalOpen(true);
  };

  // Submit Recommendation for Owner Approval
  const handleSubmitForApproval = async () => {
    if (!recommendedVendorId) {
      toast.error('Please select a recommended vendor');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await submitForOwnerApproval(selectedPurchase._id, {
        recommendedVendorId,
        recommendationNotes,
      });

      setPurchases(prev => prev.map(p => p._id === res.purchase._id ? res.purchase : p));
      setSelectedPurchase(res.purchase);
      setIsCompareModalOpen(false);
      toast.success('Quotation comparison submitted to Owner for Approval! Notification sent.');
    } catch (err) {
      console.error('Submit approval error:', err);
      toast.error('Failed to submit for Owner approval');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Owner Approval Action (Owner Only)
  const handleOwnerAction = async () => {
    setIsSubmitting(true);
    try {
      const res = await ownerApprovalAction(selectedPurchase._id, {
        action: ownerActionType,
        approvedVendorId: recommendedVendorId,
        ownerRemarks,
        rejectionReason,
      });

      setPurchases(prev => prev.map(p => p._id === res.purchase._id ? res.purchase : p));
      setSelectedPurchase(res.purchase);
      setIsOwnerApprovalModalOpen(false);
      toast.success(res.message || 'Owner action processed successfully');
    } catch (err) {
      console.error('Owner action error:', err);
      toast.error(err.response?.data?.message || 'Failed to process owner approval action');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open GRN Modal
  const openGrnModal = (purchase) => {
    setSelectedPurchase(purchase);
    const items = purchase.materials.map(m => ({
      name: m.name,
      quantity: m.pendingQuantity || 0,
      unit: m.unit,
      maxAllowed: m.pendingQuantity || 0,
    }));

    setGrnForm({
      challanNo: '',
      receiptDate: new Date().toISOString().slice(0, 10),
      receivedItems: items,
      remarks: '',
    });
    setIsGrnModalOpen(true);
  };

  // Save Material Receipt (GRN)
  const handleSaveGrn = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await recordMaterialReceipt(selectedPurchase._id, grnForm);
      setPurchases(prev => prev.map(p => p._id === res.purchase._id ? res.purchase : p));
      setSelectedPurchase(res.purchase);
      setIsGrnModalOpen(false);
      toast.success('Material receipt (GRN) recorded successfully!');
    } catch (err) {
      console.error('GRN error:', err);
      toast.error('Failed to record material receipt');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open Accounts Payment Modal
  const openPaymentModal = (purchase) => {
    setSelectedPurchase(purchase);
    const balance = purchase.accountsPayment?.balanceAmount || purchase.ownerApproval?.approvedAmount || 0;
    setPaymentForm({
      amount: balance,
      paymentMethod: 'Bank Transfer',
      reference: '',
      notes: '',
    });
    setIsPaymentModalOpen(true);
  };

  // Save Accounts Payment
  const handleSavePayment = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await recordAccountsPayment(selectedPurchase._id, paymentForm);
      setPurchases(prev => prev.map(p => p._id === res.purchase._id ? res.purchase : p));
      setSelectedPurchase(res.purchase);
      setIsPaymentModalOpen(false);
      toast.success('Payment recorded successfully by Accounts!');
    } catch (err) {
      console.error('Payment error:', err);
      toast.error(err.response?.data?.message || 'Failed to record payment');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete PR
  const handleDelete = async (purchaseId, prNo) => {
    if (!window.confirm(`Are you sure you want to delete purchase request "${prNo}"?`)) {
      return;
    }

    try {
      await deletePurchaseOrder(purchaseId);
      setPurchases(prev => prev.filter(p => p._id !== purchaseId));
      toast.success('Purchase record deleted');
    } catch (err) {
      console.error('Delete error:', err);
      toast.error(err.response?.data?.message || 'Failed to delete purchase record');
    }
  };

  // KPI Calculations
  const totalPRs = purchases.length;
  const rfqCount = purchases.filter(p => p.status === 'Quotation Requested').length;
  const estimatesCount = purchases.filter(p => p.status === 'Estimates Received' || p.status === 'Under Comparison').length;
  const pendingApprovalCount = purchases.filter(p => p.status === 'Pending Owner Approval').length;
  const approvedCount = purchases.filter(p => p.status === 'Approved' || p.status === 'PO Created' || p.status === 'Ordered').length;
  const receivingCount = purchases.filter(p => p.status === 'Partially Received' || p.status === 'PO Created' || p.status === 'Ordered').length;

  // Filtered List
  const filteredPurchases = purchases.filter(p => {
    if (statusFilter !== 'all' && p.status !== statusFilter) return false;
    if (partyFilter !== 'all' && p.privatePartyId?._id !== partyFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchPr = p.prNo?.toLowerCase().includes(q);
      const matchPo = p.poNo?.toLowerCase().includes(q);
      const matchParty = p.privatePartyName?.toLowerCase().includes(q);
      const matchQuote = p.quotationNo?.toLowerCase().includes(q);
      const matchMat = p.materials?.some(m => m.name.toLowerCase().includes(q));
      if (!matchPr && !matchPo && !matchParty && !matchQuote && !matchMat) return false;
    }
    return true;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Draft':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">Draft</span>;
      case 'Quotation Requested':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-[#0059bb] border border-blue-200">RFQ Sent</span>;
      case 'Estimates Received':
      case 'Under Comparison':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-700 border border-indigo-200">Comparing Quotes</span>;
      case 'Pending Owner Approval':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300 animate-pulse">Pending Approval</span>;
      case 'Approved':
      case 'PO Created':
      case 'Ordered':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">Approved (PO Ready)</span>;
      case 'Partially Received':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">Partially Inward</span>;
      case 'Fully Received':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-100 text-teal-800 border border-teal-200">Fully Received</span>;
      case 'Payment Pending':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-200">Payment Pending</span>;
      case 'Paid':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-600 text-white">Paid ✓</span>;
      case 'Rejected':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-700 border border-rose-200">Rejected</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700">{status}</span>;
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Purchase Management (Private Materials)
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-[#0059bb] border border-blue-100">
              Procurement & Supply Chain
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Raw material requirements, multi-vendor quotation comparison, Owner approval workflow, and Purchase Orders.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => navigate('/vendors')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs sm:text-sm font-semibold transition-colors cursor-pointer shadow-xs"
          >
            <Store size={15} className="text-[#0059bb]" />
            <span>Manage Vendors ({vendors.length})</span>
          </button>

          <button
            onClick={fetchData}
            disabled={isLoading}
            className="p-2 bg-white hover:bg-slate-50 text-slate-700 rounded-xl border border-slate-200 transition-colors cursor-pointer"
            title="Refresh"
          >
            <RefreshCcw size={16} className={isLoading ? 'animate-spin' : ''} />
          </button>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#0059bb] hover:bg-[#004899] text-white text-xs sm:text-sm font-semibold rounded-xl transition-colors cursor-pointer shadow-xs"
          >
            <Plus size={16} />
            <span>Create Requirement</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">Total Orders</span>
          <div className="text-2xl font-bold text-slate-900">{totalPRs}</div>
          <span className="text-[11px] text-slate-400">All procurement cycles</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs">
          <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider block mb-1">RFQ Dispatched</span>
          <div className="text-2xl font-bold text-blue-600">{rfqCount}</div>
          <span className="text-[11px] text-slate-400">Awaiting quotes</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs">
          <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wider block mb-1">Comparing</span>
          <div className="text-2xl font-bold text-indigo-600">{estimatesCount}</div>
          <span className="text-[11px] text-slate-400">Quotes received</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs">
          <span className="text-xs font-semibold text-amber-600 uppercase tracking-wider block mb-1">Owner Approval</span>
          <div className="text-2xl font-bold text-amber-600">{pendingApprovalCount}</div>
          <span className="text-[11px] text-amber-500 font-medium">Action required</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs">
          <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wider block mb-1">Approved / PO</span>
          <div className="text-2xl font-bold text-emerald-600">{approvedCount}</div>
          <span className="text-[11px] text-slate-400">Ready for delivery</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs">
          <span className="text-xs font-semibold text-teal-600 uppercase tracking-wider block mb-1">Inward Pending</span>
          <div className="text-2xl font-bold text-teal-600">{receivingCount}</div>
          <span className="text-[11px] text-slate-400">Goods receiving</span>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search size={15} className="absolute left-3.5 top-3 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search PR No, PO No, Client, Material..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0059bb]/20 focus:border-[#0059bb]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto justify-end">
          <select
            value={partyFilter}
            onChange={(e) => setPartyFilter(e.target.value)}
            className="px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#0059bb]/20 cursor-pointer"
          >
            <option value="all">All Private Clients</option>
            {parties.map(p => (
              <option key={p._id} value={p._id}>{p.name}</option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#0059bb]/20 cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="Draft">Draft</option>
            <option value="Quotation Requested">RFQ Sent</option>
            <option value="Estimates Received">Estimates Received</option>
            <option value="Under Comparison">Under Comparison</option>
            <option value="Pending Owner Approval">Pending Approval</option>
            <option value="Approved">Approved</option>
            <option value="Partially Received">Partially Received</option>
            <option value="Fully Received">Fully Received</option>
            <option value="Payment Pending">Payment Pending</option>
            <option value="Paid">Paid</option>
          </select>

          {(searchQuery || statusFilter !== 'all' || partyFilter !== 'all') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('all');
                setPartyFilter('all');
              }}
              className="text-xs text-rose-600 hover:underline px-1 cursor-pointer"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Main Procurement Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider">
                <th className="px-4 py-3">PR / PO Ref</th>
                <th className="px-4 py-3">Private Client & Quotation</th>
                <th className="px-4 py-3">Required Materials</th>
                <th className="px-4 py-3">Vendor Quotations</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-400">
                    <RefreshCcw size={24} className="animate-spin mx-auto mb-2 text-[#0059bb]" />
                    <p>Loading purchase records...</p>
                  </td>
                </tr>
              ) : filteredPurchases.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-400">
                    <ShoppingBag size={36} className="mx-auto mb-2 text-slate-300" />
                    <p className="font-semibold text-slate-700">No purchase requirements found</p>
                    <p className="text-xs mt-1">Click "Create Requirement" to initiate raw material purchasing.</p>
                  </td>
                </tr>
              ) : (
                filteredPurchases.map((purchase) => {
                  const estimatesCount = purchase.vendorEstimates?.length || 0;
                  const rfqsCount = purchase.vendorQuotationRequests?.length || 0;
                  const isApproved = purchase.status === 'Approved' || purchase.status === 'PO Created' || purchase.status === 'Ordered' || purchase.status === 'Partially Received' || purchase.status === 'Fully Received';

                  return (
                    <tr key={purchase._id} className="hover:bg-slate-50/80 transition-colors">
                      {/* PR / PO Numbers */}
                      <td className="px-4 py-3.5">
                        <div className="font-bold text-slate-900 font-mono text-sm">{purchase.prNo}</div>
                        {purchase.poNo ? (
                          <div className="font-mono text-xs font-bold text-[#0059bb] mt-0.5 flex items-center gap-1">
                            <CheckCircle2 size={12} className="text-emerald-600" />
                            <span>{purchase.poNo}</span>
                          </div>
                        ) : (
                          <div className="text-[10px] text-slate-400 mt-0.5">PO not yet issued</div>
                        )}
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          Req Date: {new Date(purchase.requiredDate).toLocaleDateString('en-IN')}
                        </div>
                      </td>

                      {/* Client & Quotation */}
                      <td className="px-4 py-3.5">
                        <div className="font-bold text-slate-900">{purchase.privatePartyName}</div>
                        {purchase.quotationNo && (
                          <div className="text-[11px] text-[#0059bb] font-mono mt-0.5">
                            Quote: {purchase.quotationNo}
                          </div>
                        )}
                      </td>

                      {/* Materials List */}
                      <td className="px-4 py-3.5">
                        <div className="font-semibold text-slate-800">
                          {purchase.materials?.length} material item(s)
                        </div>
                        <div className="text-slate-500 text-[11px] line-clamp-1 max-w-xs mt-0.5">
                          {purchase.materials?.map(m => `${m.name} (${m.quantity} ${m.unit})`).join(', ')}
                        </div>
                      </td>

                      {/* Vendor Quotations status */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5 text-xs">
                          <span className="font-semibold text-slate-700">{estimatesCount} Received</span>
                          <span className="text-slate-400">/ {rfqsCount} RFQs</span>
                        </div>
                        {purchase.recommendedVendorId && (
                          <div className="text-[11px] text-indigo-700 font-semibold mt-0.5 flex items-center gap-1">
                            <Award size={12} />
                            <span>Rec: {purchase.recommendedVendorId?.name}</span>
                          </div>
                        )}
                        {purchase.ownerApproval?.approvedAmount > 0 && (
                          <div className="text-[11px] text-emerald-700 font-mono font-bold mt-0.5">
                            Approved: ₹{purchase.ownerApproval.approvedAmount.toLocaleString('en-IN')}
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5">
                        {getStatusBadge(purchase.status)}
                      </td>

                      {/* Row Actions */}
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5 flex-wrap">
                          {/* 1. Send RFQ */}
                          {purchase.status === 'Draft' || purchase.status === 'Quotation Requested' ? (
                            <button
                              onClick={() => openRfqModal(purchase)}
                              className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-50 text-[#0059bb] hover:bg-blue-100 flex items-center gap-1 cursor-pointer"
                              title="Send RFQ Emails to Vendors"
                            >
                              <Send size={12} />
                              <span>Send RFQ</span>
                            </button>
                          ) : null}

                          {/* 2. Add Estimate */}
                          {!isApproved && (
                            <button
                              onClick={() => openEstimateModal(purchase)}
                              className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 flex items-center gap-1 cursor-pointer"
                              title="Record Vendor Estimate"
                            >
                              <Plus size={12} />
                              <span>Estimate</span>
                            </button>
                          )}

                          {/* 3. Compare Estimates */}
                          {estimatesCount > 0 && !isApproved && (
                            <button
                              onClick={() => openCompareModal(purchase)}
                              className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 flex items-center gap-1 cursor-pointer"
                              title="Compare Quotes & Submit for Approval"
                            >
                              <Award size={12} />
                              <span>Compare ({estimatesCount})</span>
                            </button>
                          )}

                          {/* 4. Owner Action (If Owner) */}
                          {isOwner && purchase.status === 'Pending Owner Approval' && (
                            <button
                              onClick={() => {
                                setSelectedPurchase(purchase);
                                setRecommendedVendorId(purchase.recommendedVendorId?._id || purchase.recommendedVendorId);
                                setIsOwnerApprovalModalOpen(true);
                              }}
                              className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white flex items-center gap-1 cursor-pointer shadow-xs animate-pulse"
                              title="Review & Approve Purchase"
                            >
                              <span>Approve / Reject</span>
                            </button>
                          )}

                          {/* 5. View/Print PO (If Approved) */}
                          {isApproved && (
                            <button
                              onClick={() => navigate(`/purchase-order-preview?id=${purchase._id}`)}
                              className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 flex items-center gap-1 cursor-pointer"
                              title="Print Purchase Order"
                            >
                              <Printer size={12} />
                              <span>View PO</span>
                            </button>
                          )}

                          {/* 6. Material Receiving (GRN) */}
                          {isApproved && purchase.status !== 'Fully Received' && (
                            <button
                              onClick={() => openGrnModal(purchase)}
                              className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-teal-50 text-teal-700 hover:bg-teal-100 flex items-center gap-1 cursor-pointer"
                              title="Record Material Inward"
                            >
                              <Package size={12} />
                              <span>Receive</span>
                            </button>
                          )}

                          {/* 7. Accounts Payment */}
                          {isApproved && (isAccounts || isOwner) && purchase.status !== 'Paid' && (
                            <button
                              onClick={() => openPaymentModal(purchase)}
                              className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-purple-50 text-purple-700 hover:bg-purple-100 flex items-center gap-1 cursor-pointer"
                              title="Record Accounts Payment"
                            >
                              <DollarSign size={12} />
                              <span>Pay</span>
                            </button>
                          )}

                          {/* Delete if draft */}
                          {purchase.status === 'Draft' && (
                            <button
                              onClick={() => handleDelete(purchase._id, purchase.prNo)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: CREATE PURCHASE REQUIREMENT (PR) */}
      {/* ========================================================================= */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-xl max-w-3xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <ShoppingBag className="text-[#0059bb]" size={18} />
                <span>Create Material Purchase Requirement</span>
              </h3>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleCreatePR} className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
              {/* Private Client & Quotation */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Private Client / Party <span className="text-rose-600">*</span>
                  </label>
                  <select
                    required
                    value={newRequirement.privatePartyId}
                    onChange={(e) => handlePartyChange(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                  >
                    <option value="">Select Private Client</option>
                    {parties.map(p => (
                      <option key={p._id} value={p._id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Related Quotation (Optional)
                  </label>
                  <select
                    value={newRequirement.quotationId}
                    onChange={(e) => {
                      const q = quotations.find(item => item._id === e.target.value);
                      setNewRequirement({
                        ...newRequirement,
                        quotationId: e.target.value,
                        quotationNo: q?.quotationNo || '',
                      });
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                  >
                    <option value="">None / Standalone</option>
                    {quotations.map(q => (
                      <option key={q._id} value={q._id}>{q.quotationNo} ({q.clientName || q.companyName})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Required Delivery Date <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={newRequirement.requiredDate}
                    onChange={(e) => setNewRequirement({ ...newRequirement, requiredDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              {/* Material Items Table */}
              <div className="pt-2 border-t border-slate-100">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm">
                      Required Raw Materials <span className="text-xs text-[#0059bb] font-normal">(Raw Material Master Only)</span>
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Pick from categorized steel raw materials (Angles, Channels, Round Bars, Flats) or type custom specs
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={addMaterialRow}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-[#0059bb] hover:underline cursor-pointer self-start sm:self-auto"
                  >
                    <Plus size={14} /> Add Another Material
                  </button>
                </div>

                {/* Quick Add Raw Material Chips by Category */}
                {materialsMaster.length > 0 && (
                  <div className="p-2.5 bg-blue-50/70 rounded-xl border border-blue-100 mb-3 space-y-1.5">
                    <span className="text-[11px] font-bold text-[#0059bb] uppercase tracking-wider block">
                      ⚡ Quick Add From Raw Material Master:
                    </span>
                    <div className="flex flex-wrap gap-1.5 items-center">
                      {['Angles', 'Channels', 'Round Bars', 'Flats'].map(cat => {
                        const itemsInCat = materialsMaster.filter(m => (m.category || '').toLowerCase() === cat.toLowerCase());
                        if (itemsInCat.length === 0) return null;
                        return (
                          <div key={cat} className="flex items-center gap-1 bg-white/90 px-2 py-1 rounded-lg border border-blue-200/80 text-xs">
                            <span className="font-bold text-slate-700 text-[11px]">{cat}:</span>
                            {itemsInCat.slice(0, 4).map(m => (
                              <button
                                key={m._id}
                                type="button"
                                onClick={() => handleQuickAddRawMaterial(m)}
                                className="px-1.5 py-0.5 rounded bg-blue-100/70 hover:bg-[#0059bb] hover:text-white text-[11px] font-medium text-blue-900 transition-colors cursor-pointer"
                                title={`Add ${m.name} (${m.unit})`}
                              >
                                + {m.size || m.name}
                              </button>
                            ))}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="space-y-2.5">
                  {newRequirement.materials.map((mat, idx) => (
                    <div key={idx} className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/80 grid grid-cols-12 gap-2.5 items-center">
                      <div className="col-span-12 sm:col-span-4">
                        <label className="block text-[10px] text-slate-500 mb-0.5">Pick from Raw Material Master or Type</label>
                        <select
                          value={mat.materialId || ''}
                          onChange={(e) => handlePickMaterial(idx, e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0059bb]/20 focus:border-[#0059bb] mb-1"
                        >
                          <option value="">-- Choose from Raw Material Master --</option>
                          {['Angles', 'Channels', 'Round Bars', 'Flats', 'Plates', 'Pipes / Tubes', 'Beams / Joists', 'Fasteners', 'Other'].map(categoryName => {
                            const items = materialsMaster.filter(m => (m.category || 'Other').toLowerCase() === categoryName.toLowerCase());
                            if (items.length === 0) return null;
                            return (
                              <optgroup key={categoryName} label={`📂 ${categoryName.toUpperCase()}`}>
                                {items.map(m => (
                                  <option key={m._id} value={m._id}>
                                    {m.size ? `${m.category}: ${m.size} — ${m.name}` : m.name} [{m.unit || 'KG'}]
                                  </option>
                                ))}
                              </optgroup>
                            );
                          })}
                        </select>
                        <input
                          type="text"
                          required
                          placeholder="Raw Material Description..."
                          value={mat.name}
                          onChange={(e) => {
                            const updated = [...newRequirement.materials];
                            updated[idx].name = e.target.value;
                            setNewRequirement({ ...newRequirement, materials: updated });
                          }}
                          className="w-full px-2.5 py-1 rounded-lg border border-slate-200 text-xs font-semibold"
                        />
                      </div>

                      <div className="col-span-6 sm:col-span-2">
                        <label className="block text-[10px] text-slate-500 mb-0.5">HSN Code</label>
                        <input
                          type="text"
                          placeholder="HSN"
                          value={mat.hsn}
                          onChange={(e) => {
                            const updated = [...newRequirement.materials];
                            updated[idx].hsn = e.target.value;
                            setNewRequirement({ ...newRequirement, materials: updated });
                          }}
                          className="w-full px-2 py-1.5 rounded-lg border border-slate-200 font-mono text-xs"
                        />
                      </div>

                      <div className="col-span-6 sm:col-span-2">
                        <label className="block text-[10px] text-slate-500 mb-0.5">Quantity</label>
                        <input
                          type="number"
                          required
                          min="0.1"
                          step="any"
                          value={mat.quantity}
                          onChange={(e) => {
                            const updated = [...newRequirement.materials];
                            updated[idx].quantity = Number(e.target.value);
                            setNewRequirement({ ...newRequirement, materials: updated });
                          }}
                          className="w-full px-2 py-1.5 rounded-lg border border-slate-200 text-xs font-bold"
                        />
                      </div>

                      <div className="col-span-6 sm:col-span-1">
                        <label className="block text-[10px] text-slate-500 mb-0.5">Unit</label>
                        <input
                          type="text"
                          value={mat.unit}
                          onChange={(e) => {
                            const updated = [...newRequirement.materials];
                            updated[idx].unit = e.target.value;
                            setNewRequirement({ ...newRequirement, materials: updated });
                          }}
                          className="w-full px-2 py-1.5 rounded-lg border border-slate-200 text-xs"
                        />
                      </div>

                      <div className="col-span-10 sm:col-span-2">
                        <label className="block text-[10px] text-slate-500 mb-0.5">Specification</label>
                        <input
                          type="text"
                          placeholder="Grade, Size..."
                          value={mat.specifications}
                          onChange={(e) => {
                            const updated = [...newRequirement.materials];
                            updated[idx].specifications = e.target.value;
                            setNewRequirement({ ...newRequirement, materials: updated });
                          }}
                          className="w-full px-2 py-1.5 rounded-lg border border-slate-200 text-xs"
                        />
                      </div>

                      <div className="col-span-2 sm:col-span-1 text-right">
                        <button
                          type="button"
                          disabled={newRequirement.materials.length <= 1}
                          onClick={() => removeMaterialRow(idx)}
                          className="p-1.5 text-rose-500 hover:bg-rose-100 rounded-lg cursor-pointer disabled:opacity-30"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Purchase Manager Notes / Special Specifications
                </label>
                <textarea
                  rows="2"
                  placeholder="Testing certificates required, delivery deadline notes..."
                  value={newRequirement.notes}
                  onChange={(e) => setNewRequirement({ ...newRequirement, notes: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 font-semibold text-white bg-[#0059bb] hover:bg-[#004899] rounded-xl cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Creating...' : 'Generate Requirement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: SEND RFQ TO MULTIPLE VENDORS */}
      {/* ========================================================================= */}
      {isRfqModalOpen && selectedPurchase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-xl max-w-xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Send className="text-[#0059bb]" size={16} />
                <span>Send Quotation Request (RFQ) — {selectedPurchase.prNo}</span>
              </h3>
              <button onClick={() => setIsRfqModalOpen(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleSendRfq} className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
              <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100 text-slate-700">
                <div className="font-bold text-[#0059bb] mb-1">Material Requirement Summary:</div>
                <ul className="list-disc list-inside space-y-0.5 text-[11px]">
                  {selectedPurchase.materials?.map((m, idx) => (
                    <li key={idx}>
                      <strong>{m.name}</strong> — {m.quantity} {m.unit} {m.specifications ? `(${m.specifications})` : ''}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="font-bold text-slate-800">
                    Select Vendors to Request Quotation From ({selectedVendorIds.length} Selected)
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      if (selectedVendorIds.length === vendors.length) {
                        setSelectedVendorIds([]);
                      } else {
                        setSelectedVendorIds(vendors.map(v => v._id));
                      }
                    }}
                    className="text-[#0059bb] font-semibold hover:underline cursor-pointer"
                  >
                    {selectedVendorIds.length === vendors.length ? 'Deselect All' : 'Select All'}
                  </button>
                </div>

                {vendors.length === 0 ? (
                  <div className="p-4 text-center text-slate-400 border border-dashed rounded-xl">
                    No active vendors found. Please add vendors in Manage Vendors first.
                  </div>
                ) : (
                  <div className="max-h-52 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100">
                    {vendors.map(v => {
                      const isChecked = selectedVendorIds.includes(v._id);
                      return (
                        <label
                          key={v._id}
                          className={`p-3 flex items-center justify-between hover:bg-slate-50 cursor-pointer transition-colors ${
                            isChecked ? 'bg-blue-50/30' : ''
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedVendorIds(prev => [...prev, v._id]);
                                } else {
                                  setSelectedVendorIds(prev => prev.filter(id => id !== v._id));
                                }
                              }}
                              className="rounded text-[#0059bb] focus:ring-[#0059bb]"
                            />
                            <div>
                              <div className="font-bold text-slate-900">{v.name}</div>
                              <div className="text-[10px] text-slate-400">{v.email} | {v.phone}</div>
                            </div>
                          </div>
                          <span className="text-[10px] text-slate-500 font-mono">{v.city || 'Gujarat'}</span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Additional Notes to Include in RFQ Email
                </label>
                <textarea
                  rows="2"
                  placeholder="e.g. Please reply with GST breakdown and delivery time by tomorrow evening..."
                  value={rfqNotes}
                  onChange={(e) => setRfqNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsRfqModalOpen(false)}
                  className="px-4 py-2 font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || selectedVendorIds.length === 0}
                  className="px-5 py-2 font-semibold text-white bg-[#0059bb] hover:bg-[#004899] rounded-xl cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Send size={13} />
                  <span>{isSubmitting ? 'Sending...' : `Send RFQ to ${selectedVendorIds.length} Vendor(s)`}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: RECORD VENDOR ESTIMATE */}
      {/* ========================================================================= */}
      {isEstimateModalOpen && selectedPurchase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <FileText className="text-[#0059bb]" size={16} />
                <span>Record Vendor Quotation / Estimate — {selectedPurchase.prNo}</span>
              </h3>
              <button onClick={() => setIsEstimateModalOpen(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleSaveEstimate} className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Select Quoting Vendor <span className="text-rose-600">*</span>
                  </label>
                  <select
                    required
                    value={estimateForm.vendorId}
                    onChange={(e) => setEstimateForm({ ...estimateForm, vendorId: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-semibold text-slate-800"
                  >
                    <option value="">Select Vendor</option>
                    {vendors.map(v => (
                      <option key={v._id} value={v._id}>{v.name} ({v.city})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Vendor Quote No / Ref
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. QT-9823"
                    value={estimateForm.quotationNo}
                    onChange={(e) => setEstimateForm({ ...estimateForm, quotationNo: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Delivery Time</label>
                  <input
                    type="text"
                    placeholder="e.g. 2 Days / Ready Stock"
                    value={estimateForm.deliveryTime}
                    onChange={(e) => setEstimateForm({ ...estimateForm, deliveryTime: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Payment Terms</label>
                  <input
                    type="text"
                    placeholder="e.g. 30 Days Net"
                    value={estimateForm.paymentTerms}
                    onChange={(e) => setEstimateForm({ ...estimateForm, paymentTerms: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Validity</label>
                  <input
                    type="text"
                    value={estimateForm.validity}
                    onChange={(e) => setEstimateForm({ ...estimateForm, validity: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              {/* Material Rates Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="px-3 py-2 bg-slate-50 border-b border-slate-200 font-bold text-slate-800">
                  Enter Vendor Rates for Required Materials
                </div>
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50/50 text-slate-500 uppercase text-[10px]">
                    <tr>
                      <th className="p-2.5">Material</th>
                      <th className="p-2.5 text-right w-20">Qty</th>
                      <th className="p-2.5 text-right w-28">Rate (₹)</th>
                      <th className="p-2.5 text-right w-28">Subtotal (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {estimateForm.materialPrices.map((item, idx) => (
                      <tr key={idx}>
                        <td className="p-2.5 font-semibold text-slate-900">{item.name}</td>
                        <td className="p-2.5 text-right font-medium">{item.quantity}</td>
                        <td className="p-2.5 text-right">
                          <input
                            type="number"
                            min="0"
                            step="any"
                            placeholder="Rate"
                            value={item.rate || ''}
                            onChange={(e) => updateEstimateRate(idx, e.target.value)}
                            className="w-24 px-2 py-1 border border-slate-200 rounded text-right font-mono font-bold text-[#0059bb]"
                          />
                        </td>
                        <td className="p-2.5 text-right font-mono font-bold text-slate-900">
                          ₹{item.subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Taxes & Charges Calculation Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">GST Rate (%)</label>
                  <select
                    value={estimateForm.gstPercentage}
                    onChange={(e) => updateEstimateCharges('gstPercentage', e.target.value)}
                    className="w-full px-2 py-1.5 rounded-lg border border-slate-200 bg-white"
                  >
                    <option value="0">0%</option>
                    <option value="5">5%</option>
                    <option value="12">12%</option>
                    <option value="18">18%</option>
                    <option value="28">28%</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Shipping / Freight (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={estimateForm.shippingCharges}
                    onChange={(e) => updateEstimateCharges('shippingCharges', e.target.value)}
                    className="w-full px-2 py-1.5 rounded-lg border border-slate-200 font-mono text-right"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Other Charges (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={estimateForm.otherCharges}
                    onChange={(e) => updateEstimateCharges('otherCharges', e.target.value)}
                    className="w-full px-2 py-1.5 rounded-lg border border-slate-200 font-mono text-right"
                  />
                </div>

                <div className="text-right flex flex-col justify-end">
                  <span className="text-[10px] text-slate-400 block">TOTAL QUOTE:</span>
                  <span className="text-base font-black text-[#0059bb] font-mono">
                    ₹{estimateForm.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Vendor Remarks / Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Rate valid for 1 week only"
                  value={estimateForm.notes}
                  onChange={(e) => setEstimateForm({ ...estimateForm, notes: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsEstimateModalOpen(false)}
                  className="px-4 py-2 font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || estimateForm.totalAmount <= 0}
                  className="px-5 py-2 font-semibold text-white bg-[#0059bb] hover:bg-[#004899] rounded-xl cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : 'Save Estimate'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: SIDE-BY-SIDE VENDOR QUOTATION COMPARISON */}
      {/* ========================================================================= */}
      {isCompareModalOpen && selectedPurchase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Award className="text-[#0059bb]" size={18} />
                  <span>Vendor Quotation Side-by-Side Comparison</span>
                </h3>
                <span className="text-xs text-slate-500">
                  {selectedPurchase.prNo} — Client: <strong>{selectedPurchase.privatePartyName}</strong>
                </span>
              </div>
              <button onClick={() => setIsCompareModalOpen(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer">✕</button>
            </div>

            <div className="p-6 space-y-5 overflow-y-auto flex-1 text-xs">
              {/* Comparison Matrix Table */}
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-900 text-white font-bold text-[11px] uppercase">
                      <th className="p-3">Material Description</th>
                      <th className="p-3 text-center w-20">Req Qty</th>
                      {selectedPurchase.vendorEstimates?.map((est, idx) => (
                        <th key={idx} className="p-3 text-right">
                          <div>{est.vendorName}</div>
                          <div className="text-[10px] text-blue-200 font-normal">Quote #{est.quotationNo || `V${idx+1}`}</div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {/* Material Line Items */}
                    {selectedPurchase.materials?.map((mat, mIdx) => {
                      // Find lowest rate among vendors
                      const rates = selectedPurchase.vendorEstimates?.map(e => {
                        const item = e.materialPrices?.find(p => p.name.toLowerCase() === mat.name.toLowerCase() || p.materialId === mat.materialId);
                        return item?.rate || 0;
                      }) || [];
                      const minRate = Math.min(...rates.filter(r => r > 0));

                      return (
                        <tr key={mIdx} className="hover:bg-slate-50">
                          <td className="p-3 font-semibold text-slate-900">
                            <div>{mat.name}</div>
                            {mat.specifications && <div className="text-[10px] text-slate-400 italic">Spec: {mat.specifications}</div>}
                          </td>
                          <td className="p-3 text-center font-bold text-slate-700">
                            {mat.quantity} {mat.unit}
                          </td>
                          {selectedPurchase.vendorEstimates?.map((est, eIdx) => {
                            const priceItem = est.materialPrices?.find(p => p.name.toLowerCase() === mat.name.toLowerCase() || p.materialId === mat.materialId);
                            const rate = priceItem?.rate || 0;
                            const isL1 = rate > 0 && rate === minRate;

                            return (
                              <td key={eIdx} className={`p-3 text-right font-mono ${isL1 ? 'bg-emerald-50 text-emerald-800 font-bold' : 'text-slate-800'}`}>
                                <div>₹{rate.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                                {isL1 && <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-600 text-white font-bold uppercase">L1 Best</span>}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}

                    {/* Subtotal Row */}
                    <tr className="bg-slate-50 font-bold border-t-2 border-slate-300">
                      <td colSpan="2" className="p-3 text-slate-700">Subtotal (Taxable Value):</td>
                      {selectedPurchase.vendorEstimates?.map((est, idx) => (
                        <td key={idx} className="p-3 text-right font-mono">
                          ₹{est.subtotal?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                      ))}
                    </tr>

                    {/* GST Row */}
                    <tr className="bg-slate-50">
                      <td colSpan="2" className="p-3 text-slate-500">GST Tax Amount:</td>
                      {selectedPurchase.vendorEstimates?.map((est, idx) => (
                        <td key={idx} className="p-3 text-right font-mono text-slate-600">
                          ₹{est.gstAmount?.toLocaleString('en-IN', { minimumFractionDigits: 2 })} ({est.gstPercentage}%)
                        </td>
                      ))}
                    </tr>

                    {/* Shipping Row */}
                    <tr className="bg-slate-50">
                      <td colSpan="2" className="p-3 text-slate-500">Shipping / Transport:</td>
                      {selectedPurchase.vendorEstimates?.map((est, idx) => (
                        <td key={idx} className="p-3 text-right font-mono text-slate-600">
                          ₹{(est.shippingCharges || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                      ))}
                    </tr>

                    {/* Total Value Row */}
                    {(() => {
                      const totals = selectedPurchase.vendorEstimates?.map(e => e.totalAmount) || [];
                      const minTotal = Math.min(...totals.filter(t => t > 0));

                      return (
                        <tr className="bg-blue-50/70 border-t-2 border-slate-300 font-black">
                          <td colSpan="2" className="p-3 text-slate-900 text-sm">TOTAL PURCHASE COST:</td>
                          {selectedPurchase.vendorEstimates?.map((est, idx) => {
                            const isBestTotal = est.totalAmount === minTotal;
                            return (
                              <td key={idx} className={`p-3 text-right font-mono text-sm ${isBestTotal ? 'text-emerald-700 font-black' : 'text-slate-900'}`}>
                                <div>₹{est.totalAmount?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                                {isBestTotal && (
                                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-600 text-white font-bold">
                                    ★ Lowest Total
                                  </span>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })()}

                    {/* Terms Row */}
                    <tr className="bg-slate-50/50">
                      <td colSpan="2" className="p-3 text-slate-500 font-semibold">Delivery Time:</td>
                      {selectedPurchase.vendorEstimates?.map((est, idx) => (
                        <td key={idx} className="p-3 text-right text-slate-700 font-medium">
                          {est.deliveryTime || 'N/A'}
                        </td>
                      ))}
                    </tr>
                    <tr className="bg-slate-50/50">
                      <td colSpan="2" className="p-3 text-slate-500 font-semibold">Payment Terms:</td>
                      {selectedPurchase.vendorEstimates?.map((est, idx) => (
                        <td key={idx} className="p-3 text-right text-slate-700 font-medium">
                          {est.paymentTerms || '30 Days Net'}
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Purchase Manager Recommendation Selection */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                  <CheckSquare size={15} className="text-[#0059bb]" />
                  <span>Purchase Manager Recommendation for Owner</span>
                </h4>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Select Recommended Vendor: <span className="text-rose-600">*</span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {selectedPurchase.vendorEstimates?.map((est) => {
                      const isSelected = recommendedVendorId === (est.vendorId?._id || est.vendorId);
                      return (
                        <div
                          key={est._id}
                          onClick={() => setRecommendedVendorId(est.vendorId?._id || est.vendorId)}
                          className={`p-3 rounded-xl border cursor-pointer transition-all ${
                            isSelected ? 'bg-blue-50 border-[#0059bb] ring-2 ring-[#0059bb]/20' : 'bg-white border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <div className="font-bold text-slate-900">{est.vendorName}</div>
                          <div className="font-mono text-xs font-bold text-[#0059bb] mt-0.5">
                            ₹{est.totalAmount?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </div>
                          <div className="text-[10px] text-slate-500 mt-1">{est.deliveryTime} | {est.paymentTerms}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Reason / Justification for Recommendation (Will be visible to Owner)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. L1 lowest quote with quickest delivery (2 days) and standard 30 days credit"
                    value={recommendationNotes}
                    onChange={(e) => setRecommendationNotes(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                  />
                </div>
              </div>

              {/* Action Bar */}
              <div className="pt-2 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setIsCompareModalOpen(false)}
                  className="px-4 py-2 font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 cursor-pointer"
                >
                  Close
                </button>

                <button
                  type="button"
                  disabled={isSubmitting || !recommendedVendorId}
                  onClick={handleSubmitForApproval}
                  className="px-6 py-2.5 font-bold text-white bg-[#0059bb] hover:bg-[#004899] rounded-xl cursor-pointer disabled:opacity-50 flex items-center gap-2 shadow-xs"
                >
                  <Send size={15} />
                  <span>Send for Owner Approval</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 5: OWNER APPROVAL ACTION (OWNER ONLY) */}
      {/* ========================================================================= */}
      {isOwnerApprovalModalOpen && selectedPurchase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <ShieldCheck size={18} className="text-emerald-400" />
                <span>Executive Purchase Decision (Owner Approval)</span>
              </h3>
              <button onClick={() => setIsOwnerApprovalModalOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">✕</button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <div>PR Ref: <strong className="font-mono text-slate-900">{selectedPurchase.prNo}</strong></div>
                <div>Private Client: <strong className="text-slate-900">{selectedPurchase.privatePartyName}</strong></div>
                {selectedPurchase.quotationNo && <div>Linked Quotation: <strong className="font-mono text-[#0059bb]">{selectedPurchase.quotationNo}</strong></div>}
                <div>
                  Recommended Vendor: <strong className="text-emerald-700">{selectedPurchase.recommendedVendorId?.name}</strong>
                </div>
                {selectedPurchase.recommendationNotes && (
                  <div className="text-slate-600 italic">" {selectedPurchase.recommendationNotes} "</div>
                )}
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-2">Select Decision:</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setOwnerActionType('approve')}
                    className={`py-2 px-3 rounded-xl border font-bold text-center cursor-pointer transition-all ${
                      ownerActionType === 'approve' ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs' : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    ✓ Approve
                  </button>
                  <button
                    type="button"
                    onClick={() => setOwnerActionType('request_changes')}
                    className={`py-2 px-3 rounded-xl border font-bold text-center cursor-pointer transition-all ${
                      ownerActionType === 'request_changes' ? 'bg-amber-600 text-white border-amber-600 shadow-xs' : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    Change Req.
                  </button>
                  <button
                    type="button"
                    onClick={() => setOwnerActionType('reject')}
                    className={`py-2 px-3 rounded-xl border font-bold text-center cursor-pointer transition-all ${
                      ownerActionType === 'reject' ? 'bg-rose-600 text-white border-rose-600 shadow-xs' : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    ✕ Reject
                  </button>
                </div>
              </div>

              {ownerActionType === 'approve' && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Owner Remarks / Instructions for Purchase Order
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Approved. Ensure delivery before Friday."
                    value={ownerRemarks}
                    onChange={(e) => setOwnerRemarks(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                  <p className="text-[11px] text-emerald-700 mt-1">
                    ⚡ Approving this purchase will automatically generate PO number, alert the Purchase Manager, and notify the Accounts Team with payment details.
                  </p>
                </div>
              )}

              {ownerActionType === 'reject' && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Reason for Rejection</label>
                  <input
                    type="text"
                    placeholder="e.g. Budget exceeded / Client put order on hold"
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-rose-200"
                  />
                </div>
              )}

              {ownerActionType === 'request_changes' && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Modifications Required</label>
                  <input
                    type="text"
                    placeholder="e.g. Negotiate 5% discount or check with alternative vendor"
                    value={ownerRemarks}
                    onChange={(e) => setOwnerRemarks(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-amber-200"
                  />
                </div>
              )}

              <div className="pt-2 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsOwnerApprovalModalOpen(false)}
                  className="px-4 py-2 font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleOwnerAction}
                  className="px-5 py-2 font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Processing...' : 'Confirm Decision'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 6: MATERIAL RECEIVING (GRN - GOODS RECEIPT) */}
      {/* ========================================================================= */}
      {isGrnModalOpen && selectedPurchase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Package className="text-[#0059bb]" size={16} />
                <span>Material Inward Receipt (GRN) — {selectedPurchase.poNo || selectedPurchase.prNo}</span>
              </h3>
              <button onClick={() => setIsGrnModalOpen(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleSaveGrn} className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Vendor Delivery Challan No.</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. DC-1049"
                    value={grnForm.challanNo}
                    onChange={(e) => setGrnForm({ ...grnForm, challanNo: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Receipt Date</label>
                  <input
                    type="date"
                    required
                    value={grnForm.receiptDate}
                    onChange={(e) => setGrnForm({ ...grnForm, receiptDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-2">Quantities Received in This Delivery:</label>
                <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
                  {grnForm.receivedItems.map((item, idx) => (
                    <div key={idx} className="p-3 flex items-center justify-between gap-3">
                      <div>
                        <div className="font-bold text-slate-900">{item.name}</div>
                        <div className="text-[10px] text-slate-400">Remaining to Inward: {item.maxAllowed} {item.unit}</div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          min="0"
                          step="any"
                          value={item.quantity}
                          onChange={(e) => {
                            const updated = [...grnForm.receivedItems];
                            updated[idx].quantity = Number(e.target.value);
                            setGrnForm({ ...grnForm, receivedItems: updated });
                          }}
                          className="w-20 px-2 py-1 rounded border border-slate-200 text-right font-bold text-teal-700"
                        />
                        <span className="text-slate-500">{item.unit}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Inward Remarks</label>
                <input
                  type="text"
                  placeholder="Material inspection remarks, vehicle number..."
                  value={grnForm.remarks}
                  onChange={(e) => setGrnForm({ ...grnForm, remarks: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsGrnModalOpen(false)}
                  className="px-4 py-2 font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-xl cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Recording...' : 'Confirm Inward'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 7: ACCOUNTS PAYMENT RECORDING */}
      {/* ========================================================================= */}
      {isPaymentModalOpen && selectedPurchase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <DollarSign className="text-purple-600" size={16} />
                <span>Accounts Payment Entry — {selectedPurchase.poNo}</span>
              </h3>
              <button onClick={() => setIsPaymentModalOpen(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleSavePayment} className="p-6 space-y-4 text-xs">
              <div className="p-3 bg-purple-50 rounded-xl border border-purple-100 space-y-1">
                <div>Vendor: <strong className="text-slate-900">{selectedPurchase.ownerApproval?.approvedVendorName}</strong></div>
                <div>Approved Order Value: <strong className="font-mono text-purple-700">₹{(selectedPurchase.ownerApproval?.approvedAmount || 0).toLocaleString('en-IN')}</strong></div>
                <div>Already Paid: <strong className="font-mono text-emerald-700">₹{(selectedPurchase.accountsPayment?.paidAmount || 0).toLocaleString('en-IN')}</strong></div>
                <div>Remaining Balance: <strong className="font-mono text-rose-600 font-bold">₹{(selectedPurchase.accountsPayment?.balanceAmount || selectedPurchase.ownerApproval?.approvedAmount || 0).toLocaleString('en-IN')}</strong></div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Payment Amount (₹) <span className="text-rose-600">*</span>
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  step="any"
                  value={paymentForm.amount}
                  onChange={(e) => setPaymentForm({ ...paymentForm, amount: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono font-bold text-purple-700 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Payment Method</label>
                  <select
                    value={paymentForm.paymentMethod}
                    onChange={(e) => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                  >
                    <option value="Bank Transfer">Bank Transfer (NEFT/RTGS)</option>
                    <option value="UPI">UPI</option>
                    <option value="Cheque">Cheque</option>
                    <option value="Cash">Cash</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">UTR / Ref No.</label>
                  <input
                    type="text"
                    placeholder="UTR / Cheque No."
                    value={paymentForm.reference}
                    onChange={(e) => setPaymentForm({ ...paymentForm, reference: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Payment Remarks</label>
                <input
                  type="text"
                  placeholder="Notes..."
                  value={paymentForm.notes}
                  onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="px-4 py-2 font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || paymentForm.amount <= 0}
                  className="px-5 py-2 font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Recording...' : 'Confirm Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
