'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Search,
  SlidersHorizontal,
  Package,
  Lock,
  ArrowRight,
  Sparkles,
  ChevronRight,
  Eye,
  X,
  Layers,
  Tag
} from 'lucide-react';

interface ProductItem {
  id: string;
  name: string;
  sku: string;
  barcode?: string | null;
  salePrice?: number | null;
  currency: string;
  stockQty: number;
  category?: { id: string; name: string } | null;
  brand?: { id: string; name: string } | null;
  images: { id: string; url: string; isPrimary: boolean }[];
  description?: string | null;
}

export default function PublicProductsPage() {
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedBrand, setSelectedBrand] = useState<string>('all');
  const [selectedProduct, setSelectedProduct] = useState<ProductItem | null>(null);

  useEffect(() => {
    async function loadProducts() {
      try {
        setLoading(true);
        const res = await fetch('/api/products');
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setProducts(json.data);
        }
      } catch (err) {
        console.error('Failed to load products:', err);
      } finally {
        setLoading(false);
      }
    }
    loadProducts();
  }, []);

  const categories = useMemo(() => {
    const map = new Map<string, string>();
    products.forEach((p) => {
      if (p.category) {
        map.set(p.category.id, p.category.name);
      }
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [products]);

  const brands = useMemo(() => {
    const map = new Map<string, string>();
    products.forEach((p) => {
      if (p.brand) {
        map.set(p.brand.id, p.brand.name);
      }
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (selectedCategory !== 'all' && p.category?.id !== selectedCategory) {
        return false;
      }
      if (selectedBrand !== 'all' && p.brand?.id !== selectedBrand) {
        return false;
      }
      if (search.trim() !== '') {
        const query = search.toLowerCase().trim();
        const matchesName = p.name.toLowerCase().includes(query);
        const matchesSku = p.sku.toLowerCase().includes(query);
        const matchesBrand = p.brand?.name.toLowerCase().includes(query);
        if (!matchesName && !matchesSku && !matchesBrand) return false;
      }
      return true;
    });
  }, [products, selectedCategory, selectedBrand, search]);

  return (
    <div className="min-h-screen bg-slate-50 py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb & Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-slate-500 mb-2">
            <Link href="/" className="hover:text-sky-600">Ana Sayfa</Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-slate-900 font-semibold">Ürün Kataloğu</span>
          </div>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">Ürün Kataloğu</h1>
              <p className="text-slate-600 mt-1">Endüstriyel ve ticari soğutma sistemleri, kompresörler ve yedek parçalar.</p>
            </div>
            <div className="bg-sky-50 border border-sky-200 rounded-2xl px-5 py-3 flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-sky-600 shrink-0" />
              <div className="text-xs text-sky-900">
                <span className="font-bold">B2B Fiyatlandırma:</span> Toptan indirimli fiyatları görmek için{' '}
                <Link href="/bayi/login" className="font-bold underline text-sky-600 hover:text-sky-800">
                  Bayi Girişi yapınız &rarr;
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search Input */}
            <div className="relative md:col-span-2">
              <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Ürün adı, kod veya parça numarası ile arayın..."
                className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white transition"
              />
            </div>

            {/* Category Filter */}
            <div>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500 transition"
              >
                <option value="all">Tüm Kategoriler ({categories.length})</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Brand Filter */}
            <div>
              <select
                value={selectedBrand}
                onChange={(e) => setSelectedBrand(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500 transition"
              >
                <option value="all">Tüm Markalar ({brands.length})</option>
                {brands.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Product Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl p-4 border border-slate-200 animate-pulse">
                <div className="w-full h-48 bg-slate-200 rounded-xl mb-4"></div>
                <div className="h-4 bg-slate-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-slate-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 p-8">
            <Package className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-800">Aradığınız kriterlere uygun ürün bulunamadı</h3>
            <p className="text-slate-500 mt-2 text-sm">Farklı bir arama terimi veya kategori seçmeyi deneyin.</p>
            <button
              onClick={() => {
                setSearch('');
                setSelectedCategory('all');
                setSelectedBrand('all');
              }}
              className="mt-6 px-6 py-2.5 bg-sky-600 text-white rounded-xl font-bold text-sm hover:bg-sky-700 transition"
            >
              Filtreleri Temizle
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredProducts.map((product) => {
              const primaryImg = product.images?.[0]?.url || '/placeholder.png';
              return (
                <div
                  key={product.id}
                  className="group bg-white rounded-2xl border border-slate-200 hover:border-sky-300 hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden"
                >
                  {/* Image Container */}
                  <div className="relative bg-slate-50 p-6 flex items-center justify-center h-52 overflow-hidden border-b border-slate-100">
                    <img
                      src={primaryImg}
                      alt={product.name}
                      className="max-h-40 max-w-full object-contain group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                    {/* Badge */}
                    <div className="absolute top-3 left-3 flex flex-col gap-1">
                      {product.brand && (
                        <span className="px-2.5 py-1 bg-white/90 backdrop-blur-sm border border-slate-200 text-slate-700 font-bold text-[11px] rounded-lg shadow-sm">
                          {product.brand.name}
                        </span>
                      )}
                    </div>
                    {/* Quick View Button */}
                    <button
                      onClick={() => setSelectedProduct(product)}
                      className="absolute bottom-3 right-3 p-2 bg-white text-slate-700 hover:text-sky-600 rounded-xl shadow-md opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0"
                      title="Hızlı İncele"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Product Details */}
                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono mb-1.5">
                        <Tag className="w-3 h-3" />
                        <span>KOD: {product.sku}</span>
                      </div>
                      <h3 className="font-bold text-slate-900 text-sm line-clamp-2 group-hover:text-sky-600 transition-colors">
                        {product.name}
                      </h3>
                      {product.category && (
                        <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                          <Layers className="w-3 h-3" />
                          {product.category.name}
                        </p>
                      )}
                    </div>

                    <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                        <Lock className="w-3.5 h-3.5 text-amber-500" />
                        <span>B2B Özel Fiyat</span>
                      </div>
                      <Link
                        href="/bayi/login"
                        className="px-3.5 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-700 font-bold text-xs rounded-lg transition flex items-center gap-1"
                      >
                        Giriş Yap <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Modal: Quick View */}
        {selectedProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
              <button
                onClick={() => setSelectedProduct(null)}
                className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="bg-slate-50 rounded-2xl p-6 flex items-center justify-center min-h-[220px]">
                  <img
                    src={selectedProduct.images?.[0]?.url || '/placeholder.png'}
                    alt={selectedProduct.name}
                    className="max-h-56 max-w-full object-contain"
                  />
                </div>

                <div className="flex flex-col justify-between">
                  <div>
                    <span className="px-2.5 py-1 bg-sky-100 text-sky-800 text-xs font-bold rounded-lg">
                      {selectedProduct.brand?.name || 'Orijinal Yedek Parça'}
                    </span>
                    <h2 className="text-xl font-black text-slate-900 mt-2">{selectedProduct.name}</h2>
                    <div className="text-xs text-slate-500 font-mono mt-1">Stok Kodu (SKU): {selectedProduct.sku}</div>
                    {selectedProduct.category && (
                      <div className="text-xs text-slate-600 mt-1">Kategori: {selectedProduct.category.name}</div>
                    )}
                    {selectedProduct.description && (
                      <p className="text-sm text-slate-600 mt-4 line-clamp-4">{selectedProduct.description}</p>
                    )}
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-200">
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-900 mb-3 flex items-center gap-2">
                      <Lock className="w-4 h-4 text-amber-600 shrink-0" />
                      <div>Bu ürünün toptan iskonto oranlarını ve anlık stok durumunu görmek için yetkili bayi olmalısınız.</div>
                    </div>
                    <Link
                      href="/bayi/login"
                      className="w-full py-3 bg-sky-600 hover:bg-sky-700 text-white font-bold text-sm rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-sky-600/20"
                    >
                      Bayi Portalı Girişi <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
