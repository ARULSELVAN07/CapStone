import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminService } from '../../services/adminService';
import {
  Package, Boxes, ClipboardList, AlertTriangle, Users, TrendingUp,
  ShoppingCart, Wrench, Truck, ArrowRight, RefreshCw, Loader2
} from 'lucide-react';

interface DashboardStats {
  totalOrders?: number;
  pendingOrders?: number;
  totalProducts?: number;
  lowStockItems?: number;
  totalCustomers?: number;
  totalRevenue?: number;
  todayOrders?: number;
  completedOrders?: number;
}

const StatCard: React.FC<{
  label: string; value: string | number; icon: React.FC<any>; color: string;
  bg: string; link?: string; description?: string;
}> = ({ label, value, icon: Icon, color, bg, link, description }) => (
  <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 hover:border-slate-600 transition-all">
    <div className="flex items-start justify-between">
      <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center`}>
        <Icon className={`w-5 h-5 ${color}`} />
      </div>
      {link && (
        <Link to={link} className="text-slate-500 hover:text-blue-400 transition-colors">
          <ArrowRight className="w-4 h-4" />
        </Link>
      )}
    </div>
    <p className="text-3xl font-bold text-white mt-3">{value}</p>
    <p className="text-slate-400 text-sm mt-1">{label}</p>
    {description && <p className="text-slate-500 text-xs mt-0.5">{description}</p>}
  </div>
);

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = async () => {
    try {
      const data = await adminService.getDashboardStats();
      setStats(data || {});
    } catch (e) {
      // Fallback empty stats
      setStats({});
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchStats(); }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchStats();
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-32 bg-slate-800 rounded-xl animate-pulse border border-slate-700" />
          ))}
        </div>
      </div>
    );
  }

  const statCards = [
    { label: 'Total Orders', value: stats.totalOrders ?? 0, icon: ClipboardList, color: 'text-blue-400', bg: 'bg-blue-400/10', link: '/admin/orders' },
    { label: 'Pending Orders', value: stats.pendingOrders ?? 0, icon: ShoppingCart, color: 'text-amber-400', bg: 'bg-amber-400/10', link: '/admin/orders', description: 'Require action' },
    { label: 'Total Products', value: stats.totalProducts ?? 0, icon: Package, color: 'text-purple-400', bg: 'bg-purple-400/10', link: '/admin/products' },
    { label: 'Low Stock Items', value: stats.lowStockItems ?? 0, icon: AlertTriangle, color: 'text-red-400', bg: 'bg-red-400/10', link: '/admin/low-stock', description: 'Need restocking' },
    { label: 'Total Customers', value: stats.totalCustomers ?? 0, icon: Users, color: 'text-green-400', bg: 'bg-green-400/10', link: '/admin/users' },
    { label: 'Revenue', value: stats.totalRevenue ? `₹${(stats.totalRevenue / 1000).toFixed(0)}K` : '₹0', icon: TrendingUp, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
    { label: "Today's Orders", value: stats.todayOrders ?? 0, icon: Boxes, color: 'text-cyan-400', bg: 'bg-cyan-400/10', link: '/admin/orders' },
    { label: 'Completed Orders', value: stats.completedOrders ?? 0, icon: Package, color: 'text-teal-400', bg: 'bg-teal-400/10' },
  ];

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
          <p className="text-slate-400 text-sm mt-1">BMW SpareHub Operations Overview</p>
        </div>
        <button onClick={handleRefresh} disabled={refreshing}
          className="flex items-center gap-2 bg-slate-800 border border-slate-700 hover:border-slate-600 text-slate-300 px-4 py-2 rounded-lg text-sm transition-all">
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((card, i) => (
          <StatCard key={i} {...card} />
        ))}
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link to="/admin/orders" className="group flex items-center gap-4 bg-slate-800 border border-slate-700 hover:border-blue-500/50 rounded-xl p-5 transition-all">
          <div className="w-12 h-12 bg-blue-600/10 group-hover:bg-blue-600/20 rounded-xl flex items-center justify-center transition-colors">
            <ClipboardList className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <p className="text-white font-semibold">Manage Orders</p>
            <p className="text-slate-400 text-sm">Process & track orders</p>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-blue-400 ml-auto transition-colors" />
        </Link>

        <Link to="/admin/inventory" className="group flex items-center gap-4 bg-slate-800 border border-slate-700 hover:border-amber-500/50 rounded-xl p-5 transition-all">
          <div className="w-12 h-12 bg-amber-600/10 group-hover:bg-amber-600/20 rounded-xl flex items-center justify-center transition-colors">
            <Boxes className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <p className="text-white font-semibold">Inventory</p>
            <p className="text-slate-400 text-sm">Manage stock levels</p>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-amber-400 ml-auto transition-colors" />
        </Link>

        <Link to="/admin/products" className="group flex items-center gap-4 bg-slate-800 border border-slate-700 hover:border-purple-500/50 rounded-xl p-5 transition-all">
          <div className="w-12 h-12 bg-purple-600/10 group-hover:bg-purple-600/20 rounded-xl flex items-center justify-center transition-colors">
            <Package className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <p className="text-white font-semibold">Products</p>
            <p className="text-slate-400 text-sm">Add & manage parts</p>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-purple-400 ml-auto transition-colors" />
        </Link>
      </div>
    </div>
  );
};

export default AdminDashboard;
