import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Printer, ArrowLeft } from 'lucide-react';

export default function ChallanPreview() {
  const location = useLocation();
  const navigate = useNavigate();
  const [paperSize, setPaperSize] = React.useState('A4');
  const [printLayout, setPrintLayout] = React.useState('portrait');
  const [marginTop, setMarginTop] = React.useState('0');
  const [marginBottom, setMarginBottom] = React.useState('0');
  const [marginLeft, setMarginLeft] = React.useState('0');
  const [marginRight, setMarginRight] = React.useState('0');
  const [isGeneratingPdf, setIsGeneratingPdf] = React.useState(false);

  const challanData = location.state?.challanData;

  useEffect(() => {
    // If accessed directly without data, go back to create
    if (!challanData) {
      navigate('/create-challan');
    }
  }, [challanData, navigate]);

  if (!challanData) return null;

  const handlePrint = () => {
    window.print();
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    if (dateString.includes('-') && dateString.split('-')[0].length === 4) {
      const parts = dateString.split('-');
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateString;
  };

  return (
    <div className="flex flex-col items-center p-4 sm:p-6 bg-slate-100 min-h-screen print:bg-white print:p-0 print:min-h-0">
      {/* Actions header (Hidden when printing) */}
      <div className="print:hidden w-full max-w-4xl flex flex-wrap items-center justify-between gap-3 mb-6 bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/90 shadow-xs">
        <button 
          className="inline-flex items-center gap-2 px-3.5 py-2 bg-white border border-slate-300 text-[#0059bb] rounded-xl font-semibold text-xs sm:text-sm hover:bg-slate-50 transition-colors cursor-pointer" 
          onClick={() => navigate('/create-challan', { state: { challanData: challanData }, replace: true })}
        >
          <ArrowLeft size={16} /> <span>Back to Edit</span>
        </button>

        <div className="flex flex-wrap items-center gap-3 bg-slate-50 border border-slate-200/80 px-3 py-2 rounded-xl text-xs">
          <div className="flex items-center gap-1.5">
            <label className="font-bold text-slate-700">Paper:</label>
            <select
              value={paperSize}
              onChange={(e) => setPaperSize(e.target.value)}
              className="bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs text-slate-800 font-medium focus:outline-none focus:ring-1 focus:ring-[#0059bb]"
            >
              <option value="A4">A4 Standard</option>
              <option value="150mm 210mm">Custom (150x210)</option>
            </select>
          </div>

          <div className="hidden sm:block w-px h-5 bg-slate-300"></div>

          <div className="flex items-center gap-1.5">
            <label className="font-bold text-slate-700">Layout:</label>
            <select
              value={printLayout}
              onChange={(e) => setPrintLayout(e.target.value)}
              className="bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs text-slate-800 font-medium focus:outline-none focus:ring-1 focus:ring-[#0059bb]"
              disabled={paperSize !== 'A4'}
            >
              <option value="portrait">Portrait</option>
              <option value="landscape">Landscape</option>
            </select>
          </div>
        </div>

        <button 
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#0059bb] hover:bg-[#004899] text-white rounded-xl font-semibold text-xs sm:text-sm shadow-sm transition-all cursor-pointer" 
          onClick={handlePrint}
        >
          <Printer size={16} /> <span>Print Challan</span>
        </button>
      </div>

      {/* The Printable Document Scroll Container */}
      <div className="w-full overflow-x-auto flex justify-center py-2 print:p-0 print:overflow-visible">
        <div className="bg-white w-full max-w-[800px] p-6 shadow-md border border-slate-300 text-black flex flex-col print:p-0 print:m-0 print:border-none print:shadow-none print:max-w-none print:w-full">
          <div className="flex justify-between items-start border-b-2 border-black pb-2.5 mb-2">
            <div>
              <img src="/logo address.png" alt="Neeta Engineering Works Logo" className="h-[90px] object-contain mb-1" />
              <h1 className="text-2xl font-extrabold text-black uppercase mb-1">Neeta Engineering Works</h1>
              <p className="text-xs sm:text-sm text-slate-800 leading-tight">179, GIDC Main Road, Navadisa Road, Chandisar, Banaskantha, Gujarat 385510</p>
              <p className="text-xs sm:text-sm font-semibold text-slate-800 leading-tight mt-0.5">GSTNO: 24ABHPP5386L1Z3</p>
            </div>
            <div className="text-right">
              <h2 className="text-sm sm:text-base font-bold text-black uppercase tracking-wider border border-black px-3 py-1 mb-1">
                DELIVERY CHALLAN
              </h2>
              <p className="text-xs italic text-slate-600">(Duplicate for Transporter)</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 mb-3 text-xs sm:text-sm">
            <div className="flex flex-col gap-1">
              <div className="flex">
                <span className="font-bold w-28 text-black">Challan No:</span>
                <span className="font-mono text-slate-900">{challanData.challanNo}</span>
              </div>
              <div className="flex">
                <span className="font-bold w-28 text-black">Date:</span>
                <span className="text-slate-900">{formatDate(challanData.date)}</span>
              </div>
              <div className="flex">
                <span className="font-bold w-28 text-black">Contractor:</span>
                <span className="text-slate-900 font-medium">{challanData.contractorName}</span>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <div className="flex">
                <span className="font-bold w-28 text-black">Gate Pass No:</span>
                <span className="text-slate-900">{challanData.gatePassNo}</span>
              </div>
              <div className="flex">
                <span className="font-bold w-28 text-black">Gate Pass Date:</span>
                <span className="text-slate-900">{formatDate(challanData.gatePassDate)}</span>
              </div>
              <div className="flex">
                <span className="font-bold w-28 text-black">Division:</span>
                <span className="text-slate-900">{challanData.divisionName}</span>
              </div>
              <div className="flex">
                <span className="font-bold w-28 text-black">Sub-Division:</span>
                <span className="text-slate-900">{challanData.subDivisionName}</span>
              </div>
            </div>
          </div>

          <div className="border-t border-b border-black py-2 mb-4 grid grid-cols-2 gap-6 text-xs sm:text-sm">
            <div className="flex">
              <span className="font-bold w-28 text-black">Vehicle Number:</span>
              <span className="text-slate-900 font-mono font-medium">{challanData.vehicleNumber}</span>
            </div>
            <div className="flex">
              <span className="font-bold w-28 text-black">Driver Name:</span>
              <span className="text-slate-900">{challanData.driverName || 'N/A'}</span>
            </div>
          </div>

          <div className="overflow-x-auto mb-4">
            <table className="w-full border-collapse text-xs sm:text-sm border border-black">
              <thead>
                <tr className="bg-slate-100">
                  <th className="border border-black px-2 py-1.5 text-center w-14 font-bold text-black uppercase">S.No</th>
                  <th className="border border-black px-3 py-1.5 text-left font-bold text-black uppercase">Description of Goods</th>
                  <th className="border border-black px-2 py-1.5 text-center w-20 font-bold text-black uppercase">Unit</th>
                  <th className="border border-black px-3 py-1.5 text-right w-28 font-bold text-black uppercase">Quantity</th>
                </tr>
              </thead>
              <tbody>
                {challanData.materials.map((item, index) => (
                  <tr key={item.id || index}>
                    <td className="border border-black px-2 py-1.5 text-center text-slate-800">{index + 1}</td>
                    <td className="border border-black px-3 py-1.5 font-medium text-slate-900">{item.name}</td>
                    <td className="border border-black px-2 py-1.5 text-center text-slate-800">{item.unit}</td>
                    <td className="border border-black px-3 py-1.5 text-right font-mono font-semibold text-slate-900">{item.qty}</td>
                  </tr>
                ))}
                {/* Fill empty rows to make it look like a standard table format if items are few */}
                {Array.from({ length: Math.max(0, 3 - challanData.materials.length) }).map((_, i) => (
                  <tr key={`empty-${i}`} className="h-8">
                    <td className="border border-black px-2 py-1.5"></td>
                    <td className="border border-black px-3 py-1.5"></td>
                    <td className="border border-black px-2 py-1.5"></td>
                    <td className="border border-black px-3 py-1.5"></td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-slate-50 font-bold">
                  <td colSpan="3" className="border border-black px-3 py-2 text-right text-black">Total Items:</td>
                  <td className="border border-black px-3 py-2 text-right font-mono text-black">
                    {challanData.materials.reduce((sum, item) => sum + item.qty, 0)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div className="flex justify-between items-end mt-auto pt-10">
            <div className="flex flex-col items-center w-52 text-center">
              <div className="text-slate-500 tracking-widest text-xs mb-1">
                ...........................................
              </div>
              <div className="text-xs font-bold text-black uppercase">Driver's Signature</div>
            </div>

            <div className="flex flex-col items-center w-56 text-center relative">
              <div className="absolute bottom-full left-0 w-full flex justify-center -mb-9">
                <img src="/sign.png" alt="Signature" className="h-20 object-contain" />
              </div>
              <div className="text-slate-500 tracking-widest text-xs mb-1">
                ...........................................
              </div>
              <div className="text-xs font-bold text-black uppercase">Authorized Signatory</div>
              <div className="text-[11px] text-slate-600 mt-0.5">For Neeta Engineering Works</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
