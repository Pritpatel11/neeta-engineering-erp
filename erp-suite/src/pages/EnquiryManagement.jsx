import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { RefreshCw, Search, Phone, Mail, Clock, Calendar, CheckCircle, Clock3, Ban, FileEdit, FileText } from 'lucide-react';
import { getEnquiries, syncEnquiries, updateEnquiry } from '../services/api';

export default function EnquiryManagement() {
  const navigate = useNavigate();
  const [enquiries, setEnquiries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 15;

  const fetchEnquiries = async () => {
    try {
      setIsLoading(true);
      const data = await getEnquiries();
      setEnquiries(data);
    } catch (error) {
      console.error('Error fetching enquiries:', error);
      alert('Failed to load enquiries. Please check backend connection.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEnquiries();
  }, []);

  const handleSync = async () => {
    try {
      setIsSyncing(true);
      const res = await syncEnquiries();
      alert(`Sync Complete! ${res.insertedCount} new enquiries added.`);
      fetchEnquiries();
    } catch (error) {
      console.error('Sync error:', error);
      alert('Failed to sync from Google Sheets.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await updateEnquiry(id, { status: newStatus });
      setEnquiries(enquiries.map(e => e._id === id ? { ...e, status: newStatus } : e));
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status.');
    }
  };

  // Filter Data
  const filteredEnquiries = enquiries.filter(enq => {
    const matchesSearch = 
      (enq.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (enq.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (enq.phone || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (enq.subject || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'All' || enq.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Pagination Logic
  const totalPages = Math.ceil(filteredEnquiries.length / recordsPerPage);
  const indexOfLastRecord = currentPage * recordsPerPage;
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
  const currentRecords = filteredEnquiries.slice(indexOfFirstRecord, indexOfLastRecord);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  const getStatusBadgeClass = (status) => {
    switch(status) {
      case 'Pending': return 'badge-warning';
      case 'Contacted': return 'badge-secondary';
      case 'Converted': return 'badge-success';
      case 'Rejected': return 'badge-error';
      default: return '';
    }
  };

  return (
    <div className="enquiry-container">
      <style>{`
        .enquiry-container {
          padding: 24px 32px;
          max-width: 1400px;
          margin: 0 auto;
        }
        .enquiry-header-card {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 24px;
          margin-bottom: 24px;
        }
        .enquiry-title {
          font-size: 24px;
          font-weight: 700;
          color: #1b2e4b;
          margin: 0 0 8px 0;
        }
        .enquiry-subtitle {
          color: #6c757d;
          font-size: 14px;
          margin: 0;
        }
        .enquiry-filters-card {
          display: flex;
          gap: 20px;
          padding: 20px 24px;
          margin-bottom: 24px;
          align-items: flex-end;
        }
        .filter-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .filter-label {
          font-size: 12px;
          font-weight: 600;
          color: #495057;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .filter-input, .filter-select {
          padding: 10px 16px;
          border: 1px solid #dee2e6;
          border-radius: 8px;
          font-size: 14px;
          color: #495057;
          background-color: #f8f9fa;
          transition: all 0.2s;
          outline: none;
        }
        .filter-input:focus, .filter-select:focus {
          border-color: #0d6efd;
          background-color: white;
          box-shadow: 0 0 0 3px rgba(13, 110, 253, 0.15);
        }
        .enquiry-table-card {
          background: white;
          border-radius: 12px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.05);
          overflow: hidden;
          margin-bottom: 24px;
        }
        .modern-table {
          width: 100%;
          border-collapse: collapse;
        }
        .modern-table th {
          background: #f8f9fa;
          padding: 16px 20px;
          text-align: left;
          font-size: 12px;
          font-weight: 600;
          color: #6c757d;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          border-bottom: 2px solid #dee2e6;
        }
        .modern-table td {
          padding: 16px 20px;
          border-bottom: 1px solid #f1f3f5;
          vertical-align: top;
        }
        .table-row-hover:hover {
          background-color: #f8f9fa;
        }
        .badge {
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          display: inline-block;
        }
        .badge-warning { background: #fff3cd; color: #856404; }
        .badge-secondary { background: #e2e3e5; color: #383d41; }
        .badge-success { background: #d4edda; color: #155724; }
        .badge-error { background: #f8d7da; color: #721c24; }
        .spin-icon { animation: spin 1s linear infinite; }
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}</style>

      <div className="enquiry-header-card glass-panel">
        <div>
          <h1 className="register-title">Website Enquiries</h1>
          <p className="register-subtitle">Manage leads directly from your Google Sheets</p>
        </div>
        <button 
          onClick={handleSync} 
          disabled={isSyncing}
          className="btn-primary"
        >
          <RefreshCw size={18} className={isSyncing ? "spin-icon" : ""} />
          {isSyncing ? 'Syncing...' : 'Sync from Google Sheets'}
        </button>
      </div>

      <div className="enquiry-filters-card glass-panel">
        <div className="filter-group">
          <label className="filter-label">Search Enquiries</label>
          <div style={{ position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '10px', color: '#6c757d' }} />
            <input 
              type="text" 
              className="filter-input"
              placeholder="Name, Phone, Email, Subject..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ paddingLeft: '36px', width: '300px' }}
            />
          </div>
        </div>

        <div className="filter-group">
          <label className="filter-label">Status Filter</label>
          <select 
            className="filter-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="All">All Status</option>
            <option value="Pending">Pending</option>
            <option value="Contacted">Contacted</option>
            <option value="Converted">Converted</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>
      </div>

      <div className="enquiry-table-card">
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#6c757d' }}>Loading enquiries...</div>
        ) : filteredEnquiries.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#6c757d' }}>No enquiries found. Click 'Sync' to fetch from website.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="modern-table" style={{ minWidth: '1100px' }}>
            <thead>
              <tr>
                <th style={{ width: '12%' }}>Date & Time</th>
                <th style={{ width: '18%' }}>Client Name</th>
                <th style={{ width: '15%' }}>Contact Info</th>
                <th style={{ width: '35%' }}>Subject & Message</th>
                <th style={{ width: '12%' }}>Status</th>
                <th style={{ width: '8%', textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentRecords.map((enq) => (
                <tr key={enq._id} className="table-row-hover">
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <span style={{ fontWeight: '500', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Calendar size={14} color="#6c757d" /> {enq.date}
                      </span>
                      <span style={{ fontSize: '12px', color: '#6c757d', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Clock size={14} color="#6c757d" /> {enq.time}
                      </span>
                    </div>
                  </td>
                  <td>
                    <div style={{ fontWeight: '600', color: '#1b2e4b' }}>{enq.name}</div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {enq.phone && (
                        <span style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Phone size={12} color="#0d6efd" /> {enq.phone}
                        </span>
                      )}
                      {enq.email && (
                        <span style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', color: '#6c757d' }}>
                          <Mail size={12} /> {enq.email}
                        </span>
                      )}
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {enq.subject && <span style={{ fontWeight: '600', fontSize: '13px' }}>{enq.subject}</span>}
                      {enq.message && <span style={{ fontSize: '13px', color: '#495057' }}>{enq.message}</span>}
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${getStatusBadgeClass(enq.status)}`}>
                      {enq.status || 'Pending'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                      <select 
                        className="filter-select"
                        style={{ padding: '4px', fontSize: '12px', height: 'auto' }}
                        value={enq.status}
                        onChange={(e) => handleStatusChange(enq._id, e.target.value)}
                      >
                        <option value="Pending">Pending</option>
                        <option value="Contacted">Contacted</option>
                        <option value="Converted">Converted</option>
                        <option value="Rejected">Rejected</option>
                      </select>
                      <button 
                        className="icon-btn-small" 
                        title="Create Quotation"
                        onClick={() => navigate('/create-quotation', { state: { enquiryData: enq } })}
                        style={{ color: '#0d6efd', background: 'rgba(13, 110, 253, 0.1)', padding: '6px', borderRadius: '4px', border: 'none', cursor: 'pointer' }}
                      >
                        <FileText size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="pagination-controls glass-panel" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 20px', marginTop: '20px' }}>
          <div style={{ fontSize: '14px', color: '#6c757d' }}>
            Showing {indexOfFirstRecord + 1} to {Math.min(indexOfLastRecord, filteredEnquiries.length)} of {filteredEnquiries.length} records
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              className="btn-outline" 
              style={{ padding: '6px 12px', fontSize: '13px' }}
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              Previous
            </button>
            <span style={{ padding: '6px 12px', fontSize: '14px', fontWeight: '500' }}>
              Page {currentPage} of {totalPages}
            </span>
            <button 
              className="btn-outline" 
              style={{ padding: '6px 12px', fontSize: '13px' }}
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
