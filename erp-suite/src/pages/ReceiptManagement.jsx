import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Plus, Trash2, Printer, Edit } from 'lucide-react';
import { getReceipts, deleteReceipt } from '../services/api';

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
    <div className="dashboard-container">
      <header className="dashboard-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="dashboard-title"><FileText size={28} /> Receipt Management</h1>
          <p className="dashboard-subtitle">View, print, and manage your saved payment receipts.</p>
        </div>
        <button className="btn-primary" onClick={() => navigate('/create-receipt')} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Plus size={18} /> Create New Receipt
        </button>
      </header>

      <div className="glass-card" style={{ padding: '20px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>Loading receipts...</div>
        ) : receipts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
            <p>No receipts found.</p>
            <button className="btn-outline" onClick={() => navigate('/create-receipt')} style={{ marginTop: '15px' }}>
              Create Your First Receipt
            </button>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ background: '#f8f9fa' }}>
                <tr>
                  <th style={{ padding: '12px 15px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Receipt No</th>
                  <th style={{ padding: '12px 15px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Date</th>
                  <th style={{ padding: '12px 15px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Party Name</th>
                  <th style={{ padding: '12px 15px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Bill No</th>
                  <th style={{ padding: '12px 15px', textAlign: 'right', borderBottom: '2px solid #ddd' }}>Amount (Rs)</th>
                  <th style={{ padding: '12px 15px', textAlign: 'center', borderBottom: '2px solid #ddd' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {receipts.map((receipt) => (
                  <tr key={receipt._id} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '12px 15px', fontWeight: 'bold', color: '#2b6cb0' }}>{receipt.receiptNo}</td>
                    <td style={{ padding: '12px 15px' }}>{receipt.date}</td>
                    <td style={{ padding: '12px 15px' }}>{receipt.partyName}</td>
                    <td style={{ padding: '12px 15px' }}>{receipt.billNo || '-'}</td>
                    <td style={{ padding: '12px 15px', textAlign: 'right', fontWeight: 'bold' }}>{receipt.amount.toFixed(2)}</td>
                    <td style={{ padding: '12px 15px', textAlign: 'center' }}>
                      <button 
                        onClick={() => handlePrint(receipt)} 
                        className="btn-outline" 
                        style={{ padding: '5px 10px', marginRight: '10px' }}
                        title="Print Receipt"
                      >
                        <Printer size={16} />
                      </button>
                      <button 
                        onClick={() => handleEdit(receipt)} 
                        className="btn-outline" 
                        style={{ padding: '5px 10px', marginRight: '10px' }}
                        title="Edit Receipt"
                      >
                        <Edit size={16} />
                      </button>
                      <button 
                        onClick={() => handleDelete(receipt._id)} 
                        style={{ background: 'none', border: 'none', color: '#dc3545', cursor: 'pointer', padding: '5px' }}
                        title="Delete Receipt"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
