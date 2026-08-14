import React, { useEffect, useState } from 'react';
import adminService from '../../services/adminService';
import { InventoryItem } from '../../types';
import { AlertTriangle, Boxes, Edit2, RefreshCw } from 'lucide-react';

export const AdminLowStockAlerts: React.FC = () => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [stockQty, setStockQty] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchLowStock = async () => {
    setLoading(true);
    try {
      const res = await adminService.getLowStockInventory();
      setItems(res.content);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLowStock();
  }, []);

  const handleOpenRestock = (item: InventoryItem) => {
    setSelectedItem(item);
    setStockQty((item.availableQuantity + 20).toString());
    setShowModal(true);
  };

  const handleQuickRestock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;
    setSubmitting(true);
    try {
      await adminService.updateStock(selectedItem.product.id, {
        availableQuantity: parseInt(stockQty),
        minimumStockThreshold: selectedItem.minimumStockThreshold || 5
      });
      setShowModal(false);
      fetchLowStock();
    } catch (e) {
      alert('Failed to restock part');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <AlertTriangle className="w-7 h-7 text-amber-500" /> Low Stock & Inventory Critical Alerts
          </h1>
          <p className="text-slate-400 text-sm">Spare parts currently below minimum threshold requiring immediate warehouse replenishment</p>
        </div>
        <button
          onClick={fetchLowStock}
          className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg transition-all"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-900/80 text-xs font-semibold text-slate-400 uppercase border-b border-slate-700">
              <tr>
                <th className="px-6 py-4">Spare Part</th>
                <th className="px-6 py-4">OEM Part Number</th>
                <th className="px-6 py-4">Available Stock</th>
                <th className="px-6 py-4">Min Threshold</th>
                <th className="px-6 py-4">Alert Severity</th>
                <th className="px-6 py-4 text-right">Replenish Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/60">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-amber-500 mb-2" />
                    <p>Scanning inventory thresholds...</p>
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-emerald-400 font-medium">
                    All spare parts are well stocked above safety threshold levels!
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-750/50 transition-colors">
                    <td className="px-6 py-4 font-semibold text-white">{item.product?.name}</td>
                    <td className="px-6 py-4 font-mono text-xs text-red-400">{item.product?.partNumber}</td>
                    <td className="px-6 py-4 font-bold text-white">{item.availableQuantity} units</td>
                    <td className="px-6 py-4 text-slate-400">{item.minimumStockThreshold || 5} units</td>
                    <td className="px-6 py-4">
                      {item.availableQuantity === 0 ? (
                        <span className="px-2.5 py-1 bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-full text-xs font-bold">
                          CRITICAL - OUT OF STOCK
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-full text-xs font-bold">
                          WARNING - LOW STOCK
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleOpenRestock(item)}
                        className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-medium transition-all shadow"
                      >
                        Quick Restock
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && selectedItem && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-xl w-full max-w-md p-6 shadow-2xl">
            <h2 className="text-lg font-bold text-white mb-2">Replenish Part Stock</h2>
            <p className="text-xs text-slate-400 mb-4">{selectedItem.product?.name} ({selectedItem.product?.partNumber})</p>

            <form onSubmit={handleQuickRestock} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">New Total Available Stock</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={stockQty}
                  onChange={(e) => setStockQty(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                />
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
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-sm font-medium transition-all disabled:opacity-50"
                >
                  {submitting ? 'Restocking...' : 'Confirm Restock'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminLowStockAlerts;
