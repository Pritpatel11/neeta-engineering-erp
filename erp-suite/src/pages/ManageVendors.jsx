import React, { useState, useEffect } from 'react';
import { 
  Building2, Plus, Search, Edit3, Trash2, Eye, Phone, Mail, 
  MapPin, Landmark, RefreshCcw, X, Save, AlertCircle, CheckCircle2 
} from 'lucide-react';
import { getVendors, createVendor, updateVendor, deleteVendor } from '../services/api';
import toast from 'react-hot-toast';

const EMPTY_VENDOR = {
  name: '',
  contactPerson: '',
  phone: '',
  email: '',
  address: '',
  city: '',
  state: 'Gujarat',
  stateCode: '24',
  pincode: '',
  gst: '',
  pan: '',
  bankDetails: {
    bankName: '',
    accountNo: '',
    ifscCode: '',
    branch: '',
    accountHolder: '',
  },
  paymentTerms: '30 Days Net',
  notes: '',
};

export default function ManageVendors() {
  const [vendors, setVendors] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVendorId, setEditingVendorId] = useState(null);
  const [viewingVendor, setViewingVendor] = useState(null);
  const [formData, setFormData] = useState(EMPTY_VENDOR);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchVendorsList = async () => {
    setIsLoading(true);
    try {
      const data = await getVendors();
      setVendors(data || []);
    } catch (err) {
      console.error('Failed to load vendors:', err);
      toast.error('Could not load vendor directory');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVendorsList();
  }, []);

  const openAddModal = () => {
    setEditingVendorId(null);
    setFormData(EMPTY_VENDOR);
    setIsModalOpen(true);
  };

  const openEditModal = (vendor) => {
    setEditingVendorId(vendor._id);
    setFormData({
      name: vendor.name || '',
      contactPerson: vendor.contactPerson || '',
      phone: vendor.phone || '',
      email: vendor.email || '',
      address: vendor.address || '',
      city: vendor.city || '',
      state: vendor.state || 'Gujarat',
      stateCode: vendor.stateCode || '24',
      pincode: vendor.pincode || '',
      gst: vendor.gst || '',
      pan: vendor.pan || '',
      bankDetails: {
        bankName: vendor.bankDetails?.bankName || '',
        accountNo: vendor.bankDetails?.accountNo || '',
        ifscCode: vendor.bankDetails?.ifscCode || '',
        branch: vendor.bankDetails?.branch || '',
        accountHolder: vendor.bankDetails?.accountHolder || '',
      },
      paymentTerms: vendor.paymentTerms || '30 Days Net',
      notes: vendor.notes || '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Vendor Company Name is required');
      return;
    }
    if (!formData.phone.trim()) {
      toast.error('Phone number is required');
      return;
    }
    if (!formData.email.trim()) {
      toast.error('Email address is required for RFQ dispatch');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingVendorId) {
        const updated = await updateVendor(editingVendorId, formData);
        setVendors(prev => prev.map(v => v._id === editingVendorId ? updated : v));
        toast.success(`Vendor "${updated.name}" updated successfully`);
      } else {
        const created = await createVendor(formData);
        setVendors(prev => [created, ...prev]);
        toast.success(`Vendor "${created.name}" registered successfully`);
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error('Vendor save error:', err);
      toast.error(err.response?.data?.message || 'Failed to save vendor');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (vendorId, vendorName) => {
    if (!window.confirm(`Are you sure you want to delete vendor "${vendorName}"?`)) {
      return;
    }

    try {
      await deleteVendor(vendorId);
      setVendors(prev => prev.filter(v => v._id !== vendorId));
      if (viewingVendor && viewingVendor._id === vendorId) {
        setViewingVendor(null);
      }
      toast.success('Vendor deleted');
    } catch (err) {
      console.error('Delete error:', err);
      toast.error(err.response?.data?.message || 'Failed to delete vendor');
    }
  };

  // Filtered vendors
  const filteredVendors = vendors.filter(v => {
    if (statusFilter !== 'all' && v.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = v.name?.toLowerCase().includes(q);
      const matchContact = v.contactPerson?.toLowerCase().includes(q);
      const matchGst = v.gst?.toLowerCase().includes(q);
      const matchCity = v.city?.toLowerCase().includes(q);
      const matchPhone = v.phone?.toLowerCase().includes(q);
      if (!matchName && !matchContact && !matchGst && !matchCity && !matchPhone) return false;
    }
    return true;
  });

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Manage Raw Material Vendors
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-[#0059bb] border border-blue-100">
              Purchase Management
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Directory of approved suppliers, steel fabricators, hardware stockists, and material vendors.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchVendorsList}
            disabled={isLoading}
            className="p-2 bg-white hover:bg-slate-50 text-slate-700 rounded-xl border border-slate-200 transition-colors cursor-pointer"
            title="Refresh"
          >
            <RefreshCcw size={16} className={isLoading ? 'animate-spin' : ''} />
          </button>

          <button
            onClick={openAddModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#0059bb] hover:bg-[#004899] text-white text-xs sm:text-sm font-semibold rounded-xl transition-colors cursor-pointer shadow-xs"
          >
            <Plus size={16} />
            <span>Add New Vendor</span>
          </button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search size={15} className="absolute left-3.5 top-3 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by vendor, contact, GSTIN, city..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0059bb]/20 focus:border-[#0059bb]"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#0059bb]/20 cursor-pointer"
          >
            <option value="all">All Vendors ({vendors.length})</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>

          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="text-xs text-rose-600 hover:underline px-1 cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Vendors Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider">
                <th className="px-4 py-3">Vendor / Company</th>
                <th className="px-4 py-3">Contact Details</th>
                <th className="px-4 py-3">GSTIN & PAN</th>
                <th className="px-4 py-3">Payment Terms</th>
                <th className="px-4 py-3">City / State</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-400">
                    <RefreshCcw size={24} className="animate-spin mx-auto mb-2 text-[#0059bb]" />
                    <p>Loading vendors...</p>
                  </td>
                </tr>
              ) : filteredVendors.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-400">
                    <Building2 size={36} className="mx-auto mb-2 text-slate-300" />
                    <p className="font-semibold text-slate-700">No vendors found</p>
                    <p className="text-xs mt-1">Use the "Add New Vendor" button above to add suppliers.</p>
                  </td>
                </tr>
              ) : (
                filteredVendors.map((vendor) => (
                  <tr key={vendor._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3.5">
                      <div className="font-bold text-slate-900 text-sm">{vendor.name}</div>
                      {vendor.contactPerson && (
                        <div className="text-[11px] text-slate-500">Contact: {vendor.contactPerson}</div>
                      )}
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1.5 text-slate-700">
                        <Phone size={12} className="text-slate-400" />
                        <span>{vendor.phone}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-500 text-[11px] mt-0.5">
                        <Mail size={12} className="text-slate-400" />
                        <span>{vendor.email}</span>
                      </div>
                    </td>

                    <td className="px-4 py-3.5">
                      {vendor.gst ? (
                        <div className="font-mono font-semibold text-[#0059bb]">{vendor.gst}</div>
                      ) : (
                        <span className="text-slate-400 italic">No GSTIN</span>
                      )}
                      {vendor.pan && (
                        <div className="font-mono text-slate-500 text-[11px]">PAN: {vendor.pan}</div>
                      )}
                    </td>

                    <td className="px-4 py-3.5">
                      <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700">
                        {vendor.paymentTerms || '30 Days Net'}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 text-slate-700">
                      <div>{vendor.city || 'Gujarat'}</div>
                      <div className="text-slate-400 text-[11px]">{vendor.state}</div>
                    </td>

                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setViewingVendor(vendor)}
                          className="p-1.5 text-slate-600 hover:text-[#0059bb] hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                          title="View Vendor Details"
                        >
                          <Eye size={15} />
                        </button>

                        <button
                          onClick={() => openEditModal(vendor)}
                          className="p-1.5 text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                          title="Edit Vendor"
                        >
                          <Edit3 size={15} />
                        </button>

                        <button
                          onClick={() => handleDelete(vendor._id, vendor.name)}
                          className="p-1.5 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Delete Vendor"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL: ADD / EDIT VENDOR */}
      {/* ========================================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Building2 className="text-[#0059bb]" size={18} />
                <span>{editingVendorId ? 'Edit Vendor Details' : 'Add New Raw Material Vendor'}</span>
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Vendor / Company Name <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Apex Steel & Alloys Pvt Ltd"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0059bb]/20 focus:border-[#0059bb]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Contact Person Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Rajesh Sharma"
                    value={formData.contactPerson}
                    onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0059bb]/20 focus:border-[#0059bb]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Mobile Number <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 9876543210"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0059bb]/20 focus:border-[#0059bb]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Email Address (For RFQ Dispatch) <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. sales@apexsteel.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0059bb]/20 focus:border-[#0059bb]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">GSTIN</label>
                  <input
                    type="text"
                    placeholder="e.g. 24AABCS1429B1Z0"
                    value={formData.gst}
                    onChange={(e) => {
                      const val = e.target.value.toUpperCase();
                      const pan = val.length >= 12 ? val.substring(2, 12) : formData.pan;
                      setFormData({ ...formData, gst: val, pan });
                    }}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 uppercase font-mono focus:outline-none focus:ring-2 focus:ring-[#0059bb]/20 focus:border-[#0059bb]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">PAN Number</label>
                  <input
                    type="text"
                    placeholder="e.g. AABCS1429B"
                    value={formData.pan}
                    onChange={(e) => setFormData({ ...formData, pan: e.target.value.toUpperCase() })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 uppercase font-mono focus:outline-none focus:ring-2 focus:ring-[#0059bb]/20 focus:border-[#0059bb]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Payment Terms</label>
                  <input
                    type="text"
                    placeholder="e.g. 30 Days Net / 50% Advance"
                    value={formData.paymentTerms}
                    onChange={(e) => setFormData({ ...formData, paymentTerms: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0059bb]/20 focus:border-[#0059bb]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Address</label>
                <input
                  type="text"
                  placeholder="Plot/Shop address..."
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0059bb]/20 focus:border-[#0059bb]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">City</label>
                  <input
                    type="text"
                    placeholder="e.g. Ahmedabad / Mehsana"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0059bb]/20"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">State</label>
                  <input
                    type="text"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0059bb]/20"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Pincode</label>
                  <input
                    type="text"
                    placeholder="e.g. 384002"
                    value={formData.pincode}
                    onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0059bb]/20"
                  />
                </div>
              </div>

              {/* Bank Details Sub-Section */}
              <div className="pt-2 border-t border-slate-100">
                <h4 className="font-bold text-slate-800 flex items-center gap-1.5 mb-2.5">
                  <Landmark size={14} className="text-[#0059bb]" />
                  <span>Vendor Bank Details (For Accounts Payment Transfer)</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-600 mb-1">Bank Name</label>
                    <input
                      type="text"
                      placeholder="e.g. HDFC Bank / SBI"
                      value={formData.bankDetails.bankName}
                      onChange={(e) => setFormData({
                        ...formData,
                        bankDetails: { ...formData.bankDetails, bankName: e.target.value }
                      })}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-1">Account Number</label>
                    <input
                      type="text"
                      placeholder="A/C Number..."
                      value={formData.bankDetails.accountNo}
                      onChange={(e) => setFormData({
                        ...formData,
                        bankDetails: { ...formData.bankDetails, accountNo: e.target.value }
                      })}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-1">IFSC Code</label>
                    <input
                      type="text"
                      placeholder="e.g. HDFC0001234"
                      value={formData.bankDetails.ifscCode}
                      onChange={(e) => setFormData({
                        ...formData,
                        bankDetails: { ...formData.bankDetails, ifscCode: e.target.value.toUpperCase() }
                      })}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 font-mono uppercase"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-1">Branch</label>
                    <input
                      type="text"
                      placeholder="e.g. GIDC Mehsana"
                      value={formData.bankDetails.branch}
                      onChange={(e) => setFormData({
                        ...formData,
                        bankDetails: { ...formData.bankDetails, branch: e.target.value }
                      })}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Notes / Remarks</label>
                <textarea
                  rows="2"
                  placeholder="Material specialties, delivery notes, credit limit..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 font-semibold text-white bg-[#0059bb] hover:bg-[#004899] rounded-xl cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : editingVendorId ? 'Update Vendor' : 'Save Vendor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: VIEW VENDOR DETAILS */}
      {/* ========================================================================= */}
      {viewingVendor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="text-sm font-bold text-slate-900">Vendor Profile Details</h3>
              <button onClick={() => setViewingVendor(null)} className="text-slate-400 hover:text-slate-700 cursor-pointer">✕</button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div>
                <h2 className="text-lg font-bold text-slate-900">{viewingVendor.name}</h2>
                <div className="text-slate-500 mt-0.5">Contact: {viewingVendor.contactPerson || 'Not provided'}</div>
              </div>

              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                <div>
                  <span className="text-slate-400 block">Phone</span>
                  <span className="font-semibold text-slate-800">{viewingVendor.phone}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Email</span>
                  <span className="font-semibold text-slate-800">{viewingVendor.email}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">GSTIN</span>
                  <span className="font-mono font-semibold text-[#0059bb]">{viewingVendor.gst || 'No GSTIN'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">PAN</span>
                  <span className="font-mono font-semibold text-slate-800">{viewingVendor.pan || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">City / State</span>
                  <span className="font-semibold text-slate-800">{viewingVendor.city}, {viewingVendor.state}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Payment Terms</span>
                  <span className="font-semibold text-emerald-700">{viewingVendor.paymentTerms || '30 Days Net'}</span>
                </div>
              </div>

              {viewingVendor.address && (
                <div>
                  <span className="text-slate-400 block mb-1">Full Address</span>
                  <p className="text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    {viewingVendor.address} {viewingVendor.pincode ? `- ${viewingVendor.pincode}` : ''}
                  </p>
                </div>
              )}

              {/* Bank Details */}
              <div className="border border-slate-100 rounded-xl p-3 bg-blue-50/40">
                <h4 className="font-bold text-slate-800 flex items-center gap-1.5 mb-2">
                  <Landmark size={14} className="text-[#0059bb]" />
                  <span>Bank Account Information</span>
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-slate-400 text-[10px] block">Bank Name</span>
                    <span className="font-semibold text-slate-800">{viewingVendor.bankDetails?.bankName || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block">A/C Number</span>
                    <span className="font-mono font-bold text-slate-800">{viewingVendor.bankDetails?.accountNo || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block">IFSC Code</span>
                    <span className="font-mono font-semibold text-[#0059bb]">{viewingVendor.bankDetails?.ifscCode || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block">Branch</span>
                    <span className="font-semibold text-slate-800">{viewingVendor.bankDetails?.branch || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {viewingVendor.notes && (
                <div>
                  <span className="text-slate-400 block mb-1">Notes / Remarks</span>
                  <p className="text-slate-600 italic bg-amber-50/50 p-2.5 rounded-lg border border-amber-100/70">
                    {viewingVendor.notes}
                  </p>
                </div>
              )}

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => setViewingVendor(null)}
                  className="px-4 py-2 font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
