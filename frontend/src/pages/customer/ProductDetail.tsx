import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../store/AuthContext';
import { productService } from '../../services/productService';
import { cartService } from '../../services/cartService';
import { Product, CompatibilityResponse } from '../../types';
import {
  Package, ShoppingCart, CheckCircle, XCircle, Car, Shield,
  ArrowLeft, Plus, Minus, Loader2, AlertCircle, Star
} from 'lucide-react';

const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { activeVehicle } = useAuth();
  const navigate = useNavigate();

  const [product, setProduct] = useState<Product | null>(null);
  const [compatibility, setCompatibility] = useState<CompatibilityResponse | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState(false);
  const [cartAdded, setCartAdded] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    const fetchProduct = async () => {
      try {
        const data = await productService.getProductById(id);
        setProduct(data);
        if (activeVehicle) {
          try {
            const compat = await productService.checkCompatibility(id, activeVehicle.id);
            setCompatibility(compat);
          } catch (e) { /* ignore compat error */ }
        }
      } catch (e) {
        setError('Product not found.');
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id, activeVehicle]);

  const handleAddToCart = async () => {
    if (!product) return;
    setAddingToCart(true);
    try {
      await cartService.addToCart(product.id, quantity);
      setCartAdded(true);
      setTimeout(() => setCartAdded(false), 3000);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to add to cart.');
    } finally {
      setAddingToCart(false);
    }
  };

  const stockColors: Record<string, string> = {
    IN_STOCK: 'text-green-400',
    LOW_STOCK: 'text-amber-400',
    OUT_OF_STOCK: 'text-red-400',
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-800 rounded w-1/3" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="aspect-square bg-slate-800 rounded-xl" />
            <div className="space-y-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-8 bg-slate-800 rounded" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="p-6 text-center">
        <Package className="w-12 h-12 text-slate-600 mx-auto mb-3" />
        <p className="text-white font-semibold">{error || 'Product not found'}</p>
        <Link to="/customer/catalog" className="mt-4 inline-flex items-center gap-2 text-blue-400 hover:text-blue-300">
          <ArrowLeft className="w-4 h-4" /> Back to Catalog
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6">
      <Link to="/customer/catalog" className="inline-flex items-center gap-2 text-slate-400 hover:text-white text-sm mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Catalog
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Product Image */}
        <div className="bg-slate-800 border border-slate-700 rounded-2xl flex items-center justify-center aspect-square">
          {product.imageUrl ? (
            <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover rounded-2xl" />
          ) : (
            <Package className="w-24 h-24 text-slate-600" />
          )}
        </div>

        {/* Product Info */}
        <div className="space-y-5">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs text-slate-400 bg-slate-800 border border-slate-700 rounded px-2 py-0.5 font-mono">
                {product.partNumber}
              </span>
              <span className="text-xs text-slate-400">{product.category.name}</span>
            </div>
            <h1 className="text-2xl font-bold text-white">{product.name}</h1>
            <p className="text-slate-400 mt-1">by {product.brand}</p>
          </div>

          <p className="text-3xl font-bold text-white">₹{product.price.toLocaleString('en-IN')}</p>

          {/* Stock Status */}
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${
              product.stockStatus === 'IN_STOCK' ? 'bg-green-400' :
              product.stockStatus === 'LOW_STOCK' ? 'bg-amber-400' : 'bg-red-400'
            }`} />
            <span className={`text-sm font-medium ${stockColors[product.stockStatus]}`}>
              {product.stockStatus.replace('_', ' ')}
            </span>
            {product.availableQuantity > 0 && (
              <span className="text-slate-500 text-sm">({product.availableQuantity} units available)</span>
            )}
          </div>

          {/* Compatibility Badge */}
          {activeVehicle && compatibility && (
            <div className={`flex items-center gap-3 p-3 rounded-lg border ${
              compatibility.compatible
                ? 'bg-green-400/10 border-green-400/30'
                : 'bg-red-400/10 border-red-400/30'
            }`}>
              {compatibility.compatible ? (
                <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
              ) : (
                <XCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
              )}
              <div>
                <p className={`text-sm font-medium ${compatibility.compatible ? 'text-green-400' : 'text-red-400'}`}>
                  {compatibility.compatible ? 'Compatible with your vehicle' : 'Not compatible'}
                </p>
                <p className="text-xs text-slate-400">{compatibility.message}</p>
              </div>
            </div>
          )}

          {!activeVehicle && (
            <div className="flex items-center gap-2 p-3 bg-slate-700/50 border border-slate-700 rounded-lg">
              <Car className="w-4 h-4 text-slate-400" />
              <p className="text-sm text-slate-400">
                <Link to="/customer/vehicles" className="text-blue-400 hover:text-blue-300">Add a vehicle</Link> to check compatibility
              </p>
            </div>
          )}

          {/* Description */}
          {product.description && (
            <p className="text-slate-400 text-sm leading-relaxed">{product.description}</p>
          )}

          {/* Details */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-3">
              <p className="text-slate-500 text-xs">Warranty</p>
              <p className="text-white text-sm font-medium mt-0.5">
                {product.warrantyMonths > 0 ? `${product.warrantyMonths} months` : 'No warranty'}
              </p>
            </div>
            {product.compatibleModels && product.compatibleModels.length > 0 && (
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-3">
                <p className="text-slate-500 text-xs">Compatible Models</p>
                <p className="text-white text-sm font-medium mt-0.5">{product.compatibleModels.length} models</p>
              </div>
            )}
          </div>

          {error && (
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
              <AlertCircle className="w-4 h-4 text-red-400" />
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {/* Quantity + Add to Cart */}
          {product.stockStatus !== 'OUT_OF_STOCK' && (
            <div className="flex gap-3 items-center">
              <div className="flex items-center bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
                <button onClick={() => setQuantity(q => Math.max(1, q - 1))}
                  className="p-2.5 text-slate-400 hover:text-white hover:bg-slate-700 transition-all">
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-12 text-center text-white font-semibold">{quantity}</span>
                <button onClick={() => setQuantity(q => Math.min(product.availableQuantity, q + 1))}
                  className="p-2.5 text-slate-400 hover:text-white hover:bg-slate-700 transition-all">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <button onClick={handleAddToCart} disabled={addingToCart}
                className={`flex-1 py-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${
                  cartAdded
                    ? 'bg-green-600 text-white'
                    : 'bg-blue-600 hover:bg-blue-500 text-white disabled:bg-blue-800 disabled:cursor-not-allowed'
                }`}>
                {addingToCart ? <Loader2 className="w-4 h-4 animate-spin" /> :
                 cartAdded ? <><CheckCircle className="w-4 h-4" /> Added to Cart!</> :
                 <><ShoppingCart className="w-4 h-4" /> Add to Cart</>}
              </button>
            </div>
          )}

          {cartAdded && (
            <div className="flex justify-end">
              <Link to="/customer/cart" className="text-sm text-blue-400 hover:text-blue-300">View Cart →</Link>
            </div>
          )}

          {/* Compatible Models List */}
          {product.compatibleModels && product.compatibleModels.length > 0 && (
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                <Car className="w-4 h-4 text-blue-400" /> Compatible BMW Models
              </h3>
              <div className="flex flex-wrap gap-2">
                {product.compatibleModels.map(m => (
                  <span key={m.id} className="text-xs bg-slate-700 text-slate-300 rounded px-2 py-1">
                    {m.modelName} ({m.modelYear})
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
