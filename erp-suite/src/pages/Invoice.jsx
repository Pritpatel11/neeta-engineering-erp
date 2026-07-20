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

  return (
    <div className="preview-container">
      <style>
        {`
          .preview-container {
            background-color: #f0f2f5;
            min-height: 100vh;
            padding: 20px;
            font-family: Arial, sans-serif;
            font-size: 13px;
            color: #000;
          }
          .preview-actions {
            max-width: 210mm;
            margin: 0 auto 20px auto;
            display: flex;
            justify-content: space-between;
            background: white;
            padding: 15px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.05);
          }
          .document-paper {
            background: white;
            max-width: 210mm;
            min-height: 297mm;
            margin: 0 auto;
            padding: 10mm;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
            box-sizing: border-box;
          }
          
          .excel-table {
            width: 100%;
            border-collapse: collapse;
            border: 1px solid #000;
          }
          .excel-table td {
            border: 1px solid #000;
            padding: 3px 6px;
            vertical-align: top;
          }
          .excel-table .center { text-align: center; }
          .excel-table .right { text-align: right; }
          
          /* Removing internal borders for item rows to simulate Excel empty rows */
          .item-row td {
            border-top: none;
            border-bottom: none;
          }

          /* Interactive Input Styles */
          .invoice-input {
            width: 100%;
            border: 1px dashed #ccc;
            background: #fff9e6;
            font-family: inherit;
            font-size: inherit;
            color: inherit;
            padding: 2px 4px;
            box-sizing: border-box;
            border-radius: 2px;
          }
          .invoice-input:focus {
            outline: 1px solid #0066cc;
            background: #fff;
            border-style: solid;
          }
          .invoice-input.center { text-align: center; }
          .invoice-input.right { text-align: right; }

          @media print {
            @page { size: A4 portrait !important; margin: 0 !important; }
            html, body { background: white; margin: 0 !important; padding: 0 !important; height: auto; min-height: 100%; overflow: visible; -webkit-print-color-adjust: exact; }
            .no-print { display: none !important; }
            .preview-container { padding: 0; background: white; font-size: 12px; min-height: 0; display: block; }
            .document-paper { 
              box-shadow: none; border: none; padding: 5mm; margin: 0; 
              width: 100%; height: auto; min-height: 0; box-sizing: border-box; 
              page-break-after: avoid;
              page-break-inside: avoid;
            }
            .invoice-input {
              border: none !important;
              background: transparent !important;
              padding: 0 !important;
            }
          }
        `}
      </style>

      <div className="preview-actions no-print">
        <button className="btn-outline" onClick={() => navigate(-1)}>
          <ArrowLeft size={16} style={{ marginRight: '6px' }} /> Back
        </button>
        <button className="btn-primary" onClick={handlePrint}>
          <Printer size={18} style={{ marginRight: '6px' }} /> Print / Save PDF
        </button>
      </div>

      <div className="document-paper">
        <table className="excel-table">
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
              <td colSpan={5} className="center">TAX INVOICE (ORIGINAL FOR RECIPIENT)</td>
            </tr>
            <tr>
              <td colSpan={5} className="center" style={{ color: 'red', fontWeight: 'bold', fontSize: '20px', textTransform: 'uppercase', fontFamily: 'Georgia, serif' }}>
                NEETA ENGINEERING WORKS
              </td>
            </tr>
            <tr>
              <td colSpan={5} className="center" style={{ color: 'red', fontWeight: 'bold' }}>
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
              <td colSpan={2}>Bill To And Ship To Address Of Custom</td>
              <td colSpan={2}>Invoice No:-</td>
              <td className="center">
                <input 
                  type="text" 
                  className="invoice-input center" 
                  value={invoiceNo} 
                  onChange={(e) => setInvoiceNo(e.target.value)} 
                />
              </td>
            </tr>
            <tr>
              <td colSpan={2}>Uttar Gujarat Vij.Co.Ltd.</td>
              <td colSpan={2}>Invoice Date:-</td>
              <td className="center">
                <input 
                  type="text" 
                  className="invoice-input center" 
                  value={invoiceDate} 
                  onChange={(e) => setInvoiceDate(e.target.value)} 
                />
              </td>
            </tr>
            <tr>
              <td colSpan={2}>{division.endsWith('-2') ? 'Division office-2' : 'Division office'}</td>
              <td colSpan={2}>Nature Of Supply:-</td>
              <td className="center">24GUJARAT</td>
            </tr>
            <tr>
              <td colSpan={2}>
                <select 
                  className="invoice-input" 
                  value={division} 
                  onChange={(e) => setDivision(e.target.value)}
                  style={{ cursor: 'pointer', appearance: 'auto' }}
                >
                  {invoiceDivisions.map(div => (
                    <option key={div._id || div.name} value={div.name}>{div.name}</option>
                  ))}
                  {invoiceDivisions.length === 0 && <option value="Deesa-1">Deesa-1</option>}
                </select>
              </td>
              <td colSpan={2}>Nature Of Trans:-</td>
              <td className="center"></td>
            </tr>
            <tr>
              <td colSpan={2}>
                <select 
                  className="invoice-input" 
                  value={division} 
                  onChange={(e) => setDivision(e.target.value)}
                  style={{ cursor: 'pointer', appearance: 'auto' }}
                >
                  {invoiceDivisions.map(div => (
                    <option key={div._id || div.name} value={div.name}>{div.name}</option>
                  ))}
                  {invoiceDivisions.length === 0 && <option value="Deesa-1">Deesa-1</option>}
                </select>
              </td>
              <td colSpan={2}>Nature Of Invoice:-</td>
              <td className="center"></td>
            </tr>
            <tr>
              <td colSpan={2}>Gujarat (India)</td>
              <td colSpan={2}>Reverse Charge:-</td>
              <td className="center"></td>
            </tr>
            <tr>
              <td colSpan={2}>Place Of Service:- 24 Gujarat</td>
              <td colSpan={3} rowSpan={4}></td>
            </tr>
            <tr>
              <td colSpan={2}>Contact Deetails:- </td>
            </tr>
            <tr>
              <td colSpan={2}>PAN NO:- AAACU6551F</td>
            </tr>
            <tr>
              <td colSpan={2}>GST NO:-24AAACU6551F1ZI</td>
            </tr>

            {/* Items Header */}
            <tr>
              <td colSpan={2} className="center" style={{ borderBottom: '1px solid #000' }}>DESCRIPTION</td>
              <td className="center" style={{ borderBottom: '1px solid #000' }}>RATE</td>
              <td className="center" style={{ borderBottom: '1px solid #000' }}>QTY</td>
              <td className="center" style={{ borderBottom: '1px solid #000' }}>AMOUNT<br/>(IN.RS.)</td>
            </tr>

            {/* Items Loop */}
            <tr className="item-row">
              <td colSpan={2} style={{ textAlign: 'left', paddingLeft: '5mm' }}>
                Labour Works Of Fabrication item works as per Driwing &Specification.
              </td>
              <td className="center"></td>
              <td className="center"></td>
              <td className="right" style={{ paddingRight: '4mm' }}>
                <input 
                  type="number" 
                  className="invoice-input right" 
                  value={amountInput} 
                  onChange={(e) => setAmountInput(e.target.value)} 
                  style={{ width: '100px' }}
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
  );
}
