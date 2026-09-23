import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Eye, Trash2, FileText, Search, Edit, Edit2, X } from 'lucide-react';
import { getChallans, deleteChallan, updateChallan, getRemainingMaterials, deleteRemainingMaterial as deleteRemainingMaterialAPI, getMaterials } from '../services/api';
import { Modal, TableWrapper, Button } from '../components/ui';

export default function ChallanManagement() {
  const [activeTab, setActiveTab] = useState('challans');
  const [challans, setChallans] = useState([]);
  const [remainingMaterials, setRemainingMaterials] = useState([]);
  const [materialsList, setMaterialsList] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 15;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, fromDate, toDate, activeTab]);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [fetchedChallans, fetchedRemaining, fetchedMaterials] = await Promise.all([
          getChallans(),
          getRemainingMaterials(),
          getMaterials()
        ]);
        setChallans(fetchedChallans);
        setRemainingMaterials(fetchedRemaining);
        setMaterialsList(fetchedMaterials.map(m => m.name));
      } catch (error) {
        console.error('Failed to fetch data:', error);
      }
    };
    fetchData();
  }, []);

  const handleView = (challanData) => {
    navigate('/challan-preview', { state: { challanData } });
  };

  const actualDelete = async (id, challanNo) => {
    if (window.confirm(`Are you sure you want to delete Challan No: ${challanNo}?`)) {
      try {
        await deleteChallan(id);
        setChallans(challans.filter(c => c._id !== id));
      } catch (error) {
        console.error('Failed to delete challan:', error);
        alert('Failed to delete challan.');
      }
    }
  };

  const deleteRemainingMaterial = async (id) => {
    if (window.confirm(`Are you sure you want to delete this remaining material record?`)) {
      try {
        await deleteRemainingMaterialAPI(id);
        setRemainingMaterials(remainingMaterials.filter(r => r._id !== id));
      } catch (error) {
        console.error('Failed to delete remaining material:', error);
        alert('Failed to delete record.');
      }
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await updateChallan(id, { status: newStatus });
      setChallans(challans.map(c => c._id === id ? { ...c, status: newStatus } : c));
    } catch (error) {
      console.error('Failed to update status:', error);
      alert('Failed to update status.');
    }
  };

  const [editingChallan, setEditingChallan] = useState(null);
  const [editFormData, setEditFormData] = useState({});

  const handleEditClick = (challan) => {
    setEditingChallan(challan);
    const materialsObj = {};
    challan.materials?.forEach(m => {
      materialsObj[m.name] = m.qty;
    });

    setEditFormData({
      challanNo: challan.challanNo || '',
      date: challan.date || '',
      contractorName: challan.contractorName || '',
      vehicleNumber: challan.vehicleNumber || '',
      driverName: challan.driverName || '',
      gatePassNo: challan.gatePassNo || '',
      gatePassDate: challan.gatePassDate || '',
      divisionName: challan.divisionName || '',
      subDivisionName: challan.subDivisionName || '',
      materials: materialsObj
    });
  };

  const handleSaveEdit = async () => {
    try {
      // Map materials back to array
      const materialsArray = Object.entries(editFormData.materials || {})
        .filter(([_, qty]) => parseInt(qty) > 0)
        .map(([name, qty]) => {
          const originalMat = editingChallan.materials?.find(m => m.name === name);
          return {
            name,
            qty: parseInt(qty),
            unit: originalMat ? originalMat.unit : 'Nos'
          };
        });

      const payload = { ...editFormData, materials: materialsArray };
      await updateChallan(editingChallan._id, payload);

      setChallans(challans.map(c =>
        c._id === editingChallan._id ? { ...c, ...payload } : c
      ));

      setEditingChallan(null);
    } catch (error) {
      console.error('Failed to update Challan details:', error);
      alert('Failed to update. Please try again.');
    }
  };

  const handleEditPending = (record) => {
    navigate('/remaining-material', { state: { recordData: record } });
  };

  const filteredChallans = challans.filter(c => {
    const matchesSearch = c.challanNo?.toString().includes(searchTerm) || 
                          c.contractorName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          c.date?.includes(searchTerm);
    if (!matchesSearch) return false;
    
    if (fromDate || toDate) {
      if (c.date) {
        if (fromDate && c.date < fromDate) return false;
        if (toDate && c.date > toDate) return false;
      }
    }
    return true;
  });

  const filteredRemaining = remainingMaterials.filter(r => {
    const matchesSearch = r.originalChallanNo?.toString().includes(searchTerm) || 
                          r.contractorName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          r.date?.includes(searchTerm);
    if (!matchesSearch) return false;

    if (fromDate || toDate) {
      if (r.date) {
        if (fromDate && r.date < fromDate) return false;
        if (toDate && r.date > toDate) return false;
      }
    }
    return true;
  });

  const activeRecords = activeTab === 'challans' ? filteredChallans : filteredRemaining;
  const indexOfLastRecord = currentPage * recordsPerPage;
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
  const currentRecords = activeRecords.slice(indexOfFirstRecord, indexOfLastRecord);
  const totalPages = Math.ceil(activeRecords.length / recordsPerPage);

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Challan & Billing Management</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">Manage, view, and print generated delivery challans.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0059bb] hover:bg-[#004899] text-white text-sm font-semibold transition-colors cursor-pointer shadow-xs" 
            onClick={() => navigate('/create-challan')}
          >
            <Plus size={18} /> New Challan
          </button>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs p-4 sm:p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
            <FileText className="text-[#0059bb]" size={22} />
            Saved Challans
          </h2>
          
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search size={18} className="text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input 
                type="text" 
                placeholder="Search challans..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2 text-sm rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0059bb]/20 focus:border-[#0059bb] transition-all"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500">From:</span>
              <input 
                type="date" 
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0059bb]/20 focus:border-[#0059bb] transition-all w-36"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500">To:</span>
              <input 
                type="date" 
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0059bb]/20 focus:border-[#0059bb] transition-all w-36"
              />
            </div>
          </div>
        </div>

        <div className="flex gap-2 border-b border-slate-200 mb-6">
          <button 
            className={`px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-colors cursor-pointer ${
              activeTab === 'challans' 
                ? 'text-[#0059bb] border-[#0059bb]' 
                : 'text-slate-500 hover:text-slate-800 border-transparent'
            }`}
            onClick={() => setActiveTab('challans')}
          >
            Delivery Challans
          </button>
          <button 
            className={`px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-colors cursor-pointer ${
              activeTab === 'remaining' 
                ? 'text-[#0059bb] border-[#0059bb]' 
                : 'text-slate-500 hover:text-slate-800 border-transparent'
            }`}
            onClick={() => setActiveTab('remaining')}
          >
            Pending Materials
          </button>
        </div>

        {activeTab === 'challans' && (
          <TableWrapper minWidth="750px">
            <table className="w-full text-xs sm:text-sm text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80">
                  <th className="px-4 py-3 font-semibold text-xs text-slate-500 uppercase tracking-wider">Challan No.</th>
                  <th className="px-4 py-3 font-semibold text-xs text-slate-500 uppercase tracking-wider">Date</th>
                  <th className="px-4 py-3 font-semibold text-xs text-slate-500 uppercase tracking-wider">Contractor</th>
                  <th className="px-4 py-3 font-semibold text-xs text-slate-500 uppercase tracking-wider">Vehicle No.</th>
                  <th className="px-4 py-3 font-semibold text-xs text-slate-500 uppercase tracking-wider text-right">Total Items</th>
                  <th className="px-4 py-3 font-semibold text-xs text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 font-semibold text-xs text-slate-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredChallans.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center py-12 text-slate-500">
                      {challans.length === 0 
                        ? 'No challans found. Create your first delivery challan!' 
                        : 'No challans match your search.'}
                    </td>
                  </tr>
                ) : (
                  currentRecords.map((challan, idx) => (
                    <tr key={challan.challanNo + idx} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3 font-mono text-[#0059bb] font-semibold">{challan.challanNo}</td>
                      <td className="px-4 py-3 text-slate-600">{challan.date}</td>
                      <td className="px-4 py-3 font-medium text-slate-900">{challan.contractorName}</td>
                      <td className="px-4 py-3 text-slate-600">{challan.vehicleNumber}</td>
                      <td className="px-4 py-3 text-right font-mono font-medium text-slate-700">
                        {challan.materials?.reduce((sum, m) => sum + m.qty, 0) || 0} units
                      </td>
                      <td className="px-4 py-3">
                        <select
                          className={`text-xs font-semibold px-2.5 py-1 rounded-full border cursor-pointer outline-none transition-colors ${
                            challan.status === 'Pending' 
                              ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100' 
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                          }`}
                          value={challan.status || 'Dispatched'}
                          onChange={(e) => handleStatusChange(challan._id, e.target.value)}
                        >
                          <option value="Dispatched">Dispatched</option>
                          <option value="Pending">Pending</option>
                        </select>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex gap-1.5 justify-end">
                          <button 
                            className="p-1.5 text-[#0059bb] hover:bg-blue-50 rounded-lg transition-colors cursor-pointer" 
                            onClick={() => handleEditClick(challan)}
                            title="Edit"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button 
                            className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer" 
                            onClick={() => handleView(challan)}
                            title="View & Print"
                          >
                            <Eye size={16} />
                          </button>
                          <button 
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer" 
                            onClick={() => actualDelete(challan._id, challan.challanNo)}
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </TableWrapper>
        )}

        {activeTab === 'remaining' && (
          <TableWrapper minWidth="750px">
            <table className="w-full text-xs sm:text-sm text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80">
                  <th className="px-4 py-3 font-semibold text-xs text-slate-500 uppercase tracking-wider">Original Challan No.</th>
                  <th className="px-4 py-3 font-semibold text-xs text-slate-500 uppercase tracking-wider">Date Recorded</th>
                  <th className="px-4 py-3 font-semibold text-xs text-slate-500 uppercase tracking-wider">Contractor</th>
                  <th className="px-4 py-3 font-semibold text-xs text-slate-500 uppercase tracking-wider">Division</th>
                  <th className="px-4 py-3 font-semibold text-xs text-slate-500 uppercase tracking-wider text-right">Pending Items (Qty)</th>
                  <th className="px-4 py-3 font-semibold text-xs text-slate-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRemaining.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-12 text-slate-500">
                      {remainingMaterials.length === 0 
                        ? 'No pending materials recorded.' 
                        : 'No records match your search.'}
                    </td>
                  </tr>
                ) : (
                  currentRecords.map((record, idx) => (
                    <tr key={record._id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3 font-mono text-[#0059bb] font-semibold">{record.originalChallanNo}</td>
                      <td className="px-4 py-3 text-slate-600">{record.date}</td>
                      <td className="px-4 py-3 font-medium text-slate-900">{record.contractorName}</td>
                      <td className="px-4 py-3 text-slate-600">{record.divisionName || '-'}</td>
                      <td className="px-4 py-3 text-right">
                        {record.materials?.map((m, i) => (
                          <div key={i} className="text-xs text-slate-700">
                            {m.name} <span className="font-mono text-slate-500">({m.qty} {m.unit})</span>
                          </div>
                        ))}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex gap-1.5 justify-end">
                          <button 
                            className="p-1.5 text-[#0059bb] hover:bg-blue-50 rounded-lg transition-colors cursor-pointer" 
                            onClick={() => handleEditPending(record)}
                            title="Edit"
                          >
                            <Edit size={16} />
                          </button>
                          <button 
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer" 
                            onClick={() => deleteRemainingMaterial(record._id)}
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </TableWrapper>
        )}

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 mt-6 pt-4 border-t border-slate-100">
            <button 
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-3.5 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-xs sm:text-sm font-medium transition-colors cursor-pointer"
            >
              Previous
            </button>
            <span className="text-xs sm:text-sm font-semibold text-slate-600">
              Page {currentPage} of {totalPages}
            </span>
            <button 
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-3.5 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-xs sm:text-sm font-medium transition-colors cursor-pointer"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Edit Challan Modal */}
      <Modal 
        isOpen={Boolean(editingChallan)} 
        onClose={() => setEditingChallan(null)} 
        title="Edit Challan Details"
        size="md"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Challan No.</label>
              <input
                type="text"
                value={editFormData.challanNo}
                onChange={e => setEditFormData({ ...editFormData, challanNo: e.target.value })}
                className="w-full p-2 border border-slate-200 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Date</label>
              <input
                type="text"
                placeholder="dd/mm/yyyy"
                value={editFormData.date}
                onChange={e => setEditFormData({ ...editFormData, date: e.target.value })}
                className="w-full p-2 border border-slate-200 rounded-lg text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Contractor Name</label>
            <input
              type="text"
              value={editFormData.contractorName}
              onChange={e => setEditFormData({ ...editFormData, contractorName: e.target.value })}
              className="w-full p-2 border border-slate-200 rounded-lg text-sm"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Vehicle No.</label>
              <input
                type="text"
                value={editFormData.vehicleNumber}
                onChange={e => setEditFormData({ ...editFormData, vehicleNumber: e.target.value })}
                className="w-full p-2 border border-slate-200 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Driver Name</label>
              <input
                type="text"
                value={editFormData.driverName}
                onChange={e => setEditFormData({ ...editFormData, driverName: e.target.value })}
                className="w-full p-2 border border-slate-200 rounded-lg text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Gate Pass No.</label>
              <input
                type="text"
                value={editFormData.gatePassNo}
                onChange={e => setEditFormData({ ...editFormData, gatePassNo: e.target.value })}
                className="w-full p-2 border border-slate-200 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Gate Pass Date</label>
              <input
                type="text"
                placeholder="dd/mm/yyyy"
                value={editFormData.gatePassDate || ''}
                onChange={e => setEditFormData({ ...editFormData, gatePassDate: e.target.value })}
                className="w-full p-2 border border-slate-200 rounded-lg text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Division</label>
              <input
                type="text"
                value={editFormData.divisionName}
                onChange={e => setEditFormData({ ...editFormData, divisionName: e.target.value })}
                className="w-full p-2 border border-slate-200 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Sub-Division</label>
              <input
                type="text"
                value={editFormData.subDivisionName}
                onChange={e => setEditFormData({ ...editFormData, subDivisionName: e.target.value })}
                className="w-full p-2 border border-slate-200 rounded-lg text-sm"
              />
            </div>
          </div>

          <div className="max-h-48 overflow-y-auto border border-slate-200 p-3 rounded-lg bg-slate-50">
            <div className="flex justify-between items-center mb-3">
              <h4 className="text-xs font-semibold text-slate-700 m-0">Edit Materials Qty</h4>
              <select 
                onChange={(e) => {
                  const newMat = e.target.value;
                  if (newMat && !editFormData.materials?.[newMat]) {
                    setEditFormData({
                      ...editFormData,
                      materials: { ...editFormData.materials, [newMat]: 0 }
                    });
                  }
                  e.target.value = "";
                }}
                className="p-1 border border-slate-200 rounded text-xs max-w-[150px] bg-white"
              >
                <option value="">+ Add Material</option>
                {materialsList.filter(m => !editFormData.materials?.[m]).map(mat => (
                  <option key={mat} value={mat}>{mat}</option>
                ))}
              </select>
            </div>

            {Object.keys(editFormData.materials || {}).map(matName => (
              <div key={matName} className="flex justify-between items-center mb-2">
                <label className="text-xs flex-1 pr-2 text-slate-600 truncate" title={matName}>{matName}</label>
                <input
                  type="number"
                  min="0"
                  value={editFormData.materials?.[matName] !== undefined ? editFormData.materials[matName] : ''}
                  onChange={e => setEditFormData({
                    ...editFormData,
                    materials: {
                      ...editFormData.materials,
                      [matName]: e.target.value ? parseInt(e.target.value) : 0
                    }
                  })}
                  className="w-20 p-1 text-right border border-slate-200 rounded text-xs bg-white font-mono"
                />
              </div>
            ))}
            {Object.keys(editFormData.materials || {}).length === 0 && (
              <div className="text-xs text-slate-400 italic">No materials recorded.</div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button 
              onClick={() => setEditingChallan(null)} 
              className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-xs sm:text-sm font-medium transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button 
              onClick={handleSaveEdit} 
              className="px-4 py-2 rounded-xl bg-[#0059bb] hover:bg-[#004899] text-white text-xs sm:text-sm font-semibold transition-colors cursor-pointer shadow-xs"
            >
              Save Changes
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
