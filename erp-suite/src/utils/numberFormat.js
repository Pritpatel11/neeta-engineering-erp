export const formatIndianNumber = (num) => {
  if (num === null || num === undefined || isNaN(num)) return '0.00';
  return new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(num));
};
