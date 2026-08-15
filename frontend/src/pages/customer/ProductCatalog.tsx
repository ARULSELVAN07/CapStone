import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../store/AuthContext';
import { productService } from '../../services/productService';
import { cartService } from '../../services/cartService';
import { getImageUrl, handleImageError } from '../../services/api';
import { Category, Product, VehicleModel } from '../../types';
import { vehicleService } from '../../services/vehicleService';
import {
  Search, Filter, ShoppingCart, CheckCircle, AlertCircle, Car,
  Loader2, Package, ChevronLeft, ChevronRight, Star, Plus
} from 'lucide-react';

const SORT_OPTIONS = [
  { value: 'price,asc', label: 'Price: Low to High' },
  { value: 'price,desc', label: 'Price: High to Low' },
  { value: 'name,asc', label: 'Name A–Z' },
  { value: 'createdAt,desc', label: 'Newest First' },
];

const ProductCatalog: React.FC = () => {
  const { activeVehicle } = useAuth();
  const navigate = useNavigate();

  const renderStars = (rating: number | undefined) => {
    const r = rating || 0;
    const filledStars = Math.round(r);
    const starString = '★'.repeat(filledStars) + '☆'.repeat(5 - filledStars);
    return (
      <div className="flex items-center gap-1 text-amber-400 text-sm my-1">
        <span className="tracking-wider">{starString}</span>
        <span className="text-slate-400 text-xs font-semibold">{r.toFixed(1)}</span>
      </div>
    );
  };

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [models, setModels] = useState<VehicleModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [addingToCart, setAddingToCart] = useState<string | null>(null);
  const [cartSuccess, setCartSuccess] = useState<string | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);

  const [filters, setFilters] = useState({
    search: '',
    categoryId: '',
    vehicleModelId: activeVehicle?.vehicleModel?.id || '',
    minPrice: '',
    maxPrice: '',
    sortBy: 'name',
    sortDir: 'asc',
    page: 0,
    size: 12,
  });

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = {
        page: filters.page,
        size: filters.size,
        sortBy: filters.sortBy,
        sortDir: filters.sortDir,
      };
      if (filters.search) params.search = filters.search;
      if (filters.categoryId) params.categoryId = filters.categoryId;
      if (filters.vehicleModelId) params.vehicleModelId = filters.vehicleModelId;
      if (filters.minPrice) params.minPrice = parseFloat(filters.minPrice);
      if (filters.maxPrice) params.maxPrice = parseFloat(filters.maxPrice);

      const data = await productService.filterProducts(params);
      setProducts(data.content);
      setTotalPages(data.totalPages);
      setTotalElements(data.totalElements);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    Promise.all([productService.getCategories(), vehicleService.getVehicleModels()]).then(([cats, mods]) => {
      setCategories(cats);
      setModels(mods);
    });
  }, []);

  const handleAddToCart = async (product: Product) => {
    setAddingToCart(product.id);
    try {
      await cartService.addToCart(product.id, 1);
      setCartSuccess(product.id);
      setTimeout(() => setCartSuccess(null), 2000);
    } catch (e) {
      console.error(e);
    } finally {
      setAddingToCart(null);
    }
  };

  const handleSortChange = (value: string) => {
    const [sortBy, sortDir] = value.split(',');
    setFilters(p => ({ ...p, sortBy, sortDir, page: 0 }));
  };

  const stockBadge = (status: string) => {
    if (status === 'IN_STOCK') return <span className="text-xs px-2 py-0.5 rounded-full bg-green-400/10 text-green-400 font-medium">In Stock</span>;
    if (status === 'LOW_STOCK') return <span className="text-xs px-2 py-0.5 rounded-full bg-amber-400/10 text-amber-400 font-medium">Low Stock</span>;
    return <span className="text-xs px-2 py-0.5 rounded-full bg-red-400/10 text-red-400 font-medium">Out of Stock</span>;
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Browse Parts</h1>
          <p className="text-slate-400 text-sm mt-1">
            {activeVehicle
              ? `Showing parts for ${activeVehicle.vehicleModel.modelName}`
              : `${totalElements} parts available`}
          </p>
        </div>
        {activeVehicle && (
          <div className="flex items-center gap-2 bg-blue-600/10 border border-blue-500/20 rounded-lg px-3 py-2">
            <Car className="w-4 h-4 text-blue-400" />
            <span className="text-blue-300 text-sm">{activeVehicle.vehicleModel.modelName}</span>
            <button
              onClick={() => setFilters(p => ({
                ...p,
                vehicleModelId: p.vehicleModelId ? '' : activeVehicle.vehicleModel.id,
                page: 0
              }))}
              className="ml-1 text-xs text-slate-400 hover:text-white">
              {filters.vehicleModelId ? '✕ Clear' : '→ Filter'}
            </button>
          </div>
        )}
      </div>

      {/* Search + Sort */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={filters.search}
            onChange={e => setFilters(p => ({ ...p, search: e.target.value, page: 0 }))}
            placeholder="Search parts by name, part number..."
            className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          />
        </div>
        <select
          value={`${filters.sortBy},${filters.sortDir}`}
          onChange={e => handleSortChange(e.target.value)}
          className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
        >
          {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <button
          onClick={() => setFilterOpen(p => !p)}
          className="flex items-center gap-2 bg-slate-800 border border-slate-700 hover:border-slate-600 rounded-lg px-4 py-2.5 text-slate-300 transition-all">
          <Filter className="w-4 h-4" /> Filters
        </button>
      </div>

      {/* Expanded Filters */}
      {filterOpen && (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 mb-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Category</label>
            <select value={filters.categoryId} onChange={e => setFilters(p => ({ ...p, categoryId: e.target.value, page: 0 }))}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">All Categories</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Vehicle Model</label>
            <select value={filters.vehicleModelId} onChange={e => setFilters(p => ({ ...p, vehicleModelId: e.target.value, page: 0 }))}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">All Models</option>
              {models.map(m => <option key={m.id} value={m.id}>{m.modelName} ({m.modelYear})</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Min Price (₹)</label>
            <input type="number" value={filters.minPrice} onChange={e => setFilters(p => ({ ...p, minPrice: e.target.value, page: 0 }))}
              placeholder="0"
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Max Price (₹)</label>
            <input type="number" value={filters.maxPrice} onChange={e => setFilters(p => ({ ...p, maxPrice: e.target.value, page: 0 }))}
              placeholder="100000"
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>
      )}

      {/* Products Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-64 bg-slate-800 rounded-xl animate-pulse border border-slate-700" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-16 bg-slate-800 border border-slate-700 rounded-xl">
          <Package className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-white font-semibold">No parts found</p>
          <p className="text-slate-400 text-sm mt-1">Try adjusting your filters</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {products.map(product => (
            <div key={product.id} className="bg-slate-800 border border-slate-700 hover:border-slate-600 rounded-xl overflow-hidden transition-all group flex flex-col">
              <Link to={`/customer/catalog/${product.id}`} className="block p-4 flex-1">
                <div className="w-full aspect-square bg-slate-700 rounded-lg mb-3 flex items-center justify-center group-hover:bg-slate-600 transition-colors">
                  {product.imageUrl ? (
                    <img src={getImageUrl(product.imageUrl)} alt={product.name} onError={handleImageError} className="w-full h-full object-cover rounded-lg" />
                  ) : (
                    <Package className="w-10 h-10 text-slate-500" />
                  )}
                </div>
                <div className="flex items-center justify-between mb-1">
                  {stockBadge(product.stockStatus)}
                  <span className="text-xs text-slate-500 font-mono">{product.partNumber}</span>
                </div>
                <h3 className="text-white font-medium text-sm leading-tight mb-1 line-clamp-2">{product.name}</h3>
                <p className="text-slate-400 text-xs mb-1">{product.brand}</p>
                {renderStars(product.rating)}
                
                <div className="mt-2 mb-1">
                  <span className={`text-xs font-semibold ${product.availableQuantity > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {product.availableQuantity > 0 ? `Available Stock: ${product.availableQuantity}` : 'Out of Stock'}
                  </span>
                </div>

                <p className="text-white font-bold text-lg mt-1">₹{product.price.toLocaleString('en-IN')}</p>
                
                {product.description && (
                  <p className="text-slate-400 text-xs mt-2 line-clamp-2 leading-relaxed">
                    {product.description}
                  </p>
                )}

                {product.warrantyMonths > 0 && (
                  <p className="text-slate-500 text-xs mt-1.5">{product.warrantyMonths} months warranty</p>
                )}
              </Link>
              <div className="px-4 pb-4">
                <button
                  onClick={() => handleAddToCart(product)}
                  disabled={product.stockStatus === 'OUT_OF_STOCK' || addingToCart === product.id}
                  className={`w-full py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                    product.stockStatus === 'OUT_OF_STOCK'
                      ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                      : cartSuccess === product.id
                      ? 'bg-green-600 text-white'
                      : 'bg-blue-600 hover:bg-blue-500 text-white'
                  }`}
                >
                  {addingToCart === product.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : cartSuccess === product.id ? (
                    <><CheckCircle className="w-4 h-4" /> Added!</>
                  ) : (
                    <><Plus className="w-4 h-4" /> Add to Cart</>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-8">
          <button
            onClick={() => setFilters(p => ({ ...p, page: p.page - 1 }))}
            disabled={filters.page === 0}
            className="p-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-slate-400 text-sm">
            Page {filters.page + 1} of {totalPages}
          </span>
          <button
            onClick={() => setFilters(p => ({ ...p, page: p.page + 1 }))}
            disabled={filters.page >= totalPages - 1}
            className="p-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
};

export default ProductCatalog;
