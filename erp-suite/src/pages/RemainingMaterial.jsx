import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Info, Package, 
  Plus, Trash2, CheckCircle, X, AlertTriangle
} from 'lucide-react';
import { createRemainingMaterial, updateRemainingMaterial, getChallans, getMaterials } from '../services/api';
import './CreateChallan.css';

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
    <div className="challan-container">
      <header className="challan-header">
        <div>
          <h1 className="dashboard-title">{isEditing ? 'Edit Pending Material' : 'Record Pending Material'}</h1>
          <p className="dashboard-subtitle">Document items that are pending or short-shipped.</p>
        </div>
      </header>

      <form className="challan-form" onSubmit={handleSave}>
        {/* General Information */}
        <section className="form-section glass-card">
          <h2 className="section-title">
            <Info className="text-primary" size={20} />
            Original Reference
          </h2>
          <div className="form-grid-2">
            <div className="form-group">
              <label>Original Challan No.</label>
              <input 
                type="number" 
                name="originalChallanNo" 
                defaultValue={existingRecord ? existingRecord.originalChallanNo : ''}
                placeholder="Enter Challan No." 
                className="form-control" 
                onBlur={handleChallanBlur}
                required 
              />
              <small className="text-muted" style={{ display: 'block', marginTop: '4px', fontSize: '12px' }}>
                Type Challan No. to auto-fill contractor & division
              </small>
            </div>
            <div className="form-group">
              <label>Contractor Name</label>
              <input 
                type="text" 
                name="contractorName" 
                value={contractorName}
                onChange={(e) => setContractorName(e.target.value)}
                placeholder="Auto-filled contractor name" 
                className="form-control" 
                required 
                readOnly
                style={{ background: 'var(--color-surface)' }}
              />
            </div>
            <div className="form-group">
              <label>Division Name</label>
              <input 
                type="text" 
                name="divisionName" 
                value={divisionName}
                onChange={(e) => setDivisionName(e.target.value)}
                placeholder="Auto-filled division name" 
                className="form-control" 
                readOnly
                style={{ background: 'var(--color-surface)' }}
              />
            </div>
            <div className="form-group">
              <label>Date of Leftover</label>
              <input type="date" name="date" className="form-control" required defaultValue={existingRecord ? existingRecord.date : new Date().toISOString().split('T')[0]} />
            </div>
          </div>
        </section>

        {/* Material Selection */}
        <section className="form-section glass-card">
          <div className="section-header-flex">
            <h2 className="section-title mb-0 border-0">
              <AlertTriangle className="text-tertiary" size={20} />
              Pending Materials
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
                  <th className="text-right">Qty Left Behind</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {materials.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="text-center text-muted" style={{ padding: '32px' }}>
                      No items added yet. Click "Add Item" to specify which materials were left behind.
                    </td>
                  </tr>
                ) : (
                  materials.map((item, index) => (
                    <tr key={item.id || item.name || index} className="group">
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
            <CheckCircle size={18} /> {isEditing ? 'Update Record' : 'Save Record'}
          </button>
        </div>
      </form>

      {/* Material Selection Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-card glass-card">
            <div className="modal-header">
              <h3 className="modal-title">Select Pending Materials</h3>
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
              <button className="btn-outline" onClick={handleCloseModal}>Cancel</button>
              <button className="btn-primary" onClick={handleAddSelected}>Add Selected</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
