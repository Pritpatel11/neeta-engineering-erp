import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getStatements, updateStatement, getInventoryBalances, getMaterials, getDivisions } from '../services/api';
import './StatementRegister.css';
import { Printer, Edit2, X, ArrowLeft } from 'lucide-react';

export default function StatementRegister() {
  const navigate = useNavigate();
  const [statements, setStatements] = useState([]);
  const [inventoryBalances, setInventoryBalances] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [divisions, setDivisions] = useState([]);
  const [divisionFilter, setDivisionFilter] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const activeYear = localStorage.getItem('activeFinancialYear') || '2025-26';
  
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 15;

  useEffect(() => {
    setCurrentPage(1);
  }, [divisionFilter, fromDate, toDate]);
  
  // State for the Edit Modal
  const [editingStmt, setEditingStmt] = useState(null);
  const [editFormData, setEditFormData] = useState({ gpNo: '', gpDate: '', dcNo: '', dcDate: '', status: '' });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [fetchedStatements, fetchedBalances, mats, divs] = await Promise.all([
          getStatements(),
          getInventoryBalances(),
          getMaterials(),
          getDivisions()
        ]);
        
        fetchedStatements.sort((a, b) => parseInt(a.statementNo) - parseInt(b.statementNo));
        setStatements(fetchedStatements);
        setInventoryBalances(fetchedBalances);
        
        setMaterials(mats.map(m => m.name));
        const divNames = divs.map(d => d.name);
        setDivisions(divNames);
        if (divNames.length > 0) setDivisionFilter(divNames[0]);
        
      } catch (error) {
        console.error('Failed to fetch data:', error);
      }
    };
    fetchData();
  }, []);

  // Filter statements
  const filteredStatements = statements.filter(s => {
    // Division filter
    if (divisionFilter !== 'All' && s.divisionName && s.divisionName.toLowerCase() !== divisionFilter.toLowerCase()) {
      return false;
    }
    // Date filter
    if (fromDate || toDate) {
      const stmtDateStr = s.date; // Assuming YYYY-MM-DD
      if (stmtDateStr) {
        // Simple string comparison works for YYYY-MM-DD
        if (fromDate && stmtDateStr < fromDate) return false;
        if (toDate && stmtDateStr > toDate) return false;
      }
    }
    return true;
  });

  const materialColumns = materials;

  const indexOfLastRecord = currentPage * recordsPerPage;
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
  const currentRecords = filteredStatements.slice(indexOfFirstRecord, indexOfLastRecord);
  const totalPages = Math.ceil(filteredStatements.length / recordsPerPage);

  const columnWidths = {
    srNo: 48,
    gpNo: 70,
    gpDate: 82,
    contractorName: 220,
    dcNo: 58,
    dcDate: 70,
    material: 56,
    total: 60,
    edit: 42,
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

  const handleEditClick = (stmt) => {
    setEditingStmt(stmt);
    setEditFormData({
      gpNo: stmt.gpNo || '',
      gpDate: stmt.gpDate || '',
      dcNo: stmt.dcNo || '',
      dcDate: stmt.dcDate || '',
      status: stmt.status || 'Pending'
    });
  };

  const handleSaveEdit = async () => {
    try {
      await updateStatement(editingStmt._id, editFormData);
      
      // Update local state
      setStatements(statements.map(s => 
        s._id === editingStmt._id ? { ...s, ...editFormData } : s
      ));
      
      setEditingStmt(null);
    } catch (error) {
      console.error('Failed to update statement details:', error);
      alert('Failed to update. Please try again.');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Compute Totals
  const columnTotals = {};
  let overallTotal = 0;
  
  materialColumns.forEach(mat => {
    let sum = 0;
    filteredStatements.forEach(stmt => {
      const material = stmt.materials?.find(m => m.name?.trim() === mat.trim());
      if (material && material.qty) {
        sum += material.qty;
      }
    });
    columnTotals[mat] = sum;
    overallTotal += sum;
  });

  return (
    <div className="register-container">
      {/* Non-printable controls */}
      <div className="register-header-controls">
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <button 
            onClick={() => navigate(-1)} 
            className="btn-outline" 
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', border: '1px solid #ccc', borderRadius: '6px', background: 'white', cursor: 'pointer' }}
          >
            <ArrowLeft size={16} /> Back
          </button>
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
        <button onClick={handlePrint} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Printer size={16} /> Print Register
        </button>
      </div>

      {/* Printable Area */}
      <div className="register-title-section" style={{ textAlign: 'center', position: 'relative', minHeight: '140px', paddingTop: '10px' }}>
        <img src="./logo address.png" alt="Neeta Engineering Works Logo" className="print-only" style={{ position: 'absolute', left: '20px', top: '10px', height: '130px', objectFit: 'contain' }} />
        <h1 className="register-main-title">
          CONTRACTOR M.R STATEMENT 1.4.{activeYear.split('-')[0]} TO 31.3.20{activeYear.split('-')[1]}
        </h1>
        <h2 className="register-sub-title">
          {divisionFilter.toUpperCase()} O&M {(() => {
            const match = divisionFilter.match(/-(\d+)$/);
            return match ? `DIVISION-${match[1]}` : 'DIVISION';
          })()} Contractor GP Ditel
        </h2>
      </div>

      <div className="register-table-wrapper">
        <table className="register-table">
          <colgroup>
            <col style={{ width: `${columnWidths.srNo}px` }} />
            <col style={{ width: `${columnWidths.gpNo}px` }} />
            <col style={{ width: `${columnWidths.gpDate}px` }} />
            <col style={{ width: `${columnWidths.contractorName}px` }} />
            <col style={{ width: `${columnWidths.dcNo}px` }} />
            <col style={{ width: `${columnWidths.dcDate}px` }} />
            {materialColumns.map(mat => (
              <col key={mat} style={{ width: `${columnWidths.material}px` }} />
            ))}
            <col style={{ width: `${columnWidths.total}px` }} />
            <col className="no-print" style={{ width: `${columnWidths.edit}px` }} />
          </colgroup>
          <thead>
            <tr>
              <th style={{ width: `${columnWidths.srNo}px` }}>SR NO</th>
              <th style={{ width: `${columnWidths.gpNo}px` }}>G.P.NO</th>
              <th style={{ width: `${columnWidths.gpDate}px` }}>G.P.DATE</th>
              <th style={{ width: `${columnWidths.contractorName}px` }}>Contractor Name</th>
              <th style={{ width: `${columnWidths.dcNo}px` }}>dc no</th>
              <th style={{ width: `${columnWidths.dcDate}px` }}>date</th>
              
              {materialColumns.map(mat => (
                <th key={mat} className="material-header">
                  {headerMap[mat] ? headerMap[mat].split('\n').map((line, i) => (
                    <div key={i}>{line}</div>
                  )) : mat.toUpperCase()}
                </th>
              ))}
              
              <th style={{ width: `${columnWidths.total}px` }}>Total</th>
              <th className="no-print" style={{ width: `${columnWidths.edit}px` }}>Edit</th>
            </tr>
          </thead>
          <tbody>
            {currentRecords.map((stmt, index) => {
              const grandTotal = stmt.materials ? stmt.materials.reduce((sum, m) => sum + (m.qty || 0), 0) : 0;
              const isHighlighted = stmt.status === 'Completed';
              const srNo = indexOfFirstRecord + index + 1;
              
              return (
                <tr key={stmt._id || index} className={isHighlighted ? 'highlighted-row' : ''}>
                  <td className="text-center">{srNo}</td>
                  <td className="text-center">{stmt.gpNo || ''}</td>
                  <td className="text-center">{stmt.gpDate || ''}</td>
                  <td className="text-left font-bold">{stmt.contractorName}</td>
                  <td className="text-center">{stmt.dcNo || ''}</td>
                  <td className="text-center">{stmt.dcDate || ''}</td>
                  
                  {materialColumns.map(mat => {
                    const material = stmt.materials?.find(m => m.name?.trim() === mat.trim());
                    const qty = material ? material.qty : 0;
                    return (
                      <td key={mat} className="text-center material-cell">
                        {qty > 0 ? qty : '0'}
                      </td>
                    );
                  })}
                  
                  <td className="text-right font-bold">{grandTotal > 0 ? grandTotal : '0'}</td>
                  <td className="text-center no-print">
                    <button onClick={() => handleEditClick(stmt)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'blue' }}>
                      <Edit2 size={14} />
                    </button>
                  </td>
                </tr>
              );
            })}
            
            {/* Empty padding rows to make it look like the Excel sheet */}
            {Array.from({ length: Math.max(0, 15 - currentRecords.length) }).map((_, i) => (
              <tr key={`empty-${i}`}>
                <td>&nbsp;</td>
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
          {filteredStatements.length > 0 && (
            <tfoot style={{ position: 'sticky', bottom: 0, zIndex: 10 }}>
              <tr style={{ borderTop: '2px solid black', borderBottom: '2px solid black' }}>
                <td colSpan={6} className="text-right font-bold" style={{ paddingRight: '16px', fontSize: '14px', position: 'sticky', bottom: 0, backgroundColor: '#e9ecef' }}>TOTAL :</td>
                {materialColumns.map(mat => (
                  <td key={`total-${mat}`} className="text-center font-bold material-cell" style={{ color: '#0056b3', fontSize: '13px', position: 'sticky', bottom: 0, backgroundColor: '#e9ecef' }}>
                    {columnTotals[mat] > 0 ? columnTotals[mat] : '0'}
                  </td>
                ))}
                <td className="text-right font-bold" style={{ color: '#0056b3', fontSize: '13px', position: 'sticky', bottom: 0, backgroundColor: '#e9ecef' }}>{overallTotal > 0 ? overallTotal : '0'}</td>
                <td className="no-print" style={{ position: 'sticky', bottom: 0, backgroundColor: '#e9ecef' }}></td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* Signature Block */}
      {filteredStatements.length > 0 && (
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
      {totalPages > 1 && (
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

      {/* Current Division Balance - For Quick Reference */}
      {divisionFilter !== 'All' && (
        <div className="no-print" style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f8f9fa', border: '1px solid #dee2e6', borderRadius: '8px' }}>
          <h3 style={{ margin: '0 0 15px 0', fontSize: '16px', color: '#495057', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#28a745', display: 'inline-block' }}></span>
            Current Inventory Balance: {divisionFilter.toUpperCase()}
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '10px' }}>
            {materialColumns.map(mat => {
              const divBalanceData = inventoryBalances.find(b => b.divisionName === divisionFilter);
              const matBalance = divBalanceData?.materials?.find(m => m.name === mat)?.qty || 0;
              return (
                <div key={`bal-${mat}`} style={{ background: 'white', padding: '10px', border: '1px solid #ced4da', borderRadius: '6px', textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                  <div style={{ fontSize: '11px', color: '#6c757d', marginBottom: '6px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: 'bold' }} title={mat}>
                    {mat.split(' ').slice(1).join(' ')}
                  </div>
                  <div style={{ fontSize: '18px', fontWeight: 'bold', color: matBalance < 0 ? '#dc3545' : (matBalance > 0 ? '#198754' : '#6c757d') }}>
                    {matBalance}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingStmt && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div style={{
            background: 'white', padding: '20px', borderRadius: '8px',
            width: '300px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h3 style={{ margin: 0 }}>Edit Register Details</h3>
              <X size={20} style={{ cursor: 'pointer' }} onClick={() => setEditingStmt(null)} />
            </div>
            
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '14px', marginBottom: '4px' }}>G.P. NO</label>
              <input 
                type="text" 
                value={editFormData.gpNo} 
                onChange={e => setEditFormData({...editFormData, gpNo: e.target.value})}
                style={{ width: '100%', padding: '6px', border: '1px solid #ccc', borderRadius: '4px' }}
              />
            </div>
            
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '14px', marginBottom: '4px' }}>G.P. DATE</label>
              <input 
                type="text" 
                value={editFormData.gpDate} 
                onChange={e => setEditFormData({...editFormData, gpDate: e.target.value})}
                style={{ width: '100%', padding: '6px', border: '1px solid #ccc', borderRadius: '4px' }}
                placeholder="DD.MM.YY"
              />
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '14px', marginBottom: '4px' }}>dc no</label>
              <input 
                type="text" 
                value={editFormData.dcNo} 
                onChange={e => setEditFormData({...editFormData, dcNo: e.target.value})}
                style={{ width: '100%', padding: '6px', border: '1px solid #ccc', borderRadius: '4px' }}
              />
            </div>
            
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '14px', marginBottom: '4px' }}>Date (Challan Issue Date)</label>
              <input 
                type="text" 
                value={editFormData.dcDate} 
                onChange={e => setEditFormData({...editFormData, dcDate: e.target.value})}
                style={{ width: '100%', padding: '6px', border: '1px solid #ccc', borderRadius: '4px' }}
                placeholder="DD.MM.YY"
              />
            </div>
            
            <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input 
                type="checkbox" 
                id="highlightRow"
                checked={editFormData.status === 'Completed'} 
                onChange={e => setEditFormData({...editFormData, status: e.target.checked ? 'Completed' : 'Pending'})}
                style={{ width: '16px', height: '16px', cursor: 'pointer' }}
              />
              <label htmlFor="highlightRow" style={{ fontSize: '14px', cursor: 'pointer', fontWeight: 'bold', color: 'orange' }}>
                Highlight Row (Material Taken)
              </label>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button onClick={() => setEditingStmt(null)} style={{ padding: '6px 12px', border: '1px solid #ccc', background: 'white', cursor: 'pointer', borderRadius: '4px' }}>Cancel</button>
              <button onClick={handleSaveEdit} style={{ padding: '6px 12px', border: 'none', background: 'blue', color: 'white', cursor: 'pointer', borderRadius: '4px' }}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
