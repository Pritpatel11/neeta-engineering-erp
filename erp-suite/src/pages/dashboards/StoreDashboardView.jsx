import React from 'react';
import { 
  Boxes, 
  PackagePlus, 
  Truck, 
  AlertTriangle, 
  ClipboardList, 
  Building2, 
  CheckCircle2, 
  Plus, 
  ArrowDownLeft, 
  ArrowUpRight,
  Factory
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function StoreDashboardView({ data, isManager }) {
  const navigate = useNavigate();

  if (!data) return null;

  const { metrics, divisionSummary, lowStockAlerts, stockMovements, storeTasks } = data;

  return (
    <div className="flex flex-col gap-6">
      {/* Top Store & Inventory KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col justify-between shadow-xs hover:shadow-md transition-shadow">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Active Warehouses</span>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-blue-50 text-blue-600">
              <Building2 size={20} />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-tight">{metrics.totalWarehouses}</div>
          <div className="text-xs text-slate-500 mt-1">
            {metrics.totalMaterialTypes} registered material items
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col justify-between shadow-xs hover:shadow-md transition-shadow">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Material Inward (CR)</span>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-emerald-50 text-emerald-600">
              <PackagePlus size={20} />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600 leading-tight">
            {metrics.stockInCount}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Consignments received & logged
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col justify-between shadow-xs hover:shadow-md transition-shadow">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Material Outward (Challans)</span>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-purple-50 text-purple-600">
              <Truck size={20} />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-purple-600 leading-tight">
            {metrics.stockOutCount}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Delivery challans dispatched
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col justify-between shadow-xs hover:shadow-md transition-shadow">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Stock Alerts</span>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${metrics.lowStockItemsCount > 0 ? 'bg-rose-50 text-rose-600' : 'bg-slate-50 text-slate-400'}`}>
              <AlertTriangle size={20} />
            </div>
          </div>
          <div className={`text-2xl sm:text-3xl font-extrabold leading-tight ${metrics.lowStockItemsCount > 0 ? 'text-rose-600' : 'text-slate-900'}`}>
            {metrics.lowStockItemsCount}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Items near zero or negative balance
          </div>
        </div>
      </div>

      {/* Store Quick Action Shortcuts */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs">
        <div className="flex justify-between items-center mb-3">
          <span className="text-xs sm:text-sm font-bold text-slate-700 uppercase tracking-wider">
            Store & Logistics Operations
          </span>
          {isManager && (
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider whitespace-nowrap bg-blue-50 text-blue-700 border border-blue-200">Store Manager View</span>
          )}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          <button className="flex items-center gap-2.5 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 hover:bg-white hover:border-emerald-600 hover:text-emerald-600 hover:-translate-y-0.5 hover:shadow-xs transition-all text-left" onClick={() => navigate('/create-cr')}>
            <Plus size={20} className="text-emerald-600 shrink-0" />
            <span>New Inward (CR)</span>
          </button>
          <button className="flex items-center gap-2.5 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 hover:bg-white hover:border-cyan-600 hover:text-cyan-600 hover:-translate-y-0.5 hover:shadow-xs transition-all text-left" onClick={() => navigate('/cr-register')}>
            <ClipboardList size={20} className="text-cyan-600 shrink-0" />
            <span>CR Register</span>
          </button>
          <button className="flex items-center gap-2.5 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 hover:bg-white hover:border-blue-600 hover:text-blue-600 hover:-translate-y-0.5 hover:shadow-xs transition-all text-left" onClick={() => navigate('/create-challan')}>
            <Truck size={20} className="text-blue-600 shrink-0" />
            <span>Create Challan</span>
          </button>
          <button className="flex items-center gap-2.5 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 hover:bg-white hover:border-purple-600 hover:text-purple-600 hover:-translate-y-0.5 hover:shadow-xs transition-all text-left" onClick={() => navigate('/challan-management')}>
            <ClipboardList size={20} className="text-purple-600 shrink-0" />
            <span>Challan Register</span>
          </button>
          <button className="flex items-center gap-2.5 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 hover:bg-white hover:border-amber-600 hover:text-amber-600 hover:-translate-y-0.5 hover:shadow-xs transition-all text-left" onClick={() => navigate('/inventory-balance')}>
            <Boxes size={20} className="text-amber-600 shrink-0" />
            <span>Inventory Balance</span>
          </button>
          <button className="flex items-center gap-2.5 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 hover:bg-white hover:border-slate-600 hover:text-slate-900 hover:-translate-y-0.5 hover:shadow-xs transition-all text-left" onClick={() => navigate('/remaining-material')}>
            <Factory size={20} className="text-slate-600 shrink-0" />
            <span>Pending Material</span>
          </button>
        </div>
      </div>

      {/* Division Stock Overview Cards */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs">
        <div className="flex flex-wrap justify-between items-center gap-2 mb-4 pb-3 border-b border-slate-100">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Building2 size={18} className="text-blue-600" />
            Division-wise Warehouse Stock Summary
          </h2>
          <button 
            onClick={() => navigate('/inventory-balance')}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer"
          >
            Detailed Ledger →
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
          {(divisionSummary || []).map((div) => (
            <div
              key={div.divisionName}
              className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex flex-col gap-1.5"
            >
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold text-slate-900 truncate">
                  {div.divisionName}
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider whitespace-nowrap bg-blue-50 text-blue-700 border border-blue-200">{div.materialCount} items</span>
              </div>
              <div className="text-xl font-extrabold text-blue-600">
                {Number(div.totalPieces || 0).toLocaleString('en-IN')} <span className="text-xs font-medium text-slate-500">pcs</span>
              </div>
            </div>
          ))}
          {(!divisionSummary || divisionSummary.length === 0) && (
            <div className="col-span-full py-10 px-4 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
              <Boxes size={32} className="text-slate-400" />
              <span className="text-sm font-medium text-slate-500">No Division Balances Recorded</span>
            </div>
          )}
        </div>
      </div>

      {/* Two Column Layout: Low Stock Alerts & Recent Movements */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Low Stock Alerts Table */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs">
          <div className="flex flex-wrap justify-between items-center gap-2 mb-4 pb-3 border-b border-slate-100">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <AlertTriangle size={18} className="text-rose-600" />
              Low Stock & Reorder Alerts
            </h2>
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider whitespace-nowrap bg-rose-50 text-rose-700 border border-rose-200">{lowStockAlerts?.length || 0} Items Flagged</span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full border-collapse text-xs sm:text-sm text-left">
              <thead>
                <tr className="bg-slate-50">
                  <th className="px-3.5 py-2.5 text-left font-bold text-xs text-slate-500 uppercase tracking-wider border-b border-slate-200">Division</th>
                  <th className="px-3.5 py-2.5 text-left font-bold text-xs text-slate-500 uppercase tracking-wider border-b border-slate-200">Material Specification</th>
                  <th className="px-3.5 py-2.5 text-left font-bold text-xs text-slate-500 uppercase tracking-wider border-b border-slate-200">Current Qty</th>
                  <th className="px-3.5 py-2.5 text-left font-bold text-xs text-slate-500 uppercase tracking-wider border-b border-slate-200">Alert Level</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(lowStockAlerts || []).map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-3.5 py-3 font-semibold text-slate-900">{item.division}</td>
                    <td className="px-3.5 py-3 text-xs text-slate-700">{item.material}</td>
                    <td className={`px-3.5 py-3 font-bold ${item.qty <= 0 ? 'text-rose-600' : 'text-amber-600'}`}>
                      {item.qty}
                    </td>
                    <td className="px-3.5 py-3">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider whitespace-nowrap ${item.status === 'CRITICAL_ZERO' ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                        {item.status === 'CRITICAL_ZERO' ? 'Zero Stock' : 'Low Stock'}
                      </span>
                    </td>
                  </tr>
                ))}
                {(!lowStockAlerts || lowStockAlerts.length === 0) && (
                  <tr>
                    <td colSpan="4" className="text-center py-6 text-emerald-600 font-medium">
                      ✓ All materials meet minimum inventory thresholds.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Live Movements & Store Tasks */}
        <div className="flex flex-col gap-6">
          {/* Stock In & Out Transactions Feed */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs">
            <div className="flex flex-wrap justify-between items-center gap-2 mb-4 pb-3 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Truck size={18} className="text-emerald-600" />
                Live Stock Movement Log
              </h2>
              <span className="text-xs text-slate-500 font-normal">Inward vs Outward</span>
            </div>

            <div className="flex flex-col gap-2.5">
              {(stockMovements || []).map((mov) => (
                <div
                  key={mov.id}
                  className="p-3 rounded-xl border border-slate-200 bg-white flex flex-col gap-1 shadow-2xs hover:border-slate-300 transition-all"
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-1.5">
                      {mov.type === 'STOCK_IN' ? (
                        <ArrowDownLeft size={16} className="text-emerald-600" />
                      ) : (
                        <ArrowUpRight size={16} className="text-purple-600" />
                      )}
                      <span className="text-sm font-semibold text-slate-900">
                        {mov.documentNo}
                      </span>
                    </div>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider whitespace-nowrap ${mov.type === 'STOCK_IN' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-blue-50 text-blue-700 border border-blue-200'}`}>
                      {mov.type === 'STOCK_IN' ? 'INWARD (CR)' : 'OUTWARD'}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>{mov.source} • {mov.division}</span>
                    <span>{new Date(mov.date).toLocaleDateString('en-IN')}</span>
                  </div>
                </div>
              ))}
              {(!stockMovements || stockMovements.length === 0) && (
                <div className="py-8 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
                  <Truck size={28} className="text-slate-400" />
                  <span className="text-sm font-medium text-slate-500">No Recent Stock Movements</span>
                </div>
              )}
            </div>
          </div>

          {/* Store Tasks Panel */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs">
            <div className="flex flex-wrap justify-between items-center gap-2 mb-4 pb-3 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <CheckCircle2 size={18} className="text-amber-600" />
                Store & Yard Assigned Tasks
              </h2>
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider whitespace-nowrap bg-amber-50 text-amber-700 border border-amber-200">{storeTasks?.length || 0} Tasks</span>
            </div>

            <div className="flex flex-col gap-2">
              {(storeTasks || []).map((t) => (
                <div
                  key={t._id}
                  className="p-3 rounded-xl border border-slate-100 bg-slate-50 flex justify-between items-center gap-2 hover:bg-slate-100/70 transition-colors"
                >
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs sm:text-sm font-semibold text-slate-800">
                      {t.title}
                    </span>
                    <span className="text-xs text-slate-500">
                      Assigned: {t.assignedTo?.name || 'Staff'} • {t.progress || 0}% Done
                    </span>
                  </div>
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider whitespace-nowrap shrink-0 ${t.status === 'completed' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                    {t.status}
                  </span>
                </div>
              ))}
              {(!storeTasks || storeTasks.length === 0) && (
                <div className="py-8 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
                  <CheckCircle2 size={28} className="text-emerald-600" />
                  <span className="text-sm font-medium text-slate-500">All Store Tasks Completed</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
