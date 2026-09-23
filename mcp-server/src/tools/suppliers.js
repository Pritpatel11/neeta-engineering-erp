import { z } from 'zod';
import { erpGet } from '../erpClient.js';

/**
 * Tool: get_supplier
 */
export const getSupplierTool = {
  name: 'get_supplier',
  description: 'Retrieve detailed supplier or vendor profile including contact person, payment terms, GSTIN, and bank details.',
  parameters: z.object({
    name: z.string().describe('Supplier or Vendor Name (e.g. "Jindal Steel", "Tata Steel", "Apex Fasteners")'),
  }),
  handler: async ({ name }) => {
    const clean = name.trim().toLowerCase();
    const vendors = await erpGet('/vendors', {}, 'get_supplier');

    if (!Array.isArray(vendors) || vendors.length === 0) {
      return {
        content: [{
          type: 'text',
          text: 'No vendors found in the ERP database.',
        }],
      };
    }

    const vendor = vendors.find(v => v.name?.toLowerCase().includes(clean));

    if (!vendor) {
      return {
        content: [{
          type: 'text',
          text: `Supplier / Vendor "${name}" was not found. Use search_suppliers to see active suppliers.`,
        }],
      };
    }

    const profile = {
      name: vendor.name,
      status: vendor.status || 'active',
      contactPerson: vendor.contactPerson || 'N/A',
      phone: vendor.phone || 'N/A',
      email: vendor.email || 'N/A',
      gstin: vendor.gst || 'N/A',
      pan: vendor.pan || 'N/A',
      paymentTerms: vendor.paymentTerms || '30 Days Net',
      address: vendor.address || 'N/A',
      city: vendor.city || 'N/A',
      state: `${vendor.state || 'Gujarat'} (Code: ${vendor.stateCode || '24'})`,
      bankDetails: vendor.bankDetails ? {
        bankName: vendor.bankDetails.bankName || 'N/A',
        accountNo: vendor.bankDetails.accountNo ? `****${vendor.bankDetails.accountNo.slice(-4)}` : 'N/A',
        ifscCode: vendor.bankDetails.ifscCode || 'N/A',
        branch: vendor.bankDetails.branch || 'N/A',
      } : 'Not Provided',
      notes: vendor.notes || '',
    };

    return {
      content: [{
        type: 'text',
        text: JSON.stringify(profile, null, 2),
      }],
    };
  },
};

/**
 * Tool: search_suppliers
 */
export const searchSuppliersTool = {
  name: 'search_suppliers',
  description: 'Search for registered vendors and suppliers by name, city, or status.',
  parameters: z.object({
    keyword: z.string().optional().describe('Keyword or search string'),
    status: z.enum(['all', 'active', 'inactive']).optional().default('all').describe('Vendor status filter'),
    limit: z.number().optional().default(20).describe('Maximum results to return (default: 20)'),
  }),
  handler: async ({ keyword = '', status = 'all', limit = 20 }) => {
    const vendors = await erpGet('/vendors', {}, 'search_suppliers');

    if (!Array.isArray(vendors) || vendors.length === 0) {
      return {
        content: [{
          type: 'text',
          text: 'No vendors found in the ERP database.',
        }],
      };
    }

    const kw = keyword.toLowerCase().trim();

    const filtered = vendors.filter(v => {
      const matchKw = !kw ||
        (v.name && v.name.toLowerCase().includes(kw)) ||
        (v.city && v.city.toLowerCase().includes(kw)) ||
        (v.gst && v.gst.toLowerCase().includes(kw)) ||
        (v.contactPerson && v.contactPerson.toLowerCase().includes(kw));
      const matchStatus = status === 'all' || v.status === status;
      return matchKw && matchStatus;
    }).slice(0, limit);

    const summary = filtered.map(v => ({
      name: v.name,
      contactPerson: v.contactPerson || 'N/A',
      phone: v.phone,
      email: v.email,
      gstin: v.gst || 'N/A',
      city: v.city || 'N/A',
      paymentTerms: v.paymentTerms || '30 Days Net',
      status: v.status || 'active',
    }));

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          totalMatches: summary.length,
          suppliers: summary,
        }, null, 2),
      }],
    };
  },
};
