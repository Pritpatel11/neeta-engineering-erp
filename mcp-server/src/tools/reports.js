import { z } from 'zod';
import { erpGet } from '../erpClient.js';

/**
 * Tool: get_sales_report
 */
export const getSalesReportTool = {
  name: 'get_sales_report',
  description: 'Retrieve a high-level sales and revenue summary including total billed amount, total payments collected, and outstanding receivables.',
  parameters: z.object({
    period: z.enum(['all', 'this_month', 'this_year']).optional().default('all').describe('Time period for the sales report'),
  }),
  handler: async ({ period = 'all' }) => {
    const [invoices, paymentsSummary] = await Promise.all([
      erpGet('/private-invoices', {}, 'get_sales_report').catch(() => []),
      erpGet('/private-payments/summary', {}, 'get_sales_report').catch(() => []),
    ]);

    const totalInvoices = Array.isArray(invoices) ? invoices.length : 0;
    const totalBilled = Array.isArray(invoices)
      ? invoices.reduce((acc, inv) => acc + (Number(inv.totalAmount) || 0), 0)
      : 0;
    const totalOutstanding = Array.isArray(invoices)
      ? invoices.reduce((acc, inv) => acc + (Number(inv.balanceAmount !== undefined ? inv.balanceAmount : inv.totalAmount) || 0), 0)
      : 0;
    const totalCollected = totalBilled - totalOutstanding;

    // Party-wise outstanding balances
    const topDebtors = Array.isArray(paymentsSummary)
      ? paymentsSummary
          .filter(p => Number(p.balance) > 0)
          .sort((a, b) => Number(b.balance) - Number(a.balance))
          .slice(0, 5)
          .map(p => ({
            party: p.partyName,
            billed: `INR ${Number(p.totalInvoiced || 0).toLocaleString('en-IN')}`,
            paid: `INR ${Number(p.totalPaid || 0).toLocaleString('en-IN')}`,
            balanceDue: `INR ${Number(p.balance || 0).toLocaleString('en-IN')}`,
          }))
      : [];

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          report: 'Executive Sales & Revenue Report',
          period,
          metrics: {
            totalInvoicesCount: totalInvoices,
            totalGrossBilled: `INR ${totalBilled.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
            totalCollected: `INR ${totalCollected.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
            totalReceivablesPending: `INR ${totalOutstanding.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
            collectionRate: totalBilled > 0 ? `${((totalCollected / totalBilled) * 100).toFixed(1)}%` : '0%',
          },
          topOutstandingParties: topDebtors,
        }, null, 2),
      }],
    };
  },
};

/**
 * Tool: get_purchase_report
 */
export const getPurchaseReportTool = {
  name: 'get_purchase_report',
  description: 'Retrieve procurement summary including active purchase orders, approved PO spend, and pending material receipts.',
  parameters: z.object({}),
  handler: async () => {
    const pos = await erpGet('/purchases', {}, 'get_purchase_report').catch(() => []);

    if (!Array.isArray(pos)) {
      return {
        content: [{
          type: 'text',
          text: 'No purchase order data available.',
        }],
      };
    }

    const totalOrders = pos.length;
    const completedOrders = pos.filter(p => p.status === 'completed').length;
    const approvedOrders = pos.filter(p => p.status === 'approved').length;
    const pendingOrders = pos.filter(p => ['draft', 'rfq_sent', 'estimates_received', 'pending_approval'].includes(p.status)).length;

    const totalApprovedSpend = pos
      .filter(p => p.approvedEstimate?.totalAmount)
      .reduce((acc, p) => acc + Number(p.approvedEstimate.totalAmount), 0);

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          report: 'Procurement & Purchase Orders Summary',
          totalPurchaseOrders: totalOrders,
          approvedSpendTotal: `INR ${totalApprovedSpend.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
          statusBreakdown: {
            completed: completedOrders,
            approvedInProgress: approvedOrders,
            pendingApprovalOrRfq: pendingOrders,
          },
          recentOrders: pos.slice(0, 5).map(p => ({
            poNumber: p.poNumber,
            title: p.title,
            vendor: p.approvedEstimate?.vendorName || p.vendorName || 'RFQ Stage',
            status: p.status,
            total: p.approvedEstimate?.totalAmount ? `INR ${Number(p.approvedEstimate.totalAmount).toLocaleString('en-IN')}` : 'TBD',
          })),
        }, null, 2),
      }],
    };
  },
};

/**
 * Tool: get_inventory_report
 */
export const getInventoryReportTool = {
  name: 'get_inventory_report',
  description: 'Retrieve organizational stock report summarizing inventory across all divisions and material balances.',
  parameters: z.object({}),
  handler: async () => {
    const [balances, divisions] = await Promise.all([
      erpGet('/inventory/balances', {}, 'get_inventory_report').catch(() => []),
      erpGet('/master-data/divisions', {}, 'get_inventory_report').catch(() => []),
    ]);

    let totalUniqueMaterials = new Set();
    let totalStockVolume = 0;
    const divisionSummaries = [];

    for (const b of balances || []) {
      let divVolume = 0;
      let divItems = 0;
      for (const m of b.materials || []) {
        totalUniqueMaterials.add(m.name);
        divVolume += (Number(m.qty) || 0);
        divItems++;
      }
      totalStockVolume += divVolume;
      divisionSummaries.push({
        divisionName: b.divisionName,
        totalItemsCount: divItems,
        totalQuantityOnHand: `${divVolume.toLocaleString('en-IN')} units/KG`,
      });
    }

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          report: 'Organizational Inventory Balance Report',
          registeredDivisions: Array.isArray(divisions) ? divisions.length : divisionSummaries.length,
          totalUniqueMaterialTypes: totalUniqueMaterials.size,
          aggregateStockVolume: `${totalStockVolume.toLocaleString('en-IN')} total units/KG`,
          divisionBreakdown: divisionSummaries,
        }, null, 2),
      }],
    };
  },
};
