import { z } from 'zod';
import { erpGet } from '../erpClient.js';

/**
 * Tool: get_customer
 */
export const getCustomerTool = {
  name: 'get_customer',
  description: 'Retrieve detailed profile for a customer or commercial party by name or ID.',
  parameters: z.object({
    name: z.string().describe('Customer or Company Name (e.g. "ABC Steel", "Banaskantha Dairy")'),
  }),
  handler: async ({ name }) => {
    const clean = name.trim().toLowerCase();

    // Query Private Parties
    const parties = await erpGet('/master-data/private-parties', {}, 'get_customer');
    const contractors = await erpGet('/master-data/contractors', {}, 'get_customer');

    const matchedParty = (parties || []).find(p => p.name?.toLowerCase().includes(clean));
    const matchedContractor = (contractors || []).find(c => c.name?.toLowerCase().includes(clean));

    if (!matchedParty && !matchedContractor) {
      return {
        content: [{
          type: 'text',
          text: `Customer / Party "${name}" was not found. Use search_customers to see all available parties.`,
        }],
      };
    }

    const customer = matchedParty || { name: matchedContractor.name, type: 'Contractor / Agency' };

    // Get invoice transaction count & outstanding balance for this customer
    let outstanding = null;
    try {
      const summary = await erpGet('/private-payments/summary', {}, 'get_customer');
      if (Array.isArray(summary)) {
        const foundSummary = summary.find(s => s.partyName?.toLowerCase() === customer.name?.toLowerCase());
        if (foundSummary) {
          outstanding = {
            totalBilled: `INR ${Number(foundSummary.totalInvoiced || 0).toLocaleString('en-IN')}`,
            totalPaid: `INR ${Number(foundSummary.totalPaid || 0).toLocaleString('en-IN')}`,
            pendingBalance: `INR ${Number(foundSummary.balance || 0).toLocaleString('en-IN')}`,
            invoiceCount: foundSummary.invoiceCount || 0,
          };
        }
      }
    } catch (_) {}

    const profile = {
      name: customer.name,
      contactPerson: customer.contactPerson || 'N/A',
      phone: customer.phone || 'N/A',
      email: customer.email || 'N/A',
      gstin: customer.gst || 'N/A',
      pan: customer.pan || 'N/A',
      billingAddress: customer.address || 'N/A',
      city: customer.city || 'N/A',
      state: `${customer.state || 'Gujarat'} (Code: ${customer.stateCode || '24'})`,
      pincode: customer.pincode || 'N/A',
      financialSummary: outstanding || 'No transaction ledger found for this party.',
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
 * Tool: search_customers
 */
export const searchCustomersTool = {
  name: 'search_customers',
  description: 'Search for customers, clients, or contractors by keyword, GSTIN, city, or phone number.',
  parameters: z.object({
    keyword: z.string().optional().describe('Search keyword (name, phone, GSTIN, city)'),
    city: z.string().optional().describe('City filter (e.g. "Deesa", "Ahmedabad", "Palanpur")'),
    limit: z.number().optional().default(20).describe('Maximum records to return (default: 20)'),
  }),
  handler: async ({ keyword = '', city = '', limit = 20 }) => {
    const parties = await erpGet('/master-data/private-parties', {}, 'search_customers');
    const contractors = await erpGet('/master-data/contractors', {}, 'search_customers');

    const kw = keyword.toLowerCase().trim();
    const cityFilter = city.toLowerCase().trim();

    const filteredParties = (parties || []).filter(p => {
      const matchKw = !kw ||
        (p.name && p.name.toLowerCase().includes(kw)) ||
        (p.gst && p.gst.toLowerCase().includes(kw)) ||
        (p.phone && p.phone.includes(kw)) ||
        (p.city && p.city.toLowerCase().includes(kw));
      const matchCity = !cityFilter || (p.city && p.city.toLowerCase().includes(cityFilter));
      return matchKw && matchCity;
    });

    const filteredContractors = (contractors || []).filter(c => {
      if (cityFilter) return false;
      return !kw || (c.name && c.name.toLowerCase().includes(kw));
    });

    const combined = [
      ...filteredParties.map(p => ({
        name: p.name,
        contactPerson: p.contactPerson || 'N/A',
        phone: p.phone || 'N/A',
        gstin: p.gst || 'N/A',
        city: p.city || 'N/A',
        state: p.state || 'Gujarat',
      })),
      ...filteredContractors.map(c => ({
        name: c.name,
        contactPerson: 'Site Contractor',
        phone: 'N/A',
        gstin: 'N/A',
        city: 'N/A',
        state: 'Gujarat',
      })),
    ].slice(0, limit);

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          totalMatches: combined.length,
          customers: combined,
        }, null, 2),
      }],
    };
  },
};
