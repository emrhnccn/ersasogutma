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
  RotateCcw
} from 'lucide-react';
import { OrderStatus } from '@/types';

export default function AllOrdersPage() {
  const { orders } = useStore();
  const [searchNo, setSearchNo] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredOrders = orders.filter((o) => {
    if (searchNo.trim() && !o.orderNumber.includes(searchNo.trim())) {
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
          <h1 className="text-2xl font-black text-white">Tüm Siparişler</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Geçmiş ve güncel tüm bayi siparişlerinizin listesi ve detayları
          </p>
        </div>

        <Link
          href="/urunler"
          className="inline-flex items-center gap-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-lg shadow-sky-600/30 transition self-start"
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Yeni Sipariş Oluştur</span>
        </Link>
      </div>

      {/* Filter Bar (Matching Girdap Bayi "Sipariş Numarası" input) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
          
          <div className="sm:col-span-6 relative">
            <input
              type="text"
              placeholder="Sipariş Numarası ile arayın (Örn: 28004)..."
              value={searchNo}
              onChange={(e) => setSearchNo(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-sky-500"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          </div>

          <div className="sm:col-span-4">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-sky-500"
            >
              <option value="all">Tüm Durumlar</option>
              <option value="bekliyor">Bekleyen Siparişler</option>
              <option value="sevkiyatta">Sevkiyatta / Yolda Olanlar</option>
              <option value="tamamlandi">Teslim Edilenler (Tamamlandı)</option>
              <option value="onaysiz">Kontrol Edilenler</option>
            </select>
          </div>

          <div className="sm:col-span-2 flex items-center gap-2">
            <button
              onClick={() => {}}
              className="w-full bg-sky-600 hover:bg-sky-500 text-white py-2.5 px-3 rounded-xl text-xs font-bold shadow-md shadow-sky-600/30 transition flex items-center justify-center gap-1.5"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Filtrele</span>
            </button>

            {(searchNo || statusFilter !== 'all') && (
              <button
                onClick={() => {
                  setSearchNo('');
                  setStatusFilter('all');
                }}
                className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl transition"
                title="Temizle"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}
          </div>

        </div>

        <div className="text-xs text-slate-400 pt-2 border-t border-slate-800">
          Toplam <strong className="text-sky-400">{filteredOrders.length}</strong> sipariş bulundu.
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
        {filteredOrders.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-sm">
            Kriterlere uygun sipariş bulunamadı.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider bg-slate-950/60">
                  <th className="py-3.5 px-4">Sipariş Tarihi</th>
                  <th className="py-3.5 px-4">Sipariş No</th>
                  <th className="py-3.5 px-4">Kaynak</th>
                  <th className="py-3.5 px-4">Sipariş Türü</th>
                  <th className="py-3.5 px-4">Tutar (KDV Dahil)</th>
                  <th className="py-3.5 px-4">Durum</th>
                  <th className="py-3.5 px-4 text-right">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 text-slate-200">
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-800/50 transition group">
                    <td className="py-3.5 px-4 font-mono text-slate-400">
                      {order.date}
                    </td>

                    <td className="py-3.5 px-4 font-mono font-bold text-sky-400 text-sm">
                      #{order.orderNumber}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded text-[11px] font-medium">
                        {order.source}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 font-medium text-slate-300">
                      {order.orderType}
                    </td>

                    <td className="py-3.5 px-4 font-mono font-bold text-emerald-400 text-sm">
                      {formatCurrency(order.totalTRY)}
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                          order.status === 'tamamlandi'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : order.status === 'sevkiyatta'
                            ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                            : order.status === 'bekliyor'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {order.status === 'tamamlandi' && <CheckCircle2 className="w-3.5 h-3.5" />}
                        {order.status === 'sevkiyatta' && <Truck className="w-3.5 h-3.5" />}
                        {order.status === 'bekliyor' && <Clock className="w-3.5 h-3.5" />}
                        <span>{order.statusText}</span>
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <Link
                        href={`/siparisler/${order.orderNumber}`}
                        className="inline-flex items-center gap-1 bg-sky-600/20 hover:bg-sky-600 text-sky-300 hover:text-white px-3 py-1.5 rounded-lg font-bold text-xs transition"
                      >
                        <span>İncele</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
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
