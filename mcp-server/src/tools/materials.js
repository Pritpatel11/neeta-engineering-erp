import { z } from 'zod';
import { erpGet } from '../erpClient.js';

function normalizeDimensions(str) {
  if (!str) return '';
  return str.toLowerCase().replace(/[\s×*xX]/g, '');
}

/**
 * Tool: get_material
 */
export const getMaterialTool = {
  name: 'get_material',
  description: 'Retrieve detailed information for a specific product or material by name or code.',
  parameters: z.object({
    name: z.string().describe('Material name or code (e.g., "Angle 65x65x6", "Channel 100x50", "Plate 10mm")'),
  }),
  handler: async ({ name }) => {
    const clean = name.trim();
    const norm = normalizeDimensions(clean);

    // Query Raw Materials first
    const rawMaterials = await erpGet('/master-data/raw-materials', {}, 'get_material');
    const matchedRaw = (rawMaterials || []).filter(m => {
      const normName = normalizeDimensions(m.name);
      const normSize = normalizeDimensions(m.size);
      return (
        m.name?.toLowerCase().includes(clean.toLowerCase()) ||
        normName.includes(norm) ||
        norm.includes(normSize) ||
        (m.size && clean.toLowerCase().includes(m.size.toLowerCase()))
      );
    });

    // Query Private Materials
    const privateMaterials = await erpGet('/master-data/private-materials', {}, 'get_material');
    const matchedPrivate = (privateMaterials || []).filter(m =>
      m.name?.toLowerCase().includes(clean.toLowerCase()) ||
      normalizeDimensions(m.name).includes(norm) ||
      (m.code && m.code.toLowerCase() === clean.toLowerCase())
    );


    if (matchedRaw.length === 0 && matchedPrivate.length === 0) {
      return {
        content: [{
          type: 'text',
          text: `Material "${name}" was not found in the ERP database. Please verify the description or use search_materials to list available items.`,
        }],
      };
    }

    const results = {
      query: name,
      found: matchedRaw.length + matchedPrivate.length,
      rawMaterials: matchedRaw.map(m => ({
        id: m._id,
        name: m.name,
        category: m.category,
        size: m.size || 'N/A',
        grade: m.grade || 'IS 2062',
        unit: m.unit || 'KG',
        hsn: m.hsn || '7216',
        gstRate: `${m.gstRate || 18}%`,
        defaultRate: m.defaultRate ? `INR ${m.defaultRate}/${m.unit || 'KG'}` : 'Not Specified',
        description: m.description || '',
      })),
      commercialMaterials: matchedPrivate.map(m => ({
        id: m._id,
        name: m.name,
        code: m.code || 'N/A',
        unit: m.unit || 'Nos',
        hsn: m.hsn || 'N/A',
        gstRate: `${m.gstRate || 18}%`,
        sellingRate: m.rate ? `INR ${m.rate}/${m.unit || 'Nos'}` : 'Not Specified',
        description: m.description || '',
      })),
    };

    return {
      content: [{
        type: 'text',
        text: JSON.stringify(results, null, 2),
      }],
    };
  },
};

/**
 * Tool: search_materials
 */
export const searchMaterialsTool = {
  name: 'search_materials',
  description: 'Search for products, steel raw materials, or fabricated items matching a keyword, size, or category.',
  parameters: z.object({
    keyword: z.string().optional().describe('Keyword or search string (e.g. "Angle", "Plate", "65x65", "IS 2062")'),
    category: z.string().optional().describe('Category filter (e.g. "Angles", "Channels", "Beams", "Plates", "Round Bars", "Pipes", "Flats")'),
    limit: z.number().optional().default(20).describe('Maximum number of items to return (default: 20)'),
  }),
  handler: async ({ keyword = '', category = '', limit = 20 }) => {
    const rawMaterials = await erpGet('/master-data/raw-materials', {}, 'search_materials');
    const privateMaterials = await erpGet('/master-data/private-materials', {}, 'search_materials');

    const kw = keyword.toLowerCase().trim();
    const cat = category.toLowerCase().trim();

    const filteredRaw = (rawMaterials || []).filter(m => {
      const matchKw = !kw || 
        (m.name && m.name.toLowerCase().includes(kw)) ||
        (m.size && m.size.toLowerCase().includes(kw)) ||
        (m.grade && m.grade.toLowerCase().includes(kw));
      const matchCat = !cat || (m.category && m.category.toLowerCase().includes(cat));
      return matchKw && matchCat;
    });

    const filteredPrivate = (privateMaterials || []).filter(m => {
      if (cat) return false; // Private materials don't have categories
      return !kw || 
        (m.name && m.name.toLowerCase().includes(kw)) ||
        (m.code && m.code.toLowerCase().includes(kw)) ||
        (m.description && m.description.toLowerCase().includes(kw));
    });

    const combined = [
      ...filteredRaw.map(m => ({
        type: 'Raw Material',
        name: m.name,
        category: m.category,
        size: m.size || 'Standard',
        grade: m.grade || 'IS 2062',
        unit: m.unit || 'KG',
        rate: m.defaultRate ? `INR ${m.defaultRate}/${m.unit || 'KG'}` : 'Market / RFQ',
      })),
      ...filteredPrivate.map(m => ({
        type: 'Commercial / Finished Item',
        name: m.name,
        code: m.code || 'N/A',
        unit: m.unit || 'Nos',
        rate: m.rate ? `INR ${m.rate}/${m.unit || 'Nos'}` : 'Not Specified',
      })),
    ].slice(0, limit);

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          totalMatches: combined.length,
          items: combined,
        }, null, 2),
      }],
    };
  },
};

