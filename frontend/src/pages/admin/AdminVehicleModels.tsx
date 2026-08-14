import React, { useEffect, useState } from 'react';
import adminService from '../../services/adminService';
import { VehicleModel } from '../../types';
import { Car, Plus, Edit2, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';

export const AdminVehicleModels: React.FC = () => {
  const [models, setModels] = useState<VehicleModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingModel, setEditingModel] = useState<VehicleModel | null>(null);

  const [formData, setFormData] = useState({
    modelName: '',
    modelCode: '',
    modelYear: '2023',
    engineType: '2.0L TwinPower Turbo Inline-4',
    fuelType: 'PETROL'
  });
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchModels = async () => {
    setLoading(true);
    try {
      const data = await adminService.getVehicleModels();
      setModels(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchModels();
  }, []);

  const handleOpenAdd = () => {
    setEditingModel(null);
    setFormData({
      modelName: '',
      modelCode: '',
      modelYear: '2023',
      engineType: '2.0L TwinPower Turbo Inline-4',
      fuelType: 'PETROL'
    });
    setMsg(null);
    setShowModal(true);
  };

  const handleOpenEdit = (m: VehicleModel) => {
    setEditingModel(m);
    setFormData({
      modelName: m.modelName,
      modelCode: m.modelCode,
      modelYear: m.modelYear.toString(),
      engineType: m.engineType,
      fuelType: m.fuelType
    });
    setMsg(null);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMsg(null);

    const payload = {
      modelName: formData.modelName,
      modelCode: formData.modelCode,
      modelYear: parseInt(formData.modelYear),
      engineType: formData.engineType,
      fuelType: formData.fuelType
    };

    try {
      if (editingModel) {
        await adminService.updateVehicleModel(editingModel.id, payload);
        setMsg({ type: 'success', text: 'Vehicle model updated!' });
      } else {
        await adminService.createVehicleModel(payload);
        setMsg({ type: 'success', text: 'Vehicle model added!' });
      }
      setTimeout(() => {
        setShowModal(false);
        fetchModels();
      }, 1000);
    } catch (err: any) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Failed to save vehicle model' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Car className="w-7 h-7 text-red-500" /> BMW Vehicle Models
          </h1>
          <p className="text-slate-400 text-sm">Catalog of supported BMW Series, Chassis codes (G20, G30, G05, F30...), and Engine types</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-lg font-medium text-sm transition-all shadow-lg shadow-red-600/20"
        >
          <Plus className="w-4 h-4" /> Add BMW Model
        </button>
      </div>

      <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-900/80 text-xs font-semibold text-slate-400 uppercase border-b border-slate-700">
              <tr>
                <th className="px-6 py-4">Model Name</th>
                <th className="px-6 py-4">Chassis Code</th>
                <th className="px-6 py-4">Year</th>
                <th className="px-6 py-4">Engine Type</th>
                <th className="px-6 py-4">Fuel Type</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/60">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-red-500 mb-2" />
                    <p>Loading BMW models...</p>
                  </td>
                </tr>
              ) : models.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    No BMW models registered yet.
                  </td>
                </tr>
              ) : (
                models.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-750/50 transition-colors">
                    <td className="px-6 py-4 font-semibold text-white">{m.modelName}</td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 bg-red-600/15 text-red-400 border border-red-500/30 rounded font-mono text-xs font-bold">
                        {m.modelCode}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-200">{m.modelYear}</td>
                    <td className="px-6 py-4 text-slate-300">{m.engineType}</td>
                    <td className="px-6 py-4 font-semibold text-xs text-blue-400">{m.fuelType}</td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleOpenEdit(m)}
                        className="p-1.5 bg-slate-700 hover:bg-slate-600 text-blue-400 rounded transition-all"
                        title="Edit Model"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
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
          <div className="bg-slate-800 border border-slate-700 rounded-xl w-full max-w-lg p-6 shadow-2xl">
            <h2 className="text-xl font-bold text-white mb-4">
              {editingModel ? 'Edit BMW Model' : 'Add BMW Vehicle Model'}
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
                <label className="block text-xs font-medium text-slate-300 mb-1">Model Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. BMW 3 Series 330i Gran Sedan"
                  value={formData.modelName}
                  onChange={(e) => setFormData({ ...formData, modelName: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Chassis / Model Code</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. G20"
                    value={formData.modelCode}
                    onChange={(e) => setFormData({ ...formData, modelCode: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Model Year</label>
                  <input
                    type="number"
                    required
                    placeholder="2023"
                    value={formData.modelYear}
                    onChange={(e) => setFormData({ ...formData, modelYear: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Engine Specification</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. B48 2.0L Turbo"
                    value={formData.engineType}
                    onChange={(e) => setFormData({ ...formData, engineType: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Fuel Type</label>
                  <select
                    value={formData.fuelType}
                    onChange={(e) => setFormData({ ...formData, fuelType: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500"
                  >
                    <option value="PETROL">PETROL</option>
                    <option value="DIESEL">DIESEL</option>
                    <option value="HYBRID">HYBRID</option>
                    <option value="ELECTRIC">ELECTRIC</option>
                  </select>
                </div>
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
                  {submitting ? 'Saving...' : editingModel ? 'Update Model' : 'Add Model'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminVehicleModels;
