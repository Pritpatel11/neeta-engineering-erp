import { z } from 'zod';
import { erpGet } from '../erpClient.js';

/**
 * Tool: get_inventory
 */
export const getInventoryTool = {
  name: 'get_inventory',
  description: 'Retrieve live inventory and stock quantity for a material or for a specific plant/division.',
  parameters: z.object({
    material: z.string().optional().describe('Material name or size (e.g. "Angle 65x65x6", "Channel 100", "Steel Plate")'),
    division: z.string().optional().describe('Division / Plant name (e.g. "Deesa", "Palanpur", "Main Works")'),
  }),
  handler: async ({ material = '', division = '' }) => {
    const balances = await erpGet('/inventory/balances', {}, 'get_inventory');

    if (!Array.isArray(balances) || balances.length === 0) {
      return {
        content: [{
          type: 'text',
          text: 'No inventory balance records found in the ERP system for the active financial year.',
        }],
      };
    }

    const matQuery = material.trim().toLowerCase();
    const divQuery = division.trim().toLowerCase();

    const results = [];

    for (const record of balances) {
      const matchDiv = !divQuery || record.divisionName?.toLowerCase().includes(divQuery);
      if (!matchDiv) continue;

      const matchingMaterials = (record.materials || []).filter(m => {
        return !matQuery || m.name?.toLowerCase().includes(matQuery);
      });

      if (matchingMaterials.length > 0) {
        results.push({
          division: record.divisionName,
          financialYear: record.financialYear,
          lastUpdated: record.updatedAt ? new Date(record.updatedAt).toISOString().slice(0, 10) : 'N/A',
          materials: matchingMaterials.map(m => ({
            materialName: m.name,
            availableQuantity: m.qty,
            unit: 'KG / Nos',
            manualAdjustment: m.manualAdjustment || 0,
            status: m.qty <= 0 ? 'Out of Stock' : (m.qty < 500 ? 'Low Stock' : 'In Stock'),
          })),
        });
      }
    }

    if (results.length === 0) {
      return {
        content: [{
          type: 'text',
          text: `No stock found matching material "${material}" ${division ? `in division "${division}"` : ''}.`,
        }],
      };
    }

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          query: { material: material || 'All', division: division || 'All' },
          divisionsFound: results.length,
          stockData: results,
        }, null, 2),
      }],
    };
  },
};

/**
 * Tool: search_inventory
 */
export const searchInventoryTool = {
  name: 'search_inventory',
  description: 'Search across all plant inventories, filter by low stock, or view complete stock summaries.',
  parameters: z.object({
    keyword: z.string().optional().describe('Material keyword or code to filter'),
    minQuantity: z.number().optional().describe('Filter materials having quantity greater than or equal to this value'),
    maxQuantity: z.number().optional().describe('Filter materials having quantity less than or equal to this value (useful for finding low stock)'),
  }),
  handler: async ({ keyword = '', minQuantity, maxQuantity }) => {
    const balances = await erpGet('/inventory/balances', {}, 'search_inventory');
    const kw = keyword.toLowerCase().trim();

    const aggregated = [];

    for (const record of balances || []) {
      for (const mat of record.materials || []) {
        if (kw && !mat.name?.toLowerCase().includes(kw)) continue;
        if (minQuantity !== undefined && mat.qty < minQuantity) continue;
        if (maxQuantity !== undefined && mat.qty > maxQuantity) continue;

        aggregated.push({
          division: record.divisionName,
          material: mat.name,
          quantity: mat.qty,
          status: mat.qty <= 0 ? 'CRITICAL (Out of Stock)' : (mat.qty < 500 ? 'WARNING (Low Stock)' : 'OK'),
        });
      }
    }

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          totalRecords: aggregated.length,
          items: aggregated,
        }, null, 2),
      }],
    };
  },
};

/**
 * Tool: get_stock_transactions
 */
export const getStockTransactionsTool = {
  name: 'get_stock_transactions',
  description: 'Retrieve material movement logs including delivery challans (outward dispatch) and store receipts (inward material).',
  parameters: z.object({
    type: z.enum(['all', 'inward', 'outward']).optional().default('all').describe('Transaction type ("inward" for receipts, "outward" for delivery challans, "all" for both)'),
    contractorOrParty: z.string().optional().describe('Filter by contractor, client, or site name'),
    limit: z.number().optional().default(15).describe('Maximum records to retrieve (default: 15)'),
  }),
  handler: async ({ type = 'all', contractorOrParty = '', limit = 15 }) => {
    const results = {};
    const partyFilter = contractorOrParty.toLowerCase().trim();

    if (type === 'all' || type === 'outward') {
      try {
        const challans = await erpGet('/challans', {}, 'get_stock_transactions');
        const filtered = (challans || []).filter(c => 
          !partyFilter || (c.contractorName && c.contractorName.toLowerCase().includes(partyFilter))
        ).slice(0, limit);

        results.deliveryChallans = filtered.map(c => ({
          challanNo: c.challanNo,
          date: c.date,
          contractor: c.contractorName,
          division: c.divisionName,
          vehicleNo: c.vehicleNumber,
          driver: c.driverName,
          status: c.status,
          itemCount: c.materials?.length || 0,
          materials: c.materials || [],
        }));
      } catch (_) {}
    }

    if (type === 'all' || type === 'inward') {
      try {
        const storeReceipts = await erpGet('/store-receipts', {}, 'get_stock_transactions');
        const filtered = (storeReceipts || []).filter(r => 
          !partyFilter || (r.contractorName && r.contractorName.toLowerCase().includes(partyFilter))
        ).slice(0, limit);

        results.storeReceipts = filtered.map(r => ({
          crNo: r.crNo,
          date: r.date,
          contractor: r.contractorName,
          division: r.divisionName,
          itemCount: r.materials?.length || 0,
          materials: r.materials || [],
        }));
      } catch (_) {}
    }

    return {
      content: [{
        type: 'text',
        text: JSON.stringify(results, null, 2),
      }],
    };
  },
};
