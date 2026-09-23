import React from 'react';
import { 
  Factory, 
  Cpu, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Boxes, 
  Truck, 
  Layers, 
  Plus, 
  Wrench
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function ProductionDashboardView({ data, isManager }) {
  const navigate = useNavigate();

  if (!data) return null;

  const { metrics, productionTasks, rawMaterialPool, machineTelemetryStatus } = data;

  return (
    <div className="flex flex-col gap-6">
      {/* Top Production KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col justify-between shadow-xs hover:shadow-md transition-shadow">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Active Production Jobs</span>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-blue-50 text-blue-600">
              <Factory size={20} />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-tight">{metrics.totalProductionJobs}</div>
          <div className="text-xs text-emerald-600 font-semibold mt-1">
            {metrics.completedJobs} Completed • {metrics.inProgressJobs} Running
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col justify-between shadow-xs hover:shadow-md transition-shadow">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Priority Jobs</span>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${metrics.highPriorityJobs > 0 ? 'bg-rose-50 text-rose-600' : 'bg-slate-50 text-slate-400'}`}>
              <AlertTriangle size={20} />
            </div>
          </div>
          <div className={`text-2xl sm:text-3xl font-extrabold leading-tight ${metrics.highPriorityJobs > 0 ? 'text-rose-600' : 'text-slate-900'}`}>
            {metrics.highPriorityJobs}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            High & urgent fabrication milestones
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col justify-between shadow-xs hover:shadow-md transition-shadow">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Raw Material Batches</span>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-emerald-50 text-emerald-600">
              <Boxes size={20} />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-tight">{metrics.materialBatchesReady}</div>
          <div className="text-xs text-slate-500 mt-1">
            Material specifications allocated in yard
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col justify-between shadow-xs hover:shadow-md transition-shadow">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Machine Cell Status</span>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-purple-50 text-purple-600">
              <Cpu size={20} />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-emerald-600 leading-tight">
            {machineTelemetryStatus?.status || 'Operational'}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {machineTelemetryStatus?.totalActiveMachines || 4} Shopfloor Units
          </div>
        </div>
      </div>

      {/* Production Quick Action Shortcuts */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs">
        <div className="flex justify-between items-center mb-3">
          <span className="text-xs sm:text-sm font-bold text-slate-700 uppercase tracking-wider">
            Shop Floor & Manufacturing Shortcuts
          </span>
          {isManager && (
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider whitespace-nowrap bg-blue-50 text-blue-700 border border-blue-200">Production Manager View</span>
          )}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          <button className="flex items-center gap-2.5 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 hover:bg-white hover:border-blue-600 hover:text-blue-600 hover:-translate-y-0.5 hover:shadow-xs transition-all text-left" onClick={() => navigate('/inventory-balance')}>
            <Boxes size={20} className="text-blue-600 shrink-0" />
            <span>Material Stock</span>
          </button>
          <button className="flex items-center gap-2.5 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 hover:bg-white hover:border-emerald-600 hover:text-emerald-600 hover:-translate-y-0.5 hover:shadow-xs transition-all text-left" onClick={() => navigate('/challan-management')}>
            <Truck size={20} className="text-emerald-600 shrink-0" />
            <span>Fabrication Dispatches</span>
          </button>
          <button className="flex items-center gap-2.5 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 hover:bg-white hover:border-amber-600 hover:text-amber-600 hover:-translate-y-0.5 hover:shadow-xs transition-all text-left" onClick={() => navigate('/remaining-material')}>
            <Layers size={20} className="text-amber-600 shrink-0" />
            <span>WIP & Pending</span>
          </button>
          <button className="flex items-center gap-2.5 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 hover:bg-white hover:border-purple-600 hover:text-purple-600 hover:-translate-y-0.5 hover:shadow-xs transition-all text-left" onClick={() => navigate('/create-challan')}>
            <Plus size={20} className="text-purple-600 shrink-0" />
            <span>Create Dispatch</span>
          </button>
        </div>
      </div>

      {/* Two Column Layout: Production Tasks & Machine Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Active Production Jobs */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs">
          <div className="flex flex-wrap justify-between items-center gap-2 mb-4 pb-3 border-b border-slate-100">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Wrench size={18} className="text-blue-600" />
              Fabrication & Production Tasks
            </h2>
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider whitespace-nowrap bg-blue-50 text-blue-700 border border-blue-200">{productionTasks?.length || 0} Scheduled</span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full border-collapse text-xs sm:text-sm text-left">
              <thead>
                <tr className="bg-slate-50">
                  <th className="px-3.5 py-2.5 text-left font-bold text-xs text-slate-500 uppercase tracking-wider border-b border-slate-200">Job Title</th>
                  <th className="px-3.5 py-2.5 text-left font-bold text-xs text-slate-500 uppercase tracking-wider border-b border-slate-200">Priority</th>
                  <th className="px-3.5 py-2.5 text-left font-bold text-xs text-slate-500 uppercase tracking-wider border-b border-slate-200">Assigned Lead</th>
                  <th className="px-3.5 py-2.5 text-left font-bold text-xs text-slate-500 uppercase tracking-wider border-b border-slate-200">Progress</th>
                  <th className="px-3.5 py-2.5 text-left font-bold text-xs text-slate-500 uppercase tracking-wider border-b border-slate-200">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(productionTasks || []).map((task) => (
                  <tr key={task._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-3.5 py-3 font-semibold text-slate-900">{task.title}</td>
                    <td className="px-3.5 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider whitespace-nowrap ${task.priority === 'urgent' || task.priority === 'high' ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                        {task.priority}
                      </span>
                    </td>
                    <td className="px-3.5 py-3 text-xs text-slate-500">
                      {task.assignedTo?.name || 'Production Staff'}
                    </td>
                    <td className="px-3.5 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-600 rounded-full" style={{ width: `${task.progress || 0}%` }} />
                        </div>
                        <span className="text-xs font-semibold text-slate-700">{task.progress || 0}%</span>
                      </div>
                    </td>
                    <td className="px-3.5 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider whitespace-nowrap ${task.status === 'completed' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                        {task.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {(!productionTasks || productionTasks.length === 0) && (
                  <tr>
                    <td colSpan="5" className="text-center py-6 text-slate-400 font-medium">
                      No active production jobs logged in database.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Machine Telemetry & Raw Material Pool */}
        <div className="flex flex-col gap-6">
          {/* Machine Telemetry Status Panel */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs">
            <div className="flex flex-wrap justify-between items-center gap-2 mb-4 pb-3 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Cpu size={18} className="text-purple-600" />
                Machine & Cell Telemetry
              </h2>
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider whitespace-nowrap bg-emerald-50 text-emerald-700 border border-emerald-200">Live</span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 mb-3">
              <div className="text-xs sm:text-sm font-semibold text-slate-700 mb-1">
                Operational Monitoring Mode
              </div>
              <p className="text-xs text-slate-500 leading-relaxed m-0">
                {machineTelemetryStatus?.message || 'Production jobs tracked via ERP Task Manager.'}
              </p>
            </div>

            <div className="flex flex-col gap-2">
              {['Cutting & Shearing Line (M-01)', 'Hydraulic Punching Cell (M-02)', 'Plate Drill Station (M-03)', 'Assembly & Welding Bay (M-04)'].map((m, idx) => (
                <div 
                  key={idx}
                  className="flex justify-between items-center px-3 py-2 rounded-lg border border-slate-100 text-xs bg-white hover:bg-slate-50 transition-colors"
                >
                  <span className="font-medium text-slate-700">{m}</span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider whitespace-nowrap bg-emerald-50 text-emerald-700 border border-emerald-200">Active</span>
                </div>
              ))}
            </div>
          </div>

          {/* Raw Material Allocation Pool */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs">
            <div className="flex flex-wrap justify-between items-center gap-2 mb-4 pb-3 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Boxes size={18} className="text-emerald-600" />
                Available Raw Material Stock
              </h2>
              <span className="text-xs text-slate-500 font-normal">From live warehouse balances</span>
            </div>

            <div className="flex flex-col gap-2">
              {(rawMaterialPool || []).map((mat, idx) => (
                <div
                  key={idx}
                  className="p-2.5 sm:p-3 rounded-xl border border-slate-200 bg-white flex justify-between items-center hover:border-slate-300 transition-all"
                >
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs sm:text-sm font-semibold text-slate-800">
                      {mat.material}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Division: {mat.division}
                    </span>
                  </div>
                  <span className="text-sm sm:text-base font-bold text-emerald-600">
                    {mat.availableQty} pcs
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
