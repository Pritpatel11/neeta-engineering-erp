# Neeta Engineering ERP - Model Context Protocol (MCP) Server

A secure, high-performance gateway connecting **Claude Desktop** and **Claude AI** directly to the **Neeta Engineering ERP System** via the Model Context Protocol (MCP).

---

## Architecture & Security Boundary

```
┌─────────────────┐
│  Claude Desktop │
│    (Claude AI)  │
└────────┬────────┘
         │  Stdio JSON-RPC (MCP Protocol)
         ▼
┌───────────────────────────────────────────────┐
│     Neeta Engineering ERP MCP Server          │
│   (Node.js, @modelcontextprotocol/sdk v1.6+)   │
│                                               │
│  • Pure Read-Only Tool Enforcements           │
│  • API Key Header Authentication              │
│  • Dimension Normalizer (e.g. 65x65x6)        │
│  • PDFKit Download Dispatcher                 │
│  • Zero-Pollution Audit Logger (stderr + log) │
└────────┬──────────────────────────────────────┘
         │  HTTP REST (x-mcp-api-key)
         ▼
┌───────────────────────────────────────────────┐
│         Neeta ERP Express Backend             │
│        (Running on http://localhost:5000)     │
└────────┬──────────────────────────────────────┘
         │  Mongoose ODM
         ▼
┌───────────────────────────────────────────────┐
│             MongoDB Database                  │
│       (Protected - No Direct Claude Access)   │
└───────────────────────────────────────────────┘
```

### Key Security Principles
1. **No Direct Database Access**: Claude never connects to MongoDB credentials or ports. Every request is routed through the ERP's authenticated Express API layer.
2. **Strictly Read-Only**: The MCP server exposes **only GET/Read** tools. No update, delete, create, or status-override tools exist.
3. **API Key Authentication**: The backend verifies `x-mcp-api-key` on every request.
4. **Stdio Protocol Integrity**: All debug, informational, and audit logs are sent strictly to `process.stderr` and `logs/mcp-audit.log`. Standard output (`stdout`) is reserved purely for MCP JSON-RPC 2.0 frames to prevent connection drops.
5. **Masked Audit Trails**: All requests are recorded with timestamp, tool name, response time, and sanitized URLs (credentials/keys stripped).

---

## 1. Quickstart & Installation

### Prerequisites
- Node.js 18+ (tested on Node.js v22.13.0)
- Neeta ERP Backend running on `http://localhost:5000` (started via `run.bat` or `npm start` in `backend/`)

### Setup MCP Server
1. Open PowerShell / Command Prompt:
   ```cmd
   cd e:\ERP2\mcp-server
   npm install
   ```
2. Verify `.env` configuration:
   ```env
   PORT=5001
   ERP_API_BASE_URL=http://127.0.0.1:5000/api
   ERP_MCP_API_KEY=neeta_erp_mcp_secure_key_2026
   ERP_FINANCIAL_YEAR=2025-26
   PDF_DOWNLOAD_DIR=e:\ERP2\mcp-server\downloads
   AUDIT_LOG_FILE=e:\ERP2\mcp-server\logs\mcp-audit.log
   ```
3. Run the automated integration test suite:
   ```cmd
   npm test
   ```
   *(All 10 test suites should pass with 100% success).*

---

## 2. Claude Desktop Integration

To connect Claude Desktop to your ERP system, configure Claude's configuration file:

### Configuration File Location:
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`  
  *(Typically `C:\Users\<YourUsername>\AppData\Roaming\Claude\claude_desktop_config.json`)*
- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`

### Configuration JSON:
Add the `neeta-erp` server definition inside `mcpServers`:

```json
{
  "mcpServers": {
    "neeta-erp": {
      "command": "node",
      "args": [
        "E:\\ERP2\\mcp-server\\src\\index.js"
      ],
      "env": {
        "ERP_API_BASE_URL": "http://127.0.0.1:5000/api",
        "ERP_MCP_API_KEY": "neeta_erp_mcp_secure_key_2026",
        "ERP_FINANCIAL_YEAR": "2025-26",
        "PDF_DOWNLOAD_DIR": "E:\\ERP2\\mcp-server\\downloads",
        "AUDIT_LOG_FILE": "E:\\ERP2\\mcp-server\\logs\\mcp-audit.log"
      }
    }
  }
}
```

> **Tip:** If Node is not in your system PATH, use the full path to `node.exe` (e.g., `C:\\Program Files\\nodejs\\node.exe`).  
> Alternatively, you can use the launcher script: `E:\\ERP2\\run-mcp.bat`.

Restart Claude Desktop. You will see a 🔨 (hammer) icon with **22 tools** available for Neeta Engineering ERP.

---

## 3. Tool Catalog & Input Schemas

### A. Material & Rate Management
| Tool Name | Parameters | Description |
| :--- | :--- | :--- |
| `get_material` | `name` (string) | Retrieves full specification, category, unit, dimensions, and stock info for a material. |
| `search_materials` | `query` (string), `category` (string, optional), `limit` (number, optional) | Searches raw materials, profiles, plates, and private inventory items. |
| `get_material_rate` | `material` (string) | **Intelligent Rate Lookup**. Matches sizes like `65x65x6`, `65 × 65 × 6`, or `65*65*6`. Returns master base rate and latest procurement rate from purchase records. |

### B. Inventory & Stock Tracking
| Tool Name | Parameters | Description |
| :--- | :--- | :--- |
| `get_inventory` | `material` (optional), `division` (optional) | Retrieves live balance stock across all 7 manufacturing divisions (Deesa, Palanpur, etc.). |
| `search_inventory` | `query` (string), `division` (optional) | Filters inventory stocks matching specific names, dimensions, or grades. |
| `get_stock_transactions` | `material` (optional), `division` (optional), `limit` (optional) | Returns historical stock in/out and adjustment transaction ledgers. |

