import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { productService } from '../../services/productService';
import { getImageUrl, handleImageError } from '../../services/api';
import { Product, Vehicle } from '../../types';
import { Flame, Star, ChevronRight, ShoppingCart, Sparkles, CheckCircle } from 'lucide-react';
import { cartService } from '../../services/cartService';

interface TrendingSectionProps {
  activeVehicle?: Vehicle | null;
}

export const TrendingSection: React.FC<TrendingSectionProps> = ({ activeVehicle }) => {
  const [trendingProducts, setTrendingProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [addedIds, setAddedIds] = useState<Record<string, boolean>>({});

  useEffect(() => {
    let isMounted = true;
    const fetchTrending = async () => {
      setLoading(true);
      try {
        const vehicleModelId = activeVehicle?.vehicleModel?.id;
        const products = await productService.getTrendingProducts(8, vehicleModelId);
        if (isMounted) {
          setTrendingProducts(products);
        }
      } catch (err) {
        console.error('Failed to load trending products:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchTrending();
    return () => {
      isMounted = false;
    };
  }, [activeVehicle]);

  const handleQuickAdd = async (e: React.MouseEvent, productId: string) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await cartService.addToCart(productId, 1);
      setAddedIds(prev => ({ ...prev, [productId]: true }));
      setTimeout(() => {
        setAddedIds(prev => ({ ...prev, [productId]: false }));
      }, 2000);
    } catch (err) {
      console.error('Quick add failed:', err);
    }
  };

  if (loading) {
    return (
      <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Flame className="w-5 h-5 text-amber-500 animate-pulse" />
          <div className="h-6 w-48 bg-slate-700 rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-slate-700/40 rounded-xl p-4 space-y-3 animate-pulse">
              <div className="aspect-square bg-slate-700 rounded-lg" />
              <div className="h-4 bg-slate-700 rounded w-3/4" />
              <div className="h-4 bg-slate-700 rounded w-1/2" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (trendingProducts.length === 0) {
    return null;
  }

  return (
    <div className="bg-gradient-to-br from-slate-800 via-slate-800/95 to-slate-900 border border-slate-700/80 rounded-2xl p-6 shadow-xl relative overflow-hidden">
      {/* Glow decorative accent */}
      <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between mb-5 relative z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-600 to-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/20">
            <Flame className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-white tracking-tight">Trending Parts</h2>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Live Activity
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Most in-demand BMW OEM components based on recent orders & cart activity
            </p>
          </div>
        </div>
        <Link
          to="/customer/catalog"
          className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors"
        >
          View All <ChevronRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Grid of Trending Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 relative z-10">
        {trendingProducts.map((product, idx) => {
          const isAdded = !!addedIds[product.id];
          const rank = idx + 1;

          return (
            <Link
              key={product.id}
              to={`/customer/products/${product.id}`}
              className="group bg-slate-800/90 hover:bg-slate-750 border border-slate-700/70 hover:border-amber-500/40 rounded-xl p-3.5 flex flex-col transition-all duration-300 hover:shadow-lg hover:shadow-amber-500/5 hover:-translate-y-0.5 relative"
            >
              {/* Rank Badge */}
              <div
                className={`absolute top-2.5 left-2.5 z-10 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shadow-md ${
                  rank === 1
                    ? 'bg-amber-400 text-slate-950 shadow-amber-400/40'
                    : rank === 2
                    ? 'bg-slate-200 text-slate-900 shadow-slate-200/30'
                    : rank === 3
                    ? 'bg-amber-700 text-white shadow-amber-700/30'
                    : 'bg-slate-700 text-slate-300 border border-slate-600'
                }`}
              >
                #{rank}
              </div>

              {/* Product Image */}
              <div className="relative aspect-square w-full rounded-lg bg-slate-900/60 overflow-hidden mb-3 border border-slate-700/50 flex items-center justify-center">
                <img
                  src={getImageUrl(product.imageUrl, product.name)}
                  alt={product.name}
                  onError={handleImageError}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>

              {/* Product Info */}
              <div className="flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                    <span className="font-mono">{product.partNumber}</span>
                    <span className="text-slate-500">{product.category?.name}</span>
                  </div>
                  <h3 className="text-white text-sm font-semibold line-clamp-2 group-hover:text-amber-400 transition-colors">
                    {product.name}
                  </h3>
                  {product.matchReason && (
                    <p className="text-[10px] text-amber-400/90 mt-1 font-medium truncate">
                      {product.matchReason}
                    </p>
                  )}
                </div>

                <div className="mt-3 pt-2 border-t border-slate-700/50 flex items-center justify-between">
                  <div>
                    <p className="text-base font-bold text-white">
                      ₹{product.price.toLocaleString('en-IN')}
                    </p>
                    {product.rating !== undefined && product.rating > 0 && (
                      <div className="flex items-center gap-1 text-[11px] text-amber-400">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        <span>{product.rating.toFixed(1)}</span>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={(e) => handleQuickAdd(e, product.id)}
                    disabled={isAdded || product.stockStatus === 'OUT_OF_STOCK'}
                    className={`p-2 rounded-lg transition-all ${
                      isAdded
                        ? 'bg-green-600 text-white'
                        : 'bg-slate-700 hover:bg-amber-500 text-slate-300 hover:text-slate-950'
                    }`}
                    title={isAdded ? 'Added' : 'Quick Add to Cart'}
                  >
                    {isAdded ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : (
                      <ShoppingCart className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default TrendingSection;
