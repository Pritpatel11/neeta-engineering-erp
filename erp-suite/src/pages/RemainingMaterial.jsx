import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Info, Package, 
  Plus, Trash2, CheckCircle, X, AlertTriangle
} from 'lucide-react';
import { createRemainingMaterial, updateRemainingMaterial, getChallans, getMaterials } from '../services/api';

export default function RemainingMaterial() {
  const [materialsList, setMaterialsList] = React.useState([]);

  React.useEffect(() => {
    const fetchMasterData = async () => {
      try {
        const mats = await getMaterials();
        setMaterialsList(mats.map(m => m.name));
      } catch (error) {
        console.error("Failed to load materials", error);
      }
    };
    fetchMasterData();
  }, []);

  const navigate = useNavigate();
  const location = useLocation();
  const existingRecord = location.state?.recordData || null;
  const isEditing = !!existingRecord;

  const [materials, setMaterials] = useState(existingRecord ? existingRecord.materials : []);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalSelections, setModalSelections] = useState({});
  const [contractorName, setContractorName] = useState(existingRecord ? existingRecord.contractorName : "");
  const [divisionName, setDivisionName] = useState(existingRecord ? (existingRecord.divisionName || "") : "");

  const handleChallanBlur = async (e) => {
    const challanNo = e.target.value;
    if (!challanNo) return;
    
    // Auto lookup contractor and division from saved challans via API
    try {
      const savedChallans = await getChallans();
      const found = savedChallans.find(c => c.challanNo === challanNo);
      if (found) {
        if (found.contractorName) setContractorName(found.contractorName);
        if (found.divisionName) setDivisionName(found.divisionName);
      }
    } catch (err) {
      console.error("Error looking up challan from DB", err);
    }
  };

  const handleOpenModal = () => {
    const currentSelections = {};
    materials.forEach(m => {
      currentSelections[m.name] = m.qty;
    });
    setModalSelections(currentSelections);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleModalQtyChange = (item, qty) => {
    const parsedQty = parseInt(qty, 10);
    setModalSelections(prev => ({
      ...prev,
      [item]: isNaN(parsedQty) ? '' : parsedQty
    }));
  };

  const handleAddSelected = () => {
    const updatedMaterials = Object.entries(modalSelections)
      .filter(([name, qty]) => typeof qty === 'number' && qty > 0)
      .map(([name, qty]) => {
        const existing = materials.find(m => m.name === name);
        return {
          id: existing ? existing.id : Date.now() + Math.random(),
          name,
          unit: 'Nos',
          qty
        };
      });
    
    setMaterials(updatedMaterials);
    setIsModalOpen(false);
  };

  const handleDeleteItem = (id) => {
    setMaterials(materials.filter(m => m.id !== id));
  };

  const handleQtyChange = (id, newQty) => {
    const parsedQty = parseInt(newQty, 10);
    setMaterials(materials.map(m => 
      m.id === id ? { ...m, qty: isNaN(parsedQty) ? '' : parsedQty } : m
    ));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    const recordData = {
      originalChallanNo: formData.get('originalChallanNo'),
      contractorName: formData.get('contractorName'),
      divisionName: formData.get('divisionName'),
      date: formData.get('date'),
      materials: materials
    };
    
    try {
      if (isEditing) {
        await updateRemainingMaterial(existingRecord._id, recordData);
      } else {
        await createRemainingMaterial(recordData);
      }
      navigate('/challan-management');
    } catch (error) {
      console.error(`Failed to ${isEditing ? 'update' : 'save'} pending material record:`, error);
      alert('Failed to save record to database. Please try again.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <header className="flex flex-col gap-1">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{isEditing ? 'Edit Pending Material' : 'Record Pending Material'}</h1>
          <p className="text-sm text-slate-500 mt-1">Document items that are pending or short-shipped.</p>
        </div>
      </header>

      <form className="space-y-6 pb-28" onSubmit={handleSave}>
        {/* General Information */}
        <section className="bg-white border border-slate-200/80 rounded-2xl p-5 sm:p-6 shadow-xs">
          <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2 pb-3 mb-5 border-b border-slate-100">
            <Info className="text-[#0059bb]" size={20} />
            Original Reference
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Original Challan No.</label>
              <input 
                type="number" 
                name="originalChallanNo" 
                defaultValue={existingRecord ? existingRecord.originalChallanNo : ''}
                placeholder="Enter Challan No." 
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0059bb]/20 focus:border-[#0059bb] transition-all" 
                onBlur={handleChallanBlur}
                required 
              />
              <small className="text-xs text-slate-500">
                Type Challan No. to auto-fill contractor & division
              </small>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Contractor Name</label>
              <input 
                type="text" 
                name="contractorName" 
                value={contractorName}
                onChange={(e) => setContractorName(e.target.value)}
                placeholder="Auto-filled contractor name" 
                className="w-full px-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-sm text-slate-600 cursor-not-allowed" 
                required 
                readOnly
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Division Name</label>
              <input 
                type="text" 
                name="divisionName" 
                value={divisionName}
                onChange={(e) => setDivisionName(e.target.value)}
                placeholder="Auto-filled division name" 
                className="w-full px-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-sm text-slate-600 cursor-not-allowed" 
                readOnly
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Date of Leftover</label>
              <input type="date" name="date" className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0059bb]/20 focus:border-[#0059bb] transition-all" required defaultValue={existingRecord ? existingRecord.date : new Date().toISOString().split('T')[0]} />
            </div>
          </div>
        </section>

        {/* Material Selection */}
        <section className="bg-white border border-slate-200/80 rounded-2xl p-5 sm:p-6 shadow-xs">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
            <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
              <AlertTriangle className="text-amber-500" size={20} />
              Pending Materials
            </h2>
            <button 
              type="button" 
              className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-[#0059bb] text-xs font-semibold rounded-xl transition-colors cursor-pointer" 
              onClick={handleOpenModal}
            >
              <Plus size={16} /> Add Item
            </button>
          </div>
          <div className="overflow-x-auto mt-4 rounded-xl border border-slate-200">
            <table className="w-full text-left border-collapse min-w-[500px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Material Name</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Unit</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Qty Left Behind</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider w-16"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {materials.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="text-center text-slate-400 py-8 text-sm">
                      No items added yet. Click "Add Item" to specify which materials were left behind.
                    </td>
                  </tr>
                ) : (
                  materials.map((item, index) => (
                    <tr key={item.id || item.name || index} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-4 py-3 text-sm font-medium text-slate-800">{item.name}</td>
                      <td className="px-4 py-3 text-sm text-slate-500">{item.unit}</td>
                      <td className="px-4 py-3 text-right">
                        <input 
                          type="number" 
                          value={item.qty} 
                          onChange={(e) => handleQtyChange(item.id, e.target.value)}
                          className="w-28 px-3 py-1.5 text-right font-mono bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0059bb]/20 focus:border-[#0059bb]" 
                          min="1"
                        />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button 
                          type="button" 
                          className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          onClick={() => handleDeleteItem(item.id)}
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Footer Actions */}
        <div className="fixed bottom-0 left-0 right-0 lg:left-[280px] bg-white/95 backdrop-blur-md border-t border-slate-200 px-6 py-4 flex justify-end items-center gap-3 shadow-lg z-30">
          <button 
            type="button" 
            className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-sm font-semibold transition-colors cursor-pointer" 
            onClick={() => navigate(-1)}
          >
            Cancel
          </button>
          <button 
            type="submit" 
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#0059bb] hover:bg-[#004899] active:bg-[#003c82] disabled:opacity-50 text-white text-sm font-semibold rounded-xl shadow-xs transition-colors cursor-pointer" 
            disabled={materials.length === 0}
          >
            <CheckCircle size={18} /> {isEditing ? 'Update Record' : 'Save Record'}
          </button>
        </div>
      </form>

      {/* Material Selection Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full max-h-[85vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-base font-bold text-slate-900">Select Pending Materials</h3>
              <button className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer" onClick={handleCloseModal}>
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              <div className="flex flex-col gap-2">
                {materialsList.map((item) => (
                  <div key={item} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200/80 rounded-xl hover:border-blue-500/50 transition-colors">
                    <span className="text-sm font-semibold text-slate-800">{item}</span>
                    <input 
                      type="number" 
                      placeholder="Qty" 
                      className="w-24 px-3 py-1.5 text-right font-mono bg-white border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0059bb]/20 focus:border-[#0059bb]"
                      value={modalSelections[item] === undefined ? '' : modalSelections[item]}
                      onChange={(e) => handleModalQtyChange(item, e.target.value)}
                      min="0"
                    />
                  </div>
                ))}
              </div>
            </div>
            
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50/50">
              <button 
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 text-sm font-semibold transition-colors cursor-pointer" 
                onClick={handleCloseModal}
              >
                Cancel
              </button>
              <button 
                className="px-4 py-2 bg-[#0059bb] hover:bg-[#004899] text-white text-sm font-semibold rounded-xl shadow-xs transition-colors cursor-pointer" 
                onClick={handleAddSelected}
              >
                Add Selected
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
