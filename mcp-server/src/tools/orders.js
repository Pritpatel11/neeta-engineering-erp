import { z } from 'zod';
import { erpGet } from '../erpClient.js';

/**
 * Tool: get_purchase_order
 */
export const getPurchaseOrderTool = {
  name: 'get_purchase_order',
  description: 'Retrieve detailed information for a purchase order (PO) by PO number (e.g. "PO-2026-001") or ID.',
  parameters: z.object({
    poNumber: z.string().optional().describe('Purchase Order Number (e.g. "PO-2026-001")'),
    id: z.string().optional().describe('Purchase Order MongoDB ID'),
  }),
  handler: async ({ poNumber, id }) => {
    if (!poNumber && !id) {
      throw new Error('Please provide either poNumber or id.');
    }

    const pos = await erpGet('/purchases', {}, 'get_purchase_order');

    if (!Array.isArray(pos)) {
      return {
        content: [{
          type: 'text',
          text: 'No purchase orders found in ERP.',
        }],
      };
    }

    const cleanNo = poNumber?.trim().toLowerCase();
    const po = pos.find(p => 
      (id && p._id === id) || 
      (cleanNo && p.poNumber?.toLowerCase() === cleanNo)
    );

    if (!po) {
      return {
        content: [{
          type: 'text',
          text: `Purchase Order "${poNumber || id}" was not found.`,
        }],
      };
    }

    const formatted = {
      poNumber: po.poNumber,
      title: po.title,
      status: po.status,
      financialYear: po.financialYear,
      dateCreated: po.createdAt ? new Date(po.createdAt).toISOString().slice(0, 10) : 'N/A',
      items: (po.items || []).map(item => ({
        material: item.name,
        quantity: item.quantity,
        unit: item.unit || 'KG',
        receivedQty: item.receivedQuantity || 0,
        pendingQty: item.pendingQuantity || item.quantity,
      })),
      selectedVendor: po.approvedEstimate?.vendorName || po.vendorName || 'Pending Selection / RFQ Stage',
      approvedTotal: po.approvedEstimate?.totalAmount ? `INR ${po.approvedEstimate.totalAmount.toLocaleString('en-IN')}` : 'Not Approved Yet',
      estimatesCount: po.estimates?.length || 0,
      estimates: (po.estimates || []).map(est => ({
        vendor: est.vendorName,
        totalQuoted: `INR ${Number(est.totalAmount || 0).toLocaleString('en-IN')}`,
        status: est.isApproved ? 'APPROVED' : (est.isRejected ? 'REJECTED' : 'PENDING'),
      })),
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
 * Tool: search_purchase_orders
 */
export const searchPurchaseOrdersTool = {
  name: 'search_purchase_orders',
  description: 'Search purchase orders by status (draft, rfq_sent, pending_approval, approved, completed) or vendor name.',
  parameters: z.object({
    status: z.enum(['all', 'draft', 'rfq_sent', 'estimates_received', 'pending_approval', 'approved', 'completed', 'cancelled']).optional().default('all').describe('Status filter'),
    vendorName: z.string().optional().describe('Vendor name filter'),
    limit: z.number().optional().default(20).describe('Maximum records to return (default: 20)'),
  }),
  handler: async ({ status = 'all', vendorName = '', limit = 20 }) => {
    const pos = await erpGet('/purchases', {}, 'search_purchase_orders');

    if (!Array.isArray(pos)) {
      return {
        content: [{
          type: 'text',
          text: 'No purchase orders found in ERP.',
        }],
      };
    }

    const vFilter = vendorName.toLowerCase().trim();

    const filtered = pos.filter(po => {
      const matchStatus = status === 'all' || po.status === status;
      const matchVendor = !vFilter || 
        (po.vendorName && po.vendorName.toLowerCase().includes(vFilter)) ||
        (po.approvedEstimate?.vendorName && po.approvedEstimate.vendorName.toLowerCase().includes(vFilter));
      return matchStatus && matchVendor;
    }).slice(0, limit);

    const summary = filtered.map(p => ({
      poNumber: p.poNumber,
      title: p.title,
      status: p.status,
      vendor: p.approvedEstimate?.vendorName || p.vendorName || 'Multi-Vendor RFQ',
      totalAmount: p.approvedEstimate?.totalAmount ? `INR ${Number(p.approvedEstimate.totalAmount).toLocaleString('en-IN')}` : 'TBD',
      createdDate: p.createdAt ? new Date(p.createdAt).toISOString().slice(0, 10) : 'N/A',
      itemCount: p.items?.length || 0,
    }));

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          count: summary.length,
          purchaseOrders: summary,
        }, null, 2),
      }],
    };
  },
};

