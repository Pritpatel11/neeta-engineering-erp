const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  // 1. Check for MCP API Key Gateway Header
  const mcpKey = req.headers['x-mcp-api-key'];
  const expectedKey = process.env.ERP_MCP_API_KEY || 'neeta_erp_mcp_secure_key_2026';
  if (mcpKey && mcpKey === expectedKey) {
    req.user = {
      _id: '000000000000000000000001',
      username: 'mcp-service',
      name: 'Claude MCP Bridge',
      role: 'admin',
      department: 'all',
      assignedModules: ['*'],
      isActive: true,
    };
    req.isMcp = true;
    return next();
  }

  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.query && req.query.token) {
    token = req.query.token;
  }

  if (token) {
    try {
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'erp_super_secret_jwt_key_2026'
      );

      req.user = await User.findById(decoded.id).select('-password');
      if (!req.user || !req.user.isActive) {
        return res.status(401).json({ message: 'User not found or inactive' });
      }

      return next();
    } catch (error) {
      console.error('JWT Auth Error:', error.message);
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  return res.status(401).json({ message: 'Not authorized, no token provided' });
};

/**
 * Require admin or owner
 */
const requireOwnerOrAdmin = (req, res, next) => {
  if (req.user && (req.user.role === 'owner' || req.user.role === 'admin')) return next();
  return res.status(403).json({ message: 'Access denied: Owner or Administrator privileges required' });
};

/**
 * Require admin only
 */
const requireAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') return next();
  return res.status(403).json({ message: 'Access denied: Administrator privileges required' });
};

module.exports = { protect, requireOwnerOrAdmin, requireAdmin };

