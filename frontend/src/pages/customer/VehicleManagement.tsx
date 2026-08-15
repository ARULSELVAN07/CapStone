import React, { useEffect, useState } from 'react';
import { useAuth } from '../../store/AuthContext';
import { vehicleService } from '../../services/vehicleService';
import { Vehicle, VehicleModel } from '../../types';
import { Car, Plus, Trash2, CheckCircle, AlertCircle, Loader2, X } from 'lucide-react';

const VehicleManagement: React.FC = () => {
  const { activeVehicle, setActiveVehicle } = useAuth();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [models, setModels] = useState<VehicleModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState({
    vehicleModelId: '',
    vin: '',
    registrationNumber: '',
    purchaseYear: new Date().getFullYear(),
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [vehiclesData, modelsData] = await Promise.all([
        vehicleService.getUserVehicles(),
        vehicleService.getVehicleModels(),
      ]);
      setVehicles(vehiclesData);
      setModels(modelsData);
      if (vehiclesData.length > 0 && (!activeVehicle || !vehiclesData.some(v => v.id === activeVehicle.id))) {
        setActiveVehicle(vehiclesData[0]);
      }
    } catch (e) {
      setError('Failed to load vehicles.');
    } finally {
      setLoading(false);
    }
  };

  const handleSetActive = (vehicle: Vehicle) => {
    setActiveVehicle(vehicle);
    setSuccess(`Set ${vehicle.vehicleModel.modelName} as your active BMW vehicle!`);
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleAddVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const newVehicle = await vehicleService.addVehicle({
        vehicleModelId: form.vehicleModelId,
        vin: form.vin,
        registrationNumber: form.registrationNumber || undefined,
        purchaseYear: form.purchaseYear,
      });
      setVehicles(prev => [...prev, newVehicle]);
      setSuccess('Vehicle added successfully!');
      setShowModal(false);
      setForm({ vehicleModelId: '', vin: '', registrationNumber: '', purchaseYear: new Date().getFullYear() });
      setActiveVehicle(newVehicle);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to add vehicle.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Remove this vehicle from your account?')) return;
    try {
      await vehicleService.deleteVehicle(id);
      const remaining = vehicles.filter(v => v.id !== id);
      setVehicles(remaining);
      if (activeVehicle?.id === id) {
        setActiveVehicle(remaining.length > 0 ? remaining[0] : null);
      }
      setSuccess('Vehicle removed from your account.');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to remove vehicle.');
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">My Vehicles</h1>
          <p className="text-slate-400 text-sm mt-1">Manage your registered BMW vehicles</p>
        </div>
        <button onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-medium px-4 py-2.5 rounded-lg transition-all">
          <Plus className="w-4 h-4" /> Add Vehicle
        </button>
      </div>

      {success && (
        <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/30 rounded-lg px-4 py-3 mb-4">
          <CheckCircle className="w-4 h-4 text-green-400" />
          <p className="text-sm text-green-400">{success}</p>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 mb-4">
          <AlertCircle className="w-4 h-4 text-red-400" />
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-48 bg-slate-800 rounded-xl animate-pulse border border-slate-700" />
          ))}
        </div>
      ) : vehicles.length === 0 ? (
        <div className="text-center py-16 bg-slate-800 border border-slate-700 rounded-xl">
          <Car className="w-14 h-14 text-slate-600 mx-auto mb-4" />
          <h3 className="text-white font-semibold text-lg mb-2">No vehicles registered</h3>
          <p className="text-slate-400 text-sm mb-6">Add your BMW to get personalized part recommendations</p>
          <button onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-lg font-medium transition-all">
            <Plus className="w-4 h-4" /> Add Your BMW
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {vehicles.map(vehicle => (
            <div key={vehicle.id}
              className={`bg-slate-800 border rounded-xl p-5 transition-all ${
                activeVehicle?.id === vehicle.id ? 'border-blue-500 ring-1 ring-blue-500/30' : 'border-slate-700 hover:border-slate-600'
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  activeVehicle?.id === vehicle.id ? 'bg-blue-600' : 'bg-slate-700'
                }`}>
                  <Car className="w-5 h-5 text-white" />
                </div>
                {activeVehicle?.id === vehicle.id && (
                  <span className="text-xs text-blue-400 bg-blue-400/10 border border-blue-400/20 px-2 py-1 rounded-full font-medium">
                    Active
                  </span>
                )}
              </div>
              
              <h3 className="text-white font-semibold text-base mb-1">{vehicle.vehicleModel.modelName}</h3>
              <p className="text-slate-400 text-sm">{vehicle.vehicleModel.modelYear} · {vehicle.vehicleModel.engineType}</p>
              
              <div className="mt-3 space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">VIN</span>
                  <span className="text-slate-300 font-mono">{vehicle.vin}</span>
                </div>
                {vehicle.registrationNumber && (
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Reg. No.</span>
                    <span className="text-slate-300">{vehicle.registrationNumber}</span>
                  </div>
                )}
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Fuel</span>
                  <span className="text-slate-300">{vehicle.vehicleModel.fuelType}</span>
                </div>
              </div>

              <div className="flex gap-2 mt-4">
                {activeVehicle?.id !== vehicle.id && (
                  <button onClick={() => handleSetActive(vehicle)}
                    className="flex-1 text-sm bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 py-2 rounded-lg font-medium transition-all">
                    Set Active
                  </button>
                )}
                <button onClick={() => handleDelete(vehicle.id)}
                  className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Vehicle Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white">Add BMW Vehicle</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2 mb-4">
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                <p className="text-xs text-red-400">{error}</p>
              </div>
            )}

            <form onSubmit={handleAddVehicle} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">BMW Model *</label>
                <select value={form.vehicleModelId}
                  onChange={e => setForm(p => ({ ...p, vehicleModelId: e.target.value }))}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  required>
                  <option value="">Select model...</option>
                  {models.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.modelName} ({m.modelYear}) — {m.fuelType}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">VIN Number *</label>
                <input type="text" value={form.vin}
                  onChange={e => setForm(p => ({ ...p, vin: e.target.value.toUpperCase() }))}
                  placeholder="WBA3A5G59DNP26082"
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white font-mono placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  maxLength={17} required />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Registration Number</label>
                <input type="text" value={form.registrationNumber}
                  onChange={e => setForm(p => ({ ...p, registrationNumber: e.target.value.toUpperCase() }))}
                  placeholder="MH12AB1234"
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all" />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Purchase Year</label>
                <input type="number" value={form.purchaseYear}
                  onChange={e => setForm(p => ({ ...p, purchaseYear: parseInt(e.target.value) }))}
                  min={2000} max={new Date().getFullYear()}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all" />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 bg-slate-700 hover:bg-slate-600 text-slate-300 font-medium py-2.5 rounded-lg transition-all">
                  Cancel
                </button>
                <button type="submit" disabled={submitting}
                  className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white font-medium py-2.5 rounded-lg transition-all flex items-center justify-center gap-2">
                  {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Adding...</> : 'Add Vehicle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default VehicleManagement;
