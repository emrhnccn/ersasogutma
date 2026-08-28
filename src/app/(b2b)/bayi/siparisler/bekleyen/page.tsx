'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useStore } from '@/context/StoreContext';
import { formatCurrency } from '@/lib/utils';
import { Clock, Search, ArrowRight, ShoppingCart } from 'lucide-react';

export default function PendingOrdersPage() {
  const { orders } = useStore();
  const [searchQuery, setSearchQuery] = useState('');

  const pendingOrders = orders.filter((o) => o.status === 'bekliyor');
  
  // Flatten line items for granular inspection matching Girdap Bayi screenshot 9
  const pendingItems = pendingOrders.flatMap((order) =>
    order.items.map((item) => ({
      ...item,
      orderNumber: order.orderNumber,
      orderDate: order.date,
      orderId: order.id
    }))
  ).filter((item) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return item.orderNumber.includes(q) || item.productName.toLowerCase().includes(q) || item.productCode.includes(q);
  });

  const totalPendingAmount = pendingOrders.reduce((sum, o) => sum + o.totalTRY, 0);

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider mb-1">
            <Clock className="w-4 h-4" />
            <span>Onay & Hazırlık Sürecindekiler</span>
          </div>
          <h1 className="text-2xl font-black text-white">Bekleyen Siparişler</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Muhasebe veya depo hazırlık onayı bekleyen aktif sipariş kalemleriniz
          </p>
        </div>

        <div className="bg-amber-950/40 border border-amber-800/40 px-4 py-2 rounded-xl text-right">
          <div className="text-[11px] text-amber-300 font-semibold">Toplam Bekleyen Tutar</div>
          <div className="text-lg font-black font-mono text-amber-400">
            {formatCurrency(totalPendingAmount)}
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
        <div className="relative max-w-md">
          <input
            type="text"
            placeholder="Sipariş No, Ürün Adı veya Kodu ile arayın..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-amber-500"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </div>
      </div>

      {/* Items Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
        {pendingItems.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-sm">
            Bekleyen siparişiniz bulunmamaktadır.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider bg-slate-950/60">
                  <th className="py-3.5 px-4">Sipariş Tarihi</th>
                  <th className="py-3.5 px-4">Sipariş No</th>
                  <th className="py-3.5 px-4 w-14 text-center">Görsel</th>
                  <th className="py-3.5 px-4">Ürün Kodu</th>
                  <th className="py-3.5 px-4">Ürün Adı</th>
                  <th className="py-3.5 px-4 text-center">Adet</th>
                  <th className="py-3.5 px-4">Birim Fiyat</th>
                  <th className="py-3.5 px-4">Tutar</th>
                  <th className="py-3.5 px-4">Durum</th>
                  <th className="py-3.5 px-4 text-right">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 text-slate-200">
                {pendingItems.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/50 transition">
                    <td className="py-3.5 px-4 font-mono text-slate-400">{item.orderDate}</td>
                    <td className="py-3.5 px-4 font-mono font-bold text-sky-400">
                      <Link href={`/siparisler/${item.orderNumber}`} className="hover:underline">
                        #{item.orderNumber}
                      </Link>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <img
                        src={item.productImage}
                        alt={item.productName}
                        className="w-10 h-10 object-cover rounded bg-slate-950 border border-slate-800 mx-auto"
                      />
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-300">{item.productCode}</td>
                    <td className="py-3.5 px-4 font-semibold text-white">{item.productName}</td>
                    <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-200">
                      {item.quantity}
                    </td>
                    <td className="py-3.5 px-4 font-mono">{formatCurrency(item.unitPriceTRY)}</td>
                    <td className="py-3.5 px-4 font-mono font-bold text-emerald-400">
                      {formatCurrency(item.totalTRY)}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full text-[10px] font-bold">
                        <Clock className="w-3 h-3" />
                        <span>Bekliyor</span>
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        href={`/siparisler/${item.orderNumber}`}
                        className="inline-flex items-center gap-1 bg-sky-600/20 hover:bg-sky-600 text-sky-300 hover:text-white px-2.5 py-1 rounded-lg font-semibold text-xs transition"
                      >
                        <span>Detay</span>
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
