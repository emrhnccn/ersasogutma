'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { formatCurrency } from '@/lib/utils';
import {
  ArrowLeft,
  Printer,
  ShoppingBag,
  CheckCircle2,
  Clock,
  Truck,
  FileText,
  Building,
  Check,
  AlertCircle,
  CreditCard,
  Loader2
} from 'lucide-react';

export default function OrderDetailPage() {
  const params = useParams();
  const orderId = String(params.id);

  const [order, setOrder] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchOrderDetail() {
      setLoading(true);
      try {
        const res = await fetch(`/api/b2b/orders/${encodeURIComponent(orderId)}`);
        const json = await res.json();
        if (json.success && json.data) {
          setOrder(json.data);
        }
      } catch (err) {
        console.error('Failed to load order detail:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchOrderDetail();
  }, [orderId]);

  if (loading) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-20 text-center shadow-xl flex items-center justify-center gap-3 text-slate-400 text-xs">
        <Loader2 className="w-6 h-6 animate-spin text-sky-400" />
        <span>Sipariş detayları yükleniyor...</span>
      </div>
    );
  }

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

  const steps = [
    { title: 'Sipariş Alındı', desc: 'Sipariş ERP sistemine kaydedildi', status: 'completed', date: new Date(order.createdAt).toLocaleDateString('tr-TR') },
    { title: 'Onay & Hazırlık', desc: 'Depo birimi siparişi hazırlıyor', status: order.status !== 'PENDING_APPROVAL' && order.status !== 'CANCELLED' ? 'completed' : 'current', date: '-' },
    { title: 'Kargo & Sevkiyat', desc: order.carrier ? `${order.carrier} (${order.trackingNumber || 'Takip No Bekleniyor'})` : 'Sevkiyat planlanıyor', status: order.status === 'SHIPPED' || order.status === 'DELIVERED' ? 'completed' : 'pending', date: '-' },
    { title: 'Teslim Edildi', desc: 'Bayiye teslimat tamamlandı', status: order.status === 'DELIVERED' ? 'completed' : 'pending', date: '-' }
  ];

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
              Sipariş Tarihi: <span className="font-mono text-slate-200">{new Date(order.createdAt).toLocaleString('tr-TR')}</span>
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

      {/* Interactive Order Timeline */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <h3 className="text-sm font-black text-white uppercase tracking-wider mb-6 flex items-center gap-2">
          <Clock className="w-4 h-4 text-sky-400" />
          <span>Sipariş Durum Çizelgesi</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 relative">
          {steps.map((step, idx) => {
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
                <div className="text-[11px] text-slate-400 mb-1">{step.desc}</div>
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
              Sipariş Edilen Ürünler ({order.items?.length || 0} Kalem)
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider bg-slate-950/30">
                    <th className="py-3 px-4 w-14 text-center">Görsel</th>
                    <th className="py-3 px-4 w-28">Ürün Kodu</th>
                    <th className="py-3 px-4">Ürün Adı</th>
                    <th className="py-3 px-4 text-center">Miktar</th>
                    <th className="py-3 px-4">Birim Fiyat</th>
                    <th className="py-3 px-4 text-right">Tutar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-200">
                  {order.items?.map((item: any) => (
                    <tr key={item.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3 px-4 text-center">
                        <img
                          src={item.image || '/placeholder.svg'}
                          alt={item.name}
                          className="w-10 h-10 object-cover rounded bg-slate-950 border border-slate-800 mx-auto"
                          onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.svg'; }}
                        />
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-sky-400">
                        {item.sku}
                      </td>
                      <td className="py-3 px-4 font-semibold text-white">
                        {item.name}
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-bold">
                        {item.quantity} {item.unit || 'ADET'}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-300">
                        {formatCurrency(item.unitNetExVat)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-emerald-400">
                        {formatCurrency(item.lineGross)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Notes Attached */}
          {order.orderNote && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl text-xs">
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                <div className="font-bold text-sky-400 mb-1 flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5" />
                  <span>Sipariş Notu:</span>
                </div>
                <p className="text-slate-300">{order.orderNote}</p>
              </div>
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
                <span>Ödeme Şekli:</span>
                <span className="font-bold text-white">
                  {order.paymentMethod === 'SANAL_POS' ? 'Kredi Kartı / Sanal POS' : 'Cari Hesap Açık Hesap'}
                </span>
              </div>

              <div className="flex justify-between text-slate-400">
                <span>Ara Toplam (KDV Hariç):</span>
                <span className="font-mono text-slate-200">{formatCurrency(order.subtotalExVat)}</span>
              </div>

              <div className="flex justify-between text-slate-400">
                <span>Hesaplanan KDV:</span>
                <span className="font-mono">{formatCurrency(order.vatTotal)}</span>
              </div>

              <div className="pt-3 border-t border-slate-700 flex justify-between items-baseline">
                <span className="text-sm font-bold text-white">Genel Toplam:</span>
                <div className="text-right">
                  <div className="text-xl font-black font-mono text-emerald-400">
                    {formatCurrency(order.grandTotal)}
                  </div>
                  <span className="text-[10px] text-slate-400">KDV Dahil</span>
                </div>
              </div>
            </div>

            {/* Buyer & Dealer Info */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs space-y-2">
              <div className="font-bold text-slate-200 flex items-center gap-1.5">
                <Building className="w-4 h-4 text-sky-400" />
                <span>Bayi Bilgileri:</span>
              </div>
              <div className="text-slate-300 font-semibold">{order.companyName}</div>
              <div className="text-slate-400 text-[11px]">Yetkili: {order.userName}</div>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
