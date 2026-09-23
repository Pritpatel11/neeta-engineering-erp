import { z } from 'zod';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { erpGet, erpGetBinary } from '../erpClient.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const downloadDir = process.env.PDF_DOWNLOAD_DIR
  ? path.resolve(process.env.PDF_DOWNLOAD_DIR)
  : path.join(__dirname, '../../downloads');

if (!fs.existsSync(downloadDir)) {
  fs.mkdirSync(downloadDir, { recursive: true });
}

/**
 * Tool: get_invoice
 */
export const getInvoiceTool = {
  name: 'get_invoice',
  description: 'Retrieve full details of an invoice by invoice number (e.g., "PI-001", "INV-1025") or ERP ID.',
  parameters: z.object({
    invoiceNumber: z.string().optional().describe('Invoice Number (e.g. "PI-001", "PI-002", "INV-1025")'),
    id: z.string().optional().describe('MongoDB Object ID of the invoice'),
  }),
  handler: async ({ invoiceNumber, id }) => {
    if (!invoiceNumber && !id) {
      throw new Error('Please provide either invoiceNumber or id to look up the invoice.');
    }

    let invoice = null;

    if (id) {
      try {
        invoice = await erpGet(`/private-invoices/${id}`, {}, 'get_invoice');
      } catch (_) {}
    }

    if (!invoice && invoiceNumber) {
      try {
        invoice = await erpGet(`/private-invoices/by-number/${encodeURIComponent(invoiceNumber)}`, {}, 'get_invoice');
      } catch (_) {
        // Fallback search in all invoices if direct lookup fails
        const all = await erpGet('/private-invoices', { search: invoiceNumber }, 'get_invoice');
        if (Array.isArray(all) && all.length > 0) {
          invoice = all.find(inv => inv.invoiceNo?.toLowerCase() === invoiceNumber.toLowerCase()) || all[0];
        }
      }
    }

    if (!invoice) {
      return {
        content: [{
          type: 'text',
          text: `Invoice "${invoiceNumber || id}" was not found in the ERP system.`,
        }],
      };
    }

    // Format clean invoice response
    const formatted = {
      invoiceNo: invoice.invoiceNo,
      documentType: invoice.documentType || 'TAX INVOICE',
      date: invoice.date,
      dueDate: invoice.dueDate || 'Upon Receipt',
      poNumber: invoice.poNumber || 'N/A',
      financialYear: invoice.financialYear,
      customer: {
        name: invoice.clientName,
        companyName: invoice.companyName || invoice.clientName,
        gstin: invoice.clientGST || 'N/A',
        phone: invoice.clientPhone || 'N/A',
        email: invoice.clientEmail || 'N/A',
        address: invoice.clientAddress || 'N/A',
        city: invoice.clientCity || 'N/A',
        state: `${invoice.buyerState || 'Gujarat'} (Code: ${invoice.buyerStateCode || '24'})`,
      },
      items: (invoice.items || []).map((item, idx) => ({
        srNo: idx + 1,
        description: item.description,
        hsn: item.hsn || '',
        quantity: item.quantity,
        unit: item.unit,
        rate: `INR ${item.rate}`,
        amount: `INR ${item.amount}`,
      })),
      financialSummary: {
        subTotal: `INR ${Number(invoice.subTotal || 0).toFixed(2)}`,
        taxRate: `${invoice.taxPercentage || 18}%`,
        taxAmount: `INR ${Number(invoice.taxAmount || 0).toFixed(2)}`,
        cgst: invoice.cgstAmount ? `INR ${Number(invoice.cgstAmount).toFixed(2)}` : 'N/A',
        sgst: invoice.sgstAmount ? `INR ${Number(invoice.sgstAmount).toFixed(2)}` : 'N/A',
        igst: invoice.igstAmount ? `INR ${Number(invoice.igstAmount).toFixed(2)}` : 'N/A',
        totalAmountPayable: `INR ${Number(invoice.totalAmount || 0).toFixed(2)}`,
        paymentStatus: invoice.paymentStatus || (invoice.balanceAmount === 0 ? 'paid' : 'pending'),
        paidAmount: `INR ${Number(invoice.paidAmount || 0).toFixed(2)}`,
        balanceOutstanding: `INR ${Number(invoice.balanceAmount !== undefined ? invoice.balanceAmount : invoice.totalAmount).toFixed(2)}`,
      },
    };

    return {
      content: [{
        type: 'text',
        text: JSON.stringify(formatted, null, 2),
      }],
    };
  },
};

/**
 * Tool: search_invoices
 */
