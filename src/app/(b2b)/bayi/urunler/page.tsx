'use client';

import React, { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useStore } from '@/context/StoreContext';
import { CATEGORIES, BRANDS } from '@/data/categories';
import { Product } from '@/types';
import { formatCurrency } from '@/lib/utils';
import { ProductDetailModal } from '@/components/products/ProductDetailModal';
import { StockBadge } from '@/components/common/StockBadge';
import {
  Search,
  Filter,
  Star,
  ShoppingCart,
  CheckCircle2,
  XCircle,
  Eye,
  SlidersHorizontal,
  LayoutGrid,
  List,
  RotateCcw,
  Sparkles,
  Snowflake,
  Fan,
  Thermometer,
  Pipette,
  Flame,
  Cpu,
  Soup,
  Waves,
  Zap,
  Wrench,
  ShieldCheck,
  Loader2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

function ProductsContent() {
  const searchParams = useSearchParams();
  const queryParam = searchParams.get('q') || '';
  const favoriteOnlyParam = searchParams.get('favori') === '1';

  const { addToCart, toggleFavorite, isFavorite, convertPrice, profile } = useStore();

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedBrand, setSelectedBrand] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>(queryParam);
  const [onlyInStock, setOnlyInStock] = useState<boolean>(false);
  const [onlyFavorites, setOnlyFavorites] = useState<boolean>(favoriteOnlyParam);
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [selectedProductForModal, setSelectedProductForModal] = useState<Product | null>(null);

  // Infinite Scroll & Pagination States
  const [productsList, setProductsList] = useState<Product[]>([]);
  const [page, setPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [totalCount, setTotalCount] = useState<number>(0);

  // Dynamic Categories from PostgreSQL API
  const [categoriesList, setCategoriesList] = useState<any[]>([]);
  const categoryScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/categories')
      .then((r) => r.json())
      .then((res) => {
        if (res.success && Array.isArray(res.data)) {
          setCategoriesList(res.data);
        }
      })
      .catch(() => {});
  }, []);

  const scrollCategories = (direction: 'left' | 'right') => {
    if (categoryScrollRef.current) {
      const amount = direction === 'left' ? -250 : 250;
      categoryScrollRef.current.scrollBy({ left: amount, behavior: 'smooth' });
    }
  };

  // Local state for quantity stepper per product
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  // Observer sentinel ref
  const observerTarget = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (queryParam) setSearchQuery(queryParam);
  }, [queryParam]);

  useEffect(() => {
    if (favoriteOnlyParam) setOnlyFavorites(true);
  }, [favoriteOnlyParam]);

  const handleQtyChange = (productId: string, val: number, pim: number) => {
    const validVal = Math.max(pim || 1, val);
    setQuantities((prev) => ({ ...prev, [productId]: validVal }));
  };

  const getQty = (product: Product) => {
    return quantities[product.id] || product.pim || 1;
  };

  // Map server DB item to frontend Product model
  const mapServerProduct = (p: any): Product => ({
    id: p.id,
    code: p.sku,
    name: p.name,
    category: p.category?.name || 'Genel',
    brand: p.brand?.name || 'Ersa',
    pim: p.minOrderQty || 1,
    priceTRY: p.salePrice || 0,
    basePriceTRY: p.basePrice || p.salePrice || 0,
    discountPercent: p.discountPercent || 0,
    discountSource: p.discountSource || 'NONE',
    priceUSD: Number(((p.salePrice || 0) / 38.45).toFixed(2)),
    priceEUR: Number(((p.salePrice || 0) / 42.10).toFixed(2)),
    originalCurrency: (p.currency as any) || 'TRY',
    stock: p.stockQty || 0,
    inStock: (p.stockQty || 0) > 0,
    image: p.images?.[0]?.url || 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600&auto=format&fit=crop&q=80',
    unit: p.unit || 'Adet',
    description: p.description || '',
    specifications: {},
    barcode: p.barcode || undefined,
    isNew: true
  });

  // Fetch products from server (Page 1 or Next Pages)
  const fetchProducts = useCallback(async (targetPage: number, isNewFilter: boolean = false) => {
    if (isNewFilter) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }

    try {
      const params = new URLSearchParams();
      params.set('page', targetPage.toString());
      params.set('limit', '100');
      params.set('status', 'ALL');

      if (selectedCategory !== 'all') params.set('category', selectedCategory);
      if (selectedBrand !== 'all') params.set('brand', selectedBrand);
      if (searchQuery.trim() !== '') params.set('q', searchQuery.trim());
      if (onlyInStock) params.set('stok', '1');

      const res = await fetch(`/api/products?${params.toString()}`);
      const json = await res.json();

      if (json.success && Array.isArray(json.data)) {
        const mapped = json.data.map(mapServerProduct);
        setTotalCount(json.totalCount || 0);
        setHasMore(Boolean(json.hasMore));
        setPage(targetPage);

        setProductsList((prev) => {
          if (isNewFilter || targetPage === 1) {
            return mapped;
          }
          // Prevent duplicates
          const existingIds = new Set(prev.map((i) => i.id));
          const newItems = mapped.filter((i: Product) => !existingIds.has(i.id));
          return [...prev, ...newItems];
        });
      }
    } catch (err) {
      console.error('Failed to fetch products:', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [selectedCategory, selectedBrand, searchQuery, onlyInStock]);

  // Reset and fetch Page 1 whenever filters change
  useEffect(() => {
    fetchProducts(1, true);
  }, [fetchProducts]);

  // Infinite scroll intersection observer
  useEffect(() => {
    if (!observerTarget.current || !hasMore || loading || loadingMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading && !loadingMore) {
          fetchProducts(page + 1, false);
        }
      },
      { rootMargin: '400px' }
    );

    observer.observe(observerTarget.current);

    return () => {
      observer.disconnect();
    };
  }, [hasMore, loading, loadingMore, page, fetchProducts]);

  // Optional favorite filter in memory on loaded items
  const displayProducts = onlyFavorites 
    ? productsList.filter((p) => isFavorite(p.id))
    : productsList;

  const resetFilters = () => {
    setSelectedCategory('all');
    setSelectedBrand('all');
    setSearchQuery('');
    setOnlyInStock(false);
    setOnlyFavorites(false);
  };

  // Helper icon map
  const getCategoryIcon = (slug: string) => {
    switch (slug) {
      case 'sogutma-sistemleri': return <Snowflake className="w-5 h-5 text-sky-400" />;
      case 'fan-motorlari': return <Fan className="w-5 h-5 text-cyan-400" />;
      case 'termostatlar-kontrol': return <Thermometer className="w-5 h-5 text-rose-400" />;
      case 'bakir-boru-fittings': return <Pipette className="w-5 h-5 text-amber-500" />;
      case 'sogutucu-gazlar': return <Flame className="w-5 h-5 text-orange-400" />;
      case 'kondenser-evaporator': return <Cpu className="w-5 h-5 text-blue-400" />;
      case 'yikayicilar': return <Waves className="w-5 h-5 text-indigo-400" />;
      case 'pisiriciler': return <Soup className="w-5 h-5 text-red-400" />;
      case 'elektrik-elektronik': return <Zap className="w-5 h-5 text-yellow-400" />;
      case 'hirdavat-el-aletleri': return <Wrench className="w-5 h-5 text-emerald-400" />;
      default: return <ShieldCheck className="w-5 h-5 text-sky-400" />;
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Ürün Kataloğu</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            İskontonuza tanımlı güncel bayi fiyatları ({profile.tier} Kademe - %{(profile.discountRate * 100).toFixed(0)} İskonto)
          </p>
        </div>

        {/* View mode toggle & total count */}
        <div className="flex items-center gap-2">
          <span className="text-xs bg-white border border-slate-200 px-3 py-1.5 rounded-xl text-slate-700 font-mono shadow-xs">
            {totalCount > 0 ? `${totalCount} Ürün` : '0 Ürün'}
          </span>
          <div className="flex items-center bg-white border border-slate-200 rounded-xl p-1 shadow-xs">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1 ${
                viewMode === 'table'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
              title="Tablo / Liste Görünümü"
            >
              <List className="w-4 h-4" />
              <span className="hidden sm:inline">Liste</span>
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1 ${
                viewMode === 'grid'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
              title="Grid / Kart Görünümü"
            >
              <LayoutGrid className="w-4 h-4" />
              <span className="hidden sm:inline">Vitrin</span>
            </button>
          </div>
        </div>
      </div>

      {/* Category Icons Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-2.5 shadow-xs relative group">
        <div className="flex items-center gap-2">
          {/* Scroll left button */}
          <button
            type="button"
            onClick={() => scrollCategories('left')}
            className="p-2 text-slate-500 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition flex-shrink-0"
            title="Sola Kaydır"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Scrollable Container */}
          <div
            ref={categoryScrollRef}
            className="flex items-center gap-2 overflow-x-auto scrollbar-none py-1 flex-1 scroll-smooth"
          >
            <button
              onClick={() => setSelectedCategory('all')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition flex-shrink-0 ${
                selectedCategory === 'all'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-50 text-slate-700 hover:text-slate-900 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Tüm Kategoriler</span>
              <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full ${selectedCategory === 'all' ? 'bg-blue-700 text-white' : 'bg-white text-slate-600 border border-slate-200'}`}>
                {totalCount}
              </span>
            </button>

            {categoriesList.map((cat) => {
              const isSelected = selectedCategory === cat.slug || selectedCategory === cat.name;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(isSelected ? 'all' : cat.name)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition flex-shrink-0 group/item ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-50 text-slate-700 hover:text-slate-900 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  {getCategoryIcon(cat.slug)}
                  <span className="whitespace-nowrap">{cat.name}</span>
                  {cat.discountPercent > 0 && (
                    <span className="text-[9px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-bold border border-red-200">
                      -%{cat.discountPercent}
                    </span>
                  )}
                  {cat._count?.products !== undefined && (
                    <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full ${isSelected ? 'bg-blue-700 text-white' : 'bg-white text-slate-500 border border-slate-200'}`}>
                      {cat._count.products}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Scroll right button */}
          <button
            type="button"
            onClick={() => scrollCategories('right')}
            className="p-2 text-slate-500 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition flex-shrink-0"
            title="Sağa Kaydır"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          
          {/* Search Box */}
          <div className="sm:col-span-6 relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Ürün adı, parça kodu (SKU), marka veya barkod ile arayın..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-blue-600 transition"
            />
          </div>

          {/* Category Filter */}
          <div className="sm:col-span-3">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-blue-600"
            >
              <option value="all">Tüm Kategoriler ({categoriesList.length})</option>
              {categoriesList.map((cat) => (
                <option key={cat.id} value={cat.name}>
                  {cat.name} {cat.discountPercent > 0 ? `(-%${cat.discountPercent})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Brand Filter */}
          <div className="sm:col-span-3">
            <select
              value={selectedBrand}
              onChange={(e) => setSelectedBrand(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-blue-600"
            >
              <option value="all">Tüm Markalar ({BRANDS.length})</option>
              {BRANDS.map((b) => {
                const brandName = typeof b === 'string' ? b : b.name;
                return (
                  <option key={brandName} value={brandName}>
                    {brandName}
                  </option>
                );
              })}
            </select>
          </div>

        </div>

        {/* Quick Toggles */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setOnlyInStock(!onlyInStock)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition font-medium ${
                onlyInStock
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Sadece Stoktakiler</span>
            </button>

            <button
              onClick={() => setOnlyFavorites(!onlyFavorites)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition font-medium ${
                onlyFavorites
                  ? 'bg-amber-50 border-amber-300 text-amber-700'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900'
              }`}
            >
              <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
              <span>Favorilerim</span>
            </button>
          </div>

          {(selectedCategory !== 'all' || selectedBrand !== 'all' || searchQuery !== '' || onlyInStock || onlyFavorites) && (
            <button
              onClick={resetFilters}
              className="flex items-center gap-1 text-slate-500 hover:text-slate-900 transition font-medium"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Filtreleri Temizle</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-16 text-center text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-sky-400 mx-auto mb-3" />
          <div className="text-sm font-semibold text-white">Ürün kataloğu veritabanından çekiliyor...</div>
          <p className="text-xs text-slate-500 mt-1">İlk 100 ürün yükleniyor</p>
        </div>
      ) : displayProducts.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-400">
          <XCircle className="w-10 h-10 text-slate-600 mx-auto mb-2" />
          <div className="text-sm font-bold text-white">Aradığınız kriterlere uygun ürün bulunamadı.</div>
          <p className="text-xs text-slate-500 mt-1">Filtreleri sıfırlayarak tekrar deneyebilirsiniz.</p>
          <button
            onClick={resetFilters}
            className="mt-4 px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold transition"
          >
            Filtreleri Sıfırla
          </button>
        </div>
      ) : viewMode === 'table' ? (
        
        /* TABLE VIEW */
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4 w-12 text-center">Görsel</th>
                  <th className="py-3 px-4">Parça Kodu</th>
                  <th className="py-3 px-4">Ürün Adı / Özellikler</th>
                  <th className="py-3 px-4">Marka</th>
                  <th className="py-3 px-4">Stok</th>
                  <th className="py-3 px-4 text-right">Liste Fiyatı</th>
                  <th className="py-3 px-4 text-right">Bayi Özel Fiyat</th>
                  <th className="py-3 px-4 text-center w-36">Miktar / Sepet</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {displayProducts.map((product) => {
                  const isFav = isFavorite(product.id);
                  const qty = getQty(product);
                  const basePrice = product.basePriceTRY || product.priceTRY;
                  const effectivePrice = product.priceTRY;
                  const discountPct = product.discountPercent || (basePrice > effectivePrice && basePrice > 0 ? Math.round(((basePrice - effectivePrice) / basePrice) * 100) : 0);

                  return (
                    <tr
                      key={product.id}
                      className="hover:bg-slate-50/80 transition group"
                    >
                      {/* Image with zoom click */}
                      <td className="py-3 px-4 text-center">
                        <div
                          onClick={() => setSelectedProductForModal(product)}
                          className="w-12 h-12 mx-auto rounded-lg overflow-hidden bg-slate-50 border border-slate-200 cursor-pointer hover:border-blue-500 transition relative"
                        >
                          <img
                            src={product.image || '/placeholder.svg'}
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-110 transition"
                            onError={(e) => { (e.target as any).src = '/placeholder.svg'; }}
                          />
                        </div>
                      </td>

                      {/* Code */}
                      <td className="py-3 px-4 font-mono font-bold text-blue-600">
                        {product.code}
                      </td>

                      {/* Name & Badges */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            onClick={() => setSelectedProductForModal(product)}
                            className="font-semibold text-slate-900 hover:text-blue-600 cursor-pointer transition line-clamp-1"
                          >
                            {product.name}
                          </span>
                          <button
                            onClick={() => toggleFavorite(product.id)}
                            className="text-slate-400 hover:text-amber-500 transition"
                            title="Favoriye Ekle"
                          >
                            <Star className={`w-3.5 h-3.5 ${isFav ? 'fill-amber-400 text-amber-400' : ''}`} />
                          </button>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {product.category} • PİM: {product.pim} Adet
                        </div>
                      </td>

                      {/* Brand */}
                      <td className="py-3 px-4 font-semibold text-slate-600">
                        {product.brand}
                      </td>

                      {/* Stock Status */}
                      <td className="py-3 px-4">
                        <StockBadge stock={product.stock} unit={product.unit} />
                      </td>

                      {/* List Price */}
                      <td className="py-3 px-4 text-right font-mono text-slate-400">
                        {basePrice > effectivePrice ? (
                          <span className="line-through">{formatCurrency(basePrice)}</span>
                        ) : (
                          formatCurrency(basePrice)
                        )}
                      </td>

                      {/* Dealer Special Net Price */}
                      <td className="py-3 px-4 text-right">
                        <div className="font-mono font-black text-slate-900 text-sm flex items-center justify-end gap-1.5">
                          <span>{formatCurrency(effectivePrice)}</span>
                          {discountPct > 0 && (
                            <span className="text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 px-1.5 py-0.5 rounded">
                              -%{discountPct}
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] font-mono text-slate-400">
                          + KDV
                        </div>
                      </td>

                      {/* Stepper + Add To Cart Button */}
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-end gap-1.5">
                          <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg p-0.5">
                            <button
                              type="button"
                              onClick={() => handleQtyChange(product.id, qty - (product.pim || 1), product.pim || 1)}
                              className="px-2 py-0.5 text-slate-500 hover:text-slate-900 font-bold"
                            >
                              -
                            </button>
                            <input
                              type="number"
                              min={product.pim || 1}
                              step={product.pim || 1}
                              value={qty}
                              onChange={(e) => handleQtyChange(product.id, parseInt(e.target.value) || (product.pim || 1), product.pim || 1)}
                              className="w-8 bg-transparent text-center font-mono font-bold text-slate-900 text-xs focus:outline-none"
                            />
                            <button
                              type="button"
                              onClick={() => handleQtyChange(product.id, qty + (product.pim || 1), product.pim || 1)}
                              className="px-2 py-0.5 text-slate-500 hover:text-slate-900 font-bold"
                            >
                              +
                            </button>
                          </div>

                          <button
                            onClick={() => addToCart(product, qty)}
                            className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg transition shadow-xs flex items-center justify-center"
                            title="Sepete Ekle"
                          >
                            <ShoppingCart className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        
        /* GRID / CARD VIEW */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {displayProducts.map((product) => {
            const isFav = isFavorite(product.id);
            const qty = getQty(product);
            const basePrice = product.basePriceTRY || product.priceTRY;
            const effectivePrice = product.priceTRY;
            const discountPct = product.discountPercent || (basePrice > effectivePrice && basePrice > 0 ? Math.round(((basePrice - effectivePrice) / basePrice) * 100) : 0);

            return (
              <div
                key={product.id}
                className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col justify-between hover:border-blue-400 hover:shadow-md transition group"
              >
                <div>
                  <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-slate-50 mb-3 cursor-pointer border border-slate-100">
                    <img
                      src={product.image || '/placeholder.svg'}
                      alt={product.name}
                      onClick={() => setSelectedProductForModal(product)}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      onError={(e) => { (e.target as any).src = '/placeholder.svg'; }}
                    />
                    {product.isNew && (
                      <span className="absolute top-2 left-2 bg-blue-600 text-white font-bold text-[10px] px-2 py-0.5 rounded-md shadow-xs">
                        YENİ
                      </span>
                    )}
                    {discountPct > 0 && (
                      <span className="absolute bottom-2 left-2 bg-emerald-600 text-white font-bold text-[10px] px-2 py-0.5 rounded-md shadow-xs flex items-center gap-1">
                        -%{discountPct}
                      </span>
                    )}
                    <button
                      onClick={() => toggleFavorite(product.id)}
                      className="absolute top-2 right-2 p-1.5 rounded-lg bg-white/90 backdrop-blur-sm text-slate-400 hover:text-amber-500 shadow-xs transition"
                    >
                      <Star className={`w-4 h-4 ${isFav ? 'fill-amber-400 text-amber-400' : ''}`} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 mb-1">
                    <span className="text-blue-600 font-bold">Kod: {product.code}</span>
                    <span>PİM: {product.pim} Adet</span>
                  </div>

                  <h3
                    onClick={() => setSelectedProductForModal(product)}
                    className="text-xs font-bold text-slate-800 line-clamp-2 mb-2 hover:text-blue-600 cursor-pointer transition"
                  >
                    {product.name}
                  </h3>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 mb-3">
                    <span>Marka: <strong className="text-slate-700">{product.brand}</strong></span>
                    <StockBadge stock={product.stock} unit={product.unit} size="sm" />
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 space-y-3">
                  <div className="flex items-baseline justify-between">
                    <div>
                      <div className="text-base font-black font-mono text-slate-900 flex items-center gap-1.5">
                        <span>{formatCurrency(effectivePrice)}</span>
                        {discountPct > 0 && (
                          <span className="text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 px-1.5 py-0.5 rounded">
                            -%{discountPct}
                          </span>
                        )}
                      </div>
                      {basePrice > effectivePrice && (
                        <div className="text-[10px] text-slate-400 line-through">
                          {formatCurrency(basePrice)}
                        </div>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">+ KDV</div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg p-0.5">
                      <button
                        type="button"
                        onClick={() => handleQtyChange(product.id, qty - (product.pim || 1), product.pim || 1)}
                        className="px-2 py-0.5 text-slate-500 hover:text-slate-900 font-bold"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min={product.pim || 1}
                        step={product.pim || 1}
                        value={qty}
                        onChange={(e) => handleQtyChange(product.id, parseInt(e.target.value) || (product.pim || 1), product.pim || 1)}
                        className="w-8 bg-transparent text-center font-mono font-bold text-slate-900 text-xs focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => handleQtyChange(product.id, qty + (product.pim || 1), product.pim || 1)}
                        className="px-2 py-0.5 text-slate-500 hover:text-slate-900 font-bold"
                      >
                        +
                      </button>
                    </div>

                    <button
                      onClick={() => addToCart(product, qty)}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-3 rounded-lg text-xs font-bold shadow-xs transition flex items-center justify-center gap-1.5"
                    >
                      <ShoppingCart className="w-3.5 h-3.5" />
                      <span>Sepete Ekle</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Infinite Scroll Trigger Sentinel & Loading Indicator */}
      <div ref={observerTarget} className="py-6 text-center">
        {loadingMore && (
          <div className="inline-flex items-center gap-2 bg-slate-900 border border-slate-800 text-sky-400 text-xs font-bold px-4 py-2 rounded-xl shadow-lg">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Daha fazla ürün yükleniyor...</span>
          </div>
        )}
        {!hasMore && displayProducts.length > 0 && (
          <div className="text-xs text-slate-500">
            Tüm ürünler listelendi ({displayProducts.length} / {totalCount})
          </div>
        )}
      </div>

      {/* Product Detail Modal */}
      <ProductDetailModal
        product={selectedProductForModal}
        onClose={() => setSelectedProductForModal(null)}
      />

    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense
      fallback={
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-400">
          <div className="w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <div>Ürün kataloğu yükleniyor...</div>
        </div>
      }
    >
      <ProductsContent />
    </Suspense>
  );
}
