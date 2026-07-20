import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Printer, ArrowLeft } from 'lucide-react';

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
  
  const quotationData = location.state?.quotationData;

  useEffect(() => {
    if (!quotationData) {
      navigate('/quotations');
    }
  }, [quotationData, navigate]);

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
    <div className="preview-container">
      <style>
        {`
          .preview-container {
            background-color: #f0f2f5;
            min-height: 100vh;
            padding: 20px;
            font-family: 'Arial', sans-serif;
            font-size: 12px;
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
          
          /* TALLY PRIME SPECIFIC CLASSES */
          .tally-box {
            border: 1px solid #000;
            width: 100%;
            display: flex;
            flex-direction: column;
          }
          .doc-title-row {
            text-align: center;
            font-weight: bold;
            font-size: 16px;
            padding: 5px;
            border-bottom: 1px solid #000;
          }
          
          .header-grid {
            display: flex;
            border-bottom: 1px solid #000;
          }
          .header-left {
            width: 50%;
            border-right: 1px solid #000;
            display: flex;
            flex-direction: column;
          }
          .header-right {
            width: 50%;
            display: flex;
            flex-direction: column;
          }
          
          .company-details {
            padding: 8px;
            flex: 1;
            border-bottom: 1px solid #000;
          }
          .company-name {
            font-size: 16px;
            font-weight: bold;
            margin-bottom: 4px;
          }
          
          .buyer-details {
            padding: 8px;
            flex: 1;
          }
          
          .invoice-meta-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            height: 100%;
          }
          .meta-box {
            padding: 6px;
            border-bottom: 1px solid #000;
            border-right: 1px solid #000;
          }
          .meta-box:nth-child(even) {
            border-right: none;
          }
          .meta-box-full {
            grid-column: 1 / -1;
            border-right: none;
          }
          .meta-label {
            font-size: 10px;
            color: #333;
          }
          .meta-value {
            font-weight: bold;
            font-size: 13px;
            margin-top: 2px;
          }
          
          /* TABLE CSS */
          .tally-table {
            width: 100%;
            border-collapse: collapse;
          }
          .tally-table th {
            border-bottom: 1px solid #000;
            border-right: 1px solid #000;
            padding: 6px 4px;
            text-align: center;
            font-weight: normal;
          }
          .tally-table td {
            border-right: 1px solid #000;
            padding: 4px;
            vertical-align: top;
          }
          .tally-table th:last-child, .tally-table td:last-child {
            border-right: none;
          }
          .tally-table-body {
            min-height: 250px; /* Forces vertical lines to extend */
            display: block;
          }
          
          /* HACK TO MAKE MIN-HEIGHT WORK WITH TABLES */
          .table-container {
            border-bottom: 1px solid #000;
            min-height: 250px;
            display: flex;
            flex-direction: column;
          }
          
          .amount-words-row {
            padding: 6px;
            border-bottom: 1px solid #000;
          }
          
          .footer-grid {
            display: flex;
          }
          .footer-left {
            width: 50%;
            border-right: 1px solid #000;
            display: flex;
            flex-direction: column;
          }
          .footer-right {
            width: 50%;
            display: flex;
            flex-direction: column;
            justify-content: flex-end;
          }
          
          .bank-details {
            padding: 6px;
            border-bottom: 1px solid #000;
          }
          .bank-label { font-size: 11px; font-style: italic; }
          .bank-row { display: flex; margin-bottom: 2px; }
          .bank-row span:first-child { width: 100px; }
          
          .declaration {
            padding: 6px;
          }
          .decl-title { font-weight: bold; text-decoration: underline; margin-bottom: 4px; font-size: 11px; }
          .decl-text { font-size: 11px; }
          
          .signature-box {
            padding: 6px;
            text-align: right;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            height: 100%;
            min-height: 100px;
          }
          .for-company {
            font-weight: bold;
            font-size: 13px;
          }
          .stretch-row { height: 100px; }

          @media print {
            @page { size: A4 portrait !important; margin: 5mm; }
            body { background: white; margin: 0; padding: 0; -webkit-print-color-adjust: exact; }
            .no-print { display: none !important; }
            .preview-container { padding: 0; background: white; font-size: 11px; }
            .document-paper { 
              box-shadow: none; border: none; padding: 0; margin: 0; 
              width: 100%; height: auto; min-height: 0; box-sizing: border-box; 
            }
            .tally-table td { padding: 2px 4px; }
            .table-container { min-height: 50px; }
            .signature-box { min-height: 60px; }
            .company-name { font-size: 14px; }
            .tally-box { border: 1px solid #000; }
            .stretch-row { height: 30px !important; }
          }
        `}
      </style>

      <div className="preview-actions no-print">
        <button className="btn-outline" onClick={() => navigate('/create-quotation', { state: { quotationData: quotationData }, replace: true })}>
          <ArrowLeft size={16} style={{ marginRight: '6px' }} /> Back
        </button>
        <button className="btn-primary" onClick={handlePrint}>
          <Printer size={18} style={{ marginRight: '6px' }} /> Print / Save PDF
        </button>
      </div>

      <div className="document-paper">
        <div className="doc-title-row">
          {docTitle}
        </div>
        
        <div className="tally-box">
          <div className="header-grid">
            <div className="header-left">
              <div className="company-details">
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                  <div>
                    <div className="company-name">Neeta Engineering Works</div>
                    <div>179, GIDC Main Road, Navadisa Road,</div>
                    <div>Chandisar, Banaskantha, Gujarat 385510</div>
                    <div>GSTIN/UIN: <strong>24ABHPP5386L1Z3</strong></div>
                    <div>E-Mail: neeta5788@gmail.com</div>
                  </div>
                  {/* Tally invoices don't usually put logo here, but we will place it top right of the box */}
                  <img src="./logo address.png" alt="Logo" style={{ height: '80px', objectFit: 'contain' }} />
                </div>
              </div>
              <div className="buyer-details">
                <div className="meta-label" style={{ marginBottom: '4px' }}>Buyer (Bill to)</div>
                <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{quotationData.clientName}</div>
                <div>{quotationData.clientAddress}</div>
                {quotationData.clientGST && <div>GSTIN/UIN: <strong>{quotationData.clientGST}</strong></div>}
              </div>
            </div>
            
            <div className="header-right">
              <div className="invoice-meta-grid">
                <div className="meta-box">
                  <div className="meta-label">{docTitle} No.</div>
                  <div className="meta-value">{quotationData.quotationNo}</div>
                </div>
                <div className="meta-box">
                  <div className="meta-label">Dated</div>
                  <div className="meta-value">{formatDate(quotationData.date)}</div>
                </div>
                <div className="meta-box meta-box-full">
                  <div className="meta-label">Subject / Reference</div>
                  <div className="meta-value" style={{ fontSize: '11px', fontWeight: 'normal' }}>
                    {quotationData.subject || 'As per your requirement'}
                  </div>
                </div>
                <div className="meta-box">
                  <div className="meta-label">Terms of Payment</div>
                  <div className="meta-value" style={{ fontSize: '11px', fontWeight: 'normal' }}>Immediate</div>
                </div>
                <div className="meta-box">
                  <div className="meta-label">Contact No.</div>
                  <div className="meta-value" style={{ fontSize: '11px', fontWeight: 'normal' }}>
                    {quotationData.clientPhone || 'N/A'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="table-container">
            <table className="tally-table">
              <thead>
                <tr>
                  <th style={{ width: '5%' }}>SI No.</th>
                  <th style={{ width: '45%' }}>Description of Goods</th>
                  <th style={{ width: '10%' }}>HSN/SAC</th>
                  <th style={{ width: '10%' }}>Quantity</th>
                  <th style={{ width: '10%' }}>Rate</th>
                  <th style={{ width: '5%' }}>per</th>
                  <th style={{ width: '15%' }}>Amount</th>
                </tr>
              </thead>
              <tbody style={{ borderBottom: '1px solid #000' }}>
                {quotationData.items.map((item, index) => (
                  <tr key={index}>
                    <td style={{ textAlign: 'center' }}>{index + 1}</td>
                    <td style={{ fontWeight: 'bold' }}>{item.description}</td>
                    <td style={{ textAlign: 'center' }}>{item.hsn || ''}</td>
                    <td style={{ textAlign: 'right', fontWeight: 'bold' }}>
                      {item.quantity} {item.unit}
                    </td>
                    <td style={{ textAlign: 'right' }}>{item.rate.toFixed(2)}</td>
                    <td style={{ textAlign: 'center' }}>{item.unit}</td>
                    <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{item.amount.toFixed(2)}</td>
                  </tr>
                ))}
                
                {/* SUB-TOTAL ROW */}
                <tr>
                  <td></td>
                  <td style={{ textAlign: 'right', paddingRight: '20px', fontWeight: 'bold', paddingTop: '10px' }}>Sub-Total</td>
                  <td></td>
                  <td></td>
                  <td></td>
                  <td></td>
                  <td style={{ textAlign: 'right', fontWeight: 'bold', paddingTop: '10px', borderTop: '1px solid #000' }}>
                    {quotationData.items.reduce((acc, item) => acc + item.amount, 0).toFixed(2)}
                  </td>
                </tr>

                {/* TAX ROWS */}
                {quotationData.taxPercentage > 0 && (
                  <>
                    <tr>
                      <td></td>
                      <td style={{ textAlign: 'right', paddingRight: '20px' }}>CGST</td>
                      <td></td>
                      <td></td>
                      <td style={{ textAlign: 'right' }}>{quotationData.taxPercentage / 2}%</td>
                      <td></td>
                      <td style={{ textAlign: 'right' }}>{(quotationData.taxAmount / 2).toFixed(2)}</td>
                    </tr>
                    <tr>
                      <td></td>
                      <td style={{ textAlign: 'right', paddingRight: '20px' }}>SGST</td>
                      <td></td>
                      <td></td>
                      <td style={{ textAlign: 'right' }}>{quotationData.taxPercentage / 2}%</td>
                      <td></td>
                      <td style={{ textAlign: 'right' }}>{(quotationData.taxAmount / 2).toFixed(2)}</td>
                    </tr>
                  </>
                )}
                
                {/* This empty row stretches the table */}
                <tr className="stretch-row">
                  <td></td><td></td><td></td><td></td><td></td><td></td><td></td>
                </tr>
              </tbody>
              <tfoot>
                <tr>
                  <th colSpan="3" style={{ textAlign: 'right', borderRight: '1px solid #000' }}>Total</th>
                  <th style={{ textAlign: 'right', borderRight: '1px solid #000' }}>
                    {quotationData.items.reduce((sum, item) => sum + Number(item.quantity), 0)}
                  </th>
                  <th colSpan="2" style={{ borderRight: '1px solid #000' }}></th>
                  <th style={{ textAlign: 'right', fontWeight: 'bold', fontSize: '14px' }}>
                    ₹ {quotationData.totalAmount.toFixed(2)}
                  </th>
                </tr>
              </tfoot>
            </table>
          </div>

          <div className="amount-words-row">
            <span className="meta-label">Amount Chargeable (in words)</span><br/>
            <span style={{ fontWeight: 'bold' }}>
              INR {numberToWords(quotationData.totalAmount)}
            </span>
          </div>

          <div className="footer-grid">
            <div className="footer-left">
              <div className="bank-details">
                <div className="bank-label">Company's Bank Details</div>
                <div className="bank-row"><span>Bank Name</span><span>: <strong>The Mehsana Urban Co-operative Bank Ltd.</strong></span></div>
                <div className="bank-row"><span>A/c No.</span><span>: <strong>00141101001022</strong></span></div>
                <div className="bank-row"><span>IFS Code</span><span>: <strong>MSNU0000014</strong></span></div>
                <div className="bank-row"><span>Branch </span><span>: <strong>Deesa Branch</strong></span></div>
              </div>
              <div className="declaration">
                <div className="decl-title">Terms & Conditions</div>
                <div className="decl-text" style={{ whiteSpace: 'pre-wrap' }}>
                  {quotationData.terms}
                </div>
              </div>
            </div>
            <div className="footer-right">
              <div className="signature-box">
                <div className="for-company">for Neeta Engineering Works</div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
                  <img src="./sign.png" alt="Signature" style={{ height: '130px', objectFit: 'contain' }} />
                </div>
                <div style={{ marginTop: '5px', fontWeight: 'bold' }}>Authorised Signatory</div>
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
