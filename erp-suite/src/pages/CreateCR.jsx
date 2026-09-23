import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createStoreReceipt, getMaterials, getDivisions, getContractors } from '../services/api';
import { Save, ArrowLeft, PackagePlus } from 'lucide-react';
import toast from 'react-hot-toast';
import { handleFormKeyboardNav } from '../utils/keyboardNav';

export default function CreateCR() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [materials, setMaterials] = useState([]);
  const [divisions, setDivisions] = useState([]);
  const [contractors, setContractors] = useState([]);
  
  const [formData, setFormData] = useState({
    releaseNo: '',
    receiptNo: '',
    conName: '',
    oNo: '',
    poNo: '',
    divisionName: '',
  });

  const [quantities, setQuantities] = useState({});

  useEffect(() => {
    const fetchMasterData = async () => {
      try {
        const [mats, divs, conts] = await Promise.all([
          getMaterials(),
          getDivisions(),
          getContractors()
        ]);
        
        const matNames = mats.map(m => m.name);
        setMaterials(matNames);
        setDivisions(divs.map(d => d.name));
        setContractors(conts.map(c => c.name));
        
        if (divs.length > 0) setFormData(prev => ({ ...prev, divisionName: divs[0].name }));
        
        const initialQty = {};
        matNames.forEach(mat => { initialQty[mat] = ''; });
        setQuantities(initialQty);
      } catch (error) {
        console.error("Failed to load master data", error);
      }
    };
    fetchMasterData();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleQtyChange = (material, value) => {
    setQuantities(prev => ({
      ...prev,
      [material]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Filter out materials with 0 or empty quantity
      const receivedMaterials = Object.keys(quantities)
        .filter(name => quantities[name] !== '' && Number(quantities[name]) > 0)
        .map(name => ({
          name,
          qty: Number(quantities[name])
        }));

      if (receivedMaterials.length === 0) {
        toast.error("Please enter at least one material quantity to save.");
        setIsSubmitting(false);
        return;
      }

      const submissionData = {
        ...formData,
        materials: receivedMaterials
      };

      await createStoreReceipt(submissionData);

      toast.success('Material Inward (CR) Saved Successfully! Inventory Balance Updated.');
      navigate('/cr-register');
    } catch (error) {
      console.error('Submission error:', error);
      toast.error(error.response?.data?.error || 'Failed to save CR');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="page-container p-4 md:p-6 max-w-7xl mx-auto">
      <div className="page-header flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-800 flex items-center gap-2 m-0">
            <PackagePlus size={24} color="#6f42c1" />
            Material Inward (CR Entry)
          </h1>
          <p className="text-sm text-slate-500 mt-1 mb-0">Enter received goods to automatically add to Division Inventory Balance.</p>
        </div>
        <button
          onClick={() => navigate('/cr-register')}
          className="self-start sm:self-auto inline-flex items-center gap-2 px-3 py-1.5 border border-slate-200 hover:bg-slate-50 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 transition-colors cursor-pointer"
        >
          <ArrowLeft size={16} /> Back to Register
        </button>
      </div>

      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 md:p-6 shadow-xs">
        <form onSubmit={handleSubmit} onKeyDown={handleFormKeyboardNav}>
          {/* Header Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-6">
            <div className="flex flex-col gap-1">
              <label className="block text-xs font-semibold text-slate-700 tracking-wide mb-1">Release No.</label>
              <input
                type="text"
                name="releaseNo"
                value={formData.releaseNo}
                onChange={handleInputChange}
                placeholder="Enter Release No."
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0059bb]/20 focus:border-[#0059bb] transition-all"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="block text-xs font-semibold text-slate-700 tracking-wide mb-1">Receipt No. *</label>
              <input
                type="text"
                name="receiptNo"
                value={formData.receiptNo}
                onChange={handleInputChange}
                required
                placeholder="Enter Receipt No."
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0059bb]/20 focus:border-[#0059bb] transition-all"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="block text-xs font-semibold text-slate-700 tracking-wide mb-1">Contractor Name</label>
              <input
                type="text"
                name="conName"
                value={formData.conName}
                onChange={handleInputChange}
                placeholder="Enter Contractor Name"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0059bb]/20 focus:border-[#0059bb] transition-all"
                list="cr-contractors-list"
              />
              <datalist id="cr-contractors-list">
                {contractors.map(c => <option key={c} value={c} />)}
              </datalist>
            </div>

            <div className="flex flex-col gap-1">
              <label className="block text-xs font-semibold text-slate-700 tracking-wide mb-1">Order No.</label>
              <input
                type="text"
                name="oNo"
                value={formData.oNo}
                onChange={handleInputChange}
                placeholder="Enter O.No"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0059bb]/20 focus:border-[#0059bb] transition-all"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="block text-xs font-semibold text-slate-700 tracking-wide mb-1">P.O. No.</label>
              <input
                type="text"
                name="poNo"
                value={formData.poNo}
                onChange={handleInputChange}
                placeholder="Enter P.O.No."
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0059bb]/20 focus:border-[#0059bb] transition-all"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="block text-xs font-semibold text-slate-700 tracking-wide mb-1">Division Name *</label>
              <select
                name="divisionName"
                value={formData.divisionName}
                onChange={handleInputChange}
                required
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0059bb]/20 focus:border-[#0059bb] transition-all cursor-pointer"
              >
                {divisions.map(div => (
                  <option key={div} value={div}>{div}</option>
                ))}
              </select>
            </div>
          </div>

          <hr className="border-slate-100 my-6" />

          {/* Materials Grid */}
          <div className="mb-6">
            <h3 className="text-base font-bold text-slate-900 mb-1">Received Materials</h3>
            <p className="text-xs text-slate-500 mb-4">Enter quantities for the received inventory items below.</p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {materials.map((material, idx) => (
                <div key={idx} className="flex items-center justify-between gap-3 bg-slate-50 hover:bg-slate-100/80 border border-slate-200/80 rounded-xl p-3 transition-colors">
                  <label className="text-xs font-semibold text-slate-700 truncate max-w-[180px]" title={material}>
                    {material.split(' ').slice(1).join(' ')}
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={quantities[material]}
                    onChange={(e) => handleQtyChange(material, e.target.value)}
                    placeholder="0"
                    className="w-20 px-2.5 py-1 text-right font-mono text-xs sm:text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0059bb]/20 focus:border-[#0059bb] bg-white text-slate-800"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100">
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#0059bb] hover:bg-[#004899] active:bg-[#003c82] text-white rounded-xl font-semibold text-sm shadow-xs transition-all cursor-pointer disabled:opacity-50"
            >
              <Save size={17} />
              <span>{isSubmitting ? 'Saving...' : 'Save Material Inward (CR)'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
