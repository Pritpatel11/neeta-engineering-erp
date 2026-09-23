const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const {
  getAdminDashboardData,
  getOwnerDashboardData,
  getAccountsDashboardData,
  getStoreDashboardData,
  getProductionDashboardData,
  getQualityDashboardData,
  getEmployeeDashboardData,
} = require('../controllers/dashboardController');

// All dashboard endpoints require authentication
router.use(protect);

// Role & Department Authorization Middleware
const requireAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') return next();
  return res.status(403).json({ message: 'Access denied: Administrator privileges required' });
};

const requireOwnerOrAdmin = (req, res, next) => {
  if (req.user && (req.user.role === 'owner' || req.user.role === 'admin')) return next();
  return res.status(403).json({ message: 'Access denied: Executive Owner privileges required' });
};

const requireDeptOrAdmin = (allowedDepts, modulePath) => {
  return (req, res, next) => {
    const user = req.user;
    if (!user) return res.status(401).json({ message: 'Not authorized' });

    // Admin & Owner have global overview rights
    if (user.role === 'admin' || user.role === 'owner') return next();

    // Department match
    if (user.department === 'all' || allowedDepts.includes(user.department)) return next();

    // Explicit module assignment match
    if (
      Array.isArray(user.assignedModules) &&
      (user.assignedModules.includes(modulePath) || user.assignedModules.includes('*'))
    ) {
      return next();
    }

    return res.status(403).json({
      message: `Access denied: You do not have authorization to view the ${allowedDepts[0]} dashboard.`,
    });
  };
};

// 1. Admin Dashboard Route
router.get('/admin', requireAdmin, getAdminDashboardData);

// 2. Owner Dashboard Route
router.get('/owner', requireOwnerOrAdmin, getOwnerDashboardData);

// 3. Accounts Dashboard Route
router.get('/accounts', requireDeptOrAdmin(['accounts'], '/dashboard/accounts'), getAccountsDashboardData);

// 4. Store / Logistics Dashboard Route
router.get('/store', requireDeptOrAdmin(['logistics', 'store'], '/dashboard/store'), getStoreDashboardData);

// 5. Production Dashboard Route
router.get('/production', requireDeptOrAdmin(['production'], '/dashboard/production'), getProductionDashboardData);

// 6. Quality Dashboard Route
router.get('/quality', requireDeptOrAdmin(['quality'], '/dashboard/quality'), getQualityDashboardData);


// 7. Personal Employee / Worker Dashboard Route
router.get('/employee', getEmployeeDashboardData);

module.exports = router;
