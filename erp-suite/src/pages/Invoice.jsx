import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Printer, ArrowLeft } from 'lucide-react';
import { getInvoiceDivisions } from '../services/api';

function numberToWordsWithDecimal(num) {
  if (!num) return '';
  const a = ['','One ','Two ','Three ','Four ', 'Five ','Six ','Seven ','Eight ','Nine ','Ten ','Eleven ','Twelve ','Thirteen ','Fourteen ','Fifteen ','Sixteen ','Seventeen ','Eighteen ','Nineteen '];
  const b = ['', '', 'Twenty','Thirty','Forty','Fifty', 'Sixty','Seventy','Eighty','Ninety'];

  const convertWhole = (n) => {
    if ((n = n.toString()).length > 9) return 'Amount too large';
    let arr = ('000000000' + n).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
    if (!arr) return '';
    let str = '';
    str += (arr[1] != 0) ? (a[Number(arr[1])] || b[arr[1][0]] + ' ' + a[arr[1][1]]) + 'Lakh ' : ''; // Used Lakh instead of Lac for standard, or can keep Lac.
    str += (arr[2] != 0) ? (a[Number(arr[2])] || b[arr[2][0]] + ' ' + a[arr[2][1]]) + 'Lakh ' : '';
    str += (arr[3] != 0) ? (a[Number(arr[3])] || b[arr[3][0]] + ' ' + a[arr[3][1]]) + 'Thousand ' : '';
    str += (arr[4] != 0) ? (a[Number(arr[4])] || b[arr[4][0]] + ' ' + a[arr[4][1]]) + 'Hundred ' : '';
    str += (arr[5] != 0) ? ((str != '') ? 'and ' : '') + (a[Number(arr[5])] || b[arr[5][0]] + ' ' + a[arr[5][1]]) : '';
    return str.trim();
  };

  const parts = parseFloat(num).toFixed(2).toString().split('.');
  const rupees = convertWhole(parseInt(parts[0], 10));
  let words = rupees ? rupees.replace(/Lakh/g, 'LAC').toUpperCase() + ' RUPEES' : 'ZERO RUPEES';

  if (parts[1]) {
    let paiseStr = parts[1].padEnd(2, '0').substring(0, 2);
    let paiseInt = parseInt(paiseStr, 10);
    if (paiseInt > 0) {
      const paiseWords = convertWhole(paiseInt);
      words += ' AND ' + paiseWords.toUpperCase() + ' PAISE';
    }
  }
  return words + ' ONLY';
}