### C. Invoices & PDF Generation
| Tool Name | Parameters | Description |
| :--- | :--- | :--- |
| `get_invoice` | `invoiceNumber` (optional), `id` (optional) | Detailed invoice breakdown: line items, taxable amounts, CGST/SGST/IGST, and payment status. |
| `search_invoices` | `customer` (optional), `status` (optional), `dateFrom` (optional), `dateTo` (optional), `limit` (optional) | Search billing history across financial years. |
| `get_invoice_pdf` | `invoiceNumber` (optional), `id` (optional), `saveToFile` (boolean, default: true) | **Generates real PDF invoice via ERP PDFKit engine**. Downloads authentic letterhead PDF with Mehsana Urban Bank details and saves locally to `downloads/Invoice_{No}.pdf`. Returns base64 payload. |

### D. Customers & Parties
| Tool Name | Parameters | Description |
| :--- | :--- | :--- |
| `get_customer` | `name` (optional), `id` (optional) | Full customer profile: GSTIN, PAN, phone, email, registered billing address, and payment terms. |
| `search_customers` | `query` (optional), `city` (optional), `state` (optional), `limit` (optional) | Searches parties, clients, and contractors. |

### E. Suppliers & Vendors
| Tool Name | Parameters | Description |
| :--- | :--- | :--- |
| `get_supplier` | `name` (optional), `id` (optional) | Vendor details: contact persons, bank details, GSTIN, and supply categories. |
| `search_suppliers` | `query` (optional), `category` (optional), `limit` (optional) | Search suppliers by company name or materials supplied. |

### F. Purchase & Sales Orders
| Tool Name | Parameters | Description |
| :--- | :--- | :--- |
| `get_purchase_order` | `poNumber` (optional), `id` (optional) | Details of a procurement order including items, agreed rates, delivery dates, and approval status. |
| `search_purchase_orders` | `vendor` (optional), `status` (optional), `dateFrom` (optional), `dateTo` (optional), `limit` (optional) | Search PO records. |
| `get_sales_order` | `orderNumber` (optional), `id` (optional) | Sales contract / work order details with client requirements. |
| `search_sales_orders` | `customer` (optional), `status` (optional), `limit` (optional) | Search sales agreements and orders. |

### G. Payments & Ledger
| Tool Name | Parameters | Description |
| :--- | :--- | :--- |
| `get_payment` | `id` (string) | Payment receipt/voucher details: reference number, payment mode (NEFT/RTGS/Cheque), amount, date. |
| `search_payments` | `partyName` (optional), `paymentMode` (optional), `dateFrom` (optional), `dateTo` (optional), `limit` (optional) | Search payment records and cash flows. |

### H. Executive Analytics & Reports
| Tool Name | Parameters | Description |
| :--- | :--- | :--- |
| `get_sales_report` | `period` ("month" \| "quarter" \| "year" \| "all"), `financialYear` (optional) | High-level sales report: total gross billed, total collections, outstanding balances, and customer billing rankings. |
| `get_purchase_report` | `period` ("month" \| "quarter" \| "year" \| "all"), `financialYear` (optional) | Procurement metrics: approved spending, pending approvals, order count, and top vendors. |
| `get_inventory_report` | *(none)* | Total stock volume across 7 divisions, total unique material counts, and division-by-division breakdown. |

---

## 4. Example Prompts to Ask Claude

Once connected to Claude Desktop, you can ask questions naturally:

* **Material Rates**:
  > *"What is the current rate of Angle 65x65x6 in the ERP?"*  
  > Claude uses `get_material_rate` to extract the base rate (₹54.00/KG) and checks purchase history for the latest PO rate.

* **Inventory Checking**:
  > *"How much MS Plate stock do we have left across all divisions?"*  
  > Claude uses `get_inventory` and `search_inventory` to break down stock in Deesa, Palanpur, etc.

* **Invoice Lookup & PDF Download**:
  > *"Can you find invoice PI-001 and give me the official PDF?"*  
  > Claude retrieves billing information and invokes `get_invoice_pdf`, storing `Invoice_PI-001.pdf` directly into the downloads folder.

* **Customer & Vendor Information**:
  > *"What is the GSTIN and phone number for Banaskantha District Co-Op Milk Union?"*  
  > Claude calls `get_customer` to return contact details, GSTIN, and billing addresses.

* **Executive Summary**:
  > *"Give me an executive summary of our sales performance and outstanding receivables for this year."*  
  > Claude calls `get_sales_report` and summarizes total invoices, collections, and pending dues.

---

## 5. Audit Logging

Every interaction is recorded in `mcp-server/logs/mcp-audit.log`:

```log
[MCP AUDIT] 2026-09-23T05:54:52.348Z | [OK] get_material_rate | 20ms | /master-data/raw-materials
[MCP AUDIT] 2026-09-23T05:54:52.401Z | [OK] search_invoices | 5ms | /private-invoices
[MCP AUDIT] 2026-09-23T05:54:52.477Z | [OK] get_invoice_pdf | 4ms | /private-invoices/by-number/PI-001
[MCP AUDIT] 2026-09-23T05:54:52.491Z | [OK] get_invoice_pdf | 13ms | /private-invoices/by-number/PI-001/pdf
```

The log records:
- **Timestamp** (ISO 8601)
- **Status** (`[OK]` or `[ERR]`)
- **Tool Name**
- **Round-trip Latency** in milliseconds
- **Endpoint Accessed**
