import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Save, FileText } from 'lucide-react';
import { createReceipt, updateReceipt, getReceiptParties, getNextReceiptNo } from '../services/api';

function numberToWordsWithDecimal(num) {
  if (!num) return '';
  const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  
  const numToWords = (n) => {
    if ((n = n.toString()).length > 9) return 'overflow';
    let nArray = ('000000000' + n).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
    if (!nArray) return;
    let str = '';
    str += (nArray[1] != 0) ? (a[Number(nArray[1])] || b[nArray[1][0]] + ' ' + a[nArray[1][1]]) + 'Crore ' : '';
    str += (nArray[2] != 0) ? (a[Number(nArray[2])] || b[nArray[2][0]] + ' ' + a[nArray[2][1]]) + 'Lac ' : '';
    str += (nArray[3] != 0) ? (a[Number(nArray[3])] || b[nArray[3][0]] + ' ' + a[nArray[3][1]]) + 'Thousand ' : '';
    str += (nArray[4] != 0) ? (a[Number(nArray[4])] || b[nArray[4][0]] + ' ' + a[nArray[4][1]]) + 'Hundred ' : '';
    str += (nArray[5] != 0) ? (a[Number(nArray[5])] || b[nArray[5][0]] + ' ' + a[nArray[5][1]]) : '';
    return str.trim().replace(/ +/g, ' ');
  };

  const parts = Number(num).toFixed(2).split('.');
  const rupees = parseInt(parts[0], 10);
  const paise = parseInt(parts[1], 10);

  let result = '';
  if (rupees > 0) {
    result += numToWords(rupees) + ' Rupees';
  } else {
    result += 'Zero Rupees';
  }

  if (paise > 0) {
    result += ' and ' + numToWords(paise) + ' Paise';
  }
  
  result += ' Only';
  return result.toUpperCase();
}

export default function ReceiptGenerator() {
  const navigate = useNavigate();
  const location = useLocation();
  const editReceipt = location.state?.editReceipt;

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    receiptNo: '',
    date: new Date().toISOString().split('T')[0],
    partyName: '',
    chequeNo: '',
    billNo: '',
    billDate: new Date().toISOString().split('T')[0],
    amount: ''
  });

  const [parties, setParties] = useState([]);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const partiesData = await getReceiptParties();
        setParties(partiesData);

        if (editReceipt) {
          setFormData({
            receiptNo: editReceipt.receiptNo || '',
            date: editReceipt.date || new Date().toISOString().split('T')[0],
            partyName: editReceipt.partyName || '',
            chequeNo: editReceipt.chequeNo || '',
            billNo: editReceipt.billNo || '',
            billDate: editReceipt.billDate || new Date().toISOString().split('T')[0],
            amount: editReceipt.amount || ''
          });
        } else {
          const nextNoData = await getNextReceiptNo();
          setFormData(prev => ({ ...prev, receiptNo: nextNoData.nextNo }));
        }
      } catch (error) {
        console.error("Failed to fetch initial receipt data", error);
      }
    };
    fetchInitialData();
  }, [editReceipt]);

  const amountInWords = formData.amount ? numberToWordsWithDecimal(formData.amount) : '';

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.receiptNo || !formData.date || !formData.partyName || !formData.amount) {
      alert("Please fill all required fields (Receipt No, Date, Party Name, Amount).");
      return;
    }

    setLoading(true);
    try {
      if (editReceipt) {
        await updateReceipt(editReceipt._id, {
          ...formData,
          amount: parseFloat(formData.amount)
        });
        alert('Receipt updated successfully!');
      } else {
        await createReceipt({
          ...formData,
          amount: parseFloat(formData.amount)
        });
        alert('Receipt created successfully!');
      }
      navigate('/receipt-management');
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.error || 'Failed to save receipt.');
    }
    setLoading(false);
  };

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div>
          <h1 className="dashboard-title"><FileText size={28} /> {editReceipt ? 'Edit Receipt' : 'Receipt Generator'}</h1>
          <p className="dashboard-subtitle">{editReceipt ? 'Modify existing payment receipt.' : 'Create and save new payment receipts.'}</p>
        </div>
      </header>

      <div className="glass-card" style={{ maxWidth: '800px', margin: '0 auto', padding: '30px' }}>
        <h2 style={{ textAlign: 'center', color: '#1a365d', marginBottom: '30px', borderBottom: '2px solid #e2e8f0', paddingBottom: '15px' }}>
          NEETA ENGINEERING WORKS RECEIPT ENTRY
        </h2>

        <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div style={{ gridColumn: '1 / span 2', display: 'flex', gap: '20px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#4a5568' }}>Receipt No *</label>
              <input type="text" name="receiptNo" value={formData.receiptNo} onChange={handleChange} className="form-control" style={{ width: '100%', padding: '10px' }} required />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#4a5568' }}>Date *</label>
              <input type="text" placeholder="dd/mm/yyyy" name="date" value={formData.date} onChange={handleChange} className="form-control" style={{ width: '100%', padding: '10px' }} required />
            </div>
          </div>

          <div style={{ gridColumn: '1 / span 2' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#4a5568' }}>Party Name *</label>
            <select name="partyName" value={formData.partyName} onChange={handleChange} className="form-control" style={{ width: '100%', padding: '10px' }} required>
              <option value="">-- Select Party Name --</option>
              {parties.map(party => (
                <option key={party._id} value={party.name}>{party.name}</option>
              ))}
            </select>
          </div>

          <div style={{ gridColumn: '1 / span 2' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#4a5568' }}>Amount (In Rs.) *</label>
            <input type="number" step="0.01" name="amount" value={formData.amount} onChange={handleChange} className="form-control" style={{ width: '100%', padding: '10px', fontSize: '18px', fontWeight: 'bold' }} required />
          </div>

          <div style={{ gridColumn: '1 / span 2', background: '#f7fafc', padding: '15px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#4a5568' }}>Amount In Word</label>
            <div style={{ color: '#2b6cb0', fontSize: '16px', fontWeight: '500', minHeight: '24px' }}>
              {amountInWords || 'Enter amount above'}
            </div>
          </div>

          <div style={{ gridColumn: '1 / span 2' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#4a5568' }}>Cheque No</label>
            <input type="text" name="chequeNo" value={formData.chequeNo} onChange={handleChange} className="form-control" style={{ width: '100%', padding: '10px' }} />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#4a5568' }}>Bill No</label>
            <input type="text" name="billNo" value={formData.billNo} onChange={handleChange} className="form-control" style={{ width: '100%', padding: '10px' }} />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#4a5568' }}>Bill Date</label>
            <input type="text" placeholder="dd/mm/yyyy" name="billDate" value={formData.billDate} onChange={handleChange} className="form-control" style={{ width: '100%', padding: '10px' }} />
          </div>

          <div style={{ gridColumn: '1 / span 2', marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '15px' }}>
            <button type="button" className="btn-outline" onClick={() => navigate('/receipt-management')}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Save size={18} /> {loading ? 'Saving...' : (editReceipt ? 'Update Receipt' : 'Save Receipt')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
