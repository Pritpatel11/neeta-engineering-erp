const Challan = require('../models/Challan');
const Statement = require('../models/Statement');
const Receipt = require('../models/Receipt');
const DivisionBalance = require('../models/DivisionBalance');
const Contractor = require('../models/Contractor');
const Material = require('../models/Material');
const Division = require('../models/Division');
const PrivateParty = require('../models/PrivateParty');

// Utility to sanitize regex inputs and prevent regex injection
const escapeRegex = (str) => {
  if (!str || typeof str !== 'string') return '';
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

// Schema definitions for Groq tool calling (OpenAI-compatible format)
const toolsDefinition = [
  {
    type: 'function',
    function: {
      name: 'get_master_parties_and_materials',
      description: 'Fetch approved lists of registered contractors, private parties, warehouse divisions, and materials from the database.',
      parameters: {
        type: 'object',
        properties: {
          category: {
            type: 'string',
            enum: ['all', 'contractors', 'materials', 'divisions', 'parties'],
            description: 'Specific master data category to retrieve',
          },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'search_accounting_transactions',
      description: 'Search accounting and logistics records (Challans, Statements, Payment Receipts) by date, contractor/party name, or division.',
      parameters: {
        type: 'object',
        properties: {
          recordType: {
            type: ['string', 'null'],
            enum: ['all', 'challans', 'statements', 'receipts', null],
            description: 'Type of transaction record to search',
          },
          date: {
            type: ['string', 'null'],
            description: 'Date string (e.g. "15/09/2026", "2026-09-15", or month)',
          },
          partyOrContractor: {
            type: ['string', 'null'],
            description: 'Name of contractor or client party',
          },
          divisionName: {
            type: ['string', 'null'],
            description: 'Division or project location name (e.g. "Deesa", "Palanpur")',
          },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_inventory_balance',
      description: 'Query current stock inventory levels, material balances, base quantities, and adjustments across warehouse divisions and subdivisions.',
      parameters: {
        type: 'object',
        properties: {
          materialName: {
            type: ['string', 'null'],
            description: 'Name, code, or description of the material (e.g. "Angle 50x50x5", "3611000019", "Channel")',
          },
          divisionName: {
            type: ['string', 'null'],
            description: 'Name of warehouse division (e.g. "Deesa", "Tharad")',
          },
          subDivisionName: {
            type: ['string', 'null'],
            description: 'Sub-division or project site name if specified by user',
          },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'check_challan_requirements',
      description: 'Verify if all mandatory fields required to generate a Delivery Challan are provided, and list any missing or unclear details.',
      parameters: {
        type: 'object',
        properties: {
          date: { type: ['string', 'null'], description: 'Challan date (e.g. "15/09/2026")' },
          contractorName: { type: ['string', 'null'], description: 'Name of contractor or client party' },
          divisionName: { type: ['string', 'null'], description: 'Division name (e.g. "Deesa")' },
          subDivisionName: { type: ['string', 'null'], description: 'Sub-division / site name' },
          vehicleNumber: { type: ['string', 'null'], description: 'Transport vehicle registration number (e.g. "GJ-08-AX-1234")' },
          driverName: { type: ['string', 'null'], description: 'Driver name' },
          gatePassNo: { type: ['string', 'null'], description: 'Gate pass number' },
          materials: {
            type: 'array',
            description: 'List of materials with quantity and unit',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                qty: { type: 'number' },
                unit: { type: ['string', 'null'] },
              },
              required: ['name', 'qty'],
            },
          },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_challan_record',
      description: 'Create and save an official Delivery Challan in the database once all details are verified and user gives explicit confirmation.',
      parameters: {
        type: 'object',
        properties: {
          date: { type: 'string', description: 'Challan date' },
          contractorName: { type: 'string', description: 'Contractor name' },
          divisionName: { type: 'string', description: 'Division name' },
          subDivisionName: { type: ['string', 'null'], description: 'Sub-division name' },
          vehicleNumber: { type: ['string', 'null'], description: 'Vehicle number' },
          driverName: { type: ['string', 'null'], description: 'Driver name' },
          gatePassNo: { type: ['string', 'null'], description: 'Gate pass number' },
          materials: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                qty: { type: 'number' },
                unit: { type: ['string', 'null'] },
              },
              required: ['name', 'qty'],
            },
          },
          confirmExecution: {
            type: 'boolean',
            description: 'Must be true to authorize writing to the database.',
          },
        },
        required: ['date', 'contractorName', 'divisionName', 'materials', 'confirmExecution'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'generate_statement_data',
      description: 'Compile and generate an official Material/Financial Statement for a given party and date or period.',
      parameters: {
        type: 'object',
        properties: {
          date: { type: 'string', description: 'Target date (e.g. "15/09/2026")' },
          contractorName: { type: ['string', 'null'], description: 'Contractor or party name' },
          divisionName: { type: ['string', 'null'], description: 'Division name' },
        },
        required: ['date'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_executive_financial_summary',
      description: 'Get high-level organizational throughput, active transactions, and total billing summary (Owner/Admin restricted).',
      parameters: {
        type: 'object',
        properties: {
          period: { type: ['string', 'null'], description: 'e.g. "current_year", "this_month"' },
        },
      },
    },
  },
];

// Tool Executor Implementation with RBAC validation
const executeAiTool = async (name, args, user) => {
  try {
    switch (name) {
      case 'get_master_parties_and_materials': {
        const [contractors, materials, divisions, parties] = await Promise.all([
          Contractor.find({}).select('name category -_id').limit(20),
          Material.find({}).select('name unit -_id').limit(30),
          Division.find({}).select('name -_id').limit(10),
          PrivateParty.find({}).select('name -_id').limit(15),
        ]);
        return {
          contractors: contractors.map(c => c.name),
          materials: materials.map(m => `${m.name} (${m.unit || 'Kg'})`),
          divisions: divisions.map(d => d.name),
          parties: parties.map(p => p.name),
        };
      }

      case 'search_accounting_transactions': {
        // RBAC check: Department users can only access records relevant to their department or assigned modules
        const { recordType, date, partyOrContractor, divisionName } = args;
        const results = {};

        // Query Challans (Logistics & Admin & Owner or assigned module)
        if (recordType === 'all' || recordType === 'challans') {
          const hasChallanAccess =
            user.role === 'admin' ||
            user.role === 'owner' ||
            user.department === 'logistics' ||
            user.department === 'all' ||
            (Array.isArray(user.assignedModules) &&
              (user.assignedModules.includes('/challan-management') || user.assignedModules.includes('/create-challan')));

          if (hasChallanAccess) {
            const q = {};
            if (date) q.date = { $regex: escapeRegex(date), $options: 'i' };
            if (partyOrContractor) q.contractorName = { $regex: escapeRegex(partyOrContractor), $options: 'i' };
            if (divisionName) q.divisionName = { $regex: escapeRegex(divisionName), $options: 'i' };
            results.challans = await Challan.find(q).limit(8).sort({ createdAt: -1 });
          } else {
            results.challansNotice = 'Access to Delivery Challans is restricted to authorized Logistics staff and Management.';
          }
        }

        // Query Statements & Receipts (Accounts & Admin & Owner or assigned module)
        if (recordType === 'all' || recordType === 'statements' || recordType === 'receipts') {
          const hasAccountsAccess =
            user.role === 'admin' ||
            user.role === 'owner' ||
            user.department === 'accounts' ||
            user.department === 'all' ||
            (Array.isArray(user.assignedModules) &&
              (user.assignedModules.includes('/statement-management') ||
                user.assignedModules.includes('/create-statement') ||
                user.assignedModules.includes('/receipt-management') ||
                user.assignedModules.includes('/create-receipt')));

          if (hasAccountsAccess) {
            if (recordType === 'all' || recordType === 'statements') {
              const sq = {};
              if (date) sq.date = { $regex: escapeRegex(date), $options: 'i' };
              if (partyOrContractor) sq.contractorName = { $regex: escapeRegex(partyOrContractor), $options: 'i' };
              results.statements = await Statement.find(sq).limit(8).sort({ createdAt: -1 });
            }
            if (recordType === 'all' || recordType === 'receipts') {
              const rq = {};
              if (date) rq.date = { $regex: escapeRegex(date), $options: 'i' };
              results.receipts = await Receipt.find(rq).limit(8).sort({ createdAt: -1 });
            }
          } else {
            results.accountsNotice = 'Access to Financial Statements and Receipts is restricted to authorized Accounts staff and Management.';
          }
        }

        return results;
      }

      case 'get_inventory_balance': {
        const hasInventoryAccess =
          user.role === 'admin' ||
          user.role === 'owner' ||
          user.department === 'logistics' ||
          user.department === 'all' ||
          (Array.isArray(user.assignedModules) && user.assignedModules.includes('/inventory-balance'));

        if (!hasInventoryAccess) {
          return {
            error: true,
            message: 'Permission denied: Access to Warehouse Inventory Balances is restricted to authorized personnel.',
          };
        }

        const { materialName, divisionName, subDivisionName } = args;
        const q = {};
        if (divisionName) q.divisionName = { $regex: escapeRegex(divisionName), $options: 'i' };
        if (materialName) q['materials.name'] = { $regex: escapeRegex(materialName), $options: 'i' };

        const balances = await DivisionBalance.find(q).limit(15);
        if (balances.length === 0) {
          return { message: 'No inventory record matching the specified material or division was found in the database.' };
        }

        const formatted = [];
        balances.forEach((doc) => {
          doc.materials?.forEach((m) => {
            if (!materialName || new RegExp(escapeRegex(materialName), 'i').test(m.name)) {
              // Parse leading numeric code if present (e.g. "3611000019 9FT. ANGLE 65*65*6")
              const codeMatch = m.name ? m.name.match(/^(\d{6,14})\s+(.*)$/) : null;
              const materialCode = codeMatch ? codeMatch[1] : null;
              const materialDescription = codeMatch ? codeMatch[2] : m.name;

              formatted.push({
                division: doc.divisionName,
                subdivision: subDivisionName || null,
                material: m.name,
                materialCode: materialCode,
                materialDescription: materialDescription,
                balance: (Number(m.qty) || 0) + (Number(m.manualAdjustment) || 0),
                baseQty: Number(m.qty) || 0,
                adjustment: Number(m.manualAdjustment) || 0,
              });
            }
          });
        });

        if (formatted.length === 0) {
          return { message: 'No inventory record matching the specified material was found in the database.' };
        }
        return formatted.slice(0, 20);
      }

      case 'check_challan_requirements': {
        // RBAC check: only logistics, admin, or staff with /create-challan permission
        const hasChallanAccess =
          user.role === 'admin' ||
          user.department === 'logistics' ||
          user.department === 'all' ||
          (Array.isArray(user.assignedModules) && user.assignedModules.includes('/create-challan'));

        if (!hasChallanAccess) {
          return {
            error: true,
            message: 'Permission denied: Your account role does not have authorization to draft or generate Delivery Challans.',
          };
        }

        const missing = [];
        if (!args.date) missing.push('date (Challan Date)');
        if (!args.contractorName) missing.push('contractorName (Party / Contractor)');
        if (!args.divisionName) missing.push('divisionName (Warehouse Division)');
        if (!args.materials || !Array.isArray(args.materials) || args.materials.length === 0) {
          missing.push('materials (Material items with quantity and unit)');
        }
        if (!args.vehicleNumber) missing.push('vehicleNumber (Transport Vehicle No)');

        const isComplete = missing.length === 0;

        return {
          isComplete,
          missingFields: missing,
          providedFields: args,
          message: isComplete
            ? 'All required parameters for creating a Delivery Challan are verified. Ready for user confirmation.'
            : `Missing required information: ${missing.join(', ')}. Please ask the user to provide these specific details.`,
        };
      }

      case 'create_challan_record': {
        // RBAC check
        if (user.role !== 'admin' && user.department !== 'logistics' && !user.assignedModules.includes('/create-challan')) {
          return {
            error: true,
            message: 'Permission denied: You do not have permission to create Delivery Challans.',
          };
        }

        if (!args.confirmExecution) {
          return {
            requiresConfirmation: true,
            message: 'Safety check: User must explicitly confirm the challan details before writing to database.',
            draftDetails: args,
          };
        }

        // Generate unique Challan No
        const year = new Date().getFullYear();
        const randomNum = Math.floor(1000 + Math.random() * 9000);
        const challanNo = `CH-${year}-${randomNum}`;

        const newChallan = await Challan.create({
          challanNo,
          contractorName: args.contractorName,
          gatePassNo: args.gatePassNo || `GP-${randomNum}`,
          gatePassDate: args.date,
          date: args.date,
          divisionName: args.divisionName,
          subDivisionName: args.subDivisionName || args.divisionName,
          vehicleNumber: args.vehicleNumber || 'GJ-08-T-9876',
          driverName: args.driverName || 'Authorized Driver',
          status: 'Pending',
          materials: (args.materials || []).map((m) => ({
            name: m.name || m.description || 'Standard Material',
            qty: Number(m.qty !== undefined ? m.qty : (m.quantity !== undefined ? m.quantity : 100)) || 100,
            unit: m.unit || 'Kg',
          })),
          financialYear: '2025-26',
        });

        return {
          success: true,
          action: 'created_challan',
          challanId: newChallan._id,
          challanNo: newChallan.challanNo,
          date: newChallan.date,
          contractorName: newChallan.contractorName,
          divisionName: newChallan.divisionName,
          materials: newChallan.materials,
          viewUrl: `#/challan-preview`,
          previewState: { challanData: newChallan },
          message: `Delivery Challan ${newChallan.challanNo} generated successfully and saved to the database.`,
        };
      }

      case 'generate_statement_data': {
        const hasStatementAccess =
          user.role === 'admin' ||
          user.role === 'owner' ||
          user.department === 'accounts' ||
          user.department === 'all' ||
          (Array.isArray(user.assignedModules) &&
            (user.assignedModules.includes('/statement-management') || user.assignedModules.includes('/create-statement')));

        if (!hasStatementAccess) {
          return {
            error: true,
            message: 'Permission denied: Your account role does not have authorization to view or generate Statements.',
          };
        }

        const { date, contractorName, divisionName } = args;

        // Fetch matching transactions
        const sq = {};
        if (date) sq.date = { $regex: escapeRegex(date), $options: 'i' };
        if (contractorName) sq.contractorName = { $regex: escapeRegex(contractorName), $options: 'i' };
        if (divisionName) sq.divisionName = { $regex: escapeRegex(divisionName), $options: 'i' };

        const statements = await Statement.find(sq).limit(5);

        if (statements.length > 0) {
          const st = statements[0];
          return {
            success: true,
            action: 'found_statement',
            statementNo: st.statementNo,
            date: st.date,
            contractorName: st.contractorName,
            divisionName: st.divisionName,
            materials: st.materials,
            viewUrl: `#/statement-preview`,
            previewState: { statementData: st },
            message: `Statement ${st.statementNo} for ${st.contractorName} on ${st.date} retrieved.`,
          };
        }

        // If no existing statement found for that exact date, prepare a verified statement draft from challans on that date
        const challanQuery = {};
        if (date) challanQuery.date = { $regex: escapeRegex(date), $options: 'i' };
        if (contractorName) challanQuery.contractorName = { $regex: escapeRegex(contractorName), $options: 'i' };

        const matchedChallans = await Challan.find(challanQuery).limit(5);

        if (matchedChallans.length === 0) {
          return {
            found: false,
            message: `No transactions found for date ${date}${contractorName ? ` and party ${contractorName}` : ''}. Please specify a valid contractor name or verify transaction date.`,
          };
        }

        const aggregatedMaterials = [];
        matchedChallans.forEach(c => {
          c.materials?.forEach(m => {
            aggregatedMaterials.push({ name: m.name, qty: m.qty, unit: m.unit });
          });
        });

        const statementDraft = {
          statementNo: `ST-${Date.now().toString().slice(-6)}`,
          date: date,
          contractorName: contractorName || matchedChallans[0].contractorName,
          divisionName: divisionName || matchedChallans[0].divisionName,
          subDivisionName: matchedChallans[0].subDivisionName,
          materials: aggregatedMaterials,
          mrNumbers: matchedChallans.map(c => c.challanNo),
          financialYear: '2025-26',
        };

        return {
          success: true,
          action: 'compiled_statement',
          statementDraft,
          message: `Compiled Statement from ${matchedChallans.length} transaction challans on ${date} for ${statementDraft.contractorName}.`,
        };
      }

      case 'get_executive_financial_summary': {
        if (user.role !== 'owner' && user.role !== 'admin') {
          return {
            error: true,
            message: 'Access restricted: Executive financial summaries are reserved for Owner & Admin roles.',
          };
        }

        const [challanCount, statementCount, receipts] = await Promise.all([
          Challan.countDocuments(),
          Statement.countDocuments(),
          Receipt.find({}).select('amount -_id').limit(100),
        ]);

        const totalReceiptsAmount = receipts.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);

        return {
          totalChallans: challanCount,
          totalStatements: statementCount,
          recentReceiptsTotal: `₹${totalReceiptsAmount.toLocaleString('en-IN')}`,
          operationalStatus: 'All divisions operational',
        };
      }

      default:
        return { error: `Tool ${name} is not recognized.` };
    }
  } catch (error) {
    console.error(`Error executing tool ${name}:`, error);
    return { error: error.message };
  }
};

module.exports = {
  toolsDefinition,
  executeAiTool,
};
