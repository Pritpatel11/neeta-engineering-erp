import React from 'react';
import { 
  FileText, 
  Receipt, 
  CreditCard, 
  TrendingUp, 
  Building2, 
  CheckCircle2, 
  Clock, 
  Plus, 
  ExternalLink,
  DollarSign
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

export default function AccountsDashboardView({ data, isManager }) {
  const navigate = useNavigate();

  if (!data) return null;

  const { metrics, trendData, recentStatements, recentReceipts, accountsTasks } = data;

  return (
    <div className="flex flex-col gap-6">
      {/* Top Financial KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col justify-between shadow-xs hover:shadow-md transition-shadow">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Revenue Received</span>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-emerald-50 text-emerald-600">
              <DollarSign size={20} />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600 leading-tight">
            {metrics.totalRevenue}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            From {metrics.totalReceipts} recorded payment receipts
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col justify-between shadow-xs hover:shadow-md transition-shadow">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Material Statements (MR)</span>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-blue-50 text-blue-600">
              <FileText size={20} />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-tight">{metrics.totalStatements}</div>
          <div className="text-xs text-slate-500 mt-1">
            Tracking {metrics.totalChallans} delivery challans
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col justify-between shadow-xs hover:shadow-md transition-shadow">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Registered Parties</span>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-purple-50 text-purple-600">
              <Building2 size={20} />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-tight">{metrics.totalParties}</div>
          <div className="text-xs text-slate-500 mt-1">
            Active contractors & client entities
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col justify-between shadow-xs hover:shadow-md transition-shadow">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Accounts Tasks</span>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-amber-50 text-amber-600">
              <Clock size={20} />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-tight">{metrics.pendingTasksCount}</div>
          <div className="text-xs text-emerald-600 font-semibold mt-1">
            {metrics.completedTasksCount} Completed
          </div>
        </div>
      </div>

      {/* Accounts Quick Action Shortcuts */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs">
        <div className="flex justify-between items-center mb-3">
          <span className="text-xs sm:text-sm font-bold text-slate-700 uppercase tracking-wider">
            Accounting & Billing Operations
          </span>
          {isManager && (
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider whitespace-nowrap bg-blue-50 text-blue-700 border border-blue-200">Department Manager View</span>
          )}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          <button className="flex items-center gap-2.5 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 hover:bg-white hover:border-blue-600 hover:text-blue-600 hover:-translate-y-0.5 hover:shadow-xs transition-all text-left" onClick={() => navigate('/create-statement')}>
            <Plus size={20} className="text-blue-600 shrink-0" />
            <span>New Statement (MR)</span>
          </button>
          <button className="flex items-center gap-2.5 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 hover:bg-white hover:border-cyan-600 hover:text-cyan-600 hover:-translate-y-0.5 hover:shadow-xs transition-all text-left" onClick={() => navigate('/statement-management')}>
            <FileText size={20} className="text-cyan-600 shrink-0" />
            <span>Statement Register</span>
          </button>
          <button className="flex items-center gap-2.5 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 hover:bg-white hover:border-emerald-600 hover:text-emerald-600 hover:-translate-y-0.5 hover:shadow-xs transition-all text-left" onClick={() => navigate('/create-receipt')}>
            <Receipt size={20} className="text-emerald-600 shrink-0" />
            <span>New Receipt</span>
          </button>
          <button className="flex items-center gap-2.5 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 hover:bg-white hover:border-amber-600 hover:text-amber-600 hover:-translate-y-0.5 hover:shadow-xs transition-all text-left" onClick={() => navigate('/receipt-management')}>
            <CreditCard size={20} className="text-amber-600 shrink-0" />
            <span>Receipts Register</span>
          </button>
          <button className="flex items-center gap-2.5 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 hover:bg-white hover:border-purple-600 hover:text-purple-600 hover:-translate-y-0.5 hover:shadow-xs transition-all text-left" onClick={() => navigate('/invoice')}>
            <FileText size={20} className="text-purple-600 shrink-0" />
            <span>GST Invoice</span>
          </button>
          <button className="flex items-center gap-2.5 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 hover:bg-white hover:border-slate-600 hover:text-slate-900 hover:-translate-y-0.5 hover:shadow-xs transition-all text-left" onClick={() => navigate('/indemnity-bond')}>
            <FileText size={20} className="text-slate-600 shrink-0" />
            <span>Indemnity Bond</span>
          </button>
        </div>
      </div>

      {/* Two Column Layout: Monthly Revenue Trend & Recent Statements */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Revenue Chart & Statements */}
        <div className="flex flex-col gap-6">
          {/* Revenue Chart */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs">
            <div className="flex flex-wrap justify-between items-center gap-2 mb-4 pb-3 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <TrendingUp size={18} className="text-emerald-600" />
                Receipts & Collections Trend
              </h2>
              <span className="text-xs text-slate-500 font-normal">Aggregated from MongoDB receipts</span>
            </div>

            {trendData && trendData.length > 0 ? (
              <div className="w-full h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={trendData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#64748b' }} />
                    <YAxis 
                      tick={{ fontSize: 12, fill: '#64748b' }} 
                      tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} 
                    />
                    <Tooltip 
                      formatter={(v) => [`₹${Number(v).toLocaleString('en-IN')}`, 'Revenue']}
                      contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                    />
                    <Bar dataKey="amount" fill="#059669" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="py-10 px-4 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
                <Receipt size={36} className="text-slate-400" />
                <span className="text-sm font-medium text-slate-600">No Payment Trends Available</span>
                <span className="text-xs text-slate-400">Create receipts to view collections over time.</span>
              </div>
            )}
          </div>

          {/* Recent Statements Table */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs">
            <div className="flex flex-wrap justify-between items-center gap-2 mb-4 pb-3 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FileText size={18} className="text-blue-600" />
                Recent Material Statements (MR)
              </h2>
              <button 
                onClick={() => navigate('/statement-management')}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer"
              >
                View All →
              </button>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full border-collapse text-xs sm:text-sm text-left">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="px-3.5 py-2.5 text-left font-bold text-xs text-slate-500 uppercase tracking-wider border-b border-slate-200">Statement No</th>
                    <th className="px-3.5 py-2.5 text-left font-bold text-xs text-slate-500 uppercase tracking-wider border-b border-slate-200">Contractor / Party</th>
                    <th className="px-3.5 py-2.5 text-left font-bold text-xs text-slate-500 uppercase tracking-wider border-b border-slate-200">Division</th>
                    <th className="px-3.5 py-2.5 text-left font-bold text-xs text-slate-500 uppercase tracking-wider border-b border-slate-200">Date</th>
                    <th className="px-3.5 py-2.5 text-left font-bold text-xs text-slate-500 uppercase tracking-wider border-b border-slate-200">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(recentStatements || []).map((st) => (
                    <tr key={st._id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-3.5 py-3 font-semibold text-blue-600">{st.statementNo}</td>
                      <td className="px-3.5 py-3 text-slate-700">{st.contractorName}</td>
                      <td className="px-3.5 py-3 text-slate-600">{st.divisionName}</td>
                      <td className="px-3.5 py-3 text-xs text-slate-500">{st.date}</td>
                      <td className="px-3.5 py-3">
                        <button
                          onClick={() => navigate('/statement-preview', { state: { statementData: st } })}
                          className="px-2.5 py-1 bg-blue-50 border border-blue-200 rounded text-xs font-semibold text-blue-700 hover:bg-blue-100 flex items-center gap-1 cursor-pointer"
                        >
                          <ExternalLink size={12} />
                          Preview
                        </button>
                      </td>
                    </tr>
                  ))}
                  {(!recentStatements || recentStatements.length === 0) && (
                    <tr>
                      <td colSpan="5" className="text-center py-6 text-slate-400 font-medium">
                        No material statements recorded in the database yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: Recent Receipts & Accounts Tasks */}
        <div className="flex flex-col gap-6">
          {/* Recent Receipts Panel */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs">
            <div className="flex flex-wrap justify-between items-center gap-2 mb-4 pb-3 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Receipt size={18} className="text-emerald-600" />
                Recent Payment Receipts
              </h2>
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider whitespace-nowrap bg-emerald-50 text-emerald-700 border border-emerald-200">{recentReceipts?.length || 0} Records</span>
            </div>

            <div className="flex flex-col gap-2.5">
              {(recentReceipts || []).map((r) => (
                <div
                  key={r._id}
                  className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex justify-between items-center hover:bg-slate-100/70 transition-colors"
                >
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs sm:text-sm font-semibold text-slate-900">
                      Receipt #{r.receiptNo}
                    </span>
                    <span className="text-xs text-slate-500">
                      {r.partyName} • {r.date}
                    </span>
                  </div>
                  <span className="text-sm sm:text-base font-bold text-emerald-600">
                    ₹{Number(r.amount || 0).toLocaleString('en-IN')}
                  </span>
                </div>
              ))}
              {(!recentReceipts || recentReceipts.length === 0) && (
                <div className="py-8 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
                  <Receipt size={28} className="text-slate-400" />
                  <span className="text-sm font-medium text-slate-500">No Receipts Found</span>
                </div>
              )}
            </div>
          </div>

          {/* Accounts Tasks Panel */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs">
            <div className="flex flex-wrap justify-between items-center gap-2 mb-4 pb-3 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <CheckCircle2 size={18} className="text-amber-600" />
                Accounts Department Tasks
              </h2>
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider whitespace-nowrap bg-amber-50 text-amber-700 border border-amber-200">{accountsTasks?.length || 0} Assigned</span>
            </div>

            <div className="flex flex-col gap-2">
              {(accountsTasks || []).map((task) => (
                <div
                  key={task._id}
                  className="p-3 rounded-xl border border-slate-200 bg-white flex flex-col gap-1.5 shadow-2xs hover:border-slate-300 transition-all"
                >
                  <div className="flex justify-between items-center">
                    <span className="text-xs sm:text-sm font-semibold text-slate-800">
                      {task.title}
                    </span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider whitespace-nowrap ${task.status === 'completed' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : (task.status === 'overdue' ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-amber-50 text-amber-700 border border-amber-200')}`}>
                      {task.status}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>Assigned: {task.assignedTo?.name || 'Staff'}</span>
                    <span>Progress: {task.progress || 0}%</span>
                  </div>
                </div>
              ))}
              {(!accountsTasks || accountsTasks.length === 0) && (
                <div className="py-8 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
                  <CheckCircle2 size={28} className="text-emerald-600" />
                  <span className="text-sm font-medium text-slate-500">No Pending Accounts Tasks</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
