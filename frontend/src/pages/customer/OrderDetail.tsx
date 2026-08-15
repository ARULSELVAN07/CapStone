import React, { useEffect, useState } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { orderService } from '../../services/orderService';
import { getImageUrl, handleImageError } from '../../services/api';
import { Order } from '../../types';
import {
  Package, Truck, Wrench, CheckCircle, Clock, ArrowLeft,
  MapPin, Car, CreditCard, User, Phone, Calendar, AlertCircle, Loader2, XCircle
} from 'lucide-react';

const STATUS_TIMELINE: Record<string, { label: string; icon: React.FC<any> }> = {
  PENDING: { label: 'Order Placed', icon: Package },
  CONFIRMED: { label: 'Confirmed', icon: CheckCircle },
  PACKED: { label: 'Packed', icon: Package },
  READY_FOR_PICKUP: { label: 'Ready for Pickup', icon: Package },
  PICKED_UP: { label: 'Picked Up', icon: CheckCircle },
  OUT_FOR_DELIVERY: { label: 'Out for Delivery', icon: Truck },
  DELIVERED: { label: 'Delivered', icon: CheckCircle },
  TECHNICIAN_ASSIGNED: { label: 'Technician Assigned', icon: Wrench },
  INSTALLATION_SCHEDULED: { label: 'Installation Scheduled', icon: Calendar },
  INSTALLATION_IN_PROGRESS: { label: 'Installation In Progress', icon: Wrench },
  INSTALLATION_COMPLETED: { label: 'Installation Completed', icon: CheckCircle },
  COMPLETED: { label: 'Completed', icon: CheckCircle },
  CANCELLED: { label: 'Cancelled', icon: XCircle },
};