/**
 * Tool: get_sales_order
 */
export const getSalesOrderTool = {
  name: 'get_sales_order',
  description: 'Retrieve a sales delivery order / challan or customer quotation / proforma invoice by document number.',
  parameters: z.object({
    documentNumber: z.string().describe('Challan number (e.g. "CH-001") or Quotation number (e.g. "QT-001")'),
  }),
  handler: async ({ documentNumber }) => {
    const cleanNo = documentNumber.trim().toLowerCase();

    // 1. Try Delivery Challans
    try {
      const challans = await erpGet('/challans', {}, 'get_sales_order');
      if (Array.isArray(challans)) {
        const found = challans.find(c => c.challanNo?.toLowerCase() === cleanNo);
        if (found) {
          return {
            content: [{
              type: 'text',
              text: JSON.stringify({
                documentType: 'Delivery Challan / Dispatch Order',
                challanNo: found.challanNo,
                date: found.date,
                contractor: found.contractorName,
                division: found.divisionName,
                vehicleNumber: found.vehicleNumber,
                driverName: found.driverName,
                status: found.status,
                items: found.materials || [],
              }, null, 2),
            }],
          };
        }
      }
    } catch (_) {}

    // 2. Try Quotations / Proforma Invoices
    try {
      const quotations = await erpGet('/quotations', {}, 'get_sales_order');
      if (Array.isArray(quotations)) {
        const found = quotations.find(q => q.quotationNo?.toLowerCase() === cleanNo);
        if (found) {
          return {
            content: [{
              type: 'text',
              text: JSON.stringify({
                documentType: found.documentType || 'Quotation / Proforma',
                quotationNo: found.quotationNo,
                date: found.date,
                customer: found.clientName,
                subTotal: `INR ${found.subTotal}`,
                taxAmount: `INR ${found.taxAmount || 0}`,
                totalAmount: `INR ${found.totalAmount}`,
                status: found.status,
                items: found.items || [],
              }, null, 2),
            }],
          };
        }
      }
    } catch (_) {}

    return {
      content: [{
        type: 'text',
        text: `Sales document "${documentNumber}" was not found.`,
      }],
    };
  },
};

/**
 * Tool: search_sales_orders
 */
export const searchSalesOrdersTool = {
  name: 'search_sales_orders',
  description: 'Search sales delivery orders (Challans) and Quotations/Proformas by contractor or date.',
  parameters: z.object({
    keyword: z.string().optional().describe('Contractor, client, or division keyword'),
    limit: z.number().optional().default(15).describe('Maximum records to return (default: 15)'),
  }),
  handler: async ({ keyword = '', limit = 15 }) => {
    const kw = keyword.toLowerCase().trim();

    const [challans, quotations] = await Promise.all([
      erpGet('/challans', {}, 'search_sales_orders').catch(() => []),
      erpGet('/quotations', {}, 'search_sales_orders').catch(() => []),
    ]);

    const filteredChallans = (challans || []).filter(c => 
      !kw || (c.contractorName && c.contractorName.toLowerCase().includes(kw)) ||
      (c.divisionName && c.divisionName.toLowerCase().includes(kw)) ||
      (c.challanNo && c.challanNo.toLowerCase().includes(kw))
    ).slice(0, limit);

    const filteredQuotations = (quotations || []).filter(q =>
      !kw || (q.clientName && q.clientName.toLowerCase().includes(kw)) ||
      (q.quotationNo && q.quotationNo.toLowerCase().includes(kw))
    ).slice(0, limit);

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          deliveryChallans: filteredChallans.map(c => ({
            number: c.challanNo,
            contractor: c.contractorName,
            division: c.divisionName,
            date: c.date,
            status: c.status,
          })),
          quotations: filteredQuotations.map(q => ({
            number: q.quotationNo,
            type: q.documentType || 'Quotation',
            customer: q.clientName,
            totalAmount: `INR ${q.totalAmount}`,
            status: q.status,
          })),
        }, null, 2),
      }],
    };
  },
};
