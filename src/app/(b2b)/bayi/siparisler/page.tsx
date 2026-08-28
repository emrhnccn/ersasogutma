'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useStore } from '@/context/StoreContext';
import { formatCurrency } from '@/lib/utils';
import {
  ShoppingBag,
  Search,
  CheckCircle2,
  Clock,
  Truck,
  ArrowRight,
  Filter,
  FileText,
  RotateCcw,
  RefreshCw,
  Plus,
  Zap
} from 'lucide-react';
import { OrderStatus } from '@/types';

export default function AllOrdersPage() {
  const { orders, repeatOrder } = useStore();
  const [searchNo, setSearchNo] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredOrders = orders.filter((o) => {
    if (searchNo.trim() && !o.orderNumber.toLowerCase().includes(searchNo.trim().toLowerCase())) {
      return false;
    }
    if (statusFilter !== 'all' && o.status !== statusFilter) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sky-400 text-xs font-bold uppercase tracking-wider mb-1">
            <ShoppingBag className="w-4 h-4" />
            <span>Sipariş & Sevkiyat Yönetimi</span>
          </div>
          <h1 className="text-2xl font-black text-white">Siparişlerim & Sevkiyat Takibi</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Geçmiş ve güncel tüm bayi siparişlerinizin listesi, sevk durumları ve hızlı tekrar sipariş ekranı
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap self-start">
          <Link
            href="/siparisler/hizli"
            className="inline-flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black px-3.5 py-2.5 rounded-xl shadow-lg transition"
          >
            <Zap className="w-4 h-4 fill-slate-950" />
            <span>Hızlı Sipariş (SKU)</span>
          </Link>

          <Link
            href="/urunler"
            className="inline-flex items-center gap-1.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-lg shadow-sky-600/30 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Yeni Sipariş Ver</span>
          </Link>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
          
          <div className="sm:col-span-6 relative">
            <input
              type="text"
              placeholder="Sipariş Numarası veya ürün ara (Örn: ERS-2026-9042)..."
              value={searchNo}
              onChange={(e) => setSearchNo(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
            />
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
          </div>

          <div className="sm:col-span-4">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-sky-500"
            >
              <option value="all">Tüm Sipariş Durumları</option>
              <option value="bekliyor">⏳ Bekleyen (Onay Sürecinde)</option>
              <option value="sevkiyatta">🚚 Sevkiyatta / Kargoda</option>
              <option value="parcali">📦 Parçalı Sevkiyat</option>
              <option value="tamamlandi">✅ Teslim Edildi (Tamamlandı)</option>
            </select>
          </div>

          <div className="sm:col-span-2 flex items-center justify-end">
            {(searchNo || statusFilter !== 'all') && (
              <button
                onClick={() => {
                  setSearchNo('');
                  setStatusFilter('all');
                }}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Sıfırla</span>
              </button>
            )}
          </div>

        </div>

        <div className="text-xs text-slate-400 pt-2 border-t border-slate-800">
          Toplam <strong className="text-sky-400">{filteredOrders.length}</strong> sipariş listeleniyor.
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
        {filteredOrders.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-xs">
            Kriterlere uygun sipariş kaydı bulunamadı.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider bg-slate-950/60">
                  <th className="py-3.5 px-4 w-28">Tarih</th>
                  <th className="py-3.5 px-4 w-36">Sipariş No</th>
                  <th className="py-3.5 px-4">Ürünler / Kalem Sayısı</th>
                  <th className="py-3.5 px-4 w-36">Tutar (KDV Dahil)</th>
                  <th className="py-3.5 px-4 w-36">Durum</th>
                  <th className="py-3.5 px-4 text-right w-44">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 text-slate-200">
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-800/50 transition group">
                    <td className="py-3.5 px-4 font-mono text-slate-400">
                      {order.date}
                    </td>

                    <td className="py-3.5 px-4 font-mono font-bold text-sky-400 text-xs">
                      #{order.orderNumber}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-white line-clamp-1">
                        {order.items.map((i) => i.productName).join(', ')}
                      </div>
                      <span className="text-[10px] text-slate-400">{order.items.length} Kalem • {order.orderType}</span>
                    </td>

                    <td className="py-3.5 px-4 font-mono font-bold text-emerald-400 text-xs">
                      {formatCurrency(order.totalTRY)}
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          order.status === 'tamamlandi'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : order.status === 'sevkiyatta'
                            ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                            : order.status === 'bekliyor'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {order.status === 'tamamlandi' && <CheckCircle2 className="w-3 h-3" />}
                        {order.status === 'sevkiyatta' && <Truck className="w-3 h-3" />}
                        {order.status === 'bekliyor' && <Clock className="w-3 h-3" />}
                        <span>{order.statusText}</span>
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => repeatOrder(order.id)}
                          className="inline-flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-slate-200 px-2.5 py-1.5 rounded-lg font-bold text-[11px] border border-slate-700 transition"
                          title="Siparişteki ürünleri tekrar sepete aktar"
                        >
                          <RefreshCw className="w-3 h-3 text-emerald-400" />
                          <span>Tekrarla</span>
                        </button>

                        <Link
                          href={`/siparisler/${order.orderNumber}`}
                          className="inline-flex items-center gap-1 bg-sky-600/20 hover:bg-sky-600 text-sky-300 hover:text-white px-2.5 py-1.5 rounded-lg font-bold text-[11px] transition"
                        >
                          <span>Detay</span>
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
