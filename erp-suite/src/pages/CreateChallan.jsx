import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Info, Building, Truck, Package, 
  Plus, Trash2, CheckCircle, X
} from 'lucide-react';
import { createChallan, createStatement, getMaterials, getDivisions, getContractors, getInventoryBalances, getSubDivisions } from '../services/api';
import toast from 'react-hot-toast';
import { handleFormKeyboardNav } from '../utils/keyboardNav';

export default function CreateChallan() {
  const [materialsList, setMaterialsList] = useState([]);
  const [divisionsList, setDivisionsList] = useState([]);
  const [contractorsList, setContractorsList] = useState([]);
  const [inventoryBalances, setInventoryBalances] = useState([]);
  const [subDivisionsList, setSubDivisionsList] = useState([]);
  const [selectedDivision, setSelectedDivision] = useState('');

  React.useEffect(() => {
    const fetchMasterData = async () => {
      try {
        const [mats, divs, conts, balances, subDivs] = await Promise.all([
          getMaterials(), getDivisions(), getContractors(), getInventoryBalances(), getSubDivisions()
        ]);
        setMaterialsList(mats.map(m => m.name));
        setDivisionsList(divs.map(d => d.name));
        setContractorsList(conts.map(c => c.name));
        setInventoryBalances(balances);
        setSubDivisionsList(subDivs);
      } catch (error) {
        console.error("Failed to load master data", error);
      }
    };
    fetchMasterData();
  }, []);

  const navigate = useNavigate();
  const [materials, setMaterials] = useState([]);

  const getAvailableBalance = (materialName) => {
    if (!selectedDivision || !inventoryBalances.length) return 0;
    const divData = inventoryBalances.find(d => d.divisionName === selectedDivision);
    if (!divData || !divData.materials) return 0;
    const mat = divData.materials.find(m => m.name === materialName);
    return mat ? mat.qty : 0;
  };
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalSelections, setModalSelections] = useState({});
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [pendingFormData, setPendingFormData] = useState(null);
  
  const [isStatementPromptOpen, setIsStatementPromptOpen] = useState(false);
  const [recentlyCreatedChallan, setRecentlyCreatedChallan] = useState(null);

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
          unit: name.toUpperCase().includes('STAY CLAMP') ? 'Pair' : 'Nos',
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

  const getNextChallanNo = () => {
    const current = localStorage.getItem('lastChallanNo') || '0';
    return parseInt(current, 10) + 1;
  };

  const handleGenerateChallan = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const dataObj = Object.fromEntries(formData.entries());
    setPendingFormData(dataObj);
    setIsStatusModalOpen(true);
  };

  const confirmGenerateChallan = async (status) => {
    // We can still keep the last sequence number in localStorage for quick prepopulation
    localStorage.setItem('lastChallanNo', pendingFormData.challanNo);
    
    const challanData = {
      challanNo: pendingFormData.challanNo,
      contractorName: pendingFormData.contractorName,
      gatePassNo: pendingFormData.gatePassNo,
      gatePassDate: pendingFormData.gatePassDate,
      date: pendingFormData.date,
      divisionName: pendingFormData.divisionName,
      subDivisionName: pendingFormData.subDivisionName,
      vehicleNumber: pendingFormData.vehicleNumber,
      driverName: pendingFormData.driverName,
      status: status,
      materials: materials
    };
    
    try {
      const savedChallan = await createChallan(challanData);
      setRecentlyCreatedChallan(savedChallan);
      setIsStatusModalOpen(false);
      setIsStatementPromptOpen(true);
    } catch (error) {
      console.error('Failed to create challan:', error);
      const errorMessage = error.response?.data?.message || 'Failed to save challan to database. Please try again.';
      alert(errorMessage);
      setIsStatusModalOpen(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <header className="flex flex-col gap-1">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Create New Delivery Challan</h1>
          <p className="text-sm text-slate-500 mt-1">Generate a dispatch document for finished materials.</p>
        </div>
      </header>

      <form className="space-y-6 pb-28" onSubmit={handleGenerateChallan} onKeyDown={handleFormKeyboardNav}>
        {/* General Information */}
        <section className="bg-white border border-slate-200/80 rounded-2xl p-5 sm:p-6 shadow-xs">
          <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2 pb-3 mb-5 border-b border-slate-100">
            <Info className="text-[#0059bb]" size={20} />
            General Information
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Division</label>
              <select 
                name="divisionName" 
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0059bb]/20 focus:border-[#0059bb] transition-all cursor-pointer" 
                value={selectedDivision} 
                onChange={(e) => setSelectedDivision(e.target.value)} 
                required
              >
                <option value="" disabled>Select Division</option>
                {divisionsList.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Contractor Name</label>
              <input 
                type="text" 
                name="contractorName" 
                placeholder="Enter Contractor Name" 
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0059bb]/20 focus:border-[#0059bb] transition-all" 
                list="challan-contractors-list"
                required 
              />
              <datalist id="challan-contractors-list">
                {contractorsList.map(c => <option key={c} value={c} />)}
              </datalist>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Gate Pass No.</label>
              <input type="text" name="gatePassNo" placeholder="Enter gate pass number" className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0059bb]/20 focus:border-[#0059bb] transition-all" required />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Gate Pass Date</label>
              <input type="text" name="gatePassDate" placeholder="dd/mm/yyyy" className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0059bb]/20 focus:border-[#0059bb] transition-all" required />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Challan No.</label>
              <input type="number" name="challanNo" defaultValue={getNextChallanNo()} className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0059bb]/20 focus:border-[#0059bb] transition-all" required />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Date</label>
              <input type="text" name="date" placeholder="dd/mm/yyyy" className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0059bb]/20 focus:border-[#0059bb] transition-all" required />
            </div>
          </div>
        </section>

        {/* Administrative Details */}
        <section className="bg-white border border-slate-200/80 rounded-2xl p-5 sm:p-6 shadow-xs">
          <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2 pb-3 mb-5 border-b border-slate-100">
            <Building className="text-[#0059bb]" size={20} />
            Administrative Details
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Sub-Division Name</label>
              <input type="text" name="subDivisionName" placeholder="Enter Sub-Division" className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0059bb]/20 focus:border-[#0059bb] transition-all" list="subdivisions-list" required />
              <datalist id="subdivisions-list">
                {subDivisionsList.map(s => <option key={s} value={s} />)}
              </datalist>
            </div>
          </div>
        </section>

        {/* Transport Details */}
        <section className="bg-white border border-slate-200/80 rounded-2xl p-5 sm:p-6 shadow-xs">
          <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2 pb-3 mb-5 border-b border-slate-100">
            <Truck className="text-[#0059bb]" size={20} />
            Transport Details
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Vehicle Number</label>
              <input 
                type="text" 
                name="vehicleNumber" 
                placeholder="e.g. GJ 01 AB 1234" 
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0059bb]/20 focus:border-[#0059bb] transition-all" 
                pattern="^[A-Za-z]{2}[ \-]?[0-9]{1,2}[ \-]?[A-Za-z]{1,2}[ \-]?[0-9]{4}$"
                title="Format: XX 00 XX 0000 (e.g. GJ 01 AB 1234)"
                required 
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Driver's Name</label>
              <input type="text" name="driverName" placeholder="Enter driver's name" className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0059bb]/20 focus:border-[#0059bb] transition-all" required />
            </div>
          </div>
        </section>

        {/* Material Selection */}
        <section className="bg-white border border-slate-200/80 rounded-2xl p-5 sm:p-6 shadow-xs">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
            <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
              <Package className="text-[#0059bb]" size={20} />
              Material Selection
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
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Qty Dispatched</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider w-16"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {materials.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="text-center text-slate-400 py-8 text-sm">
                      No items added yet. Click "Add Item" to select materials.
                    </td>
                  </tr>
                ) : (
                  materials.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
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
                        {item.qty > getAvailableBalance(item.name) && (
                          <div className="text-rose-600 text-[11px] font-medium mt-1">
                            Warning: Stock {getAvailableBalance(item.name)}
                          </div>
                        )}
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
            <CheckCircle size={18} /> Generate Challan
          </button>
        </div>
      </form>

      {/* Material Selection Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full max-h-[85vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-base font-bold text-slate-900">Select Materials</h3>
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
                type="button" 
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 text-sm font-semibold transition-colors cursor-pointer" 
                onClick={handleCloseModal}
              >
                Cancel
              </button>
              <button 
                type="button" 
                className="px-4 py-2 bg-[#0059bb] hover:bg-[#004899] text-white text-sm font-semibold rounded-xl shadow-xs transition-colors cursor-pointer" 
                onClick={handleAddSelected}
              >
                Add Selected
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Status Selection Modal */}
      {isStatusModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-sm w-full overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-base font-bold text-slate-900">Select Challan Status</h3>
              <button type="button" className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer" onClick={() => setIsStatusModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 text-center space-y-5">
              <p className="text-sm text-slate-600">
                Is this material already dispatched or currently pending dispatch?
              </p>
              <div className="flex gap-3 justify-center">
                <button 
                  type="button" 
                  className="px-4 py-2 rounded-xl border border-amber-500/50 text-amber-700 hover:bg-amber-50 text-sm font-semibold transition-colors cursor-pointer"
                  onClick={() => confirmGenerateChallan('Pending')}
                >
                  Mark as Pending
                </button>
                <button 
                  type="button" 
                  className="px-4 py-2 bg-[#0059bb] hover:bg-[#004899] text-white text-sm font-semibold rounded-xl shadow-xs transition-colors cursor-pointer" 
                  onClick={() => confirmGenerateChallan('Dispatched')}
                >
                  Mark as Dispatched
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Statement Prompt Modal */}
      {isStatementPromptOpen && recentlyCreatedChallan && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-base font-bold text-slate-900">Store in Statement?</h3>
            </div>
            
            <div className="p-6 text-center space-y-5">
              <p className="text-sm text-slate-600">
                Challan created successfully! Do you also want to store this in the Contractor Statement Register?
              </p>
              <div className="flex gap-3 justify-center">
                <button 
                  type="button" 
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-sm font-semibold transition-colors cursor-pointer" 
                  onClick={() => navigate('/challan-preview', { state: { challanData: recentlyCreatedChallan } })}
                >
                  No, Skip
                </button>
                <button 
                  type="button" 
                  className="px-4 py-2 bg-[#0059bb] hover:bg-[#004899] text-white text-sm font-semibold rounded-xl shadow-xs transition-colors cursor-pointer" 
                  onClick={async () => {
                    try {
                      const formattedMaterials = recentlyCreatedChallan.materials.map(m => ({
                        ...m,
                        mrQuantities: { [recentlyCreatedChallan.challanNo]: m.qty }
                      }));

                      const statementData = {
                        statementNo: `ST-${recentlyCreatedChallan.challanNo}-${Date.now().toString().slice(-4)}`,
                        poNo: "Pending",
                        dcNo: recentlyCreatedChallan.challanNo,
                        dcDate: recentlyCreatedChallan.date,
                        date: recentlyCreatedChallan.date,
                        contractorName: recentlyCreatedChallan.contractorName,
                        divisionName: recentlyCreatedChallan.divisionName,
                        subDivisionName: recentlyCreatedChallan.subDivisionName,
                        mrNumbers: [recentlyCreatedChallan.challanNo],
                        materials: formattedMaterials,
                        status: 'Pending'
                      };
                      await createStatement(statementData);
                      navigate('/challan-preview', { state: { challanData: recentlyCreatedChallan } });
                    } catch (err) {
                      console.error(err);
                      alert('Failed to store in Statement.');
                      navigate('/challan-preview', { state: { challanData: recentlyCreatedChallan } });
                    }
                  }}
                >
                  Yes, Store It
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
