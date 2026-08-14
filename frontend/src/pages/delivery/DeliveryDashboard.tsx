import React, { useEffect, useState } from 'react';
import deliveryService from '../../services/deliveryService';
import { useAuth } from '../../store/AuthContext';
import { Truck, CheckCircle2, Clock, MapPin, ArrowRight, ShieldCheck, Navigation } from 'lucide-react';
import { Link } from 'react-router-dom';

export const DeliveryDashboard: React.FC = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDeliveryData = async () => {
      setLoading(true);
      try {
        const [profData, delRes] = await Promise.all([
          deliveryService.getProfile(),
          deliveryService.getMyDeliveries({ size: 10 })
        ]);
        setProfile(profData);
        setDeliveries(delRes.content || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    loadDeliveryData();
  }, []);

  const pendingCount = deliveries.filter(d => d.deliveryStatus === 'PENDING' || d.deliveryStatus === 'ASSIGNED').length;
  const outForDeliveryCount = deliveries.filter(d => d.deliveryStatus === 'OUT_FOR_DELIVERY').length;
  const deliveredCount = deliveries.filter(d => d.deliveryStatus === 'DELIVERED').length;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-emerald-900/60 via-slate-800 to-slate-800 border border-emerald-500/30 rounded-xl p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs mb-1">
            <ShieldCheck className="w-4 h-4" /> BMW Logistics & Delivery Operations
          </div>
          <h1 className="text-2xl font-bold text-white">Welcome back, {user?.name}!</h1>
          <p className="text-slate-400 text-sm mt-1">
            Employee ID: <span className="font-mono text-emerald-400 font-bold">{user?.employeeId || profile?.employeeId || 'DEL-505'}</span> • Region: Southern Logistics Hub
          </p>
        </div>

        <Link
          to="/delivery/orders"
          className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium text-sm transition-all shadow-lg shadow-emerald-600/20"
        >
          View My Deliveries <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 shadow-lg flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-400">Assigned / Pending</p>
            <p className="text-2xl font-extrabold text-white">{pendingCount}</p>
          </div>
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 shadow-lg flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
            <Truck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-400">Out For Delivery</p>
            <p className="text-2xl font-extrabold text-white">{outForDeliveryCount}</p>
          </div>
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 shadow-lg flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-400">Completed Deliveries</p>
            <p className="text-2xl font-extrabold text-white">{deliveredCount}</p>
          </div>
        </div>
      </div>

      {/* Recent Deliveries */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden shadow-xl">
        <div className="px-6 py-4 border-b border-slate-700 flex items-center justify-between">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Truck className="w-5 h-5 text-emerald-500" /> Active Delivery Assignments
          </h2>
          <Link to="/delivery/orders" className="text-xs text-emerald-400 hover:underline font-semibold">
            View All Deliveries
          </Link>
        </div>

        <div className="divide-y divide-slate-700/60">
          {loading ? (
            <div className="p-8 text-center text-slate-500">Loading delivery tasks...</div>
          ) : deliveries.length === 0 ? (
            <div className="p-8 text-center text-slate-400">No delivery orders assigned currently.</div>
          ) : (
            deliveries.slice(0, 5).map((d) => (
              <div key={d.id} className="p-6 hover:bg-slate-750/50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <span className="font-mono text-emerald-400 font-bold text-sm">Delivery #{d.id?.substring(0, 8)}</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                      d.deliveryStatus === 'DELIVERED' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                      d.deliveryStatus === 'OUT_FOR_DELIVERY' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                      'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    }`}>
                      {d.deliveryStatus}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-white">
                    Order #{d.order?.orderNumber || 'SP-ORD-02'}
                  </p>
                  <p className="text-xs text-slate-400 mt-1 flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-emerald-400" /> Destination: {d.deliveryAddress?.addressLine1 || 'Koramangala, Bengaluru'}
                  </p>
                </div>

                <Link
                  to="/delivery/orders"
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-emerald-400 rounded-lg text-xs font-medium transition-all text-center"
                >
                  Update Delivery & Proof
                </Link>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default DeliveryDashboard;
