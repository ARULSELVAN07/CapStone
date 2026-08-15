import React, { useEffect, useState } from 'react';
import adminService from '../../services/adminService';
import { UserProfile, UserRole } from '../../types';
import { Users, Plus, Shield, CheckCircle2, XCircle, AlertCircle, RefreshCw, Search } from 'lucide-react';

export const AdminUsers: React.FC = () => {
  const [activeTab, setActiveTab] = useState<UserRole>('CUSTOMER');
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    employeeId: '',
    role: 'TECHNICIAN'
  });
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      let data: UserProfile[] = [];
      if (activeTab === 'CUSTOMER') data = await adminService.getCustomers();
      else if (activeTab === 'TECHNICIAN') data = await adminService.getTechnicians();
      else if (activeTab === 'DELIVERY_EXECUTIVE') data = await adminService.getDeliveryExecutives();
      else if (activeTab === 'ADMIN') data = await adminService.getAdmins();
      setUsers(data);
    } catch (e) {
      console.error(e);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [activeTab]);

  const handleOpenAdd = (role: UserRole) => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      password: '',
      employeeId: role === 'TECHNICIAN' ? 'TECH-' : role === 'DELIVERY_EXECUTIVE' ? 'DEL-' : 'ADM-',
      role: role
    });
    setMsg(null);
    setShowModal(true);
  };

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMsg(null);

    if (!formData.name.trim()) {
      setMsg({ type: 'error', text: 'Full name is required.' });
      setSubmitting(false);
      return;
    }
    if (!formData.email.trim()) {
      setMsg({ type: 'error', text: 'Email address is required.' });
      setSubmitting(false);
      return;
    }
    if (!formData.password || formData.password.length < 6) {
      setMsg({ type: 'error', text: 'Password must be at least 6 characters.' });
      setSubmitting(false);
      return;
    }

    const payload = {
      name: formData.name.trim(),
      email: formData.email.trim(),
      phone: formData.phone.trim(),
      temporaryPassword: formData.password,
      employeeId: formData.employeeId.trim(),
      role: formData.role
    };

    try {
      if (formData.role === 'TECHNICIAN') await adminService.createTechnician(payload);
      else if (formData.role === 'DELIVERY_EXECUTIVE') await adminService.createDeliveryExecutive(payload);
      else if (formData.role === 'ADMIN') await adminService.createAdmin(payload);

      setMsg({ type: 'success', text: 'Account created successfully!' });
      setTimeout(() => {
        setShowModal(false);
        fetchUsers();
      }, 1000);
    } catch (err: any) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Failed to create user account. Please check the details and try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (user: UserProfile) => {
    const newStatus = user.status === 'ACTIVE' ? 'BLOCKED' : 'ACTIVE';
    if (!window.confirm(`Are you sure you want to ${newStatus === 'BLOCKED' ? 'block' : 'activate'} ${user.name}'s account?`)) return;
    try {
      await adminService.updateUserStatus(user.id, newStatus);
      fetchUsers();
    } catch (e: any) {
      alert(e.response?.data?.message || 'Failed to update status');
    }
  };

  const filteredUsers = users.filter(u =>
    !search ||
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase()) ||
    u.employeeId?.toLowerCase().includes(search.toLowerCase())
  );

  const getRoleLabel = (role: UserRole) => {
    if (role === 'DELIVERY_EXECUTIVE') return 'DELIVERY EXECUTIVES';
    return `${role}S`;
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Users className="w-7 h-7 text-red-500" /> User & Staff Administration
          </h1>
          <p className="text-slate-400 text-sm">Manage registered customers, certified technicians, delivery executives, and system admins</p>
        </div>

        {activeTab !== 'CUSTOMER' && (
          <button
            onClick={() => handleOpenAdd(activeTab)}
            className="flex items-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-lg font-medium text-sm transition-all shadow-lg shadow-red-600/20"
          >
            <Plus className="w-4 h-4" /> Add {activeTab.replace('_', ' ')}
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-700 space-x-2">
        {(['CUSTOMER', 'TECHNICIAN', 'DELIVERY_EXECUTIVE', 'ADMIN'] as UserRole[]).map((role) => (
          <button
            key={role}
            onClick={() => { setActiveTab(role); setSearch(''); }}
            className={`px-4 py-3 text-sm font-semibold border-b-2 transition-all ${
              activeTab === role
                ? 'border-red-500 text-red-400 bg-red-500/10'
                : 'border-transparent text-slate-400 hover:text-white hover:border-slate-600'
            }`}
          >
            {getRoleLabel(role)}
          </button>
        ))}
      </div>

      {/* Search bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
        <input
          type="text"
          placeholder={`Search ${activeTab.toLowerCase().replace('_', ' ')}s by name, email...`}
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:border-red-500 placeholder-slate-500"
        />
        {loading ? null : (
          <button
            onClick={fetchUsers}
            className="absolute right-3 top-2 p-1 text-slate-400 hover:text-white transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Users Table */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-900/80 text-xs font-semibold text-slate-400 uppercase border-b border-slate-700">
              <tr>
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Contact</th>
                {activeTab !== 'CUSTOMER' && <th className="px-6 py-4">Employee ID</th>}
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Account Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/60">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-red-500 mb-2" />
                    <p>Loading user records...</p>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    {search ? `No ${activeTab.toLowerCase().replace('_', ' ')}s matching "${search}".` : `No accounts found for role ${activeTab}.`}
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-750/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center font-bold text-white text-sm">
                          {u.name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-white">{u.name}</p>
                          <p className="text-xs text-slate-400">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-300">{u.phone || 'N/A'}</td>
                    {activeTab !== 'CUSTOMER' && (
                      <td className="px-6 py-4 font-mono text-xs text-red-400 font-semibold">{u.employeeId || 'N/A'}</td>
                    )}
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 bg-slate-700/60 text-slate-300 rounded text-xs font-semibold">
                        {u.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {u.status === 'ACTIVE' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-xs font-semibold border border-emerald-500/30">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-rose-500/20 text-rose-400 rounded-full text-xs font-semibold border border-rose-500/30">
                          <XCircle className="w-3.5 h-3.5" /> {u.status === 'BLOCKED' ? 'Blocked' : 'Inactive'}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleToggleStatus(u)}
                        className={`px-3 py-1 rounded text-xs font-medium transition-all ${
                          u.status === 'ACTIVE'
                            ? 'bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/30'
                            : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30'
                        }`}
                      >
                        {u.status === 'ACTIVE' ? 'Block Account' : 'Activate Account'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {!loading && filteredUsers.length > 0 && (
          <div className="px-6 py-3 border-t border-slate-700 text-xs text-slate-500">
            Showing {filteredUsers.length} of {users.length} {activeTab.toLowerCase().replace('_', ' ')}(s)
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-xl w-full max-w-md p-6 shadow-2xl">
            <h2 className="text-xl font-bold text-white mb-4">
              Add New {formData.role.replace('_', ' ')}
            </h2>

            {msg && (
              <div className={`mb-4 p-3 rounded-lg flex items-center gap-2 text-sm ${
                msg.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
              }`}>
                {msg.type === 'success' ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
                {msg.text}
              </div>
            )}

            <form onSubmit={handleCreateStaff} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Kumar"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="ramesh@bmwsparehub.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Phone *</label>
                  <input
                    type="tel"
                    required
                    placeholder="+91 9876543210"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Employee ID *</label>
                  <input
                    type="text"
                    required
                    value={formData.employeeId}
                    onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Password * (min. 6 chars)</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-700">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-sm font-medium transition-all disabled:opacity-50"
                >
                  {submitting ? 'Creating...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;