const FULFILLMENT_STEPS: Record<string, string[]> = {
  PICKUP: ['PENDING', 'CONFIRMED', 'PACKED', 'READY_FOR_PICKUP', 'PICKED_UP', 'COMPLETED'],
  DELIVERY: ['PENDING', 'CONFIRMED', 'PACKED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'COMPLETED'],
  INSTALLATION: ['PENDING', 'CONFIRMED', 'PACKED', 'TECHNICIAN_ASSIGNED', 'INSTALLATION_SCHEDULED', 'INSTALLATION_IN_PROGRESS', 'INSTALLATION_COMPLETED', 'COMPLETED'],
};

const OrderDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState('');
  const isNewOrder = (location.state as any)?.newOrder;

  useEffect(() => {
    if (!id) return;
    orderService.getOrderById(id).then(setOrder).catch(() => setError('Order not found.')).finally(() => setLoading(false));
  }, [id]);

  const handleCancel = async () => {
    if (!order || !confirm('Cancel this order?')) return;
    setCancelling(true);
    try {
      const updated = await orderService.cancelOrder(order.id);
      setOrder(updated);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Cannot cancel this order.');
    } finally {
      setCancelling(false);
    }
  };

  if (loading) return (
    <div className="p-6 flex justify-center"><Loader2 className="w-8 h-8 text-blue-500 animate-spin" /></div>
  );

  if (error || !order) return (
    <div className="p-6 text-center">
      <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
      <p className="text-white font-semibold">{error || 'Order not found'}</p>
      <Link to="/customer/orders" className="mt-4 inline-flex items-center gap-2 text-blue-400 hover:text-blue-300">
        <ArrowLeft className="w-4 h-4" /> Back to Orders
      </Link>
    </div>
  );

  const steps = FULFILLMENT_STEPS[order.fulfillmentType] || FULFILLMENT_STEPS.PICKUP;
  const currentStepIndex = order.status === 'CANCELLED' ? -1 : steps.indexOf(order.status);
  const canCancel = ['PENDING', 'CONFIRMED'].includes(order.status);

  const formatStatus = (s: string) => s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  return (
    <div className="p-6">
      <Link to="/customer/orders" className="inline-flex items-center gap-2 text-slate-400 hover:text-white text-sm mb-5 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Orders
      </Link>

      {isNewOrder && (
        <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/30 rounded-lg px-4 py-3 mb-5">
          <CheckCircle className="w-4 h-4 text-green-400" />
          <p className="text-sm text-green-400 font-medium">Order placed successfully! We'll process it shortly.</p>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 mb-5">
          <AlertCircle className="w-4 h-4 text-red-400" />
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Order #{order.orderNumber}</h1>
          <p className="text-slate-400 text-sm mt-1">
            Placed on {new Date(order.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`px-3 py-1.5 rounded-full text-sm font-medium ${
            order.status === 'CANCELLED' ? 'bg-red-500/10 text-red-400' :
            ['DELIVERED', 'COMPLETED', 'INSTALLATION_COMPLETED'].includes(order.status) ? 'bg-green-500/10 text-green-400' :
            'bg-blue-500/10 text-blue-400'
          }`}>
            {formatStatus(order.status)}
          </span>
          {canCancel && (
            <button onClick={handleCancel} disabled={cancelling}
              className="px-3 py-1.5 bg-red-600/10 hover:bg-red-600/20 text-red-400 text-sm font-medium rounded-lg border border-red-500/20 transition-all disabled:opacity-50 flex items-center gap-1">
              {cancelling ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
              Cancel
            </button>
          )}
        </div>
      </div>

      {/* Tracking Timeline */}
      {order.status !== 'CANCELLED' && (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 mb-6">
          <h2 className="text-white font-semibold mb-5">Order Progress</h2>
          <div className="flex items-start gap-0 overflow-x-auto pb-2">
            {steps.map((step, i) => {
              const isDone = i <= currentStepIndex;
              const isCurrent = i === currentStepIndex;
              const Icon = STATUS_TIMELINE[step]?.icon || Package;
              return (
                <div key={step} className="flex items-center flex-shrink-0">
                  <div className="flex flex-col items-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                      isCurrent ? 'bg-blue-600 border-blue-600' :
                      isDone ? 'bg-green-600 border-green-600' :
                      'bg-slate-700 border-slate-600'
                    }`}>
                      <Icon className={`w-4 h-4 ${isDone ? 'text-white' : 'text-slate-500'}`} />
                    </div>
                    <p className={`text-xs mt-2 text-center max-w-16 leading-tight ${
                      isCurrent ? 'text-blue-400 font-semibold' : isDone ? 'text-green-400' : 'text-slate-500'
                    }`}>
                      {STATUS_TIMELINE[step]?.label}
                    </p>
                  </div>
                  {i < steps.length - 1 && (
                    <div className={`h-0.5 w-12 mx-1 flex-shrink-0 mb-6 ${isDone && i < currentStepIndex ? 'bg-green-600' : 'bg-slate-700'}`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Items */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
            <h2 className="text-white font-semibold mb-4">Order Items</h2>
            <div className="space-y-3">
              {order.items.map(item => (
                <div key={item.id} className="flex items-center gap-3 p-3 bg-slate-700/50 rounded-lg">
                  <div className="w-12 h-12 bg-slate-600 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {item.product?.imageUrl ? (
                      <img src={getImageUrl(item.product.imageUrl)} alt={item.productName} onError={handleImageError} className="w-full h-full object-cover rounded-lg" />
                    ) : (
                      <Package className="w-5 h-5 text-slate-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">{item.productName}</p>
                    <p className="text-slate-400 text-xs">{item.partNumber} · Qty: {item.quantity}</p>
                  </div>
                  <p className="text-white font-semibold">₹{item.totalPrice.toLocaleString('en-IN')}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Delivery / Installation Info */}
          {order.deliveryInfo && (
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
              <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
                <Truck className="w-5 h-5 text-blue-400" /> Delivery Info
              </h2>
              <div className="space-y-2 text-sm">
                {order.deliveryInfo.assignedPersonName && (
                  <div className="flex gap-2"><User className="w-4 h-4 text-slate-400 flex-shrink-0" /><span className="text-slate-300">{order.deliveryInfo.assignedPersonName}</span></div>
                )}
                {order.deliveryInfo.estimatedDeliveryDate && (
                  <div className="flex gap-2"><Calendar className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    <span className="text-slate-300">Est. {new Date(order.deliveryInfo.estimatedDeliveryDate).toLocaleDateString('en-IN')}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {order.installationInfo && order.installationInfo.technician && (
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
              <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
                <Wrench className="w-5 h-5 text-amber-400" /> Installation Info
              </h2>
              <div className="space-y-2 text-sm">
                <div className="flex gap-2"><User className="w-4 h-4 text-slate-400" /><span className="text-slate-300">{order.installationInfo.technician.name}</span></div>
                {order.installationInfo.scheduledDate && (
                  <div className="flex gap-2"><Calendar className="w-4 h-4 text-slate-400" />
                    <span className="text-slate-300">
                      {new Date(order.installationInfo.scheduledDate).toLocaleDateString('en-IN')} · {order.installationInfo.scheduledTimeSlot}
                    </span>
                  </div>
                )}
                {order.installationInfo.technicianNotes && (
                  <div className="mt-3 p-3 bg-slate-700 rounded-lg">
                    <p className="text-xs text-slate-400">Technician Notes</p>
                    <p className="text-slate-300 text-sm mt-1">{order.installationInfo.technicianNotes}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Summary */}
        <div className="space-y-4">
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
            <h2 className="text-white font-semibold mb-4">Price Summary</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-slate-400">Subtotal</span><span className="text-white">₹{order.subtotal.toLocaleString('en-IN')}</span></div>
              {order.deliveryFee > 0 && <div className="flex justify-between"><span className="text-slate-400">Delivery</span><span className="text-white">₹{order.deliveryFee.toLocaleString('en-IN')}</span></div>}
              {order.installationFee > 0 && <div className="flex justify-between"><span className="text-slate-400">Installation</span><span className="text-white">₹{order.installationFee.toLocaleString('en-IN')}</span></div>}
              <div className="flex justify-between pt-2 border-t border-slate-700 font-bold">
                <span className="text-white">Total</span>
                <span className="text-white">₹{order.totalAmount.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>

          {order.vehicle && (
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
              <h2 className="text-white font-semibold mb-3 flex items-center gap-2"><Car className="w-4 h-4 text-blue-400" /> Vehicle</h2>
              <p className="text-white text-sm">{order.vehicle.vehicleModel.modelName}</p>
              <p className="text-slate-400 text-xs mt-0.5">{order.vehicle.vehicleModel.modelYear} · {order.vehicle.registrationNumber || order.vehicle.vin}</p>
            </div>
          )}

          {order.fulfillmentType === 'PICKUP' && order.pickupDate && (
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
              <h2 className="text-white font-semibold mb-3 flex items-center gap-2"><Calendar className="w-4 h-4 text-blue-400" /> Pickup</h2>
              <p className="text-white text-sm">{new Date(order.pickupDate).toLocaleDateString('en-IN')}</p>
              <p className="text-slate-400 text-xs mt-0.5">{order.pickupTimeSlot}</p>
            </div>
          )}

          {order.address && (
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
              <h2 className="text-white font-semibold mb-3 flex items-center gap-2"><MapPin className="w-4 h-4 text-blue-400" /> Address</h2>
              <p className="text-slate-300 text-sm">{order.address.addressLine1}</p>
              {order.address.addressLine2 && <p className="text-slate-400 text-sm">{order.address.addressLine2}</p>}
              <p className="text-slate-400 text-sm">{order.address.city}, {order.address.state} - {order.address.pincode}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderDetail;
