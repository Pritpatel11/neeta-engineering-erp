import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, Search, Calendar, Printer, Edit, Trash2, Eye, 
  Mail, Download, Send, X, FileText, CheckCircle2, Clock, AlertCircle,
  CreditCard, BookOpen
} from 'lucide-react';
import toast from 'react-hot-toast';
import { 
  getPrivateInvoices, 
  deletePrivateInvoice, 
  sendPrivateInvoiceEmail, 
  updatePrivateInvoice,
  recordPrivatePayment 
} from '../services/api';
import { Badge, Button, TableWrapper, EmptyState } from '../components/ui';

export default function PrivateInvoiceManagement() {
  const [invoices, setInvoices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const navigate = useNavigate();

  // Email modal state
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [emailTo, setEmailTo] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailNote, setEmailNote] = useState('');
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  // Payment modal state
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentInvoice, setPaymentInvoice] = useState(null);
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    paymentDate: new Date().toISOString().split('T')[0],
    paymentMethod: 'NEFT',
    reference: '',
    bankDetails: '',
    notes: ''
  });
  const [isRecordingPayment, setIsRecordingPayment] = useState(false);

  const fetchInvoices = async () => {
    try {
      setIsLoading(true);
      const data = await getPrivateInvoices();
      setInvoices(data);
    } catch (error) {
      console.error('Failed to fetch private invoices', error);
      toast.error('Failed to load private invoices');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const handleDelete = async (id, invoiceNo) => {
    if (window.confirm(`Are you sure you want to delete invoice ${invoiceNo}? This action cannot be undone.`)) {
      try {
        await deletePrivateInvoice(id);
        toast.success(`Invoice ${invoiceNo} deleted`);
        fetchInvoices();
      } catch (error) {
        toast.error('Failed to delete invoice: ' + (error.response?.data?.message || error.message));
      }
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await updatePrivateInvoice(id, { status: newStatus });
      toast.success(`Status updated to ${newStatus}`);
      setInvoices(prev => prev.map(inv => inv._id === id ? { ...inv, status: newStatus } : inv));
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const openShareModal = (inv) => {
    setSelectedInvoice(inv);
    setEmailTo(inv.clientEmail || '');
    setEmailSubject(`Tax Invoice #${inv.invoiceNo} - Neeta Engineering Works`);
    setEmailNote(`Dear ${inv.clientName || 'Valued Customer'},\n\nPlease find attached Tax Invoice #${inv.invoiceNo} for ₹ ${Number(inv.totalAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}.\n\nThank you for your business!`);
    setIsEmailModalOpen(true);
  };

  const handleSendEmail = async (e) => {
    e.preventDefault();
    if (!emailTo || !emailTo.includes('@')) {
      toast.error('Please provide a valid recipient email address');
      return;
    }
    if (!selectedInvoice) return;

    try {
      setIsSendingEmail(true);
      toast.loading('Sending invoice PDF via NodeMailer...', { id: 'email-toast' });

      await sendPrivateInvoiceEmail(selectedInvoice._id, {
        email: emailTo.trim(),
        subject: emailSubject,
        note: emailNote,
        invoice: selectedInvoice
      });

      toast.success(`Invoice #${selectedInvoice.invoiceNo} emailed to ${emailTo}!`, { id: 'email-toast' });
      setIsEmailModalOpen(false);
      fetchInvoices();
    } catch (err) {
      console.error('Failed to send invoice email:', err);
      toast.error('Failed to send email: ' + (err.response?.data?.message || err.message), { id: 'email-toast' });
    } finally {
      setIsSendingEmail(false);
    }
  };

  const getStatusVariant = (status) => {
    switch (status) {
      case 'Draft': return 'neutral';
      case 'Sent': return 'warning';
      case 'Paid': return 'success';
      case 'Overdue': return 'danger';
      case 'Cancelled': return 'neutral';
      default: return 'neutral';
    }
  };

  const openPaymentModal = (inv) => {
    setPaymentInvoice(inv);
    const bal = inv.balanceAmount !== undefined ? inv.balanceAmount : Math.max(0, inv.totalAmount - (inv.paidAmount || 0));
    setPaymentForm({
      amount: bal > 0 ? bal : '',
      paymentDate: new Date().toISOString().split('T')[0],
      paymentMethod: 'NEFT',
      reference: '',
      bankDetails: '',
      notes: ''
    });
    setIsPaymentModalOpen(true);
  };

  const handleSavePayment = async (e) => {
    e.preventDefault();
    if (!paymentInvoice) return;
    const amt = Number(paymentForm.amount);
    if (!amt || amt <= 0) {
      toast.error('Payment amount must be greater than zero');
      return;
    }

    try {
      setIsRecordingPayment(true);
      const res = await recordPrivatePayment({
        invoiceId: paymentInvoice._id,
        amount: amt,
        ...paymentForm
      });
      if (res?.success) {
        toast.success(res.message || 'Payment recorded successfully!');
        setIsPaymentModalOpen(false);
        fetchInvoices();
      } else {
        toast.error(res?.message || 'Failed to record payment');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Payment failed');
    } finally {
      setIsRecordingPayment(false);
    }
  };

  // Filtered invoices
  const filteredInvoices = invoices.filter(inv => {
    const matchesSearch = 
      (inv.clientName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (inv.invoiceNo || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (inv.poNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (inv.clientGST || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'All' || inv.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Calculate stats
  const totalCount = invoices.length;
  const totalValue = invoices.reduce((acc, inv) => acc + (Number(inv.totalAmount) || 0), 0);
  const paidValue = invoices.reduce((acc, inv) => acc + (Number(inv.paidAmount) || (inv.status === 'Paid' ? Number(inv.totalAmount) : 0)), 0);
  const pendingValue = Math.max(0, totalValue - paidValue);

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs p-4 sm:p-6 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Private Client Invoices</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Create, manage, track payments, print, and share private client invoices
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <button 
            onClick={() => navigate('/private-party-ledger')}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer shadow-2xs"
          >
            <BookOpen size={16} className="text-[#0059bb]" /> Party Ledger (Khata)
          </button>
          <Button onClick={() => navigate('/create-private-invoice')}>
            <Plus size={18} /> Create New Invoice
          </Button>
        </div>
      </div>

      {/* KPI Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Invoices</span>
          <div className="text-2xl font-bold text-slate-900 mt-1">{totalCount}</div>
          <span className="text-xs text-slate-400 mt-0.5 block">Total recorded</span>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Billed</span>
          <div className="text-2xl font-bold text-[#0059bb] mt-1">
            ₹{totalValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </div>
          <span className="text-xs text-slate-400 mt-0.5 block">Gross turnover</span>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Paid / Received</span>
          <div className="text-2xl font-bold text-emerald-600 mt-1">
            ₹{paidValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </div>
          <span className="text-xs text-slate-400 mt-0.5 block">Cleared payments</span>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <span className="text-xs font-semibold text-amber-600 uppercase tracking-wider">Pending / Due</span>
          <div className="text-2xl font-bold text-amber-600 mt-1">
            ₹{pendingValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </div>
          <span className="text-xs text-slate-400 mt-0.5 block">Awaiting collection</span>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:max-w-md">
          <Search size={18} className="absolute left-3 top-2.5 text-slate-400 pointer-events-none" />
          <input 
            type="text" 
            placeholder="Search by Client, Invoice No, GSTIN, or PO..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 text-sm rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0059bb]/20 focus:border-[#0059bb] transition-all"
          />
        </div>

        {/* Status Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {['All', 'Draft', 'Sent', 'Paid', 'Overdue'].map(st => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                statusFilter === st 
                  ? 'bg-[#0059bb] text-white shadow-xs' 
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Invoice List Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="py-16 text-center text-slate-500">Loading private invoices...</div>
        ) : filteredInvoices.length === 0 ? (
          <EmptyState 
            title="No private invoices found" 
            description={searchTerm || statusFilter !== 'All' ? "No invoices match your search/filter criteria." : "Create your first private client invoice to get started."} 
            actionLabel="Create New Invoice" 
            onAction={() => navigate('/create-private-invoice')} 
          />
        ) : (
          <TableWrapper minWidth="950px">
            <table className="w-full text-xs sm:text-sm text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80">
                  <th className="px-4 py-3 font-semibold text-xs text-slate-500 uppercase tracking-wider">Invoice No & Date</th>
                  <th className="px-4 py-3 font-semibold text-xs text-slate-500 uppercase tracking-wider">Client Details</th>
                  <th className="px-4 py-3 font-semibold text-xs text-slate-500 uppercase tracking-wider">PO / Due Date</th>
                  <th className="px-4 py-3 font-semibold text-xs text-slate-500 uppercase tracking-wider text-right">Total & Paid Amount</th>
                  <th className="px-4 py-3 font-semibold text-xs text-slate-500 uppercase tracking-wider text-center">Payment Status</th>
                  <th className="px-4 py-3 font-semibold text-xs text-slate-500 uppercase tracking-wider text-center">Dispatch</th>
                  <th className="px-4 py-3 font-semibold text-xs text-slate-500 uppercase tracking-wider text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredInvoices.map(inv => {
                  const bal = inv.balanceAmount !== undefined ? inv.balanceAmount : Math.max(0, inv.totalAmount - (inv.paidAmount || 0));
                  const isFullyPaid = inv.paymentStatus === 'Fully Paid' || (inv.paidAmount >= inv.totalAmount && inv.totalAmount > 0);
                  const isPartial = inv.paymentStatus === 'Partially Paid' || (inv.paidAmount > 0 && inv.paidAmount < inv.totalAmount);
                  const payStatus = isFullyPaid ? 'Fully Paid' : (isPartial ? 'Partially Paid' : 'Unpaid');

                  return (
                    <tr key={inv._id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Invoice No & Date */}
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                          <FileText size={15} className="text-[#0059bb]" />
                          <span>{inv.invoiceNo}</span>
                        </div>
                        <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                          <Calendar size={12} /> {inv.date}
                        </div>
                      </td>

                      {/* Client Details */}
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-900">{inv.clientName}</div>
                        {inv.clientGST && <div className="text-xs text-slate-500 font-mono">GST: {inv.clientGST}</div>}
                        {inv.clientPhone && <div className="text-xs text-slate-400">{inv.clientPhone}</div>}
                      </td>

                      {/* PO / Due Date */}
                      <td className="px-4 py-3">
                        {inv.poNumber ? (
                          <div className="text-xs font-semibold text-slate-700">PO: {inv.poNumber}</div>
                        ) : (
                          <div className="text-xs text-slate-400">Direct Invoice</div>
                        )}
                        {inv.dueDate && (
                          <div className="text-xs text-slate-500 mt-0.5">
                            Due: {inv.dueDate}
                          </div>
                        )}
                      </td>

                      {/* Total & Paid Amount */}
                      <td className="px-4 py-3 text-right">
                        <div className="font-bold text-slate-900 text-sm md:text-base font-mono">
                          ₹{(inv.totalAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </div>
                        <div className="text-xs text-emerald-600 font-mono font-semibold">
                          Paid: ₹{(inv.paidAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </div>
                        {bal > 0 && (
                          <div className="text-[11px] text-rose-500 font-mono font-semibold">
                            Due: ₹{bal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </div>
                        )}
                      </td>

                      {/* Payment Status Badge */}
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1 ${
                          isFullyPaid
                            ? 'bg-emerald-100 text-emerald-800'
                            : isPartial
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}>
                          {isFullyPaid && <CheckCircle2 size={11} />}
                          {isPartial && <Clock size={11} />}
                          {!isFullyPaid && !isPartial && <AlertCircle size={11} />}
                          {payStatus}
                        </span>
                      </td>

                      {/* Dispatch / General Status */}
                      <td className="px-4 py-3 text-center">
                        <select
                          value={inv.status}
                          onChange={(e) => handleStatusChange(inv._id, e.target.value)}
                          className={`text-xs font-semibold px-2 py-1 rounded-full border cursor-pointer ${
                            inv.status === 'Paid' 
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                              : inv.status === 'Sent'
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : inv.status === 'Overdue'
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : 'bg-slate-100 text-slate-700 border-slate-300'
                          }`}
                        >
                          <option value="Draft">Draft</option>
                          <option value="Sent">Sent</option>
                          <option value="Paid">Paid</option>
                          <option value="Overdue">Overdue</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                      </td>

                      {/* Action Buttons */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 justify-center">
                          {/* Record Payment Button */}
                          {bal > 0 && (
                            <button 
                              type="button"
                              className="px-2 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                              title="Record Payment"
                              onClick={() => openPaymentModal(inv)}
                            >
                              <CreditCard size={13} /> +Pay
                            </button>
                          )}

                          {/* View Party Khata / Ledger */}
                          <button 
                            type="button"
                            className="p-1.5 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors cursor-pointer" 
                            title="View Party Khata / Ledger"
                            onClick={() => navigate(inv.partyId ? `/private-party-ledger?partyId=${inv.partyId}` : `/private-party-ledger`)}
                          >
                            <BookOpen size={15} />
                          </button>

                          {/* View & Print (Opens QuotationPreview styled page) */}
                          <button 
                            type="button"
                            className="p-1.5 text-[#0059bb] bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors cursor-pointer" 
                            title="View & Print Invoice"
                            onClick={() => navigate(`/private-invoice?id=${inv._id}`, { state: { invoiceData: inv } })}
                          >
                            <Eye size={15} />
                          </button>

                          {/* Edit */}
                          <button 
                            type="button"
                            className="p-1.5 text-amber-600 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors cursor-pointer" 
                            title="Edit Invoice"
                            onClick={() => navigate('/create-private-invoice', { state: { editData: inv } })}
                          >
                            <Edit size={15} />
                          </button>

                          {/* Share via Email (NodeMailer) */}
                          <button 
                            type="button"
                            className="p-1.5 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors cursor-pointer" 
                            title="Share via Email (NodeMailer)"
                            onClick={() => openShareModal(inv)}
                          >
                            <Mail size={15} />
                          </button>

                          {/* Delete */}
                          <button 
                            type="button"
                            className="p-1.5 text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors cursor-pointer" 
                            title="Delete Invoice"
                            onClick={() => handleDelete(inv._id, inv.invoiceNo)}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </TableWrapper>
        )}
      </div>

      {/* Share / Email Modal (NodeMailer Integration) */}
      {isEmailModalOpen && selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 bg-[#0059bb] text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mail size={20} />
                <h3 className="font-bold text-base">Share Invoice via Email</h3>
              </div>
              <button 
                type="button" 
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
                  value={emailTo}
                  onChange={(e) => setEmailTo(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0059bb]/20 focus:border-[#0059bb]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Subject Line
                </label>
                <input 
                  type="text"
                  required
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0059bb]/20 focus:border-[#0059bb]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Message / Note
                </label>
                <textarea 
                  rows={3}
                  value={emailNote}
                  onChange={(e) => setEmailNote(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0059bb]/20 focus:border-[#0059bb]"
                />
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 flex items-center gap-2">
                <FileText className="text-[#0059bb] shrink-0" size={16} />
                <span>Attachment: <strong>Invoice_{selectedInvoice.invoiceNo}.pdf</strong></span>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsEmailModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={isSendingEmail}
                  className="flex items-center gap-2"
                >
                  {isSendingEmail ? 'Sending...' : 'Send Invoice'}
                  <Send size={14} />
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Record Payment Modal */}
      {isPaymentModalOpen && paymentInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 bg-[#0059bb] text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard size={20} />
                <h3 className="font-bold text-base">Record Payment Receipt</h3>
              </div>
              <button 
                type="button" 
                onClick={() => setIsPaymentModalOpen(false)}
                className="p-1 hover:bg-white/20 rounded-lg transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSavePayment} className="p-6 space-y-4">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-slate-500">Invoice:</span>
                  <span className="font-mono font-bold text-slate-900">{paymentInvoice.invoiceNo}</span>
                </div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-slate-500">Client:</span>
                  <span className="font-semibold text-slate-800">{paymentInvoice.clientName}</span>
                </div>
                <div className="flex justify-between items-center border-t border-slate-200 pt-1 mt-1 font-semibold">
                  <span className="text-slate-500">Balance Due:</span>
                  <span className="text-rose-600 font-mono font-bold">
                    ₹{Math.max(0, paymentInvoice.totalAmount - (paymentInvoice.paidAmount || 0)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Amount Paid (₹) <span className="text-rose-500">*</span>
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
                  {Math.max(0, paymentInvoice.totalAmount - (paymentInvoice.paidAmount || 0)) > 0 && (
                    <button
                      type="button"
                      onClick={() => setPaymentForm({ ...paymentForm, amount: Math.max(0, paymentInvoice.totalAmount - (paymentInvoice.paidAmount || 0)) })}
                      className="text-[11px] text-[#0059bb] hover:underline font-semibold mt-1 cursor-pointer block"
                    >
                      Pay Full Due
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
                    UTR / Ref No.
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. UTR12345"
                    value={paymentForm.reference}
                    onChange={(e) => setPaymentForm({ ...paymentForm, reference: e.target.value })}
                    className="w-full px-3 py-2 text-sm font-mono uppercase rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0059bb]/20 focus:border-[#0059bb]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Notes / Remarks
                </label>
                <input
                  type="text"
                  placeholder="Optional remarks..."
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
                  disabled={isRecordingPayment}
                  className="px-5 py-2 bg-[#0059bb] hover:bg-[#004c9e] text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isRecordingPayment ? 'Saving...' : 'Save Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
