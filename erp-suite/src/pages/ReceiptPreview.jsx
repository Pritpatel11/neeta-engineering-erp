import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Printer, ArrowLeft } from 'lucide-react';

function numberToWordsWithDecimal(num) {
  if (!num) return '';
  const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  
  const numToWords = (n) => {
    if ((n = n.toString()).length > 9) return 'overflow';
    let nArray = ('000000000' + n).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
    if (!nArray) return;
    let str = '';
    str += (nArray[1] != 0) ? (a[Number(nArray[1])] || b[nArray[1][0]] + ' ' + a[nArray[1][1]]) + 'Crore ' : '';
    str += (nArray[2] != 0) ? (a[Number(nArray[2])] || b[nArray[2][0]] + ' ' + a[nArray[2][1]]) + 'Lac ' : '';
    str += (nArray[3] != 0) ? (a[Number(nArray[3])] || b[nArray[3][0]] + ' ' + a[nArray[3][1]]) + 'Thousand ' : '';
    str += (nArray[4] != 0) ? (a[Number(nArray[4])] || b[nArray[4][0]] + ' ' + a[nArray[4][1]]) + 'Hundred ' : '';
    str += (nArray[5] != 0) ? (a[Number(nArray[5])] || b[nArray[5][0]] + ' ' + a[nArray[5][1]]) : '';
    return str.trim().replace(/ +/g, ' ');
  };

  const parts = Number(num).toFixed(2).split('.');
  const rupees = parseInt(parts[0], 10);
  const paise = parseInt(parts[1], 10);

  let result = '';
  if (rupees > 0) {
    result += numToWords(rupees) + ' Rupees';
  } else {
    result += 'Zero Rupees';
  }

  if (paise > 0) {
    result += ' and ' + numToWords(paise) + ' Paise';
  }
  
  result += ' Only';
  return result.toUpperCase();
}

export default function ReceiptPreview() {
  const location = useLocation();
  const navigate = useNavigate();
  const { receipt } = location.state || {};

  useEffect(() => {
    if (!receipt) {
      alert("No receipt data found!");
      navigate('/receipt-management');
    }
  }, [receipt, navigate]);

  if (!receipt) return null;

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

  const amountInWords = numberToWordsWithDecimal(receipt.amount);

  return (
    <div className="p-4 sm:p-6 bg-slate-100 min-h-screen print:bg-white print:p-0 print:min-h-0 font-sans text-xs text-black flex flex-col items-center">
      <div className="print:hidden w-full max-w-[210mm] flex items-center justify-between gap-4 mb-6 bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/90 shadow-xs">
        <button 
          className="inline-flex items-center gap-2 px-3.5 py-2 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-xl font-semibold text-xs sm:text-sm transition-colors cursor-pointer" 
          onClick={() => navigate('/receipt-management', { replace: true })}
        >
          <ArrowLeft size={16} /> Back
        </button>
        <button 
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#0059bb] hover:bg-[#004c9e] text-white rounded-xl font-semibold text-xs sm:text-sm shadow-sm transition-all cursor-pointer" 
          onClick={handlePrint}
        >
          <Printer size={18} /> Print / Save PDF
        </button>
      </div>

      <div className="w-full overflow-x-auto flex justify-center py-2 print:p-0 print:overflow-visible">
        <div className="bg-white w-full max-w-[210mm] p-6 shadow-md border border-slate-300 text-black box-border print:shadow-none print:border-none print:p-0 print:m-0 print:max-w-none print:w-full">
          <div className="border-2 border-dashed border-black p-6 sm:p-8 min-h-[350px] flex flex-col">
            
            {/* Header */}
            <div className="flex justify-between items-start gap-4 mb-8">
              <div className="flex flex-col gap-1">
                <div className="text-xs text-slate-600 font-medium">RECEIPT NO.</div>
                <div className="text-sm font-bold font-mono text-black">{receipt.receiptNo}</div>
              </div>
              <div className="text-center flex-1">
                <div className="text-xl sm:text-2xl font-extrabold uppercase tracking-wide text-black mb-1">Neeta Engineering Works</div>
                <div className="text-xs text-slate-700">179, G.I.D.C., CHANDISAR (B.K.)</div>
              </div>
              <div className="flex flex-col gap-1 text-right">
                <div className="text-xs text-slate-600 font-medium">DATE</div>
                <div className="text-sm font-semibold text-black">{formatDate(receipt.date)}</div>
              </div>
            </div>

            {/* Body */}
            <div className="flex flex-col gap-4 mb-8 text-sm">
              <div className="flex items-baseline border-b border-dotted border-slate-400 pb-1">
                <span className="text-xs font-semibold text-slate-700 whitespace-nowrap">Received With thanks from M/s.</span>
                <span className="flex-1 font-bold text-black pl-4">{receipt.partyName}</span>
              </div>
              
              <div className="flex items-baseline border-b border-dotted border-slate-400 pb-1">
                <span className="text-xs font-semibold text-slate-700 whitespace-nowrap">Rupees in word</span>
                <span className="flex-1 font-semibold uppercase text-black pl-4 text-xs sm:text-sm">{amountInWords}</span>
              </div>

              <div className="flex items-baseline border-b border-dotted border-slate-400 pb-1">
                <span className="text-xs font-semibold text-slate-700 whitespace-nowrap">By Cash/Cheque No.</span>
                <span className="flex-1 font-mono font-medium text-black pl-4">{receipt.chequeNo || 'N/A'}</span>
              </div>

              <div className="flex flex-wrap items-baseline gap-6 border-b border-dotted border-slate-400 pb-1">
                <div className="flex items-baseline">
                  <span className="text-xs font-semibold text-slate-700 whitespace-nowrap">Payment of our Bill No.</span>
                  <span className="font-mono font-medium text-black pl-3">{receipt.billNo || 'N/A'}</span>
                </div>
                <div className="flex items-baseline">
                  <span className="text-xs font-semibold text-slate-700 whitespace-nowrap">BILL DATE:</span>
                  <span className="font-medium text-black pl-3">{formatDate(receipt.billDate)}</span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-auto flex justify-between items-end gap-4">
              <div className="flex flex-col">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-lg font-bold text-black">Rs.</span>
                  <div className="border-2 border-black px-4 py-1.5 text-lg font-bold font-mono min-w-[140px] text-right">
                    {receipt.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </div>
                </div>
                
                <div className="text-[10px] text-slate-600 leading-snug">
                  (Payment by Cheque is Subject to realisation) No receipt is<br/>
                  Valid except on this form.
                </div>
              </div>
              
              <div className="flex flex-col items-center">
                <div className="text-xs font-semibold text-black mb-1">For, Neeta Engineering Works.</div>
                <div className="w-14 h-14 border-2 border-black mt-1"></div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
