'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useStore } from '@/context/StoreContext';
import { formatCurrency } from '@/lib/utils';
import {
  ArrowLeft,
  Printer,
  ShoppingBag,
  CheckCircle2,
  Clock,
  Truck,
  FileText,
  User,
  Building,
  Check,
  AlertCircle
} from 'lucide-react';

export default function OrderDetailPage() {
  const params = useParams();
  const orderId = String(params.id);
  const { getOrderById } = useStore();

  const order = getOrderById(orderId);

  if (!order) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center shadow-xl">
        <h2 className="text-xl font-bold text-white mb-2">Sipariş Bulunamadı</h2>
        <p className="text-slate-400 text-xs mb-6">
          Aradığınız #{orderId} numaralı sipariş mevcut değil veya silinmiş olabilir.
        </p>
        <Link
          href="/bayi/siparisler"
          className="bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition inline-flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Sipariş Listesine Dön</span>
        </Link>
      </div>
    );
  }

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/bayi/siparisler"
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl border border-slate-700 transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-white">Sipariş Detayı</h1>
              <span className="font-mono font-bold text-sky-400 bg-sky-950 px-2.5 py-0.5 rounded-lg border border-sky-800">
                #{order.orderNumber}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Sipariş Tarihi: <span className="font-mono text-slate-200">{order.date}</span> • Kaynak: {order.source}
            </p>
          </div>
        </div>

        <button
          onClick={handlePrint}
          className="inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl border border-slate-700 shadow-md transition self-start"
        >
          <Printer className="w-4 h-4 text-sky-400" />
          <span>Sipariş Formunu Yazdır / PDF</span>
        </button>
      </div>

      {/* Interactive Order Timeline (Sipariş Hikayesi) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <h3 className="text-sm font-black text-white uppercase tracking-wider mb-6 flex items-center gap-2">
          <Clock className="w-4 h-4 text-sky-400" />
          <span>Sipariş Hikayesi & Durum Çizelgesi</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 relative">
          {order.history.map((step, idx) => {
            const isCompleted = step.status === 'completed';
            const isCurrent = step.status === 'current';

            return (
              <div
                key={idx}
                className={`p-4 rounded-xl border relative transition ${
                  isCompleted
                    ? 'bg-emerald-950/20 border-emerald-500/40 text-slate-200'
                    : isCurrent
                    ? 'bg-sky-950/30 border-sky-500 text-white ring-2 ring-sky-500/20'
                    : 'bg-slate-950/40 border-slate-800 text-slate-500'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black ${
                      isCompleted
                        ? 'bg-emerald-500 text-slate-950'
                        : isCurrent
                        ? 'bg-sky-500 text-white animate-pulse'
                        : 'bg-slate-800 text-slate-500'
                    }`}
                  >
                    {isCompleted ? <Check className="w-4 h-4" /> : idx + 1}
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">{step.date}</span>
                </div>

                <div className="font-bold text-xs text-white mb-1">{step.title}</div>
                <div className="text-[11px] text-slate-400 mb-2">{step.description}</div>
                <div className="text-[10px] text-slate-500 font-medium">Yetkili: {step.user}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Breakdown: Items Table + Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Product Line Items Table */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-slate-800 bg-slate-950/60 font-bold text-xs text-white">
              Sipariş Edilen Ürünler ({order.items.length} Kalem)
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider bg-slate-950/30">
                    <th className="py-3 px-4 w-14 text-center">Görsel</th>
                    <th className="py-3 px-4 w-28">Ürün Kodu</th>
                    <th className="py-3 px-4">Ürün Adı</th>
                    <th className="py-3 px-4 text-center">Sipariş</th>
                    <th className="py-3 px-4 text-center">Sevk</th>
                    <th className="py-3 px-4">Birim Fiyat</th>
                    <th className="py-3 px-4 text-right">Tutar</th>
                    <th className="py-3 px-4 text-center">Durum</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-200">
                  {order.items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/40 transition">
                      <td className="py-3 px-4 text-center">
                        <img
                          src={item.productImage}
                          alt={item.productName}
                          className="w-10 h-10 object-cover rounded bg-slate-950 border border-slate-800 mx-auto"
                        />
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-sky-400">
                        {item.productCode}
                      </td>
                      <td className="py-3 px-4 font-semibold text-white">
                        {item.productName}
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-bold">
                        {item.quantity} Adet
                      </td>
                      <td className="py-3 px-4 text-center font-mono text-emerald-400 font-bold">
                        {item.shippedQuantity} Adet
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-300">
                        {formatCurrency(item.unitPriceTRY)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-emerald-400">
                        {formatCurrency(item.totalTRY)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded text-[10px] font-semibold">
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Notes Attached */}
          {(order.orderNote || order.accountingNote) && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              {order.orderNote && (
                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                  <div className="font-bold text-sky-400 mb-1 flex items-center gap-1.5">
                    <Truck className="w-3.5 h-3.5" />
                    <span>Sevkiyat & Lojistik Notu:</span>
                  </div>
                  <p className="text-slate-300">{order.orderNote}</p>
                </div>
              )}

              {order.accountingNote && (
                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                  <div className="font-bold text-amber-400 mb-1 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5" />
                    <span>Muhasebe & Finans Notu:</span>
                  </div>
                  <p className="text-slate-300">{order.accountingNote}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right: Summary Box */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-5">
            <h3 className="text-base font-black text-white border-b border-slate-800 pb-3">
              Mali İcmal
            </h3>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Sipariş Tutarı (Liste):</span>
                <span className="font-mono text-slate-200">{formatCurrency(order.subtotalTRY)}</span>
              </div>

              <div className="flex justify-between text-emerald-400">
                <span>Bayi İskonto Tutarı:</span>
                <span className="font-mono font-bold">-{formatCurrency(order.discountTRY)}</span>
              </div>

              <div className="flex justify-between text-slate-300 pt-2 border-t border-slate-800">
                <span>Ara Toplam (Matrah):</span>
                <span className="font-mono font-bold text-white">
                  {formatCurrency(order.totalTRY - order.vatTRY)}
                </span>
              </div>

              <div className="flex justify-between text-slate-400">
                <span>Hesaplanan KDV (%20):</span>
                <span className="font-mono">{formatCurrency(order.vatTRY)}</span>
              </div>

              <div className="pt-3 border-t border-slate-700 flex justify-between items-baseline">
                <span className="text-sm font-bold text-white">Genel Toplam:</span>
                <div className="text-right">
                  <div className="text-xl font-black font-mono text-emerald-400">
                    {formatCurrency(order.totalTRY)}
                  </div>
                  <span className="text-[10px] text-slate-400">KDV Dahil</span>
                </div>
              </div>
            </div>

            {/* Buyer & Dealer Info */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs space-y-2">
              <div className="font-bold text-slate-200 flex items-center gap-1.5">
                <Building className="w-4 h-4 text-sky-400" />
                <span>Bayi / Alıcı Bilgileri:</span>
              </div>
              <div className="text-slate-300 font-semibold">{order.dealerName}</div>
              <div className="text-slate-400 text-[11px]">{order.shippingAddress}</div>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
