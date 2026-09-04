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
    { title: 'Sipariş Alındı', status: 'completed' },
    { title: 'Onaylandı', status: order.status !== 'PENDING_APPROVAL' && order.status !== 'CANCELLED' ? 'completed' : 'current' },
    { title: 'Hazırlanıyor', status: ['PREPARING', 'SHIPPED', 'DELIVERED'].includes(order.status) ? 'completed' : 'pending' },
    { title: 'Sevk Edildi', status: ['SHIPPED', 'DELIVERED'].includes(order.status) ? 'completed' : 'pending' },
    { title: 'Tamamlandı', status: order.status === 'DELIVERED' ? 'completed' : 'pending' }
  ];

  return (
    <div className="space-y-6">
      
      {/* Top Action Bar & Summary Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            href="/bayi/siparisler"
            className="p-2.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl border border-slate-200 transition"
            title="Geri Dön"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl font-bold text-slate-900">Sipariş #{order.orderNumber}</h1>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                {order.status === 'DELIVERED' ? 'Tamamlandı' : order.status === 'SHIPPED' ? 'Sevk Edildi' : 'İşlemde'}
              </span>
            </div>
            <div className="flex items-center gap-4 text-xs text-slate-500 mt-1 flex-wrap">
              <span>Tarih: <strong className="text-slate-700 font-mono">{new Date(order.createdAt).toLocaleString('tr-TR')}</strong></span>
              <span>•</span>
              <span>Ödeme: <strong className="text-slate-700">{order.paymentMethod === 'SANAL_POS' ? 'Kredi Kartı / Sanal POS' : 'Cari Hesap'}</strong></span>
            </div>
          </div>
        </div>

        <button
          onClick={handlePrint}
          className="inline-flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold px-4 py-2.5 rounded-xl border border-slate-200 shadow-xs transition self-start md:self-auto"
        >
          <Printer className="w-4 h-4 text-blue-600" />
          <span>Sipariş Formunu Yazdır / PDF</span>
        </button>
      </div>

      {/* 5-Step Order Status Timeline */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-5 flex items-center gap-2">
          <Clock className="w-4 h-4 text-blue-600" />
          <span>Sipariş Süreç Takibi</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
          {steps.map((step, idx) => {
            const isCompleted = step.status === 'completed';
            const isCurrent = step.status === 'current';

            return (
              <div
                key={idx}
                className={`p-3.5 rounded-xl border transition ${
                  isCompleted
                    ? 'bg-emerald-50/60 border-emerald-200 text-slate-800'
                    : isCurrent
                    ? 'bg-blue-50 border-blue-300 text-blue-900 ring-2 ring-blue-500/10'
                    : 'bg-slate-50 border-slate-200 text-slate-400'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div
                    className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold ${
                      isCompleted
                        ? 'bg-emerald-600 text-white'
                        : isCurrent
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-200 text-slate-500'
                    }`}
                  >
                    {isCompleted ? <Check className="w-3.5 h-3.5" /> : idx + 1}
                  </div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    {isCompleted ? 'Tamam' : isCurrent ? 'Mevcut' : 'Bekliyor'}
                  </span>
                </div>

                <div className="font-bold text-xs">{step.title}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Breakdown: Items Table + Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Product Line Items Table */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
            <div className="p-4 border-b border-slate-100 bg-slate-50 font-bold text-xs text-slate-800">
              Sipariş Edilen Ürünler ({order.items?.length || 0} Kalem)
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-500 font-semibold uppercase tracking-wider bg-slate-50/50">
                    <th className="py-3 px-4 w-14 text-center">Görsel</th>
                    <th className="py-3 px-4 w-28">Ürün Kodu</th>
                    <th className="py-3 px-4">Ürün Adı</th>
                    <th className="py-3 px-4 text-center">Miktar</th>
                    <th className="py-3 px-4">Birim Fiyat</th>
                    <th className="py-3 px-4 text-right">Tutar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {order.items?.map((item: any) => (
                    <tr key={item.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3 px-4 text-center">
                        <img
                          src={item.image || '/placeholder.svg'}
                          alt={item.name}
                          className="w-10 h-10 object-cover rounded-lg bg-white border border-slate-200 mx-auto"
                          onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.svg'; }}
                        />
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-blue-600">
                        {item.sku}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-800">
                        {item.name}
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-semibold">
                        {item.quantity} {item.unit || 'ADET'}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600">
                        {formatCurrency(item.unitNetExVat)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
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
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs text-xs">
              <div className="font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5 text-blue-600" />
                <span>Sipariş Notu:</span>
              </div>
              <p className="text-slate-600 mt-1">{order.orderNote}</p>
            </div>
          )}
        </div>

        {/* Right: Summary Box */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-3">
              Sipariş Özeti
            </h3>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Ara Toplam (KDV Hariç):</span>
                <span className="font-mono text-slate-800">{formatCurrency(order.subtotalExVat)}</span>
              </div>

              <div className="flex justify-between text-slate-600">
                <span>Tanımlı İskonto:</span>
                <span className="font-mono text-emerald-600 font-semibold">%15</span>
              </div>

              <div className="flex justify-between text-slate-600">
                <span>Hesaplanan KDV:</span>
                <span className="font-mono text-slate-800">{formatCurrency(order.vatTotal)}</span>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-between items-baseline">
                <span className="text-sm font-bold text-slate-900">Genel Toplam:</span>
                <div className="text-right">
                  <div className="text-xl font-bold font-mono text-emerald-600">
                    {formatCurrency(order.grandTotal)}
                  </div>
                  <span className="text-[10px] text-slate-400">KDV Dahil</span>
                </div>
              </div>
            </div>

            {/* Buyer & Dealer Info */}
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs space-y-1.5 mt-4">
              <div className="font-bold text-slate-800 flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-blue-600" />
                <span>Bayi Bilgileri:</span>
              </div>
              <div className="text-slate-800 font-semibold">{order.companyName}</div>
              <div className="text-slate-500 text-[11px]">Yetkili: {order.userName}</div>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
