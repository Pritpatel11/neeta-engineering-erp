module.exports = (req, res, next) => {
  const fy = req.headers['x-financial-year'];
  // If not provided, default to '2025-26'
  req.financialYear = fy || '2025-26';
  if (req.method === 'POST' || req.method === 'PUT') {
    if (!req.body) req.body = {};
    if (!req.body.financialYear) {
      req.body.financialYear = req.financialYear;
    }
  }
  next();
};

