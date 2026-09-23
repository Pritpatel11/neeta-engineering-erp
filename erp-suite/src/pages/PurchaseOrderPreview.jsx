import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { 
  Printer, ArrowLeft, Download, Building2, Phone, Mail, 
  MapPin, CheckCircle2, ShieldCheck, RefreshCcw 
} from 'lucide-react';
import { getPurchaseOrderById } from '../services/api';
import toast from 'react-hot-toast';

export default function PurchaseOrderPreview() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const poId = searchParams.get('id');

  const [purchase, setPurchase] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!poId) {
      toast.error('No Purchase Order specified');
      navigate('/purchase-management');
      return;
    }

    const loadPO = async () => {
      setIsLoading(true);
      try {
        const data = await getPurchaseOrderById(poId);
        setPurchase(data);
      } catch (err) {
        console.error('Failed to load PO:', err);
        toast.error('Could not load Purchase Order');
      } finally {
        setIsLoading(false);
      }
    };

    loadPO();
  }, [poId]);

  const handlePrint = () => {
    window.print();
  };

  if (isLoading || !purchase) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="text-center text-slate-500">
          <RefreshCcw size={32} className="animate-spin mx-auto mb-3 text-[#0059bb]" />
          <p className="font-medium">Loading Purchase Order Preview...</p>
        </div>
      </div>
    );
  }

  // Approved Vendor & Estimate
  const approvedEstimate = purchase.vendorEstimates?.find(
    e => e.vendorId?._id?.toString() === purchase.ownerApproval?.approvedVendorId?._id?.toString() ||
         e.vendorId?.toString() === purchase.ownerApproval?.approvedVendorId?.toString()
  ) || purchase.vendorEstimates?.[0];

  const vendor = purchase.ownerApproval?.approvedVendorId || approvedEstimate?.vendorId || {};

  return (
    <div className="min-h-screen bg-slate-100 py-6 px-4 sm:px-6">
      {/* Top Action Bar (Hidden in Print) */}
      <div className="max-w-4xl mx-auto mb-6 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <button
          onClick={() => navigate('/purchase-management')}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs sm:text-sm font-semibold transition-colors cursor-pointer shadow-xs"
        >
          <ArrowLeft size={16} />
          <span>Back to Purchase Management</span>
        </button>

        <div className="flex items-center gap-2.5">
          <span className="text-xs text-slate-500 hidden sm:inline">
            Status: <strong className="text-emerald-700 font-bold uppercase">{purchase.status}</strong>
          </span>

          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-[#0059bb] hover:bg-[#004899] text-white text-xs sm:text-sm font-semibold transition-colors cursor-pointer shadow-sm"
          >
            <Printer size={16} />
            <span>Print Purchase Order / PDF</span>
          </button>
        </div>
      </div>

      {/* Main Printable Purchase Order Document */}
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-md border border-slate-200 p-8 sm:p-12 print:p-0 print:border-none print:shadow-none print:rounded-none text-slate-800">
        {/* Document Header */}
        <div className="flex justify-between items-start border-b-2 border-slate-900 pb-6 mb-6">
          <div className="space-y-1">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              NEETA ENGINEERING WORKS
            </h1>
            <p className="text-xs text-slate-600 max-w-sm">
              Plot No. 12, GIDC Industrial Estate, Mehsana - 384002, Gujarat, India
            </p>
            <div className="text-xs text-slate-600 pt-1">
              <span><strong>GSTIN:</strong> 24AABCS1429B1Z0</span> | <span><strong>PAN:</strong> AABCS1429B</span>
            </div>
            <div className="text-xs text-slate-500">
              Email: neeta5788@gmail.com | Phone: +91 98250 12345
            </div>
          </div>

          <div className="text-right">
            <div className="inline-block bg-slate-900 text-white px-4 py-1 rounded text-xs font-bold uppercase tracking-wider mb-2">
              PURCHASE ORDER
            </div>
            <div className="text-sm font-black text-slate-900 font-mono">
              {purchase.poNo || 'PO-DRAFT'}
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              PO Date: {purchase.purchaseOrderDetails?.poDate ? new Date(purchase.purchaseOrderDetails.poDate).toLocaleDateString('en-IN') : new Date().toLocaleDateString('en-IN')}
            </div>
            <div className="text-xs text-slate-400 mt-0.5">
              PR Ref: {purchase.prNo}
            </div>
          </div>
        </div>

        {/* Vendor & Client Reference Grid */}
        <div className="grid grid-cols-2 gap-6 mb-8 text-xs border border-slate-200 rounded-xl p-4 bg-slate-50/50">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              PURCHASE FROM (VENDOR / SUPPLIER):
            </span>
            <div className="font-bold text-sm text-slate-900">{approvedEstimate?.vendorName || vendor.name}</div>
            {vendor.contactPerson && <div className="text-slate-600">Attn: {vendor.contactPerson}</div>}
            {vendor.address && <div className="text-slate-600 mt-1">{vendor.address}</div>}
            <div className="text-slate-600">{vendor.city || 'Gujarat'} {vendor.pincode ? `- ${vendor.pincode}` : ''}</div>
            <div className="text-slate-700 font-mono mt-1">
              <strong>GSTIN:</strong> {vendor.gst || 'N/A'}
            </div>
            <div className="text-slate-600">
              Phone: {vendor.phone || 'N/A'} | Email: {vendor.email || 'N/A'}
            </div>
          </div>

          <div className="border-l border-slate-200 pl-6 space-y-1.5">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              PROJECT & DELIVERY DETAILS:
            </span>
            <div>
              <span className="text-slate-500">Private Client:</span>{' '}
              <strong className="text-slate-900">{purchase.privatePartyName}</strong>
            </div>
            {purchase.quotationNo && (
              <div>
                <span className="text-slate-500">Quotation Reference:</span>{' '}
                <strong className="text-[#0059bb] font-mono">{purchase.quotationNo}</strong>
              </div>
            )}
            <div>
              <span className="text-slate-500">Delivery Address:</span>{' '}
              <span className="text-slate-700">{purchase.purchaseOrderDetails?.deliveryAddress || 'Neeta Works, Mehsana GIDC'}</span>
            </div>
            <div>
              <span className="text-slate-500">Expected Delivery:</span>{' '}
              <strong className="text-rose-700">
                {purchase.purchaseOrderDetails?.expectedDeliveryDate ? new Date(purchase.purchaseOrderDetails.expectedDeliveryDate).toLocaleDateString('en-IN') : 'Earliest'}
              </strong>
            </div>
            <div>
              <span className="text-slate-500">Payment Terms:</span>{' '}
              <span className="font-semibold text-emerald-700">{purchase.purchaseOrderDetails?.paymentTerms || approvedEstimate?.paymentTerms || '30 Days Net'}</span>
            </div>
          </div>
        </div>

        {/* Materials Line Items Table */}
        <div className="mb-6 overflow-hidden rounded-xl border border-slate-200">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-900 text-white font-bold uppercase text-[11px]">
                <th className="py-2.5 px-3 text-center w-12">Sr.</th>
                <th className="py-2.5 px-3">Raw Material Description & Specification</th>
                <th className="py-2.5 px-3 text-center w-24">HSN/SAC</th>
                <th className="py-2.5 px-3 text-right w-24">Quantity</th>
                <th className="py-2.5 px-3 text-right w-28">Rate (₹)</th>
                <th className="py-2.5 px-3 text-right w-32">Total (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {purchase.materials?.map((mat, idx) => {
                const priceItem = approvedEstimate?.materialPrices?.find(
                  p => p.materialId?.toString() === mat.materialId?.toString() || p.name.toLowerCase() === mat.name.toLowerCase()
                );
                const unitRate = priceItem?.rate || 0;
                const lineTotal = priceItem?.subtotal || (mat.quantity * unitRate);

                return (
                  <tr key={idx} className={idx % 2 === 1 ? 'bg-slate-50/60' : ''}>
                    <td className="py-2.5 px-3 text-center font-medium text-slate-500">{idx + 1}</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-900">
                      <div>{mat.name}</div>
                      {mat.code && <div className="text-[10px] text-slate-400 font-normal">Code: {mat.code}</div>}
                      {mat.specifications && <div className="text-[11px] text-[#0059bb] font-normal italic">Spec: {mat.specifications}</div>}
                    </td>
                    <td className="py-2.5 px-3 text-center text-slate-600 font-mono">{mat.hsn || '-'}</td>
                    <td className="py-2.5 px-3 text-right font-bold text-slate-800">
                      {mat.quantity} {mat.unit || 'Nos'}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-700">
                      ₹{unitRate.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold font-mono text-slate-900">
                      ₹{lineTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Totals & Tax Calculation Breakdown */}
        <div className="flex justify-end mb-8">
          <div className="w-72 space-y-2 text-xs border border-slate-200 p-4 rounded-xl bg-slate-50/50">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal (Taxable):</span>
              <span className="font-mono font-bold">
                ₹{(approvedEstimate?.subtotal || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>

            <div className="flex justify-between text-slate-600">
              <span>GST ({approvedEstimate?.gstPercentage || 18}%):</span>
              <span className="font-mono font-bold">
                ₹{(approvedEstimate?.gstAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>

            {(approvedEstimate?.shippingCharges > 0) && (
              <div className="flex justify-between text-slate-600">
                <span>Shipping / Freight:</span>
                <span className="font-mono font-bold">
                  ₹{approvedEstimate.shippingCharges.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
            )}

            {(approvedEstimate?.otherCharges > 0) && (
              <div className="flex justify-between text-slate-600">
                <span>Other Charges:</span>
                <span className="font-mono font-bold">
                  ₹{approvedEstimate.otherCharges.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
            )}

            <div className="pt-2 border-t border-slate-300 flex justify-between font-black text-sm text-slate-900">
              <span>TOTAL ORDER VALUE:</span>
              <span className="font-mono text-[#0059bb]">
                ₹{(approvedEstimate?.totalAmount || purchase.ownerApproval?.approvedAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>

        {/* Vendor Bank Details (for payment) */}
        {vendor.bankDetails?.accountNo && (
          <div className="mb-6 p-3 rounded-xl border border-slate-200 bg-blue-50/30 text-xs">
            <span className="font-bold text-[#0059bb] block mb-1">Payment Beneficiary Bank Account:</span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-slate-700">
              <div>Bank: <strong>{vendor.bankDetails.bankName}</strong></div>
              <div>A/C No: <strong className="font-mono">{vendor.bankDetails.accountNo}</strong></div>
              <div>IFSC: <strong className="font-mono">{vendor.bankDetails.ifscCode}</strong></div>
              <div>Branch: <strong>{vendor.bankDetails.branch}</strong></div>
            </div>
          </div>
        )}

        {/* Terms & Signatures */}
        <div className="pt-6 border-t-2 border-slate-900 grid grid-cols-2 gap-8 text-xs">
          <div className="space-y-1 text-slate-500">
            <h5 className="font-bold text-slate-800 uppercase text-[11px]">Terms & Conditions:</h5>
            <ol className="list-decimal list-inside space-y-0.5 text-[11px] leading-relaxed">
              <li>Materials must conform strictly to specifications mentioned above.</li>
              <li>Delivery challan & tax invoice must accompany the shipment.</li>
              <li>Defective / non-conforming goods are subject to immediate return.</li>
              <li>Please mention this Purchase Order number on your tax invoice.</li>
            </ol>
          </div>

          <div className="flex flex-col justify-between items-end text-right">
            <div>
              <div className="text-[11px] text-slate-500">For NEETA ENGINEERING WORKS</div>
              <div className="h-14 flex items-center justify-end">
                <span className="font-serif italic text-slate-400 text-sm">Authorized Signature</span>
              </div>
              <div className="font-bold text-slate-900 text-xs">
                {purchase.ownerApproval?.approvedByName || 'Authorized Signatory (Owner)'}
              </div>
              <div className="text-[10px] text-slate-400">Approved via Owner Command Portal</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
