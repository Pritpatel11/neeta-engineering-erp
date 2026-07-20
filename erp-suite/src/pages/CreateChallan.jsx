import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Info, Building, Truck, Package, 
  Plus, Trash2, CheckCircle, X
} from 'lucide-react';
import { createChallan, createStatement, getMaterials, getDivisions, getContractors, getInventoryBalances, getSubDivisions } from '../services/api';
import toast from 'react-hot-toast';
import { handleFormKeyboardNav } from '../utils/keyboardNav';
import './CreateChallan.css';

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
    <div className="challan-container">
      <header className="challan-header">
        <div>
          <h1 className="dashboard-title">Create New Delivery Challan</h1>
          <p className="dashboard-subtitle">Generate a dispatch document for finished materials.</p>
        </div>
      </header>

      <form className="challan-form" onSubmit={handleGenerateChallan} onKeyDown={handleFormKeyboardNav}>
        {/* General Information */}
        <section className="form-section glass-card">
          <h2 className="section-title">
            <Info className="text-primary" size={20} />
            General Information
          </h2>
          <div className="form-grid-3">
            <div className="form-group">
              <label>Division</label>
              <select 
                name="divisionName" 
                className="form-control" 
                value={selectedDivision} 
                onChange={(e) => setSelectedDivision(e.target.value)} 
                required
              >
                <option value="" disabled>Select Division</option>
                {divisionsList.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Contractor Name</label>
              <input 
                type="text" 
                name="contractorName" 
                placeholder="Enter Contractor Name" 
                className="form-control" 
                list="challan-contractors-list"
                required 
              />
              <datalist id="challan-contractors-list">
                {contractorsList.map(c => <option key={c} value={c} />)}
              </datalist>
            </div>
            <div className="form-group">
              <label>Gate Pass No.</label>
              <input type="text" name="gatePassNo" placeholder="Enter gate pass number" className="form-control" required />
            </div>
            <div className="form-group">
              <label>Gate Pass Date</label>
              <input type="text" name="gatePassDate" placeholder="dd/mm/yyyy" className="form-control" required />
            </div>
            <div className="form-group">
              <label>Challan No.</label>
              <input type="number" name="challanNo" defaultValue={getNextChallanNo()} className="form-control" required />
            </div>
            <div className="form-group">
              <label>Date</label>
              <input type="text" name="date" placeholder="dd/mm/yyyy" className="form-control" required />
            </div>
          </div>
        </section>

        {/* Administrative Details */}
        <section className="form-section glass-card">
          <h2 className="section-title">
            <Building className="text-primary" size={20} />
            Administrative Details
          </h2>
          <div className="form-grid-2">
            <div className="form-group">
              <label>Sub-Division Name</label>
              <input type="text" name="subDivisionName" placeholder="Enter Sub-Division" className="form-control" list="subdivisions-list" required />
              <datalist id="subdivisions-list">
                {subDivisionsList.map(s => <option key={s} value={s} />)}
              </datalist>
            </div>
          </div>
        </section>

        {/* Transport Details */}
        <section className="form-section glass-card">
          <h2 className="section-title">
            <Truck className="text-primary" size={20} />
            Transport Details
          </h2>
          <div className="form-grid-2">
            <div className="form-group">
              <label>Vehicle Number</label>
              <input 
                type="text" 
                name="vehicleNumber" 
                placeholder="e.g. GJ 01 AB 1234" 
                className="form-control" 
                pattern="^[A-Za-z]{2}[ \-]?[0-9]{1,2}[ \-]?[A-Za-z]{1,2}[ \-]?[0-9]{4}$"
                title="Format: XX 00 XX 0000 (e.g. GJ 01 AB 1234)"
                required 
              />
            </div>
            <div className="form-group">
              <label>Driver's Name</label>
              <input type="text" name="driverName" placeholder="Enter driver's name" className="form-control" required />
            </div>
          </div>
        </section>

        {/* Material Selection */}
        <section className="form-section glass-card">
          <div className="section-header-flex">
            <h2 className="section-title mb-0 border-0">
              <Package className="text-primary" size={20} />
              Material Selection
            </h2>
            <button type="button" className="btn-outline-small" onClick={handleOpenModal}>
              <Plus size={16} /> Add Item
            </button>
          </div>
          <div className="table-responsive mt-4">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Material Name</th>
                  <th>Unit</th>
                  <th className="text-right">Qty Dispatched</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {materials.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="text-center text-muted" style={{ padding: '32px' }}>
                      No items added yet. Click "Add Item" to select materials.
                    </td>
                  </tr>
                ) : (
                  materials.map((item) => (
                    <tr key={item.id} className="group">
                      <td className="font-medium">{item.name}</td>
                      <td className="text-muted">{item.unit}</td>
                      <td className="text-right">
                        <input 
                          type="number" 
                          value={item.qty} 
                          onChange={(e) => handleQtyChange(item.id, e.target.value)}
                          className="form-control-minimal text-right font-mono" 
                          min="1"
                        />
                        {item.qty > getAvailableBalance(item.name) && (
                          <div className="text-error" style={{ fontSize: '11px', marginTop: '4px', fontWeight: '500' }}>
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
            </table>
          </div>
        </section>

        {/* Footer Actions */}
        <div className="form-actions-footer">
          <button type="button" className="btn-outline" onClick={() => navigate(-1)}>Cancel</button>
          <button type="submit" className="btn-primary" disabled={materials.length === 0}>
            <CheckCircle size={18} /> Generate Challan
          </button>
        </div>
      </form>

      {/* Material Selection Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-card glass-card">
            <div className="modal-header">
              <h3 className="modal-title">Select Materials</h3>
              <button className="modal-close" onClick={handleCloseModal}>
                <X size={20} />
              </button>
            </div>
            
            <div className="modal-body">
              <div className="modal-list">
                {materialsList.map((item) => (
                  <div key={item} className="modal-list-item">
                    <span className="modal-item-name">{item}</span>
                    <input 
                      type="number" 
                      placeholder="Qty" 
                      className="form-control modal-qty-input"
                      value={modalSelections[item] === undefined ? '' : modalSelections[item]}
                      onChange={(e) => handleModalQtyChange(item, e.target.value)}
                      min="0"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="modal-footer">
              <button type="button" className="btn-outline" onClick={handleCloseModal}>
                Cancel
              </button>
              <button type="button" className="btn-primary" onClick={handleAddSelected}>
                Add Selected
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Status Selection Modal */}
      {isStatusModalOpen && (
        <div className="modal-overlay">
          <div className="modal-card glass-card" style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Select Challan Status</h3>
              <button type="button" className="modal-close" onClick={() => setIsStatusModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            
            <div className="modal-body text-center">
              <p style={{ marginBottom: '24px', color: 'var(--color-on-surface-variant)' }}>
                Is this material already dispatched or currently pending dispatch?
              </p>
              <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
                <button 
                  type="button" 
                  className="btn-outline" 
                  style={{ borderColor: 'var(--color-tertiary)', color: 'var(--color-tertiary)' }}
                  onClick={() => confirmGenerateChallan('Pending')}
                >
                  Mark as Pending
                </button>
                <button 
                  type="button" 
                  className="btn-primary" 
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
        <div className="modal-overlay">
          <div className="modal-card glass-card" style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Store in Statement?</h3>
            </div>
            
            <div className="modal-body text-center">
              <p style={{ marginBottom: '24px', color: 'var(--color-on-surface-variant)' }}>
                Challan created successfully! Do you also want to store this in the Contractor Statement Register?
              </p>
              <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
                <button 
                  type="button" 
                  className="btn-outline" 
                  onClick={() => navigate('/challan-preview', { state: { challanData: recentlyCreatedChallan } })}
                >
                  No, Skip
                </button>
                <button 
                  type="button" 
                  className="btn-primary" 
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
