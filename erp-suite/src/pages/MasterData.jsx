import { 
  getMaterials, addMaterial, deleteMaterial, updateMaterial,
  getPrivateMaterials, addPrivateMaterial, deletePrivateMaterial, updatePrivateMaterial,
  getDivisions, addDivision, deleteDivision, updateDivision,
  getContractors, addContractor, deleteContractor, updateContractor,
  getInvoiceDivisions, addInvoiceDivision, deleteInvoiceDivision, updateInvoiceDivision,
  getReceiptParties, addReceiptParty, deleteReceiptParty, updateReceiptParty,
  getFinancialYears, addFinancialYear, deleteFinancialYear, updateFinancialYear,
  getPrivateParties, addPrivateParty, deletePrivateParty, updatePrivateParty,
  seedMasterData 
} from '../services/api';
import { Settings, Plus, Trash2, HardDrive, RefreshCw, Edit, X, Save } from 'lucide-react';
import './CreateChallan.css';
import { useEffect, useState } from 'react';

export default function MasterData() {
  const [activeTab, setActiveTab] = useState('materials');
  const [materials, setMaterials] = useState([]);
  const [privateMaterials, setPrivateMaterials] = useState([]);
  const [divisions, setDivisions] = useState([]);
  const [invoiceDivisions, setInvoiceDivisions] = useState([]);
  const [contractors, setContractors] = useState([]);
  const [receiptParties, setReceiptParties] = useState([]);
  const [financialYears, setFinancialYears] = useState([]);
  const [privateParties, setPrivateParties] = useState([]);
  
  // Single input for simple master data
  const [newItemName, setNewItemName] = useState('');
  
  // Complex form for Private Party
  const [newPrivateParty, setNewPrivateParty] = useState({
    name: '', phone: '', email: '', address: '', gst: ''
  });
  
  const [editingItem, setEditingItem] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [mats, pmats, divs, invDivs, conts, rParties, fYears, pParties] = await Promise.all([
        getMaterials(),
        getPrivateMaterials(),
        getDivisions(),
        getInvoiceDivisions(),
        getContractors(),
        getReceiptParties(),
        getFinancialYears(),
        getPrivateParties()
      ]);
      setMaterials(mats);
      setPrivateMaterials(pmats);
      setDivisions(divs);
      setInvoiceDivisions(invDivs);
      setContractors(conts);
      setReceiptParties(rParties);
      setFinancialYears(fYears);
      setPrivateParties(pParties);
    } catch (error) {
      console.error('Failed to fetch master data:', error);
    }
  };

  // Clear edit state when changing tabs
  useEffect(() => {
    cancelEdit();
  }, [activeTab]);

  const cancelEdit = () => {
    setEditingItem(null);
    setNewItemName('');
    setNewPrivateParty({ name: '', phone: '', email: '', address: '', gst: '' });
  };

  const handleEditItem = (item) => {
    setEditingItem({ id: item._id });
    if (activeTab === 'private-parties') {
      setNewPrivateParty({
        name: item.name || '',
        phone: item.phone || '',
        email: item.email || '',
        address: item.address || '',
        gst: item.gst || ''
      });
    } else {
      setNewItemName(item.name || item.year || '');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSeed = async () => {
    if (window.confirm("This will auto-fill the database with default materials and divisions if they are currently empty. Continue?")) {
      setLoading(true);
      try {
        await seedMasterData();
        await fetchData();
        alert('Database seeded successfully!');
      } catch (error) {
        alert('Failed to seed database.');
      }
      setLoading(false);
    }
  };

  const handleAddOrUpdatePrivateParty = async (e) => {
    e.preventDefault();
    if (!newPrivateParty.name.trim()) return;
    try {
      if (editingItem) {
        await updatePrivateParty(editingItem.id, newPrivateParty);
      } else {
        await addPrivateParty(newPrivateParty);
      }
      setNewPrivateParty({ name: '', phone: '', email: '', address: '', gst: '' });
      setEditingItem(null);
      fetchData();
    } catch (error) {
      alert(`Failed to ${editingItem ? 'update' : 'add'} Private Party.`);
    }
  };

  const handleAddOrUpdateItem = async (e) => {
    e.preventDefault();
    if (!newItemName.trim()) return;

    try {
      if (editingItem) {
        const payload = activeTab === 'financial-years' ? { year: newItemName } : { name: newItemName };
        if (activeTab === 'materials') await updateMaterial(editingItem.id, payload);
        else if (activeTab === 'private-materials') await updatePrivateMaterial(editingItem.id, payload);
        else if (activeTab === 'divisions') await updateDivision(editingItem.id, payload);
        else if (activeTab === 'invoice-divisions') await updateInvoiceDivision(editingItem.id, payload);
        else if (activeTab === 'contractors') await updateContractor(editingItem.id, payload);
        else if (activeTab === 'receipt-parties') await updateReceiptParty(editingItem.id, payload);
        else if (activeTab === 'financial-years') await updateFinancialYear(editingItem.id, payload);
      } else {
        if (activeTab === 'materials') await addMaterial({ name: newItemName });
        else if (activeTab === 'private-materials') await addPrivateMaterial({ name: newItemName });
        else if (activeTab === 'divisions') await addDivision({ name: newItemName });
        else if (activeTab === 'invoice-divisions') await addInvoiceDivision({ name: newItemName });
        else if (activeTab === 'contractors') await addContractor({ name: newItemName });
        else if (activeTab === 'receipt-parties') await addReceiptParty({ name: newItemName });
        else if (activeTab === 'financial-years') await addFinancialYear({ year: newItemName });
      }
      setNewItemName('');
      setEditingItem(null);
      fetchData();
    } catch (error) {
      alert(`Failed to ${editingItem ? 'update' : 'add'} ${activeTab.replace('-', ' ')}.`);
    }
  };

  const handleDeleteItem = async (id) => {
    if (!window.confirm(`Are you sure you want to delete this ${activeTab.replace('-', ' ')}? This could affect past records if they use this name.`)) return;
    
    try {
      if (activeTab === 'materials') {
        await deleteMaterial(id);
      } else if (activeTab === 'private-materials') {
        await deletePrivateMaterial(id);
      } else if (activeTab === 'divisions') {
        await deleteDivision(id);
      } else if (activeTab === 'invoice-divisions') {
        await deleteInvoiceDivision(id);
      } else if (activeTab === 'contractors') {
        await deleteContractor(id);
      } else if (activeTab === 'receipt-parties') {
        await deleteReceiptParty(id);
      } else if (activeTab === 'financial-years') {
        await deleteFinancialYear(id);
      } else if (activeTab === 'private-parties') {
        await deletePrivateParty(id);
      }
      fetchData();
    } catch (error) {
      alert(`Failed to delete ${activeTab.replace('-', ' ')}.`);
    }
  };

  const getActiveList = () => {
    if (activeTab === 'materials') return materials;
    if (activeTab === 'private-materials') return privateMaterials;
    if (activeTab === 'divisions') return divisions;
    if (activeTab === 'invoice-divisions') return invoiceDivisions;
    if (activeTab === 'contractors') return contractors;
    if (activeTab === 'receipt-parties') return receiptParties;
    if (activeTab === 'financial-years') return financialYears;
    if (activeTab === 'private-parties') return privateParties;
    return [];
  };

  return (
    <div className="dashboard-container">
      <header className="dashboard-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="dashboard-title"><Settings size={28} /> Settings & Master Data</h1>
          <p className="dashboard-subtitle">Manage dropdown lists for Materials, Divisions, and Contractors across the ERP.</p>
        </div>
        <button onClick={handleSeed} className="btn-outline" disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <RefreshCw size={16} className={loading ? 'spin' : ''} /> Auto-Fill Default Data
        </button>
      </header>

      <div style={{ display: 'flex', gap: '20px', marginTop: '20px' }}>
        {/* Sidebar Tabs */}
        <div className="glass-card" style={{ width: '250px', padding: '20px', height: 'fit-content' }}>
          <h3 style={{ marginBottom: '15px', color: '#666', fontSize: '14px', textTransform: 'uppercase' }}>Data Categories</h3>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <li>
              <button 
                onClick={() => setActiveTab('materials')}
                style={{ width: '100%', textAlign: 'left', padding: '10px 15px', background: activeTab === 'materials' ? '#e9ecef' : 'transparent', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: activeTab === 'materials' ? 'bold' : 'normal', color: activeTab === 'materials' ? '#0056b3' : '#333' }}
              >
                📦 Govt Materials
              </button>
            </li>
            <li>
              <button 
                onClick={() => setActiveTab('private-materials')}
                style={{ width: '100%', textAlign: 'left', padding: '10px 15px', background: activeTab === 'private-materials' ? '#e9ecef' : 'transparent', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: activeTab === 'private-materials' ? 'bold' : 'normal', color: activeTab === 'private-materials' ? '#0056b3' : '#333' }}
              >
                🛍️ Private Materials
              </button>
            </li>
            <li>
              <button 
                onClick={() => setActiveTab('divisions')}
                style={{ width: '100%', textAlign: 'left', padding: '10px 15px', background: activeTab === 'divisions' ? '#e9ecef' : 'transparent', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: activeTab === 'divisions' ? 'bold' : 'normal', color: activeTab === 'divisions' ? '#0056b3' : '#333' }}
              >
                🏢 Divisions
              </button>
            </li>
            <li>
              <button 
                onClick={() => setActiveTab('invoice-divisions')}
                style={{ width: '100%', textAlign: 'left', padding: '10px 15px', background: activeTab === 'invoice-divisions' ? '#e9ecef' : 'transparent', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: activeTab === 'invoice-divisions' ? 'bold' : 'normal', color: activeTab === 'invoice-divisions' ? '#0056b3' : '#333' }}
              >
                🧾 Invoice Divisions
              </button>
            </li>
            <li>
              <button 
                onClick={() => setActiveTab('contractors')}
                style={{ width: '100%', textAlign: 'left', padding: '10px 15px', background: activeTab === 'contractors' ? '#e9ecef' : 'transparent', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: activeTab === 'contractors' ? 'bold' : 'normal', color: activeTab === 'contractors' ? '#0056b3' : '#333' }}
              >
                👷 Contractors
              </button>
            </li>
            <li>
              <button 
                onClick={() => setActiveTab('receipt-parties')}
                style={{ width: '100%', textAlign: 'left', padding: '10px 15px', background: activeTab === 'receipt-parties' ? '#e9ecef' : 'transparent', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: activeTab === 'receipt-parties' ? 'bold' : 'normal', color: activeTab === 'receipt-parties' ? '#0056b3' : '#333' }}
              >
                🏛️ Receipt Parties
              </button>
            </li>
            <li>
              <button 
                onClick={() => setActiveTab('financial-years')}
                style={{ width: '100%', textAlign: 'left', padding: '10px 15px', background: activeTab === 'financial-years' ? '#e9ecef' : 'transparent', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: activeTab === 'financial-years' ? 'bold' : 'normal', color: activeTab === 'financial-years' ? '#0056b3' : '#333' }}
              >
                📅 Financial Years
              </button>
            </li>
            <li>
              <button 
                onClick={() => setActiveTab('private-parties')}
                style={{ width: '100%', textAlign: 'left', padding: '10px 15px', background: activeTab === 'private-parties' ? '#e9ecef' : 'transparent', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: activeTab === 'private-parties' ? 'bold' : 'normal', color: activeTab === 'private-parties' ? '#0056b3' : '#333' }}
              >
                🤝 Private Parties
              </button>
            </li>
          </ul>
        </div>

        {/* Content Area */}
        <div className="glass-card" style={{ flex: 1, padding: '30px' }}>
          <h2 style={{ fontSize: '20px', marginBottom: '20px', textTransform: 'capitalize', color: '#333', borderBottom: '2px solid #eee', paddingBottom: '10px' }}>
            Manage {activeTab.replace('-', ' ')}
          </h2>

          {activeTab === 'private-parties' ? (
            <form onSubmit={handleAddOrUpdatePrivateParty} style={{ background: '#f8f9fa', padding: '20px', borderRadius: '8px', border: '1px solid #dee2e6', marginBottom: '30px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '5px', color: '#495057' }}>Name *</label>
                  <input type="text" className="form-control" placeholder="Company Name" required value={newPrivateParty.name} onChange={e => setNewPrivateParty({...newPrivateParty, name: e.target.value})} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '5px', color: '#495057' }}>Phone</label>
                  <input type="text" className="form-control" placeholder="Phone Number" value={newPrivateParty.phone} onChange={e => setNewPrivateParty({...newPrivateParty, phone: e.target.value})} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '5px', color: '#495057' }}>Email</label>
                  <input type="email" className="form-control" placeholder="Email Address" value={newPrivateParty.email} onChange={e => setNewPrivateParty({...newPrivateParty, email: e.target.value})} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '5px', color: '#495057' }}>GST No</label>
                  <input type="text" className="form-control" placeholder="GST Number" value={newPrivateParty.gst} onChange={e => setNewPrivateParty({...newPrivateParty, gst: e.target.value})} />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '5px', color: '#495057' }}>Address</label>
                  <input type="text" className="form-control" placeholder="Full Address" value={newPrivateParty.address} onChange={e => setNewPrivateParty({...newPrivateParty, address: e.target.value})} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="submit" className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 20px' }} disabled={!newPrivateParty.name.trim()}>
                  {editingItem ? <><Save size={18} /> Update Party</> : <><Plus size={18} /> Add Party</>}
                </button>
                {editingItem && (
                  <button type="button" onClick={cancelEdit} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 20px', background: '#e9ecef', color: '#333', border: '1px solid #ccc' }}>
                    <X size={18} /> Cancel
                  </button>
                )}
              </div>
            </form>
          ) : (
            <form onSubmit={handleAddOrUpdateItem} style={{ display: 'flex', gap: '10px', marginBottom: '30px' }}>
              <input 
                type="text" 
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                placeholder={`Enter ${editingItem ? 'updated' : 'new'} ${activeTab.replace('-', ' ')}...`} 
                className="form-control" 
                style={{ flex: 1, padding: '12px', fontSize: '16px' }}
              />
              <button type="submit" className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0 20px' }} disabled={!newItemName.trim()}>
                {editingItem ? <><Save size={18} /> Update</> : <><Plus size={18} /> Add</>}
              </button>
              {editingItem && (
                <button type="button" onClick={cancelEdit} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0 20px', background: '#e9ecef', color: '#333', border: '1px solid #ccc' }}>
                  <X size={18} /> Cancel
                </button>
              )}
            </form>
          )}

          <div style={{ background: 'white', borderRadius: '8px', border: '1px solid #ddd', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ background: '#f8f9fa' }}>
                <tr>
                  <th style={{ padding: '12px 15px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Name</th>
                  <th style={{ padding: '12px 15px', textAlign: 'right', borderBottom: '1px solid #ddd', width: '100px' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {getActiveList().length === 0 ? (
                  <tr>
                    <td colSpan="2" style={{ padding: '20px', textAlign: 'center', color: '#888' }}>
                      No {activeTab} found. Add one above or auto-fill default data.
                    </td>
                  </tr>
                ) : (
                  getActiveList().map(item => (
                    <tr key={item._id} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '12px 15px', fontWeight: '500', color: '#444' }}>{item.name || item.year}</td>
                      <td style={{ padding: '12px 15px', textAlign: 'right' }}>
                        <button 
                          onClick={() => handleEditItem(item)} 
                          style={{ background: 'none', border: 'none', color: '#0056b3', cursor: 'pointer', padding: '5px', marginRight: '10px' }}
                          title="Edit"
                        >
                          <Edit size={18} />
                        </button>
                        <button 
                          onClick={() => handleDeleteItem(item._id)} 
                          style={{ background: 'none', border: 'none', color: '#dc3545', cursor: 'pointer', padding: '5px' }}
                          title="Delete"
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
          
          <div style={{ marginTop: '20px', padding: '15px', background: '#fff3cd', borderLeft: '4px solid #ffc107', borderRadius: '4px', fontSize: '13px', color: '#856404' }}>
            <strong>Warning:</strong> Deleting an item here will remove it from dropdowns across the system. It is not recommended to delete items that have been used in past records (CRs, Challans, Statements) as it may affect reporting.
          </div>
        </div>
      </div>
    </div>
  );
}
