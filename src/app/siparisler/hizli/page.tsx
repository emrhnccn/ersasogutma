'use client';

import React, { useState } from 'react';
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
  FileSpreadsheet
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
  const { products, addToCart, profile, showToast } = useStore();

  const [inputCode, setInputCode] = useState('');
  const [inputQty, setInputQty] = useState(1);

  const [items, setItems] = useState<QuickOrderItem[]>([
    { id: '1', query: '', product: null, quantity: 1 }
  ]);

  // Lookup product
  const findProduct = (code: string): Product | undefined => {
    if (!code.trim()) return undefined;
    const clean = code.trim().toLowerCase();
    return products.find(
      (p) =>
        p.code.toLowerCase() === clean ||
        p.id.toLowerCase() === clean ||
        (p.barcode && p.barcode.toLowerCase() === clean) ||
        p.name.toLowerCase().includes(clean)
    );
  };

  const handleAddRowFromInput = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputCode.trim()) return;

    const prod = findProduct(inputCode);
    if (!prod) {
      showToast(`"${inputCode}" kodlu ürün katalogda bulunamadı.`, 'warning');
      return;
    }

    const newItem: QuickOrderItem = {
      id: `row-${Date.now()}`,
      query: inputCode,
      product: prod,
      quantity: Math.max(prod.pim || 1, inputQty)
    };

    setItems((prev) => [newItem, ...prev.filter((i) => i.product !== null)]);
    setInputCode('');
    setInputQty(1);
    showToast(`"${prod.name}" listeye eklendi.`);
  };

  const handleRowCodeChange = (index: number, code: string) => {
    const prod = findProduct(code);
    setItems((prev) =>
      prev.map((row, idx) =>
        idx === index
          ? {
              ...row,
              query: code,
              product: prod || null,
              error: code && !prod ? 'Ürün bulunamadı' : undefined
            }
          : row
      )
    );
  };

  const handleRowQtyChange = (index: number, qty: number) => {
    setItems((prev) =>
      prev.map((row, idx) => (idx === index ? { ...row, quantity: Math.max(1, qty) } : row))
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
    router.push('/siparisler/sepet');
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
          <h1 className="text-2xl font-black text-white">Hızlı Sipariş Girişi (SKU / Barkod)</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Ürün kodlarını ardı ardına girip ENTER tuşuna basarak saniyeler içinde toplu sipariş oluşturun.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/siparisler/toplu-excel"
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 font-bold text-xs px-3.5 py-2 rounded-xl border border-slate-700 transition"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Excel Yükleme Modu</span>
          </Link>
        </div>
      </div>

      {/* Fast Input Banner Box */}
      <form
        onSubmit={handleAddRowFromInput}
        className="bg-gradient-to-r from-slate-900 via-slate-900 to-amber-950/40 border border-amber-500/30 rounded-2xl p-5 shadow-xl space-y-3"
      >
        <div className="text-xs font-bold text-slate-300 flex items-center gap-2">
          <span>Hızlı Ürün Ekle (Enter ile Onayla):</span>
          <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded font-mono font-bold">
            Örn: 701010009, 7011204205, R134a
          </span>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
            <input
              type="text"
              autoFocus
              placeholder="Stok Kodu (SKU) veya Barkod yazın..."
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white font-mono font-bold focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="w-32">
            <input
              type="number"
              min="1"
              value={inputQty}
              onChange={(e) => setInputQty(parseInt(e.target.value, 10) || 1)}
              placeholder="Miktar"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-center font-mono font-bold text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          <button
            type="submit"
            className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs px-6 py-2.5 rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-amber-950/40"
          >
            <Plus className="w-4 h-4" />
            <span>Listeye Ekle</span>
          </button>
        </div>
      </form>

      {/* Quick Order Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden space-y-4 p-5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Package className="w-4 h-4 text-sky-400" />
            <span>Giriş Yapılan Kalemler ({validRows.length} Ürün)</span>
          </h3>

          <button
            onClick={handleAddNewBlankRow}
            className="text-xs text-sky-400 hover:text-sky-300 font-bold flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Satır Ekle</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase font-bold text-[10px] border-b border-slate-800">
              <tr>
                <th className="p-3 w-12">#</th>
                <th className="p-3 w-48">Stok Kodu (SKU)</th>
                <th className="p-3">Ürün Adı & Marka</th>
                <th className="p-3 w-28 text-center">Stok Durumu</th>
                <th className="p-3 w-28">Birim Fiyat</th>
                <th className="p-3 w-28 text-emerald-400">Bayi Fiyatı</th>
                <th className="p-3 w-24">Adet</th>
                <th className="p-3 w-32 text-right">Tutar (TL)</th>
                <th className="p-3 w-12 text-center">Sil</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {items.map((row, index) => {
                const prod = row.product;
                const unitNetPrice = prod ? prod.priceTRY * (1 - profile.discountRate) : 0;
                const lineTotal = prod ? unitNetPrice * row.quantity : 0;

                return (
                  <tr key={row.id} className="hover:bg-slate-800/40 transition">
                    <td className="p-3 font-mono text-slate-500">{index + 1}</td>
                    
                    <td className="p-3">
                      <input
                        type="text"
                        placeholder="SKU girin..."
                        value={row.query}
                        onChange={(e) => handleRowCodeChange(index, e.target.value)}
                        className={`w-full bg-slate-950 border rounded-lg px-2.5 py-1.5 font-mono text-xs text-sky-300 focus:outline-none ${
                          row.error ? 'border-rose-500' : 'border-slate-700 focus:border-sky-500'
                        }`}
                      />
                      {row.error && <span className="text-[10px] text-rose-400 block mt-0.5">{row.error}</span>}
                    </td>

                    <td className="p-3">
                      {prod ? (
                        <div>
                          <div className="font-bold text-white line-clamp-1">{prod.name}</div>
                          <span className="text-[10px] text-slate-400">{prod.brand} • {prod.category}</span>
                        </div>
                      ) : (
                        <span className="text-slate-600 italic">Ürün kodu yazıldığında otomatik eşleşir</span>
                      )}
                    </td>

                    <td className="p-3 text-center">
                      {prod ? (
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          prod.inStock ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-rose-950 text-rose-400'
                        }`}>
                          {prod.inStock ? 'Stokta Var' : 'Tükendi'}
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
                        disabled={!prod}
                        value={row.quantity}
                        onChange={(e) => handleRowQtyChange(index, parseInt(e.target.value, 10) || 1)}
                        className="w-20 bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 font-mono text-center text-xs text-white focus:outline-none focus:border-sky-500 disabled:opacity-30"
                      />
                    </td>

                    <td className="p-3 font-mono font-bold text-white text-right">
                      {prod ? formatCurrency(lineTotal) : '-'}
                    </td>

                    <td className="p-3 text-center">
                      <button
                        onClick={() => handleRemoveRow(index)}
                        className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg transition"
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
        <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-6 text-xs">
            <div>
              <span className="text-slate-400 block">Liste Toplamı:</span>
              <span className="font-mono text-slate-300 font-bold">{formatCurrency(totalSubtotal)}</span>
            </div>
            <div>
              <span className="text-slate-400 block">Bayi İskontosu (%{profile.discountRate * 100}):</span>
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
              className="flex-1 sm:flex-none bg-gradient-to-r from-sky-600 to-cyan-600 hover:from-sky-500 hover:to-cyan-500 text-white font-bold text-xs px-6 py-3 rounded-xl shadow-lg transition flex items-center justify-center gap-2 disabled:opacity-40"
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
