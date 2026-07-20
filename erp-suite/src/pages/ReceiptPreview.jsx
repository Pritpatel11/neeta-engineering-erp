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
    <div className="preview-container">
      <style>
        {`
          .preview-container {
            background-color: #f0f2f5;
            min-height: 100vh;
            padding: 20px;
            font-family: Arial, sans-serif;
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
            min-height: 148mm;
            margin: 0 auto;
            padding: 10mm;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
            box-sizing: border-box;
          }

          .receipt-box {
            border: 2px dashed #000;
            padding: 25px 35px;
            min-height: 350px;
            display: flex;
            flex-direction: column;
          }

          .receipt-header {
            display: flex;
            justify-content: space-between;
            margin-bottom: 40px;
          }

          .header-left, .header-right {
            display: flex;
            flex-direction: column;
            gap: 8px;
          }

          .header-center {
            text-align: center;
          }

          .company-name {
            font-size: 26px;
            font-weight: bold;
            color: #000;
            margin-bottom: 5px;
          }

          .company-address {
            font-size: 13px;
          }

          .label-text {
            font-size: 12px;
            color: #333;
          }

          .value-text {
            font-size: 14px;
            font-weight: 500;
            color: #000;
          }

          .uppercase {
            text-transform: uppercase;
          }

          .receipt-body {
            display: flex;
            flex-direction: column;
            gap: 20px;
            margin-bottom: 30px;
          }

          .data-row {
            display: flex;
            align-items: baseline;
          }

          .data-row .value-text {
            flex: 1;
            padding-left: 20px;
          }

          .receipt-footer {
            margin-top: auto;
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
          }

          .amount-container {
            display: flex;
            align-items: center;
            gap: 15px;
            margin-bottom: 30px;
          }

          .rs-text {
            font-weight: bold;
            font-size: 18px;
          }

          .amount-box {
            border: 2px solid #000;
            padding: 5px 40px 5px 10px;
            font-size: 18px;
            font-weight: 500;
          }

          .terms-text {
            font-size: 10px;
            color: #555;
            line-height: 1.4;
          }

          .footer-right {
            display: flex;
            flex-direction: column;
            align-items: center;
          }

          .for-text {
            font-size: 12px;
            margin-bottom: 5px;
          }

          .stamp-box {
            width: 50px;
            height: 50px;
            border: 2px solid #000;
            margin-top: 5px;
          }
          
          @media print {
            @page { size: A4 portrait !important; margin: 0 !important; }
            html, body { background: white; margin: 0 !important; padding: 0 !important; height: auto; min-height: 100%; overflow: visible; -webkit-print-color-adjust: exact; }
            .no-print { display: none !important; }
            .preview-container { padding: 0; background: white; min-height: 0; display: block; }
            .document-paper { 
              box-shadow: none; border: none; padding: 5mm; margin: 0; 
              width: 100%; height: auto; min-height: 0; box-sizing: border-box; 
              page-break-after: avoid;
              page-break-inside: avoid;
            }
          }
        `}
      </style>

      <div className="preview-actions no-print">
        <button className="btn-outline" onClick={() => navigate('/receipt-management', { replace: true })}>
          <ArrowLeft size={16} style={{ marginRight: '6px' }} /> Back
        </button>
        <button className="btn-primary" onClick={handlePrint}>
          <Printer size={18} style={{ marginRight: '6px' }} /> Print / Save PDF
        </button>
      </div>

      <div className="document-paper">
        <div className="receipt-box">
          
          {/* Header */}
          <div className="receipt-header">
            <div className="header-left">
              <div className="label-text">RECEIPT NO.</div>
              <div className="value-text">{receipt.receiptNo}</div>
            </div>
            <div className="header-center">
              <div className="company-name">Neeta Engineering Works</div>
              <div className="company-address">179, G.I.D.C., CHANDISAR (B.K.)</div>
            </div>
            <div className="header-right">
              <div className="label-text">DATE</div>
              <div className="value-text">{formatDate(receipt.date)}</div>
            </div>
          </div>

          {/* Body */}
          <div className="receipt-body">
            <div className="data-row">
              <span className="label-text">Received With thanks from M/s.</span>
              <span className="value-text">{receipt.partyName}</span>
            </div>
            
            <div className="data-row">
              <span className="label-text">Rupees in word</span>
              <span className="value-text uppercase">{amountInWords}</span>
            </div>

            <div className="data-row">
              <span className="label-text">By Cash/Cheque No.</span>
              <span className="value-text">{receipt.chequeNo}</span>
            </div>

            <div className="data-row" style={{ display: 'flex', gap: '30px' }}>
              <div style={{ display: 'flex', alignItems: 'baseline' }}>
                <span className="label-text">Payment of our Bill No.</span>
                <span className="value-text" style={{ paddingLeft: '15px' }}>{receipt.billNo}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline' }}>
                <span className="label-text">BILL DAET:</span>
                <span className="value-text" style={{ paddingLeft: '15px' }}>{formatDate(receipt.billDate)}</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="receipt-footer">
            <div className="footer-left">
              <div className="amount-container">
                <span className="rs-text">Rs.</span>
                <div className="amount-box">
                  {receipt.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </div>
              </div>
              
              <div className="terms-text">
                (Payment by Cheque is Subject to realisation) No receipt is<br/>
                Valid except on this form.
              </div>
            </div>
            
            <div className="footer-right">
              <div className="for-text">For, Neeta Engineering Works.</div>
              <div className="stamp-box"></div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
