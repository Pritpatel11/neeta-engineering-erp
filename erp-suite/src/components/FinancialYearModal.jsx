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
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}>
        <div style={{ backgroundColor: '#fff', padding: '30px', borderRadius: '12px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ border: '4px solid #f3f3f3', borderTop: '4px solid #4f46e5', borderRadius: '50%', width: '40px', height: '40px', animation: 'spin 1s linear infinite', marginBottom: '15px' }} />
          <p style={{ color: '#4b5563', fontWeight: 500 }}>Loading Financial Years...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', padding: '20px' }}>
      <div style={{ backgroundColor: '#fff', borderRadius: '16px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', width: '100%', maxWidth: '400px', overflow: 'hidden' }}>
        <div style={{ background: 'linear-gradient(to right, #4f46e5, #9333ea)', padding: '24px', textAlign: 'center' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#fff', margin: '0 0 8px 0' }}>Select Financial Year</h2>
          <p style={{ color: '#e0e7ff', fontSize: '14px', margin: 0 }}>Please select the operating year to continue</p>
        </div>
        
        <form onSubmit={handleSelect} style={{ padding: '32px' }}>
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', color: '#374151', fontSize: '14px', fontWeight: 'bold', marginBottom: '12px' }} htmlFor="yearSelect">
              Financial Year
            </label>
            <div style={{ position: 'relative' }}>
              <select
                id="yearSelect"
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                style={{ appearance: 'none', width: '100%', backgroundColor: '#f9fafb', border: '1px solid #d1d5db', color: '#111827', padding: '12px 16px', paddingRight: '40px', borderRadius: '8px', fontSize: '18px', fontWeight: 500, outline: 'none', cursor: 'pointer' }}
                required
              >
                {years.map((y) => (
                  <option key={y._id || y.year} value={y.year}>
                    {y.year}
                  </option>
                ))}
              </select>
              <div style={{ pointerEvents: 'none', position: 'absolute', top: 0, bottom: 0, right: 0, display: 'flex', alignItems: 'center', padding: '0 16px', color: '#4b5563' }}>
                <svg style={{ fill: 'currentColor', height: '20px', width: '20px' }} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                  <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                </svg>
              </div>
            </div>
          </div>
          
          <button
            type="submit"
            disabled={!selectedYear}
            style={{ width: '100%', background: 'linear-gradient(to right, #4f46e5, #9333ea)', color: '#fff', fontWeight: 'bold', padding: '14px 20px', borderRadius: '8px', border: 'none', cursor: selectedYear ? 'pointer' : 'not-allowed', opacity: selectedYear ? 1 : 0.5, fontSize: '16px', transition: 'all 0.2s', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
          >
            Continue to Dashboard
          </button>
        </form>
      </div>
    </div>
  );
};

export default FinancialYearModal;
