import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Printer, ArrowLeft, Edit, Mail, Send, X, CheckCircle, Download, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { getPrivateInvoice, sendPrivateInvoiceEmail } from '../services/api';

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

export default function PrivateInvoice() {
  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(location.search);
  const idFromUrl = searchParams.get('id');

  const invoicePrintRef = useRef(null);

  const defaultSampleData = {
    invoiceNo: 'PI-001',
    date: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0],
    poNumber: 'PO/2026/04',
    clientName: 'Sample Private Client',
    clientAddress: 'Plot No. 42, Industrial Area, Ahmedabad, Gujarat',
    clientPhone: '+91 98765 43210',
    clientEmail: 'client@example.com',
    clientGST: '24AAAAA0000A1Z5',
    buyerState: 'Gujarat',
    buyerStateCode: '24',
    isInterState: false,
    documentType: 'TAX INVOICE',
    items: [
      { description: 'Precision CNC Machined Components', hsn: '8483', quantity: 10, unit: 'Nos', rate: 2500, amount: 25000 },
      { description: 'Surface Finishing & Heat Treatment', hsn: '8483', quantity: 10, unit: 'Nos', rate: 450, amount: 4500 }
    ],
    subTotal: 29500,
    taxPercentage: 18,
    taxAmount: 5310,
    cgstAmount: 2655,
    sgstAmount: 2655,
    igstAmount: 0,
    totalAmount: 34810,
    terms: '1. Payment: Full payment must be completed immediately upon delivery.\n2. Goods once sold will not be taken back or exchanged.\n3. Subject to Banaskantha/Palanpur jurisdiction.',
    status: 'Draft'
  };

  const [invoiceData, setInvoiceData] = useState(location.state?.invoiceData || null);
  const [loading, setLoading] = useState(!location.state?.invoiceData && !!idFromUrl);

  // Email modal state
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [emailTo, setEmailTo] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailNote, setEmailNote] = useState('');
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  useEffect(() => {
    if (!invoiceData && idFromUrl) {
      setLoading(true);
      getPrivateInvoice(idFromUrl)
        .then(data => {
          setInvoiceData(data);
        })
        .catch(err => {
          console.error("Failed to load invoice", err);
          toast.error('Could not load invoice. Showing default view.');
          setInvoiceData(defaultSampleData);
        })
        .finally(() => setLoading(false));
    } else if (!invoiceData && !idFromUrl) {
      setInvoiceData(defaultSampleData);
    }
  }, [idFromUrl]);

  // Set email defaults when modal opens
  useEffect(() => {
    if (invoiceData) {
      setEmailTo(invoiceData.clientEmail || '');
      setEmailSubject(`Tax Invoice #${invoiceData.invoiceNo} - Neeta Engineering Works`);
      setEmailNote(`Please find attached your Tax Invoice #${invoiceData.invoiceNo} for ₹ ${Number(invoiceData.totalAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}.`);
    }
  }, [invoiceData, isEmailModalOpen]);

  if (loading) {
    return <div className="p-8 text-center text-slate-500 font-sans text-sm">Loading Invoice...</div>;
  }

  const invoice = invoiceData || defaultSampleData;

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

  // Helper to generate PDF using html2canvas & jspdf
  const generatePdfBlob = async () => {
    if (!invoicePrintRef.current) return null;
    const canvas = await html2canvas(invoicePrintRef.current, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff'
    });
    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
    return pdf;
  };

  // Download PDF locally
  const handleDownloadPdf = async () => {
    try {
      setIsGeneratingPdf(true);
      toast.loading('Generating PDF...', { id: 'pdf-toast' });
      const pdf = await generatePdfBlob();
      if (pdf) {
        pdf.save(`Invoice_${invoice.invoiceNo}.pdf`);
        toast.success('Invoice PDF downloaded successfully!', { id: 'pdf-toast' });
      } else {
        toast.error('Failed to generate PDF', { id: 'pdf-toast' });
      }
    } catch (err) {
      console.error('PDF generation error:', err);
      toast.error('Error creating PDF: ' + err.message, { id: 'pdf-toast' });
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Send Email with PDF attachment via NodeMailer
  const handleSendEmail = async (e) => {
    e.preventDefault();
    if (!emailTo || !emailTo.includes('@')) {
      toast.error('Please enter a valid recipient email address');
      return;
    }

    try {
      setIsSendingEmail(true);
      toast.loading('Generating invoice PDF & sending email...', { id: 'email-toast' });

      // Generate PDF base64 from rendered element
      let pdfBase64 = null;
      try {
        const pdf = await generatePdfBlob();
        if (pdf) {
          pdfBase64 = pdf.output('datauristring');
        }
      } catch (pdfErr) {
        console.warn('Canvas PDF creation warning, fallback to server generator:', pdfErr);
      }

      const payload = {
        email: emailTo.trim(),
        subject: emailSubject,
        note: emailNote,
        invoice: invoice,
        pdfBase64: pdfBase64
      };

      const targetId = invoice._id || idFromUrl || 'direct';
      await sendPrivateInvoiceEmail(targetId, payload);

      toast.success(`Invoice sent successfully to ${emailTo}!`, { id: 'email-toast' });
      setIsEmailModalOpen(false);

      if (invoice._id) {
        setInvoiceData(prev => ({ ...prev, status: 'Sent' }));
      }
    } catch (err) {
      console.error('Failed to send invoice email:', err);
      toast.error('Failed to send email: ' + (err.response?.data?.message || err.message), { id: 'email-toast' });
    } finally {
      setIsSendingEmail(false);
    }
  };

  const isInterState = invoice.isInterState || (invoice.clientGST && invoice.clientGST.substring(0, 2) !== '24');
  const docTitle = invoice.documentType ? invoice.documentType.toUpperCase() : 'TAX INVOICE';

  return (
    <div className="p-4 sm:p-6 bg-slate-100 min-h-screen print:bg-white print:p-0 print:min-h-0 font-sans text-xs text-black flex flex-col items-center">
      {/* Top Action Bar (hidden when printing) */}
      <div className="print:hidden w-full max-w-[210mm] flex flex-wrap items-center justify-between gap-3 mb-6 bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/90 shadow-xs">
        <div className="flex items-center gap-2">
          <button 
            type="button"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-xl font-semibold text-xs sm:text-sm transition-colors cursor-pointer" 
            onClick={() => navigate('/private-invoices')}
          >
            <ArrowLeft size={16} /> Back to Invoices
          </button>
          {invoice._id && (
            <button 
              type="button"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-amber-50 border border-amber-300 text-amber-800 hover:bg-amber-100 rounded-xl font-semibold text-xs sm:text-sm transition-colors cursor-pointer" 
              onClick={() => navigate('/create-private-invoice', { state: { editData: invoice } })}
            >
              <Edit size={16} /> Edit
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button 
            type="button"
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 rounded-xl font-semibold text-xs sm:text-sm transition-all cursor-pointer" 
            onClick={handleDownloadPdf}
            disabled={isGeneratingPdf}
          >
            <Download size={16} /> Download PDF
          </button>

          <button 
            type="button"
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold text-xs sm:text-sm shadow-sm transition-all cursor-pointer" 
            onClick={() => setIsEmailModalOpen(true)}
          >
            <Mail size={16} /> Share via Email
          </button>

          <button 
            type="button"
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#0059bb] hover:bg-[#004c9e] text-white rounded-xl font-semibold text-xs sm:text-sm shadow-sm transition-all cursor-pointer" 
            onClick={handlePrint}
          >
            <Printer size={18} /> Print / Save PDF
          </button>
        </div>
      </div>

      {/* Invoice Paper (Matches QuotationPreview Exact Structure) */}
      <div className="w-full overflow-x-auto flex justify-center py-2 print:p-0 print:overflow-visible">
        <div 
          ref={invoicePrintRef}
          className="bg-white w-full max-w-[210mm] shadow-md border border-slate-300 text-black box-border print:shadow-none print:border-none print:p-0 print:m-0 print:max-w-none print:w-full"
        >
          {/* Header Title */}
          <div className="text-center font-bold text-base p-2 border-b border-black tracking-wide">
            {docTitle}
          </div>
          
          <div className="border border-black w-full flex flex-col">
            {/* Header: Company Details & Buyer Details */}
            <div className="flex border-b border-black">
              {/* Left Column: Company & Buyer */}
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
                  <div className="font-bold text-sm text-black">{invoice.clientName || 'N/A'}</div>
                  <div className="text-xs text-slate-800 whitespace-pre-line">{invoice.clientAddress || '-'}</div>
                  {invoice.buyerState && (
                    <div className="text-xs mt-0.5">
                      State: <strong>{invoice.buyerState} {invoice.buyerStateCode ? `(Code: ${invoice.buyerStateCode})` : ''}</strong>
                    </div>
                  )}
                  {invoice.clientGST && (
                    <div className="text-xs mt-0.5">GSTIN/UIN: <strong>{invoice.clientGST}</strong></div>
                  )}
                </div>
              </div>
              
              {/* Right Column: Invoice Details Grid */}
              <div className="w-1/2 flex flex-col">
                <div className="grid grid-cols-2 h-full text-xs">
                  <div className="p-2 border-b border-r border-black">
                    <div className="text-[10px] text-slate-600">Invoice No.</div>
                    <div className="font-bold text-sm text-black mt-0.5">{invoice.invoiceNo}</div>
                  </div>
                  <div className="p-2 border-b border-black">
                    <div className="text-[10px] text-slate-600">Dated</div>
                    <div className="font-bold text-sm text-black mt-0.5">{formatDate(invoice.date)}</div>
                  </div>

                  <div className="p-2 border-b border-r border-black">
                    <div className="text-[10px] text-slate-600">Buyer's Ref / PO No.</div>
                    <div className="text-xs text-slate-800 font-semibold mt-0.5">
                      {invoice.poNumber || 'N/A'}
                    </div>
                  </div>
                  <div className="p-2 border-b border-black">
                    <div className="text-[10px] text-slate-600">Due Date</div>
                    <div className="text-xs text-slate-800 font-semibold mt-0.5">
                      {formatDate(invoice.dueDate)}
                    </div>
                  </div>

                  <div className="p-2 border-b border-r border-black">
                    <div className="text-[10px] text-slate-600">Terms of Payment</div>
                    <div className="text-xs text-slate-800 mt-0.5">Immediate / Due upon receipt</div>
                  </div>
                  <div className="p-2 border-b border-black">
                    <div className="text-[10px] text-slate-600">Contact No.</div>
                    <div className="text-xs text-slate-800 mt-0.5">
                      {invoice.clientPhone || 'N/A'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Line Items Table */}
            <div className="border-b border-black min-h-[220px] flex flex-col">
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
                  {(invoice.items || []).map((item, index) => (
                    <tr key={index}>
                      <td className="border-r border-black p-1 text-center">{index + 1}</td>
                      <td className="border-r border-black p-1 font-bold">{item.description}</td>
                      <td className="border-r border-black p-1 text-center">{item.hsn || ''}</td>
                      <td className="border-r border-black p-1 text-right font-bold font-mono">
                        {item.quantity} {item.unit || 'Nos'}
                      </td>
                      <td className="border-r border-black p-1 text-right font-mono">{Number(item.rate || 0).toFixed(2)}</td>
                      <td className="border-r border-black p-1 text-center">{item.unit || 'Nos'}</td>
                      <td className="p-1 text-right font-bold font-mono">{Number(item.amount || 0).toFixed(2)}</td>
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
                      {Number(invoice.subTotal || (invoice.items || []).reduce((acc, item) => acc + (Number(item.amount) || 0), 0)).toFixed(2)}
                    </td>
                  </tr>

                  {/* TAX ROWS */}
                  {Number(invoice.taxPercentage) > 0 && (
                    <>
                      {isInterState ? (
                        <tr>
                          <td className="border-r border-black p-1"></td>
                          <td className="border-r border-black p-1 text-right pr-4 text-sky-700 font-medium">IGST (Integrated Tax)</td>
                          <td className="border-r border-black p-1"></td>
                          <td className="border-r border-black p-1"></td>
                          <td className="border-r border-black p-1 text-right font-mono">{invoice.taxPercentage}%</td>
                          <td className="border-r border-black p-1"></td>
                          <td className="p-1 text-right font-mono">{Number(invoice.taxAmount || 0).toFixed(2)}</td>
                        </tr>
                      ) : (
                        <>
                          <tr>
                            <td className="border-r border-black p-1"></td>
                            <td className="border-r border-black p-1 text-right pr-4 text-slate-700">CGST</td>
                            <td className="border-r border-black p-1"></td>
                            <td className="border-r border-black p-1"></td>
                            <td className="border-r border-black p-1 text-right font-mono">{Number(invoice.taxPercentage) / 2}%</td>
                            <td className="border-r border-black p-1"></td>
                            <td className="p-1 text-right font-mono">{Number(invoice.cgstAmount || (invoice.taxAmount / 2) || 0).toFixed(2)}</td>
                          </tr>
                          <tr>
                            <td className="border-r border-black p-1"></td>
                            <td className="border-r border-black p-1 text-right pr-4 text-slate-700">SGST</td>
                            <td className="border-r border-black p-1"></td>
                            <td className="border-r border-black p-1"></td>
                            <td className="border-r border-black p-1 text-right font-mono">{Number(invoice.taxPercentage) / 2}%</td>
                            <td className="border-r border-black p-1"></td>
                            <td className="p-1 text-right font-mono">{Number(invoice.sgstAmount || (invoice.taxAmount / 2) || 0).toFixed(2)}</td>
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
                      {(invoice.items || []).reduce((sum, item) => sum + Number(item.quantity || 0), 0)}
                    </th>
                    <th colSpan="2" className="border-r border-black p-1.5"></th>
                    <th className="p-1.5 text-right font-mono text-sm">
                      ₹ {Number(invoice.totalAmount || 0).toFixed(2)}
                    </th>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Amount in words */}
            <div className="p-2 border-b border-black text-xs">
              <span className="text-[10px] text-slate-600 uppercase font-semibold">Amount Chargeable (in words)</span><br/>
              <span className="font-bold text-sm">
                INR {numberToWords(invoice.totalAmount)}
              </span>
            </div>

            {/* Bottom Section: Bank Details, Terms & Signatory */}
            <div className="flex">
              <div className="w-1/2 border-r border-black flex flex-col text-xs">
                <div className="p-2 border-b border-black">
                  <div className="text-[10px] font-semibold italic text-slate-700">Company's Bank Details</div>
                  <div className="flex gap-2 mt-1">
                    <span className="w-20 font-medium">Bank Name</span>
                    <span>: <strong>{invoice.bankDetails?.bankName || "The Mehsana Urban Co-operative Bank Ltd."}</strong></span>
                  </div>
                  <div className="flex gap-2">
                    <span className="w-20 font-medium">A/c No.</span>
                    <span>: <strong>{invoice.bankDetails?.accountNo || "00141101001022"}</strong></span>
                  </div>
                  <div className="flex gap-2">
                    <span className="w-20 font-medium">IFS Code</span>
                    <span>: <strong>{invoice.bankDetails?.ifsc || "MSNU0000014"}</strong></span>
                  </div>
                  <div className="flex gap-2">
                    <span className="w-20 font-medium">Branch</span>
                    <span>: <strong>{invoice.bankDetails?.branch || "Deesa Branch"}</strong></span>
                  </div>
                </div>
                <div className="p-2">
                  <div className="font-bold underline text-xs mb-1">Terms & Conditions</div>
                  <div className="text-xs whitespace-pre-wrap text-slate-700 leading-relaxed">
                    {invoice.terms}
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
      </div>

      {/* Share by Email Modal (NodeMailer Integration) */}
      {isEmailModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 bg-[#0059bb] text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mail size={20} />
                <h3 className="font-bold text-base">Share Invoice via Email</h3>
              </div>
              <button 
                type="button" 
                onClick={() => setIsEmailModalOpen(false)}
                className="p-1 hover:bg-white/20 rounded-lg transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSendEmail} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Recipient Email Address <span className="text-rose-500">*</span>
                </label>
                <input 
                  type="email"
                  required
                  placeholder="e.g. client@company.com"
                  value={emailTo}
                  onChange={(e) => setEmailTo(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0059bb]/20 focus:border-[#0059bb]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Subject Line
                </label>
                <input 
                  type="text"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0059bb]/20 focus:border-[#0059bb]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Custom Message / Note
                </label>
                <textarea 
                  rows={3}
                  value={emailNote}
                  onChange={(e) => setEmailNote(e.target.value)}
                  placeholder="Add a message for the client..."
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0059bb]/20 focus:border-[#0059bb]"
                />
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 flex items-start gap-2">
                <FileText size={16} className="text-[#0059bb] shrink-0 mt-0.5" />
                <div>
                  <strong>PDF Attachment Included:</strong><br/>
                  <span>Invoice #{invoice.invoiceNo} will be generated with the exact professional layout and attached directly to the email.</span>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button 
                  type="button"
                  onClick={() => setIsEmailModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={isSendingEmail}
                  className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-[#0059bb] hover:bg-[#004c9e] rounded-xl shadow-sm transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isSendingEmail ? (
                    <>Sending Email...</>
                  ) : (
                    <>
                      <Send size={16} /> Send Invoice PDF
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
