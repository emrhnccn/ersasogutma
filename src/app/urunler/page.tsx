'use client';

import React, { useState, useMemo, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useStore } from '@/context/StoreContext';
import { CATEGORIES, BRANDS } from '@/data/categories';
import { Product } from '@/types';
import { formatCurrency } from '@/lib/utils';
import { ProductDetailModal } from '@/components/products/ProductDetailModal';
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
  ShieldCheck
} from 'lucide-react';

function ProductsContent() {
  const searchParams = useSearchParams();
  const queryParam = searchParams.get('q') || '';
  const favoriteOnlyParam = searchParams.get('favori') === '1';

  const { products, addToCart, toggleFavorite, isFavorite, convertPrice, profile } = useStore();

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedBrand, setSelectedBrand] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>(queryParam);
  const [onlyInStock, setOnlyInStock] = useState<boolean>(false);
  const [onlyFavorites, setOnlyFavorites] = useState<boolean>(favoriteOnlyParam);
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [selectedProductForModal, setSelectedProductForModal] = useState<Product | null>(null);

  // Local state for quantity stepper per product
  const [quantities, setQuantities] = useState<Record<string, number>>({});

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

  // Filtered list
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      if (selectedCategory !== 'all' && product.category !== selectedCategory) {
        return false;
      }
      if (selectedBrand !== 'all' && product.brand !== selectedBrand) {
        return false;
      }
      if (onlyInStock && !product.inStock) {
        return false;
      }
      if (onlyFavorites && !isFavorite(product.id)) {
        return false;
      }
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase().trim();
        const matchesName = product.name.toLowerCase().includes(query);
        const matchesCode = product.code.toLowerCase().includes(query);
        const matchesBrand = product.brand.toLowerCase().includes(query);
        const matchesBarcode = product.barcode?.toLowerCase().includes(query);
        if (!matchesName && !matchesCode && !matchesBrand && !matchesBarcode) {
          return false;
        }
      }
      return true;
    });
  }, [products, selectedCategory, selectedBrand, onlyInStock, onlyFavorites, searchQuery, isFavorite]);

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
      default: return <Snowflake className="w-5 h-5 text-sky-400" />;
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Category Icons Carousel Header (Matching Girdap Bayi layout) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-sky-400" />
            <span>Kategoriler & Hızlı Filtre</span>
          </div>
          <span className="text-[11px] text-slate-400">
            Toplam {CATEGORIES.length} Kategori
          </span>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-700">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`flex-shrink-0 flex flex-col items-center justify-center p-3 rounded-xl min-w-[100px] border transition ${
              selectedCategory === 'all'
                ? 'bg-sky-600 border-sky-500 text-white shadow-lg shadow-sky-600/30'
                : 'bg-slate-800/80 border-slate-700/80 text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Sparkles className="w-5 h-5 mb-1 text-amber-300" />
            <span className="text-[11px] font-bold text-center">Tüm Ürünler</span>
          </button>

          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.slug;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.slug)}
                className={`flex-shrink-0 flex flex-col items-center justify-center p-3 rounded-xl min-w-[110px] max-w-[130px] border transition ${
                  isSelected
                    ? 'bg-sky-600 border-sky-500 text-white shadow-lg shadow-sky-600/30'
                    : 'bg-slate-800/80 border-slate-700/80 text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <div className="mb-1">{getCategoryIcon(cat.slug)}</div>
                <span className="text-[11px] font-semibold text-center line-clamp-1 leading-tight">
                  {cat.name}
                </span>
                <span className="text-[9px] opacity-75 font-mono">({cat.count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Filter & Search Bar (Matching screenshot 2) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
          
          {/* Brand Selector */}
          <div className="sm:col-span-3">
            <select
              value={selectedBrand}
              onChange={(e) => setSelectedBrand(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-sky-500 font-medium"
            >
              <option value="all">Marka Seçiniz (Tümü)</option>
              {BRANDS.map((b) => (
                <option key={b.id} value={b.name}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          {/* Search Input */}
          <div className="sm:col-span-6 relative">
            <input
              type="text"
              placeholder="Ürün Adı / Kodu / OEM / Barkod arayın..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-sky-500"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          </div>

          {/* Search & Reset Buttons */}
          <div className="sm:col-span-3 flex items-center gap-2">
            <button
              onClick={() => {}}
              className="flex-1 bg-sky-600 hover:bg-sky-500 text-white py-2.5 px-4 rounded-xl text-xs font-bold shadow-md shadow-sky-600/30 transition flex items-center justify-center gap-2"
            >
              <Search className="w-3.5 h-3.5" />
              <span>ARAMA YAP</span>
            </button>

            {(selectedCategory !== 'all' || selectedBrand !== 'all' || searchQuery || onlyInStock || onlyFavorites) && (
              <button
                onClick={resetFilters}
                className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl transition"
                title="Filtreleri Temizle"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}
          </div>

        </div>

        {/* Sub-Filters: Stock Only, Favorites Only, View Toggle */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800 text-xs">
          
          <div className="flex items-center gap-4 flex-wrap">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={onlyInStock}
                onChange={(e) => setOnlyInStock(e.target.checked)}
                className="rounded border-slate-700 text-sky-600 focus:ring-0"
              />
              <span className="text-slate-300">Sadece Stoktakiler</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={onlyFavorites}
                onChange={(e) => setOnlyFavorites(e.target.checked)}
                className="rounded border-slate-700 text-amber-500 focus:ring-0"
              />
              <span className="text-amber-300 flex items-center gap-1">
                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                <span>Sadece Favorilerim</span>
              </span>
            </label>

            <span className="text-slate-500 font-medium">
              Toplam <strong className="text-sky-400">{filteredProducts.length}</strong> ürün bulundu.
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-400 text-[11px]">Görünüm:</span>
            <div className="flex bg-slate-800 rounded-lg p-0.5 border border-slate-700">
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded ${viewMode === 'table' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'}`}
                title="Tablo Görünümü (Hızlı Sipariş)"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'}`}
                title="Kart Izgara Görünümü"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* Product List Render */}
      {filteredProducts.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-400">
          <Filter className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white">Aradığınız kriterlere uygun ürün bulunamadı</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            Farklı bir arama terimi deneyebilir veya filtreleri sıfırlayabilirsiniz.
          </p>
          <button
            onClick={resetFilters}
            className="mt-4 bg-sky-600 hover:bg-sky-500 text-white px-4 py-2 rounded-xl text-xs font-bold transition"
          >
            Tüm Ürünleri Göster
          </button>
        </div>
      ) : viewMode === 'table' ? (
        
        /* 1. Industrial High-Speed Table View (Matches Girdap Bayi screenshot 2) */
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider bg-slate-950/60">
                  <th className="py-3.5 px-4 w-16 text-center">Ürün Görseli</th>
                  <th className="py-3.5 px-4 w-32">Ürün Kodu</th>
                  <th className="py-3.5 px-4">Ürün Adı</th>
                  <th className="py-3.5 px-4 w-28">Marka</th>
                  <th className="py-3.5 px-4 w-16 text-center">PİM</th>
                  <th className="py-3.5 px-4 w-36">Fiyat</th>
                  <th className="py-3.5 px-4 w-20 text-center">Stok</th>
                  <th className="py-3.5 px-4 w-28 text-center">Adet</th>
                  <th className="py-3.5 px-4 w-36 text-right">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 text-slate-200">
                {filteredProducts.map((product) => {
                  const qty = getQty(product);
                  const isFav = isFavorite(product.id);
                  const discountedPriceTRY = product.priceTRY * (1 - (profile.discountRate || 0.20));

                  return (
                    <tr
                      key={product.id}
                      className="hover:bg-slate-800/60 transition group"
                    >
                      {/* Image with zoom click */}
                      <td className="py-3 px-4 text-center">
                        <div
                          onClick={() => setSelectedProductForModal(product)}
                          className="w-12 h-12 mx-auto rounded-lg overflow-hidden bg-slate-950 border border-slate-800 cursor-pointer hover:border-sky-500 transition relative"
                        >
                          <img
                            src={product.image}
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-110 transition"
                          />
                        </div>
                      </td>

                      {/* Code */}
                      <td className="py-3 px-4 font-mono font-bold text-sky-400">
                        {product.code}
                      </td>

                      {/* Name & Badges */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            onClick={() => setSelectedProductForModal(product)}
                            className="font-semibold text-white hover:text-sky-300 cursor-pointer transition line-clamp-1"
                          >
                            {product.name}
                          </span>
                          {product.isNew && (
                            <span className="bg-rose-500 text-white font-black text-[9px] px-1.5 py-0.5 rounded shadow">
                              Yeni Ürün
                            </span>
                          )}
                          {product.isOpportunity && (
                            <span className="bg-amber-500 text-slate-950 font-black text-[9px] px-1.5 py-0.5 rounded shadow">
                              Fırsat
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                          {product.description}
                        </div>
                      </td>

                      {/* Brand */}
                      <td className="py-3 px-4 text-slate-300 font-medium">
                        {product.brand}
                      </td>

                      {/* PİM (Pack Quantity / Min Order) */}
                      <td className="py-3 px-4 text-center font-mono font-bold text-slate-300">
                        <span className="bg-slate-800 px-2 py-1 rounded border border-slate-700">
                          {product.pim}
                        </span>
                      </td>

                      {/* Price (Dual Currency & Discount) */}
                      <td className="py-3 px-4">
                        <div className="font-mono font-black text-emerald-400 text-sm">
                          {formatCurrency(discountedPriceTRY)}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1.5">
                          <span className="line-through">{formatCurrency(product.priceTRY)}</span>
                          <span>•</span>
                          <span className="text-sky-400">{convertPrice(discountedPriceTRY).formatted}</span>
                        </div>
                      </td>

                      {/* Stock Checkmark */}
                      <td className="py-3 px-4 text-center">
                        {product.inStock ? (
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" title={`Stokta ${product.stock} adet var`}>
                            <CheckCircle2 className="w-4 h-4" />
                          </span>
                        ) : (
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30" title="Tükendi">
                            <XCircle className="w-4 h-4" />
                          </span>
                        )}
                      </td>

                      {/* Quantity Input Stepper */}
                      <td className="py-3 px-4 text-center">
                        <div className="inline-flex items-center bg-slate-950 border border-slate-700 rounded-lg p-0.5">
                          <button
                            type="button"
                            onClick={() => handleQtyChange(product.id, qty - (product.pim || 1), product.pim || 1)}
                            className="px-1.5 py-0.5 text-slate-400 hover:text-white font-bold"
                          >
                            -
                          </button>
                          <input
                            type="number"
                            min={product.pim || 1}
                            step={product.pim || 1}
                            value={qty}
                            onChange={(e) => handleQtyChange(product.id, parseInt(e.target.value) || (product.pim || 1), product.pim || 1)}
                            className="w-10 bg-transparent text-center font-mono font-bold text-white text-xs focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => handleQtyChange(product.id, qty + (product.pim || 1), product.pim || 1)}
                            className="px-1.5 py-0.5 text-slate-400 hover:text-white font-bold"
                          >
                            +
                          </button>
                        </div>
                      </td>

                      {/* Action Buttons: Sepete Ekle + Favori */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => addToCart(product, qty)}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-md shadow-emerald-900/30 transition flex items-center gap-1"
                          >
                            <ShoppingCart className="w-3.5 h-3.5" />
                            <span>Sepete Ekle</span>
                          </button>

                          <button
                            onClick={() => toggleFavorite(product.id)}
                            className={`p-1.5 rounded-lg border transition ${
                              isFav
                                ? 'bg-amber-500/20 border-amber-500/40 text-amber-400'
                                : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                            }`}
                            title="Favorilere Ekle/Çıkar"
                          >
                            <Star className={`w-3.5 h-3.5 ${isFav ? 'fill-amber-400' : ''}`} />
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

        /* 2. Modern Grid Card View */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredProducts.map((product) => {
            const qty = getQty(product);
            const isFav = isFavorite(product.id);
            const discountedPriceTRY = product.priceTRY * (1 - (profile.discountRate || 0.20));

            return (
              <div
                key={product.id}
                className="bg-slate-900 border border-slate-800 hover:border-sky-500/50 rounded-2xl p-4 flex flex-col justify-between shadow-xl transition group"
              >
                <div>
                  <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-slate-950 mb-3 cursor-pointer">
                    <img
                      src={product.image}
                      alt={product.name}
                      onClick={() => setSelectedProductForModal(product)}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                    {product.isNew && (
                      <span className="absolute top-2 left-2 bg-rose-500 text-white font-black text-[10px] px-2 py-0.5 rounded shadow">
                        YENİ
                      </span>
                    )}
                    <button
                      onClick={() => toggleFavorite(product.id)}
                      className="absolute top-2 right-2 p-1.5 rounded-lg bg-slate-950/70 backdrop-blur-sm text-amber-400 hover:bg-slate-900 transition"
                    >
                      <Star className={`w-4 h-4 ${isFav ? 'fill-amber-400' : ''}`} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-1">
                    <span className="text-sky-400 font-bold">Kod: {product.code}</span>
                    <span>PİM: {product.pim} Adet</span>
                  </div>

                  <h3
                    onClick={() => setSelectedProductForModal(product)}
                    className="text-xs font-bold text-white line-clamp-2 mb-2 hover:text-sky-300 cursor-pointer transition"
                  >
                    {product.name}
                  </h3>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 mb-3">
                    <span>Marka: <strong className="text-slate-200">{product.brand}</strong></span>
                    <span className="text-emerald-400 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Stokta Var</span>
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800 space-y-3">
                  <div className="flex items-baseline justify-between">
                    <div>
                      <div className="text-base font-black font-mono text-emerald-400">
                        {formatCurrency(discountedPriceTRY)}
                      </div>
                      <div className="text-[10px] text-slate-400 line-through">
                        {formatCurrency(product.priceTRY)}
                      </div>
                    </div>
                    <div className="text-xs font-mono text-slate-400">
                      {convertPrice(discountedPriceTRY).formatted}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex items-center bg-slate-950 border border-slate-700 rounded-lg p-0.5">
                      <button
                        type="button"
                        onClick={() => handleQtyChange(product.id, qty - (product.pim || 1), product.pim || 1)}
                        className="px-2 py-0.5 text-slate-400 hover:text-white font-bold"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min={product.pim || 1}
                        step={product.pim || 1}
                        value={qty}
                        onChange={(e) => handleQtyChange(product.id, parseInt(e.target.value) || (product.pim || 1), product.pim || 1)}
                        className="w-8 bg-transparent text-center font-mono font-bold text-white text-xs focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => handleQtyChange(product.id, qty + (product.pim || 1), product.pim || 1)}
                        className="px-2 py-0.5 text-slate-400 hover:text-white font-bold"
                      >
                        +
                      </button>
                    </div>

                    <button
                      onClick={() => addToCart(product, qty)}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-2 px-3 rounded-lg text-xs font-bold shadow-md shadow-emerald-900/30 transition flex items-center justify-center gap-1.5"
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
