import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getStatements, updateStatement, getInventoryBalances, getMaterials, getDivisions } from '../services/api';
import { Printer, Edit2, X, ArrowLeft } from 'lucide-react';
import { Modal } from '../components/ui';

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
    <div className="bg-white min-h-screen p-3 sm:p-6 print:p-0">
      {/* Non-printable controls */}
      <div className="print:hidden flex flex-wrap items-center justify-between gap-3 mb-6 bg-slate-50 p-3.5 sm:p-4 rounded-2xl border border-slate-200/90 shadow-xs">
        <div className="flex flex-wrap items-center gap-3">
          <button 
            onClick={() => navigate(-1)} 
            className="inline-flex items-center gap-2 px-3 py-1.5 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <ArrowLeft size={16} /> <span>Back</span>
          </button>
          <select 
            value={divisionFilter} 
            onChange={(e) => setDivisionFilter(e.target.value)}
            className="bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs sm:text-sm text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-[#0059bb]/20 focus:border-[#0059bb]"
          >
            <option value="All">All Divisions</option>
            {divisions.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          <div className="flex items-center gap-2 bg-white border border-slate-300 px-2.5 py-1 rounded-xl">
            <span className="text-xs font-semibold text-slate-500">From:</span>
            <input 
              type="date" 
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="text-xs text-slate-800 focus:outline-none border-none bg-transparent"
            />
          </div>
          <div className="flex items-center gap-2 bg-white border border-slate-300 px-2.5 py-1 rounded-xl">
            <span className="text-xs font-semibold text-slate-500">To:</span>
            <input 
              type="date" 
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="text-xs text-slate-800 focus:outline-none border-none bg-transparent"
            />
          </div>
        </div>
        <button 
          onClick={handlePrint} 
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#0059bb] hover:bg-[#004899] active:bg-[#003c82] text-white rounded-xl font-semibold text-xs sm:text-sm shadow-xs transition-all cursor-pointer"
        >
          <Printer size={16} /> <span>Print Register</span>
        </button>
      </div>

      {/* Printable Area */}
      <div className="text-center relative min-h-[140px] pt-2.5 mb-4">
        <img src="/logo address.png" alt="Neeta Engineering Works Logo" className="hidden print:block absolute left-5 top-2.5 h-[130px] object-contain" />
        <h1 className="text-xl sm:text-2xl font-extrabold text-red-600 uppercase tracking-tight m-0 mb-1">
          CONTRACTOR M.R STATEMENT 1.4.{activeYear.split('-')[0]} TO 31.3.20{activeYear.split('-')[1]}
        </h1>
        <h2 className="text-base sm:text-lg font-bold text-blue-700 uppercase m-0">
          {divisionFilter.toUpperCase()} O&M {(() => {
            const match = divisionFilter.match(/-(\d+)$/);
            return match ? `DIVISION-${match[1]}` : 'DIVISION';
          })()} Contractor GP Ditel
        </h2>
      </div>

      <div className="overflow-x-auto mt-2.5">
        <table className="w-max min-w-full border-collapse text-xs table-fixed border border-black">
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
            <col className="print:hidden" style={{ width: `${columnWidths.edit}px` }} />
          </colgroup>
          <thead>
            <tr className="bg-white">
              <th className="border border-black p-1 text-center font-bold">SR NO</th>
              <th className="border border-black p-1 text-center font-bold">G.P.NO</th>
              <th className="border border-black p-1 text-center font-bold">G.P.DATE</th>
              <th className="border border-black p-1 text-center font-bold">Contractor Name</th>
              <th className="border border-black p-1 text-center font-bold">dc no</th>
              <th className="border border-black p-1 text-center font-bold">date</th>
              
              {materialColumns.map(mat => (
                <th key={mat} className="border border-black text-[9px] p-0.5 text-center align-top break-all font-bold leading-tight">
                  {headerMap[mat] ? headerMap[mat].split('\n').map((line, i) => (
                    <div key={i}>{line}</div>
                  )) : mat.toUpperCase()}
                </th>
              ))}
              
              <th className="border border-black p-1 text-center font-bold">Total</th>
              <th className="border border-black p-1 text-center font-bold print:hidden">Edit</th>
            </tr>
          </thead>
          <tbody>
            {currentRecords.map((stmt, index) => {
              const grandTotal = stmt.materials ? stmt.materials.reduce((sum, m) => sum + (m.qty || 0), 0) : 0;
              const isHighlighted = stmt.status === 'Completed';
              const srNo = indexOfFirstRecord + index + 1;
              
              return (
                <tr key={stmt._id || index} className={isHighlighted ? 'bg-emerald-50/70' : 'hover:bg-slate-50 transition-colors'}>
                  <td className="border border-black text-center p-1">{srNo}</td>
                  <td className="border border-black text-center p-1">{stmt.gpNo || ''}</td>
                  <td className="border border-black text-center p-1">{stmt.gpDate || ''}</td>
                  <td className="border border-black text-left p-1 font-bold">{stmt.contractorName}</td>
                  <td className="border border-black text-center p-1">{stmt.dcNo || ''}</td>
                  <td className="border border-black text-center p-1">{stmt.dcDate || ''}</td>
                  
                  {materialColumns.map(mat => {
                    const material = stmt.materials?.find(m => m.name?.trim() === mat.trim());
                    const qty = material ? material.qty : 0;
                    return (
                      <td key={mat} className="border border-black text-center text-[11px] p-0.5">
                        {qty > 0 ? qty : '0'}
                      </td>
                    );
                  })}
                  
                  <td className="border border-black text-right p-1 font-bold">{grandTotal > 0 ? grandTotal : '0'}</td>
                  <td className="border border-black text-center p-1 print:hidden">
                    <button 
                      onClick={() => handleEditClick(stmt)} 
                      className="text-blue-600 hover:text-blue-800 p-1 cursor-pointer"
                      title="Edit Statement"
                    >
                      <Edit2 size={14} />
                    </button>
                  </td>
                </tr>
              );
            })}
            
            {/* Empty padding rows to make it look like the Excel sheet */}
            {Array.from({ length: Math.max(0, 15 - currentRecords.length) }).map((_, i) => (
              <tr key={`empty-${i}`}>
                <td className="border border-black p-1">&nbsp;</td>
                <td className="border border-black p-1"></td>
                <td className="border border-black p-1"></td>
                <td className="border border-black p-1"></td>
                <td className="border border-black p-1"></td>
                <td className="border border-black p-1"></td>
                {materialColumns.map(mat => <td key={`empty-mat-${mat}`} className="border border-black p-1"></td>)}
                <td className="border border-black p-1"></td>
                <td className="border border-black p-1 print:hidden"></td>
              </tr>
            ))}
          </tbody>
          {filteredStatements.length > 0 && (
            <tfoot className="sticky bottom-0 z-10">
              <tr className="border-t-2 border-b-2 border-black bg-slate-100 font-bold">
                <td colSpan={6} className="border border-black text-right pr-4 text-sm sticky bottom-0 bg-slate-100">TOTAL :</td>
                {materialColumns.map(mat => (
                  <td key={`total-${mat}`} className="border border-black text-center text-blue-700 text-xs p-0.5 sticky bottom-0 bg-slate-100">
                    {columnTotals[mat] > 0 ? columnTotals[mat] : '0'}
                  </td>
                ))}
                <td className="border border-black text-right text-blue-700 text-xs pr-1 sticky bottom-0 bg-slate-100 font-extrabold">{overallTotal > 0 ? overallTotal : '0'}</td>
                <td className="border border-black print:hidden sticky bottom-0 bg-slate-100"></td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* Signature Block */}
      {filteredStatements.length > 0 && (
        <div className="hidden print:flex justify-end mt-4 pr-10 pb-0">
          <div className="w-64 text-center">
            <div className="flex justify-center mb-1">
              <img src="/sign.png" alt="Signature" className="h-24 object-contain" />
            </div>
            <div className="text-black text-sm mb-2">
              ...........................................
            </div>
            <div className="text-xs font-semibold text-black">Authorized Signatory</div>
            <div className="text-[11px] text-slate-600 mt-1">For Neeta Engineering Works</div>
          </div>
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="print:hidden flex justify-center items-center gap-3 mt-6">
          <button 
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Previous
          </button>
          <span className="text-xs font-semibold text-slate-700">
            Page {currentPage} of {totalPages}
          </span>
          <button 
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Next
          </button>
        </div>
      )}

      {/* Current Division Balance - For Quick Reference */}
      {divisionFilter !== 'All' && (
        <div className="print:hidden mt-6 p-4 sm:p-5 bg-slate-50 border border-slate-200 rounded-2xl">
          <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
            Current Inventory Balance: {divisionFilter.toUpperCase()}
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
            {materialColumns.map(mat => {
              const divBalanceData = inventoryBalances.find(b => b.divisionName === divisionFilter);
              const matBalance = divBalanceData?.materials?.find(m => m.name === mat)?.qty || 0;
              return (
                <div key={`bal-${mat}`} className="bg-white p-2.5 border border-slate-200/80 rounded-xl text-center shadow-xs">
                  <div className="text-[11px] text-slate-500 truncate font-semibold mb-1" title={mat}>
                    {mat.split(' ').slice(1).join(' ')}
                  </div>
                  <div className={`text-base font-extrabold ${matBalance < 0 ? 'text-rose-600' : (matBalance > 0 ? 'text-emerald-600' : 'text-slate-500')}`}>
                    {matBalance}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {/* Edit Register Details Modal */}
      <Modal
        isOpen={Boolean(editingStmt)}
        onClose={() => setEditingStmt(null)}
        title="Edit Register Details"
        size="sm"
      >
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">G.P. NO</label>
            <input 
              type="text" 
              value={editFormData.gpNo} 
              onChange={e => setEditFormData({...editFormData, gpNo: e.target.value})}
              className="w-full p-2 border border-slate-200 rounded text-sm"
            />
          </div>
          
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">G.P. DATE</label>
            <input 
              type="text" 
              value={editFormData.gpDate} 
              onChange={e => setEditFormData({...editFormData, gpDate: e.target.value})}
              className="w-full p-2 border border-slate-200 rounded text-sm"
              placeholder="DD.MM.YY"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">DC NO</label>
            <input 
              type="text" 
              value={editFormData.dcNo} 
              onChange={e => setEditFormData({...editFormData, dcNo: e.target.value})}
              className="w-full p-2 border border-slate-200 rounded text-sm"
            />
          </div>
          
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Date (Challan Issue Date)</label>
            <input 
              type="text" 
              value={editFormData.dcDate} 
              onChange={e => setEditFormData({...editFormData, dcDate: e.target.value})}
              className="w-full p-2 border border-slate-200 rounded text-sm"
              placeholder="DD.MM.YY"
            />
          </div>
          
          <div className="flex items-center gap-2 pt-2">
            <input 
              type="checkbox" 
              id="highlightRow"
              checked={editFormData.status === 'Completed'} 
              onChange={e => setEditFormData({...editFormData, status: e.target.checked ? 'Completed' : 'Pending'})}
              className="w-4 h-4 cursor-pointer"
            />
            <label htmlFor="highlightRow" className="text-xs font-bold text-amber-600 cursor-pointer">
              Highlight Row (Material Taken)
            </label>
          </div>
          
          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button 
              onClick={() => setEditingStmt(null)} 
              className="px-3 py-1.5 border border-slate-200 rounded text-sm bg-white hover:bg-slate-50"
            >
              Cancel
            </button>
            <button 
              onClick={handleSaveEdit} 
              className="px-4 py-1.5 rounded text-sm bg-[#0059bb] text-white hover:bg-[#004795] font-medium"
            >
              Save
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
