import React, { useEffect, useState } from 'react';
import { adminService } from '../../services/adminService';
import { Order, TechnicianInfo, UserProfile } from '../../types';
import {
  ClipboardList, Search, ChevronLeft, ChevronRight, Loader2, AlertCircle,
  Truck, Wrench, Package, Eye, X, Check, User, Calendar, Clock
} from 'lucide-react';

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

const DELIVERY_STATUSES = ['CONFIRMED', 'PACKED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'COMPLETED'];
const PICKUP_STATUSES = ['CONFIRMED', 'PACKED', 'READY_FOR_PICKUP', 'PICKED_UP', 'COMPLETED'];
const INSTALLATION_STATUSES = ['CONFIRMED', 'PACKED', 'TECHNICIAN_ASSIGNED', 'INSTALLATION_SCHEDULED', 'INSTALLATION_IN_PROGRESS', 'INSTALLATION_COMPLETED', 'COMPLETED'];

const AdminOrders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [error, setError] = useState('');

  // Selected order for modal
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [modalType, setModalType] = useState<'status' | 'assign-tech' | 'assign-del' | null>(null);
  const [newStatus, setNewStatus] = useState('');
  const [notes, setNotes] = useState('');
  const [technicians, setTechnicians] = useState<any[]>([]);
  const [deliveryExecs, setDeliveryExecs] = useState<UserProfile[]>([]);
  const [selectedPerson, setSelectedPerson] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledSlot, setScheduledSlot] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [searchInput, setSearchInput] = useState('');

  useEffect(() => { fetchOrders(); }, [page, statusFilter, search]);

  const fetchOrders = async () => {
    setLoading(true);
    setError('');
    try {
      const params: any = { page, size: 15 };
      if (statusFilter) params.status = statusFilter;
      if (search) params.search = search;
      const data = await adminService.getAllOrders(params);
      setOrders(data.content);
      setTotalPages(data.totalPages);
    } catch (e) {
      setError('Failed to load orders.');
    } finally {
      setLoading(false);
    }
  };

  const openStatusModal = (order: Order) => {
    setSelectedOrder(order);
    setNewStatus('');
    setNotes('');
    setModalType('status');
  };

  const openAssignTechModal = async (order: Order) => {
    setSelectedOrder(order);
    setModalType('assign-tech');
    setSelectedPerson('');
    setScheduledDate('');
    setScheduledSlot('09:00 AM - 11:00 AM');
    try {
      const data = await adminService.getTechnicians();
      setTechnicians(data);
    } catch (e) { setTechnicians([]); }
  };

  const openAssignDelModal = async (order: Order) => {
    setSelectedOrder(order);
    setModalType('assign-del');
    setSelectedPerson('');
    try {
      const data = await adminService.getDeliveryExecutives();
      setDeliveryExecs(data);
    } catch (e) { setDeliveryExecs([]); }
  };

  const handleStatusUpdate = async () => {
    if (!selectedOrder || !newStatus) return;
    setSubmitting(true);
    try {
      const updated = await adminService.updateOrderStatus(selectedOrder.id, newStatus, notes);
      setOrders(prev => prev.map(o => o.id === updated.id ? updated : o));
      setModalType(null);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to update status.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAssignTech = async () => {
    if (!selectedOrder || !selectedPerson) return;
    setSubmitting(true);
    try {
      const updated = await adminService.assignTechnician(selectedOrder.id, selectedPerson, scheduledDate, scheduledSlot);
      setOrders(prev => prev.map(o => o.id === updated.id ? updated : o));
      setModalType(null);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to assign technician.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAssignDel = async () => {
    if (!selectedOrder || !selectedPerson) return;
    setSubmitting(true);
    try {
      const updated = await adminService.assignDelivery(selectedOrder.id, selectedPerson, scheduledDate || undefined);
      setOrders(prev => prev.map(o => o.id === updated.id ? updated : o));
      setModalType(null);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to assign delivery executive.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatStatus = (s: string) => s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  const getNextStatuses = (order: Order) => {
    const all = order.fulfillmentType === 'DELIVERY' ? DELIVERY_STATUSES :
                 order.fulfillmentType === 'INSTALLATION' ? INSTALLATION_STATUSES :
                 PICKUP_STATUSES;
    return [...all, 'CANCELLED'];
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Order Management</h1>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 mb-4">
          <AlertCircle className="w-4 h-4 text-red-400" />
          <p className="text-sm text-red-400">{error}</p>
          <button onClick={() => setError('')} className="ml-auto text-red-400"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input type="text" value={searchInput} onChange={e => setSearchInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { setSearch(searchInput); setPage(0); } }}
            placeholder="Search by order #, customer... (press Enter)"
            className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-24 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500 transition-all" />
          <button
            onClick={() => { setSearch(searchInput); setPage(0); }}
            className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 bg-red-600 hover:bg-red-500 text-white text-xs rounded-md transition-all"
          >
            Search
          </button>
        </div>
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(0); }}
          className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-red-500 transition-all">
          <option value="">All Statuses</option>
          {Object.keys(STATUS_COLORS).map(s => <option key={s} value={s}>{formatStatus(s)}</option>)}
        </select>
      </div>

      {/* Orders Table */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left text-xs text-slate-400 font-medium px-5 py-3">Order</th>
                <th className="text-left text-xs text-slate-400 font-medium px-5 py-3">Customer</th>
                <th className="text-left text-xs text-slate-400 font-medium px-5 py-3">Type</th>
                <th className="text-left text-xs text-slate-400 font-medium px-5 py-3">Status</th>
                <th className="text-left text-xs text-slate-400 font-medium px-5 py-3">Amount</th>
                <th className="text-left text-xs text-slate-400 font-medium px-5 py-3">Date</th>
                <th className="text-left text-xs text-slate-400 font-medium px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 7 }).map((_, j) => (
                      <td key={j} className="px-5 py-4">
                        <div className="h-5 bg-slate-700 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-16 text-slate-400">
                    <ClipboardList className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                    No orders found
                  </td>
                </tr>
              ) : (
                orders.map(order => (
                  <tr key={order.id} className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors">
                    <td className="px-5 py-4">
                      <p className="text-white font-medium text-sm">#{order.orderNumber}</p>
                      <p className="text-slate-500 text-xs">{order.items.length} item{order.items.length !== 1 ? 's' : ''}</p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-white text-sm">{order.customer?.name}</p>
                      <p className="text-slate-500 text-xs">{order.customer?.email}</p>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5">
                        {order.fulfillmentType === 'DELIVERY' ? <Truck className="w-3.5 h-3.5 text-slate-400" /> :
                         order.fulfillmentType === 'INSTALLATION' ? <Wrench className="w-3.5 h-3.5 text-slate-400" /> :
                         <Package className="w-3.5 h-3.5 text-slate-400" />}
                        <span className="text-slate-300 text-xs">{order.fulfillmentType}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLORS[order.status] || 'text-slate-400 bg-slate-400/10'}`}>
                        {formatStatus(order.status)}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-white font-medium text-sm">₹{order.totalAmount.toLocaleString('en-IN')}</td>
                    <td className="px-5 py-4 text-slate-400 text-xs">
                      {new Date(order.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => openStatusModal(order)}
                          className="text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 px-2.5 py-1.5 rounded-lg transition-all">
                          Status
                        </button>
                        {order.fulfillmentType === 'INSTALLATION' && (
                          <button onClick={() => openAssignTechModal(order)}
                            className="text-xs bg-amber-600/10 hover:bg-amber-600/20 text-amber-400 px-2.5 py-1.5 rounded-lg transition-all">
                            <Wrench className="w-3 h-3" />
                          </button>
                        )}
                        {order.fulfillmentType === 'DELIVERY' && (
                          <button onClick={() => openAssignDelModal(order)}
                            className="text-xs bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 px-2.5 py-1.5 rounded-lg transition-all">
                            <Truck className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center gap-3 mt-4">
          <button onClick={() => setPage(p => p - 1)} disabled={page === 0}
            className="p-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-400 hover:text-white disabled:opacity-50 transition-all">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="self-center text-slate-400 text-sm">Page {page + 1} of {totalPages}</span>
          <button onClick={() => setPage(p => p + 1)} disabled={page >= totalPages - 1}
            className="p-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-400 hover:text-white disabled:opacity-50 transition-all">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Status Update Modal */}
      {modalType === 'status' && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-white font-semibold text-lg">Update Order Status</h3>
              <button onClick={() => setModalType(null)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <p className="text-slate-400 text-sm mb-4">Order #{selectedOrder.orderNumber}</p>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-slate-300 mb-2">New Status</label>
                <select value={newStatus} onChange={e => setNewStatus(e.target.value)}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-red-500">
                  <option value="">Select status...</option>
                  {getNextStatuses(selectedOrder).map(s => (
                    <option key={s} value={s}>{formatStatus(s)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-slate-300 mb-2">Notes (optional)</label>
                <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                  placeholder="Add a note..." />
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setModalType(null)} className="flex-1 bg-slate-700 hover:bg-slate-600 text-slate-300 py-2.5 rounded-lg transition-all">Cancel</button>
                <button onClick={handleStatusUpdate} disabled={!newStatus || submitting}
                  className="flex-1 bg-red-600 hover:bg-red-500 disabled:bg-red-800 disabled:cursor-not-allowed text-white py-2.5 rounded-lg transition-all flex items-center justify-center gap-2">
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  Update
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Assign Technician Modal */}
      {modalType === 'assign-tech' && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-white font-semibold text-lg">Assign Technician</h3>
              <button onClick={() => setModalType(null)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-slate-300 mb-2">Technician</label>
                <select value={selectedPerson} onChange={e => setSelectedPerson(e.target.value)}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-red-500">
                  <option value="">Select technician...</option>
                  {technicians.map(t => (
                    <option key={t.id} value={t.id}>{t.name} ({t.employeeId}) — {t.status}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-slate-300 mb-2">Scheduled Date</label>
                <input type="date" value={scheduledDate} onChange={e => setScheduledDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-red-500" />
              </div>
              <div>
                <label className="block text-sm text-slate-300 mb-2">Time Slot</label>
                <select value={scheduledSlot} onChange={e => setScheduledSlot(e.target.value)}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-red-500">
                  {['09:00 AM - 11:00 AM', '11:00 AM - 01:00 PM', '02:00 PM - 04:00 PM', '04:00 PM - 06:00 PM'].map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setModalType(null)} className="flex-1 bg-slate-700 hover:bg-slate-600 text-slate-300 py-2.5 rounded-lg transition-all">Cancel</button>
                <button onClick={handleAssignTech} disabled={!selectedPerson || submitting}
                  className="flex-1 bg-amber-600 hover:bg-amber-500 disabled:bg-amber-800 disabled:cursor-not-allowed text-white py-2.5 rounded-lg transition-all flex items-center justify-center gap-2">
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wrench className="w-4 h-4" />}
                  Assign
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Assign Delivery Modal */}
      {modalType === 'assign-del' && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-white font-semibold text-lg">Assign Delivery Executive</h3>
              <button onClick={() => setModalType(null)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-slate-300 mb-2">Delivery Executive</label>
                <select value={selectedPerson} onChange={e => setSelectedPerson(e.target.value)}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-red-500">
                  <option value="">Select executive...</option>
                  {deliveryExecs.map(d => (
                    <option key={d.id} value={d.id}>{d.name} ({d.employeeId})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-slate-300 mb-2">Estimated Delivery Date</label>
                <input type="date" value={scheduledDate} onChange={e => setScheduledDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-red-500" />
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setModalType(null)} className="flex-1 bg-slate-700 hover:bg-slate-600 text-slate-300 py-2.5 rounded-lg transition-all">Cancel</button>
                <button onClick={handleAssignDel} disabled={!selectedPerson || submitting}
                  className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 disabled:cursor-not-allowed text-white py-2.5 rounded-lg transition-all flex items-center justify-center gap-2">
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Truck className="w-4 h-4" />}
                  Assign
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOrders;
