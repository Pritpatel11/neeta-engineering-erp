import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Printer, ArrowLeft } from 'lucide-react';

export default function StatementPreview() {
  const location = useLocation();
  const navigate = useNavigate();
  const [printLayout, setPrintLayout] = React.useState('landscape');
  
  const statementData = location.state?.statementData;

  useEffect(() => {
    if (!statementData) {
      navigate('/create-statement');
    }
  }, [statementData, navigate]);

  if (!statementData) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex flex-col items-center p-4 sm:p-6 bg-slate-100 min-h-screen print:bg-white print:p-0 print:min-h-0">
      <div className="print:hidden w-full max-w-5xl flex flex-wrap items-center justify-between gap-3 mb-6 bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/90 shadow-xs">
        <button 
          className="inline-flex items-center gap-2 px-3.5 py-2 bg-white border border-slate-300 text-[#0059bb] rounded-xl font-semibold text-xs sm:text-sm hover:bg-slate-50 transition-colors cursor-pointer" 
          onClick={() => navigate('/create-statement', { state: { statementData: statementData }, replace: true })}
        >
          <ArrowLeft size={16} /> <span>Back to Edit</span>
        </button>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/80 px-3 py-1.5 rounded-xl text-xs">
            <label className="font-bold text-slate-700">Print Layout:</label>
            <select 
              value={printLayout} 
              onChange={(e) => setPrintLayout(e.target.value)}
              className="bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs text-slate-800 font-medium focus:outline-none focus:ring-1 focus:ring-[#0059bb]"
            >
              <option value="portrait">Portrait</option>
              <option value="landscape">Landscape</option>
            </select>
          </div>
          <button 
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#0059bb] hover:bg-[#004899] text-white rounded-xl font-semibold text-xs sm:text-sm shadow-sm transition-all cursor-pointer" 
            onClick={handlePrint}
          >
            <Printer size={16} /> <span>Print Statement</span>
          </button>
        </div>
      </div>

      <div className="w-full overflow-x-auto flex justify-center py-2 print:p-0 print:overflow-visible">
        <div className="bg-white w-full max-w-[1100px] p-6 shadow-md border border-slate-300 text-black flex flex-col font-sans print:p-0 print:m-0 print:border-none print:shadow-none print:max-w-none print:w-full print:scale-95 print:origin-top-left">
        
        {(() => {
          const govtItems = [
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
          const actualMrNumbers = statementData.mrNumbers || [];
          const minColumns = 7;
          const paddedMrNumbers = [...actualMrNumbers];
          while (paddedMrNumbers.length < minColumns) {
            paddedMrNumbers.push('');
          }
          const contractorColSpan = Math.max(1, paddedMrNumbers.length - 2);

          const tdClass = "border border-black px-2 py-1 text-center font-normal text-black print:py-0.5 print:px-1 print:text-[11px]";
          const thClass = "border border-black px-2 py-1 text-center font-bold text-black print:py-0.5 print:px-1 print:text-[11px]";

          return (
            <>
              {/* Header Section */}
              <div className="flex items-start justify-between mb-2">
                <div className="flex flex-col items-start">
                  <img src="/logo address.png" alt="Neeta Engineering Works Logo" className="h-20 object-contain mb-1" />
                  <h1 className="m-0 text-2xl font-bold text-black">Neeta Engineering Works</h1>
                  <p className="my-0.5 text-sm text-slate-700">179, GIDC Main Road, Navadisa Road, Chandisar, Banaskantha, Gujarat 385510</p>
                  <p className="my-0.5 text-sm text-slate-700">GSTNO: 24ABHPP5386L1Z3</p>
                </div>
                <div className="self-start text-right">
                   <h2 className="m-0 text-xl font-bold text-black">Estimate Ready Material</h2>
                </div>
              </div>

              {/* The Exact Image Table Format */}
              <table className="w-full border-collapse border border-black text-xs print:text-[11px]">
                <thead>
                  {/* Row 1 */}
                  <tr>
                    <th className={`${thClass} w-56 text-left`}>fabrication material issud G.P</th>
                    <th className={thClass}>Con Name</th>
                    <th className={thClass} colSpan={contractorColSpan}>{statementData.contractorName}</th>
                    <th className={thClass}>Date</th>
                    <th className={thClass}>Lot No.</th>
                  </tr>
                  
                  {/* Row 2 */}
                  <tr>
                    <th className={`${thClass} text-amber-600 text-left`}>{statementData.divisionName} Divasion</th>
                    <th className={thClass}>S/Dn Name</th>
                    <th className={thClass} colSpan={contractorColSpan}>{statementData.subDivisionName}</th>
                    <th className={thClass}>
                      {statementData.date && statementData.date.includes('-') && statementData.date.split('-')[0].length === 4 
                        ? `${statementData.date.split('-')[2]}/${statementData.date.split('-')[1]}/${statementData.date.split('-')[0]}` 
                        : statementData.date}
                    </th>
                    <th className={thClass}>{statementData.statementNo}</th>
                  </tr>
                  
                  {/* Row 3 */}
                  <tr>
                    <th className={thClass}>MR.NO</th>
                    {paddedMrNumbers.map((mr, i) => (
                      <th key={`mr-${i}`} className={thClass}>{mr}</th>
                    ))}
                    <th className={thClass}>Totel</th>
                  </tr>

                  {/* Row 4 */}
                  <tr>
                    <th className={thClass}>P.O.No.</th>
                    {paddedMrNumbers.map((mr, i) => (
                      <th key={`po-${i}`} className={thClass}>
                        {mr && statementData.poNumbers && statementData.poNumbers[mr] 
                          ? statementData.poNumbers[mr] 
                          : (mr && statementData.poNo && statementData.poNo !== 'Multiple' ? statementData.poNo : '')}
                      </th>
                    ))}
                    <th className={thClass}></th>
                  </tr>

                  {/* Row 5 */}
                  <tr>
                    <th className={thClass}>Rel No.</th>
                    {paddedMrNumbers.map((mr, i) => (
                      <th key={`rel-${i}`} className={thClass}>
                        {mr && statementData.relNumbers && statementData.relNumbers[mr] 
                          ? statementData.relNumbers[mr] 
                          : (mr && statementData.relNo && statementData.relNo !== 'Multiple' ? statementData.relNo : '')}
                      </th>
                    ))}
                    <th className={thClass}></th>
                  </tr>
                </thead>
                
                <tbody>
                  {/* 1. Standard Govt Items Fixed Rows */}
                  {govtItems.map((itemName, index) => {
                    const item = statementData.materials.find(m => m.name === itemName) || { name: itemName };
                    return (
                      <tr key={`govt-${index}`}>
                        <td className={`${tdClass} text-left font-bold`}>{item.name}</td>
                        {paddedMrNumbers.map((mr, i) => (
                          <td key={`qty-${i}`} className={`${tdClass} font-bold`}>
                            {mr && item.mrQuantities && item.mrQuantities[mr] ? item.mrQuantities[mr] : ''}
                          </td>
                        ))}
                        <td className={`${tdClass} font-bold`}>{item.qty || ''}</td>
                      </tr>
                    );
                  })}
                  
                  {/* 2. Any Extra Items Added by User */}
                  {statementData.materials.filter(m => !govtItems.includes(m.name)).map((item, index) => (
                    <tr key={`extra-${index}`}>
                      <td className={`${tdClass} text-left font-bold`}>{item.name}</td>
                      {paddedMrNumbers.map((mr, i) => (
                        <td key={`qty-${i}`} className={`${tdClass} font-bold`}>
                          {mr && item.mrQuantities && item.mrQuantities[mr] ? item.mrQuantities[mr] : ''}
                        </td>
                      ))}
                      <td className={`${tdClass} font-bold`}>{item.qty || ''}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Footer Signatures */}
              <div className="flex justify-end mt-20 px-5">
                <div className="flex items-center gap-20">
                  <div className="text-center relative">
                    <div className="absolute bottom-full left-0 w-full flex justify-center -mb-2">
                      <img src="/sign.png" alt="Signature" className="h-16 object-contain" />
                    </div>
                    <div className="border-t border-dashed border-black w-52 pt-1 text-sm font-bold">
                      Authorized Signatory
                    </div>
                    <div className="text-xs mt-0.5 text-slate-700">For Neeta Engineering Works</div>
                  </div>
                </div>
              </div>
            </>
          );
        })()}
      </div>
      </div>
    </div>
  );
}
