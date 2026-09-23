import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Printer, ArrowLeft } from 'lucide-react';
import { getQuotation } from '../services/api';

function numberToWords(num) {
  if (!num) return '';
  num = Math.floor(num);
  const a = ['','One ','Two ','Three ','Four ', 'Five ','Six ','Seven ','Eight ','Nine ','Ten ','Eleven ','Twelve ','Thirteen ','Fourteen ','Fifteen ','Sixteen ','Seventeen ','Eighteen ','Nineteen '];
  const b = ['', '', 'Twenty','Thirty','Forty','Fifty', 'Sixty','Seventy','Eighty','Ninety'];
  if ((num = num.toString()).length > 9) return 'Amount too large';
  let n = ('000000000' + num).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
  if (!n) return; let str = '';
  str += (n[1] != 0) ? (a[Number(n[1])] || b[n[1][0]] + ' ' + a[n[1][1]]) + 'Crore ' : '';
  str += (n[2] != 0) ? (a[Number(n[2])] || b[n[2][0]] + ' ' + a[n[2][1]]) + 'Lakh ' : '';
  str += (n[3] != 0) ? (a[Number(n[3])] || b[n[3][0]] + ' ' + a[n[3][1]]) + 'Thousand ' : '';
  str += (n[4] != 0) ? (a[Number(n[4])] || b[n[4][0]] + ' ' + a[n[4][1]]) + 'Hundred ' : '';
  str += (n[5] != 0) ? ((str != '') ? 'and ' : '') + (a[Number(n[5])] || b[n[5][0]] + ' ' + a[n[5][1]]) + 'Only' : 'Only';
  return str.trim() === 'Only' ? 'Zero Only' : str.trim();
}

