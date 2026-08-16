import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../store/AuthContext';
import { vehicleService } from '../../services/vehicleService';
import { orderService } from '../../services/orderService';
import { Car, Package, ClipboardList, ShoppingCart, Plus, ChevronRight, CheckCircle, Clock, Truck, Wrench } from 'lucide-react';
import { Order, Vehicle } from '../../types';
import TrendingSection from './TrendingSection';
import DashboardSlider from './DashboardSlider';

const CustomerDashboard: React.FC = () => {
  const { user, activeVehicle, setActiveVehicle } = useAuth();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [vehiclesData, ordersData] = await Promise.all([
          vehicleService.getUserVehicles(),
          orderService.getMyOrders(0, 5),
        ]);
        setVehicles(vehiclesData);
        setRecentOrders(ordersData.content);
        if (!activeVehicle && vehiclesData.length > 0) {
          setActiveVehicle(vehiclesData[0]);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getStatusColor = (status: string) => {
    if (['DELIVERED', 'COMPLETED', 'INSTALLATION_COMPLETED'].includes(status)) return 'text-green-400 bg-green-400/10';
    if (['CANCELLED'].includes(status)) return 'text-red-400 bg-red-400/10';
    if (['OUT_FOR_DELIVERY', 'INSTALLATION_IN_PROGRESS'].includes(status)) return 'text-blue-400 bg-blue-400/10';
    return 'text-amber-400 bg-amber-400/10';
  };

  const formatStatus = (status: string) =>
    status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  const stats = [
    { label: 'My Vehicles', value: vehicles.length, icon: Car, color: 'text-blue-400', bg: 'bg-blue-400/10', link: '/customer/vehicles' },
    { label: 'Total Orders', value: recentOrders.length, icon: ClipboardList, color: 'text-purple-400', bg: 'bg-purple-400/10', link: '/customer/orders' },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Hero Showcase Slider */}
      <DashboardSlider />

      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-600/20 to-slate-800 border border-blue-600/20 rounded-2xl p-6">
        <h1 className="text-2xl font-bold text-white">Welcome back, {user?.name?.split(' ')[0]}! 👋</h1>
        <p className="text-slate-400 mt-1">Find and order genuine BMW spare parts for your vehicle.</p>
        {activeVehicle && (
          <div className="mt-4 inline-flex items-center gap-2 bg-blue-600/20 border border-blue-500/30 rounded-lg px-4 py-2">
            <Car className="w-4 h-4 text-blue-400" />
            <span className="text-blue-300 text-sm font-medium">
              Active: {activeVehicle.vehicleModel.modelName} ({activeVehicle.vehicleModel.modelYear})
            </span>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link to="/customer/catalog" className="group bg-slate-800 border border-slate-700 hover:border-blue-500/50 rounded-xl p-5 flex flex-col gap-3 transition-all hover:shadow-lg hover:shadow-blue-500/10">
          <div className="w-10 h-10 bg-blue-600/10 rounded-lg flex items-center justify-center group-hover:bg-blue-600/20 transition-colors">
            <Package className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <p className="text-white font-semibold">Browse Parts</p>
            <p className="text-slate-500 text-xs mt-0.5">Search compatible parts</p>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-blue-400 transition-colors self-end mt-auto" />
        </Link>

        <Link to="/customer/cart" className="group bg-slate-800 border border-slate-700 hover:border-purple-500/50 rounded-xl p-5 flex flex-col gap-3 transition-all hover:shadow-lg hover:shadow-purple-500/10">
          <div className="w-10 h-10 bg-purple-600/10 rounded-lg flex items-center justify-center group-hover:bg-purple-600/20 transition-colors">
            <ShoppingCart className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <p className="text-white font-semibold">My Cart</p>
            <p className="text-slate-500 text-xs mt-0.5">View & checkout</p>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-purple-400 transition-colors self-end mt-auto" />
        </Link>

        <Link to="/customer/orders" className="group bg-slate-800 border border-slate-700 hover:border-green-500/50 rounded-xl p-5 flex flex-col gap-3 transition-all hover:shadow-lg hover:shadow-green-500/10">
          <div className="w-10 h-10 bg-green-600/10 rounded-lg flex items-center justify-center group-hover:bg-green-600/20 transition-colors">
            <ClipboardList className="w-5 h-5 text-green-400" />
          </div>
          <div>
            <p className="text-white font-semibold">My Orders</p>
            <p className="text-slate-500 text-xs mt-0.5">Track your orders</p>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-green-400 transition-colors self-end mt-auto" />
        </Link>

        <Link to="/customer/vehicles" className="group bg-slate-800 border border-slate-700 hover:border-amber-500/50 rounded-xl p-5 flex flex-col gap-3 transition-all hover:shadow-lg hover:shadow-amber-500/10">
          <div className="w-10 h-10 bg-amber-600/10 rounded-lg flex items-center justify-center group-hover:bg-amber-600/20 transition-colors">
            <Car className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <p className="text-white font-semibold">My Vehicles</p>
            <p className="text-slate-500 text-xs mt-0.5">Manage BMW vehicles</p>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-amber-400 transition-colors self-end mt-auto" />
        </Link>
      </div>

      {/* Trending Products Recommendation Section */}
      <TrendingSection activeVehicle={activeVehicle} />

      {/* Vehicles & Recent Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* My Vehicles */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl">
          <div className="flex items-center justify-between p-5 border-b border-slate-700">
            <h2 className="text-white font-semibold">My Vehicles</h2>
            <Link to="/customer/vehicles" className="text-blue-400 text-sm hover:text-blue-300 flex items-center gap-1">
              <Plus className="w-4 h-4" /> Add Vehicle
            </Link>
          </div>
          <div className="p-4 space-y-3">
            {loading ? (
              Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="h-16 bg-slate-700 rounded-lg animate-pulse" />
              ))
            ) : vehicles.length === 0 ? (
              <div className="text-center py-8">
                <Car className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400 text-sm">No vehicles added yet</p>
                <Link to="/customer/vehicles" className="mt-3 inline-flex items-center gap-1 text-blue-400 text-sm hover:text-blue-300">
                  <Plus className="w-4 h-4" /> Add your BMW
                </Link>
              </div>
            ) : (
              vehicles.map(vehicle => (
                <div
                  key={vehicle.id}
                  onClick={() => setActiveVehicle(vehicle)}
                  className={`flex items-center gap-4 p-3 rounded-lg cursor-pointer transition-all ${
                    activeVehicle?.id === vehicle.id
                      ? 'bg-blue-600/10 border border-blue-500/30'
                      : 'bg-slate-700/50 hover:bg-slate-700 border border-transparent'
                  }`}
                >
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center ${
                    activeVehicle?.id === vehicle.id ? 'bg-blue-600' : 'bg-slate-600'
                  }`}>
                    <Car className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium">{vehicle.vehicleModel.modelName}</p>
                    <p className="text-slate-400 text-xs">{vehicle.vehicleModel.modelYear} · {vehicle.registrationNumber || vehicle.vin}</p>
                  </div>
                  {activeVehicle?.id === vehicle.id && (
                    <span className="text-xs text-blue-400 font-medium">Active</span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Orders */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl">
          <div className="flex items-center justify-between p-5 border-b border-slate-700">
            <h2 className="text-white font-semibold">Recent Orders</h2>
            <Link to="/customer/orders" className="text-blue-400 text-sm hover:text-blue-300">View all</Link>
          </div>
          <div className="p-4 space-y-3">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-16 bg-slate-700 rounded-lg animate-pulse" />
              ))
            ) : recentOrders.length === 0 ? (
              <div className="text-center py-8">
                <ClipboardList className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400 text-sm">No orders placed yet</p>
                <Link to="/customer/catalog" className="mt-3 inline-flex items-center gap-1 text-blue-400 text-sm hover:text-blue-300">
                  Browse parts
                </Link>
              </div>
            ) : (
              recentOrders.map(order => (
                <Link
                  key={order.id}
                  to={`/customer/orders/${order.id}`}
                  className="flex items-center gap-4 p-3 rounded-lg bg-slate-700/50 hover:bg-slate-700 transition-all group"
                >
                  <div className="w-9 h-9 rounded-full bg-slate-600 flex items-center justify-center">
                    {order.fulfillmentType === 'DELIVERY' ? <Truck className="w-4 h-4 text-slate-300" /> :
                     order.fulfillmentType === 'INSTALLATION' ? <Wrench className="w-4 h-4 text-slate-300" /> :
                     <Package className="w-4 h-4 text-slate-300" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium">#{order.orderNumber}</p>
                    <p className="text-slate-400 text-xs">₹{order.totalAmount.toLocaleString('en-IN')}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(order.status)}`}>
                    {formatStatus(order.status)}
                  </span>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerDashboard;
