import React, { useState } from 'react';
import { 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Award, 
  Calendar, 
  ExternalLink, 
  Check
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ALL_MODULES } from '../../utils/permissionUtils';
import { updateTask } from '../../services/api';
import toast from 'react-hot-toast';

export default function EmployeeDashboardView({ data, onTaskUpdated }) {
  const navigate = useNavigate();
  const [taskFilter, setTaskFilter] = useState('all'); // 'all', 'in_progress', 'completed', 'overdue'
  const [updatingTaskId, setUpdatingTaskId] = useState(null);

  if (!data) return null;

  const { metrics, allTasks, assignedModules } = data;

  const handleUpdateProgress = async (taskId, currentProgress, newProgress) => {
    setUpdatingTaskId(taskId);
    try {
      const isComplete = newProgress >= 100;
      await updateTask(taskId, {
        progress: Math.min(100, Math.max(0, newProgress)),
        status: isComplete ? 'completed' : 'in_progress',
      });
      toast.success(isComplete ? 'Task marked as Completed! 🎉' : `Progress updated to ${newProgress}%`);
      if (onTaskUpdated) onTaskUpdated();
    } catch (err) {
      toast.error('Failed to update task progress');
    } finally {
      setUpdatingTaskId(null);
    }
  };

  // Filter tasks based on selected tab
  const filteredTasks = (allTasks || []).filter((task) => {
    if (taskFilter === 'all') return true;
    if (taskFilter === 'completed') return task.status === 'completed';
    if (taskFilter === 'in_progress') return task.status === 'in_progress' || task.status === 'pending';
    if (taskFilter === 'overdue') {
      const now = new Date();
      return task.status !== 'completed' && (task.status === 'overdue' || (task.dueDate && new Date(task.dueDate) < now));
    }
    return true;
  });

  // Find module labels from ALL_MODULES
  const permittedModuleObjects = (assignedModules || []).map((path) => {
    const found = ALL_MODULES.find(m => m.path === path);
    return found || { path, label: path.replace('/', '').replace(/-/g, ' ') };
  });

  return (
    <div className="flex flex-col gap-6">
      {/* Top Worker KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col justify-between shadow-xs hover:shadow-md transition-shadow">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Today's Schedule</span>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-blue-50 text-blue-600">
              <Calendar size={20} />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-blue-600 leading-tight">
            {metrics.todayTasksCount}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Tasks scheduled for today
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col justify-between shadow-xs hover:shadow-md transition-shadow">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Assigned Tasks</span>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-purple-50 text-purple-600">
              <Clock size={20} />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-tight">{metrics.totalAssigned}</div>
          <div className="text-xs text-emerald-600 font-semibold mt-1">
            {metrics.completedCount} Completed ({metrics.completionRate}%)
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col justify-between shadow-xs hover:shadow-md transition-shadow">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">My Performance Score</span>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-emerald-50 text-emerald-600">
              <Award size={20} />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600 leading-tight">
            {metrics.performanceScore}%
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Quality & milestone delivery index
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col justify-between shadow-xs hover:shadow-md transition-shadow">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Overdue Tasks</span>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${metrics.overdueCount > 0 ? 'bg-rose-50 text-rose-600' : 'bg-slate-50 text-slate-400'}`}>
              <AlertTriangle size={20} />
            </div>
          </div>
          <div className={`text-2xl sm:text-3xl font-extrabold leading-tight ${metrics.overdueCount > 0 ? 'text-rose-600' : 'text-slate-900'}`}>
            {metrics.overdueCount}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {metrics.inProgressCount} In Progress
          </div>
        </div>
      </div>

      {/* Permitted Department Module Shortcuts */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs">
        <div className="flex justify-between items-center mb-3">
          <span className="text-xs sm:text-sm font-bold text-slate-700 uppercase tracking-wider">
            My Permitted Department Modules
          </span>
          <span className="text-xs text-slate-500">Assigned by Administrator</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {permittedModuleObjects.map((mod) => (
            <button 
              key={mod.path} 
              className="flex items-center gap-2.5 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 hover:bg-white hover:border-blue-600 hover:text-blue-600 hover:-translate-y-0.5 hover:shadow-xs transition-all text-left" 
              onClick={() => navigate(mod.path)}
            >
              <ExternalLink size={18} className="text-blue-600 shrink-0" />
              <span className="capitalize truncate">{mod.label}</span>
            </button>
          ))}
          {permittedModuleObjects.length === 0 && (
            <div className="col-span-full text-xs text-slate-400 py-2">
              No custom module shortcuts assigned yet. Contact your department manager.
            </div>
          )}
        </div>
      </div>

      {/* Main Tasks List with Filter Tabs and Quick Progress Updaters */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs">
        <div className="flex flex-wrap justify-between items-center gap-3 mb-5 pb-3 border-b border-slate-100">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Clock size={18} className="text-blue-600" />
            My Assigned Operational Tasks
          </h2>

          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            {[
              { key: 'all', label: `All (${metrics.totalAssigned})` },
              { key: 'in_progress', label: `In Progress (${metrics.inProgressCount})` },
              { key: 'completed', label: `Completed (${metrics.completedCount})` },
              { key: 'overdue', label: `Overdue (${metrics.overdueCount})` },
            ].map((tab) => (
              <button
                key={tab.key}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${taskFilter === tab.key ? 'bg-white text-blue-600 shadow-2xs' : 'text-slate-600 hover:text-slate-900'}`}
                onClick={() => setTaskFilter(tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-3">
          {filteredTasks.map((task) => {
            const now = new Date();
            const isOverdue = task.status !== 'completed' && (task.status === 'overdue' || (task.dueDate && new Date(task.dueDate) < now));

            return (
              <div
                key={task._id}
                className={`p-4 rounded-xl border flex flex-col gap-2.5 transition-colors ${isOverdue ? 'border-rose-200 bg-rose-50/30' : 'border-slate-200 bg-white shadow-2xs'}`}
              >
                <div className="flex justify-between items-start flex-wrap gap-2">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-bold text-slate-900">
                      {task.title}
                    </span>
                    {task.description && (
                      <span className="text-xs text-slate-500">
                        {task.description}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider whitespace-nowrap ${task.priority === 'urgent' || task.priority === 'high' ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                      {task.priority}
                    </span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider whitespace-nowrap ${task.status === 'completed' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : (isOverdue ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-blue-50 text-blue-700 border border-blue-200')}`}>
                      {task.status === 'completed' ? 'COMPLETED' : (isOverdue ? 'OVERDUE' : 'IN PROGRESS')}
                    </span>
                  </div>
                </div>

                <div className="flex justify-between items-center flex-wrap gap-2.5 pt-2 border-t border-slate-100">
                  <div className="text-xs text-slate-500">
                    <span>Due Date: {task.dueDate ? new Date(task.dueDate).toLocaleDateString('en-IN') : 'None'}</span>
                    {task.assignedBy && (
                      <span className="ml-3">Assigned by: {task.assignedBy.name}</span>
                    )}
                  </div>

                  {/* Quick Action Progress Slider / Buttons */}
                  {task.status !== 'completed' ? (
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-600">
                        Progress: {task.progress || 0}%
                      </span>
                      <button
                        disabled={updatingTaskId === task._id}
                        onClick={() => handleUpdateProgress(task._id, task.progress, (task.progress || 0) + 25)}
                        className="px-2 py-1 rounded border border-slate-300 bg-slate-50 text-xs font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer disabled:opacity-50"
                      >
                        +25%
                      </button>
                      <button
                        disabled={updatingTaskId === task._id}
                        onClick={() => handleUpdateProgress(task._id, task.progress, 100)}
                        className="px-2.5 py-1 rounded border border-emerald-600 bg-emerald-50 text-xs font-bold text-emerald-700 hover:bg-emerald-100 flex items-center gap-1 cursor-pointer disabled:opacity-50"
                      >
                        <Check size={12} />
                        Mark Done
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-xs text-emerald-600 font-semibold">
                      <CheckCircle2 size={14} />
                      Completed on {task.completedAt ? new Date(task.completedAt).toLocaleDateString('en-IN') : 'Recent'}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {filteredTasks.length === 0 && (
            <div className="py-10 px-4 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
              <CheckCircle2 size={36} className="text-emerald-600" />
              <span className="text-sm font-medium text-slate-600">No Tasks in this category</span>
              <span className="text-xs text-slate-400">Your operational task schedule is clear.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
