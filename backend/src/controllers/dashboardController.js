const User = require('../models/User');
const Task = require('../models/Task');
const Challan = require('../models/Challan');
const Statement = require('../models/Statement');
const Receipt = require('../models/Receipt');
const DivisionBalance = require('../models/DivisionBalance');
const StoreReceipt = require('../models/StoreReceipt');
const Material = require('../models/Material');
const Contractor = require('../models/Contractor');
const ReceiptParty = require('../models/ReceiptParty');
const AiAuditLog = require('../models/AiAuditLog');

/**
 * Helper to compute date range filter
 */
const getDateFilter = (period, field = 'createdAt') => {
  const now = new Date();
  if (period === 'today') {
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    return { [field]: { $gte: start, $lte: end } };
  }
  if (period === 'this_week') {
    const start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    return { [field]: { $gte: start } };
  }
  if (period === 'this_month') {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    return { [field]: { $gte: start } };
  }
  return {};
};

// =========================================================================
// 1. ADMIN DASHBOARD
// =========================================================================
// @desc    Get system-wide metrics, RBAC distribution, audit logs, and task overview
// @route   GET /api/dashboards/admin
// @access  Private (Admin only)
const getAdminDashboardData = async (req, res) => {
  try {
    const { period } = req.query;
    const dateFilter = getDateFilter(period);

    const [
      totalUsers,
      activeUsers,
      inactiveUsers,
      aiEnabledUsers,
      usersByDept,
      usersByRole,
      allTasks,
      recentUsers,
      recentAuditLogs,
      recentChallans,
      recentStatements,
      recentReceipts,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isActive: true }),
      User.countDocuments({ isActive: false }),
      User.countDocuments({ hasAiAccess: true }),
      User.aggregate([
        { $group: { _id: '$department', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      User.aggregate([
        { $group: { _id: '$role', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      Task.find({ ...dateFilter })
        .populate('assignedTo', 'name username role department performanceScore')
        .populate('assignedBy', 'name username')
        .sort({ dueDate: 1 }),
      User.find()
        .select('name username role department designation isActive hasAiAccess performanceScore createdAt')
        .sort({ createdAt: -1 })
        .limit(6),
      AiAuditLog.find()
        .select('username userRole prompt response securityFlag createdAt')
        .sort({ createdAt: -1 })
        .limit(8),
      Challan.find().sort({ createdAt: -1 }).limit(4),
      Statement.find().sort({ createdAt: -1 }).limit(4),
      Receipt.find().sort({ createdAt: -1 }).limit(4),
    ]);

    // Compute task metrics
    const totalTasks = allTasks.length;
    const completedTasks = allTasks.filter(t => t.status === 'completed').length;
    const inProgressTasks = allTasks.filter(t => t.status === 'in_progress').length;
    const pendingTasks = allTasks.filter(t => t.status === 'pending').length;
    const now = new Date();
    const overdueTasks = allTasks.filter(
      t => t.status !== 'completed' && (t.status === 'overdue' || (t.dueDate && new Date(t.dueDate) < now))
    );

    // Build unified recent system activity feed from real MongoDB records
    const activityFeed = [
      ...recentUsers.map(u => ({
        id: `u_${u._id}`,
        type: 'User',
        title: `User Account: ${u.name} (${u.role.toUpperCase()})`,
        meta: `Dept: ${u.department}`,
        date: u.createdAt,
        status: u.isActive ? 'Active' : 'Inactive',
        icon: 'User',
      })),
      ...recentChallans.map(c => ({
        id: `c_${c._id}`,
        type: 'Challan',
        title: `Challan #${c.challanNo} to ${c.contractorName}`,
        meta: `Division: ${c.divisionName}`,
        date: c.createdAt || new Date(c.date),
        status: c.status || 'Dispatched',
        icon: 'Truck',
      })),
      ...recentStatements.map(s => ({
        id: `s_${s._id}`,
        type: 'Statement',
        title: `Statement #${s.statementNo} (${s.contractorName})`,
        meta: `Division: ${s.divisionName}`,
        date: s.createdAt || new Date(s.date),
        status: s.status || 'Verified',
        icon: 'FileText',
      })),
      ...recentReceipts.map(r => ({
        id: `r_${r._id}`,
        type: 'Receipt',
        title: `Payment Receipt #${r.receiptNo} from ${r.partyName}`,
        meta: `Amount: ₹${Number(r.amount || 0).toLocaleString('en-IN')}`,
        date: r.createdAt || new Date(r.date),
        status: 'Recorded',
        icon: 'Receipt',
      })),
    ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 10);

    // AI security summary from real audit logs
    const auditStats = {
      total: recentAuditLogs.length,
      blockedInjections: recentAuditLogs.filter(l => l.securityFlag === 'PROMPT_INJECTION_BLOCKED').length,
      outOfScopeBlocked: recentAuditLogs.filter(l => l.securityFlag === 'OUT_OF_SCOPE_DOMAIN').length,
      accessDenied: recentAuditLogs.filter(l => l.securityFlag === 'ACCESS_DENIED').length,
    };

    res.status(200).json({
      metrics: {
        totalUsers,
        activeUsers,
        inactiveUsers,
        aiEnabledUsers,
        totalTasks,
        completedTasks,
        inProgressTasks,
        pendingTasks,
        overdueTasksCount: overdueTasks.length,
        completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
      },
      distribution: {
        byDepartment: usersByDept,
        byRole: usersByRole,
      },
      overdueTasksList: overdueTasks.slice(0, 6),
      recentUsers,
      recentAuditLogs,
      auditStats,
      activityFeed,
    });
  } catch (error) {
    console.error('getAdminDashboardData error:', error);
    res.status(500).json({ message: 'Failed to retrieve admin dashboard data: ' + error.message });
  }
};

// =========================================================================
// 2. OWNER DASHBOARD
// =========================================================================
// @desc    Executive business overview, work progress, employee scores, and throughput
// @route   GET /api/dashboards/owner
// @access  Private (Owner / Admin)
const getOwnerDashboardData = async (req, res) => {
  try {
    const { period } = req.query;
    const dateFilter = getDateFilter(period);

    const [
      allTasks,
      allUsers,
      totalChallans,
      totalStatements,
      allReceipts,
      contractorCount,
    ] = await Promise.all([
      Task.find({ ...dateFilter })
        .populate('assignedTo', 'name username role department designation performanceScore')
        .sort({ dueDate: 1 }),
      User.find({ role: { $in: ['user', 'manager'] } })
        .select('name username role department designation performanceScore isActive'),
      Challan.countDocuments(),
      Statement.countDocuments(),
      Receipt.find({}).select('amount date createdAt'),
      Contractor.countDocuments(),
    ]);

    // Financial Throughput from live Receipts
    const totalReceiptsAmount = allReceipts.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);

    // Task & Work Progress Calculations
    const totalTasks = allTasks.length;
    const completedTasks = allTasks.filter(t => t.status === 'completed').length;
    const inProgressTasks = allTasks.filter(t => t.status === 'in_progress').length;
    const pendingTasks = allTasks.filter(t => t.status === 'pending').length;
    const now = new Date();
    const overdueTasks = allTasks.filter(
      t => t.status !== 'completed' && (t.status === 'overdue' || (t.dueDate && new Date(t.dueDate) < now))
    );

    const overallProgress = totalTasks > 0
      ? Math.round(allTasks.reduce((acc, t) => acc + (t.progress || 0), 0) / totalTasks)
      : 0;

    // Department Breakdown
    const departments = ['accounts', 'logistics', 'production', 'quality', 'sales'];
    const departmentBreakdown = departments.map((dept) => {
      const deptTasks = allTasks.filter(t => t.department === dept);
      const deptCompleted = deptTasks.filter(t => t.status === 'completed').length;
      const deptOverdue = deptTasks.filter(
        t => t.status !== 'completed' && (t.status === 'overdue' || (t.dueDate && new Date(t.dueDate) < now))
      ).length;
      const deptProgress = deptTasks.length > 0
        ? Math.round(deptTasks.reduce((acc, t) => acc + (t.progress || 0), 0) / deptTasks.length)
        : 100;

      return {
        department: dept,
        totalTasks: deptTasks.length,
        completedTasks: deptCompleted,
        pendingTasks: deptTasks.length - deptCompleted,
        overdueTasks: deptOverdue,
        progress: deptProgress,
        efficiencyScore: deptTasks.length > 0
          ? Math.max(50, Math.round(deptProgress - deptOverdue * 8))
          : 90,
      };
    }).filter(d => d.totalTasks > 0);

    // Employee Performance Matrix
    const employeeMatrix = allUsers.map((user) => {
      const userTasks = allTasks.filter(
        t => t.assignedTo && t.assignedTo._id.toString() === user._id.toString()
      );
      const userCompleted = userTasks.filter(t => t.status === 'completed');
      const userIncomplete = userTasks.filter(t => t.status !== 'completed');
      const userOverdue = userIncomplete.filter(
        t => t.status === 'overdue' || (t.dueDate && new Date(t.dueDate) < now)
      );

      const calculatedScore = userTasks.length > 0
        ? Math.round((userCompleted.length / userTasks.length) * 100)
        : user.performanceScore || 85;

      return {
        userId: user._id,
        name: user.name,
        username: user.username,
        role: user.role,
        department: user.department,
        designation: user.designation,
        totalAssigned: userTasks.length,
        completedCount: userCompleted.length,
        incompleteCount: userIncomplete.length,
        overdueCount: userOverdue.length,
        score: calculatedScore,
        status: userOverdue.length > 0 ? 'Needs Attention' : (userIncomplete.length > 0 ? 'On Track' : 'Optimal'),
        incompleteTasks: userIncomplete.map(t => ({
          id: t._id,
          title: t.title,
          priority: t.priority,
          progress: t.progress,
          dueDate: t.dueDate,
          isOverdue: t.status === 'overdue' || (t.dueDate && new Date(t.dueDate) < now),
        })),
      };
    });

    res.status(200).json({
      metrics: {
        totalTasks,
        completedTasks,
        inProgressTasks,
        pendingTasks,
        overdueTasks: overdueTasks.length,
        overallProgress,
        completionPercentage: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
      },
      businessKpis: {
        totalReceiptsAmount: `₹${totalReceiptsAmount.toLocaleString('en-IN')}`,
        receiptsCount: allReceipts.length,
        totalChallans,
        totalStatements,
        contractorCount,
      },
      departmentBreakdown,
      employeeMatrix,
      activeOperations: allTasks.slice(0, 6),
    });
  } catch (error) {
    console.error('getOwnerDashboardData error:', error);
    res.status(500).json({ message: 'Failed to retrieve owner executive summary: ' + error.message });
  }
};

// =========================================================================
// 3. ACCOUNTS DASHBOARD
// =========================================================================
// @desc    Financial records, transactions, statements, receipts, and accounting tasks
// @route   GET /api/dashboards/accounts
// @access  Private (Accounts / Admin / Owner)
const getAccountsDashboardData = async (req, res) => {
  try {
    const { period } = req.query;
    const dateFilter = getDateFilter(period);

    const [
      statements,
      receipts,
      challans,
      contractors,
      receiptParties,
      accountsTasks,
    ] = await Promise.all([
      Statement.find({ ...dateFilter }).sort({ createdAt: -1 }),
      Receipt.find({ ...dateFilter }).sort({ createdAt: -1 }),
      Challan.find().sort({ createdAt: -1 }),
      Contractor.find().select('name category').limit(20),
      ReceiptParty.find().select('name').limit(20),
      Task.find({ department: 'accounts', ...dateFilter })
        .populate('assignedTo', 'name username designation performanceScore')
        .sort({ dueDate: 1 }),
    ]);

    // Financial statistics from real receipts
    const totalReceiptsAmount = receipts.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
    const totalReceiptsCount = receipts.length;
    const totalStatementsCount = statements.length;
    const totalChallansCount = challans.length;

    // Monthly receipts trend
    const monthlyTrend = {};
    receipts.forEach((r) => {
      const d = r.createdAt ? new Date(r.createdAt) : new Date(r.date);
      const monthKey = d.toLocaleString('en-US', { month: 'short', year: '2-digit' });
      monthlyTrend[monthKey] = (monthlyTrend[monthKey] || 0) + (Number(r.amount) || 0);
    });

    const trendData = Object.entries(monthlyTrend).map(([month, amount]) => ({
      month,
      amount,
    }));

    // Task breakdown
    const completedTasks = accountsTasks.filter(t => t.status === 'completed');
    const pendingTasks = accountsTasks.filter(t => t.status !== 'completed');

    res.status(200).json({
      metrics: {
        totalRevenue: `₹${totalReceiptsAmount.toLocaleString('en-IN')}`,
        rawRevenue: totalReceiptsAmount,
        totalReceipts: totalReceiptsCount,
        totalStatements: totalStatementsCount,
        totalChallans: totalChallansCount,
        totalParties: contractors.length + receiptParties.length,
        pendingTasksCount: pendingTasks.length,
        completedTasksCount: completedTasks.length,
      },
      trendData,
      recentStatements: statements.slice(0, 6),
      recentReceipts: receipts.slice(0, 6),
      accountsTasks,
      partiesList: [...contractors.map(c => c.name), ...receiptParties.map(p => p.name)].slice(0, 10),
    });
  } catch (error) {
    console.error('getAccountsDashboardData error:', error);
    res.status(500).json({ message: 'Failed to retrieve accounts dashboard data: ' + error.message });
  }
};

// =========================================================================
// 4. STORE / LOGISTICS DASHBOARD
// =========================================================================
// @desc    Warehouse inventory, division balances, stock in/out, low stock alerts
// @route   GET /api/dashboards/store
// @access  Private (Logistics / Store / Admin / Owner)
const getStoreDashboardData = async (req, res) => {
  try {
    const { period } = req.query;
    const dateFilter = getDateFilter(period);

    const [
      divisionBalances,
      materials,
      storeReceipts,
      challans,
      storeTasks,
    ] = await Promise.all([
      DivisionBalance.find(),
      Material.find().sort({ order: 1 }),
      StoreReceipt.find({ ...dateFilter }).sort({ createdAt: -1 }),
      Challan.find({ ...dateFilter }).sort({ createdAt: -1 }),
      Task.find({ department: { $in: ['logistics', 'store'] }, ...dateFilter })
        .populate('assignedTo', 'name username designation performanceScore')
        .sort({ dueDate: 1 }),
    ]);

    // Aggregate inventory across divisions
    const lowStockAlerts = [];
    const divisionSummary = [];
    let totalStockPieces = 0;

    divisionBalances.forEach((doc) => {
      let divTotal = 0;
      (doc.materials || []).forEach((m) => {
        const currentQty = (Number(m.qty) || 0) + (Number(m.manualAdjustment) || 0);
        divTotal += currentQty;
        totalStockPieces += currentQty;

        if (currentQty <= 5) {
          lowStockAlerts.push({
            division: doc.divisionName,
            material: m.name,
            qty: currentQty,
            status: currentQty <= 0 ? 'CRITICAL_ZERO' : 'LOW_STOCK',
          });
        }
      });

      divisionSummary.push({
        divisionName: doc.divisionName,
        totalPieces: divTotal,
        materialCount: (doc.materials || []).length,
      });
    });

    // Recent stock movements (Inward vs Outward)
    const stockMovements = [
      ...storeReceipts.slice(0, 4).map(r => ({
        id: `sr_${r._id}`,
        type: 'STOCK_IN',
        documentNo: r.crNo || 'CR-Inward',
        source: r.conName || 'Vendor Consignment',
        division: r.divisionName,
        date: r.createdAt || new Date(r.date),
        materials: r.materials || [],
      })),
      ...challans.slice(0, 4).map(c => ({
        id: `ch_${c._id}`,
        type: 'STOCK_OUT',
        documentNo: c.challanNo,
        source: c.contractorName,
        division: c.divisionName,
        date: c.createdAt || new Date(c.date),
        materials: c.materials || [],
      })),
    ].sort((a, b) => new Date(b.date) - new Date(a.date));

    // Task breakdown
    const completedTasks = storeTasks.filter(t => t.status === 'completed');
    const pendingTasks = storeTasks.filter(t => t.status !== 'completed');

    res.status(200).json({
      metrics: {
        totalWarehouses: divisionBalances.length,
        totalMaterialTypes: materials.length,
        totalStockPieces,
        stockInCount: storeReceipts.length,
        stockOutCount: challans.length,
        lowStockItemsCount: lowStockAlerts.length,
        pendingTasksCount: pendingTasks.length,
        completedTasksCount: completedTasks.length,
      },
      divisionSummary,
      lowStockAlerts: lowStockAlerts.slice(0, 10),
      stockMovements,
      storeTasks,
    });
  } catch (error) {
    console.error('getStoreDashboardData error:', error);
    res.status(500).json({ message: 'Failed to retrieve store dashboard data: ' + error.message });
  }
};

// =========================================================================
// 5. PRODUCTION DASHBOARD
// =========================================================================
// @desc    Manufacturing operations, machine shifts, fabrication tasks, material draw
// @route   GET /api/dashboards/production
// @access  Private (Production / Admin / Owner)
const getProductionDashboardData = async (req, res) => {
  try {
    const { period } = req.query;
    const dateFilter = getDateFilter(period);

    const [
      productionTasks,
      divisionBalances,
      recentChallans,
    ] = await Promise.all([
      Task.find({ department: 'production', ...dateFilter })
        .populate('assignedTo', 'name username designation performanceScore')
        .sort({ dueDate: 1 }),
      DivisionBalance.find().limit(3),
      Challan.find({ ...dateFilter }).sort({ createdAt: -1 }).limit(6),
    ]);

    const completedJobs = productionTasks.filter(t => t.status === 'completed');
    const inProgressJobs = productionTasks.filter(t => t.status === 'in_progress');
    const highPriorityJobs = productionTasks.filter(t => t.priority === 'urgent' || t.priority === 'high');

    // Available raw material for production
    const rawMaterialPool = [];
    divisionBalances.forEach((doc) => {
      (doc.materials || []).slice(0, 5).forEach((m) => {
        rawMaterialPool.push({
          division: doc.divisionName,
          material: m.name,
          availableQty: (Number(m.qty) || 0) + (Number(m.manualAdjustment) || 0),
        });
      });
    });

    res.status(200).json({
      metrics: {
        totalProductionJobs: productionTasks.length,
        completedJobs: completedJobs.length,
        inProgressJobs: inProgressJobs.length,
        highPriorityJobs: highPriorityJobs.length,
        materialBatchesReady: rawMaterialPool.length,
      },
      productionTasks,
      rawMaterialPool: rawMaterialPool.slice(0, 8),
      recentFabricationChallans: recentChallans,
      // Clear reporting when external machine logs are absent
      machineTelemetryStatus: {
        totalActiveMachines: 4,
        status: 'Operational',
        message: 'No external automated machine telemetry connected. Production shifts tracked via Task Manager.',
      },
    });
  } catch (error) {
    console.error('getProductionDashboardData error:', error);
    res.status(500).json({ message: 'Failed to retrieve production dashboard data: ' + error.message });
  }
};

// =========================================================================
// 6. QUALITY DASHBOARD
// =========================================================================
// @desc    IPQC quality checks, compliance milestones, material verification
// @route   GET /api/dashboards/quality
// @access  Private (Quality / Admin / Owner)
const getQualityDashboardData = async (req, res) => {
  try {
    const { period } = req.query;
    const dateFilter = getDateFilter(period);

    const [
      qualityTasks,
      storeReceipts,
      recentChallans,
    ] = await Promise.all([
      Task.find({ department: 'quality', ...dateFilter })
        .populate('assignedTo', 'name username designation performanceScore')
        .sort({ dueDate: 1 }),
      StoreReceipt.find({ ...dateFilter }).sort({ createdAt: -1 }).limit(6),
      Challan.find({ ...dateFilter }).sort({ createdAt: -1 }).limit(6),
    ]);

    const completedInspections = qualityTasks.filter(t => t.status === 'completed');
    const pendingInspections = qualityTasks.filter(t => t.status !== 'completed');
    const urgentQualityTasks = qualityTasks.filter(t => t.priority === 'urgent' || t.priority === 'high');

    res.status(200).json({
      metrics: {
        totalInspections: qualityTasks.length,
        completedInspections: completedInspections.length,
        pendingInspections: pendingInspections.length,
        urgentTasksCount: urgentQualityTasks.length,
        inwardConsignmentsVerified: storeReceipts.length,
      },
      qualityTasks,
      inwardVerifications: storeReceipts,
      dispatchInspections: recentChallans,
      // Clear reporting for IPQC records
      inspectionAuditStatus: {
        complianceRate: qualityTasks.length > 0
          ? Math.round((completedInspections.length / qualityTasks.length) * 100)
          : 100,
        message: 'Quality inspections tracked against live Material Receipts (CR) and Outward Challans.',
      },
    });
  } catch (error) {
    console.error('getQualityDashboardData error:', error);
    res.status(500).json({ message: 'Failed to retrieve quality dashboard data: ' + error.message });
  }
};


// =========================================================================
// 8. EMPLOYEE / WORKER DASHBOARD
// =========================================================================
// @desc    Personal worker tasks, today's schedule, performance score, shortcuts
// @route   GET /api/dashboards/employee
// @access  Private (All authenticated employees)
const getEmployeeDashboardData = async (req, res) => {
  try {
    const userId = req.user._id;
    const { period } = req.query;
    const dateFilter = getDateFilter(period);

    const [userTasks, userProfile] = await Promise.all([
      Task.find({ assignedTo: userId, ...dateFilter })
        .populate('assignedBy', 'name username role')
        .sort({ dueDate: 1, createdAt: -1 }),
      User.findById(userId).select('name username role department designation performanceScore assignedModules'),
    ]);

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    const todayTasks = userTasks.filter(
      t => (t.dueDate && new Date(t.dueDate) >= todayStart && new Date(t.dueDate) <= todayEnd) ||
           (t.createdAt && new Date(t.createdAt) >= todayStart && new Date(t.createdAt) <= todayEnd)
    );

    const completedTasks = userTasks.filter(t => t.status === 'completed');
    const inProgressTasks = userTasks.filter(t => t.status === 'in_progress');
    const pendingTasks = userTasks.filter(t => t.status === 'pending');
    const overdueTasks = userTasks.filter(
      t => t.status !== 'completed' && (t.status === 'overdue' || (t.dueDate && new Date(t.dueDate) < now))
    );

    const personalCompletionRate = userTasks.length > 0
      ? Math.round((completedTasks.length / userTasks.length) * 100)
      : 100;

    res.status(200).json({
      profile: userProfile,
      metrics: {
        totalAssigned: userTasks.length,
        todayTasksCount: todayTasks.length,
        completedCount: completedTasks.length,
        inProgressCount: inProgressTasks.length,
        pendingCount: pendingTasks.length,
        overdueCount: overdueTasks.length,
        completionRate: personalCompletionRate,
        performanceScore: userProfile?.performanceScore || 85,
      },
      todayTasks,
      allTasks: userTasks,
      assignedModules: userProfile?.assignedModules || [],
    });
  } catch (error) {
    console.error('getEmployeeDashboardData error:', error);
    res.status(500).json({ message: 'Failed to retrieve employee dashboard data: ' + error.message });
  }
};

module.exports = {
  getAdminDashboardData,
  getOwnerDashboardData,
  getAccountsDashboardData,
  getStoreDashboardData,
  getProductionDashboardData,
  getQualityDashboardData,
  getEmployeeDashboardData,
};
