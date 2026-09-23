import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { 
  Building2, 
  Receipt, 
  CreditCard, 
  ArrowUpRight, 
  ArrowDownLeft, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Printer, 
  Share2, 
  Mail, 
  Phone, 
  Calendar, 
  Search, 
  Plus, 
  Trash2, 
  ExternalLink, 
  RefreshCw, 
  Filter, 
  ChevronRight, 
  DollarSign, 
  FileText, 
  Send,
  X,
  MessageCircle,
  TrendingDown,
  TrendingUp,
  SlidersHorizontal
} from 'lucide-react';
import { 
  getPrivateParties, 
  getPrivatePartyLedger, 
  getAllPartiesLedgerSummary, 
  recordPrivatePayment, 
  deletePrivatePayment, 
  sendLedgerEmail 
} from '../services/api';
import toast from 'react-hot-toast';

export default function PrivatePartyLedger() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Parties & Ledger state
  const [parties, setParties] = useState([]);
  const [selectedPartyId, setSelectedPartyId] = useState(searchParams.get('partyId') || '');
  const [ledgerData, setLedgerData] = useState(null);
  const [allPartiesSummary, setAllPartiesSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('statement'); // 'statement' | 'invoices' | 'payments' | 'all-parties'

  // Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Payment modal state
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    invoiceId: '',
    amount: '',
    paymentDate: new Date().toISOString().split('T')[0],
    paymentMethod: 'NEFT',
    reference: '',
    bankDetails: '',
    notes: ''
  });
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);

  // Email share modal state
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [emailForm, setEmailForm] = useState({
    recipientEmail: '',
    subject: '',
    message: ''
  });
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  // Load parties list on mount
  useEffect(() => {
    loadParties();
    loadAllSummary();
  }, []);

  // When selectedPartyId changes, fetch party ledger
  useEffect(() => {
    if (selectedPartyId) {
      fetchLedger(selectedPartyId);
      setSearchParams({ partyId: selectedPartyId });
    }
  }, [selectedPartyId]);

  const loadParties = async () => {
    try {
      const data = await getPrivateParties();
      const list = data || [];
      setParties(list);
      if (!selectedPartyId && list.length > 0) {
        setSelectedPartyId(list[0]._id);
      }
    } catch (err) {
      console.error('Failed to load private parties:', err);
      toast.error('Could not load parties list');
    }
  };

  const loadAllSummary = async () => {
    try {
      const res = await getAllPartiesLedgerSummary();
      if (res?.success) {
        setAllPartiesSummary(res);
      }
    } catch (err) {
      console.warn('All parties summary notice:', err.message);
    }
  };

  const fetchLedger = async (partyId) => {
    try {
      setLoading(true);
      const res = await getPrivatePartyLedger(partyId);
      if (res?.success) {
        setLedgerData(res);
        setEmailForm(prev => ({
          ...prev,
          recipientEmail: res.party?.email || '',
          subject: `Statement of Account (Khata) - ${res.party?.name} | Neeta Engineering Works`,
          message: `Dear ${res.party?.name},\n\nPlease find below your updated Statement of Account (Khata). As of today, your outstanding balance is ₹${res.summary?.totalOutstandingAmount?.toLocaleString('en-IN')}.\n\nThank you for your business!`
        }));
      } else {
        toast.error(res?.message || 'Failed to fetch ledger details');
      }
    } catch (err) {
      console.error('Ledger fetch error:', err);
      toast.error(err.response?.data?.message || 'Failed to load party ledger');
    } finally {
      setLoading(false);
    }
  };

  // Filtered transactions for statement view
  const filteredStatement = useMemo(() => {
    if (!ledgerData?.statement) return [];
    return ledgerData.statement.filter(item => {
      const matchesSearch = 
        !searchTerm ||
        item.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.refNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.reference?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.paymentMethod?.toLowerCase().includes(searchTerm.toLowerCase());

      const itemDate = item.date || '';
      const matchesStart = !startDate || itemDate >= startDate;
      const matchesEnd = !endDate || itemDate <= endDate;

      return matchesSearch && matchesStart && matchesEnd;
    });
  }, [ledgerData, searchTerm, startDate, endDate]);

  // Handle open payment modal
  const openPaymentModal = (invoice = null) => {
    if (invoice) {
      const bal = invoice.balanceAmount !== undefined 
        ? invoice.balanceAmount 
        : Math.max(0, invoice.totalAmount - (invoice.paidAmount || 0));
      setPaymentForm({
        invoiceId: invoice._id,
        amount: bal > 0 ? bal : '',
        paymentDate: new Date().toISOString().split('T')[0],
        paymentMethod: 'NEFT',
        reference: '',
        bankDetails: '',
        notes: ''
      });
    } else {
      // Find first unpaid invoice if available
      const unpaidInv = ledgerData?.invoices?.find(i => (i.balanceAmount || i.totalAmount - i.paidAmount) > 0);
      setPaymentForm({
        invoiceId: unpaidInv ? unpaidInv._id : (ledgerData?.invoices?.[0]?._id || ''),
        amount: unpaidInv ? (unpaidInv.balanceAmount || unpaidInv.totalAmount - unpaidInv.paidAmount) : '',
        paymentDate: new Date().toISOString().split('T')[0],
        paymentMethod: 'NEFT',
        reference: '',
        bankDetails: '',
        notes: ''
      });
    }
    setIsPaymentModalOpen(true);
  };

  // Submit payment handler
  const handleRecordPayment = async (e) => {
    e.preventDefault();
    if (!paymentForm.invoiceId) {
      toast.error('Please select an invoice to record payment against');
      return;
    }
    const amt = Number(paymentForm.amount);
    if (!amt || amt <= 0) {
      toast.error('Please enter a valid payment amount greater than zero');
      return;
    }

    try {
      setIsSubmittingPayment(true);
      const res = await recordPrivatePayment(paymentForm);
      if (res?.success) {
        toast.success(res.message || 'Payment recorded successfully!');
        setIsPaymentModalOpen(false);
        // Refresh current ledger and overall summary
        await fetchLedger(selectedPartyId);
        loadAllSummary();
      } else {
        toast.error(res?.message || 'Failed to record payment');
      }
    } catch (err) {
      console.error('Payment error:', err);
      toast.error(err.response?.data?.message || err.message || 'Failed to record payment');
    } finally {
      setIsSubmittingPayment(false);
    }
  };

  // Delete payment handler
  const handleDeletePayment = async (paymentId) => {
    if (!window.confirm('Are you sure you want to delete this payment receipt? The invoice balance will be restored.')) {
      return;
    }

    try {
      const res = await deletePrivatePayment(paymentId);
      if (res?.success) {
        toast.success('Payment receipt removed and balance restored');
        await fetchLedger(selectedPartyId);
        loadAllSummary();
      } else {
        toast.error(res?.message || 'Failed to delete payment');
      }
    } catch (err) {
      console.error('Delete payment error:', err);
      toast.error(err.response?.data?.message || 'Failed to delete payment');
    }
  };

  // Send Email Handler
  const handleSendEmail = async (e) => {
    e.preventDefault();
    if (!emailForm.recipientEmail) {
      toast.error('Please enter recipient email address');
      return;
    }

    try {
      setIsSendingEmail(true);
      const res = await sendLedgerEmail(selectedPartyId, emailForm);
      if (res?.success) {
        toast.success(res.message || 'Statement of Account emailed successfully!');
        setIsEmailModalOpen(false);
      } else {
        toast.error(res?.message || 'Failed to send email');
      }
    } catch (err) {
      console.error('Send email error:', err);
      toast.error(err.response?.data?.message || 'Failed to send ledger statement email');
    } finally {
      setIsSendingEmail(false);
    }
  };

  // Share via WhatsApp
  const handleWhatsAppShare = () => {
    if (!ledgerData?.party) return;
    const p = ledgerData.party;
    const s = ledgerData.summary;

    const messageText = 
`*STATEMENT OF ACCOUNT / KHATA SUMMARY*
*Neeta Engineering Works*

Client: *${p.name}*
${p.gst ? `GSTIN: ${p.gst}\n` : ''}Date: ${new Date().toLocaleDateString('en-IN')}

📊 *Summary:*
• Total Invoices (${s.totalInvoicesCount}): ₹${s.totalInvoicesAmount.toLocaleString('en-IN')}
• Payments Received (${s.totalPaymentsCount}): ₹${s.totalPaidAmount.toLocaleString('en-IN')}
• *Outstanding Balance Due: ₹${s.totalOutstandingAmount.toLocaleString('en-IN')}*

Status: ${s.totalOutstandingAmount <= 0 ? '✅ FULLY SETTLED' : '⏳ PAYMENT DUE'}

_Please contact us for any payment queries or detailed invoice copies._`;

    const cleanPhone = (p.phone || '').replace(/[^0-9]/g, '');
    const phoneWithCountry = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    const url = `https://wa.me/${phoneWithCountry}?text=${encodeURIComponent(messageText)}`;
    window.open(url, '_blank');
  };

  const selectedInvoice = ledgerData?.invoices?.find(i => i._id === paymentForm.invoiceId);
  const selectedInvoiceBalance = selectedInvoice 
    ? (selectedInvoice.balanceAmount !== undefined ? selectedInvoice.balanceAmount : Math.max(0, selectedInvoice.totalAmount - selectedInvoice.paidAmount))
    : 0;

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6 print:p-0 print:m-0 print:max-w-none">
      
      {/* Top Header & Party Selector (Hidden during print) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200 print:hidden">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-blue-50 text-[#0059bb] border border-blue-200">
              Private Clients Only
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3 mt-1">
            <CreditCard size={28} className="text-[#0059bb]" /> Party Ledger & Payment Tracking (Khata)
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Manage client payments, track outstanding balances, and view transaction history for private parties.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => openPaymentModal()}
            disabled={!ledgerData || ledgerData?.summary?.totalOutstandingAmount <= 0 && ledgerData?.invoices?.length === 0}
            className="px-4 py-2.5 bg-[#0059bb] hover:bg-[#004c9e] text-white rounded-xl text-xs sm:text-sm font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Plus size={16} /> Record Payment
          </button>
          <button
            onClick={() => window.print()}
            className="px-3.5 py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
            title="Print Statement of Account"
          >
            <Printer size={16} /> Print
          </button>
          <button
            onClick={handleWhatsAppShare}
            className="px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
            title="Share summary via WhatsApp"
          >
            <MessageCircle size={16} /> WhatsApp
          </button>
          <button
            onClick={() => setIsEmailModalOpen(true)}
            className="px-3.5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
            title="Email Statement PDF"
          >
            <Mail size={16} /> Email PDF
          </button>
        </div>
      </div>

      {/* Printable Letterhead (Only visible during print) */}
      <div className="hidden print:block border-b-2 border-[#0059bb] pb-4 mb-6">
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-black tracking-wider text-[#0059bb]">NEETA ENGINEERING WORKS</h1>
          <p className="text-xs text-slate-600">
            Industrial Machinery, Electrical Contracting & Fabrication Works
          </p>
          <p className="text-[11px] text-slate-500">
            GIDC Industrial Area, Deesa / Banaskantha, Gujarat | GSTIN: <strong>24ABHPP5386L1Z3</strong> | E-Mail: neeta5788@gmail.com
          </p>
          <h2 className="text-base font-bold text-slate-900 mt-3 uppercase tracking-wider underline">
            STATEMENT OF ACCOUNT / PARTY LEDGER (KHATA)
          </h2>
          <p className="text-[11px] text-slate-500">
            Statement Date: {new Date().toLocaleDateString('en-IN')}
          </p>
        </div>
      </div>

      {/* Party Selector & Profile Card */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-[#0059bb]" />
            <h2 className="font-bold text-sm text-slate-900">Select Private Party</h2>
          </div>

          {/* Party Dropdown */}
          <div className="w-full sm:w-80">
            <select
              value={selectedPartyId}
              onChange={(e) => setSelectedPartyId(e.target.value)}
              className="w-full px-3 py-2 text-sm font-semibold rounded-xl border border-slate-300 bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0059bb]/20 focus:border-[#0059bb]"
            >
              {parties.map(p => (
                <option key={p._id} value={p._id}>
                  {p.name} {p.gst ? `(${p.gst})` : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Selected Party Quick Profile */}
        {ledgerData?.party && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
              <span className="text-slate-400 block font-semibold text-[10px] uppercase">Party / Client Name</span>
              <span className="font-bold text-slate-900 text-sm">{ledgerData.party.name}</span>
              {ledgerData.party.contactPerson && (
                <span className="text-slate-500 block mt-0.5">👤 {ledgerData.party.contactPerson}</span>
              )}
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
              <span className="text-slate-400 block font-semibold text-[10px] uppercase">GSTIN & PAN</span>
              <span className="font-mono font-bold text-[#0059bb] block">
                {ledgerData.party.gst || 'UNREGISTERED'}
              </span>
              <span className="text-slate-600 block mt-0.5">
                PAN: {ledgerData.party.pan || (ledgerData.party.gst?.length >= 12 ? ledgerData.party.gst.substring(2, 12) : '—')}
              </span>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
              <span className="text-slate-400 block font-semibold text-[10px] uppercase">Contact Details</span>
              <span className="text-slate-800 block">📞 {ledgerData.party.phone || 'No phone registered'}</span>
              <span className="text-slate-800 block truncate">✉️ {ledgerData.party.email || 'No email registered'}</span>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
              <span className="text-slate-400 block font-semibold text-[10px] uppercase">Billing Address</span>
              <span className="text-slate-700 block truncate">{ledgerData.party.address || '—'}</span>
              <span className="text-slate-500 block">
                {[ledgerData.party.city, ledgerData.party.state].filter(Boolean).join(', ')} {ledgerData.party.pincode ? `- ${ledgerData.party.pincode}` : ''}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Top KPI Summary Cards */}
      {ledgerData?.summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Total Invoices */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Invoices</span>
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#0059bb] flex items-center justify-center">
                <Receipt size={18} />
              </div>
            </div>
            <div className="mt-2 text-2xl font-black text-slate-900 tracking-tight">
              ₹{ledgerData.summary.totalInvoicesAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
            <div className="mt-1 text-[11px] text-slate-500 flex items-center justify-between">
              <span>{ledgerData.summary.totalInvoicesCount} Total Billed Invoices</span>
              <span className="font-semibold text-slate-700">{ledgerData.summary.fullyPaidInvoicesCount} Paid</span>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-500"></div>
          </div>

          {/* Payment Received */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Payment Received</span>
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <ArrowDownLeft size={18} />
              </div>
            </div>
            <div className="mt-2 text-2xl font-black text-emerald-600 tracking-tight">
              ₹{ledgerData.summary.totalPaidAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
            <div className="mt-1 text-[11px] text-slate-500 flex items-center justify-between">
              <span>{ledgerData.summary.totalPaymentsCount} Payment Receipts</span>
              <span className="font-bold text-emerald-600">
                {ledgerData.summary.totalInvoicesAmount > 0 
                  ? `${Math.round((ledgerData.summary.totalPaidAmount / ledgerData.summary.totalInvoicesAmount) * 100)}% Settled`
                  : '100%'}
              </span>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-500"></div>
          </div>

          {/* Outstanding Balance */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Outstanding Balance</span>
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                ledgerData.summary.totalOutstandingAmount > 0 ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'
              }`}>
                {ledgerData.summary.totalOutstandingAmount > 0 ? <TrendingUp size={18} /> : <CheckCircle2 size={18} />}
              </div>
            </div>
            <div className={`mt-2 text-2xl font-black tracking-tight ${
              ledgerData.summary.totalOutstandingAmount > 0 ? 'text-rose-600' : 'text-emerald-600'
            }`}>
              ₹{ledgerData.summary.totalOutstandingAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
            <div className="mt-1 text-[11px] flex items-center justify-between">
              <span className="text-slate-500">
                {ledgerData.summary.totalOutstandingAmount > 0 
                  ? `${ledgerData.summary.unpaidInvoicesCount + ledgerData.summary.partiallyPaidInvoicesCount} Invoices Due`
                  : 'Account Fully Cleared'}
              </span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                ledgerData.summary.totalOutstandingAmount > 0 ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
              }`}>
                {ledgerData.summary.totalOutstandingAmount > 0 ? 'Due' : 'Settled'}
              </span>
            </div>
            <div className={`absolute bottom-0 left-0 right-0 h-1 ${
              ledgerData.summary.totalOutstandingAmount > 0 ? 'bg-rose-500' : 'bg-emerald-500'
            }`}></div>
          </div>

          {/* Settlement Progress */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
            <div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Recovery Ratio</span>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-black text-slate-900">
                  {ledgerData.summary.totalInvoicesAmount > 0 
                    ? `${Math.round((ledgerData.summary.totalPaidAmount / ledgerData.summary.totalInvoicesAmount) * 100)}%`
                    : '100%'}
                </span>
                <span className="text-xs text-slate-500">Collected</span>
              </div>
            </div>

            <div className="mt-3">
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-[#0059bb] rounded-full transition-all duration-500"
                  style={{ 
                    width: `${Math.min(100, Math.round((ledgerData.summary.totalPaidAmount / (ledgerData.summary.totalInvoicesAmount || 1)) * 100))}%` 
                  }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-mono">
                <span>Paid: ₹{Math.round(ledgerData.summary.totalPaidAmount).toLocaleString('en-IN')}</span>
                <span>Total: ₹{Math.round(ledgerData.summary.totalInvoicesAmount).toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs Navigation (Hidden during print) */}
      <div className="flex items-center justify-between border-b border-slate-200 flex-wrap gap-2 print:hidden">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('statement')}
            className={`px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'statement'
                ? 'border-[#0059bb] text-[#0059bb]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Clock size={16} /> Ledger Statement (Khata)
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
              {ledgerData?.statement?.length || 0}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('invoices')}
            className={`px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'invoices'
                ? 'border-[#0059bb] text-[#0059bb]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Receipt size={16} /> Invoices Breakdown
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
              {ledgerData?.invoices?.length || 0}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('payments')}
            className={`px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'payments'
                ? 'border-[#0059bb] text-[#0059bb]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <CreditCard size={16} /> Payment Receipts
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
              {ledgerData?.payments?.length || 0}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('all-parties')}
            className={`px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'all-parties'
                ? 'border-[#0059bb] text-[#0059bb]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Building2 size={16} /> All Parties Balances
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
              {allPartiesSummary?.parties?.length || parties.length}
            </span>
          </button>
        </div>

        {/* Filters */}
        {activeTab === 'statement' && (
          <div className="flex items-center gap-2 py-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search statement..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#0059bb]/20 w-40 sm:w-52"
              />
            </div>

            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="px-2 py-1 text-xs rounded-xl border border-slate-300 bg-white text-slate-700"
              title="Filter from Date"
            />
            <span className="text-xs text-slate-400">to</span>
            <input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="px-2 py-1 text-xs rounded-xl border border-slate-300 bg-white text-slate-700"
              title="Filter to Date"
            />

            {(searchTerm || startDate || endDate) && (
              <button
                onClick={() => { setSearchTerm(''); setStartDate(''); setEndDate(''); }}
                className="text-[11px] text-rose-500 hover:underline px-1 cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>
        )}
      </div>

      {/* ============================================================
          TAB 1: CHRONOLOGICAL STATEMENT OF ACCOUNT (KHATA)
         ============================================================ */}
      {activeTab === 'statement' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden print:border-none print:shadow-none">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between print:bg-white print:border-none">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Transaction History & Running Balance</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Every invoice is added as Debit; every payment received is credited, with continuous running balance.
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-400 font-semibold block">CURRENT OUTSTANDING</span>
              <span className={`text-base font-black ${ledgerData?.summary?.totalOutstandingAmount > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                ₹{ledgerData?.summary?.totalOutstandingAmount?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100/75 text-slate-700 font-bold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                  <th className="p-3 w-28">Date</th>
                  <th className="p-3 w-24">Type</th>
                  <th className="p-3 w-32">Ref / Voucher</th>
                  <th className="p-3">Particulars & Remarks</th>
                  <th className="p-3 w-28 text-right text-rose-600">Debit (₹)</th>
                  <th className="p-3 w-28 text-right text-emerald-600">Credit (₹)</th>
                  <th className="p-3 w-32 text-right text-slate-900">Balance (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStatement.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="p-12 text-center text-slate-400">
                      <CreditCard className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                      No transactions recorded for this party yet.
                    </td>
                  </tr>
                ) : (
                  filteredStatement.map((tx, idx) => (
                    <tr key={`${tx.id}-${idx}`} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3 font-mono text-slate-600 whitespace-nowrap">{tx.date}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          tx.type === 'INVOICE' 
                            ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}>
                          {tx.type}
                        </span>
                      </td>
                      <td className="p-3 font-mono font-semibold text-slate-800">
                        {tx.type === 'INVOICE' ? (
                          <button
                            onClick={() => navigate(`/private-invoice?id=${tx.id}`)}
                            className="text-[#0059bb] hover:underline flex items-center gap-1 cursor-pointer"
                            title="View Invoice"
                          >
                            {tx.refNo} <ExternalLink size={12} />
                          </button>
                        ) : (
                          <span>{tx.refNo}</span>
                        )}
                      </td>
                      <td className="p-3 text-slate-700">
                        <div className="font-medium">{tx.description}</div>
                        {tx.reference && tx.reference !== '—' && (
                          <div className="text-[11px] text-slate-400 font-mono mt-0.5">Ref: {tx.reference}</div>
                        )}
                        {tx.notes && (
                          <div className="text-[11px] text-slate-500 italic mt-0.5">Note: {tx.notes}</div>
                        )}
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-rose-600">
                        {tx.debit > 0 ? `₹${tx.debit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '—'}
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-emerald-600">
                        {tx.credit > 0 ? `₹${tx.credit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '—'}
                      </td>
                      <td className="p-3 text-right font-mono font-black text-slate-900 bg-slate-50/50">
                        ₹{tx.runningBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              {filteredStatement.length > 0 && (
                <tfoot>
                  <tr className="bg-slate-100 font-bold text-slate-900 border-t-2 border-slate-300">
                    <td colSpan="4" className="p-3 text-right uppercase tracking-wider text-xs">Total / Balance Due:</td>
                    <td className="p-3 text-right font-mono text-rose-600 text-xs sm:text-sm">
                      ₹{ledgerData?.summary?.totalInvoicesAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-3 text-right font-mono text-emerald-600 text-xs sm:text-sm">
                      ₹{ledgerData?.summary?.totalPaidAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-3 text-right font-mono text-slate-900 text-sm sm:text-base bg-slate-200">
                      ₹{ledgerData?.summary?.totalOutstandingAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      )}

      {/* ============================================================
          TAB 2: INVOICES BREAKDOWN & PAYMENT STATUS
         ============================================================ */}
      {activeTab === 'invoices' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between flex-wrap gap-2">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Private Invoices & Payment Status</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Overview of all issued invoices for {ledgerData?.party?.name} and their individual payment progress.
              </p>
            </div>
            <button
              onClick={() => openPaymentModal()}
              className="px-3 py-1.5 bg-[#0059bb] hover:bg-[#004c9e] text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Plus size={14} /> Record Payment
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100/75 text-slate-700 font-bold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                  <th className="p-3">Invoice No</th>
                  <th className="p-3">Date</th>
                  <th className="p-3 text-right">Invoice Amount</th>
                  <th className="p-3 text-right text-emerald-600">Paid</th>
                  <th className="p-3 text-right text-rose-600">Balance</th>
                  <th className="p-3 text-center">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {!ledgerData?.invoices || ledgerData.invoices.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="p-12 text-center text-slate-400">
                      No invoices found for this party.
                    </td>
                  </tr>
                ) : (
                  ledgerData.invoices.map((inv) => {
                    const status = inv.paymentStatus || 'Unpaid';
                    const bal = inv.balanceAmount !== undefined ? inv.balanceAmount : Math.max(0, inv.totalAmount - inv.paidAmount);
                    const percent = Math.min(100, Math.round(((inv.paidAmount || 0) / (inv.totalAmount || 1)) * 100));

                    return (
                      <tr key={inv._id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-3">
                          <span className="font-mono font-bold text-slate-900">{inv.invoiceNo}</span>
                          <span className="block text-[11px] text-slate-400">{inv.itemsCount} items</span>
                        </td>
                        <td className="p-3 font-mono text-slate-600 whitespace-nowrap">{inv.date}</td>
                        <td className="p-3 text-right font-mono font-bold text-slate-900">
                          ₹{inv.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="p-3 text-right font-mono font-bold text-emerald-600">
                          ₹{(inv.paidAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="p-3 text-right font-mono font-bold text-rose-600">
                          ₹{bal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="p-3 text-center">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1 ${
                            status === 'Fully Paid' 
                              ? 'bg-emerald-100 text-emerald-800' 
                              : status === 'Partially Paid' 
                              ? 'bg-amber-100 text-amber-800' 
                              : 'bg-rose-100 text-rose-800'
                          }`}>
                            {status === 'Fully Paid' && <CheckCircle2 size={11} />}
                            {status === 'Partially Paid' && <Clock size={11} />}
                            {status === 'Unpaid' && <AlertCircle size={11} />}
                            {status}
                          </span>
                          <div className="w-20 mx-auto bg-slate-100 h-1.5 rounded-full mt-1.5 overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${status === 'Fully Paid' ? 'bg-emerald-500' : status === 'Partially Paid' ? 'bg-amber-500' : 'bg-rose-500'}`}
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                        </td>
                        <td className="p-3 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            {bal > 0 && (
                              <button
                                onClick={() => openPaymentModal(inv)}
                                className="px-2.5 py-1 bg-blue-50 text-[#0059bb] hover:bg-blue-100 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                              >
                                + Add Payment
                              </button>
                            )}
                            <button
                              onClick={() => navigate(`/private-invoice?id=${inv._id}`)}
                              className="p-1.5 text-slate-500 hover:text-[#0059bb] hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                              title="View Invoice"
                            >
                              <ExternalLink size={15} />
                            </button>
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
      )}

      {/* ============================================================
          TAB 3: PAYMENT RECEIPTS HISTORY
         ============================================================ */}
      {activeTab === 'payments' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between flex-wrap gap-2">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Payment Receipts History</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                All individual credits and payments recorded for {ledgerData?.party?.name}.
              </p>
            </div>
            <button
              onClick={() => openPaymentModal()}
              className="px-3 py-1.5 bg-[#0059bb] hover:bg-[#004c9e] text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Plus size={14} /> Record Payment
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100/75 text-slate-700 font-bold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                  <th className="p-3">Date</th>
                  <th className="p-3">Invoice No</th>
                  <th className="p-3 text-right">Amount Paid</th>
                  <th className="p-3">Payment Method</th>
                  <th className="p-3">UTR / Reference No</th>
                  <th className="p-3">Notes</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {!ledgerData?.payments || ledgerData.payments.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="p-12 text-center text-slate-400">
                      No payment receipts found for this party.
                    </td>
                  </tr>
                ) : (
                  ledgerData.payments.map((p) => (
                    <tr key={p._id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3 font-mono text-slate-600 whitespace-nowrap">{p.paymentDate}</td>
                      <td className="p-3 font-mono font-bold text-slate-900">
                        {p.invoiceNo ? `Inv #${p.invoiceNo}` : '—'}
                      </td>
                      <td className="p-3 text-right font-mono font-black text-emerald-600">
                        ₹{p.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-100 text-slate-800 border border-slate-200">
                          {p.paymentMethod}
                        </span>
                      </td>
                      <td className="p-3 font-mono text-slate-700">
                        {p.reference || '—'}
                        {p.bankDetails && <div className="text-[11px] text-slate-400">{p.bankDetails}</div>}
                      </td>
                      <td className="p-3 text-slate-500 italic">
                        {p.notes || '—'}
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => handleDeletePayment(p._id)}
                          className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Delete Payment & Restore Balance"
                        >
                          <Trash2 size={15} />
                        </button>
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
          TAB 4: ALL PARTIES BALANCES OVERVIEW
         ============================================================ */}
      {activeTab === 'all-parties' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between flex-wrap gap-2">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Private Parties Balance Sheet</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                High-level balance and outstanding overview across all private clients in master data.
              </p>
            </div>
            {allPartiesSummary?.overall && (
              <div className="flex items-center gap-4 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px]">TOTAL INVOICED</span>
                  <span className="font-bold text-slate-900">₹{allPartiesSummary.overall.totalInvoiced.toLocaleString('en-IN')}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">TOTAL COLLECTED</span>
                  <span className="font-bold text-emerald-600">₹{allPartiesSummary.overall.totalPaid.toLocaleString('en-IN')}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">TOTAL OUTSTANDING</span>
                  <span className="font-bold text-rose-600">₹{allPartiesSummary.overall.totalOutstanding.toLocaleString('en-IN')}</span>
                </div>
              </div>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100/75 text-slate-700 font-bold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                  <th className="p-3">Party Name</th>
                  <th className="p-3">GSTIN / State</th>
                  <th className="p-3 text-center">Invoices</th>
                  <th className="p-3 text-right">Total Invoiced</th>
                  <th className="p-3 text-right text-emerald-600">Total Paid</th>
                  <th className="p-3 text-right text-rose-600">Outstanding Balance</th>
                  <th className="p-3 text-center">Status</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {!allPartiesSummary?.parties || allPartiesSummary.parties.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="p-12 text-center text-slate-400">
                      No parties found.
                    </td>
                  </tr>
                ) : (
                  allPartiesSummary.parties.map((p) => (
                    <tr key={p.partyId} className={`hover:bg-slate-50/80 transition-colors ${p.partyId === selectedPartyId ? 'bg-blue-50/40' : ''}`}>
                      <td className="p-3">
                        <div className="font-bold text-slate-900">{p.partyName}</div>
                        {p.contactPerson && <div className="text-[11px] text-slate-400">👤 {p.contactPerson}</div>}
                      </td>
                      <td className="p-3 font-mono text-slate-600">
                        {p.gst || 'Unregistered'}
                        {p.state && <div className="text-[11px] text-slate-400">{p.state}</div>}
                      </td>
                      <td className="p-3 text-center font-semibold text-slate-700">
                        {p.invoicesCount} bills
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-slate-900">
                        ₹{p.totalInvoiced.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-emerald-600">
                        ₹{p.totalPaid.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-3 text-right font-mono font-black text-rose-600">
                        ₹{p.outstandingBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          p.status === 'Clear' ? 'bg-emerald-100 text-emerald-800' : p.status === 'Partial' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                        }`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => {
                            setSelectedPartyId(p.partyId);
                            setActiveTab('statement');
                          }}
                          className="px-2.5 py-1 bg-blue-50 text-[#0059bb] hover:bg-blue-100 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                        >
                          View Khata →
                        </button>
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
          MODAL: RECORD PAYMENT
         ============================================================ */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 bg-[#0059bb] text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard size={20} />
                <h3 className="font-bold text-base">Record Payment Receipt</h3>
              </div>
              <button 
                onClick={() => setIsPaymentModalOpen(false)}
                className="p-1 hover:bg-white/20 rounded-lg transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleRecordPayment} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Party / Client
                </label>
                <input
                  type="text"
                  disabled
                  value={ledgerData?.party?.name || ''}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 bg-slate-100 text-slate-700 font-semibold"
                />
              </div>

              {/* Invoice Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Select Invoice to Credit <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={paymentForm.invoiceId}
                  onChange={(e) => {
                    const invId = e.target.value;
                    const inv = ledgerData?.invoices?.find(i => i._id === invId);
                    const bal = inv ? (inv.balanceAmount !== undefined ? inv.balanceAmount : Math.max(0, inv.totalAmount - inv.paidAmount)) : '';
                    setPaymentForm({
                      ...paymentForm,
                      invoiceId: invId,
                      amount: bal > 0 ? bal : paymentForm.amount
                    });
                  }}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0059bb]/20 focus:border-[#0059bb]"
                >
                  <option value="">-- Choose Private Invoice --</option>
                  {ledgerData?.invoices?.map(inv => {
                    const bal = inv.balanceAmount !== undefined ? inv.balanceAmount : Math.max(0, inv.totalAmount - inv.paidAmount);
                    return (
                      <option key={inv._id} value={inv._id}>
                        {inv.invoiceNo} ({inv.date}) - Total: ₹{inv.totalAmount.toLocaleString('en-IN')} | Due: ₹{bal.toLocaleString('en-IN')} [{inv.paymentStatus || 'Unpaid'}]
                      </option>
                    );
                  })}
                </select>
                {selectedInvoice && (
                  <div className="mt-1 flex items-center justify-between text-xs text-slate-500">
                    <span>Invoice Total: <strong>₹{selectedInvoice.totalAmount.toLocaleString('en-IN')}</strong></span>
                    <span className="text-rose-600 font-bold">Remaining Balance: ₹{selectedInvoiceBalance.toLocaleString('en-IN')}</span>
                  </div>
                )}
              </div>

              {/* Payment Amount & Date */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Amount Received (₹) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    placeholder="0.00"
                    value={paymentForm.amount}
                    onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                    className="w-full px-3 py-2 text-sm font-bold font-mono rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0059bb]/20 focus:border-[#0059bb]"
                  />
                  {selectedInvoiceBalance > 0 && (
                    <button
                      type="button"
                      onClick={() => setPaymentForm({ ...paymentForm, amount: selectedInvoiceBalance })}
                      className="text-[11px] text-[#0059bb] hover:underline font-semibold mt-1 cursor-pointer"
                    >
                      Pay Full Due: ₹{selectedInvoiceBalance.toLocaleString('en-IN')}
                    </button>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Payment Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={paymentForm.paymentDate}
                    onChange={(e) => setPaymentForm({ ...paymentForm, paymentDate: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0059bb]/20 focus:border-[#0059bb]"
                  />
                </div>
              </div>

              {/* Payment Method & UTR */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Payment Method
                  </label>
                  <select
                    value={paymentForm.paymentMethod}
                    onChange={(e) => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#0059bb]/20 focus:border-[#0059bb]"
                  >
                    <option value="NEFT">NEFT</option>
                    <option value="RTGS">RTGS</option>
                    <option value="UPI">UPI / QR</option>
                    <option value="Cheque">Cheque</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Cash">Cash</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    UTR / Cheque / Ref No.
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. UTR12345678"
                    value={paymentForm.reference}
                    onChange={(e) => setPaymentForm({ ...paymentForm, reference: e.target.value })}
                    className="w-full px-3 py-2 text-sm font-mono uppercase rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0059bb]/20 focus:border-[#0059bb]"
                  />
                </div>
              </div>

              {/* Bank Details & Remarks */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Bank / Branch Details (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. HDFC Bank, Palanpur Branch"
                  value={paymentForm.bankDetails}
                  onChange={(e) => setPaymentForm({ ...paymentForm, bankDetails: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0059bb]/20 focus:border-[#0059bb]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Notes / Remarks (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Additional payment notes or terms..."
                  value={paymentForm.notes}
                  onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0059bb]/20 focus:border-[#0059bb]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingPayment}
                  className="px-5 py-2 bg-[#0059bb] hover:bg-[#004c9e] text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingPayment ? <RefreshCw size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                  <span>Save Payment</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================
          MODAL: EMAIL STATEMENT PDF (NodeMailer)
         ============================================================ */}
      {isEmailModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 bg-indigo-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mail size={20} />
                <h3 className="font-bold text-base">Email Statement of Account</h3>
              </div>
              <button 
                onClick={() => setIsEmailModalOpen(false)}
                className="p-1 hover:bg-white/20 rounded-lg transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSendEmail} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Recipient Email <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="client@company.com"
                  value={emailForm.recipientEmail}
                  onChange={(e) => setEmailForm({ ...emailForm, recipientEmail: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Subject Line
                </label>
                <input
                  type="text"
                  required
                  value={emailForm.subject}
                  onChange={(e) => setEmailForm({ ...emailForm, subject: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Message
                </label>
                <textarea
                  rows={4}
                  value={emailForm.message}
                  onChange={(e) => setEmailForm({ ...emailForm, message: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                />
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 flex items-center gap-2">
                <FileText className="text-indigo-600 shrink-0" size={16} />
                <span>Attachment: <strong>Ledger_{ledgerData?.party?.name?.replace(/\s+/g, '_')}.pdf</strong> (Statement of Account)</span>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEmailModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSendingEmail}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSendingEmail ? <RefreshCw size={14} className="animate-spin" /> : <Send size={14} />}
                  <span>Send PDF Email</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
