import React, { useState, useEffect } from 'react';
import { 
  Users, 
  ShieldCheck, 
  UserPlus, 
  Edit3, 
  Trash2, 
  X, 
  Briefcase, 
  Sparkles,
  Bot
} from 'lucide-react';
import { getUsers, createUser, updateUser, deleteUser } from '../services/api';
import { ALL_MODULES, JOB_ROLE_PRESETS, MODULE_CATEGORIES } from '../utils/permissionUtils';
import toast from 'react-hot-toast';

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    name: '',
    role: 'user',
    department: 'accounts',
    designation: '',
    managerId: '',
    performanceScore: 85,
    assignedModules: [],
    hasAiAccess: false,
  });

  const fetchUsersList = async () => {
    setIsLoading(true);
    try {
      const data = await getUsers();
      setUsers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load users:', error);
      toast.error('Failed to load user accounts');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsersList();
  }, []);

  const openCreateModal = () => {
    setEditingUserId(null);
    setFormData({
      username: '',
      password: '',
      name: '',
      role: 'user',
      department: 'accounts',
      designation: '',
      managerId: '',
      performanceScore: 85,
      assignedModules: ['/invoice', '/create-receipt', '/receipt-management'],
      hasAiAccess: false,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (user) => {
    setEditingUserId(user._id);
    setFormData({
      username: user.username,
      password: '', // leave empty if unchanged
      name: user.name || '',
      role: user.role || 'user',
      department: user.department || 'all',
      designation: user.designation || '',
      managerId: user.managerId?._id || user.managerId || '',
      performanceScore: user.performanceScore || 85,
      assignedModules: user.assignedModules || [],
      hasAiAccess: !!user.hasAiAccess,
    });
    setIsModalOpen(true);
  };

  const handleModuleToggle = (path) => {
    setFormData((prev) => {
      const current = prev.assignedModules || [];
      if (current.includes(path)) {
        return { ...prev, assignedModules: current.filter((p) => p !== path) };
      } else {
        return { ...prev, assignedModules: [...current, path] };
      }
    });
  };

  const handleSelectAllModules = () => {
    setFormData((prev) => ({
      ...prev,
      assignedModules: ALL_MODULES.map((m) => m.path),
    }));
  };

  const handleClearAllModules = () => {
    setFormData((prev) => ({
      ...prev,
      assignedModules: [],
    }));
  };

  const handleToggleCategory = (category, selectAll) => {
    const catModules = ALL_MODULES.filter(
      (m) =>
        m.category === category &&
        m.path !== '/owner-dashboard' &&
        m.path !== '/user-management' &&
        m.path !== '/master-data'
    ).map((m) => m.path);

    setFormData((prev) => {
      const current = prev.assignedModules || [];
      if (selectAll) {
        const combined = Array.from(new Set([...current, ...catModules]));
        return { ...prev, assignedModules: combined };
      } else {
        return { ...prev, assignedModules: current.filter((p) => !catModules.includes(p)) };
      }
    });
  };

  const applyRolePreset = (preset) => {
    setFormData((prev) => ({
      ...prev,
      role: preset.role,
      department: preset.department,
      designation: preset.designation,
      assignedModules: preset.modules || [],
    }));
    toast.success(`Applied '${preset.title}' preset`);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.username.trim()) {
      toast.error('Username is required');
      return;
    }
    if (!editingUserId && !formData.password) {
      toast.error('Password is required for new users');
      return;
    }

    try {
      if (editingUserId) {
        await updateUser(editingUserId, formData);
        toast.success('User updated successfully');
      } else {
        await createUser(formData);
        toast.success('User created successfully');
      }
      setIsModalOpen(false);
      fetchUsersList();
    } catch (error) {
      console.error('Save user failed:', error);
      toast.error(error.response?.data?.message || 'Failed to save user');
    }
  };

  const handleDelete = async (user) => {
    if (user.username === 'admin') {
      toast.error('Primary Admin account cannot be deleted');
      return;
    }
    if (!window.confirm(`Are you sure you want to delete user "${user.username}"?`)) {
      return;
    }

    try {
      await deleteUser(user._id);
      toast.success('User deleted successfully');
      fetchUsersList();
    } catch (error) {
      console.error('Delete failed:', error);
      toast.error(error.response?.data?.message || 'Failed to delete user');
    }
  };

  // Managers list for dropdown assignment
  const managersList = users.filter((u) => u.role === 'manager' || u.role === 'admin');

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            User & Role-Based Access Control (RBAC)
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Configure user accounts, assign department managers, and specify module-level permissions
          </p>
        </div>

        <button 
          className="flex items-center gap-2 px-4 py-2.5 bg-[#0059bb] hover:bg-[#004899] text-white rounded-xl font-semibold text-sm shadow-sm transition-all cursor-pointer"
          onClick={openCreateModal}
        >
          <UserPlus size={18} />
          <span>Add New User</span>
        </button>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center shrink-0">
            <Users size={22} />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900">{users.length}</div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Users</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
            <Briefcase size={22} />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900">{users.filter((u) => u.role === 'manager').length}</div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Dept Managers</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
            <Users size={22} />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900">{users.filter((u) => u.role === 'user').length}</div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Dept Staff Users</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center shrink-0">
            <ShieldCheck size={22} />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900">{users.filter((u) => u.role === 'admin' || u.role === 'owner').length}</div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Admin / Executive</div>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs sm:text-sm text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80">
                <th className="px-4 py-3 font-semibold text-xs text-slate-500 uppercase tracking-wider">Employee & Username</th>
                <th className="px-4 py-3 font-semibold text-xs text-slate-500 uppercase tracking-wider">Role</th>
                <th className="px-4 py-3 font-semibold text-xs text-slate-500 uppercase tracking-wider">Department</th>
                <th className="px-4 py-3 font-semibold text-xs text-slate-500 uppercase tracking-wider">Designation</th>
                <th className="px-4 py-3 font-semibold text-xs text-slate-500 uppercase tracking-wider">Reporting Manager</th>
                <th className="px-4 py-3 font-semibold text-xs text-slate-500 uppercase tracking-wider">Assigned Modules</th>
                <th className="px-4 py-3 font-semibold text-xs text-slate-500 uppercase tracking-wider">Score</th>
                <th className="px-4 py-3 font-semibold text-xs text-slate-500 uppercase tracking-wider">AI Assistant</th>
                <th className="px-4 py-3 font-semibold text-xs text-slate-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan="9" className="text-center py-12 text-slate-500">
                    Loading user accounts...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan="9" className="text-center py-12 text-slate-500">
                    No users found.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u._id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-900">{u.name}</div>
                      <div className="text-xs text-slate-500 font-mono">@{u.username}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${
                        u.role === 'admin' 
                          ? 'bg-rose-50 text-rose-700 border border-rose-200' 
                          : u.role === 'owner' 
                            ? 'bg-amber-50 text-amber-700 border border-amber-200' 
                            : u.role === 'manager' 
                              ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                              : 'bg-slate-100 text-slate-700 border border-slate-200'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 capitalize">
                        {u.department}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-700 text-sm">{u.designation || 'Staff'}</td>
                    <td className="px-4 py-3">
                      {u.managerId ? (
                        <span className="text-xs font-semibold text-sky-700">
                          {u.managerId.name}
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {u.role === 'admin' ? (
                        <span className="text-xs font-semibold text-emerald-600">All Modules</span>
                      ) : u.role === 'owner' ? (
                        <span className="text-xs font-semibold text-amber-700">Summary Portal Only</span>
                      ) : (
                        <span className="text-xs text-slate-600">
                          {u.assignedModules?.length || 0} Modules Assigned
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-bold text-[#0059bb] text-sm">
                        {u.performanceScore || 85}%
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {u.hasAiAccess || u.role === 'admin' || u.role === 'owner' ? (
                        <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-md text-xs font-semibold border border-emerald-200">
                          <Bot size={13} /> Active
                        </span>
                      ) : (
                        <span className="text-slate-400 text-xs">Disabled</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={() => openEditModal(u)}
                          title="Edit User"
                          className="p-1.5 text-[#0059bb] hover:bg-blue-50 border border-slate-200 rounded-lg transition-colors cursor-pointer"
                        >
                          <Edit3 size={15} />
                        </button>
                        {u.username !== 'admin' && (
                          <button
                            onClick={() => handleDelete(u)}
                            title="Delete User"
                            className="p-1.5 text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto" 
          onClick={() => setIsModalOpen(false)}
        >
          <div 
            className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl border border-slate-200 overflow-hidden my-8" 
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-bold text-lg text-slate-900">
                {editingUserId ? 'Edit User & Permissions' : 'Create New User Account'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
                {/* 1-Click Job Role Quick Presets Bar */}
                <div className="bg-gradient-to-r from-blue-50/80 via-indigo-50/40 to-slate-50 p-3.5 rounded-xl border border-blue-100 shadow-2xs">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                    <Briefcase size={14} className="text-[#0059bb]" />
                    <span>Quick Job Role Presets (1-Click Auto Configuration)</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {JOB_ROLE_PRESETS.filter((p) => p.role !== 'admin').map((preset) => (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => applyRolePreset(preset)}
                        title={preset.description}
                        className="px-2.5 py-1 text-xs font-medium rounded-lg border border-slate-200 bg-white hover:border-[#0059bb] hover:text-[#0059bb] hover:bg-blue-50/60 shadow-2xs transition-all cursor-pointer text-slate-700"
                      >
                        {preset.title}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Full Name</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0059bb]/20 focus:border-[#0059bb]"
                      placeholder="e.g. Ramesh Sharma"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Username (Login ID)</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0059bb]/20 focus:border-[#0059bb] disabled:opacity-50"
                      placeholder="e.g. ramesh.accounts"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      required
                      disabled={!!editingUserId}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                      {editingUserId ? 'New Password (leave blank to keep)' : 'Password'}
                    </label>
                    <input
                      type="password"
                      className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0059bb]/20 focus:border-[#0059bb]"
                      placeholder="Minimum 6 characters"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      required={!editingUserId}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Designation / Title</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0059bb]/20 focus:border-[#0059bb]"
                      placeholder="e.g. Accounts & Finance Head"
                      value={formData.designation}
                      onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Assigned Role</label>
                    <select
                      className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0059bb]/20 focus:border-[#0059bb] cursor-pointer"
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    >
                      <option value="user">Department User (Staff / Executive)</option>
                      <option value="manager">Department Manager</option>
                      <option value="purchase_manager">Purchase / Procurement Manager</option>
                      <option value="admin">Administrator (Full Access)</option>
                      <option value="owner">Owner (Executive Summary Portal)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Department</label>
                    <select
                      className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0059bb]/20 focus:border-[#0059bb] cursor-pointer"
                      value={formData.department}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    >
                      <option value="accounts">Accounts & Finance</option>
                      <option value="logistics">Logistics & Store</option>
                      <option value="purchase">Purchase & Procurement</option>
                      <option value="sales">Sales & Marketing</option>
                      <option value="production">Production & Manufacturing</option>
                      <option value="quality">Quality Assurance</option>
                      <option value="management">Management / Executive</option>
                      <option value="all">All Departments</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Reporting Manager</label>
                    <select
                      className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0059bb]/20 focus:border-[#0059bb] cursor-pointer"
                      value={formData.managerId}
                      onChange={(e) => setFormData({ ...formData, managerId: e.target.value })}
                    >
                      <option value="">-- No Direct Manager --</option>
                      {managersList
                        .filter((m) => m._id !== editingUserId)
                        .map((m) => (
                          <option key={m._id} value={m._id}>
                            {m.name} ({m.role.toUpperCase()} - {m.department})
                          </option>
                        ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Performance Score (0 - 100)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0059bb]/20 focus:border-[#0059bb]"
                      value={formData.performanceScore}
                      onChange={(e) => setFormData({ ...formData, performanceScore: e.target.value })}
                    />
                  </div>
                </div>

                {/* AI Chatbot Access Permission */}
                <div className={`p-4 rounded-xl border flex items-center justify-between gap-3 ${
                  formData.hasAiAccess ? 'bg-emerald-50/70 border-emerald-200' : 'bg-slate-50 border-slate-200'
                }`}>
                  <div>
                    <div className="text-sm font-semibold text-slate-900 flex items-center gap-1.5">
                      <Sparkles size={16} className={formData.hasAiAccess ? 'text-emerald-600' : 'text-slate-400'} />
                      <span>Grant AI Chatbot Access</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Enables natural language AI tool actions, automated challan drafting & statement generation.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={!!formData.hasAiAccess}
                    onChange={(e) => setFormData({ ...formData, hasAiAccess: e.target.checked })}
                    className="w-5 h-5 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                  />
                </div>

                {/* Module-level Permissions Checkboxes Grouped by Category */}
                {formData.role !== 'admin' && formData.role !== 'owner' && (
                  <div className="pt-2">
                    <div className="flex justify-between items-center mb-2">
                      <div>
                        <label className="text-xs font-bold text-slate-900 uppercase">
                          Module-Level Access Rights
                        </label>
                        <p className="text-[11px] text-slate-500">
                          {formData.assignedModules?.length || 0} modules currently assigned to this user
                        </p>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <button
                          type="button"
                          onClick={handleSelectAllModules}
                          className="text-[#0059bb] hover:underline font-semibold cursor-pointer"
                        >
                          Select All
                        </button>
                        <span className="text-slate-300">•</span>
                        <button
                          type="button"
                          onClick={handleClearAllModules}
                          className="text-rose-600 hover:underline font-semibold cursor-pointer"
                        >
                          Clear All
                        </button>
                      </div>
                    </div>

                    <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                      {MODULE_CATEGORIES.filter((cat) => cat !== 'Executive Leadership').map((cat) => {
                        const catModules = ALL_MODULES.filter(
                          (m) =>
                            m.category === cat &&
                            m.path !== '/owner-dashboard' &&
                            m.path !== '/user-management' &&
                            m.path !== '/master-data'
                        );
                        if (catModules.length === 0) return null;
                        const allChecked = catModules.every((m) =>
                          formData.assignedModules?.includes(m.path)
                        );
                        return (
                          <div key={cat} className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                            <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200/60">
                              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                                {cat}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleToggleCategory(cat, !allChecked)}
                                className="text-[11px] font-semibold text-[#0059bb] hover:underline cursor-pointer"
                              >
                                {allChecked ? 'Deselect Category' : 'Select Category'}
                              </button>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {catModules.map((m) => (
                                <label
                                  key={m.path}
                                  className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer p-1 hover:bg-white rounded transition-colors"
                                >
                                  <input
                                    type="checkbox"
                                    checked={formData.assignedModules?.includes(m.path)}
                                    onChange={() => handleModuleToggle(m.path)}
                                    className="rounded text-[#0059bb] focus:ring-[#0059bb]"
                                  />
                                  <span className="truncate">{m.label}</span>
                                </label>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
                <button 
                  type="button" 
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer" 
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-5 py-2 text-xs font-semibold bg-[#0059bb] hover:bg-[#004899] text-white rounded-xl shadow-sm transition-all cursor-pointer"
                >
                  {editingUserId ? 'Save Changes' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
