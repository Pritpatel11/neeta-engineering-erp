import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Info, Building, Package, 
  Trash2, CheckCircle, X, Hash, Edit2
} from 'lucide-react';
import { createStatement, updateStatement, getMaterials, getDivisions, getContractors, getInventoryBalances, getSubDivisions } from '../services/api';
import { handleFormKeyboardNav } from '../utils/keyboardNav';

export default function CreateStatement() {
  const [materialsList, setMaterialsList] = useState([]);
  const [divisions, setDivisions] = useState([]);
  const [contractors, setContractors] = useState([]);
  const [inventoryBalances, setInventoryBalances] = useState([]);
  const [subDivisions, setSubDivisions] = useState([]);
  const [selectedDivision, setSelectedDivision] = useState('');

  React.useEffect(() => {
    const fetchMasterData = async () => {
      try {
        const [mats, divs, conts, balances, subDivs] = await Promise.all([
          getMaterials(), getDivisions(), getContractors(), getInventoryBalances(), getSubDivisions()
        ]);
        setMaterialsList(mats.map(m => m.name));
        setDivisions(divs.map(d => d.name));
        setContractors(conts.map(c => c.name));
        setInventoryBalances(balances);
        setSubDivisions(subDivs);
      } catch (error) {
        console.error("Failed to load master data", error);
      }
    };
    fetchMasterData();
  }, []);
  const navigate = useNavigate();
  const location = useLocation();
  const existingStatement = location.state?.statementData || null;
  const isEditing = !!existingStatement;

  React.useEffect(() => {
    if (existingStatement && existingStatement.divisionName && !selectedDivision) {
      setSelectedDivision(existingStatement.divisionName);
    }
  }, [existingStatement]);

  const [materials, setMaterials] = useState(existingStatement ? existingStatement.materials : []);
  const [mrNumbers, setMrNumbers] = useState(existingStatement?.mrNumbers || []);
  const [poNumbers, setPoNumbers] = useState(existingStatement?.poNumbers || {});
  const [relNumbers, setRelNumbers] = useState(existingStatement?.relNumbers || {});
  const [newMrNumber, setNewMrNumber] = useState('');
  const [newPoNumber, setNewPoNumber] = useState('');
  const [newRelNumber, setNewRelNumber] = useState('');

  const getAvailableBalance = (materialName) => {
    if (!selectedDivision || !inventoryBalances.length) return 0;
    const divData = inventoryBalances.find(d => d.divisionName === selectedDivision);
    if (!divData || !divData.materials) return 0;
    const mat = divData.materials.find(m => m.name === materialName);
    return mat ? mat.qty : 0;
  };
  
  // State for the MR Material Selection Modal
  const [activeMrModal, setActiveMrModal] = useState(null); 
  const [mrModalSelections, setMrModalSelections] = useState({});
  const [editingMrInfo, setEditingMrInfo] = useState(null);

  const openEditMrInfoModal = (mr) => {
    setEditingMrInfo({
      oldMr: mr,
      newMr: mr,
      newPo: poNumbers[mr] || '',
      newRel: relNumbers[mr] || ''
    });
  };

  const closeEditMrInfoModal = () => {
    setEditingMrInfo(null);
  };

  const handleSaveMrInfo = () => {
    const { oldMr, newMr, newPo, newRel } = editingMrInfo;
    const trimmedNewMr = newMr.trim();
    
    if (!trimmedNewMr) {
      alert("MR Number cannot be empty!");
      return;
    }

    if (oldMr !== trimmedNewMr && mrNumbers.includes(trimmedNewMr)) {
      alert("This MR Number already exists!");
      return;
    }

    setMrNumbers(prev => prev.map(m => m === oldMr ? trimmedNewMr : m));
    
    setPoNumbers(prev => {
        const updated = { ...prev };
        delete updated[oldMr];
        if (newPo.trim()) {
            updated[trimmedNewMr] = newPo.trim();
        }
        return updated;
    });

    setRelNumbers(prev => {
        const updated = { ...prev };
        delete updated[oldMr];
        if (newRel.trim()) {
            updated[trimmedNewMr] = newRel.trim();
        }
        return updated;
    });

    setMaterials(prev => prev.map(m => {
        if (!m.mrQuantities || m.mrQuantities[oldMr] === undefined) return m;
        const newMrQ = { ...m.mrQuantities };
        const qty = newMrQ[oldMr];
        delete newMrQ[oldMr];
        newMrQ[trimmedNewMr] = qty;
        return { ...m, mrQuantities: newMrQ };
    }));
    
    setEditingMrInfo(null);
  };

  const getNextStatementNo = () => {
    if (existingStatement) return existingStatement.statementNo;
    const current = localStorage.getItem('lastStatementNo') || '0';
    return parseInt(current, 10) + 1;
  };

  const handleAddMrNumber = () => {
    const mr = newMrNumber.trim();
    if (mr) {
      if (!mrNumbers.includes(mr)) {
        setMrNumbers([...mrNumbers, mr]);
        setPoNumbers(prev => ({ ...prev, [mr]: newPoNumber.trim() }));
        setRelNumbers(prev => ({ ...prev, [mr]: newRelNumber.trim() }));
      }
      setNewMrNumber('');
      setNewPoNumber('');
      setNewRelNumber('');
      openMrModal(mr);
    }
  };

  const openMrModal = (mr) => {
    const currentSelections = {};
    materials.forEach(m => {
      if (m.mrQuantities && m.mrQuantities[mr]) {
        currentSelections[m.name] = m.mrQuantities[mr];
      }
    });
    setMrModalSelections(currentSelections);
    setActiveMrModal(mr);
  };

  const closeMrModal = () => {
    setActiveMrModal(null);
  };

  const handleMrModalQtyChange = (item, qty) => {
    const parsedQty = parseInt(qty, 10);
    setMrModalSelections(prev => ({
      ...prev,
      [item]: isNaN(parsedQty) ? '' : parsedQty
    }));
  };

  const saveMrModalSelections = () => {
    let updatedMaterials = [...materials];

    Object.entries(mrModalSelections).forEach(([name, qty]) => {
      const parsedQty = parseInt(qty, 10);
      const validQty = isNaN(parsedQty) ? 0 : parsedQty;

      const existingIndex = updatedMaterials.findIndex(m => m.name === name);
      
      if (existingIndex >= 0) {
        // Update existing item
        const m = updatedMaterials[existingIndex];
        const newMrQ = { ...(m.mrQuantities || {}), [activeMrModal]: validQty };
        const newTotal = Object.values(newMrQ).reduce((sum, q) => sum + (q || 0), 0);
        updatedMaterials[existingIndex] = { ...m, mrQuantities: newMrQ, qty: newTotal };
      } else if (validQty > 0) {
        // Add new item
        updatedMaterials.push({
          id: Date.now() + Math.random(),
          name,
          unit: name.toUpperCase().includes('STAY CLAMP') ? 'Pair' : 'Nos',
          mrQuantities: { [activeMrModal]: validQty },
          qty: validQty
        });
      }
    });

    // Clean up items with 0 total quantity
    updatedMaterials = updatedMaterials.filter(m => m.qty > 0);

    setMaterials(updatedMaterials);
    closeMrModal();
  };

  const handleRemoveMrNumber = (mrToRemove) => {
    setMrNumbers(mrNumbers.filter(mr => mr !== mrToRemove));
    
    const newPo = { ...poNumbers };
    delete newPo[mrToRemove];
    setPoNumbers(newPo);
    
    const newRel = { ...relNumbers };
    delete newRel[mrToRemove];
    setRelNumbers(newRel);

    setMaterials(materials.map(m => {
      const newMrQ = { ...(m.mrQuantities || {}) };
      delete newMrQ[mrToRemove];
      const newTotal = Object.values(newMrQ).reduce((sum, q) => sum + (q || 0), 0);
      return { ...m, mrQuantities: newMrQ, qty: newTotal };
    }).filter(m => m.qty > 0));
  };

  const handleMrQtyChange = (id, mrNumber, newQty) => {
    const parsedQty = parseInt(newQty, 10);
    const validQty = isNaN(parsedQty) ? 0 : parsedQty;
    
    setMaterials(materials.map(m => {
      if (m.id === id) {
        const updatedMrQ = { ...(m.mrQuantities || {}), [mrNumber]: validQty };
        const newTotal = Object.values(updatedMrQ).reduce((sum, q) => sum + (q || 0), 0);
        return { ...m, mrQuantities: updatedMrQ, qty: newTotal };
      }
      return m;
    }).filter(m => m.qty > 0));
  };

  const handleDeleteItem = (id) => {
    setMaterials(materials.filter(m => m.id !== id));
  };

  const handleGenerateStatement = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    localStorage.setItem('lastStatementNo', formData.get('statementNo'));
    
    const statementData = {
      statementNo: formData.get('statementNo'),
      poNo: 'Multiple', // Fallback for backwards compatibility
      relNo: 'Multiple', // Fallback
      date: formData.get('date'),
      contractorName: formData.get('contractorName'),
      divisionName: formData.get('divisionName'),
      subDivisionName: formData.get('subDivisionName'),
      mrNumbers: mrNumbers,
      poNumbers: poNumbers,
      relNumbers: relNumbers,
      materials: materials
    };
    
    try {
      let savedStatement;
      if (isEditing) {
        savedStatement = await updateStatement(existingStatement._id, statementData);
      } else {
        savedStatement = await createStatement(statementData);
      }
      
      if (savedStatement.warning) {
        alert(savedStatement.warning);
      }
      
      navigate('/statement-preview', { state: { statementData: savedStatement } });
    } catch (error) {
      console.error(`Failed to ${isEditing ? 'update' : 'create'} statement:`, error);
      const errorMessage = error.response?.data?.message || `Failed to save statement to database. Please try again.`;
      alert(errorMessage);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <header className="flex flex-col gap-1">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{isEditing ? 'Edit Material Statement' : 'Create Material Statement'}</h1>
          <p className="text-sm text-slate-500 mt-1">{isEditing ? 'Modify existing material requirement slip with multiple MR Numbers.' : 'Generate a material requirement slip with multiple MR Numbers.'}</p>
        </div>
      </header>

      <form className="space-y-6 pb-28" onSubmit={handleGenerateStatement} onKeyDown={handleFormKeyboardNav}>
        {/* General Information */}
        <section className="bg-white border border-slate-200/80 rounded-2xl p-5 sm:p-6 shadow-xs">
          <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2 pb-3 mb-5 border-b border-slate-100">
            <Info className="text-[#0059bb]" size={20} />
            General Information
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Statement No.</label>
              <input type="number" name="statementNo" defaultValue={getNextStatementNo()} className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0059bb]/20 focus:border-[#0059bb] transition-all" required />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Date</label>
              <input type="text" name="date" placeholder="dd/mm/yyyy" defaultValue={existingStatement ? existingStatement.date : ''} className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0059bb]/20 focus:border-[#0059bb] transition-all" required />
            </div>
          </div>
        </section>

        {/* Administrative Details */}
        <section className="bg-white border border-slate-200/80 rounded-2xl p-5 sm:p-6 shadow-xs">
          <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2 pb-3 mb-5 border-b border-slate-100">
            <Building className="text-[#0059bb]" size={20} />
            Administrative Details
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Contractor Name</label>
              <input 
                type="text" 
                name="contractorName" 
                defaultValue={existingStatement ? existingStatement.contractorName : ''} 
                placeholder="Enter Contractor Name" 
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0059bb]/20 focus:border-[#0059bb] transition-all" 
                list="contractors-list"
                required 
              />
              <datalist id="contractors-list">
                {contractors.map(c => <option key={c} value={c} />)}
              </datalist>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Division/Tender Name</label>
              <select 
                name="divisionName" 
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0059bb]/20 focus:border-[#0059bb] transition-all cursor-pointer" 
                value={selectedDivision}
                onChange={(e) => setSelectedDivision(e.target.value)}
                required
              >
                <option value="" disabled>Select Division</option>
                {divisions.map(d => <option key={d} value={d}>{d}</option>)}
                {existingStatement && !divisions.includes(existingStatement.divisionName) && (
                  <option value={existingStatement.divisionName}>{existingStatement.divisionName}</option>
                )}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Sub-Division Name</label>
              <input type="text" name="subDivisionName" defaultValue={existingStatement ? existingStatement.subDivisionName : ''} placeholder="Enter Sub-Division" className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0059bb]/20 focus:border-[#0059bb] transition-all" list="subdivisions-list" required />
              <datalist id="subdivisions-list">
                {subDivisions.map(s => <option key={s} value={s} />)}
              </datalist>
            </div>
            
            <div className="col-span-1 sm:col-span-2 lg:col-span-3 mt-4 bg-slate-50 p-4 sm:p-5 rounded-2xl border border-dashed border-slate-300 space-y-3">
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 uppercase tracking-wider">
                <Hash size={16} className="text-[#0059bb]"/> 
                Multiple MR / Lot Numbers
              </label>
              <p className="text-xs text-slate-500">Enter an MR number and a popup will open for you to assign materials and quantities for it.</p>
              
              <div className="flex gap-2 flex-wrap mb-3">
                {mrNumbers.length === 0 && <span className="text-xs text-slate-400">No MR numbers added yet.</span>}
                {mrNumbers.map(mr => (
                  <div key={mr} className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#0059bb] text-white rounded-full text-xs font-semibold shadow-xs">
                    <span className="cursor-pointer flex items-center gap-1 hover:underline" onClick={() => openMrModal(mr)} title="Edit Quantities for this MR">
                      {mr} {poNumbers[mr] ? `(PO: ${poNumbers[mr]})` : ''}
                    </span>
                    <div className="w-px h-3.5 bg-white/30"></div>
                    <Edit2 size={13} className="cursor-pointer hover:opacity-80 transition-opacity" onClick={() => openEditMrInfoModal(mr)} title="Edit MR/PO/Rel Details" />
                    <X size={13} className="cursor-pointer hover:opacity-80 transition-opacity" onClick={() => handleRemoveMrNumber(mr)} title="Remove MR" />
                  </div>
                ))}
              </div>
              
              <div className="flex flex-wrap gap-3 items-end">
                <div className="flex-1 min-w-[140px] flex flex-col gap-1">
                  <label className="text-xs text-slate-500 font-medium">MR/Lot No.</label>
                  <input 
                    type="text" 
                    placeholder="Enter MR No." 
                    value={newMrNumber} 
                    onChange={(e) => setNewMrNumber(e.target.value)} 
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0059bb]/20 focus:border-[#0059bb]"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddMrNumber();
                      }
                    }}
                  />
                </div>
                <div className="flex-1 min-w-[140px] flex flex-col gap-1">
                  <label className="text-xs text-slate-500 font-medium">P.O. No.</label>
                  <input 
                    type="text" 
                    placeholder="Enter P.O. No."
                    value={newPoNumber}
                    onChange={(e) => setNewPoNumber(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0059bb]/20 focus:border-[#0059bb]"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddMrNumber();
                      }
                    }}
                  />
                </div>
                <div className="flex-1 min-w-[140px] flex flex-col gap-1">
                  <label className="text-xs text-slate-500 font-medium">Rel No.</label>
                  <input 
                    type="text" 
                    placeholder="Enter Rel No."
                    value={newRelNumber}
                    onChange={(e) => setNewRelNumber(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0059bb]/20 focus:border-[#0059bb]"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddMrNumber();
                      }
                    }}
                  />
                </div>
                <button 
                  type="button" 
                  className="px-4 py-2 bg-[#0059bb] hover:bg-[#004899] text-white text-sm font-semibold rounded-xl shadow-xs transition-colors cursor-pointer" 
                  onClick={handleAddMrNumber}
                >
                  Add MR No.
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Material Selection */}
        <section className="bg-white border border-slate-200/80 rounded-2xl p-5 sm:p-6 shadow-xs">
          <div className="pb-3 mb-4 border-b border-slate-100">
            <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
              <Package className="text-[#0059bb]" size={20} />
              Material Requirement Overview
            </h2>
          </div>
          
          <div className="w-full overflow-x-auto mt-4 rounded-xl border border-slate-200">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Material Name</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Unit</th>
                  {mrNumbers.map((mr, i) => (
                    <th key={i} className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-center min-w-[90px]">
                      <div className="flex items-center justify-center gap-1.5">
                        <span className="font-mono text-[#0059bb] cursor-pointer hover:underline inline-flex items-center gap-1" onClick={() => openMrModal(mr)} title="Click to Edit">
                          {mr} <Edit2 size={11} />
                        </span>
                      </div>
                    </th>
                  ))}
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Total Qty</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider w-16"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {materials.length === 0 ? (
                  <tr>
                    <td colSpan={4 + mrNumbers.length} className="text-center text-slate-400 py-8 text-sm">
                      No items added yet. Please enter an MR Number above to add materials.
                    </td>
                  </tr>
                ) : (
                  materials.map((item, index) => (
                    <tr key={item.id || item.name || index} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-4 py-3 text-sm font-medium text-slate-800">{item.name}</td>
                      <td className="px-4 py-3 text-sm text-slate-500">{item.unit}</td>
                      
                      {mrNumbers.map(mr => (
                        <td key={mr} className="px-4 py-3 text-center">
                          <input 
                            type="number" 
                            value={(item.mrQuantities && item.mrQuantities[mr]) || ''} 
                            onChange={(e) => handleMrQtyChange(item.id, mr, e.target.value)}
                            className="w-20 px-2 py-1 text-center font-mono bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0059bb]/20 focus:border-[#0059bb]" 
                            placeholder="0"
                            min="0"
                          />
                        </td>
                      ))}

                      <td className="px-4 py-3 text-right font-mono font-bold text-slate-900 text-base">
                        {item.qty || 0}
                        {item.qty > getAvailableBalance(item.name) && (
                          <div className="text-rose-600 text-[11px] font-medium font-sans mt-1">
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
              {materials.length > 0 && mrNumbers.length > 0 && (
                <tfoot>
                  <tr className="bg-slate-50 border-t-2 border-slate-200 font-bold">
                    <td colSpan={2} className="px-4 py-3 text-right text-xs uppercase tracking-wider text-slate-500">Total Per MR:</td>
                    {mrNumbers.map(mr => (
                      <td key={`total-${mr}`} className="px-4 py-3 text-center font-mono text-[#0059bb] text-base">
                        {materials.reduce((sum, item) => sum + ((item.mrQuantities && item.mrQuantities[mr]) || 0), 0)}
                      </td>
                    ))}
                    <td className="px-4 py-3 text-right font-mono text-slate-900 text-lg font-extrabold">
                      {materials.reduce((sum, item) => sum + (item.qty || 0), 0)}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              )}
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
            <CheckCircle size={18} /> {isEditing ? 'Update Statement' : 'Generate Statement'}
          </button>
        </div>
      </form>

      {/* Edit MR Info Modal */}
      {editingMrInfo && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-sm w-full overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-base font-bold text-slate-900">Edit MR Details</h3>
              <button type="button" className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer" onClick={closeEditMrInfoModal}>
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">MR/Lot No.</label>
                <input 
                  type="text" 
                  value={editingMrInfo.newMr} 
                  onChange={(e) => setEditingMrInfo({...editingMrInfo, newMr: e.target.value})}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0059bb]/20 focus:border-[#0059bb]"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">PO No.</label>
                <input 
                  type="text" 
                  value={editingMrInfo.newPo} 
                  onChange={(e) => setEditingMrInfo({...editingMrInfo, newPo: e.target.value})}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0059bb]/20 focus:border-[#0059bb]"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Rel No.</label>
                <input 
                  type="text" 
                  value={editingMrInfo.newRel} 
                  onChange={(e) => setEditingMrInfo({...editingMrInfo, newRel: e.target.value})}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0059bb]/20 focus:border-[#0059bb]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50/50">
              <button 
                type="button" 
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 text-sm font-semibold transition-colors cursor-pointer" 
                onClick={closeEditMrInfoModal}
              >
                Cancel
              </button>
              <button 
                type="button" 
                className="px-4 py-2 bg-[#0059bb] hover:bg-[#004899] text-white text-sm font-semibold rounded-xl shadow-xs transition-colors cursor-pointer" 
                onClick={handleSaveMrInfo}
              >
                Save Details
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MR Specific Material Selection Modal */}
      {activeMrModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-xl w-full max-h-[85vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-base font-bold text-slate-900">Enter Quantities for MR: {activeMrModal}</h3>
              <button className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer" onClick={closeMrModal}>
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Material Description</th>
                    <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-center">Available Balance</th>
                    <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Quantity (Nos)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {materialsList.map((item) => {
                    const initialBalance = getAvailableBalance(item);
                    
                    // Calculate used quantity in OTHER MRs (not the current one)
                    let usedInOtherMRs = 0;
                    const existingMaterial = materials.find(m => m.name === item);
                    if (existingMaterial && existingMaterial.mrQuantities) {
                      Object.entries(existingMaterial.mrQuantities).forEach(([mr, qty]) => {
                        if (mr !== activeMrModal) {
                          usedInOtherMRs += (qty || 0);
                        }
                      });
                    }

                    // Quantity currently being typed in the modal
                    const currentlyTyping = parseInt(mrModalSelections[item] || 0, 10) || 0;
                    
                    // Real-time remaining balance
                    const remainingBalance = initialBalance - usedInOtherMRs - currentlyTyping;

                    return (
                      <tr key={item} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-4 py-3 text-sm font-medium text-slate-800">{item}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold ${
                            remainingBalance > 0 
                              ? 'bg-blue-100 text-blue-800' 
                              : (remainingBalance < 0 
                                  ? 'bg-rose-100 text-rose-800' 
                                  : 'bg-slate-100 text-slate-600')
                          }`}>
                            {remainingBalance}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <input 
                            type="number" 
                            placeholder="0" 
                            className="w-24 px-3 py-1.5 text-right font-mono bg-white border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0059bb]/20 focus:border-[#0059bb] ml-auto"
                            value={mrModalSelections[item] === undefined ? '' : mrModalSelections[item]}
                            onChange={(e) => handleMrModalQtyChange(item, e.target.value)}
                            min="0"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50/50">
              <button 
                type="button" 
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 text-sm font-semibold transition-colors cursor-pointer" 
                onClick={closeMrModal}
              >
                Cancel
              </button>
              <button 
                type="button" 
                className="px-4 py-2 bg-[#0059bb] hover:bg-[#004899] text-white text-sm font-semibold rounded-xl shadow-xs transition-colors cursor-pointer" 
                onClick={saveMrModalSelections}
              >
                Save MR Data
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
