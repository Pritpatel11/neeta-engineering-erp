import React, { useState, useEffect } from 'react';
import { getContractors, getMaterials, getChallans, getStatements } from '../services/api';
import { Printer, Building2, HardHat } from 'lucide-react';

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
    <div className="p-4 sm:p-6 bg-slate-50 min-h-screen print:bg-white print:p-0 print:min-h-0">
      {/* Non-printable controls */}
      <div className="print:hidden flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-white px-3.5 py-2 rounded-xl border border-slate-300 shadow-xs">
            <HardHat size={18} className="text-[#0059bb]" />
            <select 
              value={selectedContractor} 
              onChange={(e) => setSelectedContractor(e.target.value)}
              className="border-0 outline-none bg-transparent font-semibold text-sm text-slate-700 min-w-[180px]"
            >
              {contractors.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
        <button 
          onClick={handlePrint} 
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#0059bb] hover:bg-[#004c9e] text-white rounded-xl font-semibold text-xs sm:text-sm shadow-sm transition-all cursor-pointer"
        >
          <Printer size={16} /> <span>Print Ledger</span>
        </button>
      </div>

      {/* Printable Area */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-6 shadow-sm print:shadow-none print:border-none print:p-0 print:m-0">
        <div className="border-b-2 border-slate-700 pb-4 mb-6 relative min-h-[120px] text-center">
          <img src="/logo address.png" alt="Neeta Engineering Works Logo" className="hidden print:block absolute left-4 top-2 h-24 object-contain" />
          <h1 className="text-xl sm:text-2xl font-extrabold text-red-600 uppercase flex items-center justify-center gap-2.5">
            <Building2 size={28} />
            <span>CONTRACTOR MATERIAL LEDGER (WIP)</span>
          </h1>
          <h2 className="text-base sm:text-lg font-bold text-[#0059bb] uppercase mt-2">
            {selectedContractor ? selectedContractor.toUpperCase() : 'NO CONTRACTOR SELECTED'}
          </h2>
        </div>

        {isLoading ? (
          <div className="text-center py-10 text-slate-500 font-medium">Loading ledger data...</div>
        ) : (
          <div className="overflow-x-auto w-full">
            <table className="w-max min-w-full border-collapse border border-black text-xs font-sans table-fixed print:w-full print:text-[8px]">
              <colgroup>
                <col className="w-[180px] print:w-[18%]" />
                {materialColumns.map(mat => (
                  <col key={mat} className="w-[56px] print:w-auto" />
                ))}
                <col className="w-[70px] print:w-[6%]" />
              </colgroup>
              <thead>
                <tr className="bg-white">
                  <th className="border border-black p-2 text-left font-bold align-bottom">Transaction Details</th>
                  {materialColumns.map(mat => (
                    <th key={mat} className="border border-black p-1 text-center font-bold align-top break-all text-[9px] print:text-[7px] print:p-0.5">
                      {headerMap[mat] ? headerMap[mat].split('\n').map((line, i) => (
                        <div key={i}>{line}</div>
                      )) : mat.toUpperCase()}
                    </th>
                  ))}
                  <th className="border border-black p-2 text-center font-bold align-bottom">Total Items</th>
                </tr>
              </thead>
              <tbody>
                {/* Row 1: Total Issued (Challans) */}
                <tr>
                  <td className="border border-black p-2.5 font-bold text-blue-600 align-middle">
                    Total Issued (via Challans)
                  </td>
                  {materialColumns.map(mat => (
                    <td key={`issued-${mat}`} className="border border-black p-1 text-center font-bold text-blue-600 text-xs print:text-[8px] align-middle">
                      {totalIssued[mat] > 0 ? totalIssued[mat] : '-'}
                    </td>
                  ))}
                  <td className="border border-black p-1 text-center font-bold text-blue-600 text-xs sm:text-sm bg-slate-100 align-middle">
                    {Object.values(totalIssued).reduce((a, b) => a + b, 0)}
                  </td>
                </tr>

                {/* Row 2: Total Consumed (Statements) */}
                <tr>
                  <td className="border border-black p-2.5 font-bold text-emerald-600 align-middle">
                    Total Consumed (via Statements)
                  </td>
                  {materialColumns.map(mat => (
                    <td key={`consumed-${mat}`} className="border border-black p-1 text-center font-bold text-emerald-600 text-xs print:text-[8px] align-middle">
                      {totalConsumed[mat] > 0 ? totalConsumed[mat] : '-'}
                    </td>
                  ))}
                  <td className="border border-black p-1 text-center font-bold text-emerald-600 text-xs sm:text-sm bg-slate-100 align-middle">
                    {Object.values(totalConsumed).reduce((a, b) => a + b, 0)}
                  </td>
                </tr>
              </tbody>
              <tfoot>
                {/* Row 3: WIP Balance */}
                <tr className="border-t-2 border-black bg-amber-50">
                  <td className="border border-black p-2.5 font-bold text-red-600 text-xs sm:text-sm align-middle">
                    WIP Balance (with Contractor)
                  </td>
                  {materialColumns.map(mat => {
                    const bal = wipBalance[mat];
                    return (
                      <td key={`wip-${mat}`} className={`border border-black p-1 text-center font-bold text-xs print:text-[8px] align-middle ${
                        bal > 0 ? 'text-red-600' : (bal < 0 ? 'text-amber-600' : 'text-slate-500')
                      }`}>
                        {bal !== 0 ? bal : '-'}
                      </td>
                    );
                  })}
                  <td className="border border-black p-1 text-center font-bold text-red-600 text-xs sm:text-sm bg-amber-100 align-middle">
                    {Object.values(wipBalance).reduce((a, b) => a + b, 0)}
                  </td>
                </tr>
              </tfoot>
            </table>

            {/* Signature Block */}
            <div className="hidden print:flex justify-end mt-8 pr-10">
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
        )}
      </div>
    </div>
  );
}
