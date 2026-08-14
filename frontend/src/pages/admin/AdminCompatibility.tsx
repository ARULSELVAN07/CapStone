import React, { useEffect, useState } from 'react';
import adminService from '../../services/adminService';
import productService from '../../services/productService';
import { Product, VehicleModel } from '../../types';
import { Link2, Plus, Trash2, CheckCircle, AlertCircle, Search } from 'lucide-react';

export const AdminCompatibility: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [vehicleModels, setVehicleModels] = useState<VehicleModel[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [selectedModelId, setSelectedModelId] = useState<string>('');
  const [notes, setNotes] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [prodsRes, modelsRes] = await Promise.all([
        productService.getProducts({ size: 100 }),
        adminService.getVehicleModels()
      ]);
      setProducts(prodsRes.content);
      setVehicleModels(modelsRes);
      if (prodsRes.content.length > 0 && !selectedProductId) {
        setSelectedProductId(prodsRes.content[0].id);
      }
      if (modelsRes.length > 0 && !selectedModelId) {
        setSelectedModelId(modelsRes[0].id);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddCompatibility = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId || !selectedModelId) return;
    setSubmitting(true);
    setMsg(null);
    try {
      await adminService.addCompatibility(selectedProductId, selectedModelId, notes);
      setMsg({ type: 'success', text: 'Vehicle compatibility mapping added successfully!' });
      setNotes('');
      fetchData();
    } catch (err: any) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Failed to map compatibility' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveCompatibility = async (prodId: string, modelId: string) => {
    if (!window.confirm('Remove compatibility mapping?')) return;
    try {
      await adminService.removeCompatibility(prodId, modelId);
      fetchData();
    } catch (e) {
      alert('Failed to remove compatibility');
    }
  };

  const currentProduct = products.find((p) => p.id === selectedProductId);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Link2 className="w-7 h-7 text-red-500" /> Part Compatibility Matrix
        </h1>
        <p className="text-slate-400 text-sm">Map OEM spare parts to supported BMW Series chassis and engine models</p>
      </div>

      {/* Mapping Form */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 shadow-xl">
        <h2 className="text-lg font-bold text-white mb-4">Add Compatibility Link</h2>

        {msg && (
          <div className={`mb-4 p-3 rounded-lg flex items-center gap-2 text-sm ${
            msg.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
          }`}>
            {msg.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            {msg.text}
          </div>
        )}

        <form onSubmit={handleAddCompatibility} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Select Spare Part</label>
            <select
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>{p.name} ({p.partNumber})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Select BMW Vehicle Model</label>
            <select
              value={selectedModelId}
              onChange={(e) => setSelectedModelId(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500"
            >
              {vehicleModels.map((m) => (
                <option key={m.id} value={m.id}>{m.modelName} [{m.modelCode}] ({m.modelYear})</option>
              ))}
            </select>
          </div>

          <div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 px-5 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-sm font-medium transition-all disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              {submitting ? 'Linking...' : 'Link Compatibility'}
            </button>
          </div>
        </form>
      </div>

      {/* Existing Compatibility Table */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden shadow-xl">
        <div className="px-6 py-4 border-b border-slate-700 flex items-center justify-between">
          <h3 className="text-base font-bold text-white">Current Part Compatibility Mappings</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-900/80 text-xs font-semibold text-slate-400 uppercase border-b border-slate-700">
              <tr>
                <th className="px-6 py-4">Part Name</th>
                <th className="px-6 py-4">OEM Part Number</th>
                <th className="px-6 py-4">Compatible BMW Model</th>
                <th className="px-6 py-4">Chassis Code</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/60">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">Loading mappings...</td>
                </tr>
              ) : products.filter(p => p.compatibleModels && p.compatibleModels.length > 0).length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                    No active compatibility mappings.
                  </td>
                </tr>
              ) : (
                products.flatMap((p) =>
                  (p.compatibleModels || []).map((m) => (
                    <tr key={`${p.id}-${m.id}`} className="hover:bg-slate-750/50 transition-colors">
                      <td className="px-6 py-4 font-semibold text-white">{p.name}</td>
                      <td className="px-6 py-4 font-mono text-xs text-red-400">{p.partNumber}</td>
                      <td className="px-6 py-4 text-slate-200">{m.modelName} ({m.modelYear})</td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 bg-red-600/15 text-red-400 border border-red-500/30 rounded font-mono text-xs font-bold">
                          {m.modelCode}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleRemoveCompatibility(p.id, m.id)}
                          className="p-1.5 bg-slate-700 hover:bg-rose-600/30 text-rose-400 rounded transition-all"
                          title="Remove Mapping"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminCompatibility;
