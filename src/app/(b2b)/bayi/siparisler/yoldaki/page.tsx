'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useStore } from '@/context/StoreContext';
import { formatCurrency } from '@/lib/utils';
import { Truck, Search, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function InTransitOrdersPage() {
  const { orders } = useStore();
  const [searchQuery, setSearchQuery] = useState('');

  const inTransitOrders = orders.filter((o) => o.status === 'sevkiyatta' || o.status === 'parcali');

  const shippedItems = inTransitOrders.flatMap((order) =>
    order.items.map((item) => ({
      ...item,
      orderNumber: order.orderNumber,
      orderDate: order.date,
      orderId: order.id,
      orderNote: order.orderNote
    }))
  ).filter((item) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return item.orderNumber.includes(q) || item.productName.toLowerCase().includes(q) || item.productCode.includes(q);
  });

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sky-400 text-xs font-bold uppercase tracking-wider mb-1">
            <Truck className="w-4 h-4" />
            <span>Sevkiyat & Lojistik Takibi</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">Yoldaki / Parçalı Siparişler</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Depodan çıkışı yapılmış, kargoda veya sevk aracında olan ürünleriniz
          </p>
        </div>
      </div>

      {/* Filter */}
      <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-xs rounded-2xl p-4 shadow-xl">
        <div className="relative max-w-md">
          <input
            type="text"
            placeholder="Sipariş No, Ürün Adı veya Kodu ile arayın..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-sky-500"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </div>
      </div>

      {/* Items Table */}
      <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-xs rounded-2xl overflow-hidden shadow-2xl">
        {shippedItems.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-sm">
            Şu an yolda olan sevkiyat bulunmamaktadır.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-bold uppercase tracking-wider bg-slate-50 dark:bg-slate-950/60">
                  <th className="py-3.5 px-4">Sipariş Tarihi</th>
                  <th className="py-3.5 px-4">Sipariş No</th>
                  <th className="py-3.5 px-4 w-14 text-center">Görsel</th>
                  <th className="py-3.5 px-4">Ürün Kodu</th>
                  <th className="py-3.5 px-4">Ürün Adı</th>
                  <th className="py-3.5 px-4 text-center">Sipariş / Sevk</th>
                  <th className="py-3.5 px-4">Birim Fiyat</th>
                  <th className="py-3.5 px-4">Tutar</th>
                  <th className="py-3.5 px-4">Durum</th>
                  <th className="py-3.5 px-4 text-right">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-200 dark:divide-slate-800/80 text-slate-200">
                {shippedItems.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/50 transition">
                    <td className="py-3.5 px-4 font-mono text-slate-400">{item.orderDate}</td>
                    <td className="py-3.5 px-4 font-mono font-bold text-sky-400">
                      <Link href={`/bayi/siparisler/${item.orderNumber}`} className="hover:underline">
                        #{item.orderNumber}
                      </Link>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <img
                        src={item.productImage}
                        alt={item.productName}
                        className="w-10 h-10 object-cover rounded bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 mx-auto"
                      />
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-300">{item.productCode}</td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-white">{item.productName}</td>
                    <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-200">
                      <span className="text-emerald-400">{item.shippedQuantity}</span> / {item.quantity} Adet
                    </td>
                    <td className="py-3.5 px-4 font-mono">{formatCurrency(item.unitPriceTRY)}</td>
                    <td className="py-3.5 px-4 font-mono font-bold text-emerald-400">
                      {formatCurrency(item.totalTRY)}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 bg-sky-500/20 text-sky-300 border border-sky-500/30 px-2 py-0.5 rounded-full text-[10px] font-bold">
                        <Truck className="w-3 h-3" />
                        <span>Sevkiyatta</span>
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        href={`/bayi/siparisler/${item.orderNumber}`}
                        className="inline-flex items-center gap-1 bg-sky-600/20 hover:bg-sky-600 text-sky-300 hover:text-white px-2.5 py-1 rounded-lg font-semibold text-xs transition"
                      >
                        <span>İncele</span>
                        <ArrowRight className="w-3 h-3" />
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
