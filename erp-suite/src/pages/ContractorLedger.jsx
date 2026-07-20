import React, { useState, useEffect } from 'react';
import { getContractors, getMaterials, getChallans, getStatements } from '../services/api';
import { Printer, Building2, HardHat } from 'lucide-react';
import './StatementRegister.css'; // Reuse table styles

export default function ContractorLedger() {
  const [contractors, setContractors] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [challans, setChallans] = useState([]);
  const [statements, setStatements] = useState([]);
  const [selectedContractor, setSelectedContractor] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [contsData, matsData, challansData, statementsData] = await Promise.all([
          getContractors(),
          getMaterials(),
          getChallans(),
          getStatements()
        ]);
        
        const conts = contsData.map(c => c.name);
        setContractors(conts);
        if (conts.length > 0) setSelectedContractor(conts[0]);
        
        setMaterials(matsData.map(m => m.name));
        setChallans(challansData);
        setStatements(statementsData);
      } catch (error) {
        console.error("Failed to load ledger data", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const handlePrint = () => {
    window.print();
  };

  // Calculations
  const materialColumns = materials;
  const totalIssued = {};
  const totalConsumed = {};
  const wipBalance = {};

  materialColumns.forEach(mat => {
    totalIssued[mat] = 0;
    totalConsumed[mat] = 0;
    wipBalance[mat] = 0;
  });

  if (selectedContractor && !isLoading) {
    const contractorChallans = challans.filter(c => c.contractorName === selectedContractor);
    contractorChallans.forEach(c => {
      c.materials?.forEach(m => {
        if (totalIssued[m.name] !== undefined) {
          totalIssued[m.name] += (m.qty || 0);
        }
      });
    });

    const contractorStatements = statements.filter(s => s.contractorName === selectedContractor);
    contractorStatements.forEach(s => {
      s.materials?.forEach(m => {
        if (totalConsumed[m.name] !== undefined) {
          totalConsumed[m.name] += (m.qty || 0);
        }
      });
    });

    materialColumns.forEach(mat => {
      wipBalance[mat] = totalIssued[mat] - totalConsumed[mat];
    });
  }

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

  return (
    <div className="register-container">
      <style>
        {`
          .ledger-table {
            width: max-content;
            min-width: 100%;
            border-collapse: collapse;
            font-size: 12px;
            font-family: Arial, sans-serif;
            table-layout: fixed;
          }
          .ledger-table th, .ledger-table td {
            border: 1px solid black;
            padding: 4px 8px;
            vertical-align: middle;
          }
          .ledger-table th {
            background-color: white;
            font-weight: bold;
            text-align: center;
            vertical-align: bottom;
          }
          .ledger-table .material-header {
            font-size: 9px;
            padding: 2px !important;
            vertical-align: top !important;
            word-break: break-all;
          }
          @media print {
            @page { size: A4 landscape; margin: 5mm; }
            body * { visibility: hidden; }
            .register-container, .register-container * { visibility: visible; }
            .register-container { position: absolute; left: 0; top: 0; width: 100%; padding: 0; }
            .no-print { display: none !important; }
            .ledger-table {
              width: 100% !important;
              max-width: 100% !important;
              font-size: 8px !important;
              table-layout: fixed !important;
            }
            .ledger-table th, .ledger-table td {
              padding: 4px 2px !important;
              word-break: normal !important;
            }
            .ledger-table col {
              width: auto !important;
            }
            .ledger-table col.col-first {
              width: 18% !important;
            }
            .ledger-table col.col-last {
              width: 6% !important;
            }
            .ledger-table .material-header {
              font-size: 7px !important;
            }
          }
        `}
      </style>
      {/* Non-printable controls */}
      <div className="register-header-controls no-print" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'white', padding: '8px 16px', borderRadius: '8px', border: '1px solid #ced4da' }}>
            <HardHat size={20} className="text-primary" />
            <select 
              value={selectedContractor} 
              onChange={(e) => setSelectedContractor(e.target.value)}
              style={{ border: 'none', outline: 'none', background: 'transparent', fontWeight: 'bold', fontSize: '15px', color: '#495057', minWidth: '200px' }}
            >
              {contractors.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
        <button onClick={handlePrint} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Printer size={16} /> Print Ledger
        </button>
      </div>

      {/* Printable Area */}
      <div className="glass-card" style={{ padding: '24px', background: 'white', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
        <div className="register-title-section" style={{ borderBottom: '2px solid #343a40', paddingBottom: '16px', marginBottom: '24px', position: 'relative', minHeight: '140px', paddingTop: '10px', textAlign: 'center' }}>
          <img src="./logo address.png" alt="Neeta Engineering Works Logo" className="print-only" style={{ position: 'absolute', left: '20px', top: '10px', height: '130px', objectFit: 'contain' }} />
          <h1 className="register-main-title" style={{ fontSize: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
            <Building2 size={28} />
            CONTRACTOR MATERIAL LEDGER (WIP)
          </h1>
          <h2 className="register-sub-title" style={{ fontSize: '18px', color: '#0056b3', marginTop: '8px' }}>
            {selectedContractor ? selectedContractor.toUpperCase() : 'NO CONTRACTOR SELECTED'}
          </h2>
        </div>

        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#6c757d' }}>Loading ledger data...</div>
        ) : (
          <div className="register-table-wrapper" style={{ overflowX: 'auto' }}>
            <table className="ledger-table">
              <colgroup>
                <col className="col-first" style={{ width: '180px' }} />
                {materialColumns.map(mat => (
                  <col key={mat} style={{ width: '56px' }} />
                ))}
                <col className="col-last" style={{ width: '70px' }} />
              </colgroup>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: '8px' }}>Transaction Details</th>
                  {materialColumns.map(mat => (
                    <th key={mat} className="material-header">
                      {headerMap[mat] ? headerMap[mat].split('\n').map((line, i) => (
                        <div key={i}>{line}</div>
                      )) : mat.toUpperCase()}
                    </th>
                  ))}
                  <th>Total Items</th>
                </tr>
              </thead>
              <tbody>
                {/* Row 1: Total Issued (Challans) */}
                <tr>
                  <td style={{ padding: '12px', fontWeight: 'bold', color: '#0d6efd' }}>
                    Total Issued (via Challans)
                  </td>
                  {materialColumns.map(mat => (
                    <td key={`issued-${mat}`} className="text-center font-bold" style={{ color: '#0d6efd', fontSize: '13px' }}>
                      {totalIssued[mat] > 0 ? totalIssued[mat] : '-'}
                    </td>
                  ))}
                  <td className="text-center font-bold" style={{ color: '#0d6efd', fontSize: '14px', background: '#e9ecef' }}>
                    {Object.values(totalIssued).reduce((a, b) => a + b, 0)}
                  </td>
                </tr>

                {/* Row 2: Total Consumed (Statements) */}
                <tr>
                  <td style={{ padding: '12px', fontWeight: 'bold', color: '#198754' }}>
                    Total Consumed (via Statements)
                  </td>
                  {materialColumns.map(mat => (
                    <td key={`consumed-${mat}`} className="text-center font-bold" style={{ color: '#198754', fontSize: '13px' }}>
                      {totalConsumed[mat] > 0 ? totalConsumed[mat] : '-'}
                    </td>
                  ))}
                  <td className="text-center font-bold" style={{ color: '#198754', fontSize: '14px', background: '#e9ecef' }}>
                    {Object.values(totalConsumed).reduce((a, b) => a + b, 0)}
                  </td>
                </tr>
              </tbody>
              <tfoot>
                {/* Row 3: WIP Balance */}
                <tr style={{ borderTop: '3px solid #343a40' }}>
                  <td style={{ padding: '12px', fontWeight: 'bold', color: '#dc3545', fontSize: '14px', background: '#fff3cd' }}>
                    WIP Balance (with Contractor)
                  </td>
                  {materialColumns.map(mat => {
                    const bal = wipBalance[mat];
                    return (
                      <td key={`wip-${mat}`} className="text-center font-bold" style={{ 
                        color: bal > 0 ? '#dc3545' : (bal < 0 ? '#ffc107' : '#6c757d'), 
                        fontSize: '14px',
                        background: '#fff3cd'
                      }}>
                        {bal !== 0 ? bal : '-'}
                      </td>
                    );
                  })}
                  <td className="text-center font-bold" style={{ color: '#dc3545', fontSize: '15px', background: '#ffe69c' }}>
                    {Object.values(wipBalance).reduce((a, b) => a + b, 0)}
                  </td>
                </tr>
              </tfoot>
            </table>

            {/* Signature Block */}
            <div className="document-footer print-only-flex" style={{ justifyContent: 'flex-end', marginTop: '20px', paddingRight: '40px', paddingBottom: '0' }}>
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
            
          </div>
        )}
      </div>
    </div>
  );
}
