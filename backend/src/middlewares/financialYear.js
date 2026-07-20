module.exports = (req, res, next) => {
  const fy = req.headers['x-financial-year'];
  // If not provided, we could default to '2025-26' or throw an error.
  // For safety during migration, default to '2025-26' if missing, 
  // but ideally the frontend should always send it.
  req.financialYear = fy || '2025-26';
  if (req.method === 'POST' || req.method === 'PUT') {
    if (!req.body) req.body = {};
    req.body.financialYear = req.financialYear;
  }
  next();
};
