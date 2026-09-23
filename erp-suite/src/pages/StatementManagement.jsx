import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FileText, 
  Search, 
  Trash2, 
  Eye, 
  Plus, 
  Building2, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  X, 
  Edit3, 
  ChevronLeft, 
  ChevronRight,
  RotateCcw
} from 'lucide-react';
import { getStatements, deleteStatement, updateStatement } from '../services/api';
import { TableWrapper, Button, EmptyState } from '../components/ui';

export default function StatementManagement() {
  const [statements, setStatements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDivision, setSelectedDivision] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');

  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 12;

  const navigate = useNavigate();

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedDivision, selectedStatus]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const fetchedStatements = await getStatements();
        setStatements(Array.isArray(fetchedStatements) ? fetchedStatements : []);
      } catch (error) {
        console.error('Failed to fetch statements:', error);
      } finally {
        setLoading(false);
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
      setStatements(prev => prev.map(s => s._id === id ? { ...s, status: newStatus } : s));
    } catch (error) {
      console.error('Failed to update status:', error);
      alert('Failed to update status.');
    }
  };

  const handleDelete = async (id, statementNo) => {
    if (window.confirm(`Are you sure you want to delete Statement No: ${statementNo}?`)) {
      try {
        await deleteStatement(id);
        setStatements(prev => prev.map(s => s._id === id ? null : s).filter(Boolean));
      } catch (error) {
        console.error('Failed to delete statement:', error);
        alert('Failed to delete statement.');
      }
    }
  };

  const resetFilters = () => {
    setSearchTerm('');
    setSelectedDivision('All');
    setSelectedStatus('All');
  };

  const divisionsList = [...new Set(statements.map(s => s.divisionName).filter(Boolean))];

  const filteredStatements = statements.filter(s => {
    const term = searchTerm.trim().toLowerCase();
    const matchesSearch = 
      !term ||
      s.statementNo?.toString().toLowerCase().includes(term) || 
      s.contractorName?.toLowerCase().includes(term) ||
      s.divisionName?.toLowerCase().includes(term) ||
      s.date?.toLowerCase().includes(term);
      
    const matchesDivision = selectedDivision === 'All' || s.divisionName === selectedDivision;
    const matchesStatus = selectedStatus === 'All' || (s.status || 'Pending') === selectedStatus;
    
    return matchesSearch && matchesDivision && matchesStatus;
  });

  const totalStatements = statements.length;
  const pendingCount = statements.filter(s => (s.status || 'Pending') === 'Pending').length;
  const completedCount = statements.filter(s => s.status === 'Completed').length;

  const indexOfLastRecord = currentPage * recordsPerPage;
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
  const currentRecords = filteredStatements.slice(indexOfFirstRecord, indexOfLastRecord);
  const totalPages = Math.ceil(filteredStatements.length / recordsPerPage);

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-2 rounded-xl bg-blue-50 text-[#0059bb] border border-blue-100">
              <FileText size={22} />
            </span>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Statement Management</h1>
          </div>
          <p className="text-sm text-slate-500 ml-11">
            Manage, track, inspect, and export material requirement (MR) statements.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="primary" 
            icon={Plus} 
            onClick={() => navigate('/create-statement')}
            className="shadow-sm shadow-blue-500/20"
          >
            New Statement
          </Button>
        </div>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Total Statements</p>
            <h3 className="text-2xl font-bold text-slate-800">{totalStatements}</h3>
          </div>
          <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center text-[#0059bb]">
            <FileText size={22} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-amber-600 uppercase tracking-wider mb-1">Pending Approval</p>
            <h3 className="text-2xl font-bold text-amber-700">{pendingCount}</h3>
          </div>
          <div className="w-11 h-11 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
            <Clock size={22} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider mb-1">Completed</p>
            <h3 className="text-2xl font-bold text-emerald-700">{completedCount}</h3>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
            <CheckCircle2 size={22} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-purple-600 uppercase tracking-wider mb-1">Active Divisions</p>
            <h3 className="text-2xl font-bold text-purple-700">{divisionsList.length}</h3>
          </div>
          <div className="w-11 h-11 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
            <Building2 size={22} />
          </div>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-4 sm:p-6">
        {/* Controls and Search Toolbar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2.5">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              Saved Statements
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
              {filteredStatements.length} {filteredStatements.length === 1 ? 'record' : 'records'}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Division Filter */}
            <div className="relative min-w-[150px]">
              <select 
                className="w-full pl-3 pr-8 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0059bb]/20 focus:border-[#0059bb] transition-all cursor-pointer"
                value={selectedDivision} 
                onChange={(e) => setSelectedDivision(e.target.value)}
              >
                <option value="All">All Divisions</option>
                {divisionsList.map(div => (
                  <option key={div} value={div}>{div}</option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div className="relative min-w-[130px]">
              <select 
                className="w-full pl-3 pr-8 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0059bb]/20 focus:border-[#0059bb] transition-all cursor-pointer"
                value={selectedStatus} 
                onChange={(e) => setSelectedStatus(e.target.value)}
              >
                <option value="All">All Status</option>
                <option value="Pending">Pending</option>
                <option value="Completed">Completed</option>
              </select>
            </div>

            {/* Search Input with Icon and Clear Button */}
            <div className="relative flex-1 sm:w-64 min-w-[220px]">
              <Search size={17} className="text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input 
                type="text" 
                placeholder="Search statements, parties, dates..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-9 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0059bb]/20 focus:border-[#0059bb] transition-all"
              />
              {searchTerm && (
                <button 
                  onClick={() => setSearchTerm('')} 
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  title="Clear search"
                >
                  <X size={15} />
                </button>
              )}
            </div>

            {/* Reset Filter Button */}
            {(searchTerm || selectedDivision !== 'All' || selectedStatus !== 'All') && (
              <button 
                onClick={resetFilters}
                className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors"
                title="Reset filters"
              >
                <RotateCcw size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Data Table */}
        {loading ? (
          <div className="py-16 text-center text-slate-500 flex flex-col items-center justify-center gap-3">
            <span className="w-8 h-8 border-3 border-[#0059bb] border-t-transparent rounded-full animate-spin" />
            <p className="text-sm font-medium">Loading statements...</p>
          </div>
        ) : filteredStatements.length === 0 ? (
          <EmptyState
            title={statements.length === 0 ? "No statements found" : "No matching statements"}
            description={statements.length === 0 
              ? "Create your first material requirement statement to get started." 
              : "Try adjusting your search terms or filters to find what you're looking for."}
            actionLabel={statements.length === 0 ? "New Statement" : "Reset Filters"}
            onAction={statements.length === 0 ? () => navigate('/create-statement') : resetFilters}
          />
        ) : (
          <TableWrapper minWidth="880px">
            <table className="w-full text-xs sm:text-sm text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80">
                  <th className="px-4 py-3 font-semibold text-xs text-slate-500 uppercase tracking-wider w-36">Statement No.</th>
                  <th className="px-4 py-3 font-semibold text-xs text-slate-500 uppercase tracking-wider w-32">Date</th>
                  <th className="px-4 py-3 font-semibold text-xs text-slate-500 uppercase tracking-wider">Contractor</th>
                  <th className="px-4 py-3 font-semibold text-xs text-slate-500 uppercase tracking-wider w-36">Division</th>
                  <th className="px-4 py-3 font-semibold text-xs text-slate-500 uppercase tracking-wider w-28 text-center">Items</th>
                  <th className="px-4 py-3 font-semibold text-xs text-slate-500 uppercase tracking-wider w-36 text-center">Status</th>
                  <th className="px-4 py-3 font-semibold text-xs text-slate-500 uppercase tracking-wider w-32 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {currentRecords.map((statement, idx) => {
                  const isCompleted = statement.status === 'Completed';
                  return (
                    <tr 
                      key={statement._id || statement.statementNo + idx} 
                      className="hover:bg-blue-50/40 transition-colors"
                    >
                      {/* Statement No. */}
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleView(statement)}
                          className="font-mono text-sm font-bold text-[#0059bb] hover:underline flex items-center gap-1.5 cursor-pointer"
                          title="Click to view & print"
                        >
                          {statement.statementNo}
                        </button>
                      </td>

                      {/* Date */}
                      <td className="px-4 py-3 text-slate-600 text-sm whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Calendar size={14} className="text-slate-400 shrink-0" />
                          <span>{statement.date || '-'}</span>
                        </div>
                      </td>

                      {/* Contractor */}
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-900 text-sm">
                          {statement.contractorName || '-'}
                        </div>
                      </td>

                      {/* Division */}
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                          {statement.divisionName || 'Deesa'}
                        </span>
                      </td>

                      {/* Total Items */}
                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-blue-50 text-[#0059bb] border border-blue-100 font-mono">
                          {statement.materials?.length || 0} types
                        </span>
                      </td>

                      {/* Status Selector */}
                      <td className="px-4 py-3 text-center">
                        <select
                          value={statement.status || 'Pending'}
                          onChange={(e) => handleStatusChange(statement._id, e.target.value)}
                          className={`text-xs font-semibold px-2.5 py-1 rounded-full border cursor-pointer outline-none transition-all ${
                            isCompleted
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                              : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                          }`}
                        >
                          <option value="Pending">Pending</option>
                          <option value="Completed">Completed</option>
                        </select>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button 
                            onClick={() => handleView(statement)}
                            title="Preview & Print"
                            className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                          >
                            <Eye size={17} />
                          </button>
                          <button 
                            onClick={() => handleEdit(statement)}
                            title="Edit Statement"
                            className="p-1.5 rounded-lg text-amber-600 hover:bg-amber-50 transition-colors cursor-pointer"
                          >
                            <Edit3 size={17} />
                          </button>
                          <button 
                            onClick={() => handleDelete(statement._id, statement.statementNo)}
                            title="Delete Statement"
                            className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          >
                            <Trash2 size={17} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </TableWrapper>
        )}

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-4 border-t border-slate-100 text-sm">
            <p className="text-slate-500">
              Showing <span className="font-semibold text-slate-700">{indexOfFirstRecord + 1}</span> to{' '}
              <span className="font-semibold text-slate-700">
                {Math.min(indexOfLastRecord, filteredStatements.length)}
              </span> of <span className="font-semibold text-slate-700">{filteredStatements.length}</span> statements
            </p>

            <div className="flex items-center gap-1.5">
              <button 
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                title="Previous Page"
              >
                <ChevronLeft size={16} />
              </button>

              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(page => {
                    return (
                      page === 1 ||
                      page === totalPages ||
                      Math.abs(page - currentPage) <= 1
                    );
                  })
                  .map((page, i, arr) => {
                    const prevPage = arr[i - 1];
                    return (
                      <React.Fragment key={page}>
                        {prevPage && page - prevPage > 1 && (
                          <span className="px-2 text-slate-400">...</span>
                        )}
                        <button
                          onClick={() => setCurrentPage(page)}
                          className={`w-8 h-8 rounded-lg text-xs font-semibold transition-all ${
                            currentPage === page
                              ? 'bg-[#0059bb] text-white shadow-sm'
                              : 'text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          {page}
                        </button>
                      </React.Fragment>
                    );
                  })}
              </div>

              <button 
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                title="Next Page"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
