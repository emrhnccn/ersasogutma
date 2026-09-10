'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useStore } from '@/context/StoreContext';
import {
  Zap,
  Plus,
  Trash2,
  ShoppingCart,
  CheckCircle2,
  AlertCircle,
  Package,
  ArrowRight,
  RefreshCw,
  Search,
  FileSpreadsheet,
  Loader2,
  Check,
  Tag
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { Product } from '@/types';

interface QuickOrderItem {
  id: string;
  query: string;
  product: Product | null;
  quantity: number;
  error?: string;
}

export default function QuickOrderPage() {
  const router = useRouter();
  const { addToCart, profile, showToast } = useStore();

  const [inputCode, setInputCode] = useState('');
  const [inputQty, setInputQty] = useState(1);
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const searchContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [items, setItems] = useState<QuickOrderItem[]>([
    { id: '1', query: '', product: null, quantity: 1 }
  ]);

  // Convert raw DB product from /api/products to application Product type
  const mapApiToProduct = (p: any): Product => ({
    id: p.id,
    code: p.sku || '',
    name: p.name || '',
    category: p.category?.name || 'Genel',
    brand: p.brand?.name || 'Ersa',
    pim: p.minOrderQty || 1,
    priceTRY: p.salePrice || 0,
    priceUSD: Number(((p.salePrice || 0) / 38.45).toFixed(2)),
    priceEUR: Number(((p.salePrice || 0) / 42.10).toFixed(2)),
    originalCurrency: (p.currency as any) || 'TRY',
    stock: p.stockQty || 0,
    inStock: (p.stockQty || 0) > 0,
    image: p.images?.[0]?.url || '/placeholder.svg',
    unit: p.unit || 'Adet',
    description: p.description || '',
    specifications: {},
    barcode: p.barcode || undefined
  });

  // Debounced server search across the entire 3,700+ catalog
  useEffect(() => {
    const q = inputCode.trim();
    if (!q || q.length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      setDropdownOpen(false);
      return;
    }

    setIsSearching(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/products?search=${encodeURIComponent(q)}&limit=12`);
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          const mapped = json.data.map(mapApiToProduct);
          setSearchResults(mapped);
          setDropdownOpen(mapped.length > 0);
          setSelectedIndex(-1);
        } else {
          setSearchResults([]);
          setDropdownOpen(false);
        }
      } catch (err) {
        console.error('Hızlı sipariş arama hatası:', err);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [inputCode]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Add selected product to quick order items
  const addProductToItems = (prod: Product, qty: number = 1) => {
    const desiredQty = Math.max(1, qty);
    const existingIdx = items.findIndex((i) => i.product?.id === prod.id);

    if (existingIdx >= 0) {
      setItems((prev) =>
        prev.map((it, idx) => {
          if (idx !== existingIdx) return it;
          const newTotal = it.quantity + desiredQty;
          const validQty = prod.stock > 0 ? Math.min(newTotal, prod.stock) : newTotal;
          return { ...it, quantity: validQty };
        })
      );
      showToast(`"${prod.name}" miktarı güncellendi (+${desiredQty} adet).`, 'info');
    } else {
      const validQty = prod.stock > 0 ? Math.min(desiredQty, prod.stock) : desiredQty;
      const newItem: QuickOrderItem = {
        id: `row-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
        query: prod.code,
        product: prod,
        quantity: validQty
      };
      setItems((prev) => [newItem, ...prev.filter((i) => i.product !== null)]);
      showToast(`"${prod.name}" listeye eklendi.`, 'success');
    }

    setInputCode('');
    setInputQty(1);
    setDropdownOpen(false);
    setSearchResults([]);
    setSelectedIndex(-1);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  // Keyboard navigation inside the search dropdown
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!dropdownOpen || searchResults.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < searchResults.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : searchResults.length - 1));
    } else if (e.key === 'Escape') {
      setDropdownOpen(false);
    }
  };

  // Form submit handler (Enter key)
  const handleAddRowFromInput = async (e: React.FormEvent) => {
    e.preventDefault();
    const q = inputCode.trim();
    if (!q) return;

    // 1. If dropdown item is actively highlighted
    if (dropdownOpen && selectedIndex >= 0 && searchResults[selectedIndex]) {
      addProductToItems(searchResults[selectedIndex], inputQty);
      return;
    }

    // 2. Exact match in search results by SKU or Barcode
    const exactMatch = searchResults.find(
      (p) =>
        p.code.toLowerCase() === q.toLowerCase() ||
        p.barcode?.toLowerCase() === q.toLowerCase()
    );
    if (exactMatch) {
      addProductToItems(exactMatch, inputQty);
      return;
    }

    // 3. If only one result or top result strongly matches
    if (searchResults.length > 0) {
      addProductToItems(searchResults[0], inputQty);
      return;
    }

    // 4. Real-time direct lookup from server
    setIsSearching(true);
    try {
      const res = await fetch(`/api/products?search=${encodeURIComponent(q)}&limit=1`);
      const json = await res.json();
      if (json.success && Array.isArray(json.data) && json.data.length > 0) {
        const prod = mapApiToProduct(json.data[0]);
        addProductToItems(prod, inputQty);
      } else {
        showToast(`"${q}" kodlu veya isimli ürün katalogda bulunamadı.`, 'warning');
      }
    } catch {
      showToast('Arama sırasında hata oluştu.', 'error');
    } finally {
      setIsSearching(false);
    }
  };

  // Table row SKU / search input change
  const handleRowCodeChange = async (index: number, code: string) => {
    const clean = code.trim();
    setItems((prev) =>
      prev.map((row, idx) => (idx === index ? { ...row, query: code, error: undefined } : row))
    );

    if (!clean) {
      setItems((prev) =>
        prev.map((row, idx) => (idx === index ? { ...row, product: null, error: undefined } : row))
      );
      return;
    }

    try {
      const res = await fetch(`/api/products?search=${encodeURIComponent(clean)}&limit=1`);
      const json = await res.json();
      if (json.success && Array.isArray(json.data) && json.data.length > 0) {
        const prod = mapApiToProduct(json.data[0]);
        setItems((prev) =>
          prev.map((row, idx) =>
            idx === index ? { ...row, product: prod, error: undefined } : row
          )
        );
      } else {
        setItems((prev) =>
          prev.map((row, idx) =>
            idx === index ? { ...row, product: null, error: 'Ürün bulunamadı' } : row
          )
        );
      }
    } catch {
      // ignore
    }
  };

  const handleRowQtyChange = (index: number, qty: number) => {
    setItems((prev) =>
      prev.map((row, idx) => {
        if (idx !== index) return row;
        let validQty = Math.max(1, qty);
        if (row.product && row.product.stock > 0 && validQty > row.product.stock) {
          validQty = row.product.stock;
        }
        return { ...row, quantity: validQty };
      })
    );
  };

  const handleRemoveRow = (index: number) => {
    setItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleAddNewBlankRow = () => {
    setItems((prev) => [...prev, { id: `row-${Date.now()}`, query: '', product: null, quantity: 1 }]);
  };

  // Bulk add to cart
  const handleTransferAllToCart = () => {
    const validItems = items.filter((i) => i.product !== null);
    if (validItems.length === 0) {
      showToast('Lütfen önce geçerli ürünler ekleyiniz.', 'warning');
      return;
    }

    validItems.forEach((item) => {
      if (item.product) {
        addToCart(item.product, item.quantity);
      }
    });

    showToast(`${validItems.length} kalem ürün başarıyla sepete aktarıldı!`, 'success');
    router.push('/bayi/siparisler/sepet');
  };

  const validRows = items.filter((i) => i.product !== null);
  const totalSubtotal = validRows.reduce((sum, i) => sum + (i.product?.priceTRY || 0) * i.quantity, 0);
  const totalNet = validRows.reduce(
    (sum, i) => sum + (i.product?.priceTRY || 0) * (1 - profile.discountRate) * i.quantity,
    0
  );

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider mb-1">
            <Zap className="w-4 h-4 fill-amber-400" />
            <span>Klavye Odaklı B2B Hızlı Sipariş</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">
            Hızlı Sipariş Girişi (SKU / Barkod / Ürün Adı)
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Ürün kodunu, adını veya barkodunu yazın, ENTER tuşuna basarak saniyeler içinde toplu sipariş oluşturun.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/bayi/siparisler/toplu-excel"
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 font-bold text-xs px-3.5 py-2 rounded-xl border border-slate-700 transition"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Excel Yükleme Modu</span>
          </Link>
        </div>
      </div>

      {/* Fast Input Banner Box with Live Autocomplete */}
      <div
        ref={searchContainerRef}
        className="relative bg-gradient-to-r from-slate-900 via-slate-900 to-amber-950/40 border border-amber-500/30 rounded-2xl p-5 shadow-xl space-y-3"
      >
        <div className="text-xs font-bold text-slate-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span>Hızlı Ürün Ekle (Kod veya İsim ile Arayın):</span>
            <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded font-mono font-bold">
              Örn: 1515200100, AN0420, KOMÜTATÖR, FAN, R134a
            </span>
          </div>
          {isSearching && (
            <div className="flex items-center gap-1.5 text-xs text-amber-400 font-medium">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Veritabanında aranıyor...</span>
            </div>
          )}
        </div>

        <form onSubmit={handleAddRowFromInput} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
            <input
              ref={inputRef}
              type="text"
              autoFocus
              placeholder="Stok Kodu (SKU), Ürün Adı veya Barkod yazın..."
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => {
                if (searchResults.length > 0) setDropdownOpen(true);
              }}
              className="w-full bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-10 py-2.5 text-xs text-slate-900 dark:text-white font-medium focus:outline-none focus:border-amber-500 shadow-inner"
            />
            {isSearching && (
              <Loader2 className="w-4 h-4 text-amber-400 animate-spin absolute right-3.5 top-3" />
            )}
          </div>

          <div className="w-32">
            <input
              type="number"
              min="1"
              value={inputQty}
              onChange={(e) => {
                const raw = parseInt(e.target.value, 10);
                setInputQty(isNaN(raw) || raw < 1 ? 1 : raw);
              }}
              placeholder="Miktar"
              className="w-full bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-xs text-center font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 shadow-inner"
            />
          </div>

          <button
            type="submit"
            className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs px-6 py-2.5 rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-amber-950/40 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Listeye Ekle</span>
          </button>
        </form>

        {/* Live Autocomplete Dropdown */}
        {dropdownOpen && searchResults.length > 0 && (
          <div className="absolute left-5 right-5 top-full mt-2 bg-slate-900 border border-amber-500/40 rounded-2xl shadow-2xl overflow-hidden z-50 divide-y divide-slate-800 max-h-96 overflow-y-auto animate-in fade-in slide-in-from-top-2">
            <div className="p-2.5 bg-slate-950 text-[11px] text-slate-400 flex items-center justify-between">
              <span>{searchResults.length} ürün bulundu. Ok tuşları veya fare ile seçebilirsiniz:</span>
              <span className="font-mono text-[10px] text-amber-400">ENTER: Seç ve Ekle</span>
            </div>

            {searchResults.map((prod, idx) => {
              const isHighlighted = selectedIndex === idx;
              const unitNetPrice = prod.priceTRY * (1 - profile.discountRate);

              return (
                <div
                  key={prod.id}
                  onClick={() => addProductToItems(prod, inputQty)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`p-3 flex items-center justify-between gap-4 cursor-pointer transition ${
                    isHighlighted ? 'bg-amber-500/15 border-l-4 border-amber-400 pl-3' : 'hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={prod.image}
                      alt={prod.name}
                      className="w-11 h-11 rounded-lg object-cover bg-white p-0.5 border border-slate-700 shrink-0"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/placeholder.svg';
                      }}
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-sky-400 bg-sky-950/60 px-2 py-0.5 rounded border border-sky-800/40">
                          {prod.code}
                        </span>
                        {prod.brand && (
                          <span className="text-[10px] text-slate-400 font-semibold">{prod.brand}</span>
                        )}
                        {prod.category && (
                          <span className="text-[10px] text-slate-500">• {prod.category}</span>
                        )}
                      </div>
                      <div className="text-xs font-bold text-white mt-1 truncate">{prod.name}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0 text-right">
                    <div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        prod.inStock
                          ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800'
                          : 'bg-rose-950 text-rose-400 border border-rose-900'
                      }`}>
                        {prod.inStock ? `Stok: ${prod.stock} ${prod.unit}` : 'Tükendi'}
                      </span>
                    </div>

                    <div>
                      <div className="text-[10px] text-slate-400 line-through">
                        {formatCurrency(prod.priceTRY)}
                      </div>
                      <div className="font-mono font-bold text-emerald-400 text-xs">
                        {formatCurrency(unitNetPrice)}
                      </div>
                    </div>

                    <button
                      type="button"
                      className="p-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg transition font-bold"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Quick Order Table */}
      <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-xs rounded-2xl shadow-xl overflow-hidden space-y-4 p-5">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Package className="w-4 h-4 text-sky-400" />
            <span>Giriş Yapılan Kalemler ({validRows.length} Ürün)</span>
          </h3>

          <button
            onClick={handleAddNewBlankRow}
            className="text-xs text-sky-400 hover:text-sky-300 font-bold flex items-center gap-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Satır Ekle</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left text-slate-300">
            <thead className="bg-slate-50 dark:bg-[#0B1120] text-slate-600 dark:text-slate-400 uppercase font-bold text-[10px] border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="p-3 w-12">#</th>
                <th className="p-3 w-52">Stok Kodu / Arama</th>
                <th className="p-3">Ürün Adı & Marka</th>
                <th className="p-3 w-28 text-center">Stok Durumu</th>
                <th className="p-3 w-28">Birim Fiyat</th>
                <th className="p-3 w-28 text-emerald-400">Bayi Fiyatı</th>
                <th className="p-3 w-24">Adet</th>
                <th className="p-3 w-32 text-right">Tutar (TL)</th>
                <th className="p-3 w-12 text-center">Sil</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 font-medium">
              {items.map((row, index) => {
                const prod = row.product;
                const unitNetPrice = prod ? prod.priceTRY * (1 - profile.discountRate) : 0;
                const lineTotal = prod ? unitNetPrice * row.quantity : 0;

                return (
                  <tr key={row.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                    <td className="p-3 font-mono text-slate-500">{index + 1}</td>
                    
                    <td className="p-3">
                      <input
                        type="text"
                        placeholder="SKU veya İsim..."
                        defaultValue={row.query}
                        onBlur={(e) => {
                          if (e.target.value !== row.query) {
                            handleRowCodeChange(index, e.target.value);
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleRowCodeChange(index, (e.target as HTMLInputElement).value);
                          }
                        }}
                        className={`w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 font-mono text-xs text-sky-600 dark:text-sky-300 focus:outline-none ${
                          row.error ? 'border-rose-500' : 'border-slate-700 focus:border-sky-500'
                        }`}
                      />
                      {row.error && <span className="text-[10px] text-rose-400 block mt-0.5">{row.error}</span>}
                    </td>

                    <td className="p-3">
                      {prod ? (
                        <div className="flex items-center gap-2.5">
                          <img
                            src={prod.image}
                            alt={prod.name}
                            className="w-8 h-8 rounded-lg object-cover bg-white p-0.5 border border-slate-700 shrink-0"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = '/placeholder.svg';
                            }}
                          />
                          <div>
                            <div className="font-bold text-slate-900 dark:text-white line-clamp-1">{prod.name}</div>
                            <span className="text-[10px] text-slate-400">{prod.brand} • {prod.category}</span>
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-500 italic">Ürün kodu veya adı girildiğinde otomatik eşleşir</span>
                      )}
                    </td>

                    <td className="p-3 text-center">
                      {prod ? (
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          prod.inStock ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-rose-950 text-rose-400'
                        }`}>
                          {prod.inStock ? `Var (${prod.stock})` : 'Tükendi'}
                        </span>
                      ) : (
                        '-'
                      )}
                    </td>

                    <td className="p-3 font-mono text-slate-400">
                      {prod ? formatCurrency(prod.priceTRY) : '-'}
                    </td>

                    <td className="p-3 font-mono font-bold text-emerald-400">
                      {prod ? formatCurrency(unitNetPrice) : '-'}
                    </td>

                    <td className="p-3">
                      <input
                        type="number"
                        min="1"
                        max={prod && prod.stock > 0 ? prod.stock : undefined}
                        disabled={!prod}
                        value={row.quantity}
                        onChange={(e) => {
                          const raw = parseInt(e.target.value, 10);
                          let val = isNaN(raw) ? 1 : raw;
                          if (val < 1) val = 1;
                          if (prod && prod.stock > 0 && val > prod.stock) {
                            val = prod.stock;
                          }
                          handleRowQtyChange(index, val);
                        }}
                        className="w-20 bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 font-mono text-center text-xs text-slate-900 dark:text-white focus:outline-none focus:border-sky-500 disabled:opacity-30"
                      />
                    </td>

                    <td className="p-3 font-mono font-bold text-slate-900 dark:text-white text-right">
                      {prod ? formatCurrency(lineTotal) : '-'}
                    </td>

                    <td className="p-3 text-center">
                      <button
                        onClick={() => handleRemoveRow(index)}
                        className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg transition cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer Summary & Checkout Action */}
        <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-6 text-xs">
            <div>
              <span className="text-slate-400 block">Liste Toplamı:</span>
              <span className="font-mono text-slate-300 font-bold">{formatCurrency(totalSubtotal)}</span>
            </div>
            <div>
              <span className="text-slate-400 block">Bayi İskontosu (%{Math.round(profile.discountRate * 100)}):</span>
              <span className="font-mono text-emerald-400 font-bold">-{formatCurrency(totalSubtotal - totalNet)}</span>
            </div>
            <div>
              <span className="text-slate-400 block">Net Tutar (KDV Hariç):</span>
              <span className="font-mono text-xl font-black text-emerald-400">{formatCurrency(totalNet)}</span>
            </div>
          </div>

          <div className="flex gap-2 w-full sm:w-auto">
            <button
              onClick={handleTransferAllToCart}
              disabled={validRows.length === 0}
              className="flex-1 sm:flex-none bg-gradient-to-r from-sky-600 to-cyan-600 hover:from-sky-500 hover:to-cyan-500 text-white font-bold text-xs px-6 py-3 rounded-xl shadow-lg transition flex items-center justify-center gap-2 disabled:opacity-40 cursor-pointer"
            >
              <ShoppingCart className="w-4 h-4" />
              <span>Sepete Aktar & Siparişi Tamamla ({validRows.length})</span>
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}
