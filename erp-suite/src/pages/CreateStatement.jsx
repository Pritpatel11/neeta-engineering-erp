import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Info, Building, Package, 
  Trash2, CheckCircle, X, Hash, Edit2
} from 'lucide-react';
import { createStatement, updateStatement, getMaterials, getDivisions, getContractors, getInventoryBalances, getSubDivisions } from '../services/api';
import { handleFormKeyboardNav } from '../utils/keyboardNav';
import './CreateChallan.css'; 

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
    <div className="challan-container">
      <header className="challan-header">
        <div>
          <h1 className="dashboard-title">{isEditing ? 'Edit Material Statement' : 'Create Material Statement'}</h1>
          <p className="dashboard-subtitle">{isEditing ? 'Modify existing material requirement slip with multiple MR Numbers.' : 'Generate a material requirement slip with multiple MR Numbers.'}</p>
        </div>
      </header>

      <form className="challan-form" onSubmit={handleGenerateStatement} onKeyDown={handleFormKeyboardNav}>
        {/* General Information */}
        <section className="form-section glass-card">
          <h2 className="section-title">
            <Info className="text-primary" size={20} />
            General Information
          </h2>
          <div className="form-grid-3">
            <div className="form-group">
              <label>Statement No.</label>
              <input type="number" name="statementNo" defaultValue={getNextStatementNo()} className="form-control" required />
            </div>
            <div className="form-group">
              <label>Date</label>
              <input type="text" name="date" placeholder="dd/mm/yyyy" defaultValue={existingStatement ? existingStatement.date : ''} className="form-control" required />
            </div>
          </div>
        </section>

        {/* Administrative Details */}
        <section className="form-section glass-card">
          <h2 className="section-title">
            <Building className="text-primary" size={20} />
            Administrative Details
          </h2>
          <div className="form-grid-3">
            <div className="form-group">
              <label>Contractor Name</label>
              <input 
                type="text" 
                name="contractorName" 
                defaultValue={existingStatement ? existingStatement.contractorName : ''} 
                placeholder="Enter Contractor Name" 
                className="form-control" 
                list="contractors-list"
                required 
              />
              <datalist id="contractors-list">
                {contractors.map(c => <option key={c} value={c} />)}
              </datalist>
            </div>
            <div className="form-group">
              <label>Division/Tender Name</label>
              <select 
                name="divisionName" 
                className="form-control" 
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
            <div className="form-group">
              <label>Sub-Division Name</label>
              <input type="text" name="subDivisionName" defaultValue={existingStatement ? existingStatement.subDivisionName : ''} placeholder="Enter Sub-Division" className="form-control" list="subdivisions-list" required />
              <datalist id="subdivisions-list">
                {subDivisions.map(s => <option key={s} value={s} />)}
              </datalist>
            </div>
            
            <div className="form-group" style={{ gridColumn: 'span 3', marginTop: '16px', background: 'var(--color-background)', padding: '16px', borderRadius: '8px', border: '1px dashed var(--color-border)' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Hash size={16} className="text-primary"/> 
                Multiple MR / Lot Numbers
              </label>
              <p className="text-muted" style={{ fontSize: '12px', marginBottom: '12px' }}>Enter an MR number and a popup will open for you to assign materials and quantities for it.</p>
              
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
                {mrNumbers.length === 0 && <span className="text-muted" style={{ fontSize: '13px' }}>No MR numbers added yet.</span>}
                {mrNumbers.map(mr => (
                  <div key={mr} className="badge badge-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 12px', fontSize: '14px', background: 'var(--color-primary)', color: 'white', borderRadius: '16px' }}>
                    <span style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }} onClick={() => openMrModal(mr)} title="Edit Quantities for this MR">
                      {mr} {poNumbers[mr] ? `(PO: ${poNumbers[mr]})` : ''}
                    </span>
                    <div style={{ width: '1px', height: '14px', background: 'rgba(255,255,255,0.3)' }}></div>
                    <Edit2 size={14} style={{ cursor: 'pointer' }} onClick={() => openEditMrInfoModal(mr)} title="Edit MR/PO/Rel Details" />
                    <X size={14} style={{ cursor: 'pointer' }} onClick={() => handleRemoveMrNumber(mr)} title="Remove MR" />
                  </div>
                ))}
              </div>
              
              <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label style={{ fontSize: '12px' }}>MR/Lot No.</label>
                  <input 
                    type="text" 
                    placeholder="Enter MR/Lot No"
                    value={newMrNumber}
                    onChange={(e) => setNewMrNumber(e.target.value)}
                    className="form-control"
                    style={{ width: '180px' }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddMrNumber();
                      }
                    }}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label style={{ fontSize: '12px' }}>PO No.</label>
                  <input 
                    type="text" 
                    placeholder="Enter PO No."
                    value={newPoNumber}
                    onChange={(e) => setNewPoNumber(e.target.value)}
                    className="form-control"
                    style={{ width: '150px' }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddMrNumber();
                      }
                    }}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label style={{ fontSize: '12px' }}>Rel No.</label>
                  <input 
                    type="text" 
                    placeholder="Enter Rel No."
                    value={newRelNumber}
                    onChange={(e) => setNewRelNumber(e.target.value)}
                    className="form-control"
                    style={{ width: '120px' }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddMrNumber();
                      }
                    }}
                  />
                </div>
                <button type="button" className="btn-primary" onClick={handleAddMrNumber} style={{ height: '42px' }}>
                  Add MR No.
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Material Selection */}
        <section className="form-section glass-card">
          <div className="section-header-flex">
            <h2 className="section-title mb-0 border-0">
              <Package className="text-primary" size={20} />
              Material Requirement Overview
            </h2>
          </div>
          
          <div className="table-responsive mt-4">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Material Name</th>
                  <th>Unit</th>
                  {mrNumbers.map((mr, i) => (
                    <th key={i} className="text-center" style={{ minWidth: '80px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                        <span className="font-mono text-primary" style={{ cursor: 'pointer' }} onClick={() => openMrModal(mr)} title="Click to Edit">{mr} <Edit2 size={12} /></span>
                      </div>
                    </th>
                  ))}
                  <th className="text-right">Total Qty</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {materials.length === 0 ? (
                  <tr>
                    <td colSpan={4 + mrNumbers.length} className="text-center text-muted" style={{ padding: '32px' }}>
                      No items added yet. Please enter an MR Number above to add materials.
                    </td>
                  </tr>
                ) : (
                  materials.map((item, index) => (
                    <tr key={item.id || item.name || index} className="group">
                      <td className="font-medium">{item.name}</td>
                      <td className="text-muted">{item.unit}</td>
                      
                      {mrNumbers.map(mr => (
                        <td key={mr} className="text-center">
                          <input 
                            type="number" 
                            value={(item.mrQuantities && item.mrQuantities[mr]) || ''} 
                            onChange={(e) => handleMrQtyChange(item.id, mr, e.target.value)}
                            className="form-control-minimal text-center font-mono" 
                            placeholder="0"
                            min="0"
                          />
                        </td>
                      ))}

                      <td className="text-right font-mono font-bold" style={{ fontSize: '1.1rem' }}>
                        {item.qty || 0}
                        {item.qty > getAvailableBalance(item.name) && (
                          <div className="text-error" style={{ fontSize: '11px', marginTop: '4px', fontWeight: '500', fontFamily: 'sans-serif' }}>
                            Warning: Stock {getAvailableBalance(item.name)}
                          </div>
                        )}
                      </td>
                      <td className="text-right">
                        <button 
                          type="button" 
                          className="action-icon text-error"
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
                  <tr>
                    <td colSpan={2} className="text-right font-bold text-muted">Total Per MR:</td>
                    {mrNumbers.map(mr => (
                      <td key={`total-${mr}`} className="text-center font-bold font-mono text-primary" style={{ fontSize: '1.1rem' }}>
                        {materials.reduce((sum, item) => sum + ((item.mrQuantities && item.mrQuantities[mr]) || 0), 0)}
                      </td>
                    ))}
                    <td className="text-right font-bold font-mono" style={{ fontSize: '1.2rem' }}>
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
        <div className="form-actions-footer">
          <button type="button" className="btn-outline" onClick={() => navigate(-1)}>Cancel</button>
          <button type="submit" className="btn-primary" disabled={materials.length === 0}>
            <CheckCircle size={18} /> {isEditing ? 'Update Statement' : 'Generate Statement'}
          </button>
        </div>
      </form>

      {/* Edit MR Info Modal */}
      {editingMrInfo && (
        <div className="modal-overlay">
          <div className="modal-card glass-card" style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Edit MR Details</h3>
              <button type="button" className="modal-close" onClick={closeEditMrInfoModal}>
                <X size={20} />
              </button>
            </div>
            
            <div className="modal-body">
              <div className="form-group">
                <label>MR/Lot No.</label>
                <input 
                  type="text" 
                  value={editingMrInfo.newMr} 
                  onChange={(e) => setEditingMrInfo({...editingMrInfo, newMr: e.target.value})}
                  className="form-control"
                />
              </div>
              <div className="form-group">
                <label>PO No.</label>
                <input 
                  type="text" 
                  value={editingMrInfo.newPo} 
                  onChange={(e) => setEditingMrInfo({...editingMrInfo, newPo: e.target.value})}
                  className="form-control"
                />
              </div>
              <div className="form-group">
                <label>Rel No.</label>
                <input 
                  type="text" 
                  value={editingMrInfo.newRel} 
                  onChange={(e) => setEditingMrInfo({...editingMrInfo, newRel: e.target.value})}
                  className="form-control"
                />
              </div>
            </div>

            <div className="modal-footer">
              <button type="button" className="btn-outline" onClick={closeEditMrInfoModal}>
                Cancel
              </button>
              <button type="button" className="btn-primary" onClick={handleSaveMrInfo}>
                Save Details
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MR Specific Material Selection Modal */}
      {activeMrModal && (
        <div className="modal-overlay">
          <div className="modal-card glass-card" style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Enter Quantities for MR: {activeMrModal}</h3>
              <button className="modal-close" onClick={closeMrModal}>
                <X size={20} />
              </button>
            </div>
            
            <div className="modal-body" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Material Description</th>
                    <th className="text-center">Available Balance</th>
                    <th className="text-right">Quantity (Nos)</th>
                  </tr>
                </thead>
                <tbody>
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
                      <tr key={item}>
                        <td className="font-medium">{item}</td>
                        <td className="text-center">
                          <span className={`badge ${remainingBalance > 0 ? 'badge-primary' : ''}`} style={{ 
                            background: remainingBalance > 0 ? '#e6f2ff' : (remainingBalance < 0 ? '#ffe6e6' : '#f8f9fa'),
                            color: remainingBalance > 0 ? '#0066cc' : (remainingBalance < 0 ? '#cc0000' : '#6c757d'),
                            padding: '4px 8px',
                            borderRadius: '12px',
                            fontSize: '0.85em',
                            fontWeight: 'bold'
                          }}>
                            {remainingBalance}
                          </span>
                        </td>
                        <td className="text-right">
                          <input 
                            type="number" 
                            placeholder="0" 
                            className="form-control"
                            style={{ width: '100px', marginLeft: 'auto', textAlign: 'right' }}
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

            <div className="modal-footer">
              <button type="button" className="btn-outline" onClick={closeMrModal}>
                Cancel
              </button>
              <button type="button" className="btn-primary" onClick={saveMrModalSelections}>
                Save MR Data
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
