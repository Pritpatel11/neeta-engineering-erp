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
    <div className="p-6">
      <style>
        {`
          @media screen {
            .print-only, .print-only-flex { display: none !important; }
          }
          @media print {
            .print-only { display: block !important; min-height: 90px !important; margin-bottom: 5px !important; }
            .print-only-flex { display: flex !important; }
            .print-only img.print-logo { height: 80px !important; top: 0 !important; }
            body * {
              visibility: hidden;
            }
            #printable-area, #printable-area * {
              visibility: visible;
            }
            #printable-area {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
            }
            .glass-card { 
              box-shadow: none !important; 
              background: transparent !important; 
              margin: 0 !important; 
              padding: 0 !important; 
              border: none !important; 
            }
            table { width: 100% !important; border-collapse: collapse; page-break-inside: avoid; }
            tr { page-break-inside: avoid; page-break-after: auto; }
            td { padding: 4px 8px !important; font-size: 12px !important; }
            th { padding: 6px 8px !important; font-size: 14px !important; }
            .signature-block img { height: 60px !important; }
            .signature-block div { font-size: 11px !important; margin-bottom: 2px !important; }
            @page { size: A4 portrait; margin: 8mm; }
          }
        `}
      </style>
      <div className="flex justify-between items-center mb-6 no-print">
        <div>
          <h1 className="text-2xl font-bold">Fabrication Material Balance</h1>
          <p className="text-gray-500">Track and update stock balances for each division.</p>
        </div>
        <div className="flex gap-4">
          <select 
            className="form-control" 
            value={selectedDivision} 
            onChange={handleDivisionChange}
            style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
            disabled={isEditing}
          >
            {divisions.map(div => (
              <option key={div} value={div}>{div}</option>
            ))}
          </select>
          {isEditing ? (
            <>
              <button onClick={saveBalances} className="btn-primary flex items-center gap-2" style={{ backgroundColor: '#28a745' }}>
                <Save size={18} /> Save Balances
              </button>
              <button onClick={() => setIsEditing(false)} className="btn-secondary flex items-center gap-2" style={{ backgroundColor: '#6c757d', color: 'white', padding: '8px 16px', borderRadius: '6px', border: 'none' }}>
                <X size={18} /> Cancel
              </button>
            </>
          ) : (
            <>
              <button onClick={handleEditBalances} className="btn-primary flex items-center gap-2" style={{ backgroundColor: '#007bff' }}>
                <Edit size={18} /> Edit Balances
              </button>
              <button onClick={syncBalance} disabled={isSyncing} className="btn-primary flex items-center gap-2" style={{ backgroundColor: '#28a745' }}>
                <RefreshCw size={18} className={isSyncing ? "animate-spin" : ""} /> {isSyncing ? 'Syncing...' : 'Sync Balance from Registers'}
              </button>
              <button onClick={handlePrint} className="btn-primary flex items-center gap-2" style={{ backgroundColor: '#4b5563' }}>
                <Printer size={18} /> Print
              </button>
            </>
          )}
        </div>
      </div>

      <div id="printable-area" className="glass-card mt-6" style={{ background: 'white', borderRadius: '8px', padding: '20px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
        <div className="print-only" style={{ textAlign: 'center', position: 'relative', minHeight: '140px', paddingTop: '10px' }}>
          <img src="./logo address.png" alt="Neeta Engineering Works Logo" className="print-logo" style={{ position: 'absolute', left: '20px', top: '10px', height: '130px', objectFit: 'contain' }} />
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', border: '2px solid black' }}>
          <thead>
            <tr>
              <th colSpan="2" style={{ border: '2px solid black', padding: '12px', textAlign: 'center', background: '#f8f9fa', fontSize: '18px' }}>
                Fabrication material balance Date :- {new Date().toLocaleDateString('en-IN')}
                <br/>
                <span style={{ fontSize: '14px', color: 'blue' }}>Division: {selectedDivision}</span>
              </th>
            </tr>
            <tr>
              <th style={{ border: '2px solid black', padding: '12px', textAlign: 'left', width: '70%' }}>Material Description</th>
              <th style={{ border: '2px solid black', padding: '12px', textAlign: 'right', width: '30%' }}>Balance (Nos)</th>
            </tr>
          </thead>
          <tbody>
            {materials.map((item, index) => {
              const mat = currentDivisionData?.materials?.find(m => m.name === item);
              const qty = mat ? mat.qty : 0;
              
              return (
                <tr key={index}>
                  <td style={{ border: '1px solid black', borderLeft: '2px solid black', padding: '8px 12px', fontWeight: '500', fontSize: '14px' }}>
                    {item}
                  </td>
                  <td style={{ border: '1px solid black', borderRight: '2px solid black', padding: '8px 12px', textAlign: 'right' }}>
                    {isEditing ? (
                      <input 
                        type="number" 
                        value={manualBalances[item] !== undefined ? manualBalances[item] : qty}
                        onChange={(e) => setManualBalances({...manualBalances, [item]: e.target.value})}
                        style={{ width: '100px', textAlign: 'right', padding: '4px', border: '1px solid #ccc', borderRadius: '4px' }}
                      />
                    ) : (
                      <span style={{ fontWeight: 'bold', color: qty < 0 ? 'red' : 'inherit' }}>{qty}</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        
        {/* Signature Block */}
        <div className="print-only-flex" style={{ justifyContent: 'flex-end', marginTop: '10px', paddingRight: '40px', paddingBottom: '0' }}>
          <div className="signature-block" style={{ width: '250px', textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '5px' }}>
              <img src="./sign.png" alt="Signature" style={{ height: '100px', objectFit: 'contain' }} />
            </div>
            <div style={{ marginBottom: '8px', fontSize: '1rem', color: '#000' }}>
              ...........................................
            </div>
            <div style={{ fontSize: '0.875rem', fontWeight: '600', color: '#000' }}>Authorized Signatory</div>
            <div style={{ fontSize: '0.75rem', color: '#555', marginTop: '4px' }}>For Neeta Engineering Works</div>
          </div>
        </div>
      </div>
    </div>
  );
}
