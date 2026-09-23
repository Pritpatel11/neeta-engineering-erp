import React from 'react';
import { 
  Users, 
  ShieldCheck, 
  CheckCircle2, 
  AlertTriangle, 
  Bot, 
  TrendingUp, 
  Clock, 
  Building2, 
  Database, 
  Settings, 
  Layers
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function AdminDashboardView({ data, onSwitchDashboard }) {
  const navigate = useNavigate();

  if (!data) return null;

  const { metrics, distribution, overdueTasksList, recentAuditLogs, auditStats, activityFeed } = data;

  return (
    <div className="flex flex-col gap-6">
      {/* Top Level System KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col justify-between shadow-xs hover:shadow-md transition-shadow">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Users</span>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-blue-50 text-blue-600">
              <Users size={20} />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-tight">{metrics.totalUsers}</div>
          <div className="text-xs text-emerald-600 font-semibold mt-1">
            {metrics.activeUsers} Active • {metrics.inactiveUsers} Inactive
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col justify-between shadow-xs hover:shadow-md transition-shadow">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">AI Chatbot Access</span>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-purple-50 text-purple-600">
              <Bot size={20} />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-purple-600 leading-tight">{metrics.aiEnabledUsers}</div>
          <div className="text-xs text-slate-500 mt-1">
            {metrics.totalUsers > 0 ? Math.round((metrics.aiEnabledUsers / metrics.totalUsers) * 100) : 0}% of accounts enabled
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col justify-between shadow-xs hover:shadow-md transition-shadow">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">System Tasks</span>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-emerald-50 text-emerald-600">
              <CheckCircle2 size={20} />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-tight">{metrics.totalTasks}</div>
          <div className="text-xs text-sky-600 font-semibold mt-1">
            {metrics.completedTasks} Completed ({metrics.completionRate}%)
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col justify-between shadow-xs hover:shadow-md transition-shadow">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Overdue Tasks</span>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${metrics.overdueTasksCount > 0 ? 'bg-rose-50 text-rose-600' : 'bg-slate-50 text-slate-400'}`}>
              <AlertTriangle size={20} />
            </div>
          </div>
          <div className={`text-2xl sm:text-3xl font-extrabold leading-tight ${metrics.overdueTasksCount > 0 ? 'text-rose-600' : 'text-slate-900'}`}>
            {metrics.overdueTasksCount}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {metrics.inProgressTasks} In Progress • {metrics.pendingTasks} Pending
          </div>
        </div>
      </div>

      {/* Admin Quick Action Shortcuts */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs">
        <div className="flex justify-between items-center mb-3">
          <span className="text-xs sm:text-sm font-bold text-slate-700 uppercase tracking-wider">
            System Administration Controls
          </span>
          <span className="text-xs text-slate-500">Admin Privileges Only</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          <button className="flex items-center gap-2.5 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 hover:bg-white hover:border-blue-600 hover:text-blue-600 hover:-translate-y-0.5 hover:shadow-xs transition-all text-left" onClick={() => navigate('/user-management')}>
            <Users size={20} className="text-blue-600 shrink-0" />
            <span>User & RBAC</span>
          </button>
          <button className="flex items-center gap-2.5 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 hover:bg-white hover:border-cyan-600 hover:text-cyan-600 hover:-translate-y-0.5 hover:shadow-xs transition-all text-left" onClick={() => navigate('/master-data')}>
            <Settings size={20} className="text-cyan-600 shrink-0" />
            <span>Master Data</span>
          </button>
          <button className="flex items-center gap-2.5 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 hover:bg-white hover:border-emerald-600 hover:text-emerald-600 hover:-translate-y-0.5 hover:shadow-xs transition-all text-left" onClick={() => onSwitchDashboard && onSwitchDashboard('accounts')}>
            <Layers size={20} className="text-emerald-600 shrink-0" />
            <span>Accounts View</span>
          </button>
          <button className="flex items-center gap-2.5 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 hover:bg-white hover:border-amber-600 hover:text-amber-600 hover:-translate-y-0.5 hover:shadow-xs transition-all text-left" onClick={() => onSwitchDashboard && onSwitchDashboard('store')}>
            <Database size={20} className="text-amber-600 shrink-0" />
            <span>Store View</span>
          </button>
          <button className="flex items-center gap-2.5 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 hover:bg-white hover:border-purple-600 hover:text-purple-600 hover:-translate-y-0.5 hover:shadow-xs transition-all text-left" onClick={() => onSwitchDashboard && onSwitchDashboard('owner')}>
            <TrendingUp size={20} className="text-purple-600 shrink-0" />
            <span>Owner Portal</span>
          </button>
        </div>
      </div>

      {/* Two Column Layout: Department Distribution & Overdue Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Department Breakdown & System Activity */}
        <div className="flex flex-col gap-6">
          {/* Department Headcount Breakdown */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs">
            <div className="flex flex-wrap justify-between items-center gap-2 mb-4 pb-3 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Building2 size={18} className="text-blue-600" />
                Department Headcount & Allocation
              </h2>
              <span className="text-xs text-slate-500 font-normal">{distribution?.byDepartment?.length || 0} Departments Active</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {(distribution?.byDepartment || []).map((dept) => (
                <div 
                  key={dept._id}
                  className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex flex-col gap-1 hover:bg-slate-100/70 transition-colors"
                >
                  <span className="text-xs uppercase text-slate-500 font-semibold truncate">
                    {dept._id}
                  </span>
                  <span className="text-xl font-bold text-slate-900">
                    {dept.count} <span className="text-xs font-medium text-slate-400">staff</span>
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Unified System Activity Feed */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs">
            <div className="flex flex-wrap justify-between items-center gap-2 mb-4 pb-3 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Clock size={18} className="text-emerald-600" />
                Recent System Activity Stream
              </h2>
              <span className="text-xs text-slate-500 font-normal">Live database events</span>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full border-collapse text-xs sm:text-sm text-left">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="px-3 py-2 text-left font-bold text-xs text-slate-500 uppercase tracking-wider border-b border-slate-200">Type</th>
                    <th className="px-3 py-2 text-left font-bold text-xs text-slate-500 uppercase tracking-wider border-b border-slate-200">Activity</th>
                    <th className="px-3 py-2 text-left font-bold text-xs text-slate-500 uppercase tracking-wider border-b border-slate-200">Meta Info</th>
                    <th className="px-3 py-2 text-left font-bold text-xs text-slate-500 uppercase tracking-wider border-b border-slate-200">Timestamp</th>
                    <th className="px-3 py-2 text-left font-bold text-xs text-slate-500 uppercase tracking-wider border-b border-slate-200">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(activityFeed || []).map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-3 py-2.5">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider whitespace-nowrap ${item.type === 'User' ? 'bg-blue-50 text-blue-700 border border-blue-200' : (item.type === 'Receipt' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200')}`}>
                          {item.type}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 font-semibold text-slate-900">{item.title}</td>
                      <td className="px-3 py-2.5 text-xs text-slate-500">{item.meta}</td>
                      <td className="px-3 py-2.5 text-xs text-slate-400">
                        {item.date ? new Date(item.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '-'}
                      </td>
                      <td className="px-3 py-2.5">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider whitespace-nowrap bg-emerald-50 text-emerald-700 border border-emerald-200">{item.status}</span>
                      </td>
                    </tr>
                  ))}
                  {(!activityFeed || activityFeed.length === 0) && (
                    <tr>
                      <td colSpan="5" className="text-center py-6 text-slate-400 font-medium">
                        No recent system events recorded.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: AI Security Status & Overdue Tasks Alert */}
        <div className="flex flex-col gap-6">
          {/* Overdue Tasks Panel */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs">
            <div className="flex flex-wrap justify-between items-center gap-2 mb-4 pb-3 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <AlertTriangle size={18} className="text-rose-600" />
                Overdue Tasks Monitoring
              </h2>
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider whitespace-nowrap bg-rose-50 text-rose-700 border border-rose-200">{overdueTasksList?.length || 0} Urgent</span>
            </div>

            <div className="flex flex-col gap-2.5">
              {(overdueTasksList || []).map((task) => (
                <div
                  key={task._id}
                  className="p-3 rounded-xl border-l-4 border-l-rose-600 border border-rose-100 bg-rose-50/50 flex flex-col gap-1"
                >
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold text-rose-900">
                      {task.title}
                    </span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider whitespace-nowrap bg-rose-100 text-rose-800 border border-rose-200">Overdue</span>
                  </div>
                  <div className="flex justify-between text-xs text-rose-700">
                    <span>Assigned: {task.assignedTo?.name || 'Staff'}</span>
                    <span>Due: {new Date(task.dueDate).toLocaleDateString('en-IN')}</span>
                  </div>
                </div>
              ))}
              {(!overdueTasksList || overdueTasksList.length === 0) && (
                <div className="py-8 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
                  <CheckCircle2 size={32} className="text-emerald-600" />
                  <span className="text-sm font-medium text-emerald-600">All Tasks on Schedule</span>
                  <span className="text-xs text-slate-400">No overdue milestones currently pending in any department.</span>
                </div>
              )}
            </div>
          </div>

          {/* AI Security & Audit Log Summary */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs">
            <div className="flex flex-wrap justify-between items-center gap-2 mb-4 pb-3 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck size={18} className="text-purple-600" />
                AI Security & Audit Trail
              </h2>
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider whitespace-nowrap bg-blue-50 text-blue-700 border border-blue-200">{recentAuditLogs?.length || 0} Recent Logs</span>
            </div>

            <div className="grid grid-cols-2 gap-2.5 mb-3">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div className="text-xs text-slate-500">Injections Blocked</div>
                <div className="text-xl font-bold text-rose-600 mt-0.5">
                  {auditStats?.blockedInjections || 0}
                </div>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div className="text-xs text-slate-500">Out-of-Scope Refused</div>
                <div className="text-xl font-bold text-amber-600 mt-0.5">
                  {auditStats?.outOfScopeBlocked || 0}
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              {(recentAuditLogs || []).slice(0, 4).map((log, idx) => (
                <div 
                  key={idx}
                  className="p-2.5 rounded-lg border border-slate-100 text-xs bg-white hover:bg-slate-50 transition-colors"
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-semibold text-slate-700">@{log.username} ({log.userRole})</span>
                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${log.securityFlag === 'NORMAL' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                      {log.securityFlag}
                    </span>
                  </div>
                  <div className="text-slate-500 truncate italic">
                    "{log.prompt}"
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
