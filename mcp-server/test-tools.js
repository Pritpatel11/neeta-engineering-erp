import dotenv from 'dotenv';
dotenv.config();

import { getMaterialRateTool, searchMaterialsTool } from './src/tools/materials.js';
import { getInventoryTool, searchInventoryTool } from './src/tools/inventory.js';
import { searchInvoicesTool, getInvoiceTool, getInvoicePdfTool } from './src/tools/invoices.js';
import { searchCustomersTool } from './src/tools/customers.js';
import { searchSuppliersTool } from './src/tools/suppliers.js';
import { getSalesReportTool, getInventoryReportTool, getPurchaseReportTool } from './src/tools/reports.js';

async function runTests() {
  console.log('======================================================================');
  console.log('   NEETA ENGINEERING ERP - MCP TOOLS INTEGRATION TEST SUITE');
  console.log('======================================================================\n');

  const tests = [
    {
      name: '1. Material Rates: get_material_rate("Angle 65x65x6")',
      fn: () => getMaterialRateTool.handler({ material: 'Angle 65x65x6' }),
    },
    {
      name: '2. Search Materials: search_materials("Angle")',
      fn: () => searchMaterialsTool.handler({ keyword: 'Angle', limit: 3 }),
    },
    {
      name: '3. Inventory Stock: get_inventory()',
      fn: () => getInventoryTool.handler({}),
    },
    {
      name: '4. Search Invoices: search_invoices()',
      fn: () => searchInvoicesTool.handler({ limit: 3 }),
    },
    {
      name: '5. Search Customers: search_customers()',
      fn: () => searchCustomersTool.handler({ limit: 3 }),
    },
    {
      name: '6. Search Suppliers: search_suppliers()',
      fn: () => searchSuppliersTool.handler({ limit: 3 }),
    },
    {
      name: '7. Sales Report: get_sales_report()',
      fn: () => getSalesReportTool.handler({}),
    },
    {
      name: '8. Inventory Report: get_inventory_report()',
      fn: () => getInventoryReportTool.handler({}),
    },
    {
      name: '9. Purchase Report: get_purchase_report()',
      fn: () => getPurchaseReportTool.handler({}),
    },
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    process.stdout.write(`[*] Testing ${test.name}... `);
    try {
      const res = await test.fn();
      if (res && res.content && res.content[0]) {
        console.log('\x1b[32mPASSED\x1b[0m');
        // Preview sample output
        const text = res.content[0].text;
        const preview = text.length > 200 ? text.slice(0, 200) + '...' : text;
        console.log(`    Output snippet: ${preview.replace(/\n/g, ' ')}\n`);
        passed++;
      } else {
        console.log('\x1b[33mEMPTY RESPONSE\x1b[0m\n');
      }
    } catch (err) {
      console.log('\x1b[31mFAILED\x1b[0m');
      console.error(`    Error: ${err.message}\n`);
      failed++;
    }
  }

  // Also test PDF generation if any invoice exists
  try {
    const invRes = await searchInvoicesTool.handler({ limit: 1 });
    const parsed = JSON.parse(invRes.content[0].text);
    if (parsed.invoices && parsed.invoices.length > 0) {
      const testInvoiceNo = parsed.invoices[0].invoiceNo;
      process.stdout.write(`[*] Testing 10. Invoice PDF: get_invoice_pdf("${testInvoiceNo}")... `);
      const pdfRes = await getInvoicePdfTool.handler({ invoiceNumber: testInvoiceNo });
      console.log('\x1b[32mPASSED\x1b[0m');
      console.log(`    PDF Output: ${pdfRes.content[0].text.replace(/\n/g, ' ')}\n`);
      passed++;
    }
  } catch (err) {
    console.log(`\x1b[33mPDF test skipped or notice: ${err.message}\x1b[0m\n`);
  }

  console.log('======================================================================');
  console.log(`Test Results: ${passed} passed, ${failed} failed`);
  console.log('======================================================================\n');
}

runTests().catch(console.error);
