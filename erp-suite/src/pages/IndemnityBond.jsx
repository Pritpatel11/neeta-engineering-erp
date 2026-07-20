import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Printer, ArrowLeft } from 'lucide-react';
import { getInvoiceDivisions } from '../services/api';
import './ChallanPreview.css'; 

export default function IndemnityBond() {
  const getSavedData = () => {
    try {
      const saved = localStorage.getItem('indemnityBondData');
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  };

  const initData = getSavedData();

  const [divisions, setDivisions] = useState([]);
  const [selectedDivision, setSelectedDivision] = useState(initData.selectedDivision || '');
  const [selectedCompany, setSelectedCompany] = useState(initData.selectedCompany || 'Neeta');

  const companyDetails = {
    Neeta: {
      name: 'Neeta Engineering Work',
      address: '179,G.I.D.C ,CHANDISAR AT.PALANPUR  (B.K)',
      gst: '24ABHPP5386L1Z3',
      footerName: 'NEETA ENGINEERING WORK, CHANDISAR'
    },
    KCPatel: {
      name: 'K.C.PATEL',
      address: '114/52 G.I.D.C ,CHANDISAR AT.PALANPUR (B.K)',
      gst: '24ALKPP4729L1ZM',
      footerName: 'K.C.PATEL, CHANDISAR'
    }
  };
  
  const currentCompany = companyDetails[selectedCompany];

  // Table Data State
  const [orderNo, setOrderNo] = useState(initData.orderNo || 'UGVCL/DOD-II/AC/EXP:-383');
  const [orderDate, setOrderDate] = useState(initData.orderDate || '19.01.2026');
  const [invoiceNo, setInvoiceNo] = useState(initData.invoiceNo || '/11');
  const [invoiceDate, setInvoiceDate] = useState(initData.invoiceDate || '03.06.2026');
  const [assessableValue, setAssessableValue] = useState(initData.assessableValue || '357671.67');
  const [igst, setIgst] = useState(initData.igst || '0');
  const [cgst, setCgst] = useState(initData.cgst || '32190.45');
  const [sgst, setSgst] = useState(initData.sgst || '32190.45');
  const [documentDate, setDocumentDate] = useState(initData.documentDate || '03.06.2026');

  const navigate = useNavigate();

  useEffect(() => {
    getInvoiceDivisions().then(data => {
      setDivisions(data);
      if (initData && initData.selectedDivision) {
        setSelectedDivision(initData.selectedDivision);
      } else if (data && data.length > 0) {
        setSelectedDivision(data[0].name);
      } else {
        setSelectedDivision('Deesa-1');
      }
    }).catch(err => console.error("Failed to fetch divisions", err));
  }, []);

  // Save data whenever it changes
  useEffect(() => {
    const dataToSave = {
      selectedDivision, selectedCompany, orderNo, orderDate, invoiceNo, invoiceDate, assessableValue, igst, cgst, sgst, documentDate
    };
    localStorage.setItem('indemnityBondData', JSON.stringify(dataToSave));
  }, [selectedDivision, selectedCompany, orderNo, orderDate, invoiceNo, invoiceDate, assessableValue, igst, cgst, sgst, documentDate]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="preview-container" style={{ padding: '20px', backgroundColor: '#f3f4f6', minHeight: '100vh' }}>
      <style>
        {`
          @media print {
            @page {
              size: A4 portrait;
              margin: 20mm;
              margin-top: 2.4in;
            }
            body {
              background-color: white !important;
            }
            .no-print {
              display: none !important;
            }
            .preview-container {
              padding: 0 !important;
              background-color: white !important;
            }
            .document-paper {
              box-shadow: none !important;
              padding: 0 !important;
            }
            .bond-input, .bond-textarea {
              border: none !important;
              background: transparent !important;
              padding: 0 !important;
            }
          }
          .bond-input, .bond-textarea {
            width: 100%;
            border: 1px dashed #ccc;
            background: #fff9e6;
            font-family: inherit;
            font-size: inherit;
            color: inherit;
            padding: 4px;
            box-sizing: border-box;
            text-align: center;
            border-radius: 2px;
          }
          .bond-textarea {
            resize: none;
            overflow: hidden;
            display: block;
            line-height: 1.2;
          }
          .bond-input:focus, .bond-textarea:focus {
            outline: 1px solid #0066cc;
            background: #fff;
            border-style: solid;
          }
        `}
      </style>
      
      <div className="preview-actions no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', backgroundColor: 'white', padding: '15px 20px', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', maxWidth: '800px', margin: '0 auto 20px auto' }}>
        <button className="btn-outline" onClick={() => navigate('/')} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 12px', border: '1px solid #ccc', borderRadius: '4px', cursor: 'pointer', background: 'transparent' }}>
          <ArrowLeft size={16} /> Dashboard
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <label style={{ fontWeight: 'bold' }}>Company:</label>
          <select 
            value={selectedCompany} 
            onChange={(e) => setSelectedCompany(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: '4px', border: '1px solid #ccc', outline: 'none', cursor: 'pointer' }}
          >
            <option value="Neeta">Neeta Engineering Work</option>
            <option value="KCPatel">K.C.PATEL</option>
          </select>

          <label style={{ fontWeight: 'bold', marginLeft: '10px' }}>Division:</label>
          <select 
            value={selectedDivision} 
            onChange={(e) => setSelectedDivision(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: '4px', border: '1px solid #ccc', outline: 'none', cursor: 'pointer' }}
          >
            {divisions.map(div => (
              <option key={div._id || div.name} value={div.name}>{div.name}</option>
            ))}
            {divisions.length === 0 && <option value="Deesa-1">Deesa-1</option>}
          </select>
        </div>
        <button className="btn-primary" onClick={handlePrint} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Printer size={18} /> Print Bond
        </button>
      </div>

      <div className="document-paper" style={{ padding: '40px', paddingTop: '1in', fontFamily: 'Arial, sans-serif', maxWidth: '800px', margin: '0 auto', backgroundColor: 'white', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', lineHeight: '1.6', fontSize: '14px', color: '#000' }}>
        
        <div style={{ textAlign: 'center', fontWeight: 'bold', marginBottom: '20px', textDecoration: 'underline' }}>INDEMNITY BOND CUM UNDERTAKING</div>
        
        <div>Uttar Gujarat Vij Company Limited</div>
        <div>{(() => {
          const match = selectedDivision.match(/-(\d+)$/);
          return match ? `O&M Division -${match[1]}` : 'O&M Division';
        })()}</div>
        <div>{selectedDivision.split('-')[0] || selectedDivision}</div>
        <div>GSTIN NO:24AAACU6551F1ZI</div>
        <br />
        <div><strong>Sub:</strong> Payment Of GST Amount and filing Of GST Return</div>
        <br />
        <div>Sir/Madam</div>
        <div style={{ textAlign: 'justify', marginBottom: '15px' }}>
          With reference to payment of GST amount and filing of GST Return for availing input Tax Credit (ITC) By you as per Eligibility Provisions for The Identified Invoices raised By Us, We, M/S. <u>{currentCompany.name}</u>  (the Firm/Company) Having Our Registered Office At <u>{currentCompany.address}</u>  Possessing GST Identification No.<u>{currentCompany.gst}</u> Hereby declare and undertake as follows:
        </div>
        
        <div style={{ marginBottom: '15px' }}>
          (1) Wehave disclosed all the facts relating to our Firm/Company to Uttar Gujarat Vij Company Limited,Address.GSTIN No.24AAACU6551F1ZI
        </div>
        
        <div style={{ marginBottom: '15px' }}>
          (2) We hereby declare that Wehave paid/agree to pay GST for The related invoices as per details below to the respective GST Authorities.
        </div>
        
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '15px', fontSize: '12px' }}>
          <thead>
            <tr>
              <th style={{ ...tableCellStyle, width: '4%' }}>SI No.</th>
              <th style={{ ...tableCellStyle, width: '18%' }}>Order No.</th>
              <th style={{ ...tableCellStyle, width: '12%' }}>Order Date</th>
              <th style={{ ...tableCellStyle, width: '12%' }}>Invoice No.</th>
              <th style={{ ...tableCellStyle, width: '12%' }}>Invoice Date</th>
              <th style={{ ...tableCellStyle, width: '12%' }}>Assessable Value( Rs.)</th>
              <th style={{ ...tableCellStyle, width: '6%' }}>IGST (RS.)</th>
              <th style={{ ...tableCellStyle, width: '12%' }}>CGST (Rs.)</th>
              <th style={{ ...tableCellStyle, width: '12%' }}>SGST (Rs.)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={tableCellStyle}>1</td>
              <td style={{ ...tableCellStyle, padding: '4px' }}>
                <textarea rows="2" className="bond-textarea" value={orderNo} onChange={(e) => setOrderNo(e.target.value)} />
              </td>
              <td style={{ ...tableCellStyle, padding: '4px' }}>
                <input type="text" className="bond-input" value={orderDate} onChange={(e) => setOrderDate(e.target.value)} />
              </td>
              <td style={{ ...tableCellStyle, padding: '4px' }}>
                <input type="text" className="bond-input" value={invoiceNo} onChange={(e) => setInvoiceNo(e.target.value)} />
              </td>
              <td style={{ ...tableCellStyle, padding: '4px' }}>
                <input type="text" className="bond-input" value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} />
              </td>
              <td style={{ ...tableCellStyle, padding: '4px' }}>
                <input 
                  type="text" 
                  className="bond-input" 
                  value={assessableValue} 
                  onChange={(e) => {
                    const val = e.target.value;
                    setAssessableValue(val);
                    const numVal = parseFloat(val);
                    if (!isNaN(numVal)) {
                      const tax = (numVal * 0.09).toFixed(2);
                      setCgst(tax);
                      setSgst(tax);
                    } else if (val === '') {
                      setCgst('0');
                      setSgst('0');
                    }
                  }} 
                />
              </td>
              <td style={{ ...tableCellStyle, padding: '4px' }}>
                <input type="text" className="bond-input" value={igst} onChange={(e) => setIgst(e.target.value)} />
              </td>
              <td style={{ ...tableCellStyle, padding: '4px' }}>
                <input type="text" className="bond-input" value={cgst} onChange={(e) => setCgst(e.target.value)} />
              </td>
              <td style={{ ...tableCellStyle, padding: '4px' }}>
                <input type="text" className="bond-input" value={sgst} onChange={(e) => setSgst(e.target.value)} />
              </td>
            </tr>
          </tbody>
        </table>
        
        <div style={{ textAlign: 'justify', marginBottom: '15px' }}>
          InThis Connection,Wehereby agree and undertake to furnish to you proof of payment of GST (Self-attested GSTR-3B), which includes above mentioned GST Amount.
        </div>
        
        <div style={{ textAlign: 'justify', marginBottom: '15px' }}>
          (3) We hereby declare that we have filed/shall file GSTR-3B And GSTR-1 related to the above-mentioned invoices in time.Inthis connection. We hereby agree and undertake to furnish you proof of electronically filed GST Return to The authority.
        </div>
        
        <div style={{ marginBottom: '10px' }}>(4)We hereby agree and undertake to indemnify as under:-</div>
        <div style={{ marginLeft: '30px', textAlign: 'justify', marginBottom: '10px' }}>
          (i) The Firm/Company shall take all necessary safeguards to ensure availing of ITC on above mentioned invoices as per eligibility by Uttar Gujarat Vij Company Limited,Address,GSTIN NO.24AAACU6551F1ZI within the time limit provided in the GST provision.
        </div>
        <div style={{ marginLeft: '30px', textAlign: 'justify', marginBottom: '15px' }}>
          (ii) in case of any demand / rejection of ITC by the concerned tax Authority, for non-payment of GST amount by us or for any other reasons attributable to us, we hereby undertake and agree to indemnify Uttar Gujarat Vij Company Limited,Address, GSTIN No: 24AAACU6551F1ZI  in full against all consequences, liabilities of any kind whatsoever directly arising due to non-payment,of GST/non-filing of GST returns and / or such availment of ITC by you.
        </div>
        
        <div style={{ marginBottom: '10px' }}>We hereby agree and confirm that-</div>
        <div style={{ textAlign: 'justify', marginBottom: '10px' }}>
          Any breach of the above indemnification or undertakings shall be construed as breach of the terms and conditions for reimbursement of GST and UGVCL shall be at liberty to take  such action against us including recovering of reimbursed GST amount from.
        </div>
        <div style={{ marginLeft: '30px', marginBottom: '15px' }}>
          <div>a) Security Deposit Paid for any of your supply/work , if any or</div>
          <div>b) any of our Bank Guarantee executed in your favour, if any or</div>
          <div>c)  other unpaid invoices, if any of us raised either at UGVCL or with GUVNL AND ITS                                                  	Subsidiary Companies.</div>
        </div>
        
        <div style={{ textAlign: 'justify', marginBottom: '50px' }}>
          I/We Declare That I Am empowered to execute this indemnity Bond Cum Undertaking and the same is given under the orders of proper authority as per the delegation of power of the organization.
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div>Place:   CHANDISAR</div>
            <div style={{ marginTop: '60px', display: 'flex', alignItems: 'center' }}>
              Date:-
              <input 
                type="text" 
                className="bond-input" 
                value={documentDate} 
                onChange={(e) => setDocumentDate(e.target.value)} 
                style={{ width: '100px', marginLeft: '5px', textAlign: 'left' }}
              />
            </div>
          </div>
          <div>
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <div>Authorized  Signature of The</div>
              <div>Indemnifier</div>
            </div>
            <div>Name:- {currentCompany.footerName}</div>
            <div>Designation:- PROPRIETOR</div>
            <div style={{ marginTop: '10px' }}>Seal:-</div>
          </div>
        </div>
        
      </div>
    </div>
  );
}

const tableCellStyle = {
  border: '1px solid black',
  padding: '6px',
  textAlign: 'center',
  wordBreak: 'normal'
};
