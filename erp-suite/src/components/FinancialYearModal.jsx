import React, { useState, useEffect } from 'react';
import { getFinancialYears } from '../services/api';

const FinancialYearModal = ({ onSelectYear }) => {
  const [years, setYears] = useState([]);
  const [selectedYear, setSelectedYear] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchYears();
  }, []);

  const fetchYears = async () => {
    try {
      setLoading(true);
      const data = await getFinancialYears();
      setYears(data);
      if (data.length > 0) {
        // Find current year or default to first
        const currentYear = new Date().getFullYear();
        const nextYear = currentYear + 1;
        const currentYearString = `${currentYear}-${nextYear.toString().slice(-2)}`;
        
        const match = data.find(y => y.year === currentYearString);
        if (match) setSelectedYear(match.year);
        else setSelectedYear(data[data.length - 1].year); // usually the latest
      } else {
        setYears([{ year: '2025-26' }]);
        setSelectedYear('2025-26');
      }
    } catch (err) {
      console.error('Error fetching financial years', err);
      // Fallback
      setYears([{ year: '2025-26' }]);
      setSelectedYear('2025-26');
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (e) => {
    e.preventDefault();
    if (selectedYear) {
      onSelectYear(selectedYear);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs">
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-xl flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-3 border-slate-200 border-t-[#0059bb]" />
          <p className="text-sm font-semibold text-slate-600">Loading Financial Years...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-150">
        <div className="bg-linear-to-r from-[#004899] to-[#0059bb] px-6 py-6 text-center text-white">
          <h2 className="text-xl font-bold tracking-tight text-white">Select Financial Year</h2>
          <p className="text-blue-100 text-xs mt-1">Choose the operating financial year to proceed</p>
        </div>
        
        <form onSubmit={handleSelect} className="p-6 space-y-5">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2" htmlFor="yearSelect">
              Operating Year
            </label>
            <div className="relative">
              <select
                id="yearSelect"
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 pr-10 text-base font-semibold text-slate-900 focus:bg-white focus:border-[#0059bb] focus:ring-2 focus:ring-[#0059bb]/20 focus:outline-none transition-all cursor-pointer"
                required
              >
                {years.map((y) => (
                  <option key={y._id || y.year} value={y.year}>
                    {y.year}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3.5 text-slate-400">
                <svg className="w-5 h-5 fill-current" viewBox="0 0 20 20">
                  <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                </svg>
              </div>
            </div>
          </div>
          
          <button
            type="submit"
            disabled={!selectedYear}
            className="w-full py-3 px-4 rounded-xl bg-[#0059bb] hover:bg-[#004899] text-white font-semibold text-sm shadow-md shadow-blue-900/10 hover:shadow-lg transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Continue to Dashboard
          </button>
        </form>
      </div>
    </div>
  );
};

export default FinancialYearModal;
