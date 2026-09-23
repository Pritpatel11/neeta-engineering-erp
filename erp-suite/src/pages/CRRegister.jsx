import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getStoreReceipts, deleteStoreReceipt, updateStoreReceipt, getDivisions, getContractors, getMaterials } from '../services/api';
import { Printer, Trash2, Edit2, X } from 'lucide-react';
import { Modal } from '../components/ui';

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
    <div className="bg-white min-h-screen p-3 sm:p-6 print:p-0">
      {/* Non-printable controls */}
      <div className="print:hidden flex flex-wrap items-center justify-between gap-3 mb-6 bg-slate-50 p-3.5 sm:p-4 rounded-2xl border border-slate-200/90 shadow-xs">
        <div className="flex flex-wrap items-center gap-3">
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
        <div className="flex items-center gap-2.5">
          <button 
            onClick={() => navigate('/create-cr')} 
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold text-xs sm:text-sm shadow-sm transition-all cursor-pointer"
          >
            <span>+ New Inward (CR)</span>
          </button>
          <button 
            onClick={handlePrint} 
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl font-semibold text-xs sm:text-sm shadow-sm transition-all cursor-pointer"
          >
            <Printer size={16} /> <span>Print Register</span>
          </button>
        </div>
      </div>

      {/* Printable Area */}
      <div className="text-center relative min-h-[140px] pt-2.5 mb-4">
        <img src="/logo address.png" alt="Neeta Engineering Works Logo" className="hidden print:block absolute left-5 top-2.5 h-[130px] object-contain" />
        <h1 className="text-xl sm:text-2xl font-extrabold text-red-600 uppercase tracking-tight m-0 mb-1">
          MATERIAL INWARD (CR) REGISTER 1.4.{activeYear.split('-')[0]} TO 31.3.20{activeYear.split('-')[1]}
        </h1>
        <h2 className="text-base sm:text-lg font-bold text-blue-700 uppercase m-0">
          {divisionFilter.toUpperCase() === 'ALL' ? 'ALL DIVISIONS' : `${divisionFilter.toUpperCase()} DIVISION`} Material Inwards
        </h2>
      </div>

      <div className="overflow-x-auto mt-2.5">
        <table className="w-max min-w-full border-collapse text-xs table-fixed border border-black">
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
            <col style={{ width: `${columnWidths.action}px` }} className="print:hidden" />
          </colgroup>
          <thead>
            <tr className="bg-white">
              <th className="border border-black p-1 text-center font-bold">SR NO</th>
              <th className="border border-black p-1 text-center font-bold">Receipt No.</th>
              <th className="border border-black p-1 text-center font-bold">Release No.</th>
              <th className="border border-black p-1 text-center font-bold">CON. NAME</th>
              <th className="border border-black p-1 text-center font-bold">O.No</th>
              <th className="border border-black p-1 text-center font-bold">P.O.No.</th>
              <th className="border border-black p-1 text-center font-bold">Division</th>

              {materialColumns.map(mat => (
                <th key={mat} className="border border-black text-[9px] p-0.5 text-center align-top break-all font-bold leading-tight">
                  {headerMap[mat] ? headerMap[mat].split('\n').map((line, i) => (
                    <div key={i}>{line}</div>
                  )) : mat.toUpperCase()}
                </th>
              ))}

              <th className="border border-black p-1 text-center font-bold">Total</th>
              <th className="border border-black p-1 text-center font-bold print:hidden">Action</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={8 + materialColumns.length} className="text-center py-6 text-slate-500 border border-black">Loading...</td>
              </tr>
            ) : currentRecords.map((cr, index) => {
              const totalItems = cr.materials?.reduce((sum, m) => sum + (m.qty || 0), 0) || 0;
              const srNo = indexOfFirstRecord + index + 1;

              return (
                <tr key={cr._id || index} className="hover:bg-slate-50 transition-colors">
                  <td className="border border-black text-center p-1">{srNo}</td>
                  <td className="border border-black text-center p-1 font-bold text-blue-700">{cr.receiptNo || ''}</td>
                  <td className="border border-black text-center p-1">{cr.releaseNo || ''}</td>
                  <td className="border border-black text-left p-1 font-bold">{cr.conName || ''}</td>
                  <td className="border border-black text-center p-1">{cr.oNo || ''}</td>
                  <td className="border border-black text-center p-1">{cr.poNo || ''}</td>
                  <td className="border border-black text-center p-1 font-semibold">{cr.divisionName || ''}</td>

                  {materialColumns.map(mat => {
                    const material = cr.materials?.find(m => m.name?.trim() === mat.trim());
                    const qty = material ? material.qty : 0;
                    return (
                      <td key={mat} className="border border-black text-center text-[11px] p-0.5">
                        {qty > 0 ? qty : '0'}
                      </td>
                    );
                  })}

                  <td className="border border-black text-right p-1 font-bold">{totalItems > 0 ? totalItems : '0'}</td>
                  <td className="border border-black text-center p-1 print:hidden">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleEditClick(cr)}
                        className="text-blue-600 hover:text-blue-800 p-1 cursor-pointer"
                        title="Edit Basic Details"
                      >
                        <Edit2 size={15} />
                      </button>
                      <button
                        onClick={() => handleDelete(cr._id, cr.receiptNo)}
                        className="text-rose-600 hover:text-rose-800 p-1 cursor-pointer"
                        title="Delete CR & Revert Balance"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}

            {/* Empty padding rows to make it look like the Excel sheet */}
            {!isLoading && Array.from({ length: Math.max(0, 15 - currentRecords.length) }).map((_, i) => (
              <tr key={`empty-${i}`}>
                <td className="border border-black p-1">&nbsp;</td>
                <td className="border border-black p-1"></td>
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
          {!isLoading && filteredReceipts.length > 0 && (
            <tfoot className="sticky bottom-0 z-10">
              <tr className="border-t-2 border-b-2 border-black bg-slate-100 font-bold">
                <td colSpan={7} className="border border-black text-right pr-4 text-sm sticky bottom-0 bg-slate-100">TOTAL :</td>
                {materialColumns.map(mat => (
                  <td key={`total-${mat}`} className="border border-black text-center text-blue-700 text-xs p-0.5 sticky bottom-0 bg-slate-100">
                    {columnTotals[mat] > 0 ? columnTotals[mat] : '0'}
                  </td>
                ))}
                <td className="border border-black text-right text-blue-700 text-xs pr-1 sticky bottom-0 bg-slate-100 font-extrabold">{grandTotal > 0 ? grandTotal : '0'}</td>
                <td className="border border-black print:hidden sticky bottom-0 bg-slate-100"></td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* Signature Block */}
      {!isLoading && filteredReceipts.length > 0 && (
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
      {totalPages > 1 && !isLoading && (
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

      {/* Edit CR Modal */}
      <Modal
        isOpen={Boolean(editingCR)}
        onClose={() => setEditingCR(null)}
        title="Edit Material Inward (CR)"
        size="md"
      >
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Receipt No</label>
              <input
                type="text"
                value={editFormData.receiptNo}
                onChange={e => setEditFormData({ ...editFormData, receiptNo: e.target.value })}
                className="w-full p-2 border border-slate-200 rounded text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Release No</label>
              <input
                type="text"
                value={editFormData.releaseNo}
                onChange={e => setEditFormData({ ...editFormData, releaseNo: e.target.value })}
                className="w-full p-2 border border-slate-200 rounded text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Contractor Name</label>
            <input
              type="text"
              value={editFormData.conName}
              onChange={e => setEditFormData({ ...editFormData, conName: e.target.value })}
              className="w-full p-2 border border-slate-200 rounded text-sm"
              placeholder="Enter Contractor Name"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">O.No</label>
              <input
                type="text"
                value={editFormData.oNo}
                onChange={e => setEditFormData({ ...editFormData, oNo: e.target.value })}
                className="w-full p-2 border border-slate-200 rounded text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">P.O.No.</label>
              <input
                type="text"
                value={editFormData.poNo}
                onChange={e => setEditFormData({ ...editFormData, poNo: e.target.value })}
                className="w-full p-2 border border-slate-200 rounded text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Division</label>
            <select
              className="w-full p-2 border border-slate-200 rounded text-sm bg-white"
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

          <div className="max-h-48 overflow-y-auto border border-slate-200 p-3 rounded bg-slate-50">
            <h4 className="text-xs font-semibold text-slate-700 mb-2">Edit Materials</h4>
            {materialColumns.map(mat => (
              <div key={mat} className="flex justify-between items-center mb-2">
                <label className="text-xs flex-1 pr-2 truncate text-slate-600" title={mat}>{mat}</label>
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
                  className="w-20 p-1 text-right border border-slate-200 rounded text-xs bg-white font-mono"
                />
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button 
              onClick={() => setEditingCR(null)} 
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
