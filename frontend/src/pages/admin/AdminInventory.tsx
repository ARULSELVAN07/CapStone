import React, { useEffect, useState } from 'react';
import adminService from '../../services/adminService';
import { InventoryItem } from '../../types';
import { Boxes, Edit2, AlertTriangle, CheckCircle2, RefreshCw, Search } from 'lucide-react';

export const AdminInventory: React.FC = () => {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);

  const [showModal, setShowModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [stockQty, setStockQty] = useState('');
  const [threshold, setThreshold] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const res = await adminService.getInventory({ page, size: 20 });
      setInventory(res.content);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, [page]);

  const handleOpenEdit = (item: InventoryItem) => {
    setSelectedItem(item);
    setStockQty(item.availableQuantity.toString());
    setThreshold((item.minimumStockThreshold || 5).toString());
    setShowModal(true);
  };

  const handleUpdateStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;
    setSubmitting(true);
    try {
      await adminService.updateStock(selectedItem.product.id, {
        availableQuantity: parseInt(stockQty),
        minimumStockThreshold: parseInt(threshold)
      });
      setShowModal(false);
      fetchInventory();
    } catch (e) {
      alert('Failed to update inventory stock');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Boxes className="w-7 h-7 text-red-500" /> Warehouse Inventory Control
          </h1>
          <p className="text-slate-400 text-sm">Monitor live spare part stock levels, reserved units, and minimum safety thresholds</p>
        </div>
        <button
          onClick={fetchInventory}
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
                <th className="px-6 py-4">Part Information</th>
                <th className="px-6 py-4">OEM Part No</th>
                <th className="px-6 py-4">Available Stock</th>
                <th className="px-6 py-4">Reserved Stock</th>
                <th className="px-6 py-4">Min Threshold</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/60">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                    <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-red-500 mb-2" />
                    <p>Loading inventory...</p>
                  </td>
                </tr>
              ) : inventory.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                    No inventory records found.
                  </td>
                </tr>
              ) : (
                inventory.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-750/50 transition-colors">
                    <td className="px-6 py-4 font-semibold text-white">{item.product?.name}</td>
                    <td className="px-6 py-4 font-mono text-xs text-red-400">{item.product?.partNumber}</td>
                    <td className="px-6 py-4 font-bold text-white">{item.availableQuantity} units</td>
                    <td className="px-6 py-4 text-slate-400">{item.reservedQuantity || 0} units</td>
                    <td className="px-6 py-4 text-slate-400">{item.minimumStockThreshold || 5} units</td>
                    <td className="px-6 py-4">
                      {item.calculatedStatus === 'IN_STOCK' ? (
                        <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-xs font-semibold border border-emerald-500/30">
                          IN STOCK
                        </span>
                      ) : item.calculatedStatus === 'LOW_STOCK' ? (
                        <span className="px-2.5 py-1 bg-amber-500/20 text-amber-400 rounded-full text-xs font-semibold border border-amber-500/30 flex items-center gap-1 w-max">
                          <AlertTriangle className="w-3 h-3" /> LOW STOCK
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 bg-rose-500/20 text-rose-400 rounded-full text-xs font-semibold border border-rose-500/30">
                          OUT OF STOCK
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleOpenEdit(item)}
                        className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-blue-400 rounded-lg text-xs font-medium transition-all"
                      >
                        Adjust Stock
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
            <h2 className="text-lg font-bold text-white mb-2">Adjust Inventory Stock</h2>
            <p className="text-xs text-slate-400 mb-4">{selectedItem.product?.name} ({selectedItem.product?.partNumber})</p>

            <form onSubmit={handleUpdateStock} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Available Quantity</label>
                <input
                  type="number"
                  required
                  min="0"
                  value={stockQty}
                  onChange={(e) => setStockQty(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Minimum Safety Stock Threshold</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={threshold}
                  onChange={(e) => setThreshold(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500"
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
                  className="px-5 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-sm font-medium transition-all disabled:opacity-50"
                >
                  {submitting ? 'Updating...' : 'Save Stock'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminInventory;
