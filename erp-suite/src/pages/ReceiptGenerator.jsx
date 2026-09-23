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
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
            <FileText size={28} className="text-[#0059bb]" /> {editReceipt ? 'Edit Receipt' : 'Receipt Generator'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {editReceipt ? 'Modify existing payment receipt.' : 'Create and save new payment receipts.'}
          </p>
        </div>
      </header>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs p-6 sm:p-8 max-w-3xl mx-auto">
        <h2 className="text-xl sm:text-2xl font-bold text-center text-slate-900 pb-4 mb-6 border-b border-slate-200">
          NEETA ENGINEERING WORKS RECEIPT ENTRY
        </h2>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block mb-1.5 text-xs sm:text-sm font-semibold text-slate-700">Receipt No *</label>
              <input 
                type="text" 
                name="receiptNo" 
                value={formData.receiptNo} 
                onChange={handleChange} 
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0059bb]/20 focus:border-[#0059bb] transition-all" 
                required 
              />
            </div>
            <div>
              <label className="block mb-1.5 text-xs sm:text-sm font-semibold text-slate-700">Date *</label>
              <input 
                type="text" 
                placeholder="dd/mm/yyyy" 
                name="date" 
                value={formData.date} 
                onChange={handleChange} 
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0059bb]/20 focus:border-[#0059bb] transition-all" 
                required 
              />
            </div>
          </div>

          <div className="sm:col-span-2">
            <label className="block mb-1.5 text-xs sm:text-sm font-semibold text-slate-700">Party Name *</label>
            <select 
              name="partyName" 
              value={formData.partyName} 
              onChange={handleChange} 
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0059bb]/20 focus:border-[#0059bb] transition-all cursor-pointer" 
              required
            >
              <option value="">-- Select Party Name --</option>
              {parties.map(party => (
                <option key={party._id} value={party.name}>{party.name}</option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2">
            <label className="block mb-1.5 text-xs sm:text-sm font-semibold text-slate-700">Amount (In Rs.) *</label>
            <input 
              type="number" 
              step="0.01" 
              name="amount" 
              value={formData.amount} 
              onChange={handleChange} 
              className="w-full px-3.5 py-2.5 text-lg font-bold rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0059bb]/20 focus:border-[#0059bb] transition-all" 
              required 
            />
          </div>

          <div className="sm:col-span-2 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <label className="block mb-1.5 text-xs sm:text-sm font-semibold text-slate-700">Amount In Word</label>
            <div className="text-blue-700 text-sm sm:text-base font-semibold min-h-[24px]">
              {amountInWords || 'Enter amount above'}
            </div>
          </div>

          <div className="sm:col-span-2">
            <label className="block mb-1.5 text-xs sm:text-sm font-semibold text-slate-700">Cheque No</label>
            <input 
              type="text" 
              name="chequeNo" 
              value={formData.chequeNo} 
              onChange={handleChange} 
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0059bb]/20 focus:border-[#0059bb] transition-all" 
            />
          </div>

          <div>
            <label className="block mb-1.5 text-xs sm:text-sm font-semibold text-slate-700">Bill No</label>
            <input 
              type="text" 
              name="billNo" 
              value={formData.billNo} 
              onChange={handleChange} 
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0059bb]/20 focus:border-[#0059bb] transition-all" 
            />
          </div>

          <div>
            <label className="block mb-1.5 text-xs sm:text-sm font-semibold text-slate-700">Bill Date</label>
            <input 
              type="text" 
              placeholder="dd/mm/yyyy" 
              name="billDate" 
              value={formData.billDate} 
              onChange={handleChange} 
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0059bb]/20 focus:border-[#0059bb] transition-all" 
            />
          </div>

          <div className="sm:col-span-2 flex justify-end gap-3 mt-4">
            <button 
              type="button" 
              className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-sm font-medium transition-colors cursor-pointer" 
              onClick={() => navigate('/receipt-management')}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="px-5 py-2.5 rounded-xl bg-[#0059bb] hover:bg-[#004899] text-white text-sm font-medium flex items-center gap-2 transition-colors cursor-pointer shadow-xs disabled:opacity-50" 
              disabled={loading}
            >
              <Save size={18} /> {loading ? 'Saving...' : (editReceipt ? 'Update Receipt' : 'Save Receipt')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
