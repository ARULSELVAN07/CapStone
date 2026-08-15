import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { cartService } from '../../services/cartService';
import { getImageUrl, handleImageError } from '../../services/api';
import { Cart } from '../../types';
import { ShoppingCart, Trash2, Plus, Minus, Loader2, Package, ArrowRight, AlertCircle } from 'lucide-react';

const CartPage: React.FC = () => {
  const navigate = useNavigate();
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [error, setError] = useState('');

  const fetchCart = async () => {
    try {
      setError('');
      const data = await cartService.getCart();
      setCart(data);
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Failed to load cart.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCart(); }, []);

  const handleUpdate = async (itemId: string, quantity: number) => {
    if (quantity < 1) {
      handleRemove(itemId);
      return;
    }
    setUpdating(itemId);
    setError('');
    try {
      const updated = await cartService.updateCartItem(itemId, quantity);
      setCart(updated);
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Failed to update quantity.');
    } finally {
      setUpdating(null);
    }
  };

  const handleRemove = async (itemId: string) => {
    setUpdating(itemId);
    setError('');
    try {
      const updated = await cartService.removeCartItem(itemId);
      setCart(updated);
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Failed to remove item.');
    } finally {
      setUpdating(null);
    }
  };

  const handleClearCart = async () => {
    if (!confirm('Clear all items from cart?')) return;
    setError('');
    try {
      await cartService.clearCart();
      setCart(prev => prev ? { ...prev, items: [], subtotal: 0, totalItems: 0 } : null);
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Failed to clear cart.');
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-800 rounded w-48" />
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 bg-slate-800 rounded-xl border border-slate-700" />
          ))}
        </div>
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold text-white mb-8">My Cart</h1>
        <div className="text-center py-16 bg-slate-800 border border-slate-700 rounded-xl">
          <ShoppingCart className="w-14 h-14 text-slate-600 mx-auto mb-4" />
          <h3 className="text-white font-semibold text-lg mb-2">Your cart is empty</h3>
          <p className="text-slate-400 text-sm mb-6">Browse our parts catalog to add items</p>
          <Link to="/customer/catalog"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-lg font-medium transition-all">
            Browse Parts
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">My Cart <span className="text-slate-400 font-normal text-lg">({cart.totalItems} items)</span></h1>
        <button onClick={handleClearCart} className="text-sm text-red-400 hover:text-red-300 transition-colors flex items-center gap-1">
          <Trash2 className="w-4 h-4" /> Clear Cart
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 mb-4">
          <AlertCircle className="w-4 h-4 text-red-400" />
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Items */}
        <div className="lg:col-span-2 space-y-3">
          {cart.items.map(item => (
            <div key={item.id} className="bg-slate-800 border border-slate-700 rounded-xl p-4 flex gap-4">
              <div className="w-16 h-16 bg-slate-700 rounded-lg flex-shrink-0 flex items-center justify-center">
                {item.product.imageUrl ? (
                  <img src={getImageUrl(item.product.imageUrl)} alt={item.product.name} onError={handleImageError} className="w-full h-full object-cover rounded-lg" />
                ) : (
                  <Package className="w-7 h-7 text-slate-500" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <Link to={`/customer/catalog/${item.product.id}`}
                  className="text-white font-medium text-sm hover:text-blue-400 transition-colors line-clamp-1">
                  {item.product.name}
                </Link>
                <p className="text-slate-400 text-xs mt-0.5">{item.product.partNumber} · {item.product.brand}</p>
                <p className="text-blue-400 font-semibold mt-1">₹{item.product.price.toLocaleString('en-IN')} each</p>
              </div>
              <div className="flex flex-col items-end gap-3">
                <p className="text-white font-bold">₹{item.itemTotal.toLocaleString('en-IN')}</p>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleUpdate(item.id, item.quantity - 1)}
                    disabled={updating === item.id || item.quantity <= 1}
                    className="w-7 h-7 flex items-center justify-center rounded bg-slate-700 hover:bg-slate-600 text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all">
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="w-8 text-center text-white text-sm font-medium">
                    {updating === item.id ? <Loader2 className="w-3 h-3 animate-spin mx-auto" /> : item.quantity}
                  </span>
                  <button
                    onClick={() => handleUpdate(item.id, item.quantity + 1)}
                    disabled={updating === item.id || item.quantity >= item.product.availableQuantity}
                    className="w-7 h-7 flex items-center justify-center rounded bg-slate-700 hover:bg-slate-600 text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all">
                    <Plus className="w-3 h-3" />
                  </button>
                  <button onClick={() => handleRemove(item.id)} disabled={updating === item.id}
                    className="ml-2 p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded transition-all">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="lg:col-span-1">
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 sticky top-6">
            <h2 className="text-white font-semibold text-lg mb-4">Order Summary</h2>
            <div className="space-y-3 pb-4 border-b border-slate-700">
              {cart.items.map(item => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span className="text-slate-400 truncate pr-2 flex-1">{item.product.name} × {item.quantity}</span>
                  <span className="text-white font-medium">₹{item.itemTotal.toLocaleString('en-IN')}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-between items-center py-3">
              <span className="text-white font-semibold">Subtotal</span>
              <span className="text-white font-bold text-xl">₹{cart.subtotal.toLocaleString('en-IN')}</span>
            </div>
            <p className="text-slate-500 text-xs mb-4">Shipping & installation fees calculated at checkout</p>
            <button
              onClick={() => navigate('/customer/checkout')}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 rounded-lg transition-all flex items-center justify-center gap-2">
              Proceed to Checkout <ArrowRight className="w-4 h-4" />
            </button>
            <Link to="/customer/catalog"
              className="mt-3 w-full flex items-center justify-center text-sm text-slate-400 hover:text-white transition-colors py-2">
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
