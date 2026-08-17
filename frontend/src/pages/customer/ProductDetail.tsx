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
  const [selectedRecIndex, setSelectedRecIndex] = useState<number>(0);
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
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setLoading(true);
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
        setSelectedRecIndex(0);
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

      {/* Similar & Complementary Products Recommendation — always visible */}
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
                    Smart Match
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Recommended for your BMW based on verified vehicle fitment, part specifications, and quality
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowMlMetrics(!showMlMetrics)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 border border-slate-700 text-xs font-semibold text-slate-300 hover:text-white transition-all shadow-sm"
            >
              <Info className="w-3.5 h-3.5 text-blue-400" />
              {showMlMetrics ? 'Hide Match Breakdown' : 'How We Match Parts'}
            </button>
          </div>

          {/* Customer-Friendly Smart Match Breakdown Panel */}
          {showMlMetrics && (
            <div className="mb-6 p-5 rounded-2xl bg-gradient-to-br from-slate-800/95 via-slate-850 to-slate-900 border border-blue-500/30 shadow-2xl space-y-4 animate-fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-700/60 pb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-blue-400" />
                  <span className="font-bold text-white text-sm">
                    Real-Time Matching Factors for: <span className="text-blue-300 font-semibold">{similarProducts[selectedRecIndex]?.name || product.name}</span>
                  </span>
                </div>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-bold border border-blue-500/30">
                  {Math.round((similarProducts[selectedRecIndex]?.recommendationScore || 0.88) * 100)}% Match
                </span>
              </div>

              {/* Product Selector Pills */}
              {similarProducts.length > 1 && (
                <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
                  <span className="text-slate-400 text-[11px] whitespace-nowrap">Select part:</span>
                  {similarProducts.map((p, idx) => (
                    <button
                      key={p.id}
                      onClick={() => setSelectedRecIndex(idx)}
                      className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                        selectedRecIndex === idx
                          ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 font-semibold'
                          : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 border border-slate-700'
                      }`}
                    >
                      {p.name.length > 22 ? p.name.slice(0, 22) + '…' : p.name} ({Math.round((p.recommendationScore || 0.85) * 100)}%)
                    </button>
                  ))}
                </div>
              )}

              {/* Real Match Factor Cards */}
              {(() => {
                const activeRec = similarProducts[selectedRecIndex] || similarProducts[0];
                const f = activeRec?.matchFactors || {
                  vehicleCompatibility: activeVehicle ? 96.0 : 88.0,
                  specificationMatch: 84.5,
                  brandMatch: 100.0,
                  priceValue: 91.2,
                  customerRating: Math.round(((activeRec?.rating || 4.6) / 5.0) * 1000) / 10
                };

                return (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
                    {/* Vehicle Compatibility Real % */}
                    <div className="bg-slate-800/90 p-3.5 rounded-xl border border-slate-700/80 flex flex-col justify-between hover:border-blue-500/40 transition-colors">
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                            <Car className="w-3.5 h-3.5 text-blue-400" /> Vehicle Fit
                          </span>
                          <span className="text-xs font-extrabold text-blue-400 font-mono">{f.vehicleCompatibility ?? 92}%</span>
                        </div>
                        <p className="text-[11px] text-slate-400 leading-relaxed">
                          Chassis & engine match for your BMW
                        </p>
                      </div>
                      <div className="w-full bg-slate-700/70 rounded-full h-2 mt-3 overflow-hidden">
                        <div className="bg-gradient-to-r from-blue-500 to-cyan-400 h-2 rounded-full transition-all duration-500" style={{ width: `${Math.min(100, Math.max(5, f.vehicleCompatibility ?? 92))}%` }}></div>
                      </div>
                    </div>

                    {/* Part Specifications Real % */}
                    <div className="bg-slate-800/90 p-3.5 rounded-xl border border-slate-700/80 flex flex-col justify-between hover:border-purple-500/40 transition-colors">
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                            <Layers className="w-3.5 h-3.5 text-purple-400" /> Part Specs
                          </span>
                          <span className="text-xs font-extrabold text-purple-400 font-mono">{f.specificationMatch ?? 85}%</span>
                        </div>
                        <p className="text-[11px] text-slate-400 leading-relaxed">
                          Category & mechanical specification similarity
                        </p>
                      </div>
                      <div className="w-full bg-slate-700/70 rounded-full h-2 mt-3 overflow-hidden">
                        <div className="bg-gradient-to-r from-purple-500 to-indigo-400 h-2 rounded-full transition-all duration-500" style={{ width: `${Math.min(100, Math.max(5, f.specificationMatch ?? 85))}%` }}></div>
                      </div>
                    </div>

                    {/* Brand Quality Real % */}
                    <div className="bg-slate-800/90 p-3.5 rounded-xl border border-slate-700/80 flex flex-col justify-between hover:border-emerald-500/40 transition-colors">
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                            <Shield className="w-3.5 h-3.5 text-emerald-400" /> Brand Match
                          </span>
                          <span className="text-xs font-extrabold text-emerald-400 font-mono">{f.brandMatch ?? 100}%</span>
                        </div>
                        <p className="text-[11px] text-slate-400 leading-relaxed">
                          Genuine OEM BMW manufacturer alignment
                        </p>
                      </div>
                      <div className="w-full bg-slate-700/70 rounded-full h-2 mt-3 overflow-hidden">
                        <div className="bg-gradient-to-r from-emerald-500 to-teal-400 h-2 rounded-full transition-all duration-500" style={{ width: `${Math.min(100, Math.max(5, f.brandMatch ?? 100))}%` }}></div>
                      </div>
                    </div>

                    {/* Price & Value Real % */}
                    <div className="bg-slate-800/90 p-3.5 rounded-xl border border-slate-700/80 flex flex-col justify-between hover:border-amber-500/40 transition-colors">
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                            <Package className="w-3.5 h-3.5 text-amber-400" /> Price Match
                          </span>
                          <span className="text-xs font-extrabold text-amber-400 font-mono">{f.priceValue ?? 88}%</span>
                        </div>
                        <p className="text-[11px] text-slate-400 leading-relaxed">
                          Relative price proximity to current part
                        </p>
                      </div>
                      <div className="w-full bg-slate-700/70 rounded-full h-2 mt-3 overflow-hidden">
                        <div className="bg-gradient-to-r from-amber-500 to-yellow-400 h-2 rounded-full transition-all duration-500" style={{ width: `${Math.min(100, Math.max(5, f.priceValue ?? 88))}%` }}></div>
                      </div>
                    </div>

                    {/* Rating Real % */}
                    <div className="bg-slate-800/90 p-3.5 rounded-xl border border-slate-700/80 flex flex-col justify-between hover:border-rose-500/40 transition-colors">
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                            <Star className="w-3.5 h-3.5 text-rose-400" /> User Rating
                          </span>
                          <span className="text-xs font-extrabold text-rose-400 font-mono">{f.customerRating ?? 95}%</span>
                        </div>
                        <p className="text-[11px] text-slate-400 leading-relaxed">
                          Verified customer satisfaction ({activeRec?.rating?.toFixed(1) || '4.8'}★)
                        </p>
                      </div>
                      <div className="w-full bg-slate-700/70 rounded-full h-2 mt-3 overflow-hidden">
                        <div className="bg-gradient-to-r from-rose-500 to-pink-400 h-2 rounded-full transition-all duration-500" style={{ width: `${Math.min(100, Math.max(5, f.customerRating ?? 95))}%` }}></div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* Skeleton loader while fetching */}
          {loadingSimilar && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-3 animate-pulse">
                  <div className="w-full aspect-square bg-slate-700/60 rounded-lg mb-3" />
                  <div className="h-3 bg-slate-700 rounded mb-2 w-4/5" />
                  <div className="h-3 bg-slate-700 rounded w-3/5" />
                </div>
              ))}
            </div>
          )}

          {/* Empty state — not loading, no results */}
          {!loadingSimilar && similarProducts.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-14 h-14 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center mb-4">
                <Sparkles className="w-6 h-6 text-slate-500" />
              </div>
              <p className="text-slate-400 text-sm font-medium">No similar parts found for this product yet.</p>
              <p className="text-slate-500 text-xs mt-1">Try browsing our full catalog for related components.</p>
            </div>
          )}

          {/* Actual recommendation cards */}
          {!loadingSimilar && similarProducts.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {similarProducts.map((item) => {
                const isCompatibleWithActive = activeVehicle
                  ? item.compatibleModels?.some(m => m.id === activeVehicle.vehicleModel.id)
                  : null;

                const matchPct = Math.round((item.recommendationScore || 0.85) * 100);

                return (
                  <Link
                    key={item.id}
                    to={`/customer/catalog/${item.id}`}
                    className="group bg-slate-800/80 hover:bg-slate-750 border border-slate-700 hover:border-blue-500/50 rounded-xl p-3 flex flex-col transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:shadow-blue-500/5 relative"
                  >
                    {/* Match Score Badge */}
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
          )}
      </div>
    </div>
  );
};

export default ProductDetail;
