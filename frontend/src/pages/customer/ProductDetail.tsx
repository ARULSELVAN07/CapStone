import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../store/AuthContext';
import { productService } from '../../services/productService';
import { cartService } from '../../services/cartService';
import { getImageUrl, handleImageError } from '../../services/api';
import { Product, CompatibilityResponse } from '../../types';
import {
  Package, ShoppingCart, CheckCircle, XCircle, Car, Shield,
  ArrowLeft, Plus, Minus, Loader2, AlertCircle, Star, Sparkles, Cpu, Layers, Info
} from 'lucide-react';

const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { activeVehicle } = useAuth();
  const navigate = useNavigate();

  const renderStars = (rating: number | undefined) => {
    const r = rating || 0;
    const filledStars = Math.round(r);
    const starString = '★'.repeat(filledStars) + '☆'.repeat(5 - filledStars);
    return (
      <div className="flex items-center gap-1.5 text-amber-400 text-base my-2">
        <span className="tracking-wider">{starString}</span>
        <span className="text-slate-300 text-sm font-semibold">{r.toFixed(1)}</span>
      </div>
    );
  };

  const [product, setProduct] = useState<Product | null>(null);
  const [compatibility, setCompatibility] = useState<CompatibilityResponse | null>(null);
  const [similarProducts, setSimilarProducts] = useState<Product[]>([]);
  const [loadingSimilar, setLoadingSimilar] = useState(false);
  const [showMlMetrics, setShowMlMetrics] = useState(false);
  const [mlMetrics, setMlMetrics] = useState<any>(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState(false);
  const [buyingNow, setBuyingNow] = useState(false);
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

    const fetchSimilar = async () => {
      setLoadingSimilar(true);
      try {
        const vehicleModelId = activeVehicle?.vehicleModel?.id;
        const recs = await productService.getSimilarProducts(id, vehicleModelId, 6);
        setSimilarProducts(recs);
      } catch (e) {
        console.error('Failed to fetch similar products:', e);
      } finally {
        setLoadingSimilar(false);
      }
    };

    fetchProduct();
    fetchSimilar();
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

  const handleBuyNow = async () => {
    if (!product) return;
    setBuyingNow(true);
    try {
      await cartService.addToCart(product.id, quantity);
      navigate('/customer/cart');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to process buy now.');
    } finally {
      setBuyingNow(false);
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
        <div className="bg-slate-800 border border-slate-700 rounded-2xl flex items-center justify-center aspect-square animate-fade-in overflow-hidden">
          <img
            src={getImageUrl(product.imageUrl, product.name)}
            alt={product.name}
            onError={handleImageError}
            className="w-full h-full object-cover rounded-2xl"
          />
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
            {renderStars(product.rating)}
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

          {/* Quantity + Add to Cart + Buy Now */}
          {product.stockStatus !== 'OUT_OF_STOCK' && (
            <div className="space-y-3">
              <div className="flex gap-3 items-center">
                <div className="flex items-center bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
                  <button onClick={() => setQuantity(q => Math.max(1, q - 1))}
                    disabled={quantity <= 1}
                    className="p-2.5 text-slate-400 hover:text-white hover:bg-slate-700 transition-all disabled:opacity-30">
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-12 text-center text-white font-semibold">{quantity}</span>
                  <button onClick={() => setQuantity(q => Math.min(product.availableQuantity, q + 1))}
                    disabled={quantity >= product.availableQuantity}
                    className="p-2.5 text-slate-400 hover:text-white hover:bg-slate-700 transition-all disabled:opacity-30">
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                
                <button onClick={handleAddToCart} disabled={addingToCart || buyingNow}
                  className={`flex-1 py-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${
                    cartAdded
                      ? 'bg-green-600 text-white'
                      : 'bg-blue-600 hover:bg-blue-500 text-white disabled:bg-blue-800 disabled:cursor-not-allowed'
                  }`}>
                  {addingToCart ? <Loader2 className="w-4 h-4 animate-spin" /> :
                   cartAdded ? <><CheckCircle className="w-4 h-4" /> Added!</> :
                   <><ShoppingCart className="w-4 h-4" /> Add to Cart</>}
                </button>
              </div>

              <button onClick={handleBuyNow} disabled={addingToCart || buyingNow}
                className="w-full bg-red-600 hover:bg-red-500 disabled:bg-red-800 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition-all flex items-center justify-center gap-2">
                {buyingNow ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Buy Now'}
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

      {/* Similar & Complementary Products Recommendation */}
      {similarProducts.length > 0 && (
        <div className="mt-12 pt-8 border-t border-slate-800">
          <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-blue-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-white">Similar & Complementary Parts</h2>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
                    ML Engine v1.1
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Ranked by Scikit-Learn TF-IDF semantic embeddings & BMW vehicle compatibility tensor
                </p>
              </div>
            </div>

            <button
              onClick={async () => {
                if (!mlMetrics) {
                  try {
                    const data = await productService.getModelEvaluation();
                    setMlMetrics(data);
                  } catch (err) {
                    console.error('Failed to load ML metrics:', err);
                  }
                }
                setShowMlMetrics(!showMlMetrics);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 border border-slate-700 text-xs font-semibold text-slate-300 hover:text-white transition-all shadow-sm"
            >
              <Cpu className="w-3.5 h-3.5 text-blue-400" />
              {showMlMetrics ? 'Hide ML Diagnostics' : 'ML Model Insights'}
            </button>
          </div>

          {/* ML Model Insights Panel */}
          {showMlMetrics && mlMetrics && (
            <div className="mb-6 p-4 rounded-xl bg-slate-850 border border-blue-500/30 shadow-lg text-xs space-y-3 animate-fade-in">
              <div className="flex items-center justify-between border-b border-slate-700/60 pb-2">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-blue-400" />
                  <span className="font-bold text-white text-sm">{mlMetrics.model_architecture}</span>
                </div>
                <span className="text-slate-400 font-mono">Vocab Size: {mlMetrics.vectorizer_config?.vocabulary_size} terms</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-slate-800 p-2.5 rounded-lg border border-slate-700">
                  <p className="text-slate-400 text-[11px]">Feature Matrix Shape</p>
                  <p className="text-white font-mono font-bold text-sm mt-0.5">
                    {mlMetrics.dataset_metrics?.feature_matrix_shape?.join(' × ')}
                  </p>
                </div>
                <div className="bg-slate-800 p-2.5 rounded-lg border border-slate-700">
                  <p className="text-slate-400 text-[11px]">Matrix Sparsity</p>
                  <p className="text-amber-400 font-mono font-bold text-sm mt-0.5">
                    {mlMetrics.dataset_metrics?.matrix_sparsity_percent}%
                  </p>
                </div>
                <div className="bg-slate-800 p-2.5 rounded-lg border border-slate-700">
                  <p className="text-slate-400 text-[11px]">Mean Cosine Sim</p>
                  <p className="text-blue-400 font-mono font-bold text-sm mt-0.5">
                    {mlMetrics.similarity_distribution?.mean_cosine_similarity?.toFixed(4)}
                  </p>
                </div>
                <div className="bg-slate-800 p-2.5 rounded-lg border border-slate-700">
                  <p className="text-slate-400 text-[11px]">Max Pairwise Sim</p>
                  <p className="text-green-400 font-mono font-bold text-sm mt-0.5">
                    {mlMetrics.similarity_distribution?.max_cosine_similarity?.toFixed(4)}
                  </p>
                </div>
              </div>

              {/* Feature Weights */}
              <div className="bg-slate-800/60 p-2.5 rounded-lg border border-slate-700/60">
                <p className="text-slate-400 font-semibold mb-1 text-[11px]">Feature Weights Distribution:</p>
                <div className="flex flex-wrap gap-2 text-[10px]">
                  <span className="px-2 py-0.5 bg-blue-500/20 text-blue-300 rounded">Compatibility: 40%</span>
                  <span className="px-2 py-0.5 bg-purple-500/20 text-purple-300 rounded">TF-IDF NLP: 30%</span>
                  <span className="px-2 py-0.5 bg-green-500/20 text-green-300 rounded">Brand Match: 15%</span>
                  <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 rounded">Price Proximity: 10%</span>
                  <span className="px-2 py-0.5 bg-rose-500/20 text-rose-300 rounded">Rating: 5%</span>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {similarProducts.map((item) => {
              const isCompatibleWithActive = activeVehicle
                ? item.compatibleModels?.some(m => m.id === activeVehicle.vehicleModel.id)
                : null;
              
              const matchPct = Math.round((item.recommendationScore || 0.85) * 100);

              return (
                <Link
                  key={item.id}
                  to={`/customer/products/${item.id}`}
                  className="group bg-slate-800/80 hover:bg-slate-750 border border-slate-700 hover:border-blue-500/50 rounded-xl p-3 flex flex-col transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:shadow-blue-500/5 relative"
                >
                  {/* ML Match Score Chip */}
                  <div className="absolute top-2 left-2 z-10">
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded shadow ${
                      matchPct >= 90
                        ? 'bg-emerald-500 text-slate-950 font-extrabold'
                        : matchPct >= 75
                        ? 'bg-blue-500 text-white'
                        : 'bg-slate-700 text-slate-200'
                    }`}>
                      {matchPct}% Match
                    </span>
                  </div>

                  <div className="aspect-square w-full rounded-lg bg-slate-900 overflow-hidden mb-2.5 flex items-center justify-center">
                    <img
                      src={getImageUrl(item.imageUrl, item.name)}
                      alt={item.name}
                      onError={handleImageError}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>

                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="text-[10px] text-slate-400 font-mono mb-1 truncate">
                        {item.partNumber}
                      </div>
                      <h4 className="text-white text-xs font-semibold line-clamp-2 group-hover:text-blue-400 transition-colors">
                        {item.name}
                      </h4>
                      {item.matchReason && (
                        <p className="text-[10px] text-slate-400 mt-1 line-clamp-1 truncate">
                          {item.matchReason}
                        </p>
                      )}
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-700/60 flex items-center justify-between">
                      <p className="text-xs font-bold text-white">
                        ₹{item.price.toLocaleString('en-IN')}
                      </p>
                      {isCompatibleWithActive !== null && (
                        <span
                          className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${
                            isCompatibleWithActive
                              ? 'bg-green-500/20 text-green-400'
                              : 'bg-slate-700 text-slate-400'
                          }`}
                        >
                          {isCompatibleWithActive ? 'Fits Vehicle' : 'Check Fit'}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetail;
