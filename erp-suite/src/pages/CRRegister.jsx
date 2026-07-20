import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getStoreReceipts, deleteStoreReceipt, updateStoreReceipt, getDivisions, getContractors, getMaterials } from '../services/api';
import { Printer, Trash2, Edit2, X } from 'lucide-react';
import './StatementRegister.css'; // Use statement register styles

export default function CRRegister() {
  const navigate = useNavigate();
  const [receipts, setReceipts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [divisionFilter, setDivisionFilter] = useState('All');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const activeYear = localStorage.getItem('activeFinancialYear') || '2025-26';

  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 15;

  useEffect(() => {
    setCurrentPage(1);
  }, [divisionFilter, fromDate, toDate]);

  // State for the Edit Modal
  const [editingCR, setEditingCR] = useState(null);
  const [editFormData, setEditFormData] = useState({
    receiptNo: '', releaseNo: '', conName: '', oNo: '', poNo: '', divisionName: ''
  });

  const [divisions, setDivisions] = useState([]);
  const [contractors, setContractors] = useState([]);
  const [materialsList, setMaterialsList] = useState([]);

  useEffect(() => {
    fetchReceipts();
    fetchMasterData();
  }, []);

  const fetchMasterData = async () => {
    try {
      const [divs, conts, mats] = await Promise.all([getDivisions(), getContractors(), getMaterials()]);
      setDivisions(divs.map(d => d.name));
      setContractors(conts.map(c => c.name));
      setMaterialsList(mats.map(m => m.name));
    } catch (error) {
      console.error('Failed to load master data:', error);
    }
  };

  const fetchReceipts = async () => {
    try {
      setIsLoading(true);
      const data = await getStoreReceipts();
      setReceipts(data);
    } catch (error) {
      console.error('Failed to fetch receipts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id, receiptNo) => {
    if (window.confirm(`Are you sure you want to delete Receipt Number ${receiptNo}? This will ALSO deduct the quantities from the Division Balance.`)) {
      try {
        await deleteStoreReceipt(id);
        alert('CR deleted successfully and balances reverted.');
        fetchReceipts();
      } catch (error) {
        alert('Error deleting CR.');
      }
    }
  };

  const handleEditClick = (cr) => {
    setEditingCR(cr);
    const materialsObj = {};
    cr.materials?.forEach(m => {
      materialsObj[m.name] = m.qty;
    });

    setEditFormData({
      receiptNo: cr.receiptNo || '',
      releaseNo: cr.releaseNo || '',
      conName: cr.conName || '',
      oNo: cr.oNo || '',
      poNo: cr.poNo || '',
      divisionName: cr.divisionName || '',
      materials: materialsObj
    });
  };

  const handleSaveEdit = async () => {
    try {
      // Convert materials object back to array
      const materialsArray = Object.entries(editFormData.materials || {})
        .filter(([_, qty]) => parseInt(qty) > 0)
        .map(([name, qty]) => ({ name, qty: parseInt(qty) }));

      const payload = { ...editFormData, materials: materialsArray };

      await updateStoreReceipt(editingCR._id, payload);

      // Update local state
      setReceipts(receipts.map(r =>
        r._id === editingCR._id ? { ...r, ...payload } : r
      ));

      setEditingCR(null);
    } catch (error) {
      console.error('Failed to update CR details:', error);
      alert('Failed to update. Please try again.');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Filter receipts
  // Filter receipts
  const filteredReceipts = receipts.filter(r => {
    // Division filter
    if (divisionFilter !== 'All' && r.divisionName && r.divisionName.toLowerCase() !== divisionFilter.toLowerCase()) {
      return false;
    }
    // Date filter
    if (fromDate || toDate) {
      const crDateStr = r.date; // Assuming YYYY-MM-DD
      if (crDateStr) {
        if (fromDate && crDateStr < fromDate) return false;
        if (toDate && crDateStr > toDate) return false;
      }
    }
    return true;
  });

  const indexOfLastRecord = currentPage * recordsPerPage;
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
  const currentRecords = filteredReceipts.slice(indexOfFirstRecord, indexOfLastRecord);
  const totalPages = Math.ceil(filteredReceipts.length / recordsPerPage);

  const materialColumns = [
    "3611000019 9FT. ANGLE 65*65*6",
    "2609000076 9FT. ANGLE 50*50*5",
    "2609000011 4FT ANGLE 65*65*6",
    "2609000005 2.6FT ANGLE 65*65*6",
    "2609000058 2.6FT ANGLE 50*50*5",
    "2609000080 DO ANGLE",
    "2601000049 SIDE CLAMP",
    "2601000069 STAY CLAMP",
    "2601000040 U-CLAMP",
    "2609000034 V-CROOS ARM",
    "2601000084 TOP FITTING",
    "2614000002 ANCHOR ROAD",
    "2614000009 TURN BUCKLE",
    "2614000012 EYE BOLT",
    "0901000024 Earthing Coil",
    "2613000002 Three Hol Patti",
    "2609000086 6FT T-Channel"
  ];

  const columnWidths = {
    srNo: 48,
    receiptNo: 80,
    releaseNo: 80,
    conName: 180,
    oNo: 70,
    poNo: 70,
    divisionName: 80,
    material: 56,
    total: 60,
    action: 50,
  };

  const headerMap = {
    "3611000019 9FT. ANGLE 65*65*6": "3611000019\n9FT.\nANGLE\n65*65*6",
    "2609000076 9FT. ANGLE 50*50*5": "2609000076\n9FT.\nANGLE\n50*50*5",
    "2609000011 4FT ANGLE 65*65*6": "2609000011\n4FT\nANGLE\n65*65*6",
    "2609000005 2.6FT ANGLE 65*65*6": "2609000005\n2.6FT\nANGLE\n65*65*6",
    "2609000058 2.6FT ANGLE 50*50*5": "2609000058\n2.6FT\nANGLE\n50*50*5",
    "2609000080 DO ANGLE": "2609000080\nDO\nANGLE",
    "2601000049 SIDE CLAMP": "2601000049\nSIDE\nCLAMP",
    "2601000069 STAY CLAMP": "2601000069\nSTAY\nCLAMP",
    "2601000040 U-CLAMP": "2601000040\nU-\nCLAMP",
    "2609000034 V-CROOS ARM": "2609000034\nV-CROOS\nARM",
    "2601000084 TOP FITTING": "2601000084\nTOP\nFITTING",
    "2614000002 ANCHOR ROAD": "2614000002\nANCHOR\nROAD",
    "2614000009 TURN BUCKLE": "2614000009\nTURN\nBUCKLE",
    "2614000012 EYE BOLT": "2614000012\nEYE\nBOLT",
    "0901000024 Earthing Coil": "0901000024\nEarthing\nCoil",
    "2613000002 Three Hol Patti": "2613000002\nThree\nHol\nPatti",
    "2609000086 6FT T-Channel": "2609000086\n6FT\nT-Channel"
  };

  // Compute Totals
  const columnTotals = {};
  let grandTotal = 0;

  if (!isLoading) {
    materialColumns.forEach(mat => {
      let sum = 0;
      filteredReceipts.forEach(cr => {
        const material = cr.materials?.find(m => m.name?.trim() === mat.trim());
        if (material && material.qty) {
          sum += material.qty;
        }
      });
      columnTotals[mat] = sum;
      grandTotal += sum;
    });
  }

  return (
    <div className="register-container">
      {/* Non-printable controls */}
      <div className="register-header-controls no-print" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '16px' }}>
          {/* Year selection removed as it's now managed globally */}
          <select
            value={divisionFilter}
            onChange={(e) => setDivisionFilter(e.target.value)}
            className="form-control"
            style={{ width: '150px' }}
          >
            <option value="All">All Divisions</option>
            {divisions.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
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
        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={() => navigate('/create-cr')} className="btn-primary" style={{ background: '#28a745', border: 'none' }}>
            + New Inward (CR)
          </button>
          <button onClick={handlePrint} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Printer size={16} /> Print Register
          </button>
        </div>
      </div>

      {/* Printable Area */}
      <div className="register-title-section" style={{ textAlign: 'center', position: 'relative', minHeight: '140px', paddingTop: '10px' }}>
        <img src="./logo address.png" alt="Neeta Engineering Works Logo" className="print-only" style={{ position: 'absolute', left: '20px', top: '10px', height: '130px', objectFit: 'contain' }} />
        <h1 className="register-main-title">
          MATERIAL INWARD (CR) REGISTER 1.4.{activeYear.split('-')[0]} TO 31.3.20{activeYear.split('-')[1]}
        </h1>
        <h2 className="register-sub-title">
          {divisionFilter.toUpperCase() === 'ALL' ? 'ALL DIVISIONS' : `${divisionFilter.toUpperCase()} DIVISION`} Material Inwards
        </h2>
      </div>

      <div className="register-table-wrapper">
        <table className="register-table">
          <colgroup>
            <col style={{ width: `${columnWidths.srNo}px` }} />
            <col style={{ width: `${columnWidths.receiptNo}px` }} />
            <col style={{ width: `${columnWidths.releaseNo}px` }} />
            <col style={{ width: `${columnWidths.conName}px` }} />
            <col style={{ width: `${columnWidths.oNo}px` }} />
            <col style={{ width: `${columnWidths.poNo}px` }} />
            <col style={{ width: `${columnWidths.divisionName}px` }} />
            {materialColumns.map(mat => (
              <col key={mat} style={{ width: `${columnWidths.material}px` }} />
            ))}
            <col style={{ width: `${columnWidths.total}px` }} />
            <col style={{ width: `${columnWidths.action}px` }} className="no-print" />
          </colgroup>
          <thead>
            <tr>
              <th style={{ width: `${columnWidths.srNo}px` }}>SR NO</th>
              <th style={{ width: `${columnWidths.receiptNo}px` }}>Receipt No.</th>
              <th style={{ width: `${columnWidths.releaseNo}px` }}>Release No.</th>
              <th style={{ width: `${columnWidths.conName}px` }}>CON. NAME</th>
              <th style={{ width: `${columnWidths.oNo}px` }}>O.No</th>
              <th style={{ width: `${columnWidths.poNo}px` }}>P.O.No.</th>
              <th style={{ width: `${columnWidths.divisionName}px` }}>Division</th>

              {materialColumns.map(mat => (
                <th key={mat} className="material-header">
                  {headerMap[mat] ? headerMap[mat].split('\n').map((line, i) => (
                    <div key={i}>{line}</div>
                  )) : mat.toUpperCase()}
                </th>
              ))}

              <th style={{ width: `${columnWidths.total}px` }}>Total</th>
              <th className="no-print" style={{ width: `${columnWidths.action}px` }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={8 + materialColumns.length} style={{ textAlign: 'center', padding: '24px' }}>Loading...</td>
              </tr>
            ) : currentRecords.map((cr, index) => {
              const totalItems = cr.materials?.reduce((sum, m) => sum + (m.qty || 0), 0) || 0;
              const srNo = indexOfFirstRecord + index + 1;

              return (
                <tr key={cr._id || index}>
                  <td className="text-center">{srNo}</td>
                  <td className="text-center font-bold" style={{ color: '#0056b3' }}>{cr.receiptNo || ''}</td>
                  <td className="text-center">{cr.releaseNo || ''}</td>
                  <td className="text-left font-bold">{cr.conName || ''}</td>
                  <td className="text-center">{cr.oNo || ''}</td>
                  <td className="text-center">{cr.poNo || ''}</td>
                  <td className="text-center" style={{ fontWeight: 600 }}>{cr.divisionName || ''}</td>

                  {materialColumns.map(mat => {
                    const material = cr.materials?.find(m => m.name?.trim() === mat.trim());
                    const qty = material ? material.qty : 0;
                    return (
                      <td key={mat} className="text-center material-cell">
                        {qty > 0 ? qty : '0'}
                      </td>
                    );
                  })}

                  <td className="text-right font-bold">{totalItems > 0 ? totalItems : '0'}</td>
                  <td className="text-center no-print" style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                    <button
                      onClick={() => handleEditClick(cr)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'blue', padding: '4px' }}
                      title="Edit Basic Details"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(cr._id, cr.receiptNo)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc3545', padding: '4px' }}
                      title="Delete CR & Revert Balance"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              );
            })}

            {/* Empty padding rows to make it look like the Excel sheet */}
            {!isLoading && Array.from({ length: Math.max(0, 15 - currentRecords.length) }).map((_, i) => (
              <tr key={`empty-${i}`}>
                <td>&nbsp;</td>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
                {materialColumns.map(mat => <td key={`empty-mat-${mat}`}></td>)}
                <td></td>
                <td className="no-print"></td>
              </tr>
            ))}
          </tbody>
          {!isLoading && filteredReceipts.length > 0 && (
            <tfoot style={{ position: 'sticky', bottom: 0, zIndex: 10 }}>
              <tr style={{ borderTop: '2px solid black', borderBottom: '2px solid black' }}>
                <td colSpan={7} className="text-right font-bold" style={{ paddingRight: '16px', fontSize: '14px', position: 'sticky', bottom: 0, backgroundColor: '#e9ecef' }}>TOTAL :</td>
                {materialColumns.map(mat => (
                  <td key={`total-${mat}`} className="text-center font-bold material-cell" style={{ color: '#0056b3', fontSize: '13px', position: 'sticky', bottom: 0, backgroundColor: '#e9ecef' }}>
                    {columnTotals[mat] > 0 ? columnTotals[mat] : '0'}
                  </td>
                ))}
                <td className="text-right font-bold" style={{ color: '#0056b3', fontSize: '13px', position: 'sticky', bottom: 0, backgroundColor: '#e9ecef' }}>{grandTotal > 0 ? grandTotal : '0'}</td>
                <td className="no-print" style={{ position: 'sticky', bottom: 0, backgroundColor: '#e9ecef' }}></td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* Signature Block */}
      {!isLoading && filteredReceipts.length > 0 && (
        <div className="document-footer print-only-flex" style={{ justifyContent: 'flex-end', marginTop: '10px', paddingRight: '40px', paddingBottom: '0' }}>
          <div className="signature-block" style={{ width: '250px', textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '5px' }}>
              <img src="./sign.png" alt="Signature" style={{ height: '100px', objectFit: 'contain' }} />
            </div>
            <div className="signature-line" style={{ marginBottom: '8px', fontSize: '1rem', color: '#000' }}>
              ...........................................
            </div>
            <div className="signature-label" style={{ fontSize: '0.875rem', fontWeight: '600', color: '#000' }}>Authorized Signatory</div>
            <div className="signature-company" style={{ fontSize: '0.75rem', color: '#555', marginTop: '4px' }}>For Neeta Engineering Works</div>
          </div>
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && !isLoading && (
        <div className="no-print" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '15px', marginTop: '20px' }}>
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

      {/* Edit Modal */}
      {editingCR && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div style={{
            background: 'white', padding: '20px', borderRadius: '8px',
            width: '350px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h3 style={{ margin: 0 }}>Edit Receipt Details</h3>
              <X size={20} style={{ cursor: 'pointer' }} onClick={() => setEditingCR(null)} />
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '14px', marginBottom: '4px' }}>Receipt No.</label>
              <input
                type="text"
                value={editFormData.receiptNo}
                onChange={e => setEditFormData({ ...editFormData, receiptNo: e.target.value })}
                style={{ width: '100%', padding: '6px', border: '1px solid #ccc', borderRadius: '4px' }}
              />
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '14px', marginBottom: '4px' }}>Release No.</label>
              <input
                type="text"
                value={editFormData.releaseNo}
                onChange={e => setEditFormData({ ...editFormData, releaseNo: e.target.value })}
                style={{ width: '100%', padding: '6px', border: '1px solid #ccc', borderRadius: '4px' }}
              />
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '14px', marginBottom: '4px' }}>Contractor Name</label>
              <input
                type="text"
                value={editFormData.conName}
                onChange={e => setEditFormData({ ...editFormData, conName: e.target.value })}
                style={{ width: '100%', padding: '6px', border: '1px solid #ccc', borderRadius: '4px' }}
                placeholder="Enter Contractor Name"
              />
            </div>

            <div style={{ marginBottom: '12px', display: 'flex', gap: '8px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '14px', marginBottom: '4px' }}>O.No</label>
                <input
                  type="text"
                  value={editFormData.oNo}
                  onChange={e => setEditFormData({ ...editFormData, oNo: e.target.value })}
                  style={{ width: '100%', padding: '6px', border: '1px solid #ccc', borderRadius: '4px' }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '14px', marginBottom: '4px' }}>P.O.No.</label>
                <input
                  type="text"
                  value={editFormData.poNo}
                  onChange={e => setEditFormData({ ...editFormData, poNo: e.target.value })}
                  style={{ width: '100%', padding: '6px', border: '1px solid #ccc', borderRadius: '4px' }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <div className="form-group">
                <label>Division</label>
                <select
                  className="form-control"
                  value={editFormData.divisionName}
                  onChange={(e) => setEditFormData({ ...editFormData, divisionName: e.target.value })}
                >
                  <option value="" disabled>Select Division</option>
                  {divisions.map(d => <option key={d} value={d}>{d}</option>)}
                  {editFormData.divisionName && !divisions.includes(editFormData.divisionName) && (
                    <option value={editFormData.divisionName}>{editFormData.divisionName}</option>
                  )}
                </select>
              </div>
            </div>

            <div style={{ marginBottom: '20px', maxHeight: '250px', overflowY: 'auto', border: '1px solid #ddd', padding: '10px', borderRadius: '4px' }}>
              <h4 style={{ margin: '0 0 10px 0', fontSize: '14px' }}>Edit Materials</h4>
              {materialColumns.map(mat => (
                <div key={mat} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label style={{ fontSize: '12px', flex: 1, paddingRight: '10px' }}>{mat}</label>
                  <input
                    type="number"
                    min="0"
                    value={editFormData.materials?.[mat] || ''}
                    onChange={e => setEditFormData({
                      ...editFormData,
                      materials: {
                        ...editFormData.materials,
                        [mat]: e.target.value ? parseInt(e.target.value) : 0
                      }
                    })}
                    placeholder="0"
                    style={{ width: '80px', padding: '4px', textAlign: 'right', border: '1px solid #ccc', borderRadius: '4px' }}
                  />
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button onClick={() => setEditingCR(null)} style={{ padding: '6px 12px', border: '1px solid #ccc', background: 'white', cursor: 'pointer', borderRadius: '4px' }}>Cancel</button>
              <button onClick={handleSaveEdit} style={{ padding: '6px 12px', border: 'none', background: 'blue', color: 'white', cursor: 'pointer', borderRadius: '4px' }}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
