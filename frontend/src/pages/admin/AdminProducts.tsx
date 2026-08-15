import React, { useEffect, useState } from 'react';
import adminService from '../../services/adminService';
import productService from '../../services/productService';
import api, { getImageUrl, handleImageError } from '../../services/api';
import { Category, Product, VehicleModel } from '../../types';
import { Package, Plus, Search, Filter, Edit2, Trash2, CheckCircle, XCircle, AlertCircle, RefreshCw, Layers, Upload } from 'lucide-react';

export const AdminProducts: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [vehicleModels, setVehicleModels] = useState<VehicleModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  // Image Upload State
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    categoryId: '',
    partNumber: '',
    name: '',
    description: '',
    brand: 'BMW OEM',
    price: '',
    warrantyMonths: '24',
    imageUrl: '',
    initialStockQuantity: '10',
    minimumStockThreshold: '5',
    rating: '4.5',
    compatibleVehicleModelIds: [] as string[]
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    adminService.getVehicleModels().then(setVehicleModels).catch(console.error);
  }, []);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setUploadError('Please select a valid image file (JPG, PNG, or WEBP).');
      return;
    }

    const maxBytes = 5 * 1024 * 1024;
    if (file.size > maxBytes) {
      setUploadError('File size exceeds the limit of 5MB.');
      return;
    }

    setUploadError('');
    setUploading(true);

    const data = new FormData();
    data.append('file', file);

    try {
      const res = await api.post('/admin/products/upload', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setFormData(prev => ({ ...prev, imageUrl: res.data.data.imageUrl }));
    } catch (err: any) {
      setUploadError(err.response?.data?.message || 'Unable to upload image.');
    } finally {
      setUploading(false);
    }
  };
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const cats = await adminService.getAllCategoriesAdmin();
      setCategories(cats);

      const res = await productService.getProducts({
        search: search || undefined,
        categoryId: selectedCategory || undefined,
        size: 50
      });
      setProducts(res.content);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [search, selectedCategory]);

  const handleOpenAddModal = async () => {
    setEditingProduct(null);
    let cats = categories;
    if (cats.length === 0) {
      try {
        cats = await adminService.getAllCategoriesAdmin();
        setCategories(cats);
      } catch (e) {
        console.error(e);
      }
    }
    const activeCats = cats.filter(c => c.active !== false);
    setFormData({
      categoryId: activeCats[0]?.id || cats[0]?.id || '',
      partNumber: '',
      name: '',
      description: '',
      brand: 'BMW OEM',
      price: '',
      warrantyMonths: '24',
      imageUrl: '',
      initialStockQuantity: '10',
      minimumStockThreshold: '5',
      rating: '4.5',
      compatibleVehicleModelIds: []
    });
    setUploadError('');
    setMsg(null);
    setShowModal(true);
  };

  const handleOpenEditModal = (p: Product) => {
    setEditingProduct(p);
    setFormData({
      categoryId: p.category?.id || categories[0]?.id || '',
      partNumber: p.partNumber,
      name: p.name,
      description: p.description || '',
      brand: p.brand || 'BMW OEM',
      price: p.price?.toString() || '',
      warrantyMonths: p.warrantyMonths?.toString() || '24',
      imageUrl: p.imageUrl || '',
      initialStockQuantity: p.availableQuantity?.toString() || '10',
      minimumStockThreshold: '5',
      rating: (p.rating || 4.5).toString(),
      compatibleVehicleModelIds: (p.compatibleModels || []).map(m => m.id)
    });
    setUploadError('');
    setMsg(null);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMsg(null);

    if (!formData.categoryId) {
      setMsg({ type: 'error', text: 'Please select a Category for this spare part.' });
      setSubmitting(false);
      return;
    }

    if (!formData.partNumber.trim()) {
      setMsg({ type: 'error', text: 'OEM Part Number is required.' });
      setSubmitting(false);
      return;
    }

    if (!formData.name.trim()) {
      setMsg({ type: 'error', text: 'Product Title is required.' });
      setSubmitting(false);
      return;
    }

    const priceNum = parseFloat(formData.price);
    if (isNaN(priceNum) || priceNum < 0) {
      setMsg({ type: 'error', text: 'Please enter a valid price (non-negative number).' });
      setSubmitting(false);
      return;
    }

    const payload = {
      categoryId: formData.categoryId,
      partNumber: formData.partNumber.trim(),
      name: formData.name.trim(),
      description: formData.description.trim(),
      brand: formData.brand.trim() || 'BMW OEM',
      price: priceNum,
      warrantyMonths: parseInt(formData.warrantyMonths) || 12,
      imageUrl: formData.imageUrl || null,
      initialStock: parseInt(formData.initialStockQuantity) || 10,
      minimumStockThreshold: parseInt(formData.minimumStockThreshold) || 5,
      rating: parseFloat(formData.rating || '4.5'),
      compatibleVehicleModelIds: formData.compatibleVehicleModelIds
    };

    try {
      if (editingProduct) {
        await adminService.updateProduct(editingProduct.id, payload);
        setMsg({ type: 'success', text: 'Product updated successfully!' });
      } else {
        await adminService.createProduct(payload);
        setMsg({ type: 'success', text: 'Product created successfully!' });
      }
      setTimeout(() => {
        setShowModal(false);
        fetchProducts();
      }, 1000);
    } catch (err: any) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Failed to save product' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeactivate = async (id: string) => {
    if (!window.confirm('Are you sure you want to deactivate this spare part?')) return;
    try {
      await adminService.deactivateProduct(id);
      fetchProducts();
    } catch (e) {
      alert('Failed to deactivate product');
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Package className="w-7 h-7 text-red-500" /> BMW Spare Parts Management
          </h1>
          <p className="text-slate-400 text-sm">Add, edit, filter OEM spare parts and inventory levels</p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="flex items-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-lg font-medium text-sm transition-all shadow-lg shadow-red-600/20"
        >
          <Plus className="w-4 h-4" /> Add Spare Part
        </button>
      </div>

      {/* Filters Bar */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 flex flex-col sm:flex-row gap-4 justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search by part number, name, brand..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:border-red-500"
          />
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <button
            onClick={fetchProducts}
            className="p-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition-all"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-900/80 text-xs font-semibold text-slate-400 uppercase border-b border-slate-700">
              <tr>
                <th className="px-6 py-4">Part Info</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">OEM Brand</th>
                <th className="px-6 py-4">Price (₹)</th>
                <th className="px-6 py-4">Stock Status</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/60">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                    <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-red-500 mb-2" />
                    <p>Loading spare parts...</p>
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                    No spare parts found matching search criteria.
                  </td>
                </tr>
              ) : (
                products.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-750/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={getImageUrl(p.imageUrl, p.name)}
                          alt={p.name}
                          onError={handleImageError}
                          className="w-10 h-10 rounded-lg object-cover bg-slate-900 border border-slate-700"
                        />
                        <div>
                          <p className="font-semibold text-white truncate max-w-xs">{p.name}</p>
                          <p className="text-xs text-red-400 font-mono">P/N: {p.partNumber}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 bg-slate-700/60 text-slate-300 rounded border border-slate-600 text-xs font-medium">
                        {p.category?.name || 'General'}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-200">{p.brand}</td>
                    <td className="px-6 py-4 font-bold text-white">₹{p.price?.toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                        p.stockStatus === 'IN_STOCK' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                        p.stockStatus === 'LOW_STOCK' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                        'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      }`}>
                        {p.availableQuantity || 0} units ({p.stockStatus?.replace('_', ' ')})
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {p.status === 'ACTIVE' ? (
                        <span className="inline-flex items-center gap-1 text-xs text-emerald-400 font-medium">
                          <CheckCircle className="w-3.5 h-3.5" /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-slate-500 font-medium">
                          <XCircle className="w-3.5 h-3.5" /> Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenEditModal(p)}
                          className="p-1.5 bg-slate-700 hover:bg-slate-600 text-blue-400 rounded transition-all"
                          title="Edit Part"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeactivate(p.id)}
                          className="p-1.5 bg-slate-700 hover:bg-rose-600/30 text-rose-400 rounded transition-all"
                          title="Deactivate"
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

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 shadow-2xl">
            <h2 className="text-xl font-bold text-white mb-4">
              {editingProduct ? 'Edit Spare Part' : 'Add New BMW Spare Part'}
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Part Number (OEM)</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 34116858652"
                    value={formData.partNumber}
                    onChange={(e) => setFormData({ ...formData, partNumber: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Category</label>
                  <select
                    required
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500"
                  >
                    <option value="">Select Category</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Part Title / Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. BMW Genuine Front Brake Pad Set"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Description</label>
                <textarea
                  rows={3}
                  placeholder="Technical details, specifications..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Brand</label>
                  <input
                    type="text"
                    required
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Price (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="12500"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Warranty (Months)</label>
                  <input
                    type="number"
                    required
                    value={formData.warrantyMonths}
                    onChange={(e) => setFormData({ ...formData, warrantyMonths: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Rating (0.0 - 5.0)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.0"
                    max="5.0"
                    required
                    placeholder="4.5"
                    value={formData.rating}
                    onChange={(e) => setFormData({ ...formData, rating: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-2">Product Image</label>
                
                {formData.imageUrl && (
                  <div className="mb-3 relative w-32 h-32 rounded-lg overflow-hidden border border-slate-700 bg-slate-900 group">
                    <img 
                      src={getImageUrl(formData.imageUrl, formData.name)} 
                      alt="Preview" 
                      onError={handleImageError}
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, imageUrl: '' })}
                      className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-rose-400 text-xs font-semibold transition-opacity"
                    >
                      Remove
                    </button>
                  </div>
                )}

                {!formData.imageUrl && (
                  <div className="relative border-2 border-dashed border-slate-700 hover:border-red-500 rounded-lg p-6 text-center bg-slate-900 transition-all cursor-pointer">
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleImageUpload}
                      disabled={uploading}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <div className="flex flex-col items-center justify-center gap-2">
                      {uploading ? (
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-red-500" />
                      ) : (
                        <Upload className="w-6 h-6 text-slate-400" />
                      )}
                      <p className="text-sm text-slate-300 font-medium">
                        {uploading ? 'Uploading image...' : 'Click to select / upload image'}
                      </p>
                      <p className="text-xs text-slate-500">JPG, PNG, or WEBP (Max 5MB)</p>
                    </div>
                  </div>
                )}

                {uploadError && (
                  <p className="text-xs text-rose-400 mt-1 flex items-center gap-1">
                    <span>⚠️</span> {uploadError}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-2">Compatible BMW Models</label>
                <div className="bg-slate-900 border border-slate-700 rounded-lg p-3 max-h-32 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {vehicleModels.map(model => (
                    <label key={model.id} className="flex items-center gap-2 text-sm text-slate-300 hover:text-white cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={formData.compatibleVehicleModelIds.includes(model.id)}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setFormData(prev => ({
                            ...prev,
                            compatibleVehicleModelIds: checked
                              ? [...prev.compatibleVehicleModelIds, model.id]
                              : prev.compatibleVehicleModelIds.filter(id => id !== model.id)
                          }));
                        }}
                        className="rounded bg-slate-800 border-slate-700 text-red-600 focus:ring-red-500/20 focus:ring-offset-slate-900"
                      />
                      <span>{model.modelName} ({model.modelYear})</span>
                    </label>
                  ))}
                </div>
              </div>

              {!editingProduct && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-700">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Initial Stock Quantity</label>
                    <input
                      type="number"
                      required
                      value={formData.initialStockQuantity}
                      onChange={(e) => setFormData({ ...formData, initialStockQuantity: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Minimum Alert Threshold</label>
                    <input
                      type="number"
                      required
                      value={formData.minimumStockThreshold}
                      onChange={(e) => setFormData({ ...formData, minimumStockThreshold: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500"
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-700">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-sm transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-sm font-medium transition-all disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : editingProduct ? 'Update Part' : 'Create Part'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProducts;