export default function Invoice() {
  const navigate = useNavigate();
  
  // Dynamic State
  const [invoiceNo, setInvoiceNo] = useState('P/12');
  const [invoiceDate, setInvoiceDate] = useState('05.06.2026');
  const [division, setDivision] = useState('');
  const [amountInput, setAmountInput] = useState('105526.42');
  const [invoiceDivisions, setInvoiceDivisions] = useState([]);

  useEffect(() => {
    getInvoiceDivisions().then(data => {
      setInvoiceDivisions(data);
      if (data && data.length > 0) {
        setDivision(data[0].name);
      } else {
        setDivision('Deesa-1'); // Fallback
      }
    }).catch(err => console.error("Failed to fetch divisions", err));
  }, []);

  // Calculations
  const amount = parseFloat(amountInput) || 0;
  const subTotal = amount;
  const cgstAmount = Math.round((subTotal * 0.09) * 100) / 100;
  const sgstAmount = Math.round((subTotal * 0.09) * 100) / 100;
  const taxTotal = cgstAmount + sgstAmount;
  const grandTotal = subTotal + taxTotal;
  const amountInWords = numberToWordsWithDecimal(grandTotal);

  const handlePrint = () => {
    window.print();
  };

  const inputClass = "w-full border border-dashed border-slate-300 bg-amber-50 text-inherit p-0.5 box-border rounded text-xs focus:outline-none focus:border-[#0059bb] focus:bg-white focus:border-solid print:border-none print:bg-transparent print:p-0";

  return (
    <div className="p-4 sm:p-6 bg-slate-100 min-h-screen print:bg-white print:p-0 print:min-h-0 font-sans text-xs text-black">
      <div className="print:hidden max-w-4xl mx-auto mb-6 flex flex-wrap items-center justify-between gap-4 bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/90 shadow-xs">
        <button className="inline-flex items-center gap-2 px-3.5 py-2 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-xl font-semibold text-xs sm:text-sm transition-colors cursor-pointer" onClick={() => navigate(-1)}>
          <ArrowLeft size={16} /> Back
        </button>
        <button className="inline-flex items-center gap-2 px-4 py-2 bg-[#0059bb] hover:bg-[#004c9e] text-white rounded-xl font-semibold text-xs sm:text-sm shadow-sm transition-all cursor-pointer" onClick={handlePrint}>
          <Printer size={16} /> Print / Save PDF
        </button>
      </div>

      <div className="overflow-x-auto w-full pb-6 print:p-0 print:overflow-visible">
      <div className="bg-white max-w-[210mm] mx-auto p-4 sm:p-8 shadow-md border border-slate-200 text-black box-border print:shadow-none print:border-none print:p-2 print:m-0 print:max-w-none print:w-full">
        <table className="w-full border-collapse border border-black text-xs font-sans">
          <colgroup>
            <col style={{ width: '15%' }} />
            <col style={{ width: '40%' }} />
            <col style={{ width: '10%' }} />
            <col style={{ width: '10%' }} />
            <col style={{ width: '25%' }} />
          </colgroup>
          <tbody>
            {/* Top Headers */}
            <tr>
              <td colSpan={5} className="border border-black p-1 text-center font-bold text-[11px]">TAX INVOICE (ORIGINAL FOR RECIPIENT)</td>
            </tr>
            <tr>
              <td colSpan={5} className="border border-black p-1 text-center text-red-600 font-extrabold text-xl uppercase font-serif">
                NEETA ENGINEERING WORKS
              </td>
            </tr>
            <tr>
              <td colSpan={5} className="border border-black p-1 text-center text-red-600 font-bold">
                179,GIDC ,CHANDISAR TA,PALANPUR B.K
              </td>
            </tr>

            {/* Company Info */}
            <tr>
              <td colSpan={2}>NEETA ENGINEERING WORKS</td>
              <td colSpan={2}>GST NO:-</td>
              <td>24ABHPP5386L1Z3</td>
            </tr>
            <tr>
              <td>AT&PO:-</td>
              <td>CHANDISAR</td>
              <td colSpan={2}>PAN NO:-</td>
              <td>ABHPP5386L</td>
            </tr>
            <tr>
              <td>TA:-</td>
              <td>PALANPUR</td>
              <td colSpan={2}>E-MAIL:-</td>
              <td>raman1177@yahoo.com</td>
            </tr>
            <tr>
              <td>DIST:-</td>
              <td>BANASKANTHA</td>
              <td colSpan={3}></td>
            </tr>
            <tr>
              <td>MO.NO:-</td>
              <td>9925030516</td>
              <td colSpan={3}></td>
            </tr>

            {/* Bill To & Invoice Info */}
            <tr>
              <td colSpan={2} className="border border-black p-1">Bill To And Ship To Address Of Custom</td>
              <td colSpan={2} className="border border-black p-1">Invoice No:-</td>
              <td className="border border-black p-1 text-center">
                <input 
                  type="text" 
                  className={`${inputClass} text-center`}
                  value={invoiceNo} 
                  onChange={(e) => setInvoiceNo(e.target.value)} 
                />
              </td>
            </tr>
            <tr>
              <td colSpan={2} className="border border-black p-1">Uttar Gujarat Vij.Co.Ltd.</td>
              <td colSpan={2} className="border border-black p-1">Invoice Date:-</td>
              <td className="border border-black p-1 text-center">
                <input 
                  type="text" 
                  className={`${inputClass} text-center`}
                  value={invoiceDate} 
                  onChange={(e) => setInvoiceDate(e.target.value)} 
                />
              </td>
            </tr>
            <tr>
              <td colSpan={2} className="border border-black p-1">{division.endsWith('-2') ? 'Division office-2' : 'Division office'}</td>
              <td colSpan={2} className="border border-black p-1">Nature Of Supply:-</td>
              <td className="border border-black p-1 text-center font-semibold">24GUJARAT</td>
            </tr>
            <tr>
              <td colSpan={2} className="border border-black p-1">
                <select 
                  className={`${inputClass} cursor-pointer`}
                  value={division} 
                  onChange={(e) => setDivision(e.target.value)}
                >
                  {invoiceDivisions.map(div => (
                    <option key={div._id || div.name} value={div.name}>{div.name}</option>
                  ))}
                  {invoiceDivisions.length === 0 && <option value="Deesa-1">Deesa-1</option>}
                </select>
              </td>
              <td colSpan={2} className="border border-black p-1">Nature Of Trans:-</td>
              <td className="border border-black p-1 text-center"></td>
            </tr>
            <tr>
              <td colSpan={2} className="border border-black p-1">
                <select 
                  className={`${inputClass} cursor-pointer`}
                  value={division} 
                  onChange={(e) => setDivision(e.target.value)}
                >
                  {invoiceDivisions.map(div => (
                    <option key={div._id || div.name} value={div.name}>{div.name}</option>
                  ))}
                  {invoiceDivisions.length === 0 && <option value="Deesa-1">Deesa-1</option>}
                </select>
              </td>
              <td colSpan={2} className="border border-black p-1">Nature Of Invoice:-</td>
              <td className="border border-black p-1 text-center"></td>
            </tr>
            <tr>
              <td colSpan={2} className="border border-black p-1">Gujarat (India)</td>
              <td colSpan={2} className="border border-black p-1">Reverse Charge:-</td>
              <td className="border border-black p-1 text-center"></td>
            </tr>
            <tr>
              <td colSpan={2} className="border border-black p-1">Place Of Service:- 24 Gujarat</td>
              <td colSpan={3} rowSpan={4} className="border border-black p-1"></td>
            </tr>
            <tr>
              <td colSpan={2} className="border border-black p-1">Contact Deetails:- </td>
            </tr>
            <tr>
              <td colSpan={2} className="border border-black p-1">PAN NO:- AAACU6551F</td>
            </tr>
            <tr>
              <td colSpan={2} className="border border-black p-1">GST NO:-24AAACU6551F1ZI</td>
            </tr>

            {/* Items Header */}
            <tr className="bg-slate-50 font-bold">
              <td colSpan={2} className="border border-black p-1 text-center">DESCRIPTION</td>
              <td className="border border-black p-1 text-center">RATE</td>
              <td className="border border-black p-1 text-center">QTY</td>
              <td className="border border-black p-1 text-center">AMOUNT<br/>(IN.RS.)</td>
            </tr>

            {/* Items Loop */}
            <tr>
              <td colSpan={2} className="border-l border-r border-black p-1 text-left pl-3">
                Labour Works Of Fabrication item works as per Driwing &Specification.
              </td>
              <td className="border-l border-r border-black p-1 text-center"></td>
              <td className="border-l border-r border-black p-1 text-center"></td>
              <td className="border-l border-r border-black p-1 text-right pr-2">
                <input 
                  type="number" 
                  className={`${inputClass} text-right w-24`}
                  value={amountInput} 
                  onChange={(e) => setAmountInput(e.target.value)} 
                />
              </td>
            </tr>

            {/* Empty stretching rows to push totals down */}
            {[...Array(5)].map((_, i) => (
              <tr key={`empty-${i}`} className="item-row" style={{ height: '22px' }}>
                <td colSpan={2}></td>
                <td></td>
                <td></td>
                <td></td>
              </tr>
            ))}

            {/* Totals */}
            <tr>
              <td colSpan={2} style={{ borderTop: '1px solid #000' }}></td>
              <td colSpan={2} style={{ borderTop: '1px solid #000', textAlign: 'left', paddingLeft: '10px' }}>Sub Total</td>
              <td className="right" style={{ borderTop: '1px solid #000', paddingRight: '4mm' }}>{subTotal.toFixed(2)}</td>
            </tr>
            <tr>
              <td colSpan={2} style={{ borderTop: 'none', borderBottom: 'none' }}></td>
              <td colSpan={2} style={{ borderTop: 'none', borderBottom: 'none', textAlign: 'left', paddingLeft: '10px' }}>Round Off</td>
              <td className="right" style={{ paddingRight: '4mm' }}></td>
            </tr>
            <tr>
              <td colSpan={2} style={{ borderTop: 'none', borderBottom: 'none' }}></td>
              <td colSpan={2} style={{ borderTop: 'none', borderBottom: 'none', textAlign: 'left', paddingLeft: '10px' }}>taxable Amount</td>
              <td className="right" style={{ paddingRight: '4mm' }}>{subTotal.toFixed(2)}</td>
            </tr>
            <tr>
              <td colSpan={2} style={{ borderTop: 'none', borderBottom: 'none' }}></td>
              <td colSpan={2} style={{ borderTop: 'none', borderBottom: 'none', textAlign: 'left', paddingLeft: '10px' }}>CGST 9%</td>
              <td className="right" style={{ paddingRight: '4mm' }}>{cgstAmount.toFixed(2)}</td>
            </tr>
            <tr>
              <td colSpan={2} style={{ borderTop: 'none', borderBottom: 'none' }}></td>
              <td colSpan={2} style={{ borderTop: 'none', borderBottom: 'none', textAlign: 'left', paddingLeft: '10px' }}>SGST 9%</td>
              <td className="right" style={{ paddingRight: '4mm' }}>{sgstAmount.toFixed(2)}</td>
            </tr>
            <tr>
              <td colSpan={2} style={{ borderTop: 'none', borderBottom: 'none' }}></td>
              <td colSpan={2} style={{ borderTop: 'none', borderBottom: 'none', textAlign: 'left', paddingLeft: '10px' }}>Totel Tax</td>
              <td className="right" style={{ paddingRight: '4mm' }}>{taxTotal.toFixed(2)}</td>
            </tr>
            <tr>
              <td colSpan={2} style={{ borderTop: 'none' }}></td>
              <td colSpan={2} style={{ borderTop: 'none', textAlign: 'left', paddingLeft: '10px' }}>Grand Total</td>
              <td className="right" style={{ paddingRight: '4mm' }}>{grandTotal.toFixed(2)}</td>
            </tr>

            {/* Amount in Words */}
            <tr>
              <td className="center">Amount<br/>Rs.</td>
              <td colSpan={4} className="center">
                {amountInWords}
              </td>
            </tr>

            {/* Footer */}
            <tr>
              <td colSpan={3} style={{ borderTop: 'none', borderBottom: 'none' }}></td>
              <td colSpan={2} style={{ borderTop: 'none', padding: '0', verticalAlign: 'top' }}>
                <div style={{ color: 'blue', fontWeight: 'bold', textAlign: 'center', padding: '5px 0' }}>
                  For, Neeta Engineering Works
                </div>
                <div style={{ height: '80px', display: 'flex', justifyContent: 'center', alignItems: 'flex-end', paddingBottom: '10px' }}>
                  {/* Uncomment if signature image is needed */}
                  {/* <img src="./sign.png" alt="Signature" style={{ height: '60px', objectFit: 'contain' }} /> */}
                </div>
                <div style={{ color: 'blue', fontStyle: 'italic', textAlign: 'right', padding: '5px 10px' }}>
                  Authorised Signature
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      </div>
    </div>
  );
}
