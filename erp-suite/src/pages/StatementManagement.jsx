import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Search, Edit, Trash2, Eye, Plus } from 'lucide-react';
import { getStatements, deleteStatement, updateStatement } from '../services/api';

export default function StatementManagement() {
  const [statements, setStatements] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDivision, setSelectedDivision] = useState('All');

  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 15;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedDivision]);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const fetchedStatements = await getStatements();
        setStatements(fetchedStatements);
      } catch (error) {
        console.error('Failed to fetch statements:', error);
      }
    };
    fetchData();
  }, []);

  const handleView = (statementData) => {
    navigate('/statement-preview', { state: { statementData } });
  };

  const handleEdit = (statementData) => {
    navigate('/create-statement', { state: { statementData } });
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await updateStatement(id, { status: newStatus });
      setStatements(statements.map(s => s._id === id ? { ...s, status: newStatus } : s));
    } catch (error) {
      console.error('Failed to update status:', error);
      alert('Failed to update status.');
    }
  };

  const handleDelete = async (id, statementNo) => {
    if (window.confirm(`Are you sure you want to delete Statement No: ${statementNo}?`)) {
      try {
        await deleteStatement(id);
        setStatements(statements.filter(s => s._id !== id));
      } catch (error) {
        console.error('Failed to delete statement:', error);
        alert('Failed to delete statement.');
      }
    }
  };

  const filteredStatements = statements.filter(s => {
    const matchesSearch = 
      s.statementNo?.toString().includes(searchTerm) || 
      s.contractorName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.divisionName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.date?.includes(searchTerm);
      
    const matchesDivision = selectedDivision === 'All' || s.divisionName === selectedDivision;
    
    return matchesSearch && matchesDivision;
  });

  const indexOfLastRecord = currentPage * recordsPerPage;
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
  const currentRecords = filteredStatements.slice(indexOfFirstRecord, indexOfLastRecord);
  const totalPages = Math.ceil(filteredStatements.length / recordsPerPage);

  return (
    <div className="dashboard-container" style={{ paddingBottom: '40px' }}>
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">Statement Management</h1>
          <p className="dashboard-subtitle">Manage, view, and edit material requirement statements.</p>
        </div>
        <div className="dashboard-actions">
          <button className="btn-primary" onClick={() => navigate('/create-statement')}>
            <Plus size={18} /> New Statement
          </button>
        </div>
      </div>

      <div className="glass-card" style={{ padding: '24px' }}>
        <div className="section-header-flex" style={{ borderBottom: 'none', marginBottom: '24px' }}>
          <h2 className="section-title mb-0 border-0" style={{ padding: 0 }}>
            <FileText className="text-primary" size={20} />
            Saved Statements
          </h2>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <select 
              className="form-control" 
              value={selectedDivision} 
              onChange={(e) => setSelectedDivision(e.target.value)}
              style={{ width: '200px', background: 'var(--color-surface)', appearance: 'auto' }}
            >
              <option value="All">All Divisions</option>
              {[...new Set(statements.map(s => s.divisionName).filter(Boolean))].map(div => (
                <option key={div} value={div}>{div}</option>
              ))}
            </select>

            <div style={{ position: 'relative' }}>
              <Search size={18} className="text-muted" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input 
                type="text" 
                placeholder="Search by name, no, date..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="form-control"
                style={{ paddingLeft: '36px', width: '250px', background: 'var(--color-surface)' }}
              />
            </div>
          </div>
        </div>

        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Statement No.</th>
                <th>Date</th>
                <th>Contractor</th>
                <th>Division</th>
                <th className="text-right">Total Items</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredStatements.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center text-muted" style={{ padding: '32px' }}>
                    {statements.length === 0 
                      ? 'No statements found. Create your first material statement!' 
                      : 'No statements match your search.'}
                  </td>
                </tr>
              ) : (
                currentRecords.map((statement, idx) => (
                  <tr key={statement.statementNo + idx} className={idx % 2 === 1 ? 'bg-alt' : ''}>
                    <td className="font-mono text-primary font-medium">{statement.statementNo}</td>
                    <td>{statement.date}</td>
                    <td>{statement.contractorName}</td>
                    <td>{statement.divisionName}</td>
                    <td className="text-right font-mono">
                      {statement.materials?.length || 0} types
                    </td>
                    <td>
                      <select
                        className={`badge ${statement.status === 'Completed' ? 'badge-secondary' : 'badge-warning'}`}
                        value={statement.status || 'Pending'}
                        onChange={(e) => handleStatusChange(statement._id, e.target.value)}
                        style={{ border: 'none', cursor: 'pointer', outline: 'none' }}
                      >
                        <option value="Pending" style={{background: 'var(--color-surface)', color: 'var(--color-on-surface)'}}>Pending</option>
                        <option value="Completed" style={{background: 'var(--color-surface)', color: 'var(--color-on-surface)'}}>Completed</option>
                      </select>
                    </td>
                    <td className="text-right">
                      <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                        <button 
                          className="action-icon" 
                          onClick={() => handleView(statement)}
                          title="View & Print"
                          style={{ background: 'none', border: 'none' }}
                        >
                          <Eye size={18} />
                        </button>
                        <button 
                          className="action-icon text-primary" 
                          onClick={() => handleEdit(statement)}
                          title="Edit"
                          style={{ background: 'none', border: 'none' }}
                        >
                          <Edit size={18} />
                        </button>
                        <button 
                          className="action-icon text-error" 
                          onClick={() => handleDelete(statement._id, statement.statementNo)}
                          title="Delete"
                          style={{ background: 'none', border: 'none' }}
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '15px', marginTop: '20px' }}>
            <button 
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              style={{ padding: '8px 16px', border: '1px solid #ccc', background: currentPage === 1 ? '#f8f9fa' : 'white', borderRadius: '4px', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', color: currentPage === 1 ? '#adb5bd' : '#495057' }}
            >
              Previous
            </button>
            <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#495057' }}>
              Page {currentPage} of {totalPages}
            </span>
            <button 
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              style={{ padding: '8px 16px', border: '1px solid #ccc', background: currentPage === totalPages ? '#f8f9fa' : 'white', borderRadius: '4px', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', color: currentPage === totalPages ? '#adb5bd' : '#495057' }}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