/**
 * Tool: get_material_rate
 */
export const getMaterialRateTool = {
  name: 'get_material_rate',
  description: 'Retrieve the current master rate, selling rate, or historical purchase rates for a specific material.',
  parameters: z.object({
    material: z.string().describe('Material description or size (e.g. "Angle 65x65x6", "Plate 12mm", "Channel 100x50")'),
  }),
  handler: async ({ material }) => {
    const clean = material.trim().toLowerCase();
    const norm = normalizeDimensions(clean);

    // 1. Fetch from Raw Materials master
    const rawMaterials = await erpGet('/master-data/raw-materials', {}, 'get_material_rate');
    const matchedRaw = (rawMaterials || []).filter(m => {
      const normName = normalizeDimensions(m.name);
      const normSize = normalizeDimensions(m.size);
      return (
        m.name?.toLowerCase().includes(clean) ||
        normName.includes(norm) ||
        (normSize && (norm.includes(normSize) || normSize.includes(norm))) ||
        (m.size && clean.includes(m.size.toLowerCase()))
      );
    });

    // 2. Fetch from Commercial/Private Materials master
    const privateMaterials = await erpGet('/master-data/private-materials', {}, 'get_material_rate');
    const matchedPrivate = (privateMaterials || []).filter(m =>
      m.name?.toLowerCase().includes(clean) ||
      normalizeDimensions(m.name).includes(norm)
    );

    // 3. Check latest purchase orders for actual vendor rates
    let lastPurchaseRate = null;
    try {
      const pos = await erpGet('/purchases', {}, 'get_material_rate');
      if (Array.isArray(pos)) {
        for (const po of pos) {
          // Look in approved estimate or vendor estimates
          const item = (po.items || []).find(i => 
            i.name?.toLowerCase().includes(clean) ||
            normalizeDimensions(i.name).includes(norm)
          );
          if (item) {
            if (po.approvedEstimate?.items) {
              const appItem = po.approvedEstimate.items.find(ai => 
                ai.name?.toLowerCase().includes(clean) ||
                normalizeDimensions(ai.name).includes(norm)
              );
              if (appItem && appItem.rate) {
                lastPurchaseRate = {
                  rate: appItem.rate,
                  unit: item.unit || 'KG',
                  poNumber: po.poNumber,
                  vendorName: po.approvedEstimate.vendorName || po.vendorName,
                  date: po.createdAt ? new Date(po.createdAt).toISOString().slice(0, 10) : 'Recent',
                };
                break;
              }
            }
          }
        }
      }
    } catch (_) {}


    if (matchedRaw.length === 0 && matchedPrivate.length === 0 && !lastPurchaseRate) {
      return {
        content: [{
          type: 'text',
          text: `No rates found for material "${material}". Please check the name spelling or use search_materials to view all catalog items.`,
        }],
      };
    }

    const rateReport = {
      material,
      currentRates: [
        ...matchedRaw.map(m => ({
          rateType: 'Base Master Rate',
          materialName: m.name,
          category: m.category,
          size: m.size || 'N/A',
          grade: m.grade || 'IS 2062',
          unitRate: m.defaultRate ? `INR ${m.defaultRate} per ${m.unit || 'KG'}` : 'RFQ Required',
          tax: `GST ${m.gstRate || 18}% (HSN ${m.hsn || '7216'})`,
          currency: 'INR',
        })),
        ...matchedPrivate.map(m => ({
          rateType: 'Selling Rate',
          materialName: m.name,
          code: m.code || 'N/A',
          unitRate: m.rate ? `INR ${m.rate} per ${m.unit || 'Nos'}` : 'Not Specified',
          tax: `GST ${m.gstRate || 18}% (HSN ${m.hsn || 'N/A'})`,
          currency: 'INR',
        })),
      ],
      lastPurchaseTransaction: lastPurchaseRate ? {
        rateType: 'Last Approved Purchase Order Rate',
        vendor: lastPurchaseRate.vendorName,
        poNumber: lastPurchaseRate.poNumber,
        date: lastPurchaseRate.date,
        unitRate: `INR ${lastPurchaseRate.rate} per ${lastPurchaseRate.unit}`,
      } : 'No previous purchase orders found for this exact material.',
    };

    return {
      content: [{
        type: 'text',
        text: JSON.stringify(rateReport, null, 2),
      }],
    };
  },
};
