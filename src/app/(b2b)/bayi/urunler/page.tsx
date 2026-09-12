'use client';

import React, { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
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
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Folder,
  FolderOpen,
  Layers,
  Edit,
  Check,
  X
} from 'lucide-react';

function ProductsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryParam = searchParams.get('q') || '';
  const favoriteOnlyParam = searchParams.get('favori') === '1';
  const categoryParam = searchParams.get('category') || 'all';

  const { addToCart, toggleFavorite, isFavorite, convertPrice, profile, showToast } = useStore();

  const [selectedCategory, setSelectedCategory] = useState<string>(categoryParam);
  const [selectedBrand, setSelectedBrand] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>(queryParam);
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState<string>(queryParam);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);
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

  // Dynamic Categories and Brands from PostgreSQL API
  const [categoriesList, setCategoriesList] = useState<any[]>([]);
  const [brandsList, setBrandsList] = useState<any[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const [categorySearchQuery, setCategorySearchQuery] = useState<string>('');
  const [mobileCategoryDrawerOpen, setMobileCategoryDrawerOpen] = useState<boolean>(false);
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

    fetch('/api/brands')
      .then((r) => r.json())
      .then((res) => {
        if (res.success && Array.isArray(res.data)) {
          setBrandsList(res.data);
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

  // Sync category state when URL searchParams change (from link navigation or back/forward)
  useEffect(() => {
    const cat = searchParams.get('category') || 'all';
    setSelectedCategory(cat);
  }, [searchParams]);

  // Instant sync when category is chosen from sidebar flyout menu
  useEffect(() => {
    const handleCategorySelect = (e: Event) => {
      const customEvent = e as CustomEvent<{ category: string }>;
      if (customEvent.detail?.category) {
        setSelectedCategory(customEvent.detail.category);
      }
    };
    window.addEventListener('ersa:category_select', handleCategorySelect);
    return () => window.removeEventListener('ersa:category_select', handleCategorySelect);
  }, []);

  // Auto-scroll selected category pill into view in the horizontal carousel
  useEffect(() => {
    if (selectedCategory && categoryScrollRef.current) {
      const activeBtn = categoryScrollRef.current.querySelector('[data-selected="true"]');
      if (activeBtn) {
        activeBtn.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      }
    }
  }, [selectedCategory, categoriesList]);

  // Main Categories & Subcategories derivations
  const mainCategories = categoriesList.filter((c) => !c.parentId);
  
  const activeCategoryObj = categoriesList.find(
    (c) => c.slug === selectedCategory || c.name === selectedCategory || c.id === selectedCategory
  );
  
  const activeMainCategory = activeCategoryObj
    ? (activeCategoryObj.parentId
        ? categoriesList.find((c) => c.id === activeCategoryObj.parentId)
        : activeCategoryObj)
    : null;

  const activeSubcategories = activeMainCategory
    ? categoriesList.filter((c) => c.parentId === activeMainCategory.id)
    : [];

  // Auto-expand parent category when selected category changes
  useEffect(() => {
    if (activeMainCategory) {
      setExpandedCategories((prev) => ({
        ...prev,
        [activeMainCategory.id]: true
      }));
    }
  }, [activeMainCategory?.id]);

  // Auto-expand parents when typing in category search
  useEffect(() => {
    if (categorySearchQuery.trim()) {
      const q = categorySearchQuery.toLowerCase();
      const newExpanded: Record<string, boolean> = {};
      mainCategories.forEach((mainCat) => {
        const hasMatchingChild = categoriesList
          .filter((c) => c.parentId === mainCat.id)
          .some((sub) => sub.name.toLowerCase().includes(q));
        if (hasMatchingChild) {
          newExpanded[mainCat.id] = true;
        }
      });
      setExpandedCategories((prev) => ({ ...prev, ...newExpanded }));
    }
  }, [categorySearchQuery]);

  // Quick PİM Edit State
  const [editingPimProductId, setEditingPimProductId] = useState<string | null>(null);
  const [tempPimValue, setTempPimValue] = useState<string>('');
  const [isUpdatingPim, setIsUpdatingPim] = useState(false);

  const handleStartEditPim = (product: Product, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingPimProductId(product.id);
    setTempPimValue((product.pim || 1).toString());
  };

  const handleSavePim = async (productId: string) => {
    const parsed = parseInt(tempPimValue, 10);
    if (isNaN(parsed) || parsed < 1) {
      showToast('Lütfen geçerli bir PİM sayısı giriniz (en az 1).', 'warning');
      return;
    }
    setIsUpdatingPim(true);
    try {
      const res = await fetch(`/api/products/${productId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ minOrderQty: parsed })
      });
      const data = await res.json();
      if (data.success) {
        showToast(`PİM sayısı ${parsed} Adet olarak güncellendi!`, 'success');
        setProductsList((prev) =>
          prev.map((p) => (p.id === productId ? { ...p, pim: parsed } : p))
        );
        setQuantities((prev) => ({ ...prev, [productId]: parsed }));
        setEditingPimProductId(null);
      } else {
        showToast(data.error || 'PİM sayısı güncellenemedi.', 'error');
      }
    } catch {
      showToast('Bağlantı hatası oluştu.', 'error');
    } finally {
      setIsUpdatingPim(false);
    }
  };

  const handleQtyChange = (productId: string, val: number, pim: number, maxStock?: number) => {
    let validVal = Math.max(1, val);
    if (maxStock !== undefined && maxStock > 0 && validVal > maxStock) {
      validVal = maxStock;
    }
    setQuantities((prev) => ({ ...prev, [productId]: validVal }));
  };

  const getQty = (product: Product) => {
    const raw = quantities[product.id] || product.pim || 1;
    if (product.stock > 0 && raw > product.stock) {
      return product.stock;
    }
    return raw;
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
      if (debouncedSearchQuery.trim() !== '') params.set('q', debouncedSearchQuery.trim());
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
  }, [selectedCategory, selectedBrand, debouncedSearchQuery, onlyInStock]);

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
    router.push('/bayi/urunler');
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

  // Category Tree Filter Logic (filters parents if parent matches OR any subcategory matches)
  const filteredMainCategories = mainCategories.filter((mainCat) => {
    if (!categorySearchQuery.trim()) return true;
    const q = categorySearchQuery.toLowerCase();
    const mainMatches = mainCat.name.toLowerCase().includes(q);
    const subMatches = categoriesList
      .filter((c) => c.parentId === mainCat.id)
      .some((sub) => sub.name.toLowerCase().includes(q));
    return mainMatches || subMatches;
  });

  const renderCategoryTree = (isDrawer: boolean = false) => (
    <div className={`bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden flex flex-col ${isDrawer ? 'border-none shadow-none rounded-none h-full' : ''}`}>
      {/* Category Tree Header */}
      <div className="p-3.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-[#0D1424]">
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <h2 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider">Kategoriler</h2>
          </div>
          <span className="text-[10px] font-mono font-bold bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 px-2 py-0.5 rounded-full">
            {categoriesList.length}
          </span>
        </div>

        {/* Quick Search in Categories */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            placeholder="Kategorilerde ara..."
            value={categorySearchQuery}
            onChange={(e) => setCategorySearchQuery(e.target.value)}
            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl pl-8 pr-7 py-2 text-xs text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-600 dark:focus:border-blue-500 focus:ring-1 focus:ring-blue-600 dark:focus:ring-blue-500 transition"
          />
          {categorySearchQuery && (
            <button
              onClick={() => setCategorySearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer"
              title="Aramayı Temizle"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Categories Scrollable List */}
      <div className={`p-2 space-y-1 overflow-y-auto scrollbar-thin dark:scrollbar-thumb-slate-800 ${isDrawer ? 'flex-1' : 'max-h-[calc(100vh-240px)]'}`}>
        {/* All Categories Option */}
        <button
          type="button"
          onClick={() => {
            setSelectedCategory('all');
            router.push('/bayi/urunler');
            if (isDrawer) setMobileCategoryDrawerOpen(false);
          }}
          className={`w-full text-left text-xs font-semibold px-3 py-2.5 rounded-xl flex items-center justify-between transition cursor-pointer mb-1 ${
            selectedCategory === 'all'
              ? 'bg-slate-900 dark:bg-blue-600 text-white shadow-xs'
              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80'
          }`}
        >
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-sky-400" />
            <span>Tüm Ürünler / Kategoriler</span>
          </div>
          <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-md ${
            selectedCategory === 'all' ? 'bg-slate-800 dark:bg-blue-700 text-slate-200 dark:text-blue-100' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
          }`}>
            {totalCount}
          </span>
        </button>

        {/* Dynamic Category Tree */}
        {filteredMainCategories.length === 0 ? (
          <div className="p-4 text-center text-xs text-slate-400 dark:text-slate-500">
            Kategori bulunamadı.
          </div>
        ) : (
          filteredMainCategories.map((mainCat) => {
            const subcategories = categoriesList.filter((c) => c.parentId === mainCat.id);
            const hasSubs = subcategories.length > 0;
            const isExpanded = Boolean(expandedCategories[mainCat.id]);
            const isMainSelected = selectedCategory === mainCat.name || selectedCategory === mainCat.slug;

            return (
              <div key={mainCat.id} className="space-y-0.5">
                {/* Main Category Accordion Header */}
                <div
                  onClick={() => {
                    if (hasSubs) {
                      setExpandedCategories((prev) => ({
                        ...prev,
                        [mainCat.id]: !prev[mainCat.id]
                      }));
                    }
                    const next = (isMainSelected && !hasSubs) ? 'all' : mainCat.name;
                    setSelectedCategory(next);
                    if (next === 'all') {
                      router.push('/bayi/urunler');
                    } else {
                      router.push(`/bayi/urunler?category=${encodeURIComponent(next)}`);
                    }
                    if (!hasSubs && isDrawer) {
                      setMobileCategoryDrawerOpen(false);
                    }
                  }}
                  className={`w-full text-left text-xs font-semibold px-3.5 py-2.5 rounded-xl flex items-center justify-between transition cursor-pointer select-none ${
                    isExpanded || isMainSelected
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/90 dark:hover:bg-slate-800/80'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0 pr-2">
                    <span className="truncate">{mainCat.name}</span>
                    {mainCat._count?.products !== undefined && (
                      <span
                        className={`text-[9px] font-mono px-1.5 py-0.2 rounded-md ${
                          isExpanded || isMainSelected
                            ? 'bg-blue-700 text-blue-100'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                        }`}
                      >
                        {mainCat._count.products}
                      </span>
                    )}
                  </div>

                  {hasSubs ? (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setExpandedCategories((prev) => ({
                          ...prev,
                          [mainCat.id]: !prev[mainCat.id]
                        }));
                      }}
                      className={`p-1 rounded-md transition cursor-pointer ${
                        isExpanded || isMainSelected ? 'text-white hover:bg-blue-700' : 'text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                      }`}
                    >
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-white" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>
                  ) : null}
                </div>

                {/* Subcategories (Indented under parent as shown in photo) */}
                {hasSubs && isExpanded && (
                  <div className="pl-3 pr-1 py-1 space-y-0.5 bg-slate-50/70 dark:bg-slate-950/60 rounded-xl my-1 border border-slate-100 dark:border-slate-800/80 animate-in fade-in duration-150">
                    {subcategories.map((sub) => {
                      const isSubSelected = selectedCategory === sub.name || selectedCategory === sub.slug;
                      return (
                        <button
                          key={sub.id}
                          type="button"
                          onClick={() => {
                            const next = isSubSelected ? mainCat.name : sub.name;
                            setSelectedCategory(next);
                            router.push(`/bayi/urunler?category=${encodeURIComponent(next)}`);
                            if (isDrawer) setMobileCategoryDrawerOpen(false);
                          }}
                          className={`w-full text-left text-xs py-2 px-3 rounded-lg flex items-center justify-between transition cursor-pointer ${
                            isSubSelected
                              ? 'bg-blue-50 dark:bg-blue-600/20 text-blue-700 dark:text-blue-400 font-bold border-l-2 border-blue-600 dark:border-blue-500 pl-2.5 shadow-xs'
                              : 'text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80 font-medium'
                          }`}
                        >
                          <span className="truncate">{sub.name}</span>
                          {sub._count?.products !== undefined && (
                            <span
                              className={`text-[9px] font-mono px-1.5 py-0.2 rounded-md ${
                                isSubSelected
                                  ? 'bg-blue-200/60 dark:bg-blue-900/60 text-blue-800 dark:text-blue-200 font-bold'
                                  : 'bg-slate-200/60 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                              }`}
                            >
                              {sub._count.products}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Ürün Kataloğu</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            İskontonuza tanımlı güncel bayi fiyatları ({profile.tier} Kademe - %{(profile.discountRate * 100).toFixed(0)} İskonto)
          </p>
        </div>

        {/* View mode toggle & total count */}
        <div className="flex items-center gap-2">
          <span className="text-xs bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 px-3 py-1.5 rounded-xl text-slate-700 dark:text-slate-300 font-mono shadow-xs">
            {totalCount > 0 ? `${totalCount} Ürün` : '0 Ürün'}
          </span>
          <div className="flex items-center bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-xl p-1 shadow-xs">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1 ${
                viewMode === 'table'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
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
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Grid / Kart Görünümü"
            >
              <LayoutGrid className="w-4 h-4" />
              <span className="hidden sm:inline">Vitrin</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Category Toggle Bar (< lg) */}
      <div className="lg:hidden flex items-center justify-between bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 shadow-xs">
        <div className="flex items-center gap-2 min-w-0 pr-2">
          <Layers className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
          <div className="text-xs truncate">
            <span className="text-slate-400 dark:text-slate-500">Kategori: </span>
            <strong className="text-slate-800 dark:text-white">{selectedCategory === 'all' ? 'Tüm Kategoriler' : selectedCategory}</strong>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setMobileCategoryDrawerOpen(true)}
          className="px-3 py-1.5 bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-bold rounded-xl text-xs border border-blue-200 dark:border-blue-800/60 transition cursor-pointer flex items-center gap-1.5 flex-shrink-0"
        >
          <Folder className="w-3.5 h-3.5" />
          <span>Kategoriler</span>
        </button>
      </div>

      {/* 2-Column Responsive Layout: Left Category Tree + Right Product Catalog */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Category Accordion Tree (Sticky Sidebar on Desktop as shown in screenshot) */}
        <aside className="hidden lg:block lg:col-span-3 xl:col-span-3 sticky top-20">
          {renderCategoryTree(false)}
        </aside>

        {/* Right Column: Search, Filters & Products Table / Grid */}
        <div className="lg:col-span-9 xl:col-span-9 space-y-5 min-w-0">
          {/* Active Category Breadcrumb Pill */}
          {selectedCategory !== 'all' && (
            <div className="flex items-center gap-2 bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/50 rounded-xl px-3.5 py-2 text-xs text-blue-900 dark:text-blue-200 animate-in fade-in duration-150">
              <span className="text-slate-500 dark:text-slate-400">Seçili Kategori:</span>
              <strong className="font-bold text-blue-900 dark:text-white">{activeMainCategory?.name || selectedCategory}</strong>
              {activeCategoryObj?.parentId && (
                <>
                  <span className="text-slate-400 dark:text-slate-500">›</span>
                  <strong className="text-blue-600 dark:text-blue-400">{activeCategoryObj.name}</strong>
                </>
              )}
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory('all');
                  router.push('/bayi/urunler');
                }}
                className="ml-auto text-blue-700 dark:text-blue-400 hover:text-red-600 dark:hover:text-red-400 p-1 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-lg transition cursor-pointer"
                title="Kategori Filtresini Temizle"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

      {/* Search & Filter Bar */}
      <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          
          {/* Search Box */}
          <div className="sm:col-span-6 relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
            <input
              type="text"
              placeholder="Ürün adı, parça kodu (SKU), marka veya barkod ile arayın..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:border-blue-600 dark:focus:border-blue-500 transition"
            />
          </div>

          {/* Category Filter */}
          <div className="sm:col-span-3">
            <select
              value={selectedCategory}
              onChange={(e) => {
                const next = e.target.value;
                setSelectedCategory(next);
                if (next === 'all') {
                  router.push('/bayi/urunler');
                } else {
                  router.push(`/bayi/urunler?category=${encodeURIComponent(next)}`);
                }
              }}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 rounded-xl px-3 py-2.5 text-xs text-slate-800 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:border-blue-600 dark:focus:border-blue-500 cursor-pointer"
            >
              <option value="all" className="dark:bg-slate-900">Tüm Kategoriler ({categoriesList.length})</option>
              {mainCategories.map((mainCat) => {
                const subs = categoriesList.filter((c) => c.parentId === mainCat.id);
                return (
                  <React.Fragment key={mainCat.id}>
                    <option value={mainCat.name} className="font-bold dark:bg-slate-900">
                      📁 {mainCat.name} {mainCat._count?.products ? `(${mainCat._count.products})` : ''}
                    </option>
                    {subs.map((sub) => (
                      <option key={sub.id} value={sub.name} className="dark:bg-slate-900">
                        &nbsp;&nbsp;&nbsp;&nbsp;↳ {sub.name} {sub._count?.products ? `(${sub._count.products})` : ''}
                      </option>
                    ))}
                  </React.Fragment>
                );
              })}
            </select>
          </div>

          {/* Brand Filter */}
          <div className="sm:col-span-3">
            <select
              value={selectedBrand}
              onChange={(e) => setSelectedBrand(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 rounded-xl px-3 py-2.5 text-xs text-slate-800 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:border-blue-600 dark:focus:border-blue-500"
            >
              <option value="all" className="dark:bg-slate-900">Tüm Markalar ({brandsList.length})</option>
              {brandsList.map((b) => (
                <option key={b.id || b.name} value={b.name} className="dark:bg-slate-900">
                  {b.name} ({b.productCount})
                </option>
              ))}
            </select>
          </div>

        </div>

        {/* Quick Toggles */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setOnlyInStock(!onlyInStock)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition font-medium ${
                onlyInStock
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
                  : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Sadece Stoktakiler</span>
            </button>

            <button
              onClick={() => setOnlyFavorites(!onlyFavorites)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition font-medium ${
                onlyFavorites
                  ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-700 dark:text-amber-300'
                  : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
              <span>Favorilerim</span>
            </button>
          </div>

          {(selectedCategory !== 'all' || selectedBrand !== 'all' || searchQuery !== '' || onlyInStock || onlyFavorites) && (
            <button
              onClick={resetFilters}
              className="flex items-center gap-1 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition font-medium cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Filtreleri Temizle</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-xs rounded-2xl p-16 text-center text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-sky-400 mx-auto mb-3" />
          <div className="text-sm font-semibold text-slate-900 dark:text-white">Ürün kataloğu veritabanından çekiliyor...</div>
          <p className="text-xs text-slate-500 mt-1">İlk 100 ürün yükleniyor</p>
        </div>
      ) : displayProducts.length === 0 ? (
        <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-xs rounded-2xl p-12 text-center text-slate-400">
          <XCircle className="w-10 h-10 text-slate-600 mx-auto mb-2" />
          <div className="text-sm font-bold text-slate-900 dark:text-white">Aradığınız kriterlere uygun ürün bulunamadı.</div>
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
        <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-[#0D1424] text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-3 w-10 text-center">No</th>
                  <th className="py-3 px-2.5 w-14 text-center">Durum</th>
                  <th className="py-3 px-3 w-12 text-center">Görsel</th>
                  <th className="py-3 px-4">Parça Kodu</th>
                  <th className="py-3 px-4">Ürün Adı / Özellikler</th>
                  <th className="py-3 px-4">Marka</th>
                  <th className="py-3 px-4">Stok</th>
                  <th className="py-3 px-4 text-right">Liste Fiyatı</th>
                  <th className="py-3 px-4 text-right">Bayi Özel Fiyat</th>
                  <th className="py-3 px-4 text-center w-36">Miktar / Sepet</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {displayProducts.map((product, idx) => {
                  const isFav = isFavorite(product.id);
                  const qty = getQty(product);
                  const basePrice = product.basePriceTRY || product.priceTRY;
                  const effectivePrice = product.priceTRY;
                  const discountPct = product.discountPercent || (basePrice > effectivePrice && basePrice > 0 ? Math.round(((basePrice - effectivePrice) / basePrice) * 100) : 0);
                  const rowNumber = (page - 1) * 100 + idx + 1;

                  return (
                    <tr
                      key={product.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition group"
                    >
                      {/* No Column (Circular badge as in photo) */}
                      <td className="py-3 px-3 text-center">
                        <span className="w-6 h-6 rounded-full bg-slate-800 dark:bg-slate-700 text-white text-[10px] font-bold inline-flex items-center justify-center font-mono shadow-xs">
                          {rowNumber}
                        </span>
                      </td>

                      {/* Status indicator (Genel Durum dot as in photo) */}
                      <td className="py-3 px-2.5 text-center">
                        {product.inStock ? (
                          <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 inline-block shadow-xs ring-2 ring-emerald-200 dark:ring-emerald-900/60" title="Stokta Mevcut" />
                        ) : (
                          <span className="w-3.5 h-3.5 rounded-full bg-rose-500 inline-block shadow-xs ring-2 ring-rose-200 dark:ring-rose-900/60" title="Tükendi" />
                        )}
                      </td>

                      {/* Image with zoom click */}
                      <td className="py-3 px-3 text-center">
                        <div
                          onClick={() => setSelectedProductForModal(product)}
                          className="w-12 h-12 mx-auto rounded-lg overflow-hidden bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 cursor-pointer hover:border-blue-500 transition relative"
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
                      <td className="py-3 px-4 font-mono font-bold text-blue-600 dark:text-blue-400">
                        {product.code}
                      </td>

                      {/* Name & Badges */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            onClick={() => setSelectedProductForModal(product)}
                            className="font-semibold text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer transition line-clamp-1"
                          >
                            {product.name}
                          </span>
                          <button
                            onClick={() => toggleFavorite(product.id)}
                            className="text-slate-400 dark:text-slate-500 hover:text-amber-500 dark:hover:text-amber-400 transition"
                            title="Favoriye Ekle"
                          >
                            <Star className={`w-3.5 h-3.5 ${isFav ? 'fill-amber-400 text-amber-400' : ''}`} />
                          </button>
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1.5 flex-wrap">
                          <span>{product.category} • </span>
                          {editingPimProductId === product.id ? (
                            <div className="inline-flex items-center gap-1 bg-white dark:bg-slate-900 px-1.5 py-0.5 rounded-lg border border-sky-500 shadow-sm" onClick={(e) => e.stopPropagation()}>
                              <span className="text-[10px] text-slate-400">PİM:</span>
                              <input
                                type="number"
                                min={1}
                                autoFocus
                                value={tempPimValue}
                                onChange={(e) => setTempPimValue(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleSavePim(product.id);
                                  if (e.key === 'Escape') setEditingPimProductId(null);
                                }}
                                className="w-12 bg-transparent text-center font-mono font-bold text-xs text-sky-500 dark:text-sky-400 focus:outline-none"
                              />
                              <span className="text-[10px] text-slate-400">Adet</span>
                              <button
                                type="button"
                                disabled={isUpdatingPim}
                                onClick={() => handleSavePim(product.id)}
                                className="px-1.5 py-0.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[10px] font-bold cursor-pointer"
                                title="Kaydet"
                              >
                                <Check className="w-3 h-3" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingPimProductId(null)}
                                className="px-1 py-0.5 text-slate-400 hover:text-slate-200 text-[10px] cursor-pointer"
                                title="İptal"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={(e) => handleStartEditPim(product, e)}
                              className="inline-flex items-center gap-1 text-slate-500 dark:text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-950/40 px-1.5 py-0.5 rounded transition cursor-pointer group/pim"
                              title="PİM (Paket İçi Miktar) sayısını değiştirmek için tıklayın"
                            >
                              <span>PİM: <strong className="text-slate-700 dark:text-slate-300 group-hover/pim:text-sky-500">{product.pim} Adet</strong></span>
                              <Edit className="w-3 h-3 opacity-60 group-hover/pim:opacity-100 transition text-sky-500" />
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Brand */}
                      <td className="py-3 px-4 font-semibold text-slate-600 dark:text-slate-300">
                        {product.brand}
                      </td>

                      {/* Stock Status */}
                      <td className="py-3 px-4">
                        <StockBadge stock={product.stock} unit={product.unit} />
                      </td>

                      {/* List Price */}
                      <td className="py-3 px-4 text-right font-mono text-slate-400 dark:text-slate-500">
                        {basePrice <= 0 ? (
                          <span className="text-amber-500 font-semibold text-[11px]">Sorunuz</span>
                        ) : basePrice > effectivePrice ? (
                          <span className="line-through">{formatCurrency(basePrice)}</span>
                        ) : (
                          formatCurrency(basePrice)
                        )}
                      </td>

                      {/* Dealer Special Net Price */}
                      <td className="py-3 px-4 text-right">
                        {effectivePrice <= 0 ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900/60 text-[11px] font-bold">
                            Fiyat Bekleniyor
                          </span>
                        ) : (
                          <>
                            <div className="font-mono font-black text-slate-900 dark:text-white text-sm flex items-center justify-end gap-1.5">
                              <span>{formatCurrency(effectivePrice)}</span>
                              {discountPct > 0 && (
                                <span className="text-[10px] font-bold bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60 px-1.5 py-0.5 rounded">
                                  -%{discountPct}
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] font-mono text-slate-400 dark:text-slate-500">
                              + KDV
                            </div>
                          </>
                        )}
                      </td>

                      {/* Stepper + Add To Cart Button */}
                      <td className="py-3 px-4">
                        {effectivePrice <= 0 ? (
                          <div className="flex justify-center">
                            <span className="text-[10px] font-medium text-slate-400 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded border border-slate-200 dark:border-slate-700 whitespace-nowrap">
                              İletişime Geçin
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-1.5">
                            <div className="flex items-center bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-0.5">
                              <button
                                type="button"
                                onClick={() => handleQtyChange(product.id, Math.max(1, qty - 1), 1, product.stock)}
                                className="px-2 py-0.5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-bold cursor-pointer"
                              >
                                -
                              </button>
                              <input
                                type="number"
                                min={1}
                                max={product.stock > 0 ? product.stock : undefined}
                                step={1}
                                value={qty}
                                onChange={(e) => {
                                  const raw = parseInt(e.target.value, 10);
                                  let val = isNaN(raw) ? 1 : raw;
                                  if (val < 1) val = 1;
                                  if (product.stock > 0 && val > product.stock) {
                                    val = product.stock;
                                  }
                                  handleQtyChange(product.id, val, 1, product.stock);
                                }}
                                className="w-8 bg-transparent text-center font-mono font-bold text-slate-900 dark:text-white text-xs focus:outline-none"
                              />
                              <button
                                type="button"
                                onClick={() => handleQtyChange(product.id, qty + 1, 1, product.stock)}
                                className="px-2 py-0.5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-bold cursor-pointer"
                              >
                                +
                              </button>
                            </div>

                            <button
                              onClick={() => addToCart(product, qty)}
                              className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg transition shadow-xs flex items-center justify-center cursor-pointer"
                              title="Sepete Ekle"
                            >
                              <ShoppingCart className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
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
                className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs flex flex-col justify-between hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-md transition group"
              >
                <div>
                  <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-slate-50 dark:bg-slate-900 mb-3 cursor-pointer border border-slate-100 dark:border-slate-800">
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
                      className="absolute top-2 right-2 p-1.5 rounded-lg bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm text-slate-400 hover:text-amber-500 shadow-xs transition cursor-pointer"
                    >
                      <Star className={`w-4 h-4 ${isFav ? 'fill-amber-400 text-amber-400' : ''}`} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 dark:text-slate-400 mb-1">
                    <span className="text-blue-600 dark:text-blue-400 font-bold">Kod: {product.code}</span>
                    {editingPimProductId === product.id ? (
                      <div className="inline-flex items-center gap-1 bg-white dark:bg-slate-900 px-1 py-0.5 rounded border border-sky-500 shadow-sm" onClick={(e) => e.stopPropagation()}>
                        <span className="text-[10px] text-slate-400">PİM:</span>
                        <input
                          type="number"
                          min={1}
                          autoFocus
                          value={tempPimValue}
                          onChange={(e) => setTempPimValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSavePim(product.id);
                            if (e.key === 'Escape') setEditingPimProductId(null);
                          }}
                          className="w-10 bg-transparent text-center font-mono font-bold text-xs text-sky-500 focus:outline-none"
                        />
                        <button
                          type="button"
                          disabled={isUpdatingPim}
                          onClick={() => handleSavePim(product.id)}
                          className="p-0.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[10px] cursor-pointer"
                          title="Kaydet"
                        >
                          <Check className="w-2.5 h-2.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingPimProductId(null)}
                          className="p-0.5 text-slate-400 hover:text-slate-200 text-[10px] cursor-pointer"
                          title="İptal"
                        >
                          <X className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => handleStartEditPim(product, e)}
                        className="inline-flex items-center gap-1 text-slate-500 dark:text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 px-1 py-0.5 rounded transition cursor-pointer group/pim"
                        title="PİM sayısını değiştirmek için tıklayın"
                      >
                        <span>PİM: <strong className="text-slate-700 dark:text-slate-300 group-hover/pim:text-sky-600">{product.pim} Adet</strong></span>
                        <Edit className="w-3 h-3 opacity-60 group-hover/pim:opacity-100 text-sky-500" />
                      </button>
                    )}
                  </div>

                  <h3
                    onClick={() => setSelectedProductForModal(product)}
                    className="text-xs font-bold text-slate-800 dark:text-white line-clamp-2 mb-2 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer transition"
                  >
                    {product.name}
                  </h3>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mb-3">
                    <span>Marka: <strong className="text-slate-700 dark:text-slate-300">{product.brand}</strong></span>
                    <StockBadge stock={product.stock} unit={product.unit} size="sm" />
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3">
                  <div className="flex items-baseline justify-between">
                    <div>
                      {effectivePrice <= 0 ? (
                        <div className="text-xs font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-1 rounded-md border border-amber-200 dark:border-amber-900/60">
                          Fiyat Bekleniyor
                        </div>
                      ) : (
                        <>
                          <div className="text-base font-black font-mono text-slate-900 dark:text-white flex items-center gap-1.5">
                            <span>{formatCurrency(effectivePrice)}</span>
                            {discountPct > 0 && (
                              <span className="text-[10px] font-bold bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60 px-1.5 py-0.5 rounded">
                                -%{discountPct}
                              </span>
                            )}
                          </div>
                          {basePrice > effectivePrice && (
                            <div className="text-[10px] text-slate-400 dark:text-slate-500 line-through">
                              {formatCurrency(basePrice)}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                    {effectivePrice > 0 && <div className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">+ KDV</div>}
                  </div>

                  {effectivePrice <= 0 ? (
                    <button
                      disabled
                      className="w-full bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 py-2 px-3 rounded-lg text-xs font-semibold cursor-not-allowed border border-slate-200 dark:border-slate-700"
                    >
                      Fiyat İçin İletişime Geçin
                    </button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <div className="flex items-center bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-0.5">
                        <button
                          type="button"
                          onClick={() => handleQtyChange(product.id, Math.max(1, qty - 1), 1, product.stock)}
                          className="px-2 py-0.5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-bold cursor-pointer"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          min={1}
                          max={product.stock > 0 ? product.stock : undefined}
                          step={1}
                          value={qty}
                          onChange={(e) => {
                            const raw = parseInt(e.target.value, 10);
                            let val = isNaN(raw) ? 1 : raw;
                            if (val < 1) val = 1;
                            if (product.stock > 0 && val > product.stock) {
                              val = product.stock;
                            }
                            handleQtyChange(product.id, val, 1, product.stock);
                          }}
                          className="w-8 bg-transparent text-center font-mono font-bold text-slate-900 dark:text-white text-xs focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => handleQtyChange(product.id, qty + 1, 1, product.stock)}
                          className="px-2 py-0.5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-bold cursor-pointer"
                        >
                          +
                        </button>
                      </div>

                      <button
                        onClick={() => addToCart(product, qty)}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-3 rounded-lg text-xs font-bold shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <ShoppingCart className="w-3.5 h-3.5" />
                        <span>Sepete Ekle</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Explicit Pagination Bar & Item Counter */}
      {displayProducts.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl text-xs text-slate-600 dark:text-slate-300 shadow-xs">
          <div>
            Gösterilen: <strong className="text-slate-900 dark:text-white">1 – {displayProducts.length}</strong> / <strong className="text-blue-600 dark:text-sky-400">{totalCount.toLocaleString('tr-TR')}</strong> Ürün
          </div>

          <div className="flex items-center gap-2">
            {hasMore ? (
              <button
                onClick={() => fetchProducts(page + 1, false)}
                disabled={loadingMore}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition flex items-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {loadingMore ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                <span>Daha Fazla Yükle ({Math.min(100, Math.max(0, totalCount - displayProducts.length))} Ürün)</span>
              </button>
            ) : (
              <span className="text-slate-400 dark:text-slate-500 font-semibold">Tüm {totalCount.toLocaleString('tr-TR')} ürün listelendi</span>
            )}
          </div>
        </div>
      )}

      {/* Infinite Scroll Trigger Sentinel & Loading Indicator */}
      <div ref={observerTarget} className="py-6 text-center">
        {loadingMore && (
          <div className="inline-flex items-center gap-2 bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-xs text-sky-400 text-xs font-bold px-4 py-2 rounded-xl shadow-lg">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Daha fazla ürün yükleniyor...</span>
          </div>
        )}
      </div>

        </div>
      </div>

      {/* Mobile Category Drawer Modal */}
      {mobileCategoryDrawerOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex justify-end lg:hidden animate-in fade-in duration-150">
          <div className="w-full max-w-xs bg-white dark:bg-[#111827] h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-[#0D1424]">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <h3 className="font-bold text-sm text-slate-800 dark:text-white">Kategoriler</h3>
              </div>
              <button
                type="button"
                onClick={() => setMobileCategoryDrawerOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition cursor-pointer"
                title="Kapat"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              {renderCategoryTree(true)}
            </div>
          </div>
        </div>
      )}

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
        <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-xs rounded-2xl p-12 text-center text-slate-400">
          <div className="w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <div>Ürün kataloğu yükleniyor...</div>
        </div>
      }
    >
      <ProductsContent />
    </Suspense>
  );
}
