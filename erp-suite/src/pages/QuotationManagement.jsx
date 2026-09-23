import React, { useState, useEffect } from 'react';
import { Plus, Search, Calendar, Printer, Edit, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getQuotations, deleteQuotation } from '../services/api';
import { Badge, Button, TableWrapper, EmptyState } from '../components/ui';

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

  const getStatusVariant = (status) => {
    switch(status) {
      case 'Draft': return 'neutral';
      case 'Sent': return 'warning';
      case 'Accepted': return 'success';
      case 'Rejected': return 'danger';
      default: return 'neutral';
    }
  };

  const filteredQuotations = quotations.filter(q => 
    (q.clientName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (q.quotationNo || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (q.subject || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs p-4 sm:p-6 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Quotations & Estimates</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">Create and manage professional estimates for clients</p>
        </div>
        <Button onClick={() => navigate('/create-quotation')}>
          <Plus size={18} /> Create New Quotation
        </Button>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs p-4">
        <div className="relative w-full max-w-sm">
          <Search size={18} className="absolute left-3 top-2.5 text-slate-400 pointer-events-none" />
          <input 
            type="text" 
            placeholder="Search by Client, Quo No, or Subject..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 text-sm rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0059bb]/20 focus:border-[#0059bb] transition-all"
          />
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="py-16 text-center text-slate-500">Loading quotations...</div>
        ) : filteredQuotations.length === 0 ? (
          <EmptyState 
            title="No quotations found" 
            description={searchTerm ? "No quotations match your search filter." : "Create your first estimate to get started."} 
            actionLabel="Create Quotation" 
            onAction={() => navigate('/create-quotation')} 
          />
        ) : (
          <TableWrapper minWidth="750px">
            <table className="w-full text-xs sm:text-sm text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80">
                  <th className="px-4 py-3 font-semibold text-xs text-slate-500 uppercase tracking-wider">Quo No & Date</th>
                  <th className="px-4 py-3 font-semibold text-xs text-slate-500 uppercase tracking-wider">Client Details</th>
                  <th className="px-4 py-3 font-semibold text-xs text-slate-500 uppercase tracking-wider">Subject</th>
                  <th className="px-4 py-3 font-semibold text-xs text-slate-500 uppercase tracking-wider text-right">Total Amount</th>
                  <th className="px-4 py-3 font-semibold text-xs text-slate-500 uppercase tracking-wider text-center">Status</th>
                  <th className="px-4 py-3 font-semibold text-xs text-slate-500 uppercase tracking-wider text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredQuotations.map(quo => (
                  <tr key={quo._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-900 mb-1">{quo.quotationNo}</div>
                      <div className="text-xs text-slate-500 flex items-center gap-1">
                        <Calendar size={12} /> {quo.date}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-900">{quo.clientName}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-slate-600">{quo.subject}</div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="font-bold text-[#0059bb] text-sm md:text-base">
                        ₹{(quo.totalAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </div>
                      {quo.taxPercentage > 0 && <div className="text-xs text-slate-400">Incl. {quo.taxPercentage}% Tax</div>}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Badge variant={getStatusVariant(quo.status)} dot>{quo.status}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2 justify-center">
                        <button 
                          className="p-1.5 text-[#0059bb] bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors cursor-pointer" 
                          title="Print PDF"
                          onClick={() => navigate('/quotation-preview', { state: { quotationData: quo } })}
                        >
                          <Printer size={16} />
                        </button>
                        <button 
                          className="p-1.5 text-amber-600 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors cursor-pointer" 
                          title="Edit Quotation"
                          onClick={() => navigate('/create-quotation', { state: { editData: quo } })}
                        >
                          <Edit size={16} />
                        </button>
                        <button 
                          className="p-1.5 text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors cursor-pointer" 
                          title="Delete"
                          onClick={() => handleDelete(quo._id)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrapper>
        )}
      </div>
    </div>
  );
}
