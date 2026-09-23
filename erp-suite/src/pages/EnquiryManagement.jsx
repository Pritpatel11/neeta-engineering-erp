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
      case 'Pending': return 'bg-amber-100 text-amber-800 border border-amber-300';
      case 'Contacted': return 'bg-blue-100 text-blue-800 border border-blue-300';
      case 'Converted': return 'bg-emerald-100 text-emerald-800 border border-emerald-300';
      case 'Rejected': return 'bg-rose-100 text-rose-800 border border-rose-300';
      default: return 'bg-slate-100 text-slate-700 border border-slate-200';
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1400px] mx-auto space-y-6">
      {/* Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 sm:p-6 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Website Enquiries</h1>
          <p className="text-sm text-slate-500 mt-1">Manage leads directly synced from your Google Sheets</p>
        </div>
        <button 
          onClick={handleSync} 
          disabled={isSyncing}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#0059bb] hover:bg-[#004899] active:bg-[#003c82] disabled:opacity-50 text-white text-sm font-semibold rounded-xl shadow-xs transition-all cursor-pointer"
        >
          <RefreshCw size={18} className={isSyncing ? "animate-spin" : ""} />
          {isSyncing ? 'Syncing...' : 'Sync from Google Sheets'}
        </button>
      </div>

      {/* Filters Card */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-4 p-5 sm:p-6 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex flex-col gap-1.5 flex-1 sm:max-w-xs">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Search Enquiries</label>
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input 
              type="text" 
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0059bb]/20 focus:border-[#0059bb] transition-all"
              placeholder="Name, Phone, Email, Subject..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5 sm:w-48">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Status Filter</label>
          <select 
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0059bb]/20 focus:border-[#0059bb] transition-all cursor-pointer"
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

      {/* Enquiries Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="text-center py-12 text-slate-500 text-sm">Loading enquiries...</div>
        ) : filteredEnquiries.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-sm">No enquiries found. Click 'Sync' to fetch from website.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider w-[12%]">Date & Time</th>
                <th className="px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider w-[18%]">Client Name</th>
                <th className="px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider w-[15%]">Contact Info</th>
                <th className="px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider w-[35%]">Subject & Message</th>
                <th className="px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider w-[10%]">Status</th>
                <th className="px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider w-[10%] text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {currentRecords.map((enq) => (
                <tr key={enq._id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-5 py-4 align-top">
                    <div className="flex flex-col gap-1">
                      <span className="text-xs font-medium text-slate-800 flex items-center gap-1.5">
                        <Calendar size={13} className="text-slate-400" /> {enq.date}
                      </span>
                      <span className="text-xs text-slate-500 flex items-center gap-1.5">
                        <Clock size={13} className="text-slate-400" /> {enq.time}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-4 align-top">
                    <div className="font-semibold text-sm text-slate-900">{enq.name}</div>
                  </td>
                  <td className="px-5 py-4 align-top">
                    <div className="flex flex-col gap-1 text-xs">
                      {enq.phone && (
                        <span className="flex items-center gap-1.5 text-[#0059bb]">
                          <Phone size={12} /> {enq.phone}
                        </span>
                      )}
                      {enq.email && (
                        <span className="flex items-center gap-1.5 text-slate-500 truncate max-w-[200px]" title={enq.email}>
                          <Mail size={12} /> {enq.email}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-4 align-top">
                    <div className="flex flex-col gap-1">
                      {enq.subject && <span className="font-semibold text-xs text-slate-900">{enq.subject}</span>}
                      {enq.message && <span className="text-xs text-slate-600 whitespace-pre-wrap leading-relaxed">{enq.message}</span>}
                    </div>
                  </td>
                  <td className="px-5 py-4 align-top">
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${getStatusBadgeClass(enq.status)}`}>
                      {enq.status || 'Pending'}
                    </span>
                  </td>
                  <td className="px-5 py-4 align-top">
                    <div className="flex items-center gap-2 justify-center">
                      <select 
                        className="px-2 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#0059bb]"
                        value={enq.status}
                        onChange={(e) => handleStatusChange(enq._id, e.target.value)}
                      >
                        <option value="Pending">Pending</option>
                        <option value="Contacted">Contacted</option>
                        <option value="Converted">Converted</option>
                        <option value="Rejected">Rejected</option>
                      </select>
                      <button 
                        className="p-1.5 text-[#0059bb] hover:text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors cursor-pointer"
                        title="Create Quotation"
                        onClick={() => navigate('/create-quotation', { state: { enquiryData: enq } })}
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
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs text-sm">
          <div className="text-xs text-slate-500">
            Showing <span className="font-semibold text-slate-700">{indexOfFirstRecord + 1}</span> to <span className="font-semibold text-slate-700">{Math.min(indexOfLastRecord, filteredEnquiries.length)}</span> of <span className="font-semibold text-slate-700">{filteredEnquiries.length}</span> records
          </div>
          <div className="flex items-center gap-2">
            <button 
              className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              Previous
            </button>
            <span className="px-3 py-1.5 text-xs font-semibold text-slate-700">
              Page {currentPage} of {totalPages}
            </span>
            <button 
              className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
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
