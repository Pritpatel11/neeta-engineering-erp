import React, { useState, useEffect } from 'react';
import { Plus, Search, FileText, Calendar, Building, Printer, Edit, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getQuotations, deleteQuotation } from '../services/api';

export default function QuotationManagement() {
  const [quotations, setQuotations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  const fetchQuotations = async () => {
    try {
      setIsLoading(true);
      const data = await getQuotations();
      setQuotations(data);
    } catch (error) {
      console.error('Failed to fetch quotations', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchQuotations();
  }, []);

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this quotation?')) {
      try {
        await deleteQuotation(id);
        fetchQuotations();
      } catch (error) {
        alert('Failed to delete quotation');
      }
    }
  };



  const getStatusColor = (status) => {
    switch(status) {
      case 'Draft': return 'badge-secondary';
      case 'Sent': return 'badge-warning';
      case 'Accepted': return 'badge-success';
      case 'Rejected': return 'badge-error';
      default: return 'badge-secondary';
    }
  };

  const filteredQuotations = quotations.filter(q => 
    (q.clientName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (q.quotationNo || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (q.subject || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="module-container">
      <div className="module-header glass-panel">
        <div>
          <h1>Quotations & Estimates</h1>
          <p>Create and manage professional estimates for clients</p>
        </div>
        <button className="btn-primary" onClick={() => navigate('/create-quotation')}>
          <Plus size={20} /> Create New Quotation
        </button>
      </div>

      <div className="glass-panel" style={{ padding: '20px', marginBottom: '20px' }}>
        <div style={{ position: 'relative', width: '300px' }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '10px', color: '#6c757d' }} />
          <input 
            type="text" 
            placeholder="Search by Client, Quo No, or Subject..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ 
              width: '100%', padding: '10px 10px 10px 36px', 
              borderRadius: '8px', border: '1px solid #dee2e6' 
            }}
          />
        </div>
      </div>

      <div className="glass-panel" style={{ overflowX: 'auto', background: 'white' }}>
        {isLoading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#6c757d' }}>Loading...</div>
        ) : filteredQuotations.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#6c757d' }}>No quotations found. Create your first estimate!</div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Quo No & Date</th>
                <th>Client Details</th>
                <th>Subject</th>
                <th className="text-right">Total Amount</th>
                <th className="text-center">Status</th>
                <th className="text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredQuotations.map(quo => (
                <tr key={quo._id} className="table-row-hover">
                  <td>
                    <div style={{ fontWeight: '600', color: '#1b2e4b', marginBottom: '4px' }}>{quo.quotationNo}</div>
                    <div style={{ fontSize: '12px', color: '#6c757d', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Calendar size={12} /> {quo.date}
                    </div>
                  </td>
                  <td>
                    <div style={{ fontWeight: '600', color: '#1b2e4b' }}>{quo.clientName}</div>
                  </td>
                  <td>
                    <div style={{ fontSize: '13px', color: '#495057' }}>{quo.subject}</div>
                  </td>
                  <td className="text-right">
                    <div style={{ fontWeight: '700', color: '#0d6efd', fontSize: '15px' }}>
                      ₹{quo.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </div>
                    {quo.taxPercentage > 0 && <div style={{ fontSize: '11px', color: '#6c757d' }}>Incl. {quo.taxPercentage}% Tax</div>}
                  </td>
                  <td className="text-center">
                    <span className={`badge ${getStatusColor(quo.status)}`}>{quo.status}</span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                      <button 
                        className="icon-btn-small" 
                        title="Print PDF"
                        onClick={() => navigate('/quotation-preview', { state: { quotationData: quo } })}
                        style={{ color: '#0d6efd', background: 'rgba(13, 110, 253, 0.1)', padding: '6px', borderRadius: '4px', border: 'none', cursor: 'pointer' }}
                      >
                        <Printer size={16} />
                      </button>
                      <button 
                        className="icon-btn-small" 
                        title="Edit Quotation"
                        onClick={() => navigate('/create-quotation', { state: { editData: quo } })}
                        style={{ color: '#ffc107', background: 'rgba(255, 193, 7, 0.1)', padding: '6px', borderRadius: '4px', border: 'none', cursor: 'pointer' }}
                      >
                        <Edit size={16} />
                      </button>
                      <button 
                        className="icon-btn-small" 
                        title="Delete"
                        onClick={() => handleDelete(quo._id)}
                        style={{ color: '#dc3545', background: 'rgba(220, 53, 69, 0.1)', padding: '6px', borderRadius: '4px', border: 'none', cursor: 'pointer' }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>



      <style>{`
        .module-container { padding: 24px; max-width: 1400px; margin: 0 auto; }
        .module-header { display: flex; justify-content: space-between; align-items: center; padding: 24px; margin-bottom: 24px; }
        .module-header h1 { font-size: 24px; font-weight: 700; color: #1b2e4b; margin: 0 0 8px 0; }
        .module-header p { color: #6c757d; font-size: 14px; margin: 0; }
        .badge { padding: 6px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; display: inline-block; }
        .badge-warning { background: #fff3cd; color: #856404; }
        .badge-secondary { background: #e2e3e5; color: #383d41; }
        .badge-success { background: #d4edda; color: #155724; }
        .badge-error { background: #f8d7da; color: #721c24; }
      `}</style>
    </div>
  );
}