export default function QuotationPreview() {
  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(location.search);
  const idFromUrl = searchParams.get('id');
  
  const [quotationData, setQuotationData] = useState(location.state?.quotationData || null);
  const [loading, setLoading] = useState(!location.state?.quotationData && !!idFromUrl);

  useEffect(() => {
    if (!quotationData && idFromUrl) {
      getQuotation(idFromUrl)
        .then(data => {
          setQuotationData(data);
        })
        .catch(err => {
          console.error("Failed to load quotation", err);
          navigate('/quotations');
        })
        .finally(() => setLoading(false));
    } else if (!quotationData && !idFromUrl) {
      navigate('/quotations');
    }
  }, [quotationData, idFromUrl, navigate]);

  if (loading) return <div style={{ padding: 20, textAlign: 'center' }}>Loading Quotation...</div>;
  if (!quotationData) return null;

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

  const isEstimate = quotationData.taxPercentage === 0;
  const docTitle = quotationData.documentType ? quotationData.documentType.toUpperCase() : (isEstimate ? 'ESTIMATE / PROFORMA' : 'QUOTATION');

  return (
    <div className="p-4 sm:p-6 bg-slate-100 min-h-screen print:bg-white print:p-0 print:min-h-0 font-sans text-xs text-black flex flex-col items-center">
      <div className="print:hidden w-full max-w-[210mm] flex items-center justify-between gap-4 mb-6 bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/90 shadow-xs">
        <button 
          className="inline-flex items-center gap-2 px-3.5 py-2 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-xl font-semibold text-xs sm:text-sm transition-colors cursor-pointer" 
          onClick={() => navigate('/create-quotation', { state: { quotationData: quotationData }, replace: true })}
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
        <div className="bg-white w-full max-w-[210mm] shadow-md border border-slate-300 text-black box-border print:shadow-none print:border-none print:p-0 print:m-0 print:max-w-none print:w-full">
          <div className="text-center font-bold text-base p-2 border-b border-black">
            {docTitle}
          </div>
          
          <div className="border border-black w-full flex flex-col">
            <div className="flex border-b border-black">
              <div className="w-1/2 border-r border-black flex flex-col">
                <div className="p-2.5 flex-1 border-b border-black">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-base font-bold text-black mb-1">Neeta Engineering Works</div>
                      <div className="text-xs text-slate-800">179, GIDC Main Road, Navadisa Road,</div>
                      <div className="text-xs text-slate-800">Chandisar, Banaskantha, Gujarat 385510</div>
                      <div className="text-xs text-slate-800 mt-1">GSTIN/UIN: <strong>24ABHPP5386L1Z3</strong></div>
                      <div className="text-xs text-slate-800">E-Mail: neeta5788@gmail.com</div>
                    </div>
                    <img src="/logo address.png" alt="Logo" className="h-16 object-contain" />
                  </div>
                </div>
                <div className="p-2.5 flex-1">
                  <div className="text-[10px] text-slate-600 mb-1 uppercase font-semibold">Buyer (Bill to)</div>
                  <div className="font-bold text-sm text-black">{quotationData.clientName}</div>
                  <div className="text-xs text-slate-800">{quotationData.clientAddress}</div>
                  {quotationData.buyerState && <div className="text-xs mt-0.5">State: <strong>{quotationData.buyerState} {quotationData.buyerStateCode ? `(Code: ${quotationData.buyerStateCode})` : ''}</strong></div>}
                  {quotationData.clientGST && <div className="text-xs mt-0.5">GSTIN/UIN: <strong>{quotationData.clientGST}</strong></div>}
                </div>
              </div>
              
              <div className="w-1/2 flex flex-col">
                <div className="grid grid-cols-2 h-full text-xs">
                  <div className="p-2 border-b border-r border-black">
                    <div className="text-[10px] text-slate-600">{docTitle} No.</div>
                    <div className="font-bold text-sm text-black mt-0.5">{quotationData.quotationNo}</div>
                  </div>
                  <div className="p-2 border-b border-black">
                    <div className="text-[10px] text-slate-600">Dated</div>
                    <div className="font-bold text-sm text-black mt-0.5">{formatDate(quotationData.date)}</div>
                  </div>
                  <div className="col-span-2 p-2 border-b border-black">
                    <div className="text-[10px] text-slate-600">Subject / Reference</div>
                    <div className="text-xs text-slate-800 mt-0.5">
                      {quotationData.subject || 'As per your requirement'}
                    </div>
                  </div>
                  <div className="p-2 border-b border-r border-black">
                    <div className="text-[10px] text-slate-600">Terms of Payment</div>
                    <div className="text-xs text-slate-800 mt-0.5">Immediate</div>
                  </div>
                  <div className="p-2 border-b border-black">
                    <div className="text-[10px] text-slate-600">Contact No.</div>
                    <div className="text-xs text-slate-800 mt-0.5">
                      {quotationData.clientPhone || 'N/A'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-b border-black min-h-[200px] flex flex-col">
              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="border-b border-r border-black p-1.5 text-center font-bold w-[5%]">SI No.</th>
                    <th className="border-b border-r border-black p-1.5 text-left font-bold w-[45%]">Description of Goods</th>
                    <th className="border-b border-r border-black p-1.5 text-center font-bold w-[10%]">HSN/SAC</th>
                    <th className="border-b border-r border-black p-1.5 text-right font-bold w-[10%]">Quantity</th>
                    <th className="border-b border-r border-black p-1.5 text-right font-bold w-[10%]">Rate</th>
                    <th className="border-b border-r border-black p-1.5 text-center font-bold w-[5%]">per</th>
                    <th className="border-b border-black p-1.5 text-right font-bold w-[15%]">Amount</th>
                  </tr>
                </thead>
                <tbody className="border-b border-black">
                  {quotationData.items.map((item, index) => (
                    <tr key={index}>
                      <td className="border-r border-black p-1 text-center">{index + 1}</td>
                      <td className="border-r border-black p-1 font-bold">{item.description}</td>
                      <td className="border-r border-black p-1 text-center">{item.hsn || ''}</td>
                      <td className="border-r border-black p-1 text-right font-bold font-mono">
                        {item.quantity} {item.unit}
                      </td>
                      <td className="border-r border-black p-1 text-right font-mono">{item.rate.toFixed(2)}</td>
                      <td className="border-r border-black p-1 text-center">{item.unit}</td>
                      <td className="p-1 text-right font-bold font-mono">{item.amount.toFixed(2)}</td>
                    </tr>
                  ))}
                  
                  {/* SUB-TOTAL ROW */}
                  <tr>
                    <td className="border-r border-black p-1"></td>
                    <td className="border-r border-black p-1 text-right pr-4 font-bold pt-2">Sub-Total</td>
                    <td className="border-r border-black p-1"></td>
                    <td className="border-r border-black p-1"></td>
                    <td className="border-r border-black p-1"></td>
                    <td className="border-r border-black p-1"></td>
                    <td className="p-1 text-right font-bold font-mono pt-2 border-t border-black">
                      {quotationData.items.reduce((acc, item) => acc + item.amount, 0).toFixed(2)}
                    </td>
                  </tr>

                  {/* TAX ROWS */}
                  {quotationData.taxPercentage > 0 && (
                    <>
                      {(quotationData.isInterState || (quotationData.clientGST && quotationData.clientGST.substring(0, 2) !== '24')) ? (
                        <tr>
                          <td className="border-r border-black p-1"></td>
                          <td className="border-r border-black p-1 text-right pr-4 text-sky-700 font-medium">IGST (Integrated Tax)</td>
                          <td className="border-r border-black p-1"></td>
                          <td className="border-r border-black p-1"></td>
                          <td className="border-r border-black p-1 text-right font-mono">{quotationData.taxPercentage}%</td>
                          <td className="border-r border-black p-1"></td>
                          <td className="p-1 text-right font-mono">{quotationData.taxAmount.toFixed(2)}</td>
                        </tr>
                      ) : (
                        <>
                          <tr>
                            <td className="border-r border-black p-1"></td>
                            <td className="border-r border-black p-1 text-right pr-4 text-slate-700">CGST</td>
                            <td className="border-r border-black p-1"></td>
                            <td className="border-r border-black p-1"></td>
                            <td className="border-r border-black p-1 text-right font-mono">{quotationData.taxPercentage / 2}%</td>
                            <td className="border-r border-black p-1"></td>
                            <td className="p-1 text-right font-mono">{(quotationData.taxAmount / 2).toFixed(2)}</td>
                          </tr>
                          <tr>
                            <td className="border-r border-black p-1"></td>
                            <td className="border-r border-black p-1 text-right pr-4 text-slate-700">SGST</td>
                            <td className="border-r border-black p-1"></td>
                            <td className="border-r border-black p-1"></td>
                            <td className="border-r border-black p-1 text-right font-mono">{quotationData.taxPercentage / 2}%</td>
                            <td className="border-r border-black p-1"></td>
                            <td className="p-1 text-right font-mono">{(quotationData.taxAmount / 2).toFixed(2)}</td>
                          </tr>
                        </>
                      )}
                    </>
                  )}
                  
                  {/* Empty stretch row */}
                  <tr className="h-16 print:h-8">
                    <td className="border-r border-black"></td>
                    <td className="border-r border-black"></td>
                    <td className="border-r border-black"></td>
                    <td className="border-r border-black"></td>
                    <td className="border-r border-black"></td>
                    <td className="border-r border-black"></td>
                    <td></td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr className="bg-slate-50 font-bold border-t border-black">
                    <th colSpan="3" className="border-r border-black p-1.5 text-right">Total</th>
                    <th className="border-r border-black p-1.5 text-right font-mono">
                      {quotationData.items.reduce((sum, item) => sum + Number(item.quantity), 0)}
                    </th>
                    <th colSpan="2" className="border-r border-black p-1.5"></th>
                    <th className="p-1.5 text-right font-mono text-sm">
                      ₹ {quotationData.totalAmount.toFixed(2)}
                    </th>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div className="p-2 border-b border-black text-xs">
              <span className="text-[10px] text-slate-600 uppercase font-semibold">Amount Chargeable (in words)</span><br/>
              <span className="font-bold text-sm">
                INR {numberToWords(quotationData.totalAmount)}
              </span>
            </div>

            <div className="flex">
              <div className="w-1/2 border-r border-black flex flex-col text-xs">
                <div className="p-2 border-b border-black">
                  <div className="text-[10px] font-semibold italic text-slate-700">Company's Bank Details</div>
                  <div className="flex gap-2 mt-1"><span className="w-20 font-medium">Bank Name</span><span>: <strong>The Mehsana Urban Co-operative Bank Ltd.</strong></span></div>
                  <div className="flex gap-2"><span className="w-20 font-medium">A/c No.</span><span>: <strong>00141101001022</strong></span></div>
                  <div className="flex gap-2"><span className="w-20 font-medium">IFS Code</span><span>: <strong>MSNU0000014</strong></span></div>
                  <div className="flex gap-2"><span className="w-20 font-medium">Branch</span><span>: <strong>Deesa Branch</strong></span></div>
                </div>
                <div className="p-2">
                  <div className="font-bold underline text-xs mb-1">Terms & Conditions</div>
                  <div className="text-xs whitespace-pre-wrap text-slate-700 leading-relaxed">
                    {quotationData.terms}
                  </div>
                </div>
              </div>
              <div className="w-1/2 flex flex-col justify-between p-2 text-right text-xs">
                <div className="font-bold text-sm text-black">for Neeta Engineering Works</div>
                <div className="flex justify-end my-2">
                  <img src="/sign.png" alt="Signature" className="h-20 object-contain" />
                </div>
                <div className="font-bold text-xs">Authorised Signatory</div>
              </div>
            </div>
            
          </div>
        </div>
        
        {/* <div style={{ textAlign: 'center', marginTop: '10px', fontSize: '10px', color: '#666' }}>
          This is a Computer Generated Document
        </div> */}
      </div>
    </div>
  );
}
