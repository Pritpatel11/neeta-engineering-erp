import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Plus, Trash2, Printer, Edit } from 'lucide-react';
import { getReceipts, deleteReceipt } from '../services/api';
import { TableWrapper, Button, EmptyState } from '../components/ui';

export default function ReceiptManagement() {
  const navigate = useNavigate();
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReceipts();
  }, []);

  const fetchReceipts = async () => {
    try {
      const data = await getReceipts();
      setReceipts(data);
    } catch (error) {
      console.error('Failed to fetch receipts:', error);
    }
    setLoading(false);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this receipt?')) {
      try {
        await deleteReceipt(id);
        fetchReceipts();
      } catch (error) {
        alert('Failed to delete receipt.');
      }
    }
  };

  const handlePrint = (receipt) => {
    navigate('/receipt-preview', { state: { receipt } });
  };

  const handleEdit = (receipt) => {
    navigate('/create-receipt', { state: { editReceipt: receipt } });
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      <header className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-2 m-0">
            <FileText size={28} className="text-[#0059bb]" /> Receipt Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 mb-0">View, print, and manage your saved payment receipts.</p>
        </div>
        <Button onClick={() => navigate('/create-receipt')}>
          <Plus size={18} /> Create New Receipt
        </Button>
      </header>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="text-center py-16 text-slate-500">Loading receipts...</div>
        ) : receipts.length === 0 ? (
          <EmptyState
            title="No receipts found"
            description="Create your first receipt to track payment incoming."
            actionLabel="Create Receipt"
            onAction={() => navigate('/create-receipt')}
          />
        ) : (
          <TableWrapper minWidth="700px">
            <table className="w-full text-xs sm:text-sm text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80">
                  <th className="px-4 py-3 font-semibold text-xs text-slate-500 uppercase tracking-wider">Receipt No</th>
                  <th className="px-4 py-3 font-semibold text-xs text-slate-500 uppercase tracking-wider">Date</th>
                  <th className="px-4 py-3 font-semibold text-xs text-slate-500 uppercase tracking-wider">Party Name</th>
                  <th className="px-4 py-3 font-semibold text-xs text-slate-500 uppercase tracking-wider">Bill No</th>
                  <th className="px-4 py-3 font-semibold text-xs text-slate-500 uppercase tracking-wider text-right">Amount (₹)</th>
                  <th className="px-4 py-3 font-semibold text-xs text-slate-500 uppercase tracking-wider text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {receipts.map((receipt) => (
                  <tr key={receipt._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3 font-semibold text-[#0059bb] font-mono">{receipt.receiptNo}</td>
                    <td className="px-4 py-3 text-slate-600">{receipt.date}</td>
                    <td className="px-4 py-3 font-medium text-slate-900">{receipt.partyName}</td>
                    <td className="px-4 py-3 text-slate-600">{receipt.billNo || '-'}</td>
                    <td className="px-4 py-3 text-right font-bold text-slate-900">
                      ₹{(receipt.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex gap-2 justify-center">
                        <button 
                          onClick={() => handlePrint(receipt)} 
                          className="p-1.5 text-[#0059bb] bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors cursor-pointer" 
                          title="Print Receipt"
                        >
                          <Printer size={16} />
                        </button>
                        <button 
                          onClick={() => handleEdit(receipt)} 
                          className="p-1.5 text-amber-600 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors cursor-pointer" 
                          title="Edit Receipt"
                        >
                          <Edit size={16} />
                        </button>
                        <button 
                          onClick={() => handleDelete(receipt._id)} 
                          className="p-1.5 text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors cursor-pointer" 
                          title="Delete Receipt"
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
