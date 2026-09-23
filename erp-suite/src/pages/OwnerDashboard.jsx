import React, { useState, useEffect } from 'react';
import { 
  Activity, CheckCircle2, Clock, AlertTriangle, TrendingUp, Building2, 
  RefreshCcw, ChevronRight, ChevronDown, Award, Plus, Search, Filter, 
  User, CheckSquare, Edit3, Trash2, ArrowRightLeft, MessageSquare, 
  Send, ExternalLink, Calendar, FileText, X, AlertCircle, ShieldAlert,
  ShoppingBag, ShieldCheck, Printer, Package, Eye, ArrowRight
} from 'lucide-react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { 
  getOwnerSummary, 
  getTasks, 
  createTask, 
  updateTask, 
  deleteTask, 
  addTaskComment, 
  getUsers,
  getPurchaseOrders,
  ownerApprovalAction
} from '../services/api';
import toast from 'react-hot-toast';

export default function OwnerDashboard() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTabParam = searchParams.get('tab') || 'tasks';
  const targetTaskId = searchParams.get('taskId');
  const targetPrId = searchParams.get('prId') || searchParams.get('id');

  const [activeMainTab, setActiveMainTab] = useState(
    targetPrId ? 'purchase-approvals' : (activeTabParam || 'tasks')
  ); // 'tasks', 'purchase-approvals', or 'executive'
  const [summaryData, setSummaryData] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState(new Date());

  // Task Filters
  const [selectedUserFilter, setSelectedUserFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [onlyOverdue, setOnlyOverdue] = useState(false);

  // Purchase Management & Approvals State
  const [purchaseFilter, setPurchaseFilter] = useState('all');
  const [purchaseSearch, setPurchaseSearch] = useState('');
  const [selectedPurchase, setSelectedPurchase] = useState(null);
  const [isPurchaseApprovalModalOpen, setIsPurchaseApprovalModalOpen] = useState(false);
  const [approvalActionType, setApprovalActionType] = useState('approve');
  const [approvalVendorId, setApprovalVendorId] = useState('');
  const [approvalRemarks, setApprovalRemarks] = useState('');
  const [approvalRejectionReason, setApprovalRejectionReason] = useState('');
  const [isSubmittingApproval, setIsSubmittingApproval] = useState(false);

  // Modals & Drawers
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isReassignModalOpen, setIsReassignModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Comments state
  const [commentText, setCommentText] = useState('');
  const [isPostingComment, setIsPostingComment] = useState(false);

  // New Task Form
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    assignedTo: '',
    priority: 'medium',
    startDate: new Date().toISOString().slice(0, 10),
    dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    relatedModule: '',
    notes: '',
  });

  // Reassign Form
  const [reassignUserId, setReassignUserId] = useState('');

  // Executive Tab State
  const [filterTab, setFilterTab] = useState('all');
  const [expandedEmployeeId, setExpandedEmployeeId] = useState(null);

  const handleOpenApprovalModal = (purchase) => {
    setSelectedPurchase(purchase);
    const recId = purchase.recommendedVendorId?._id || purchase.recommendedVendorId;
    const firstEstId = purchase.vendorEstimates?.[0]?.vendorId?._id || purchase.vendorEstimates?.[0]?.vendorId || '';
    setApprovalVendorId(recId || firstEstId);
    setApprovalActionType(purchase.status === 'Pending Owner Approval' ? 'approve' : 'view');
    setApprovalRemarks(purchase.ownerApproval?.ownerRemarks || '');
    setApprovalRejectionReason(purchase.ownerApproval?.rejectionReason || '');
    setIsPurchaseApprovalModalOpen(true);
  };

  const handleOwnerApprovalAction = async () => {
    if (!selectedPurchase) return;
    if (approvalActionType === 'approve' && !approvalVendorId) {
      toast.error('Please select the vendor to approve for this Purchase Order');
      return;
    }
    if (approvalActionType === 'reject' && !approvalRejectionReason.trim()) {
      toast.error('Please specify the reason for rejecting this purchase');
      return;
    }
    if (approvalActionType === 'request_changes' && !approvalRemarks.trim()) {
      toast.error('Please specify what changes or negotiations are required');
      return;
    }

    setIsSubmittingApproval(true);
    try {
      const res = await ownerApprovalAction(selectedPurchase._id, {
        action: approvalActionType,
        approvedVendorId: approvalVendorId,
        ownerRemarks: approvalRemarks,
        rejectionReason: approvalRejectionReason,
      });

      toast.success(res.message || 'Executive decision processed successfully!');
      setIsPurchaseApprovalModalOpen(false);
      fetchData();
    } catch (err) {
      console.error('Owner action error:', err);
      toast.error(err.response?.data?.message || 'Failed to process owner approval action');
    } finally {
      setIsSubmittingApproval(false);
    }
  };

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [summary, taskList, users, purchaseList] = await Promise.all([
        getOwnerSummary().catch(() => null),
        getTasks().catch(() => []),
        getUsers().catch(() => []),
        getPurchaseOrders().catch(() => []),
      ]);

      setSummaryData(summary);
      setTasks(taskList || []);
      setUsersList(users || []);
      setPurchases(purchaseList || []);
      setLastRefreshed(new Date());

      if (targetTaskId && taskList) {
        const found = taskList.find(t => t._id === targetTaskId);
        if (found) {
          setSelectedTask(found);
          setActiveMainTab('tasks');
        }
      } else if (targetPrId && purchaseList) {
        const found = purchaseList.find(p => p._id === targetPrId || p.prNo === targetPrId);
        if (found) {
          handleOpenApprovalModal(found);
          setActiveMainTab('purchase-approvals');
        }
      } else if (activeTabParam === 'purchase-approvals') {
        setActiveMainTab('purchase-approvals');
      }
    } catch (error) {
      console.error('Failed to load owner portal data:', error);
      toast.error('Unable to load portal data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Handle Tab Switch
  const handleTabSwitch = (tab) => {
    setActiveMainTab(tab);
    setSearchParams({ tab });
  };

  // Create Task
  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!taskForm.title.trim()) {
      toast.error('Task title is required');
      return;
    }
    if (!taskForm.assignedTo) {
      toast.error('Please select a team member to assign');
      return;
    }
    if (!taskForm.dueDate) {
      toast.error('Please specify a due date');
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await createTask(taskForm);
      setTasks(prev => [created, ...prev]);
      setIsCreateModalOpen(false);
      setTaskForm({
        title: '',
        description: '',
        assignedTo: '',
        priority: 'medium',
        startDate: new Date().toISOString().slice(0, 10),
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
        relatedModule: '',
        notes: '',
      });
      toast.success('Task created and assigned successfully! Notification dispatched.');
      // Refresh summary to update counts
      getOwnerSummary().then(s => setSummaryData(s)).catch(() => {});
    } catch (err) {
      console.error('Create task error:', err);
      toast.error(err.response?.data?.message || 'Failed to create task');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Edit Task
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!selectedTask) return;

    setIsSubmitting(true);
    try {
      const updated = await updateTask(selectedTask._id, {
        title: selectedTask.title,
        description: selectedTask.description,
        priority: selectedTask.priority,
        dueDate: selectedTask.dueDate,
        startDate: selectedTask.startDate,
        relatedModule: selectedTask.relatedModule,
        notes: selectedTask.notes,
        status: selectedTask.status,
      });

      setTasks(prev => prev.map(t => t._id === updated._id ? updated : t));
      setSelectedTask(updated);
      setIsEditModalOpen(false);
      toast.success('Task details updated');
    } catch (err) {
      console.error('Edit task error:', err);
      toast.error('Failed to update task');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reassign Task
  const handleReassign = async (e) => {
    e.preventDefault();
    if (!selectedTask || !reassignUserId) return;

    setIsSubmitting(true);
    try {
      const updated = await updateTask(selectedTask._id, { assignedTo: reassignUserId });
      setTasks(prev => prev.map(t => t._id === updated._id ? updated : t));
      setSelectedTask(updated);
      setIsReassignModalOpen(false);
      setReassignUserId('');
      toast.success('Task reassigned successfully! Notification sent to new assignee.');
      getOwnerSummary().then(s => setSummaryData(s)).catch(() => {});
    } catch (err) {
      console.error('Reassign error:', err);
      toast.error('Failed to reassign task');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Task
  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this task? This action cannot be undone.')) {
      return;
    }

    try {
      await deleteTask(taskId);
      setTasks(prev => prev.filter(t => t._id !== taskId));
      if (selectedTask && selectedTask._id === taskId) {
        setSelectedTask(null);
      }
      toast.success('Task removed');
      getOwnerSummary().then(s => setSummaryData(s)).catch(() => {});
    } catch (err) {
      console.error('Delete error:', err);
      toast.error('Failed to delete task');
    }
  };

  // Add Comment from Owner
  const handlePostComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim() || !selectedTask) return;

    setIsPostingComment(true);
    try {
      const updated = await addTaskComment(selectedTask._id, { text: commentText.trim() });
      setSelectedTask(updated);
      setTasks(prev => prev.map(t => t._id === updated._id ? updated : t));
      setCommentText('');
      toast.success('Comment dispatched to team member');
    } catch (err) {
      console.error('Comment error:', err);
      toast.error('Failed to post comment');
    } finally {
      setIsPostingComment(false);
    }
  };

  // KPI Calculations
  const totalTasks = tasks.length;
  const pendingCount = tasks.filter(t => t.status === 'pending').length;
  const inProgressCount = tasks.filter(t => t.status === 'in_progress').length;
  const completedCount = tasks.filter(t => t.status === 'completed').length;
  const overdueCount = tasks.filter(t => {
    return t.status !== 'completed' && t.status !== 'cancelled' && new Date(t.dueDate) < new Date();
  }).length;
  const highPriorityCount = tasks.filter(t => {
    return (t.priority === 'urgent' || t.priority === 'high') && t.status !== 'completed' && t.status !== 'cancelled';
  }).length;

  // Filtered Tasks
  const filteredTasks = tasks.filter(t => {
    if (selectedUserFilter !== 'all') {
      const assigneeId = t.assignedTo?._id || t.assignedTo;
      if (assigneeId !== selectedUserFilter) return false;
    }
    if (statusFilter !== 'all' && t.status !== statusFilter) return false;
    if (priorityFilter !== 'all' && t.priority !== priorityFilter) return false;
    if (onlyOverdue) {
      const isOver = t.status !== 'completed' && t.status !== 'cancelled' && new Date(t.dueDate) < new Date();
      if (!isOver) return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = t.title?.toLowerCase().includes(q);
      const matchDesc = t.description?.toLowerCase().includes(q);
      const matchModule = t.relatedModule?.toLowerCase().includes(q);
      const matchAssignee = t.assignedTo?.name?.toLowerCase().includes(q);
      if (!matchTitle && !matchDesc && !matchModule && !matchAssignee) return false;
    }
    return true;
  });

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'urgent':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-700 border border-rose-200 uppercase">Urgent</span>;
      case 'high':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200 uppercase">High</span>;
      case 'medium':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-[#0059bb] border border-blue-200 uppercase">Medium</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200 uppercase">Low</span>;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">Completed</span>;
      case 'in_progress':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-200">In Progress</span>;
      case 'on_hold':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-100 text-purple-800 border border-purple-200">On Hold</span>;
      case 'cancelled':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-200">Cancelled</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">Pending</span>;
    }
  };

  // Registered staff/employees for assignment (exclude owner)
  const assignableUsers = usersList.filter(u => u.role !== 'owner');

  // Purchase KPIs & Calculations
  const pendingApprovalsCount = purchases.filter(p => p.status === 'Pending Owner Approval').length;
  const approvedPurchasesCount = purchases.filter(p => ['Approved', 'PO Created', 'Ordered', 'Partially Received', 'Fully Received', 'Payment Pending', 'Paid'].includes(p.status)).length;
  const receivedPurchasesCount = purchases.filter(p => ['Partially Received', 'Fully Received', 'Payment Pending', 'Paid'].includes(p.status)).length;
  const paidPurchasesCount = purchases.filter(p => p.status === 'Paid').length;
  const rejectedPurchasesCount = purchases.filter(p => p.status === 'Rejected').length;
  const totalSpendAuthorized = purchases
    .filter(p => ['Approved', 'PO Created', 'Ordered', 'Partially Received', 'Fully Received', 'Payment Pending', 'Paid'].includes(p.status))
    .reduce((sum, p) => sum + (p.ownerApproval?.approvedAmount || 0), 0);

  // Filtered Purchases
  const filteredPurchases = purchases.filter(p => {
    if (purchaseFilter === 'pending') {
      if (p.status !== 'Pending Owner Approval') return false;
    } else if (purchaseFilter === 'approved') {
      if (!['Approved', 'PO Created', 'Ordered'].includes(p.status)) return false;
    } else if (purchaseFilter === 'received') {
      if (!['Partially Received', 'Fully Received'].includes(p.status)) return false;
    } else if (purchaseFilter === 'paid') {
      if (p.status !== 'Paid') return false;
    } else if (purchaseFilter === 'rejected') {
      if (p.status !== 'Rejected') return false;
    }

    if (purchaseSearch.trim()) {
      const q = purchaseSearch.toLowerCase();
      const matchPr = p.prNo?.toLowerCase().includes(q);
      const matchPo = p.poNo?.toLowerCase().includes(q);
      const matchParty = p.privatePartyName?.toLowerCase().includes(q);
      const matchQuotation = p.quotationNo?.toLowerCase().includes(q);
      const matchVendor = p.vendorEstimates?.some(e => e.vendorName?.toLowerCase().includes(q));
      const matchItem = p.materials?.some(m => m.name?.toLowerCase().includes(q));
      if (!matchPr && !matchPo && !matchParty && !matchQuotation && !matchVendor && !matchItem) return false;
    }

    return true;
  });

  const getPurchaseStatusBadge = (status) => {
    switch (status) {
      case 'Pending Owner Approval':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1.5 w-max animate-pulse">
            <Clock size={12} className="text-amber-700" />
            <span>Pending Owner Approval</span>
          </span>
        );
      case 'Approved':
      case 'PO Created':
      case 'Ordered':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1.5 w-max">
            <CheckCircle2 size={12} className="text-emerald-700" />
            <span>Approved (PO Issued)</span>
          </span>
        );
      case 'Partially Received':
      case 'Fully Received':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-300 flex items-center gap-1.5 w-max">
            <Package size={12} className="text-blue-700" />
            <span>Material Inwarded</span>
          </span>
        );
      case 'Paid':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-teal-100 text-teal-800 border border-teal-300 flex items-center gap-1.5 w-max">
            <CheckCircle2 size={12} className="text-teal-700" />
            <span>Paid & Settled</span>
          </span>
        );
      case 'Rejected':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300 flex items-center gap-1.5 w-max">
            <X size={12} className="text-rose-700" />
            <span>Rejected</span>
          </span>
        );
      case 'Quotation Requested':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800 border border-indigo-300 flex items-center gap-1.5 w-max">
            <Clock size={12} />
            <span>RFQ Dispatched</span>
          </span>
        );
      case 'Estimates Received':
      case 'Under Comparison':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-300 flex items-center gap-1.5 w-max">
            <Activity size={12} />
            <span>Under PM Comparison</span>
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-300 w-max">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6 pb-16">
      {/* Executive Portal Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Owner Command & Control Portal
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
              Owner Only
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Centralized task delegation, raw material purchase approvals, and operations performance monitoring.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <span className="text-xs text-slate-400 hidden sm:inline">
            Updated: {lastRefreshed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
          <button 
            onClick={fetchData} 
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 shadow-2xs transition-all cursor-pointer"
          >
            <RefreshCcw size={14} className={isLoading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Executive Alert Banner for Pending Purchase Approvals */}
      {pendingApprovalsCount > 0 && (
        <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 rounded-2xl p-4 text-white shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/20 rounded-xl backdrop-blur-xs flex items-center justify-center">
              <ShieldAlert size={22} className="text-white animate-bounce" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-black text-sm sm:text-base tracking-tight">
                  {pendingApprovalsCount} Raw Material Purchase Requisition{pendingApprovalsCount > 1 ? 's' : ''} Awaiting Owner Approval
                </h4>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-white text-amber-900 uppercase">
                  Action Required
                </span>
              </div>
              <p className="text-xs text-amber-100 mt-0.5">
                Vendor quotations have been recorded & compared by the Purchase Manager. Your commercial approval is required to issue official POs.
              </p>
            </div>
          </div>
          <button
            onClick={() => handleTabSwitch('purchase-approvals')}
            className="px-4 py-2 bg-white text-amber-950 hover:bg-amber-50 font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 self-start sm:self-auto"
          >
            <span>Review & Approve Now</span>
            <ArrowRight size={14} />
          </button>
        </div>
      )}

      {/* Primary Tab Navigation */}
      <div className="flex border-b border-slate-200 gap-6 overflow-x-auto">
        <button
          onClick={() => handleTabSwitch('tasks')}
          className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
            activeMainTab === 'tasks'
              ? 'border-[#0059bb] text-[#0059bb]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <CheckSquare size={16} />
          <span>Task Assignment & Management</span>
          <span className="px-2 py-0.5 rounded-full text-xs bg-blue-50 text-[#0059bb]">
            {totalTasks}
          </span>
        </button>

        <button
          onClick={() => handleTabSwitch('purchase-approvals')}
          className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
            activeMainTab === 'purchase-approvals'
              ? 'border-[#0059bb] text-[#0059bb]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ShoppingBag size={16} />
          <span>Purchase Approvals & Orders</span>
          {pendingApprovalsCount > 0 ? (
            <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-rose-600 text-white animate-pulse shadow-xs">
              {pendingApprovalsCount} PENDING
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded-full text-xs bg-slate-100 text-slate-600 font-bold">
              {purchases.length}
            </span>
          )}
        </button>

        <button
          onClick={() => handleTabSwitch('executive')}
          className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
            activeMainTab === 'executive'
              ? 'border-[#0059bb] text-[#0059bb]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <TrendingUp size={16} />
          <span>Operations & Team Performance</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: TASK ASSIGNMENT & MANAGEMENT WORKSPACE */}
      {/* ========================================================================= */}
      {activeMainTab === 'tasks' && (
        <div className="space-y-6">
          {/* Owner Task Dashboard KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
            <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Total Tasks</div>
              <div className="text-2xl font-bold text-slate-900">{totalTasks}</div>
              <div className="text-[11px] text-slate-400 mt-1">All assigned tasks</div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs">
              <div className="text-xs font-semibold text-amber-600 uppercase tracking-wider mb-1">Pending</div>
              <div className="text-2xl font-bold text-amber-600">{pendingCount}</div>
              <div className="text-[11px] text-slate-400 mt-1">Awaiting start</div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs">
              <div className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1">In Progress</div>
              <div className="text-2xl font-bold text-blue-600">{inProgressCount}</div>
              <div className="text-[11px] text-slate-400 mt-1">Being worked on</div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs">
              <div className="text-xs font-semibold text-emerald-600 uppercase tracking-wider mb-1">Completed</div>
              <div className="text-2xl font-bold text-emerald-600">{completedCount}</div>
              <div className="text-[11px] text-slate-400 mt-1">Delivered tasks</div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs">
              <div className="text-xs font-semibold text-rose-600 uppercase tracking-wider mb-1">Overdue</div>
              <div className="text-2xl font-bold text-rose-600">{overdueCount}</div>
              <div className="text-[11px] text-slate-400 mt-1">Past due date</div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs">
              <div className="text-xs font-semibold text-purple-600 uppercase tracking-wider mb-1">High/Urgent</div>
              <div className="text-2xl font-bold text-purple-600">{highPriorityCount}</div>
              <div className="text-[11px] text-slate-400 mt-1">Critical items</div>
            </div>
          </div>

          {/* Action & Filter Controls */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col lg:flex-row items-center justify-between gap-3.5">
            {/* Left: Create Button & Search */}
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#0059bb] hover:bg-[#004899] text-white text-xs sm:text-sm font-semibold transition-colors cursor-pointer shadow-xs shrink-0"
              >
                <Plus size={16} />
                <span>Assign New Task</span>
              </button>

              <div className="relative w-full sm:w-64">
                <Search size={15} className="absolute left-3 top-2.5 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search task, user, module..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0059bb]/20 focus:border-[#0059bb]"
                />
              </div>
            </div>

            {/* Right: Multi-Criteria Filter Dropdowns */}
            <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto justify-end">
              {/* Filter by Team Member */}
              <select
                value={selectedUserFilter}
                onChange={(e) => setSelectedUserFilter(e.target.value)}
                className="px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#0059bb]/20 cursor-pointer"
              >
                <option value="all">All Team Members</option>
                {assignableUsers.map(u => (
                  <option key={u._id} value={u._id}>
                    {u.name} ({u.department})
                  </option>
                ))}
              </select>

              {/* Filter by Status */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#0059bb]/20 cursor-pointer"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="on_hold">On Hold</option>
                <option value="cancelled">Cancelled</option>
              </select>

              {/* Filter by Priority */}
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#0059bb]/20 cursor-pointer"
              >
                <option value="all">All Priorities</option>
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>

              {/* Overdue Toggle */}
              <button
                onClick={() => setOnlyOverdue(prev => !prev)}
                className={`px-3 py-2 text-xs sm:text-sm rounded-xl border font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
                  onlyOverdue 
                    ? 'bg-rose-50 text-rose-700 border-rose-200' 
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <AlertTriangle size={14} className={onlyOverdue ? 'text-rose-600' : 'text-slate-400'} />
                <span>Overdue Only</span>
              </button>

              {(selectedUserFilter !== 'all' || statusFilter !== 'all' || priorityFilter !== 'all' || onlyOverdue || searchQuery) && (
                <button
                  onClick={() => {
                    setSelectedUserFilter('all');
                    setStatusFilter('all');
                    priorityFilter !== 'all' && setPriorityFilter('all');
                    setOnlyOverdue(false);
                    setSearchQuery('');
                  }}
                  className="text-xs text-rose-600 hover:underline px-1 font-medium cursor-pointer"
                >
                  Reset
                </button>
              )}
            </div>
          </div>

          {/* Main Tasks Workspace Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Task List / Table Column */}
            <div className={`space-y-3.5 ${selectedTask ? 'lg:col-span-7' : 'lg:col-span-12'}`}>
              {isLoading ? (
                <div className="p-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
                  <RefreshCcw size={28} className="animate-spin mx-auto mb-2 text-[#0059bb]" />
                  <p className="text-sm">Loading Owner Tasks...</p>
                </div>
              ) : filteredTasks.length === 0 ? (
                <div className="p-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
                  <CheckSquare size={36} className="mx-auto mb-2 text-slate-300" />
                  <p className="text-sm font-semibold text-slate-700">No tasks match your criteria</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Use the "Assign New Task" button above to assign a task to any registered team member.
                  </p>
                </div>
              ) : (
                filteredTasks.map((task) => {
                  const isOverdue = task.status !== 'completed' && task.status !== 'cancelled' && new Date(task.dueDate) < new Date();
                  const isSelected = selectedTask && selectedTask._id === task._id;

                  return (
                    <div
                      key={task._id}
                      onClick={() => setSelectedTask(task)}
                      className={`bg-white p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer shadow-xs hover:border-[#0059bb]/50 ${
                        isSelected ? 'border-[#0059bb] ring-2 ring-[#0059bb]/10 bg-blue-50/10' : 'border-slate-200/90'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          {getPriorityBadge(task.priority)}
                          {getStatusBadge(task.status)}
                          {isOverdue && (
                            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-600 text-white flex items-center gap-1 animate-pulse">
                              <AlertTriangle size={11} /> OVERDUE
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 text-xs text-slate-500">
                          <Clock size={13} className={isOverdue ? 'text-rose-600' : 'text-slate-400'} />
                          <span className={isOverdue ? 'text-rose-600 font-bold' : ''}>
                            Due: {new Date(task.dueDate).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      <h3 className="font-bold text-slate-900 text-base mb-1 hover:text-[#0059bb] transition-colors">
                        {task.title}
                      </h3>

                      {task.description && (
                        <p className="text-xs text-slate-600 line-clamp-2 mb-3 leading-relaxed">
                          {task.description}
                        </p>
                      )}

                      {/* Card Meta & Actions */}
                      <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-2 text-xs text-slate-700">
                          <div className="w-6 h-6 rounded-full bg-blue-100 text-[#0059bb] font-bold text-[10px] flex items-center justify-center uppercase">
                            {task.assignedTo?.name ? task.assignedTo.name.charAt(0) : 'U'}
                          </div>
                          <div>
                            Assigned to: <strong>{task.assignedTo?.name || 'Unassigned'}</strong>
                            <span className="text-slate-400 text-[11px] ml-1">({task.assignedTo?.department || 'Staff'})</span>
                          </div>
                        </div>

                        {/* Quick Owner Actions */}
                        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => {
                              setSelectedTask(task);
                              setReassignUserId(task.assignedTo?._id || '');
                              setIsReassignModalOpen(true);
                            }}
                            className="p-1.5 text-slate-600 hover:text-[#0059bb] hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                            title="Reassign Task to Another Team Member"
                          >
                            <ArrowRightLeft size={15} />
                          </button>

                          <button
                            onClick={() => {
                              setSelectedTask(task);
                              setIsEditModalOpen(true);
                            }}
                            className="p-1.5 text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                            title="Edit Task Details"
                          >
                            <Edit3 size={15} />
                          </button>

                          <button
                            onClick={() => handleDeleteTask(task._id)}
                            className="p-1.5 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Delete / Cancel Task"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Task Detail & Activity Log Drawer */}
            {selectedTask && (
              <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/90 shadow-md p-5 sticky top-20 space-y-5">
                <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      {getPriorityBadge(selectedTask.priority)}
                      {getStatusBadge(selectedTask.status)}
                    </div>
                    <h2 className="text-lg font-bold text-slate-900 leading-tight">
                      {selectedTask.title}
                    </h2>
                  </div>

                  <button
                    onClick={() => setSelectedTask(null)}
                    className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                {/* Assignment & Due Date Details */}
                <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50/80 p-3.5 rounded-xl border border-slate-100">
                  <div>
                    <span className="text-slate-400 block font-medium">Assigned Team Member</span>
                    <span className="text-slate-900 font-bold">{selectedTask.assignedTo?.name || 'Unassigned'}</span>
                    <div className="text-slate-500 text-[10px]">{selectedTask.assignedTo?.designation || selectedTask.assignedTo?.role}</div>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-medium">Due Date</span>
                    <span className={`font-bold ${new Date(selectedTask.dueDate) < new Date() && selectedTask.status !== 'completed' ? 'text-rose-600' : 'text-slate-900'}`}>
                      {new Date(selectedTask.dueDate).toLocaleDateString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-medium">Start Date</span>
                    <span className="text-slate-700 font-semibold">{new Date(selectedTask.startDate || selectedTask.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-medium">Department</span>
                    <span className="capitalize font-bold text-[#0059bb]">{selectedTask.department}</span>
                  </div>
                </div>

                {/* Quick Reassign / Edit Button Strip */}
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setReassignUserId(selectedTask.assignedTo?._id || '');
                      setIsReassignModalOpen(true);
                    }}
                    className="flex-1 py-1.5 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <ArrowRightLeft size={13} />
                    <span>Reassign</span>
                  </button>

                  <button
                    onClick={() => setIsEditModalOpen(true)}
                    className="flex-1 py-1.5 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Edit3 size={13} />
                    <span>Edit Task</span>
                  </button>

                  <button
                    onClick={() => handleDeleteTask(selectedTask._id)}
                    className="py-1.5 px-3 rounded-xl border border-rose-200 hover:bg-rose-50 text-xs font-semibold text-rose-600 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>

                {/* Description */}
                <div>
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Description</h4>
                  <p className="text-xs text-slate-700 whitespace-pre-line leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                    {selectedTask.description || 'No detailed instructions provided.'}
                  </p>
                </div>

                {/* Notes */}
                {selectedTask.notes && (
                  <div>
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Notes</h4>
                    <p className="text-xs text-slate-600 italic bg-amber-50/60 p-2.5 rounded-xl border border-amber-100/80">
                      {selectedTask.notes}
                    </p>
                  </div>
                )}

                {/* Activity Log / History */}
                <div>
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Task History / Activity Log
                  </h4>
                  <div className="max-h-44 overflow-y-auto space-y-2 text-xs border border-slate-100 p-3 rounded-xl bg-slate-50/50">
                    {(!selectedTask.history || selectedTask.history.length === 0) ? (
                      <p className="text-slate-400 italic">No activity recorded yet.</p>
                    ) : (
                      selectedTask.history.map((h, idx) => (
                        <div key={idx} className="flex items-start gap-2 border-l-2 border-[#0059bb] pl-2 py-0.5">
                          <div className="flex-1">
                            <div className="font-semibold text-slate-800">{h.details}</div>
                            <div className="text-[10px] text-slate-400">
                              {new Date(h.timestamp).toLocaleString()}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Discussion / Comments */}
                <div>
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center justify-between">
                    <span>Task Discussion / Notes</span>
                    <span className="text-slate-400 font-normal">({selectedTask.comments?.length || 0})</span>
                  </h4>

                  <div className="max-h-48 overflow-y-auto space-y-2.5 mb-3">
                    {(!selectedTask.comments || selectedTask.comments.length === 0) ? (
                      <p className="text-xs text-slate-400 text-center py-3">No messages yet. Send an update or inquiry below.</p>
                    ) : (
                      selectedTask.comments.map((c, idx) => {
                        const isOwnerMsg = c.userRole === 'owner';
                        return (
                          <div
                            key={idx}
                            className={`p-2.5 rounded-xl text-xs ${
                              isOwnerMsg ? 'bg-blue-50 border border-blue-100 ml-4' : 'bg-slate-50 border border-slate-200 mr-4'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-1 mb-1">
                              <span className="font-bold text-slate-900">
                                {c.userName} {isOwnerMsg ? '(Owner)' : ''}
                              </span>
                              <span className="text-[10px] text-slate-400">
                                {new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <p className="text-slate-700 leading-relaxed">{c.text}</p>
                          </div>
                        );
                      })
                    )}
                  </div>

                  <form onSubmit={handlePostComment} className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Type a note or query for team member..."
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0059bb]/20 focus:border-[#0059bb]"
                    />
                    <button
                      type="submit"
                      disabled={isPostingComment || !commentText.trim()}
                      className="px-3.5 py-2 rounded-xl bg-[#0059bb] hover:bg-[#004899] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                    >
                      <Send size={13} />
                      <span>Post</span>
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: EXECUTIVE PERFORMANCE & OPERATIONS BREAKDOWN */}
      {/* ========================================================================= */}
      {activeMainTab === 'executive' && (
        <div className="space-y-6">
          {/* Top Level Key Performance Indicators */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Overall Progress</span>
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#0059bb] flex items-center justify-center">
                  <Activity size={20} />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-slate-900">
                  {summaryData?.metrics?.overallProgress || 0}%
                </span>
                <span className="text-xs text-slate-500">of tasks completed</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full mt-4 overflow-hidden">
                <div 
                  className="bg-[#0059bb] h-full rounded-full transition-all duration-500" 
                  style={{ width: `${summaryData?.metrics?.overallProgress || 0}%` }}
                />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Completed Tasks</span>
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <CheckCircle2 size={20} />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-emerald-600">
                  {summaryData?.metrics?.completedTasks || 0}
                </span>
                <span className="text-xs text-slate-500">out of {summaryData?.metrics?.totalTasks || 0}</span>
              </div>
              <div className="text-xs text-emerald-700 mt-2 font-medium">
                Active deliverable items successfully closed
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active In Progress</span>
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Clock size={20} />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-blue-600">
                  {summaryData?.metrics?.inProgressTasks || 0}
                </span>
                <span className="text-xs text-slate-500">currently running</span>
              </div>
              <div className="text-xs text-blue-700 mt-2 font-medium">
                Operations underway across departments
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Critical / Overdue</span>
                <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                  <AlertTriangle size={20} />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-rose-600">
                  {summaryData?.metrics?.overdueTasks || 0}
                </span>
                <span className="text-xs text-rose-500">require immediate focus</span>
              </div>
              <div className="text-xs text-rose-700 mt-2 font-medium">
                Action required by assigned personnel
              </div>
            </div>
          </div>

          {/* Department Breakdown */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
            <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Building2 className="text-[#0059bb]" size={18} />
              <span>Department Progress & Completion Rates</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {(summaryData?.departmentBreakdown || []).map((dept) => (
                <div key={dept.department} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-sm font-bold capitalize text-slate-800">{dept.department}</span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-100 text-[#0059bb]">
                      {dept.progressRate}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden mb-3">
                    <div 
                      className="bg-[#0059bb] h-full rounded-full transition-all duration-300"
                      style={{ width: `${dept.progressRate}%` }}
                    />
                  </div>
                  <div className="text-xs text-slate-600 space-y-1">
                    <div className="flex justify-between">
                      <span>Total Tasks:</span>
                      <span className="font-semibold">{dept.total}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Completed:</span>
                      <span className="font-semibold text-emerald-600">{dept.completed}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>In Progress:</span>
                      <span className="font-semibold text-blue-600">{dept.inProgress}</span>
                    </div>
                    {dept.overdue > 0 && (
                      <div className="flex justify-between text-rose-600 font-semibold">
                        <span>Overdue:</span>
                        <span>{dept.overdue}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Employee Task Matrix */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Award className="text-[#0059bb]" size={18} />
                  <span>Team Member Accountability & Task Matrix</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Direct breakdown of all tasks assigned to individual staff members.
                </p>
              </div>

              <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
                <button
                  onClick={() => setFilterTab('all')}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                    filterTab === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  All Staff
                </button>
                <button
                  onClick={() => setFilterTab('incomplete')}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                    filterTab === 'incomplete' ? 'bg-white text-amber-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  With Pending
                </button>
                <button
                  onClick={() => setFilterTab('completed')}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                    filterTab === 'completed' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Fully Completed
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider">
                    <th className="px-4 py-3">Team Member</th>
                    <th className="px-4 py-3">Department</th>
                    <th className="px-4 py-3">Completed</th>
                    <th className="px-4 py-3">Pending Action</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(summaryData?.employeeMatrix || [])
                    .filter(emp => {
                      if (filterTab === 'incomplete') return emp.incompleteCount > 0;
                      if (filterTab === 'completed') return emp.incompleteCount === 0 && emp.completedCount > 0;
                      return true;
                    })
                    .map(emp => {
                      const isExpanded = expandedEmployeeId === emp.id;
                      return (
                        <React.Fragment key={emp.id}>
                          <tr className="hover:bg-slate-50/80 transition-colors">
                            <td className="px-4 py-3.5">
                              <div className="font-bold text-slate-900">{emp.name}</div>
                              <div className="text-slate-400 text-[11px]">{emp.designation || emp.role}</div>
                            </td>
                            <td className="px-4 py-3.5 capitalize text-slate-700 font-medium">{emp.department}</td>
                            <td className="px-4 py-3.5">
                              <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                <CheckCircle2 size={12} />
                                <span>{emp.completedCount} Done</span>
                              </span>
                            </td>
                            <td className="px-4 py-3.5">
                              {emp.incompleteCount > 0 ? (
                                <span className="inline-flex items-center gap-1 font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                                  <Clock size={12} />
                                  <span>{emp.incompleteCount} Pending</span>
                                  {emp.overdueCount > 0 && (
                                    <span className="text-rose-700 font-bold ml-1">({emp.overdueCount} Overdue)</span>
                                  )}
                                </span>
                              ) : (
                                <span className="text-emerald-600 font-semibold">All Done ✓</span>
                              )}
                            </td>
                            <td className="px-4 py-3.5 text-right">
                              <button
                                onClick={() => setExpandedEmployeeId(isExpanded ? null : emp.id)}
                                className="inline-flex items-center gap-1 text-[#0059bb] font-semibold hover:underline cursor-pointer"
                              >
                                {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                <span>{isExpanded ? 'Hide' : 'View Tasks'}</span>
                              </button>
                            </td>
                          </tr>

                          {isExpanded && (
                            <tr className="bg-slate-50/80">
                              <td colSpan="5" className="p-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div className="bg-white p-3.5 rounded-xl border border-slate-200">
                                    <h5 className="font-bold text-emerald-700 flex items-center gap-1 mb-2">
                                      <CheckCircle2 size={14} />
                                      <span>Completed Tasks ({emp.completedTasksList?.length || 0})</span>
                                    </h5>
                                    {(!emp.completedTasksList || emp.completedTasksList.length === 0) ? (
                                      <p className="text-slate-400">No completed tasks yet.</p>
                                    ) : (
                                      <ul className="list-disc list-inside space-y-1 text-slate-700">
                                        {emp.completedTasksList.map(t => (
                                          <li key={t.id}>{t.title}</li>
                                        ))}
                                      </ul>
                                    )}
                                  </div>

                                  <div className="bg-white p-3.5 rounded-xl border border-slate-200">
                                    <h5 className="font-bold text-rose-700 flex items-center gap-1 mb-2">
                                      <Clock size={14} />
                                      <span>Pending Tasks ({emp.incompleteTasksList?.length || 0})</span>
                                    </h5>
                                    {(!emp.incompleteTasksList || emp.incompleteTasksList.length === 0) ? (
                                      <p className="text-emerald-600 font-semibold">All tasks completed!</p>
                                    ) : (
                                      <ul className="list-disc list-inside space-y-1 text-slate-700">
                                        {emp.incompleteTasksList.map(t => (
                                          <li key={t.id}>
                                            <span>{t.title}</span>
                                            <span className="text-[#0059bb] font-bold ml-1">
                                              (Due: {new Date(t.dueDate).toLocaleDateString()})
                                            </span>
                                          </li>
                                        ))}
                                      </ul>
                                    )}
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: PURCHASE APPROVALS & ORDERS WORKSPACE (OWNER DECISION HUB) */}
      {/* ========================================================================= */}
      {activeMainTab === 'purchase-approvals' && (
        <div className="space-y-6">
          {/* Executive Purchase KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
            <div className={`p-4 rounded-2xl border shadow-xs transition-all ${
              pendingApprovalsCount > 0 
                ? 'bg-amber-50/70 border-amber-300 ring-2 ring-amber-400/20' 
                : 'bg-white border-slate-200/90'
            }`}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">Awaiting My Decision</span>
                {pendingApprovalsCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-600 text-white animate-pulse">
                    Action Req.
                  </span>
                )}
              </div>
              <div className="text-2xl font-black text-amber-700">{pendingApprovalsCount}</div>
              <div className="text-[11px] text-slate-500 mt-1">Multi-vendor quotes ready</div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs">
              <div className="text-xs font-bold text-emerald-700 uppercase tracking-wider mb-1">Approved & PO Issued</div>
              <div className="text-2xl font-black text-emerald-700">{approvedPurchasesCount}</div>
              <div className="text-[11px] text-slate-500 mt-1">POs dispatched to vendors</div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs">
              <div className="text-xs font-bold text-blue-700 uppercase tracking-wider mb-1">Material Inwarded</div>
              <div className="text-2xl font-black text-blue-700">{receivedPurchasesCount}</div>
              <div className="text-[11px] text-slate-500 mt-1">Received at plant / store</div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs">
              <div className="text-xs font-bold text-teal-700 uppercase tracking-wider mb-1">Paid & Settled</div>
              <div className="text-2xl font-black text-teal-700">{paidPurchasesCount}</div>
              <div className="text-[11px] text-slate-500 mt-1">Accounts cleared</div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs col-span-2 sm:col-span-1">
              <div className="text-xs font-bold text-indigo-700 uppercase tracking-wider mb-1">Total Spend Approved</div>
              <div className="text-xl sm:text-2xl font-black text-indigo-900 font-mono">
                ₹{totalSpendAuthorized >= 100000 
                  ? `${(totalSpendAuthorized / 100000).toFixed(2)} L` 
                  : totalSpendAuthorized.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">Total commercial value</div>
            </div>
          </div>

          {/* Action Toolbar & Filters */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
              <button
                onClick={() => setPurchaseFilter('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all whitespace-nowrap ${
                  purchaseFilter === 'all'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All Orders ({purchases.length})
              </button>

              <button
                onClick={() => setPurchaseFilter('pending')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all whitespace-nowrap flex items-center gap-1.5 ${
                  purchaseFilter === 'pending'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
                }`}
              >
                <span>Awaiting My Decision</span>
                {pendingApprovalsCount > 0 && (
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                    purchaseFilter === 'pending' ? 'bg-white text-amber-700' : 'bg-amber-600 text-white'
                  }`}>
                    {pendingApprovalsCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => setPurchaseFilter('approved')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all whitespace-nowrap ${
                  purchaseFilter === 'approved'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Approved ({approvedPurchasesCount})
              </button>

              <button
                onClick={() => setPurchaseFilter('received')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all whitespace-nowrap ${
                  purchaseFilter === 'received'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Received ({receivedPurchasesCount})
              </button>

              <button
                onClick={() => setPurchaseFilter('paid')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all whitespace-nowrap ${
                  purchaseFilter === 'paid'
                    ? 'bg-teal-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Paid ({paidPurchasesCount})
              </button>

              <button
                onClick={() => setPurchaseFilter('rejected')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all whitespace-nowrap ${
                  purchaseFilter === 'rejected'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Rejected ({rejectedPurchasesCount})
              </button>
            </div>

            {/* Search and Module Link */}
            <div className="flex items-center gap-2.5">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                <input
                  type="text"
                  placeholder="Search PR, PO, Client, Vendor..."
                  value={purchaseSearch}
                  onChange={(e) => setPurchaseSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0059bb]/20 focus:border-[#0059bb]"
                />
                {purchaseSearch && (
                  <button 
                    onClick={() => setPurchaseSearch('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    ✕
                  </button>
                )}
              </div>

              <button
                onClick={() => navigate('/purchase-management')}
                className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-[#0059bb] font-bold text-xs rounded-xl border border-blue-200 flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap shadow-2xs"
                title="Open Complete Purchase Management Module"
              >
                <ShoppingBag size={14} />
                <span>Full Purchase Hub</span>
                <ArrowRight size={13} />
              </button>
            </div>
          </div>

          {/* Purchase Requisitions & Orders Table */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <ShoppingBag size={16} className="text-[#0059bb]" />
                  <span>Raw Material Purchase Requisitions & Approvals</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Showing {filteredPurchases.length} of {purchases.length} total purchase records
                </p>
              </div>

              {pendingApprovalsCount > 0 && purchaseFilter !== 'pending' && (
                <button
                  onClick={() => setPurchaseFilter('pending')}
                  className="px-3 py-1 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-lg text-xs font-bold cursor-pointer transition-all flex items-center gap-1"
                >
                  <Clock size={12} className="text-amber-700 animate-spin" />
                  <span>View {pendingApprovalsCount} Pending Decision</span>
                </button>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                    <th className="px-4 py-3">PR / PO Reference</th>
                    <th className="px-4 py-3">Private Client</th>
                    <th className="px-4 py-3">Required Raw Materials</th>
                    <th className="px-4 py-3">Vendor Quotes & L1</th>
                    <th className="px-4 py-3">Current Status</th>
                    <th className="px-4 py-3 text-right">Executive Decision</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredPurchases.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="py-12 text-center text-slate-400">
                        <ShoppingBag size={32} className="mx-auto text-slate-300 mb-2 opacity-50" />
                        <p className="text-sm font-semibold text-slate-600">No purchase requisitions found</p>
                        <p className="text-xs text-slate-400 mt-1">
                          {purchaseFilter !== 'all' 
                            ? `No orders matching filter "${purchaseFilter}". Try selecting "All Orders".`
                            : 'No purchase requirements have been created yet.'}
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredPurchases.map((purchase) => {
                      const isPendingApproval = purchase.status === 'Pending Owner Approval';
                      const isApproved = ['Approved', 'PO Created', 'Ordered', 'Partially Received', 'Fully Received', 'Payment Pending', 'Paid'].includes(purchase.status);
                      const recEstimate = purchase.vendorEstimates?.find(
                        e => e.vendorId?._id?.toString() === (purchase.recommendedVendorId?._id || purchase.recommendedVendorId)?.toString()
                      ) || purchase.vendorEstimates?.[0];
                      const estimatesCount = purchase.vendorEstimates?.length || 0;

                      return (
                        <tr 
                          key={purchase._id}
                          className={`hover:bg-slate-50/60 transition-colors ${
                            isPendingApproval ? 'bg-amber-50/40' : ''
                          }`}
                        >
                          {/* 1. PR / PO Reference */}
                          <td className="px-4 py-3.5 align-top">
                            <div className="font-bold text-slate-900 font-mono tracking-tight text-xs flex items-center gap-1.5">
                              <span>{purchase.prNo}</span>
                              {isPendingApproval && (
                                <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                              )}
                            </div>
                            {purchase.poNo && (
                              <div className="font-mono text-[11px] font-bold text-emerald-700 mt-0.5 flex items-center gap-1">
                                <FileText size={11} />
                                <span>{purchase.poNo}</span>
                              </div>
                            )}
                            <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                              <Calendar size={11} />
                              <span>Req: {new Date(purchase.requiredDate).toLocaleDateString()}</span>
                            </div>
                          </td>

                          {/* 2. Private Client */}
                          <td className="px-4 py-3.5 align-top">
                            <div className="font-bold text-slate-900">{purchase.privatePartyName}</div>
                            {purchase.quotationNo ? (
                              <div className="text-[11px] font-semibold text-[#0059bb] font-mono mt-0.5">
                                Qtn: {purchase.quotationNo}
                              </div>
                            ) : (
                              <div className="text-[10px] text-slate-400 mt-0.5">Direct Requisition</div>
                            )}
                          </td>

                          {/* 3. Materials Summary */}
                          <td className="px-4 py-3.5 align-top max-w-xs">
                            <div className="space-y-1">
                              {purchase.materials?.slice(0, 2).map((m, idx) => (
                                <div key={idx} className="text-slate-800 text-xs">
                                  <span className="font-bold text-slate-900">{m.name}</span>
                                  {m.specifications && (
                                    <span className="text-slate-500 text-[11px] ml-1">({m.specifications})</span>
                                  )}
                                  <span className="font-semibold text-slate-600 ml-1">
                                    — {m.quantity} {m.unit}
                                  </span>
                                </div>
                              ))}
                              {purchase.materials?.length > 2 && (
                                <div className="text-[10px] font-bold text-[#0059bb]">
                                  +{purchase.materials.length - 2} more items
                                </div>
                              )}
                            </div>
                          </td>

                          {/* 4. Quotes & L1 Recommendation */}
                          <td className="px-4 py-3.5 align-top">
                            <div className="flex items-center gap-1.5 mb-1">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                                {estimatesCount} {estimatesCount === 1 ? 'Quote' : 'Quotes'}
                              </span>
                              {estimatesCount >= 2 && (
                                <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  L1 Verified
                                </span>
                              )}
                            </div>
                            {recEstimate ? (
                              <div>
                                <div className="font-bold text-slate-900">{recEstimate.vendorName}</div>
                                <div className="font-mono text-xs font-bold text-emerald-700 mt-0.5">
                                  ₹{recEstimate.totalAmount?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                </div>
                                <div className="text-[10px] text-slate-400 mt-0.5">
                                  {recEstimate.deliveryTime || '3-5 Days'} | {recEstimate.paymentTerms || '30 Days Net'}
                                </div>
                              </div>
                            ) : (
                              <div className="text-[11px] text-slate-400 italic">No quotes recorded yet</div>
                            )}
                          </td>

                          {/* 5. Status Badge */}
                          <td className="px-4 py-3.5 align-top">
                            {getPurchaseStatusBadge(purchase.status)}
                            {purchase.ownerApproval?.approvedAmount > 0 && (
                              <div className="font-mono text-[11px] font-bold text-emerald-800 mt-1">
                                Approved: ₹{purchase.ownerApproval.approvedAmount.toLocaleString('en-IN')}
                              </div>
                            )}
                          </td>

                          {/* 6. Executive Decision Button */}
                          <td className="px-4 py-3.5 align-top text-right whitespace-nowrap">
                            {isPendingApproval ? (
                              <button
                                onClick={() => handleOpenApprovalModal(purchase)}
                                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 ml-auto cursor-pointer"
                              >
                                <ShieldCheck size={15} />
                                <span>Review & Decide</span>
                              </button>
                            ) : isApproved ? (
                              <div className="flex items-center justify-end gap-2">
                                <a
                                  href={`/#/purchase-order-preview?id=${purchase._id}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl flex items-center gap-1 transition-all cursor-pointer"
                                  title="View Official Purchase Order"
                                >
                                  <Printer size={13} />
                                  <span>View PO</span>
                                </a>
                                <button
                                  onClick={() => handleOpenApprovalModal(purchase)}
                                  className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-[#0059bb] font-semibold text-xs rounded-xl flex items-center gap-1 transition-all cursor-pointer"
                                  title="Compare Quotations"
                                >
                                  <Eye size={13} />
                                  <span>Quotes</span>
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => handleOpenApprovalModal(purchase)}
                                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl flex items-center gap-1 ml-auto cursor-pointer transition-all"
                              >
                                <Eye size={13} />
                                <span>View Details</span>
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: CREATE & ASSIGN NEW TASK (OWNER ONLY) */}
      {/* ========================================================================= */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-xl max-w-xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
              <div className="flex items-center gap-2">
                <CheckSquare className="text-[#0059bb]" size={20} />
                <h3 className="text-base font-bold text-slate-900">Assign New Task (Owner Delegator)</h3>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="p-6 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Task Title <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Prepare Private Invoice for GUVNL / Verify Challan"
                  value={taskForm.title}
                  onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0059bb]/20 focus:border-[#0059bb]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Task Description / Instructions
                </label>
                <textarea
                  rows="3"
                  placeholder="Detailed instructions for the team member..."
                  value={taskForm.description}
                  onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0059bb]/20 focus:border-[#0059bb]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Assign To Team Member <span className="text-rose-600">*</span>
                  </label>
                  <select
                    required
                    value={taskForm.assignedTo}
                    onChange={(e) => setTaskForm({ ...taskForm, assignedTo: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#0059bb]/20 cursor-pointer"
                  >
                    <option value="">Select Team Member</option>
                    {assignableUsers.map(u => (
                      <option key={u._id} value={u._id}>
                        {u.name} — {u.department} ({u.designation || u.role})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Priority Level
                  </label>
                  <select
                    value={taskForm.priority}
                    onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#0059bb]/20 cursor-pointer"
                  >
                    <option value="urgent">Urgent</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={taskForm.startDate}
                    onChange={(e) => setTaskForm({ ...taskForm, startDate: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0059bb]/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Due Date <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={taskForm.dueDate}
                    onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0059bb]/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Related Module / Record (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Private Invoice #PINV-2026-001, Challan #CH-108, Master Data"
                  value={taskForm.relatedModule}
                  onChange={(e) => setTaskForm({ ...taskForm, relatedModule: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0059bb]/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Owner Notes / Private Remarks
                </label>
                <input
                  type="text"
                  placeholder="e.g. Please verify with client accountant before submission"
                  value={taskForm.notes}
                  onChange={(e) => setTaskForm({ ...taskForm, notes: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0059bb]/20"
                />
              </div>

              <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-100 text-xs text-[#0059bb] flex items-center gap-2">
                <AlertCircle size={16} className="shrink-0" />
                <span>
                  The assigned team member will immediately receive an in-app notification and email dispatch with full task details.
                </span>
              </div>

              <div className="pt-2 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 text-xs sm:text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 text-xs sm:text-sm font-semibold text-white bg-[#0059bb] hover:bg-[#004899] rounded-xl cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Assigning...' : 'Assign Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: REASSIGN TASK MODAL (OWNER ONLY) */}
      {/* ========================================================================= */}
      {isReassignModalOpen && selectedTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <ArrowRightLeft className="text-[#0059bb]" size={16} />
                <span>Reassign Task</span>
              </h3>
              <button onClick={() => setIsReassignModalOpen(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleReassign} className="p-6 space-y-4">
              <div>
                <span className="text-xs text-slate-500 block">Task Title:</span>
                <span className="font-bold text-slate-900 text-sm">{selectedTask.title}</span>
              </div>

              <div>
                <span className="text-xs text-slate-500 block">Currently Assigned To:</span>
                <span className="font-semibold text-slate-800 text-xs">
                  {selectedTask.assignedTo?.name || 'Unassigned'} ({selectedTask.assignedTo?.department || 'Staff'})
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Reassign To New Team Member <span className="text-rose-600">*</span>
                </label>
                <select
                  required
                  value={reassignUserId}
                  onChange={(e) => setReassignUserId(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#0059bb]/20 cursor-pointer"
                >
                  <option value="">Select New Assignee</option>
                  {assignableUsers
                    .filter(u => u._id !== selectedTask.assignedTo?._id)
                    .map(u => (
                      <option key={u._id} value={u._id}>
                        {u.name} — {u.department} ({u.designation || u.role})
                      </option>
                    ))}
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsReassignModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !reassignUserId}
                  className="px-4 py-2 text-xs font-semibold text-white bg-[#0059bb] hover:bg-[#004899] rounded-xl cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Reassigning...' : 'Confirm Reassignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: EDIT TASK MODAL (OWNER ONLY) */}
      {/* ========================================================================= */}
      {isEditModalOpen && selectedTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Edit3 className="text-[#0059bb]" size={16} />
                <span>Edit Task Details</span>
              </h3>
              <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-6 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Task Title</label>
                <input
                  type="text"
                  required
                  value={selectedTask.title}
                  onChange={(e) => setSelectedTask({ ...selectedTask, title: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0059bb]/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
                <textarea
                  rows="2"
                  value={selectedTask.description || ''}
                  onChange={(e) => setSelectedTask({ ...selectedTask, description: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0059bb]/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Priority</label>
                  <select
                    value={selectedTask.priority}
                    onChange={(e) => setSelectedTask({ ...selectedTask, priority: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white"
                  >
                    <option value="urgent">Urgent</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
                  <select
                    value={selectedTask.status}
                    onChange={(e) => setSelectedTask({ ...selectedTask, status: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white"
                  >
                    <option value="pending">Pending</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="on_hold">On Hold</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Due Date</label>
                <input
                  type="date"
                  required
                  value={selectedTask.dueDate ? new Date(selectedTask.dueDate).toISOString().slice(0, 10) : ''}
                  onChange={(e) => setSelectedTask({ ...selectedTask, dueDate: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Related Module</label>
                <input
                  type="text"
                  value={selectedTask.relatedModule || ''}
                  onChange={(e) => setSelectedTask({ ...selectedTask, relatedModule: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-xs font-semibold text-white bg-[#0059bb] hover:bg-[#004899] rounded-xl cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: PURCHASE APPROVAL & QUOTE COMPARISON DECISION MODAL (OWNER) */}
      {/* ========================================================================= */}
      {isPurchaseApprovalModalOpen && selectedPurchase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                    <span>Executive Purchase Authorization (Owner Decision Hub)</span>
                  </h3>
                  <p className="text-[11px] text-slate-300">
                    Review quotation comparison, select approved supplier, and authorize Purchase Order issuance.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsPurchaseApprovalModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 overflow-y-auto flex-1 text-xs">
              {/* 1. Requisition Reference Banner */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-400">Requisition Ref (PR)</div>
                  <div className="font-mono font-bold text-slate-900 text-sm mt-0.5">{selectedPurchase.prNo}</div>
                </div>

                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-400">Private Client</div>
                  <div className="font-bold text-slate-900 mt-0.5">{selectedPurchase.privatePartyName}</div>
                  {selectedPurchase.quotationNo && (
                    <div className="font-mono text-[10px] text-[#0059bb] font-bold">Qtn: {selectedPurchase.quotationNo}</div>
                  )}
                </div>

                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-400">Required By Date</div>
                  <div className="font-semibold text-slate-800 mt-0.5">
                    {new Date(selectedPurchase.requiredDate).toLocaleDateString()}
                  </div>
                </div>

                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-400">Approval Status</div>
                  <div className="mt-0.5">{getPurchaseStatusBadge(selectedPurchase.status)}</div>
                </div>
              </div>

              {/* 2. Required Raw Materials Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="bg-slate-100 px-3.5 py-2 font-bold text-slate-800 flex items-center justify-between text-xs">
                  <span>Required Raw Materials Breakdown</span>
                  <span className="text-[11px] text-slate-500 font-normal">{selectedPurchase.materials?.length || 0} item(s)</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[10px] uppercase font-semibold">
                        <th className="p-2.5">Item Name</th>
                        <th className="p-2.5">Specification / Size</th>
                        <th className="p-2.5 text-right">Required Quantity</th>
                        <th className="p-2.5 text-right">Unit</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedPurchase.materials?.map((mat, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50">
                          <td className="p-2.5 font-bold text-slate-900">{mat.name}</td>
                          <td className="p-2.5 text-slate-600">{mat.specifications || 'Standard Grade'}</td>
                          <td className="p-2.5 text-right font-mono font-semibold">{mat.quantity}</td>
                          <td className="p-2.5 text-right text-slate-600">{mat.unit}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 3. Multi-Vendor Quotation Comparison Matrix */}
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                <div className="bg-slate-900 text-white px-3.5 py-2.5 font-bold flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Award size={15} className="text-amber-400" />
                    <span>Multi-Vendor Quotation Comparison Matrix</span>
                  </div>
                  <span className="text-[11px] text-slate-300 font-normal">
                    {selectedPurchase.vendorEstimates?.length || 0} vendor quote(s) recorded
                  </span>
                </div>

                {(!selectedPurchase.vendorEstimates || selectedPurchase.vendorEstimates.length === 0) ? (
                  <div className="p-6 text-center text-slate-400">
                    <p className="font-semibold text-slate-600">No vendor estimates recorded yet for this purchase requisition.</p>
                    <p className="text-[11px] text-slate-400 mt-1">Quotations will appear here once recorded by the Purchase Manager.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 text-[11px]">
                          <th className="p-3 font-bold border-r border-slate-200 min-w-[140px]">Component</th>
                          <th className="p-3 font-bold border-r border-slate-200 w-20 text-right">Required</th>
                          {selectedPurchase.vendorEstimates.map((est, idx) => {
                            const isRec = (est.vendorId?._id || est.vendorId)?.toString() === (selectedPurchase.recommendedVendorId?._id || selectedPurchase.recommendedVendorId)?.toString();
                            return (
                              <th key={idx} className={`p-3 font-bold text-right min-w-[180px] ${
                                isRec ? 'bg-emerald-50 text-emerald-950 border-emerald-300' : 'text-slate-800'
                              }`}>
                                <div className="font-bold text-sm">{est.vendorName}</div>
                                {isRec && (
                                  <span className="inline-block mt-0.5 px-2 py-0.5 rounded-full text-[9px] font-black bg-emerald-600 text-white uppercase">
                                    ★ PM Recommended
                                  </span>
                                )}
                                <div className="text-[10px] text-slate-500 font-normal mt-0.5">
                                  {est.quotationNo ? `Qtn: ${est.quotationNo}` : 'Direct Quote'}
                                </div>
                              </th>
                            );
                          })}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {/* Per-Item Rates */}
                        {selectedPurchase.materials?.map((mat, mIdx) => (
                          <tr key={mIdx} className="hover:bg-slate-50/50">
                            <td className="p-3 font-semibold text-slate-900 border-r border-slate-200">
                              <div>{mat.name}</div>
                              <div className="text-[10px] text-slate-400 font-normal">{mat.specifications}</div>
                            </td>
                            <td className="p-3 text-right font-mono text-slate-600 border-r border-slate-200">
                              {mat.quantity} {mat.unit}
                            </td>
                            {selectedPurchase.vendorEstimates.map((est, eIdx) => {
                              const itemPrice = est.materialPrices?.find(
                                p => p.materialId?.toString() === mat._id?.toString() || p.name === mat.name
                              );
                              return (
                                <td key={eIdx} className="p-3 text-right font-mono">
                                  {itemPrice ? (
                                    <div>
                                      <div className="font-bold text-slate-900">₹{itemPrice.rate?.toLocaleString('en-IN')}/{mat.unit}</div>
                                      <div className="text-[10px] text-slate-400">₹{itemPrice.subtotal?.toLocaleString('en-IN')}</div>
                                    </div>
                                  ) : (
                                    <span className="text-slate-300">-</span>
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        ))}

                        {/* Subtotal Row */}
                        <tr className="bg-slate-50 font-semibold border-t border-slate-200">
                          <td colSpan="2" className="p-3 text-slate-700 border-r border-slate-200">
                            Subtotal (Excl. Tax):
                          </td>
                          {selectedPurchase.vendorEstimates.map((est, idx) => (
                            <td key={idx} className="p-3 text-right font-mono text-slate-800">
                              ₹{est.subtotal?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </td>
                          ))}
                        </tr>

                        {/* GST Row */}
                        <tr className="bg-slate-50">
                          <td colSpan="2" className="p-3 text-slate-500 border-r border-slate-200">
                            GST Tax ({selectedPurchase.vendorEstimates[0]?.gstPercentage || 18}%):
                          </td>
                          {selectedPurchase.vendorEstimates.map((est, idx) => (
                            <td key={idx} className="p-3 text-right font-mono text-slate-600">
                              ₹{est.gstAmount?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </td>
                          ))}
                        </tr>

                        {/* Transport / Freight Row */}
                        <tr className="bg-slate-50">
                          <td colSpan="2" className="p-3 text-slate-500 border-r border-slate-200">
                            Freight & Delivery Charges:
                          </td>
                          {selectedPurchase.vendorEstimates.map((est, idx) => (
                            <td key={idx} className="p-3 text-right font-mono text-slate-600">
                              ₹{(est.shippingCharges || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </td>
                          ))}
                        </tr>

                        {/* Total Cost Row with L1 Highlight */}
                        {(() => {
                          const totals = selectedPurchase.vendorEstimates.map(e => e.totalAmount || 0);
                          const minTotal = Math.min(...totals.filter(t => t > 0));

                          return (
                            <tr className="bg-blue-50/80 border-t-2 border-slate-300 font-black">
                              <td colSpan="2" className="p-3 text-slate-900 text-sm border-r border-slate-200 uppercase">
                                TOTAL DELIVERED COST:
                              </td>
                              {selectedPurchase.vendorEstimates.map((est, idx) => {
                                const isLowest = est.totalAmount === minTotal;
                                return (
                                  <td key={idx} className={`p-3 text-right font-mono text-sm ${
                                    isLowest ? 'text-emerald-700 bg-emerald-50/80' : 'text-slate-900'
                                  }`}>
                                    <div className="text-base font-black">
                                      ₹{est.totalAmount?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                    </div>
                                    {isLowest && (
                                      <span className="inline-block mt-0.5 px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-600 text-white shadow-2xs">
                                        ★ LOWEST TOTAL (L1)
                                      </span>
                                    )}
                                  </td>
                                );
                              })}
                            </tr>
                          );
                        })()}

                        {/* Commercial Terms Rows */}
                        <tr className="bg-slate-50/50">
                          <td colSpan="2" className="p-3 text-slate-500 font-semibold border-r border-slate-200">Delivery Lead Time:</td>
                          {selectedPurchase.vendorEstimates.map((est, idx) => (
                            <td key={idx} className="p-3 text-right text-slate-800 font-semibold">
                              {est.deliveryTime || '3-5 Days'}
                            </td>
                          ))}
                        </tr>
                        <tr className="bg-slate-50/50">
                          <td colSpan="2" className="p-3 text-slate-500 font-semibold border-r border-slate-200">Payment Credit Terms:</td>
                          {selectedPurchase.vendorEstimates.map((est, idx) => (
                            <td key={idx} className="p-3 text-right text-slate-800 font-semibold">
                              {est.paymentTerms || '30 Days Net'}
                            </td>
                          ))}
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* 4. Purchase Manager Justification Note */}
              <div className="p-4 bg-indigo-50/60 rounded-xl border border-indigo-200 space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-950">
                  <CheckSquare size={14} className="text-indigo-600" />
                  <span>Purchase Manager Recommendation & Note:</span>
                </div>
                <div className="text-slate-800 text-xs">
                  Recommended Vendor:{' '}
                  <strong className="text-indigo-900">
                    {selectedPurchase.recommendedVendorId?.name || selectedPurchase.vendorEstimates?.[0]?.vendorName || 'Not specified'}
                  </strong>
                </div>
                {selectedPurchase.recommendationNotes && (
                  <div className="text-slate-600 italic text-xs mt-0.5">
                    "{selectedPurchase.recommendationNotes}"
                  </div>
                )}
              </div>

              {/* 5. Executive Decision Section */}
              {selectedPurchase.status === 'Pending Owner Approval' ? (
                <div className="p-4 bg-white rounded-2xl border-2 border-[#0059bb]/30 space-y-4 shadow-sm">
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                      <ShieldCheck size={16} className="text-[#0059bb]" />
                      <span>Select Executive Decision:</span>
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Choose to approve and issue PO, request supplier negotiation/changes, or reject the requisition.
                    </p>
                  </div>

                  {/* 3 Decision Tabs */}
                  <div className="grid grid-cols-3 gap-2.5">
                    <button
                      type="button"
                      onClick={() => setApprovalActionType('approve')}
                      className={`py-2.5 px-3 rounded-xl border font-bold text-center cursor-pointer transition-all flex items-center justify-center gap-1.5 ${
                        approvalActionType === 'approve'
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-md ring-2 ring-emerald-500/20'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <CheckCircle2 size={15} />
                      <span>✓ Approve & Issue PO</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setApprovalActionType('request_changes')}
                      className={`py-2.5 px-3 rounded-xl border font-bold text-center cursor-pointer transition-all flex items-center justify-center gap-1.5 ${
                        approvalActionType === 'request_changes'
                          ? 'bg-amber-600 text-white border-amber-600 shadow-md ring-2 ring-amber-500/20'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <RefreshCcw size={14} />
                      <span>⚡ Request Changes</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setApprovalActionType('reject')}
                      className={`py-2.5 px-3 rounded-xl border font-bold text-center cursor-pointer transition-all flex items-center justify-center gap-1.5 ${
                        approvalActionType === 'reject'
                          ? 'bg-rose-600 text-white border-rose-600 shadow-md ring-2 ring-rose-500/20'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <X size={15} />
                      <span>✕ Reject</span>
                    </button>
                  </div>

                  {/* Decision Details Form */}
                  {approvalActionType === 'approve' && (
                    <div className="space-y-3.5 pt-1 animate-in fade-in">
                      {/* Vendor Selection for Approval */}
                      <div>
                        <label className="block font-bold text-slate-800 mb-1.5">
                          Select Vendor to Authorize for Official Purchase Order: <span className="text-rose-600">*</span>
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                          {selectedPurchase.vendorEstimates?.map((est) => {
                            const isSelected = approvalVendorId === (est.vendorId?._id || est.vendorId);
                            return (
                              <div
                                key={est._id}
                                onClick={() => setApprovalVendorId(est.vendorId?._id || est.vendorId)}
                                className={`p-3 rounded-xl border cursor-pointer transition-all ${
                                  isSelected
                                    ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500/20'
                                    : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="font-bold text-slate-900">{est.vendorName}</div>
                                  {isSelected && <CheckCircle2 size={16} className="text-emerald-600" />}
                                </div>
                                <div className="font-mono text-sm font-black text-emerald-700 mt-1">
                                  ₹{est.totalAmount?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                </div>
                                <div className="text-[10px] text-slate-500 mt-1">
                                  {est.deliveryTime || '3-5 Days'} | {est.paymentTerms || '30 Days Net'}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Owner Remarks */}
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">
                          Owner Remarks / Instructions for Purchase Order (Optional)
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Approved. Ensure dispatch before 25th Sept, test certificate required on delivery."
                          value={approvalRemarks}
                          onChange={(e) => setApprovalRemarks(e.target.value)}
                          className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                        />
                      </div>

                      <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-900 text-[11px] leading-relaxed">
                        ⚡ <strong>System Action Upon Approval:</strong> Official PO number (e.g. PO-{selectedPurchase.prNo?.replace('PR-', '')}) will be generated, the Purchase Order register will update immediately, the Purchase Manager & Store inward team will be alerted, and Accounts will be queued for payment.
                      </div>
                    </div>
                  )}

                  {approvalActionType === 'request_changes' && (
                    <div className="space-y-3 pt-1 animate-in fade-in">
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">
                          Modifications / Negotiations Required <span className="text-rose-600">*</span>
                        </label>
                        <textarea
                          rows="3"
                          placeholder="e.g. Negotiate a 3% cash discount with L1 vendor or check whether Kailaspati can match 2-day delivery."
                          value={approvalRemarks}
                          onChange={(e) => setApprovalRemarks(e.target.value)}
                          className="w-full px-3.5 py-2 rounded-xl border border-amber-300 bg-amber-50/30 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                        />
                      </div>
                      <p className="text-[11px] text-amber-800">
                        ⚡ The Purchase Manager will be notified with your feedback to re-negotiate with vendors and submit a revised proposal.
                      </p>
                    </div>
                  )}

                  {approvalActionType === 'reject' && (
                    <div className="space-y-3 pt-1 animate-in fade-in">
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">
                          Reason for Rejection <span className="text-rose-600">*</span>
                        </label>
                        <textarea
                          rows="3"
                          placeholder="e.g. Client cancelled the private project / Raw material budget exceeded allowable ceiling."
                          value={approvalRejectionReason}
                          onChange={(e) => setApprovalRejectionReason(e.target.value)}
                          className="w-full px-3.5 py-2 rounded-xl border border-rose-300 bg-rose-50/30 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                        />
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* Already Approved / Resolved Certificate */
                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-emerald-950 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="font-bold flex items-center gap-1.5 text-emerald-900">
                      <CheckCircle2 size={16} className="text-emerald-600" />
                      <span>Owner Approval Record</span>
                    </div>
                    {selectedPurchase.poNo && (
                      <span className="font-mono text-xs font-black bg-emerald-600 text-white px-2.5 py-0.5 rounded-full">
                        {selectedPurchase.poNo}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs pt-1">
                    <div>
                      <span className="text-slate-500 text-[11px] block">Approved Supplier:</span>
                      <strong className="text-slate-900">{selectedPurchase.ownerApproval?.approvedVendorName || 'Selected Vendor'}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[11px] block">Approved Commercial Value:</span>
                      <strong className="font-mono text-emerald-700 text-sm">
                        ₹{selectedPurchase.ownerApproval?.approvedAmount?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[11px] block">Approved On:</span>
                      <strong className="text-slate-900">
                        {selectedPurchase.ownerApproval?.approvalDate ? new Date(selectedPurchase.ownerApproval.approvalDate).toLocaleString() : 'N/A'}
                      </strong>
                    </div>
                  </div>

                  {selectedPurchase.ownerApproval?.ownerRemarks && (
                    <div className="text-slate-700 text-xs italic pt-1">
                      Owner Instructions: "{selectedPurchase.ownerApproval.ownerRemarks}"
                    </div>
                  )}

                  <div className="pt-2">
                    <a
                      href={`/#/purchase-order-preview?id=${selectedPurchase._id}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
                    >
                      <Printer size={13} />
                      <span>Print Official Purchase Order (PO)</span>
                    </a>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setIsPurchaseApprovalModalOpen(false)}
                className="px-4 py-2 font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-100 cursor-pointer transition-all text-xs"
              >
                Close Window
              </button>

              {selectedPurchase.status === 'Pending Owner Approval' && (
                <button
                  type="button"
                  disabled={isSubmittingApproval}
                  onClick={handleOwnerApprovalAction}
                  className={`px-5 py-2 font-bold text-white rounded-xl cursor-pointer disabled:opacity-50 transition-all flex items-center gap-2 shadow-xs text-xs ${
                    approvalActionType === 'approve'
                      ? 'bg-emerald-600 hover:bg-emerald-700'
                      : approvalActionType === 'reject'
                      ? 'bg-rose-600 hover:bg-rose-700'
                      : 'bg-amber-600 hover:bg-amber-700'
                  }`}
                >
                  <ShieldCheck size={15} />
                  <span>
                    {isSubmittingApproval 
                      ? 'Processing Action...' 
                      : (approvalActionType === 'approve' 
                        ? 'Confirm Approval & Issue PO' 
                        : (approvalActionType === 'reject' ? 'Confirm Rejection' : 'Submit Change Request'))}
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
