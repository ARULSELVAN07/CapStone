import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../store/AuthContext';
import { cartService } from '../../services/cartService';
import { orderService } from '../../services/orderService';
import { Cart } from '../../types';
import {
  Package, Truck, Wrench, CreditCard, CheckCircle2, Loader2,
  AlertCircle, MapPin, Calendar, Clock, Car
} from 'lucide-react';

type FulfillmentType = 'PICKUP' | 'DELIVERY' | 'INSTALLATION';
type PaymentMethod = 'UPI' | 'CARD' | 'CASH_ON_PICKUP';

const TIME_SLOTS = ['09:00 AM - 11:00 AM', '11:00 AM - 01:00 PM', '02:00 PM - 04:00 PM', '04:00 PM - 06:00 PM'];

const CheckoutPage: React.FC = () => {
  const { activeVehicle } = useAuth();
  const navigate = useNavigate();
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState('');

  const [fulfillment, setFulfillment] = useState<FulfillmentType>('PICKUP');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('UPI');
  const [address, setAddress] = useState({
    addressLine1: '', addressLine2: '', city: '', state: '', pincode: '', landmark: ''
  });
  const [pickupDate, setPickupDate] = useState('');
  const [pickupTimeSlot, setPickupTimeSlot] = useState(TIME_SLOTS[0]);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    cartService.getCart().then(setCart).catch(() => setError('Failed to load cart.')).finally(() => setLoading(false));
  }, []);

  const deliveryFee = fulfillment === 'DELIVERY' ? 299 : 0;
  const installationFee = fulfillment === 'INSTALLATION' ? 599 : 0;
  const subtotal = cart?.subtotal || 0;
  const total = subtotal + deliveryFee + installationFee;

  const handlePlaceOrder = async () => {
    setError('');
    if (fulfillment === 'DELIVERY' && (!address.addressLine1 || !address.city || !address.state || !address.pincode)) {
      setError('Please fill in the delivery address.'); return;
    }
    if (fulfillment === 'PICKUP' && !pickupDate) {
      setError('Please select a pickup date.'); return;
    }
    setPlacing(true);
    try {
      const payload: any = {
        fulfillmentType: fulfillment,
        paymentMethod,
        notes,
      };
      if (activeVehicle) payload.vehicleId = activeVehicle.id;
      if (fulfillment === 'DELIVERY' || fulfillment === 'INSTALLATION') {
        payload.address = address;
      }
      if (fulfillment === 'PICKUP') {
        payload.pickupDate = pickupDate;
        payload.pickupTimeSlot = pickupTimeSlot;
      }
      const order = await orderService.placeOrder(payload);
      navigate(`/customer/orders/${order.id}`, { state: { newOrder: true } });
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to place order. Please try again.');
    } finally {
      setPlacing(false);
    }
  };

  const fulfillmentOptions = [
    {
      value: 'PICKUP' as FulfillmentType,
      icon: Package,
      label: 'Store Pickup',
      desc: 'Pick up from our service center',
      fee: 'Free',
      color: 'blue',
    },
    {
      value: 'DELIVERY' as FulfillmentType,
      icon: Truck,
      label: 'Home Delivery',
      desc: 'Delivered to your address',
      fee: '₹299',
      color: 'purple',
    },
    {
      value: 'INSTALLATION' as FulfillmentType,
      icon: Wrench,
      label: 'Installation Service',
      desc: 'Our technician visits your location',
      fee: '₹599',
      color: 'amber',
    },
  ];

  if (loading) {
    return (
      <div className="p-6 flex justify-center items-center min-h-64">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-white mb-6">Checkout</h1>

      {error && (
        <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 mb-5">
          <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Fulfillment Type */}
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
            <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
              <Package className="w-5 h-5 text-blue-400" /> Fulfillment Method
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {fulfillmentOptions.map(opt => (
                <button key={opt.value} onClick={() => setFulfillment(opt.value)}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${
                    fulfillment === opt.value
                      ? 'border-blue-500 bg-blue-500/10'
                      : 'border-slate-700 hover:border-slate-600'
                  }`}>
                  <opt.icon className={`w-6 h-6 mb-2 ${fulfillment === opt.value ? 'text-blue-400' : 'text-slate-400'}`} />
                  <p className="text-white text-sm font-semibold">{opt.label}</p>
                  <p className="text-slate-400 text-xs mt-0.5">{opt.desc}</p>
                  <p className={`text-sm font-bold mt-2 ${fulfillment === opt.value ? 'text-blue-400' : 'text-slate-500'}`}>{opt.fee}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Pickup Details */}
          {fulfillment === 'PICKUP' && (
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
              <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-400" /> Pickup Schedule
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Pickup Date *</label>
                  <input type="date" value={pickupDate} onChange={e => setPickupDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Time Slot</label>
                  <select value={pickupTimeSlot} onChange={e => setPickupTimeSlot(e.target.value)}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all">
                    {TIME_SLOTS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div className="mt-4 p-3 bg-blue-600/10 border border-blue-600/20 rounded-lg">
                <p className="text-blue-400 text-sm flex items-center gap-2">
                  <MapPin className="w-4 h-4" /> BMW SpareHub Service Center, Andheri East, Mumbai - 400069
                </p>
              </div>
            </div>
          )}

          {/* Delivery / Installation Address */}
          {(fulfillment === 'DELIVERY' || fulfillment === 'INSTALLATION') && (
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
              <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-blue-400" />
                {fulfillment === 'DELIVERY' ? 'Delivery Address' : 'Installation Address'}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-slate-300 mb-2">Address Line 1 *</label>
                  <input type="text" value={address.addressLine1}
                    onChange={e => setAddress(p => ({ ...p, addressLine1: e.target.value }))}
                    placeholder="House/Flat No., Building Name"
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-slate-300 mb-2">Address Line 2</label>
                  <input type="text" value={address.addressLine2}
                    onChange={e => setAddress(p => ({ ...p, addressLine2: e.target.value }))}
                    placeholder="Street, Area"
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">City *</label>
                  <input type="text" value={address.city}
                    onChange={e => setAddress(p => ({ ...p, city: e.target.value }))}
                    placeholder="Mumbai"
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">State *</label>
                  <input type="text" value={address.state}
                    onChange={e => setAddress(p => ({ ...p, state: e.target.value }))}
                    placeholder="Maharashtra"
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Pincode *</label>
                  <input type="text" value={address.pincode} maxLength={6}
                    onChange={e => setAddress(p => ({ ...p, pincode: e.target.value }))}
                    placeholder="400069"
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Landmark</label>
                  <input type="text" value={address.landmark}
                    onChange={e => setAddress(p => ({ ...p, landmark: e.target.value }))}
                    placeholder="Near Metro Station"
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all" />
                </div>
              </div>
            </div>
          )}

          {/* Vehicle */}
          {activeVehicle && (
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
              <h2 className="text-white font-semibold mb-3 flex items-center gap-2">
                <Car className="w-5 h-5 text-blue-400" /> Vehicle
              </h2>
              <div className="flex items-center gap-3 p-3 bg-blue-600/10 border border-blue-500/20 rounded-lg">
                <Car className="w-8 h-8 text-blue-400" />
                <div>
                  <p className="text-white font-medium">{activeVehicle.vehicleModel.modelName}</p>
                  <p className="text-slate-400 text-sm">{activeVehicle.vehicleModel.modelYear} · {activeVehicle.registrationNumber || activeVehicle.vin}</p>
                </div>
              </div>
            </div>
          )}

          {/* Payment */}
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
            <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-blue-400" /> Payment Method
            </h2>
            <div className="space-y-2">
              {[
                { value: 'UPI', label: 'UPI (Google Pay, PhonePe, Paytm)', desc: 'Instant payment via UPI' },
                { value: 'CARD', label: 'Credit / Debit Card', desc: 'Visa, Mastercard, RuPay' },
                { value: 'CASH_ON_PICKUP', label: 'Cash on Pickup', desc: 'Pay at service center', disabled: fulfillment !== 'PICKUP' },
              ].map(opt => (
                <label key={opt.value}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                    opt.disabled ? 'opacity-40 cursor-not-allowed' :
                    paymentMethod === opt.value ? 'border-blue-500 bg-blue-500/10' : 'border-slate-700 hover:border-slate-600'
                  }`}>
                  <input type="radio" name="payment" value={opt.value}
                    checked={paymentMethod === opt.value}
                    disabled={opt.disabled}
                    onChange={() => !opt.disabled && setPaymentMethod(opt.value as PaymentMethod)}
                    className="accent-blue-500" />
                  <div>
                    <p className="text-white text-sm font-medium">{opt.label}</p>
                    <p className="text-slate-400 text-xs">{opt.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
            <label className="block text-white font-semibold mb-3">Additional Notes (Optional)</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)}
              placeholder="Any special instructions..."
              rows={3}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-none" />
          </div>
        </div>

        {/* Order Summary */}
        <div>
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 sticky top-6">
            <h2 className="text-white font-semibold text-lg mb-4">Order Summary</h2>
            <div className="space-y-2 pb-4 border-b border-slate-700">
              {cart?.items.map(item => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span className="text-slate-400 flex-1 pr-2 truncate">{item.product.name} × {item.quantity}</span>
                  <span className="text-white">₹{item.itemTotal.toLocaleString('en-IN')}</span>
                </div>
              ))}
            </div>
            <div className="space-y-2 py-4 border-b border-slate-700">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Subtotal</span>
                <span className="text-white">₹{subtotal.toLocaleString('en-IN')}</span>
              </div>
              {deliveryFee > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Delivery Fee</span>
                  <span className="text-white">₹{deliveryFee.toLocaleString('en-IN')}</span>
                </div>
              )}
              {installationFee > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Installation Fee</span>
                  <span className="text-white">₹{installationFee.toLocaleString('en-IN')}</span>
                </div>
              )}
            </div>
            <div className="flex justify-between items-center py-4">
              <span className="text-white font-bold text-lg">Total</span>
              <span className="text-white font-bold text-2xl">₹{total.toLocaleString('en-IN')}</span>
            </div>
            <button onClick={handlePlaceOrder} disabled={placing}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2">
              {placing ? <><Loader2 className="w-4 h-4 animate-spin" /> Placing Order...</> :
               <><CheckCircle2 className="w-4 h-4" /> Place Order</>}
            </button>
            <p className="text-slate-500 text-xs text-center mt-3">
              By placing order, you agree to our Terms of Service
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
