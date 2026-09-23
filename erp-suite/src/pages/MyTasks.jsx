import React, { useState, useEffect } from 'react';
import { 
  CheckSquare, Clock, AlertTriangle, CheckCircle2, Search, Filter, 
  ChevronRight, Calendar, User, MessageSquare, Send, RefreshCcw, 
  ExternalLink, FileText, ArrowRight, ShieldAlert, Sparkles 
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { getTasks, updateTask, addTaskComment } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

export default function MyTasks() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const initialTaskId = searchParams.get('taskId');

  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [newComment, setNewComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  const fetchUserTasks = async () => {
    setIsLoading(true);
    try {
      const data = await getTasks();
      setTasks(data || []);

      if (initialTaskId && data) {
        const found = data.find(t => t._id === initialTaskId);
        if (found) setSelectedTask(found);
      }
    } catch (err) {
      console.error('Failed to load tasks:', err);
      toast.error('Could not fetch assigned tasks');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUserTasks();
  }, []);

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      const updated = await updateTask(taskId, { status: newStatus });
      setTasks(prev => prev.map(t => t._id === taskId ? updated : t));
      if (selectedTask && selectedTask._id === taskId) {
        setSelectedTask(updated);
      }
      toast.success(`Task status updated to ${newStatus.replace('_', ' ').toUpperCase()}`);
    } catch (err) {
      console.error('Status update failed:', err);
      toast.error('Failed to update task status');
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !selectedTask) return;

    setIsSubmittingComment(true);
    try {
      const updated = await addTaskComment(selectedTask._id, { text: newComment.trim() });
      setSelectedTask(updated);
      setTasks(prev => prev.map(t => t._id === updated._id ? updated : t));
      setNewComment('');
      toast.success('Comment posted');
    } catch (err) {
      console.error('Comment failed:', err);
      toast.error('Failed to post comment');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  // KPIs
  const totalTasks = tasks.length;
  const pendingCount = tasks.filter(t => t.status === 'pending' || t.status === 'in_progress').length;
  const completedCount = tasks.filter(t => t.status === 'completed').length;
  const overdueCount = tasks.filter(t => {
    return t.status !== 'completed' && t.status !== 'cancelled' && new Date(t.dueDate) < new Date();
  }).length;

  // Filtered List
  const filteredTasks = tasks.filter(t => {
    if (statusFilter !== 'all' && t.status !== statusFilter) return false;
    if (priorityFilter !== 'all' && t.priority !== priorityFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = t.title?.toLowerCase().includes(q);
      const matchDesc = t.description?.toLowerCase().includes(q);
      const matchModule = t.relatedModule?.toLowerCase().includes(q);
      if (!matchTitle && !matchDesc && !matchModule) return false;
    }
    return true;
  });

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'urgent':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-700 border border-rose-200">Urgent</span>;
      case 'high':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">High</span>;
      case 'medium':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-[#0059bb] border border-blue-200">Medium</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">Low</span>;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">Completed</span>;
      case 'in_progress':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">In Progress</span>;
      case 'on_hold':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-200">On Hold</span>;
      case 'cancelled':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">Cancelled</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">Pending</span>;
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              My Assigned Tasks
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-[#0059bb] border border-blue-100">
              Assigned by Owner
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Track, update, and collaborate on operational tasks assigned directly to you by the Owner.
          </p>
        </div>

        <button
          onClick={fetchUserTasks}
          disabled={isLoading}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-semibold transition-colors cursor-pointer shadow-xs"
        >
          <RefreshCcw size={15} className={isLoading ? 'animate-spin' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Assigned</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#0059bb] flex items-center justify-center">
              <CheckSquare size={18} />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-slate-900">{totalTasks}</div>
          <div className="text-xs text-slate-400 mt-1">All tasks on your plate</div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-amber-600 uppercase tracking-wider">Pending Action</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock size={18} />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-amber-600">{pendingCount}</div>
          <div className="text-xs text-slate-400 mt-1">In progress or pending</div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Completed</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-emerald-600">{completedCount}</div>
          <div className="text-xs text-slate-400 mt-1">Successfully delivered</div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-rose-600 uppercase tracking-wider">Overdue</span>
            <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertTriangle size={18} />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-rose-600">{overdueCount}</div>
          <div className="text-xs text-slate-400 mt-1">Past deadline</div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search size={16} className="absolute left-3.5 top-3 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search tasks or modules..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0059bb]/20 focus:border-[#0059bb]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* Status filter */}
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
          </select>

          {/* Priority filter */}
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

          {(statusFilter !== 'all' || priorityFilter !== 'all' || searchQuery) && (
            <button
              onClick={() => {
                setStatusFilter('all');
                setPriorityFilter('all');
                setSearchQuery('');
              }}
              className="text-xs text-rose-600 hover:underline px-2 font-medium cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Main Task List & Detail Drawer Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Task Cards Column */}
        <div className={`space-y-3.5 ${selectedTask ? 'lg:col-span-7' : 'lg:col-span-12'}`}>
          {isLoading ? (
            <div className="p-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
              <RefreshCcw size={28} className="animate-spin mx-auto mb-2 text-[#0059bb]" />
              <p className="text-sm">Loading your assigned tasks...</p>
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className="p-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
              <CheckCircle2 size={36} className="mx-auto mb-2 text-slate-300" />
              <p className="text-sm font-semibold text-slate-700">No tasks found</p>
              <p className="text-xs text-slate-400 mt-1">
                {searchQuery || statusFilter !== 'all' ? 'Try adjusting your search filters.' : 'You have no tasks assigned at this moment.'}
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
                        <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-rose-600 text-white flex items-center gap-1 animate-pulse">
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

                  {task.relatedModule && (
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-medium mb-3">
                      <ExternalLink size={12} className="text-slate-500" />
                      <span>{task.relatedModule}</span>
                    </div>
                  )}

                  {/* Task Card Footer */}
                  <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <User size={13} className="text-slate-400" />
                      <span>Assigned by: <strong>{task.assignedBy?.name || 'Owner'}</strong></span>
                      {task.comments?.length > 0 && (
                        <span className="flex items-center gap-1 text-slate-400 ml-2">
                          <MessageSquare size={13} /> {task.comments.length}
                        </span>
                      )}
                    </div>

                    {/* Quick Status Updater */}
                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      <select
                        value={task.status}
                        onChange={(e) => handleStatusChange(task._id, e.target.value)}
                        className="px-2.5 py-1 rounded-lg border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#0059bb] cursor-pointer"
                      >
                        <option value="pending">Pending</option>
                        <option value="in_progress">In Progress</option>
                        <option value="completed">Completed ✓</option>
                        <option value="on_hold">On Hold</option>
                      </select>

                      {task.status !== 'completed' && (
                        <button
                          onClick={() => handleStatusChange(task._id, 'completed')}
                          className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors cursor-pointer"
                          title="Mark Completed"
                        >
                          ✓ Done
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Task Details Drawer Column */}
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

            {/* Task Info Grid */}
            <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50/80 p-3.5 rounded-xl border border-slate-100">
              <div>
                <span className="text-slate-400 block font-medium">Assigned By</span>
                <span className="text-slate-900 font-bold">{selectedTask.assignedBy?.name || 'Owner'} (Owner)</span>
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
                <span className="text-slate-400 block font-medium">Status</span>
                <span className="capitalize font-bold text-[#0059bb]">{selectedTask.status.replace('_', ' ')}</span>
              </div>
            </div>

            {/* Description */}
            <div>
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Description</h4>
              <p className="text-xs text-slate-700 whitespace-pre-line leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                {selectedTask.description || 'No detailed instructions provided.'}
              </p>
            </div>

            {/* Notes if any */}
            {selectedTask.notes && (
              <div>
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Notes</h4>
                <p className="text-xs text-slate-600 italic bg-amber-50/60 p-2.5 rounded-xl border border-amber-100/80">
                  {selectedTask.notes}
                </p>
              </div>
            )}

            {/* Update Status Action */}
            <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100 flex items-center justify-between gap-3">
              <span className="text-xs font-semibold text-slate-700">Update Status:</span>
              <select
                value={selectedTask.status}
                onChange={(e) => handleStatusChange(selectedTask._id, e.target.value)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-bold text-[#0059bb] focus:outline-none focus:ring-2 focus:ring-[#0059bb]/20 cursor-pointer"
              >
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed ✓</option>
                <option value="on_hold">On Hold</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            {/* Activity History Log */}
            <div>
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Activity History</h4>
              <div className="max-h-40 overflow-y-auto space-y-2 text-xs border border-slate-100 p-3 rounded-xl bg-slate-50/50">
                {(!selectedTask.history || selectedTask.history.length === 0) ? (
                  <p className="text-slate-400 italic">No activity logged yet.</p>
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

            {/* Comments & Discussion */}
            <div>
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center justify-between">
                <span>Discussion / Notes</span>
                <span className="text-slate-400 font-normal">({selectedTask.comments?.length || 0})</span>
              </h4>

              <div className="max-h-48 overflow-y-auto space-y-2.5 mb-3">
                {(!selectedTask.comments || selectedTask.comments.length === 0) ? (
                  <p className="text-xs text-slate-400 text-center py-3">No comments yet. Post an update below.</p>
                ) : (
                  selectedTask.comments.map((c, idx) => {
                    const isMe = c.user?._id === user?._id || c.userName === user?.name;
                    return (
                      <div
                        key={idx}
                        className={`p-2.5 rounded-xl text-xs ${
                          isMe ? 'bg-blue-50 border border-blue-100 ml-4' : 'bg-slate-50 border border-slate-200 mr-4'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span className="font-bold text-slate-900">
                            {c.userName} {c.userRole === 'owner' ? '(Owner)' : ''}
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

              {/* Add Comment Input */}
              <form onSubmit={handleAddComment} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Write a message / update for Owner..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0059bb]/20 focus:border-[#0059bb]"
                />
                <button
                  type="submit"
                  disabled={isSubmittingComment || !newComment.trim()}
                  className="px-3.5 py-2 rounded-xl bg-[#0059bb] hover:bg-[#004899] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <Send size={13} />
                  <span>Send</span>
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
