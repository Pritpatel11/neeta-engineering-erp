import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createStoreReceipt, getMaterials, getDivisions, getContractors } from '../services/api';
import { Save, ArrowLeft, PackagePlus } from 'lucide-react';
import toast from 'react-hot-toast';
import { handleFormKeyboardNav } from '../utils/keyboardNav';
import './CreateChallan.css';

export default function CreateCR() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [materials, setMaterials] = useState([]);
  const [divisions, setDivisions] = useState([]);
  const [contractors, setContractors] = useState([]);
  
  const [formData, setFormData] = useState({
    releaseNo: '',
    receiptNo: '',
    conName: '',
    oNo: '',
    poNo: '',
    divisionName: '',
  });

  const [quantities, setQuantities] = useState({});

  useEffect(() => {
    const fetchMasterData = async () => {
      try {
        const [mats, divs, conts] = await Promise.all([
          getMaterials(),
          getDivisions(),
          getContractors()
        ]);
        
        const matNames = mats.map(m => m.name);
        setMaterials(matNames);
        setDivisions(divs.map(d => d.name));
        setContractors(conts.map(c => c.name));
        
        if (divs.length > 0) setFormData(prev => ({ ...prev, divisionName: divs[0].name }));
        
        const initialQty = {};
        matNames.forEach(mat => { initialQty[mat] = ''; });
        setQuantities(initialQty);
      } catch (error) {
        console.error("Failed to load master data", error);
      }
    };
    fetchMasterData();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleQtyChange = (material, value) => {
    setQuantities(prev => ({
      ...prev,
      [material]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Filter out materials with 0 or empty quantity
      const receivedMaterials = Object.keys(quantities)
        .filter(name => quantities[name] !== '' && Number(quantities[name]) > 0)
        .map(name => ({
          name,
          qty: Number(quantities[name])
        }));

      if (receivedMaterials.length === 0) {
        toast.error("Please enter at least one material quantity to save.");
        setIsSubmitting(false);
        return;
      }

      const submissionData = {
        ...formData,
        materials: receivedMaterials
      };

      await createStoreReceipt(submissionData);

      toast.success('Material Inward (CR) Saved Successfully! Inventory Balance Updated.');
      navigate('/cr-register');
    } catch (error) {
      console.error('Submission error:', error);
      toast.error(error.response?.data?.error || 'Failed to save CR');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="page-container" style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#111827', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <PackagePlus size={24} color="#6f42c1" />
            Material Inward (CR Entry)
          </h1>
          <p style={{ color: '#6b7280', margin: '4px 0 0 0' }}>Enter received goods to automatically add to Division Inventory Balance.</p>
        </div>
        <button
          onClick={() => navigate('/cr-register')}
          className="btn-outline"
        >
          <ArrowLeft size={16} /> Back to Register
        </button>
      </div>

      <div className="glass-card" style={{ background: '#fff', border: '1px solid #e1e6f1', borderRadius: '8px', padding: '24px' }}>
        <form onSubmit={handleSubmit} onKeyDown={handleFormKeyboardNav}>
          {/* Header Details */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '32px' }}>
            <div className="form-group">
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#4b5563', marginBottom: '8px' }}>Release No.</label>
              <input
                type="text"
                name="releaseNo"
                value={formData.releaseNo}
                onChange={handleInputChange}
                placeholder="Enter Release No."
                style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px' }}
              />
            </div>

            <div className="form-group">
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#4b5563', marginBottom: '8px' }}>Receipt No. *</label>
              <input
                type="text"
                name="receiptNo"
                value={formData.receiptNo}
                onChange={handleInputChange}
                required
                placeholder="Enter Receipt No."
                style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px' }}
              />
            </div>

            <div className="form-group">
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#4b5563', marginBottom: '8px' }}>CON. NAME</label>
              <input
                type="text"
                name="conName"
                value={formData.conName}
                onChange={handleInputChange}
                placeholder="Enter Contractor Name"
                style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px' }}
                list="cr-contractors-list"
              />
              <datalist id="cr-contractors-list">
                {contractors.map(c => <option key={c} value={c} />)}
              </datalist>
            </div>

            <div className="form-group">
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#4b5563', marginBottom: '8px' }}>O.No</label>
              <input
                type="text"
                name="oNo"
                value={formData.oNo}
                onChange={handleInputChange}
                placeholder="Enter O.No"
                style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px' }}
              />
            </div>

            <div className="form-group">
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#4b5563', marginBottom: '8px' }}>P.O.No.</label>
              <input
                type="text"
                name="poNo"
                value={formData.poNo}
                onChange={handleInputChange}
                placeholder="Enter P.O.No."
                style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px' }}
              />
            </div>

            <div className="form-group">
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#4b5563', marginBottom: '8px' }}>Division Name *</label>
              <select
                name="divisionName"
                value={formData.divisionName}
                onChange={handleInputChange}
                required
                style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px', background: '#f9fafb' }}
              >
                {divisions.map(div => (
                  <option key={div} value={div}>{div}</option>
                ))}
              </select>
            </div>
          </div>

          <hr style={{ borderColor: '#e5e7eb', margin: '0 0 24px 0' }} />

          {/* Materials Grid */}
          <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '16px', color: '#111827' }}>Received Materials</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px', marginBottom: '32px' }}>
            {materials.map((material, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8f9fa', padding: '10px 16px', border: '1px solid #e5e7eb', borderRadius: '6px' }}>
                <label style={{ fontSize: '13px', fontWeight: 500, color: '#374151', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={material}>
                  {material.split(' ').slice(1).join(' ')}
                </label>
                <input
                  type="number"
                  min="0"
                  value={quantities[material]}
                  onChange={(e) => handleQtyChange(material, e.target.value)}
                  placeholder="0"
                  style={{ width: '80px', padding: '6px 8px', border: '1px solid #d1d5db', borderRadius: '4px', textAlign: 'right' }}
                />
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              type="submit"
              disabled={isSubmitting}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#6f42c1', color: '#white', padding: '12px 24px', borderRadius: '6px', border: 'none', fontWeight: 'bold', cursor: isSubmitting ? 'not-allowed' : 'pointer', color: 'white' }}
            >
              <Save size={18} />
              {isSubmitting ? 'Saving...' : 'Save Material Inward'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
