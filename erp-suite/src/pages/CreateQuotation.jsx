import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Save, Plus, Trash2, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatIndianNumber } from '../utils/numberFormat';
import { getNextQuotationNo, createQuotation, updateQuotation, getPrivateMaterials, getPrivateParties, getHsnCodes } from '../services/api';

export default function CreateQuotation() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isSaving, setIsSaving] = useState(false);
  const [materials, setMaterials] = useState([]);
  const [privateParties, setPrivateParties] = useState([]);
  const [hsnCodes, setHsnCodes] = useState([]);
  const [isPartyDropdownOpen, setIsPartyDropdownOpen] = useState(false);
  const [activeDropdownId, setActiveDropdownId] = useState(null);
  
  const editData = location.state?.editData;
  const enquiryData = location.state?.enquiryData;
  const defaultTerms = "1. Payment: Full payment must be completed immediately upon delivery.\n2. Taxes: As applicable and mentioned in the estimate.\n3. This Proforma Invoice is issued for estimation purposes only and is valid for 15 (Fifteen) days from the date of issue.";

  const [formData, setFormData] = useState(() => {
    if (editData) {
      return {
        ...editData,
        items: (editData.items || []).map((item, index) => ({
          ...item,
          id: item.id || item._id || Date.now() + index
        }))
      };
    }
    return {
      quotationNo: '',
      date: new Date().toISOString().split('T')[0],
      clientName: enquiryData?.name || '',
      companyName: '',
      clientEmail: enquiryData?.email || '',
      clientPhone: enquiryData?.phone || '',
      clientAddress: '',
      clientGST: '',
      documentType: 'Proforma Invoice',
      subject: enquiryData?.subject ? `Quotation for: ${enquiryData.subject}` : '',
      items: [{ id: Date.now(), description: '', hsn: '', quantity: 1, unit: 'Nos', rate: 0, amount: 0 }],
      taxPercentage: 18,
      terms: defaultTerms,
      status: 'Draft'
    };
  });

  useEffect(() => {
    const fetchNextNoAndMaterials = async () => {
      try {
        if (!editData) {
          const { nextNo } = await getNextQuotationNo();
          setFormData(prev => ({ ...prev, quotationNo: nextNo }));
        }
        
        const mats = await getPrivateMaterials();
        const cleanMats = mats.map(m => m.name.trim()).filter(Boolean);
        setMaterials(cleanMats);
      } catch (err) {
        console.error("Failed to fetch next quo no or materials", err);
      }
      
      try {
        const parties = await getPrivateParties();
        setPrivateParties(parties);
      } catch (err) {
        console.error("Failed to fetch private parties", err);
      }
      
      try {
        const hsnList = await getHsnCodes();
        setHsnCodes(hsnList);
      } catch (err) {
        console.error("Failed to fetch HSN codes", err);
      }
    };
    fetchNextNoAndMaterials();
  }, [editData]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      let updatedData = { ...prev, [name]: value };
      
      if (name === 'documentType' && updatedData.terms) {
        const regex = /This (Proforma Invoice|Quotation|Estimate) is issued for (estimation|quotation) purposes only and is valid for 15 \(Fifteen\) days from the date of issue\./g;
        const purpose = value === 'Quotation' ? 'quotation' : 'estimation';
        const replaceStr = `This ${value} is issued for ${purpose} purposes only and is valid for 15 (Fifteen) days from the date of issue.`;
        updatedData.terms = updatedData.terms.replace(regex, replaceStr);
      }
      
      return updatedData;
    });
  };

  const handlePartySelect = (party) => {
    setFormData(prev => ({
      ...prev,
      clientName: party.name,
      clientPhone: party.phone || prev.clientPhone,
      clientEmail: party.email || prev.clientEmail,
      clientAddress: party.address || prev.clientAddress,
      clientGST: party.gst || prev.clientGST
    }));
    setIsPartyDropdownOpen(false);
  };

  const handleItemChange = (id, field, value) => {
    setFormData(prev => {
      const newItems = prev.items.map(item => {
        if (item.id === id) {
          const updatedItem = { ...item, [field]: value };
          if (field === 'description' && value.toUpperCase().includes('STAY CLAMP')) {
            updatedItem.unit = 'Pair';
          }
          if (field === 'quantity' || field === 'rate') {
            updatedItem.amount = Number(updatedItem.quantity || 0) * Number(updatedItem.rate || 0);
          }
          return updatedItem;
        }
        return item;
      });
      return { ...prev, items: newItems };
    });
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { id: Date.now(), description: '', hsn: '', quantity: 1, unit: 'Nos', rate: 0, amount: 0 }]
    }));
  };

  const removeItem = (id) => {
    if (formData.items.length > 1) {
      setFormData(prev => ({
        ...prev,
        items: prev.items.filter(item => item.id !== id)
      }));
    }
  };

  const calculateTotals = () => {
    const subTotal = formData.items.reduce((sum, item) => sum + (item.amount || 0), 0);
    const taxAmount = (subTotal * Number(formData.taxPercentage)) / 100;
    const totalAmount = subTotal + taxAmount;
    return { subTotal, taxAmount, totalAmount };
  };

  const handleSave = async () => {
    if (!formData.clientName && !formData.companyName) {
      alert("Please enter either Client Name or Company Name.");
      return;
    }
    if (formData.items.length === 0) {
      alert("Please add at least one line item.");
      return;
    }

    const { subTotal, taxAmount, totalAmount } = calculateTotals();
    const payload = {
      ...formData,
      items: formData.items.map(({ id, ...rest }) => rest), // Remove temp id
      subTotal,
      taxAmount,
      totalAmount
    };

    try {
      setIsSaving(true);
      // Removed auto-save logic per user request

      if (editData) {
        await updateQuotation(editData._id, payload);
        alert('Quotation updated successfully!');
      } else {
        await createQuotation(payload);
        alert('Quotation saved successfully!');
      }
      navigate('/quotations');
    } catch (error) {
      console.error('Error saving quotation:', error);
      alert('Failed to save quotation.');
    } finally {
      setIsSaving(false);
    }
  };

  const totals = calculateTotals();

  return (
    <div className="form-container">
      <form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
        <div className="form-header glass-panel">
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <button type="button" className="icon-btn-small" onClick={() => navigate(-1)} style={{ background: '#f8f9fa', border: '1px solid #dee2e6', borderRadius: '4px', padding: '6px' }}>
              <ArrowLeft size={18} />
            </button>
          <div>
            <h1>{editData ? 'Edit Quotation' : 'Create New Quotation'}</h1>
            <p>{editData ? 'Modify your existing quotation details' : 'Generate a professional estimate or quotation'}</p>
          </div>
        </div>
          <button type="submit" className="btn-primary" disabled={isSaving}>
            <Save size={18} /> {isSaving ? 'Saving...' : 'Save Quotation'}
          </button>
        </div>

      <div className="form-grid">
        <div className="glass-panel p-4">
          <h3 className="section-title">Document Details</h3>
          <div className="input-group">
            <label>Quotation No</label>
            <input type="text" name="quotationNo" value={formData.quotationNo} onChange={handleInputChange} className="form-control" readOnly style={{ background: '#e9ecef' }} />
          </div>
          <div className="input-group">
            <label>Date <span style={{color:'red'}}>*</span></label>
            <input type="text" placeholder="dd/mm/yyyy" name="date" value={formData.date} onChange={handleInputChange} className="form-control" required />
          </div>
          <div className="input-group">
            <label>Document Type</label>
            <select name="documentType" value={formData.documentType} onChange={handleInputChange} className="form-control">
              <option value="Proforma Invoice">Proforma Invoice</option>
              <option value="Quotation">Quotation</option>
              <option value="Estimate">Estimate</option>
            </select>
          </div>
        </div>

        <div className="glass-panel p-4">
          <h3 className="section-title">Client Details</h3>
          <div className="input-group" style={{ position: 'relative' }}>
            <label>Client / Company Name <span style={{color:'red'}}>*</span></label>
            <input 
              type="text" 
              name="clientName" 
              value={formData.clientName} 
              onChange={handleInputChange} 
              onFocus={() => setIsPartyDropdownOpen(true)}
              onBlur={() => setTimeout(() => setIsPartyDropdownOpen(false), 200)}
              className="form-control" 
              placeholder="M/s ABC Enterprises or Type to search..." 
              required 
              autoComplete="off"
            />
            {isPartyDropdownOpen && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                width: '100%',
                maxHeight: '250px',
                overflowY: 'auto',
                background: 'white',
                border: '1px solid #ccc',
                borderRadius: '4px',
                zIndex: 1000,
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
              }}>
                {privateParties
                  .filter(p => p.name.toLowerCase().includes((formData.clientName || '').toLowerCase()))
                  .map((party) => (
                    <div 
                      key={party._id} 
                      style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid #eee' }}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        handlePartySelect(party);
                      }}
                      onMouseEnter={(e) => e.target.style.background = '#f0f2f5'}
                      onMouseLeave={(e) => e.target.style.background = 'white'}
                    >
                      <div style={{ fontWeight: 'bold' }}>{party.name}</div>
                      {(party.address || party.phone) && (
                        <div style={{ fontSize: '11px', color: '#666' }}>
                          {party.address} {party.phone && `| ${party.phone}`}
                        </div>
                      )}
                    </div>
                ))}
                {privateParties.filter(p => p.name.toLowerCase().includes((formData.clientName || '').toLowerCase())).length === 0 && (
                   <div style={{ padding: '8px 12px', color: '#888', fontStyle: 'italic' }}>
                     No matches found. Enter custom name or add in Master Data.
                   </div>
                )}
              </div>
            )}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <div className="input-group">
              <label>Phone</label>
              <input type="text" name="clientPhone" value={formData.clientPhone} onChange={handleInputChange} className="form-control" />
            </div>
            <div className="input-group">
              <label>Email</label>
              <input type="email" name="clientEmail" value={formData.clientEmail} onChange={handleInputChange} className="form-control" />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '15px' }}>
            <div className="input-group">
              <label>Address <span style={{color:'red'}}>*</span></label>
              <input type="text" name="clientAddress" value={formData.clientAddress} onChange={handleInputChange} className="form-control" required />
            </div>
            <div className="input-group">
              <label>GST No (Optional)</label>
              <input type="text" name="clientGST" value={formData.clientGST} onChange={handleInputChange} className="form-control" placeholder="24XXXX..." />
            </div>
          </div>
        </div>
      </div>

      <div className="glass-panel p-4 mt-4">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
          <h3 className="section-title" style={{ margin: 0 }}>Line Items <span style={{color:'red', fontSize:'14px'}}>*</span></h3>
          <button type="button" className="btn-outline-small" onClick={addItem}>
            <Plus size={16} /> Add Item
          </button>
        </div>
        
        <table className="items-table">
          <thead>
            <tr>
              <th style={{ width: '32%' }}>Description</th>
              <th style={{ width: '10%' }}>HSN</th>
              <th style={{ width: '10%' }}>Qty</th>
              <th style={{ width: '10%' }}>Unit</th>
              <th style={{ width: '15%' }}>Rate (₹)</th>
              <th style={{ width: '15%' }}>Amount (₹)</th>
              <th style={{ width: '8%' }}></th>
            </tr>
          </thead>
          <tbody>
            {formData.items.map((item) => (
              <tr key={item.id}>
                <td style={{ position: 'relative' }}>
                  <input 
                    type="text"
                    value={item.description}
                    onChange={(e) => handleItemChange(item.id, 'description', e.target.value)}
                    onFocus={() => setActiveDropdownId(item.id)}
                    onBlur={() => setTimeout(() => setActiveDropdownId(null), 200)}
                    className="form-control"
                    placeholder="Select or type material..."
                    required
                  />
                  {activeDropdownId === item.id && (
                    <div style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      width: '100%',
                      maxHeight: '200px',
                      overflowY: 'auto',
                      background: 'white',
                      border: '1px solid #ccc',
                      borderRadius: '4px',
                      zIndex: 1000,
                      boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                    }}>
                      {materials
                        .filter(m => m.toLowerCase().includes((item.description || '').toLowerCase()))
                        .map((mat, idx) => (
                          <div 
                            key={idx} 
                            style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid #eee' }}
                            onMouseDown={(e) => {
                              e.preventDefault(); // Prevent onBlur from firing before click
                              handleItemChange(item.id, 'description', mat);
                              setActiveDropdownId(null);
                            }}
                            onMouseEnter={(e) => e.target.style.background = '#f0f2f5'}
                            onMouseLeave={(e) => e.target.style.background = 'white'}
                          >
                            {mat}
                          </div>
                      ))}
                      {materials.filter(m => m.toLowerCase().includes((item.description || '').toLowerCase())).length === 0 && (
                         <div style={{ padding: '8px 12px', color: '#888', fontStyle: 'italic' }}>Type custom material...</div>
                      )}
                    </div>
                  )}
                </td>
                <td>
                  <input type="text" value={item.hsn || ''} onChange={(e) => handleItemChange(item.id, 'hsn', e.target.value)} className="form-control text-center" placeholder="HSN" list="hsn-list" />
                </td>
                <td>
                  <input type="number" value={item.quantity} onChange={(e) => handleItemChange(item.id, 'quantity', e.target.value)} className="form-control text-right" min="1" />
                </td>
                <td>
                  <input type="text" value={item.unit} onChange={(e) => handleItemChange(item.id, 'unit', e.target.value)} className="form-control text-center" />
                </td>
                <td>
                  <input type="number" value={item.rate} onChange={(e) => handleItemChange(item.id, 'rate', e.target.value)} className="form-control text-right" min="0" step="0.01" />
                </td>
                <td>
                  <input type="text" value={formatIndianNumber(item.amount)} className="form-control text-right" readOnly style={{ background: '#f8f9fa', fontWeight: 'bold' }} />
                </td>
                <td className="text-center">
                  <button type="button" className="icon-btn-small" onClick={() => removeItem(item.id)} style={{ color: '#dc3545', border: 'none', background: 'transparent', cursor: 'pointer' }}>
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        <datalist id="hsn-list">
          {hsnCodes.map(h => <option key={h} value={h} />)}
        </datalist>

        <div className="totals-section">
          <div className="terms-container">
            <h4 style={{ marginBottom: '8px', fontSize: '14px', color: '#495057' }}>Terms & Conditions</h4>
            <textarea 
              name="terms" 
              value={formData.terms} 
              onChange={handleInputChange} 
              className="form-control" 
              rows="5"
            />
          </div>
          
          <div className="calculation-container">
            <div className="calc-row">
              <span>Sub Total:</span>
              <span>₹{formatIndianNumber(totals.subTotal)}</span>
            </div>
            <div className="calc-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                GST Slab:
                <select 
                  name="taxPercentage" 
                  value={formData.taxPercentage} 
                  onChange={handleInputChange} 
                  className="form-control" 
                  style={{ width: '130px', padding: '4px' }}
                >
                  <option value="0">0% (No GST)</option>
                  <option value="5">5% (2.5% + 2.5%)</option>
                  <option value="12">12% (6% + 6%)</option>
                  <option value="18">18% (9% + 9%)</option>
                  <option value="28">28% (14% + 14%)</option>
                </select>
              </span>
            </div>
            {formData.taxPercentage > 0 && (
              <>
                <div className="calc-row" style={{ color: '#6c757d', fontSize: '13px' }}>
                  <span>CGST ({formData.taxPercentage / 2}%):</span>
                  <span>₹{formatIndianNumber(totals.taxAmount / 2)}</span>
                </div>
                <div className="calc-row" style={{ color: '#6c757d', fontSize: '13px' }}>
                  <span>SGST ({formData.taxPercentage / 2}%):</span>
                  <span>₹{formatIndianNumber(totals.taxAmount / 2)}</span>
                </div>
              </>
            )}
            <div className="calc-row grand-total">
              <span>Grand Total:</span>
              <span>₹{formatIndianNumber(totals.totalAmount)}</span>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .form-container { padding: 24px; max-width: 1400px; margin: 0 auto; }
        .form-header { display: flex; justify-content: space-between; align-items: center; padding: 24px; margin-bottom: 24px; }
        .form-header h1 { font-size: 24px; font-weight: 700; color: #1b2e4b; margin: 0 0 4px 0; }
        .form-header p { color: #6c757d; font-size: 14px; margin: 0; }
        .form-grid { display: grid; grid-template-columns: 1fr 2fr; gap: 24px; }
        .section-title { font-size: 16px; font-weight: 600; color: #1b2e4b; border-bottom: 1px solid #dee2e6; padding-bottom: 10px; margin-bottom: 15px; }
        .p-4 { padding: 24px; }
        .mt-4 { margin-top: 24px; }
        .items-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        .items-table th { background: #f8f9fa; padding: 10px; text-align: left; font-size: 13px; color: #495057; border: 1px solid #dee2e6; }
        .items-table td { padding: 10px; border: 1px solid #dee2e6; vertical-align: top; }
        .text-right { text-align: right; }
        .text-center { text-align: center; }
        .totals-section { display: flex; gap: 40px; margin-top: 30px; }
        .terms-container { flex: 2; }
        .calculation-container { flex: 1; background: #f8f9fa; padding: 20px; border-radius: 8px; border: 1px solid #dee2e6; display: flex; flexDirection: column; gap: 12px; }
        .calc-row { display: flex; justify-content: space-between; font-size: 15px; color: #495057; }
        .grand-total { font-weight: 700; font-size: 18px; color: #1b2e4b; border-top: 2px solid #dee2e6; padding-top: 12px; margin-top: 12px; }
      `}</style>
      </form>
    </div>
  );
}
