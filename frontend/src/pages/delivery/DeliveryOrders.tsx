import React, { useEffect, useState } from 'react';
import deliveryService from '../../services/deliveryService';
import { Truck, MapPin, CheckCircle2, Clock, ShieldCheck, AlertCircle, Phone, FileText, KeyRound } from 'lucide-react';

export const DeliveryOrders: React.FC = () => {
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Selected delivery for status update modal
  const [selectedDelivery, setSelectedDelivery] = useState<any | null>(null);
  const [newStatus, setNewStatus] = useState('OUT_FOR_DELIVERY');
  const [notes, setNotes] = useState('');
  const [otp, setOtp] = useState('');
  const [failureReason, setFailureReason] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchDeliveries = async () => {
    setLoading(true);
    try {
      const res = await deliveryService.getMyDeliveries({ size: 50 });
      setDeliveries(res.content || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeliveries();
  }, []);

  const handleOpenModal = (d: any) => {
    setSelectedDelivery(d);
    setNewStatus(d.deliveryStatus === 'DELIVERED' ? 'DELIVERED' : d.deliveryStatus === 'OUT_FOR_DELIVERY' ? 'DELIVERED' : 'OUT_FOR_DELIVERY');
    setNotes(d.deliveryNotes || '');
    setOtp('');
    setFailureReason('');
    setMsg(null);
  };

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDelivery) return;
    setSubmitting(true);
    setMsg(null);

    try {
      await deliveryService.updateDeliveryStatus(selectedDelivery.id, {
        status: newStatus,
        deliveryNotes: notes,
        proofOfDeliveryOtp: otp,
        failureReason: failureReason
      });
      setMsg({ type: 'success', text: 'Delivery status updated successfully!' });
      setTimeout(() => {
        setSelectedDelivery(null);
        fetchDeliveries();
      }, 1000);
    } catch (err: any) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Failed to update delivery status' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleClaimDelivery = async (deliveryId: string) => {
    try {
      await deliveryService.claimDelivery(deliveryId);
      fetchDeliveries();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to claim delivery');
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Truck className="w-7 h-7 text-emerald-500" /> Delivery Tasks & Dispatch
        </h1>
        <p className="text-slate-400 text-sm">Manage active spare part delivery routes, customer address verification, and delivery OTP confirmation</p>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-12 text-center text-slate-500">
            <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-500 mb-2" />
            <p>Loading delivery assignments...</p>
          </div>
        ) : deliveries.length === 0 ? (
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-12 text-center text-slate-400">
            No active delivery assignments.
          </div>
        ) : (
          deliveries.map((d) => (
            <div key={d.id} className="bg-slate-800 border border-slate-700 rounded-xl p-6 shadow-xl space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-700 pb-4">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-emerald-400 font-bold text-sm">Task #{d.id?.substring(0, 8)}</span>
                    <span className={`px-3 py-1 rounded-full text-xs font-extrabold ${
                      d.deliveryStatus === 'DELIVERED' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                      d.deliveryStatus === 'OUT_FOR_DELIVERY' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                      'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    }`}>
                      {d.deliveryStatus}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-white mt-1">Order #{d.order?.orderNumber || 'SP-ORD-02'}</h3>
                </div>

                <div className="flex items-center gap-2">
                  {(!d.assignedPersonName || d.deliveryStatus === 'PENDING') && (
                    <button
                      onClick={() => handleClaimDelivery(d.id)}
                      className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-all shadow"
                    >
                      Claim Task
                    </button>
                  )}
                  <button
                    onClick={() => handleOpenModal(d)}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all shadow"
                  >
                    Update Delivery Status
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-slate-300">
                <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-700/60">
                  <p className="text-xs text-slate-400 font-semibold mb-1">Customer & Contact</p>
                  <p className="font-bold text-white">{d.order?.customer?.name || 'Customer'}</p>
                  <p className="text-xs text-emerald-400 flex items-center gap-1 mt-1 font-mono">
                    <Phone className="w-3 h-3" /> {d.order?.customer?.phone || '+91 9876543210'}
                  </p>
                </div>

                <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-700/60 md:col-span-2">
                  <p className="text-xs text-slate-400 font-semibold mb-1">Delivery Destination</p>
                  <p className="font-semibold text-white flex items-start gap-1.5">
                    <MapPin className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                    {d.deliveryAddress?.addressLine1 ? (
                      `${d.deliveryAddress.addressLine1}, ${d.deliveryAddress.addressLine2 || ''} ${d.deliveryAddress.city}, ${d.deliveryAddress.state} - ${d.deliveryAddress.pincode}`
                    ) : (
                      '123 BMW Executive Enclave, Indiranagar, Bengaluru - 560038'
                    )}
                  </p>
                </div>
              </div>

              {d.deliveryNotes && (
                <div className="p-3 bg-emerald-950/20 border border-emerald-500/20 rounded-lg text-xs text-emerald-300 flex items-start gap-2">
                  <FileText className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Delivery Notes:</span> {d.deliveryNotes}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {selectedDelivery && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-xl w-full max-w-lg p-6 shadow-2xl">
            <h2 className="text-xl font-bold text-white mb-2">Update Delivery Progress</h2>
            <p className="text-xs text-slate-400 mb-4">Task #{selectedDelivery.id?.substring(0, 8)} • Order #{selectedDelivery.order?.orderNumber}</p>

            {msg && (
              <div className={`mb-4 p-3 rounded-lg flex items-center gap-2 text-sm ${
                msg.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
              }`}>
                {msg.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                {msg.text}
              </div>
            )}

            <form onSubmit={handleUpdateStatus} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Delivery Status</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="OUT_FOR_DELIVERY">OUT_FOR_DELIVERY (On the way to customer)</option>
                  <option value="DELIVERED">DELIVERED (Handed over to customer)</option>
                  <option value="FAILED">FAILED (Attempted - Customer unavailable / refused)</option>
                </select>
              </div>

              {newStatus === 'DELIVERED' && (
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center gap-1">
                    <KeyRound className="w-3.5 h-3.5 text-emerald-400" /> Customer Proof of Delivery OTP
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="e.g. 582910"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white font-mono tracking-widest focus:outline-none focus:border-emerald-500"
                  />
                </div>
              )}

              {newStatus === 'FAILED' && (
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Reason for Failure</label>
                  <input
                    type="text"
                    placeholder="e.g. Customer unreachable by phone"
                    value={failureReason}
                    onChange={(e) => setFailureReason(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-rose-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Delivery Executive Remarks</label>
                <textarea
                  rows={3}
                  placeholder="Notes regarding location, parcel condition..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-700">
                <button
                  type="button"
                  onClick={() => setSelectedDelivery(null)}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-medium transition-all disabled:opacity-50"
                >
                  {submitting ? 'Updating...' : 'Save Delivery Status'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeliveryOrders;
