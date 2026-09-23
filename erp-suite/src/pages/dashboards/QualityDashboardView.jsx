import React from 'react';
import { 
  CheckCircle2, 
  ShieldCheck, 
  AlertTriangle, 
  ClipboardCheck, 
  Truck, 
  PackageCheck, 
  FileCheck2, 
  Layers, 
  Boxes
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function QualityDashboardView({ data, isManager }) {
  const navigate = useNavigate();

  if (!data) return null;

  const { metrics, qualityTasks, inwardVerifications, dispatchInspections, inspectionAuditStatus } = data;

  return (
    <div className="flex flex-col gap-6">
      {/* Top Quality & Inspection KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col justify-between shadow-xs hover:shadow-md transition-shadow">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Quality Checks</span>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-emerald-50 text-emerald-600">
              <ShieldCheck size={20} />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-tight">{metrics.totalInspections}</div>
          <div className="text-xs text-emerald-600 font-semibold mt-1">
            {metrics.completedInspections} Verified Passed • {metrics.pendingInspections} Pending
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col justify-between shadow-xs hover:shadow-md transition-shadow">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Compliance Rate</span>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-blue-50 text-blue-600">
              <CheckCircle2 size={20} />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-blue-600 leading-tight">
            {inspectionAuditStatus?.complianceRate || 100}%
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Inspection pass adherence
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col justify-between shadow-xs hover:shadow-md transition-shadow">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Inward Lots Verified</span>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-purple-50 text-purple-600">
              <PackageCheck size={20} />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-tight">{metrics.inwardConsignmentsVerified}</div>
          <div className="text-xs text-slate-500 mt-1">
            Raw material consignments (CR)
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col justify-between shadow-xs hover:shadow-md transition-shadow">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Urgent Inspections</span>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${metrics.urgentTasksCount > 0 ? 'bg-rose-50 text-rose-600' : 'bg-slate-50 text-slate-400'}`}>
              <AlertTriangle size={20} />
            </div>
          </div>
          <div className={`text-2xl sm:text-3xl font-extrabold leading-tight ${metrics.urgentTasksCount > 0 ? 'text-rose-600' : 'text-slate-900'}`}>
            {metrics.urgentTasksCount}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Pre-dispatch & high-priority lots
          </div>
        </div>
      </div>

      {/* Quality Quick Action Shortcuts */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs">
        <div className="flex justify-between items-center mb-3">
          <span className="text-xs sm:text-sm font-bold text-slate-700 uppercase tracking-wider">
            Quality Assurance & Verification Modules
          </span>
          {isManager && (
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider whitespace-nowrap bg-blue-50 text-blue-700 border border-blue-200">Quality Assurance Lead View</span>
          )}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          <button className="flex items-center gap-2.5 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 hover:bg-white hover:border-emerald-600 hover:text-emerald-600 hover:-translate-y-0.5 hover:shadow-xs transition-all text-left" onClick={() => navigate('/cr-register')}>
            <PackageCheck size={20} className="text-emerald-600 shrink-0" />
            <span>Inward CR Inspection</span>
          </button>
          <button className="flex items-center gap-2.5 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 hover:bg-white hover:border-blue-600 hover:text-blue-600 hover:-translate-y-0.5 hover:shadow-xs transition-all text-left" onClick={() => navigate('/challan-management')}>
            <Truck size={20} className="text-blue-600 shrink-0" />
            <span>Pre-Dispatch Checks</span>
          </button>
          <button className="flex items-center gap-2.5 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 hover:bg-white hover:border-amber-600 hover:text-amber-600 hover:-translate-y-0.5 hover:shadow-xs transition-all text-left" onClick={() => navigate('/inventory-balance')}>
            <Boxes size={20} className="text-amber-600 shrink-0" />
            <span>Division Balances</span>
          </button>
        </div>
      </div>

      {/* Two Column Layout: Quality Inspection Tasks & Inward Lots */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Quality Compliance Tasks */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs">
          <div className="flex flex-wrap justify-between items-center gap-2 mb-4 pb-3 border-b border-slate-100">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <ClipboardCheck size={18} className="text-emerald-600" />
              Quality Inspection Protocols & Tasks
            </h2>
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider whitespace-nowrap bg-blue-50 text-blue-700 border border-blue-200">{qualityTasks?.length || 0} Registered</span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full border-collapse text-xs sm:text-sm text-left">
              <thead>
                <tr className="bg-slate-50">
                  <th className="px-3.5 py-2.5 text-left font-bold text-xs text-slate-500 uppercase tracking-wider border-b border-slate-200">Inspection Protocol</th>
                  <th className="px-3.5 py-2.5 text-left font-bold text-xs text-slate-500 uppercase tracking-wider border-b border-slate-200">Priority</th>
                  <th className="px-3.5 py-2.5 text-left font-bold text-xs text-slate-500 uppercase tracking-wider border-b border-slate-200">Quality Inspector</th>
                  <th className="px-3.5 py-2.5 text-left font-bold text-xs text-slate-500 uppercase tracking-wider border-b border-slate-200">Progress</th>
                  <th className="px-3.5 py-2.5 text-left font-bold text-xs text-slate-500 uppercase tracking-wider border-b border-slate-200">Result</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(qualityTasks || []).map((task) => (
                  <tr key={task._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-3.5 py-3 font-semibold text-slate-900">{task.title}</td>
                    <td className="px-3.5 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider whitespace-nowrap ${task.priority === 'urgent' || task.priority === 'high' ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                        {task.priority}
                      </span>
                    </td>
                    <td className="px-3.5 py-3 text-xs text-slate-500">
                      {task.assignedTo?.name || 'QA Lead'}
                    </td>
                    <td className="px-3.5 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-600 rounded-full" style={{ width: `${task.progress || 0}%` }} />
                        </div>
                        <span className="text-xs font-semibold text-slate-700">{task.progress || 0}%</span>
                      </div>
                    </td>
                    <td className="px-3.5 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider whitespace-nowrap ${task.status === 'completed' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                        {task.status === 'completed' ? 'PASSED' : 'IN_TEST'}
                      </span>
                    </td>
                  </tr>
                ))}
                {(!qualityTasks || qualityTasks.length === 0) && (
                  <tr>
                    <td colSpan="5" className="text-center py-6 text-slate-400 font-medium">
                      No quality inspection tasks assigned.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Inward Lot Verification Feed */}
        <div className="flex flex-col gap-6">
          {/* Inward CR Verification List */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs">
            <div className="flex flex-wrap justify-between items-center gap-2 mb-4 pb-3 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FileCheck2 size={18} className="text-blue-600" />
                Material Inward Inspection Records
              </h2>
              <span className="text-xs text-slate-500 font-normal">From CR Register</span>
            </div>

            <div className="flex flex-col gap-2.5">
              {(inwardVerifications || []).map((cr) => (
                <div
                  key={cr._id}
                  className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex flex-col gap-1 hover:bg-slate-100/70 transition-colors"
                >
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold text-slate-900">
                      CR #{cr.crNo || 'Inward'}
                    </span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider whitespace-nowrap bg-emerald-50 text-emerald-700 border border-emerald-200">Verified</span>
                  </div>
                  <div className="text-xs text-slate-500">
                    Contractor: {cr.conName || 'Vendor'} • Vehicle: {cr.vehicleNo || 'Reported'}
                  </div>
                </div>
              ))}
              {(!inwardVerifications || inwardVerifications.length === 0) && (
                <div className="py-8 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
                  <PackageCheck size={28} className="text-slate-400" />
                  <span className="text-sm font-medium text-slate-500">No Material Inwards Recorded</span>
                </div>
              )}
            </div>
          </div>

          {/* Automated IPQC Status */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs">
            <div className="flex flex-wrap justify-between items-center gap-2 mb-4 pb-3 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck size={18} className="text-purple-600" />
                Automated IPQC Telemetry Status
              </h2>
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider whitespace-nowrap bg-blue-50 text-blue-700 border border-blue-200">Standard</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed m-0">
              {inspectionAuditStatus?.message || 'Quality inspections tracked against live Material Receipts and Outward Challans.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
