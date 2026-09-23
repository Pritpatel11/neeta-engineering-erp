import React, { useState, useEffect } from 'react';
import { getInventoryBalances, updateInventoryBalance, getStoreReceipts, getStatements, getMaterials, getDivisions } from '../services/api';
import { Save, Plus, Printer, RefreshCw, Edit, X } from 'lucide-react';

export default function InventoryBalance() {
  const [balances, setBalances] = useState([]);
  const [receipts, setReceipts] = useState([]);
  const [statements, setStatements] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [divisions, setDivisions] = useState([]);
  const [selectedDivision, setSelectedDivision] = useState('Deesa');
  const [isSyncing, setIsSyncing] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [manualBalances, setManualBalances] = useState({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [balData, crData, stmtData, matsData, divsData] = await Promise.all([
        getInventoryBalances(),
        getStoreReceipts(),
        getStatements(),
        getMaterials(),
        getDivisions()
      ]);
      setBalances(balData);
      setReceipts(crData);
      setStatements(stmtData);
      setMaterials(matsData.map(m => m.name));
      
      const divNames = divsData.map(d => d.name);
      setDivisions(divNames);
      if (divNames.length > 0 && !divNames.includes(selectedDivision)) {
        setSelectedDivision(divNames[0]);
      }
    } catch (error) {
      console.error('Failed to fetch data', error);
    }
  };

  const handleDivisionChange = (e) => {
    setSelectedDivision(e.target.value);
  };

  const syncBalance = async () => {
    if (!window.confirm(`Are you sure you want to recalculate ${selectedDivision} balance from CR and Statement registers? Your manual adjustments will be preserved.`)) {
      return;
    }

    setIsSyncing(true);
    try {
      const divisionReceipts = receipts.filter(r => r.divisionName === selectedDivision);
      const divisionStatements = statements.filter(s => s.divisionName === selectedDivision);
      
      const materialsToUpdate = materials.map(item => {
        let crTotal = 0;
        divisionReceipts.forEach(r => {
          const mat = r.materials?.find(m => m.name === item);
          if (mat) crTotal += (mat.qty || 0);
        });
        
        let stmtTotal = 0;
        divisionStatements.forEach(s => {
          const mat = s.materials?.find(m => m.name === item);
          if (mat) stmtTotal += (mat.qty || 0);
        });

        const existingMat = currentDivisionData?.materials?.find(m => m.name === item);
        const adj = existingMat?.manualAdjustment || 0;
        
        return {
          name: item,
          manualAdjustment: adj,
          qty: crTotal - stmtTotal + adj
        };
      });

      await updateInventoryBalance({
        divisionName: selectedDivision,
        materials: materialsToUpdate
      });

      alert(`Balance for ${selectedDivision} successfully synced from registers.`);
      await fetchData();
    } catch (error) {
      console.error('Failed to sync balance', error);
      alert('Failed to sync balance');
    } finally {
      setIsSyncing(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleEditBalances = () => {
    const initialManual = {};
    materials.forEach(item => {
      const mat = currentDivisionData?.materials?.find(m => m.name === item);
      initialManual[item] = mat?.qty || 0;
    });
    setManualBalances(initialManual);
    setIsEditing(true);
  };

  const saveBalances = async () => {
    try {
      const divisionReceipts = receipts.filter(r => r.divisionName === selectedDivision);
      const divisionStatements = statements.filter(s => s.divisionName === selectedDivision);

      const materialsToUpdate = materials.map(item => {
        let crTotal = 0;
        divisionReceipts.forEach(r => {
          const mat = r.materials?.find(m => m.name === item);
          if (mat) crTotal += (mat.qty || 0);
        });
        
        let stmtTotal = 0;
        divisionStatements.forEach(s => {
          const mat = s.materials?.find(m => m.name === item);
          if (mat) stmtTotal += (mat.qty || 0);
        });

        const pureSyncQty = crTotal - stmtTotal;
        const existingMat = currentDivisionData?.materials?.find(m => m.name === item);
        const oldQty = existingMat ? existingMat.qty : 0;
        const newQty = manualBalances[item] !== undefined ? Number(manualBalances[item]) : oldQty;
        const manualAdjustment = newQty - pureSyncQty;

        return {
          name: item,
          qty: newQty,
          manualAdjustment: manualAdjustment
        };
      });

      await updateInventoryBalance({
        divisionName: selectedDivision,
        materials: materialsToUpdate
      });

      alert(`Balances successfully updated for ${selectedDivision}. Manual adjustments are locked and will be preserved during sync.`);
      setIsEditing(false);
      await fetchData();
    } catch (error) {
      console.error('Failed to save manual balances', error);
      alert('Failed to save balances');
    }
  };

  const currentDivisionData = balances.find(b => b.divisionName === selectedDivision);

  return (
    <div className="p-4 sm:p-6 print:p-0 print:bg-white">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6 print:hidden">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800">Fabrication Material Balance</h1>
          <p className="text-sm text-slate-500">Track and update stock balances for each division.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <select 
            className="bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-800 font-medium focus:outline-none focus:ring-1 focus:ring-[#0059bb] w-full sm:w-auto" 
            value={selectedDivision} 
            onChange={handleDivisionChange}
            disabled={isEditing}
          >
            {divisions.map(div => (
              <option key={div} value={div}>{div}</option>
            ))}
          </select>
          {isEditing ? (
            <>
              <button 
                onClick={saveBalances} 
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold text-xs sm:text-sm shadow-sm transition-all cursor-pointer"
              >
                <Save size={16} /> <span>Save Balances</span>
              </button>
              <button 
                onClick={() => setIsEditing(false)} 
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-xl font-semibold text-xs sm:text-sm shadow-sm transition-all cursor-pointer"
              >
                <X size={16} /> <span>Cancel</span>
              </button>
            </>
          ) : (
            <>
              <button 
                onClick={handleEditBalances} 
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#0059bb] hover:bg-[#004899] text-white rounded-xl font-semibold text-xs sm:text-sm shadow-sm transition-all cursor-pointer"
              >
                <Edit size={16} /> <span>Edit</span>
              </button>
              <button 
                onClick={syncBalance} 
                disabled={isSyncing} 
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold text-xs sm:text-sm shadow-sm transition-all cursor-pointer"
              >
                <RefreshCw size={16} className={isSyncing ? "animate-spin" : ""} /> <span>{isSyncing ? 'Syncing...' : 'Sync Registers'}</span>
              </button>
              <button 
                onClick={handlePrint} 
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-700 hover:bg-slate-800 text-white rounded-xl font-semibold text-xs sm:text-sm shadow-sm transition-all cursor-pointer"
              >
                <Printer size={16} /> <span>Print</span>
              </button>
            </>
          )}
        </div>
      </div>

      <div id="printable-area" className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-6 shadow-sm print:shadow-none print:border-none print:p-0 print:m-0">
        <div className="hidden print:block text-center relative min-h-[100px] mb-3">
          <img src="/logo address.png" alt="Neeta Engineering Works Logo" className="h-20 object-contain mx-auto" />
        </div>
        <div className="overflow-x-auto w-full">
          <table className="w-full border-collapse border-2 border-black text-black">
            <thead>
              <tr>
                <th colSpan="2" className="border-2 border-black p-3 text-center bg-slate-50 text-base sm:text-lg font-bold">
                  Fabrication material balance Date :- {new Date().toLocaleDateString('en-IN')}
                  <br/>
                  <span className="text-sm font-semibold text-[#0059bb]">Division: {selectedDivision}</span>
                </th>
              </tr>
              <tr>
                <th className="border-2 border-black p-3 text-left w-[70%] font-bold text-sm sm:text-base">Material Description</th>
                <th className="border-2 border-black p-3 text-right w-[30%] font-bold text-sm sm:text-base">Balance (Nos)</th>
              </tr>
            </thead>
            <tbody>
              {materials.map((item, index) => {
                const mat = currentDivisionData?.materials?.find(m => m.name === item);
                const qty = mat ? mat.qty : 0;
                
                return (
                  <tr key={index} className="hover:bg-slate-50/50">
                    <td className="border border-black border-l-2 border-l-black px-3 py-2 font-medium text-xs sm:text-sm">
                      {item}
                    </td>
                    <td className="border border-black border-r-2 border-r-black px-3 py-2 text-right text-xs sm:text-sm">
                      {isEditing ? (
                        <input 
                          type="number" 
                          value={manualBalances[item] !== undefined ? manualBalances[item] : qty}
                          onChange={(e) => setManualBalances({...manualBalances, [item]: e.target.value})}
                          className="w-24 text-right px-2 py-1 text-xs border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-[#0059bb]"
                        />
                      ) : (
                        <span className={`font-mono font-bold ${qty < 0 ? 'text-red-600' : 'text-slate-900'}`}>{qty}</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        {/* Signature Block */}
        <div className="hidden print:flex justify-end mt-8 pr-8">
          <div className="w-60 text-center flex flex-col items-center">
            <div className="flex justify-center mb-1">
              <img src="/sign.png" alt="Signature" className="h-16 object-contain" />
            </div>
            <div className="mb-1 text-sm tracking-widest text-slate-600">
              ...........................................
            </div>
            <div className="text-xs font-bold text-black uppercase">Authorized Signatory</div>
            <div className="text-[11px] text-slate-600 mt-0.5">For Neeta Engineering Works</div>
          </div>
        </div>
      </div>
    </div>
  );
}
