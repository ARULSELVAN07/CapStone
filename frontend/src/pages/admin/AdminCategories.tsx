import React, { useEffect, useState } from 'react';
import adminService from '../../services/adminService';
import { Category } from '../../types';
import { Tag, Plus, Edit2, Trash2, CheckCircle, AlertCircle, RefreshCw, ToggleLeft, ToggleRight } from 'lucide-react';

export const AdminCategories: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '', active: true });
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showInactive, setShowInactive] = useState(true);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      // Use admin endpoint to get ALL categories (including inactive)
      const data = await adminService.getAllCategoriesAdmin();
      setCategories(data);
    } catch (e) {
      // Fallback to public endpoint
      try {
        const data = await adminService.getCategories();
        setCategories(data);
      } catch (e2) {
        console.error(e2);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleOpenAddModal = () => {
    setEditingCategory(null);
    setFormData({ name: '', description: '', active: true });
    setMsg(null);
    setShowModal(true);
  };

  const handleOpenEditModal = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || '',
      active: category.active !== undefined ? category.active : true,
    });
    setMsg(null);
    setShowModal(true);
  };

  const handleToggleActive = async (category: Category) => {
    const action = category.active ? 'deactivate' : 'reactivate';
    if (!window.confirm(`Are you sure you want to ${action} category "${category.name}"?`)) return;
    try {
      await adminService.updateCategory(category.id, {
        name: category.name,
        description: category.description || '',
        active: !category.active,
      });
      fetchCategories();
    } catch (err: any) {
      alert(err.response?.data?.message || `Failed to ${action} category`);
    }
  };

  const handleDeleteCategory = async (id: string, name: string) => {
    if (!window.confirm(`Permanently delete category "${name}"? This cannot be undone.`)) return;
    try {
      await adminService.deleteCategory(id);
      fetchCategories();
    } catch (err: any) {
      // If the backend does soft-delete (deactivation), show appropriate message
      alert(err.response?.data?.message || 'Failed to delete category');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setMsg({ type: 'error', text: 'Category name is required.' });
      return;
    }
    setSubmitting(true);
    setMsg(null);
    try {
      if (editingCategory) {
        await adminService.updateCategory(editingCategory.id, formData);
        setMsg({ type: 'success', text: 'Category updated successfully!' });
      } else {
        await adminService.createCategory(formData);
        setMsg({ type: 'success', text: 'Category created successfully!' });
      }
      setTimeout(() => {
        setShowModal(false);
        fetchCategories();
      }, 1000);
    } catch (err: any) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Failed to save category' });
    } finally {
      setSubmitting(false);
    }
  };

  const displayedCategories = showInactive ? categories : categories.filter(c => c.active);

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Tag className="w-7 h-7 text-red-500" /> Spare Part Categories
          </h1>
          <p className="text-slate-400 text-sm">Organize spare parts into OEM system categories (Brakes, Engine, Suspension...)</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowInactive(p => !p)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
              showInactive ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'bg-slate-700/50 text-slate-500 hover:bg-slate-700'
            }`}
            title={showInactive ? 'Hide inactive categories' : 'Show inactive categories'}
          >
            {showInactive ? <ToggleRight className="w-4 h-4 text-emerald-400" /> : <ToggleLeft className="w-4 h-4" />}
            {showInactive ? 'Showing All' : 'Active Only'}
          </button>
          <button
            onClick={fetchCategories}
            className="p-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition-all"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={handleOpenAddModal}
            className="flex items-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-lg font-medium text-sm transition-all shadow-lg shadow-red-600/20"
          >
            <Plus className="w-4 h-4" /> Add Category
          </button>
        </div>
      </div>

      <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-900/80 text-xs font-semibold text-slate-400 uppercase border-b border-slate-700">
              <tr>
                <th className="px-6 py-4">Category Name</th>
                <th className="px-6 py-4">Description</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/60">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                    <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-red-500 mb-2" />
                    <p>Loading categories...</p>
                  </td>
                </tr>
              ) : displayedCategories.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-400">
                    No categories found.
                  </td>
                </tr>
              ) : (
                displayedCategories.map((c) => (
                  <tr key={c.id} className={`hover:bg-slate-750/50 transition-colors ${!c.active ? 'opacity-60' : ''}`}>
                    <td className="px-6 py-4 font-semibold text-white">{c.name}</td>
                    <td className="px-6 py-4 text-slate-400">{c.description || 'N/A'}</td>
                    <td className="px-6 py-4">
                      {c.active ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-xs font-semibold border border-emerald-500/30">
                          <CheckCircle className="w-3.5 h-3.5" /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-700 text-slate-400 rounded-full text-xs font-semibold">
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenEditModal(c)}
                          className="p-1.5 bg-slate-700 hover:bg-slate-600 text-blue-400 rounded transition-all"
                          title="Edit Category"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleToggleActive(c)}
                          className={`p-1.5 rounded transition-all ${
                            c.active
                              ? 'bg-slate-700 hover:bg-amber-600/30 text-amber-400'
                              : 'bg-slate-700 hover:bg-emerald-600/30 text-emerald-400'
                          }`}
                          title={c.active ? 'Deactivate Category' : 'Reactivate Category'}
                        >
                          {c.active ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => handleDeleteCategory(c.id, c.name)}
                          className="p-1.5 bg-slate-700 hover:bg-rose-600/30 text-rose-400 rounded transition-all"
                          title="Delete Category"
                        >
                          <Trash2 className="w-4 h-4" />
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

      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-xl w-full max-w-md p-6 shadow-2xl">
            <h2 className="text-xl font-bold text-white mb-4">
              {editingCategory ? 'Edit Category' : 'Add Category'}
            </h2>

            {msg && (
              <div className={`mb-4 p-3 rounded-lg flex items-center gap-2 text-sm ${
                msg.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
              }`}>
                {msg.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                {msg.text}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Category Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Brake Systems"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Description</label>
                <textarea
                  rows={3}
                  placeholder="Brake discs, pads, calipers..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="catActive"
                  checked={formData.active}
                  onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                  className="rounded bg-slate-900 border-slate-700 text-red-600 focus:ring-red-500"
                />
                <label htmlFor="catActive" className="text-xs text-slate-300">Category is Active</label>
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
                  {submitting ? 'Saving...' : editingCategory ? 'Update Category' : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCategories;
