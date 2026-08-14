import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { orderService } from '../../services/orderService';
import { Order } from '../../types';
import { ClipboardList, Package, Truck, Wrench, ChevronRight, Loader2, AlertCircle } from 'lucide-react';

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'text-slate-400 bg-slate-400/10',
  CONFIRMED: 'text-blue-400 bg-blue-400/10',
  PACKED: 'text-blue-400 bg-blue-400/10',
  READY_FOR_PICKUP: 'text-amber-400 bg-amber-400/10',
  PICKED_UP: 'text-green-400 bg-green-400/10',
  OUT_FOR_DELIVERY: 'text-blue-400 bg-blue-400/10',
  DELIVERED: 'text-green-400 bg-green-400/10',
  TECHNICIAN_ASSIGNED: 'text-purple-400 bg-purple-400/10',
  INSTALLATION_SCHEDULED: 'text-amber-400 bg-amber-400/10',
  INSTALLATION_IN_PROGRESS: 'text-blue-400 bg-blue-400/10',
  INSTALLATION_COMPLETED: 'text-green-400 bg-green-400/10',
  COMPLETED: 'text-green-400 bg-green-400/10',
  CANCELLED: 'text-red-400 bg-red-400/10',
};

const OrderHistory: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      try {
        const data = await orderService.getMyOrders(page, 10);
        setOrders(data.content);
        setTotalPages(data.totalPages);
      } catch (e) {
        setError('Failed to load orders.');
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [page]);

  const formatStatus = (status: string) => status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  const FulfillIcon = ({ type }: { type: string }) => {
    if (type === 'DELIVERY') return <Truck className="w-4 h-4 text-slate-400" />;
    if (type === 'INSTALLATION') return <Wrench className="w-4 h-4 text-slate-400" />;
    return <Package className="w-4 h-4 text-slate-400" />;
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-white mb-6">My Orders</h1>

      {error && (
        <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 mb-4">
          <AlertCircle className="w-4 h-4 text-red-400" />
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-20 bg-slate-800 rounded-xl animate-pulse border border-slate-700" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-16 bg-slate-800 border border-slate-700 rounded-xl">
          <ClipboardList className="w-14 h-14 text-slate-600 mx-auto mb-4" />
          <h3 className="text-white font-semibold text-lg mb-2">No orders yet</h3>
          <p className="text-slate-400 text-sm mb-6">Start shopping for genuine BMW parts</p>
          <Link to="/customer/catalog" className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-lg font-medium transition-all">
            Browse Parts
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map(order => (
            <Link key={order.id} to={`/customer/orders/${order.id}`}
              className="flex items-center gap-4 bg-slate-800 border border-slate-700 hover:border-slate-600 rounded-xl p-4 transition-all group">
              <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center flex-shrink-0">
                <FulfillIcon type={order.fulfillmentType} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 flex-wrap">
                  <p className="text-white font-semibold">#{order.orderNumber}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[order.status] || 'text-slate-400 bg-slate-400/10'}`}>
                    {formatStatus(order.status)}
                  </span>
                </div>
                <p className="text-slate-400 text-sm mt-0.5">
                  {order.items.length} item{order.items.length > 1 ? 's' : ''} · {order.fulfillmentType.replace('_', ' ')} · 
                  {new Date(order.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                </p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-white font-bold">₹{order.totalAmount.toLocaleString('en-IN')}</p>
                <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-white mt-1 ml-auto transition-colors" />
              </div>
            </Link>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center gap-3 mt-6">
          <button onClick={() => setPage(p => p - 1)} disabled={page === 0}
            className="px-4 py-2 bg-slate-800 border border-slate-700 text-slate-300 rounded-lg disabled:opacity-50 hover:bg-slate-700 transition-all text-sm">
            Previous
          </button>
          <span className="px-4 py-2 text-slate-400 text-sm self-center">Page {page + 1} of {totalPages}</span>
          <button onClick={() => setPage(p => p + 1)} disabled={page >= totalPages - 1}
            className="px-4 py-2 bg-slate-800 border border-slate-700 text-slate-300 rounded-lg disabled:opacity-50 hover:bg-slate-700 transition-all text-sm">
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default OrderHistory;
