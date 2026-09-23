#!/usr/bin/env node

/**
 * Neeta Engineering ERP - Model Context Protocol (MCP) Server
 *
 * Provides a secure, authenticated bridge between Claude and the Neeta ERP System.
 * Claude -> MCP Server (JSON-RPC) -> ERP REST API -> Database
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import dotenv from 'dotenv';
import { logInfo, logError } from './logger.js';

// Load environment variables
dotenv.config();

// Tool imports
import { getMaterialTool, searchMaterialsTool, getMaterialRateTool } from './tools/materials.js';
import { getInventoryTool, searchInventoryTool, getStockTransactionsTool } from './tools/inventory.js';
import { getInvoiceTool, searchInvoicesTool, getInvoicePdfTool } from './tools/invoices.js';
import { getCustomerTool, searchCustomersTool } from './tools/customers.js';
import { getSupplierTool, searchSuppliersTool } from './tools/suppliers.js';
import { 
  getPurchaseOrderTool, 
  searchPurchaseOrdersTool, 
  getSalesOrderTool, 
  searchSalesOrdersTool 
} from './tools/orders.js';
import { getPaymentTool, searchPaymentsTool } from './tools/payments.js';
import { getSalesReportTool, getPurchaseReportTool, getInventoryReportTool } from './tools/reports.js';

// Create MCP Server instance
const server = new McpServer({
  name: 'neeta-engineering-erp',
  version: '1.0.0',
});

// All tool definitions array
const tools = [
  // Material & Rates
  getMaterialTool,
  searchMaterialsTool,
  getMaterialRateTool,

  // Stock & Inventory
  getInventoryTool,
  searchInventoryTool,
  getStockTransactionsTool,

  // Invoices & Billing
  getInvoiceTool,
  searchInvoicesTool,
  getInvoicePdfTool,

  // Customers & Parties
  getCustomerTool,
  searchCustomersTool,

  // Suppliers & Vendors
  getSupplierTool,
  searchSuppliersTool,

  // Orders (Purchase & Sales)
  getPurchaseOrderTool,
  searchPurchaseOrdersTool,
  getSalesOrderTool,
  searchSalesOrdersTool,

  // Payments & Ledger
  getPaymentTool,
  searchPaymentsTool,

  // Management Reports
  getSalesReportTool,
  getPurchaseReportTool,
  getInventoryReportTool,
];

// Register each tool
for (const t of tools) {
  const schemaShape = t.parameters && t.parameters.shape ? t.parameters.shape : {};
  server.tool(t.name, t.description, schemaShape, async (args) => {
    try {
      return await t.handler(args);
    } catch (err) {
      logError(`Tool execution failed for ${t.name}`, err);
      return {
        isError: true,
        content: [{
          type: 'text',
          text: `[ERP Tool Error: ${t.name}] ${err.message || String(err)}`,
        }],
      };
    }
  });
}

// Start stdio transport
async function main() {
  logInfo(`Starting Neeta Engineering ERP MCP Server v1.0.0...`);
  logInfo(`Target ERP API: ${process.env.ERP_API_BASE_URL || 'http://127.0.0.1:5000/api'}`);
  logInfo(`Registered ${tools.length} read-only MCP tools.`);

  const transport = new StdioServerTransport();
  await server.connect(transport);

  logInfo(`MCP Server connected via StdioServerTransport. Ready for Claude queries.`);
}

main().catch((err) => {
  logError('Fatal error starting MCP Server', err);
  process.exit(1);
});