export const searchInvoicesTool = {
  name: 'search_invoices',
  description: 'Search for invoices using customer name, customer GST number, date range, or payment status.',
  parameters: z.object({
    customerName: z.string().optional().describe('Customer or company name (partial match supported)'),
    gstNumber: z.string().optional().describe('Customer GSTIN number'),
    status: z.enum(['All', 'Draft', 'Sent', 'Overdue', 'Paid', 'Pending']).optional().default('All').describe('Invoice status'),
    startDate: z.string().optional().describe('Filter invoices on or after this date (YYYY-MM-DD)'),
    endDate: z.string().optional().describe('Filter invoices on or before this date (YYYY-MM-DD)'),
    limit: z.number().optional().default(20).describe('Maximum results to return (default: 20)'),
  }),
  handler: async ({ customerName, gstNumber, status = 'All', startDate, endDate, limit = 20 }) => {
    const params = {};
    if (status !== 'All') params.status = status;
    if (customerName) params.search = customerName;

    const invoices = await erpGet('/private-invoices', params, 'search_invoices');

    if (!Array.isArray(invoices) || invoices.length === 0) {
      return {
        content: [{
          type: 'text',
          text: 'No invoices found matching the specified search criteria.',
        }],
      };
    }

    let filtered = invoices;

    if (gstNumber) {
      const g = gstNumber.toUpperCase().trim();
      filtered = filtered.filter(inv => inv.clientGST?.toUpperCase().includes(g));
    }

    if (startDate) {
      filtered = filtered.filter(inv => inv.date && inv.date >= startDate);
    }
    if (endDate) {
      filtered = filtered.filter(inv => inv.date && inv.date <= endDate);
    }

    filtered = filtered.slice(0, limit);

    const summary = filtered.map(inv => ({
      invoiceNo: inv.invoiceNo,
      date: inv.date,
      customer: inv.clientName,
      gstin: inv.clientGST || 'N/A',
      totalAmount: `INR ${Number(inv.totalAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
      balanceDue: `INR ${Number(inv.balanceAmount !== undefined ? inv.balanceAmount : inv.totalAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
      status: inv.status || 'Active',
      paymentStatus: inv.paymentStatus || 'Pending',
    }));

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          count: summary.length,
          invoices: summary,
        }, null, 2),
      }],
    };
  },
};

/**
 * Tool: get_invoice_pdf
 */
export const getInvoicePdfTool = {
  name: 'get_invoice_pdf',
  description: 'Download the official ERP invoice PDF for an invoice number. Generates/retrieves the authentic PDF from the ERP backend and saves it locally.',
  parameters: z.object({
    invoiceNumber: z.string().describe('Invoice Number (e.g. "PI-001", "INV-1025")'),
  }),
  handler: async ({ invoiceNumber }) => {
    const cleanNo = invoiceNumber.trim();

    // 1. Fetch invoice data to confirm existence
    let invoice = null;
    try {
      invoice = await erpGet(`/private-invoices/by-number/${encodeURIComponent(cleanNo)}`, {}, 'get_invoice_pdf');
    } catch (_) {
      const all = await erpGet('/private-invoices', { search: cleanNo }, 'get_invoice_pdf');
      if (Array.isArray(all) && all.length > 0) {
        invoice = all.find(i => i.invoiceNo?.toLowerCase() === cleanNo.toLowerCase()) || all[0];
      }
    }

    if (!invoice) {
      throw new Error(`Invoice "${invoiceNumber}" was not found in the ERP system.`);
    }

    // 2. Fetch the official PDF buffer from the ERP backend API
    const pdfResponse = await erpGetBinary(
      `/private-invoices/by-number/${encodeURIComponent(invoice.invoiceNo)}/pdf`,
      {},
      'get_invoice_pdf'
    );

    // 3. Save PDF to local downloads folder
    const safeName = `Invoice_${(invoice.invoiceNo || 'INV').replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`;
    const destPath = path.join(downloadDir, safeName);
    fs.writeFileSync(destPath, pdfResponse.data);

    // 4. Return result with file path and base64 resource
    const base64Data = pdfResponse.data.toString('base64');

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            status: 'SUCCESS',
            message: `Official invoice PDF for ${invoice.invoiceNo} successfully generated and retrieved from Neeta Engineering ERP.`,
            invoiceNo: invoice.invoiceNo,
            customer: invoice.clientName,
            totalAmount: `INR ${Number(invoice.totalAmount || 0).toFixed(2)}`,
            fileSize: `${(pdfResponse.contentLength / 1024).toFixed(1)} KB`,
            savedToPath: destPath,
            base64DownloadReady: true,
          }, null, 2),
        },
      ],
    };
  },
};
