import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Eye, Trash2, FileText, Search, Edit, Edit2, X } from 'lucide-react';
import { getChallans, deleteChallan, updateChallan, getRemainingMaterials, deleteRemainingMaterial as deleteRemainingMaterialAPI, getMaterials } from '../services/api';

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
    <div className="dashboard-container" style={{ paddingBottom: '40px' }}>
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">Challan & Billing Management</h1>
          <p className="dashboard-subtitle">Manage, view, and print generated delivery challans.</p>
        </div>
        <div className="dashboard-actions">
          <button className="btn-primary" onClick={() => navigate('/create-challan')}>
            <Plus size={18} /> New Challan
          </button>
        </div>
      </div>

      <div className="glass-card" style={{ padding: '24px' }}>
        <div className="section-header-flex" style={{ borderBottom: 'none', marginBottom: '16px' }}>
          <h2 className="section-title mb-0 border-0" style={{ padding: 0 }}>
            <FileText className="text-primary" size={20} />
            Saved Challans
          </h2>
          
          <div style={{ position: 'relative' }}>
            <Search size={18} className="text-muted" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              type="text" 
              placeholder="Search challans..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-control"
              style={{ paddingLeft: '36px', width: '250px', background: 'var(--color-surface)' }}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: '600', color: '#8392a5' }}>From:</span>
            <input 
              type="date" 
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="form-control"
              style={{ width: '130px' }}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: '600', color: '#8392a5' }}>To:</span>
            <input 
              type="date" 
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="form-control"
              style={{ width: '130px' }}
            />
          </div>
        </div>

        <div className="tab-navigation" style={{ display: 'flex', gap: '16px', marginBottom: '24px', borderBottom: '1px solid var(--color-outline-variant)' }}>
          <button 
            className="btn-link" 
            style={{ 
              padding: '12px 24px', 
              color: activeTab === 'challans' ? 'var(--color-primary)' : 'var(--color-on-surface-variant)',
              borderBottom: activeTab === 'challans' ? '3px solid var(--color-primary)' : '3px solid transparent',
              textDecoration: 'none'
            }}
            onClick={() => setActiveTab('challans')}
          >
            Delivery Challans
          </button>
          <button 
            className="btn-link" 
            style={{ 
              padding: '12px 24px', 
              color: activeTab === 'remaining' ? 'var(--color-primary)' : 'var(--color-on-surface-variant)',
              borderBottom: activeTab === 'remaining' ? '3px solid var(--color-primary)' : '3px solid transparent',
              textDecoration: 'none'
            }}
            onClick={() => setActiveTab('remaining')}
          >
            Pending Materials
          </button>
        </div>

        {activeTab === 'challans' && (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Challan No.</th>
                  <th>Date</th>
                  <th>Contractor</th>
                  <th>Vehicle No.</th>
                  <th className="text-right">Total Items</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredChallans.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center text-muted" style={{ padding: '32px' }}>
                      {challans.length === 0 
                        ? 'No challans found. Create your first delivery challan!' 
                        : 'No challans match your search.'}
                    </td>
                  </tr>
                ) : (
                  currentRecords.map((challan, idx) => (
                    <tr key={challan.challanNo + idx} className={idx % 2 === 1 ? 'bg-alt' : ''}>
                      <td className="font-mono text-primary font-medium">{challan.challanNo}</td>
                      <td>{challan.date}</td>
                      <td>{challan.contractorName}</td>
                      <td>{challan.vehicleNumber}</td>
                      <td className="text-right font-mono">
                        {challan.materials?.reduce((sum, m) => sum + m.qty, 0) || 0} units
                      </td>
                      <td>
                        <select
                          className={`badge ${challan.status === 'Pending' ? 'badge-warning' : 'badge-secondary'}`}
                          value={challan.status || 'Dispatched'}
                          onChange={(e) => handleStatusChange(challan._id, e.target.value)}
                          style={{ border: 'none', cursor: 'pointer', outline: 'none' }}
                        >
                          <option value="Dispatched" style={{background: 'var(--color-surface)', color: 'var(--color-on-surface)'}}>Dispatched</option>
                          <option value="Pending" style={{background: 'var(--color-surface)', color: 'var(--color-on-surface)'}}>Pending</option>
                        </select>
                      </td>
                      <td className="text-right">
                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                          <button 
                            className="action-icon text-primary" 
                            onClick={() => handleEditClick(challan)}
                            title="Edit"
                            style={{ background: 'none', border: 'none' }}
                          >
                            <Edit2 size={18} />
                          </button>
                          <button 
                            className="action-icon" 
                            onClick={() => handleView(challan)}
                            title="View & Print"
                            style={{ background: 'none', border: 'none' }}
                          >
                            <Eye size={18} />
                          </button>
                          <button 
                            className="action-icon text-error" 
                            onClick={() => actualDelete(challan._id, challan.challanNo)}
                            title="Delete"
                            style={{ background: 'none', border: 'none' }}
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'remaining' && (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Original Challan No.</th>
                  <th>Date Recorded</th>
                  <th>Contractor</th>
                  <th>Division</th>
                  <th className="text-right">Pending Items (Qty)</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRemaining.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center text-muted" style={{ padding: '32px' }}>
                      {remainingMaterials.length === 0 
                        ? 'No pending materials recorded.' 
                        : 'No records match your search.'}
                    </td>
                  </tr>
                ) : (
                  currentRecords.map((record, idx) => (
                    <tr key={record._id} className={idx % 2 === 1 ? 'bg-alt' : ''}>
                      <td className="font-mono text-tertiary font-medium">{record.originalChallanNo}</td>
                      <td>{record.date}</td>
                      <td>{record.contractorName}</td>
                      <td>{record.divisionName || '-'}</td>
                      <td className="text-right">
                        {record.materials?.map((m, i) => (
                          <div key={i} style={{ fontSize: '12px', marginBottom: '2px' }}>
                            {m.name} <span className="font-mono text-tertiary">({m.qty} {m.unit})</span>
                          </div>
                        ))}
                      </td>
                      <td className="text-right">
                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                          <button 
                            className="action-icon text-primary" 
                            onClick={() => handleEditPending(record)}
                            title="Edit"
                            style={{ background: 'none', border: 'none' }}
                          >
                            <Edit size={18} />
                          </button>
                          <button 
                            className="action-icon text-error" 
                            onClick={() => deleteRemainingMaterial(record._id)}
                            title="Delete"
                            style={{ background: 'none', border: 'none' }}
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '15px', marginTop: '20px' }}>
            <button 
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              style={{ padding: '8px 16px', border: '1px solid #ccc', background: currentPage === 1 ? '#f8f9fa' : 'white', borderRadius: '4px', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', color: currentPage === 1 ? '#adb5bd' : '#495057' }}
            >
              Previous
            </button>
            <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#495057' }}>
              Page {currentPage} of {totalPages}
            </span>
            <button 
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              style={{ padding: '8px 16px', border: '1px solid #ccc', background: currentPage === totalPages ? '#f8f9fa' : 'white', borderRadius: '4px', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', color: currentPage === totalPages ? '#adb5bd' : '#495057' }}
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Edit Challan Modal */}
      {editingChallan && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div style={{
            background: 'white', padding: '24px', borderRadius: '12px',
            width: '450px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', color: 'var(--color-on-surface)' }}>Edit Challan Details</h3>
              <X size={20} style={{ cursor: 'pointer', color: '#666' }} onClick={() => setEditingChallan(null)} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', marginBottom: '4px', color: '#555' }}>Challan No.</label>
                <input
                  type="text"
                  value={editFormData.challanNo}
                  onChange={e => setEditFormData({ ...editFormData, challanNo: e.target.value })}
                  style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '6px' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', marginBottom: '4px', color: '#555' }}>Date</label>
                <input
                  type="text"
                  placeholder="dd/mm/yyyy"
                  value={editFormData.date}
                  onChange={e => setEditFormData({ ...editFormData, date: e.target.value })}
                  style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '6px' }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '13px', marginBottom: '4px', color: '#555' }}>Contractor Name</label>
              <input
                type="text"
                value={editFormData.contractorName}
                onChange={e => setEditFormData({ ...editFormData, contractorName: e.target.value })}
                style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '6px' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', marginBottom: '4px', color: '#555' }}>Vehicle No.</label>
                <input
                  type="text"
                  value={editFormData.vehicleNumber}
                  onChange={e => setEditFormData({ ...editFormData, vehicleNumber: e.target.value })}
                  style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '6px' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', marginBottom: '4px', color: '#555' }}>Driver Name</label>
                <input
                  type="text"
                  value={editFormData.driverName}
                  onChange={e => setEditFormData({ ...editFormData, driverName: e.target.value })}
                  style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '6px' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', marginBottom: '4px', color: '#555' }}>Gate Pass No.</label>
                <input
                  type="text"
                  value={editFormData.gatePassNo}
                  onChange={e => setEditFormData({ ...editFormData, gatePassNo: e.target.value })}
                  style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '6px' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', marginBottom: '4px', color: '#555' }}>Gate Pass Date</label>
                <input
                  type="text"
                  placeholder="dd/mm/yyyy"
                  value={editFormData.gatePassDate || ''}
                  onChange={e => setEditFormData({ ...editFormData, gatePassDate: e.target.value })}
                  style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '6px' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', marginBottom: '4px', color: '#555' }}>Division</label>
                <input
                  type="text"
                  value={editFormData.divisionName}
                  onChange={e => setEditFormData({ ...editFormData, divisionName: e.target.value })}
                  style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '6px' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', marginBottom: '4px', color: '#555' }}>Sub-Division</label>
                <input
                  type="text"
                  value={editFormData.subDivisionName}
                  onChange={e => setEditFormData({ ...editFormData, subDivisionName: e.target.value })}
                  style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '6px' }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '24px', maxHeight: '200px', overflowY: 'auto', border: '1px solid #eee', padding: '12px', borderRadius: '6px', background: '#fafafa' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h4 style={{ margin: 0, fontSize: '14px', color: '#333' }}>Edit Materials Qty</h4>
                <select 
                  onChange={(e) => {
                    const newMat = e.target.value;
                    if (newMat && !editFormData.materials?.[newMat]) {
                      setEditFormData({
                        ...editFormData,
                        materials: { ...editFormData.materials, [newMat]: 0 }
                      });
                    }
                    e.target.value = ""; // reset
                  }}
                  style={{ padding: '4px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '12px', maxWidth: '150px' }}
                >
                  <option value="">+ Add Material</option>
                  {materialsList.filter(m => !editFormData.materials?.[m]).map(mat => (
                    <option key={mat} value={mat}>{mat}</option>
                  ))}
                </select>
              </div>

              {Object.keys(editFormData.materials || {}).map(matName => (
                <div key={matName} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <label style={{ fontSize: '13px', flex: 1, paddingRight: '10px', color: '#444' }}>{matName}</label>
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
                    style={{ width: '70px', padding: '6px', textAlign: 'right', border: '1px solid #ccc', borderRadius: '4px' }}
                  />
                </div>
              ))}
              {Object.keys(editFormData.materials || {}).length === 0 && (
                <div style={{ fontSize: '13px', color: '#888' }}>No materials recorded.</div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button 
                onClick={() => setEditingChallan(null)} 
                className="btn-outline"
                style={{ padding: '8px 16px', borderRadius: '6px' }}
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveEdit} 
                className="btn-primary"
                style={{ padding: '8px 16px', borderRadius: '6px' }}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
