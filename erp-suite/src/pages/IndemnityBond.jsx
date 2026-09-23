import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Printer, ArrowLeft } from 'lucide-react';
import { getInvoiceDivisions } from '../services/api';

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

  const bondInputClass = "w-full border border-dashed border-slate-300 bg-amber-50 text-inherit p-1 box-border text-center rounded focus:outline-none focus:border-[#0059bb] focus:bg-white focus:border-solid focus:ring-1 focus:ring-[#0059bb] print:border-none print:bg-transparent print:p-0 text-xs";
  const bondTextareaClass = "w-full border border-dashed border-slate-300 bg-amber-50 text-inherit p-1 box-border text-center rounded resize-none overflow-hidden block leading-tight focus:outline-none focus:border-[#0059bb] focus:bg-white focus:border-solid focus:ring-1 focus:ring-[#0059bb] print:border-none print:bg-transparent print:p-0 text-xs";

  return (
    <div className="p-3 sm:p-6 bg-slate-50 min-h-screen flex flex-col items-center print:bg-white print:p-0 print:min-h-0">
      <div className="print:hidden w-full max-w-4xl flex flex-wrap items-center justify-between gap-3 mb-6 bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/90 shadow-xs">
        <button 
          className="inline-flex items-center gap-2 px-3.5 py-2 bg-white border border-slate-300 text-[#0059bb] rounded-xl font-semibold text-xs sm:text-sm hover:bg-slate-50 transition-colors cursor-pointer" 
          onClick={() => navigate('/')}
        >
          <ArrowLeft size={16} /> <span>Dashboard</span>
        </button>

        <div className="flex flex-wrap items-center gap-3 bg-slate-50 border border-slate-200/80 px-3 py-1.5 rounded-xl text-xs">
          <div className="flex items-center gap-1.5">
            <label className="font-bold text-slate-700">Company:</label>
            <select 
              value={selectedCompany} 
              onChange={(e) => setSelectedCompany(e.target.value)}
              className="bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs text-slate-800 font-medium focus:outline-none focus:ring-1 focus:ring-[#0059bb]"
            >
              <option value="Neeta">Neeta Engineering Work</option>
              <option value="KCPatel">K.C.PATEL</option>
            </select>
          </div>

          <div className="hidden sm:block w-px h-5 bg-slate-300"></div>

          <div className="flex items-center gap-1.5">
            <label className="font-bold text-slate-700">Division:</label>
            <select 
              value={selectedDivision} 
              onChange={(e) => setSelectedDivision(e.target.value)}
              className="bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs text-slate-800 font-medium focus:outline-none focus:ring-1 focus:ring-[#0059bb]"
            >
              {divisions.map(div => (
                <option key={div._id || div.name} value={div.name}>{div.name}</option>
              ))}
              {divisions.length === 0 && <option value="Deesa-1">Deesa-1</option>}
            </select>
          </div>
        </div>

        <button 
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#0059bb] hover:bg-[#004899] text-white rounded-xl font-semibold text-xs sm:text-sm shadow-sm transition-all cursor-pointer" 
          onClick={handlePrint}
        >
          <Printer size={16} /> <span>Print Bond</span>
        </button>
      </div>

      <div className="overflow-x-auto w-full pb-6 print:p-0 print:overflow-visible">
        <div className="bg-white p-8 sm:p-12 print:p-0 font-sans max-w-[800px] mx-auto shadow-md print:shadow-none border border-slate-200 print:border-none text-black leading-relaxed text-sm">
          
          <div className="text-center font-bold mb-5 underline text-base">INDEMNITY BOND CUM UNDERTAKING</div>
          
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
          <div className="text-justify mb-4">
            With reference to payment of GST amount and filing of GST Return for availing input Tax Credit (ITC) By you as per Eligibility Provisions for The Identified Invoices raised By Us, We, M/S. <u>{currentCompany.name}</u>  (the Firm/Company) Having Our Registered Office At <u>{currentCompany.address}</u>  Possessing GST Identification No.<u>{currentCompany.gst}</u> Hereby declare and undertake as follows:
          </div>
          
          <div className="mb-4">
            (1) Wehave disclosed all the facts relating to our Firm/Company to Uttar Gujarat Vij Company Limited,Address.GSTIN No.24AAACU6551F1ZI
          </div>
          
          <div className="mb-4">
            (2) We hereby declare that Wehave paid/agree to pay GST for The related invoices as per details below to the respective GST Authorities.
          </div>
          
          <table className="w-full border-collapse mb-4 text-xs border border-black">
            <thead>
              <tr className="bg-slate-50 font-bold">
                <th className="border border-black p-1.5 text-center w-[4%]">SI No.</th>
                <th className="border border-black p-1.5 text-center w-[18%]">Order No.</th>
                <th className="border border-black p-1.5 text-center w-[12%]">Order Date</th>
                <th className="border border-black p-1.5 text-center w-[12%]">Invoice No.</th>
                <th className="border border-black p-1.5 text-center w-[12%]">Invoice Date</th>
                <th className="border border-black p-1.5 text-center w-[12%]">Assessable Value( Rs.)</th>
                <th className="border border-black p-1.5 text-center w-[6%]">IGST (RS.)</th>
                <th className="border border-black p-1.5 text-center w-[12%]">CGST (Rs.)</th>
                <th className="border border-black p-1.5 text-center w-[12%]">SGST (Rs.)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-black p-1 text-center">1</td>
                <td className="border border-black p-1">
                  <textarea rows="2" className={bondTextareaClass} value={orderNo} onChange={(e) => setOrderNo(e.target.value)} />
                </td>
                <td className="border border-black p-1">
                  <input type="text" className={bondInputClass} value={orderDate} onChange={(e) => setOrderDate(e.target.value)} />
                </td>
                <td className="border border-black p-1">
                  <input type="text" className={bondInputClass} value={invoiceNo} onChange={(e) => setInvoiceNo(e.target.value)} />
                </td>
                <td className="border border-black p-1">
                  <input type="text" className={bondInputClass} value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} />
                </td>
                <td className="border border-black p-1">
                  <input 
                    type="text" 
                    className={bondInputClass} 
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
                <td className="border border-black p-1">
                  <input type="text" className={bondInputClass} value={igst} onChange={(e) => setIgst(e.target.value)} />
                </td>
                <td className="border border-black p-1">
                  <input type="text" className={bondInputClass} value={cgst} onChange={(e) => setCgst(e.target.value)} />
                </td>
                <td className="border border-black p-1">
                  <input type="text" className={bondInputClass} value={sgst} onChange={(e) => setSgst(e.target.value)} />
                </td>
              </tr>
            </tbody>
          </table>
          
          <div className="text-justify mb-4">
            InThis Connection,Wehereby agree and undertake to furnish to you proof of payment of GST (Self-attested GSTR-3B), which includes above mentioned GST Amount.
          </div>
          
          <div className="text-justify mb-4">
            (3) We hereby declare that we have filed/shall file GSTR-3B And GSTR-1 related to the above-mentioned invoices in time.Inthis connection. We hereby agree and undertake to furnish you proof of electronically filed GST Return to The authority.
          </div>
          
          <div className="mb-2.5">(4)We hereby agree and undertake to indemnify as under:-</div>
          <div className="ml-7 text-justify mb-2.5">
            (i) The Firm/Company shall take all necessary safeguards to ensure availing of ITC on above mentioned invoices as per eligibility by Uttar Gujarat Vij Company Limited,Address,GSTIN NO.24AAACU6551F1ZI within the time limit provided in the GST provision.
          </div>
          <div className="ml-7 text-justify mb-4">
            (ii) in case of any demand / rejection of ITC by the concerned tax Authority, for non-payment of GST amount by us or for any other reasons attributable to us, we hereby undertake and agree to indemnify Uttar Gujarat Vij Company Limited,Address, GSTIN No: 24AAACU6551F1ZI  in full against all consequences, liabilities of any kind whatsoever directly arising due to non-payment,of GST/non-filing of GST returns and / or such availment of ITC by you.
          </div>
          
          <div className="mb-2.5">We hereby agree and confirm that-</div>
          <div className="text-justify mb-2.5">
            Any breach of the above indemnification or undertakings shall be construed as breach of the terms and conditions for reimbursement of GST and UGVCL shall be at liberty to take  such action against us including recovering of reimbursed GST amount from.
          </div>
          <div className="ml-7 mb-4 space-y-1">
            <div>a) Security Deposit Paid for any of your supply/work , if any or</div>
            <div>b) any of our Bank Guarantee executed in your favour, if any or</div>
            <div>c)  other unpaid invoices, if any of us raised either at UGVCL or with GUVNL AND ITS Subsidiary Companies.</div>
          </div>
          
          <div className="text-justify mb-12">
            I/We Declare That I Am empowered to execute this indemnity Bond Cum Undertaking and the same is given under the orders of proper authority as per the delegation of power of the organization.
          </div>
          
          <div className="flex justify-between items-start">
            <div>
              <div>Place:   CHANDISAR</div>
              <div className="mt-14 flex items-center">
                Date:-
                <input 
                  type="text" 
                  className={`${bondInputClass} w-28 ml-1.5 text-left`}
                  value={documentDate} 
                  onChange={(e) => setDocumentDate(e.target.value)} 
                />
              </div>
            </div>
            <div>
              <div className="text-center mb-5">
                <div>Authorized  Signature of The</div>
                <div>Indemnifier</div>
              </div>
              <div>Name:- {currentCompany.footerName}</div>
              <div>Designation:- PROPRIETOR</div>
              <div className="mt-2.5">Seal:-</div>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
