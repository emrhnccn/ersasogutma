'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useStore } from '@/context/StoreContext';
import {
  ShoppingBag,
  CreditCard,
  Plus,
  Zap,
  FileSpreadsheet,
  CheckCircle2,
  Clock,
  Truck,
  Building2,
  Snowflake,
  AlertCircle,
  FileText,
  TrendingUp,
  RefreshCw,
  ChevronRight,
  Loader2
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface DashboardData {
  company: {
    id: string;
    legalName: string;
    taxNo: string;
    dealerCode: string;
    customDiscountPercent: number;
  };
  finance: {
    currentBalance: number;
    creditLimit: number;
    availableCredit: number;
    creditUsagePercent: number;
    balanceType: 'B' | 'A';
    totalInvoiced: number;
    averageMaturityDays: number | null;
    upcomingPaymentDate: string | null;
  };
  orders: {
    totalCount: number;
    pendingCount: number;
    inTransitCount: number;
    deliveredCount: number;
    recent: Array<{
      id: string;
      orderNumber: string;
      date: string;
      time: string;
      totalTRY: number;
      status: string;
      paymentMethod: string;
      itemCount: number;
      items: Array<{
        id: string;
        name: string;
        quantity: number;
        unit: string;
        unitPriceTRY: number;
        totalTRY: number;
        image: string;
      }>;
    }>;
  };
}

export default function DashboardPage() {
  const { repeatOrder, showToast } = useStore();

  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/b2b/dashboard');
      const json = await res.json();
      if (json.success && json.data) {
        setDashboardData(json.data);
      }
    } catch (err) {
      console.error('Failed to load dashboard metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const company = dashboardData?.company;
  const finance = dashboardData?.finance;
  const orders = dashboardData?.orders;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
      case 'COMPLETED':
      case 'DELIVERED':
      case 'tamamlandi':
        return { text: 'Teslim Edildi', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30', icon: <CheckCircle2 className="w-3 h-3" /> };
      case 'SHIPPED':
      case 'PREPARING':
      case 'sevkiyatta':
        return { text: 'Sevkiyatta / Kargoda', color: 'bg-sky-500/20 text-sky-300 border-sky-500/30', icon: <Truck className="w-3 h-3" /> };
      case 'CANCELLED':
        return { text: 'İptal Edildi', color: 'bg-rose-500/20 text-rose-300 border-rose-500/30', icon: <AlertCircle className="w-3 h-3" /> };
      default:
        return { text: 'Onay Bekliyor', color: 'bg-amber-500/20 text-amber-300 border-amber-500/30', icon: <Clock className="w-3 h-3" /> };
    }
  };

  return (
    <div className="space-y-6">
      
      {/* 1. TOP ERP QUICK ACTIONS BAR (Cleaned - No Tier or Discount percentages shown) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-600 to-cyan-600 flex items-center justify-center text-white shadow-md shadow-sky-600/30">
            <Snowflake className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-black text-white flex items-center gap-2">
              <span>{company?.legalName || 'Bayi Portalı'}</span>
              <span className="text-[10px] bg-sky-500/20 text-sky-400 font-mono px-2 py-0.5 rounded-full border border-sky-500/30">
                {company?.dealerCode || 'B2B'}
              </span>
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Ersa Soğutma B2B Bayi İşlem & Sipariş Yönetim Merkezi
            </div>
          </div>
        </div>

        {/* Quick Action Button Group */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={fetchDashboard}
            className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition"
            title="Yenile"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-sky-400' : ''}`} />
          </button>

          <Link
            href="/bayi/urunler"
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs px-3.5 py-2.5 rounded-xl shadow-lg shadow-sky-900/30 transition"
          >
            <Plus className="w-4 h-4" />
            <span>+ YENİ SİPARİŞ</span>
          </Link>

          <Link
            href="/bayi/siparisler/hizli"
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs px-3.5 py-2.5 rounded-xl shadow-lg shadow-amber-950/30 transition"
          >
            <Zap className="w-4 h-4 fill-slate-950" />
            <span>⚡ HIZLI SİPARİŞ</span>
          </Link>

          <Link
            href="/bayi/siparisler/toplu-excel"
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-3.5 py-2.5 rounded-xl shadow-lg shadow-emerald-950/30 transition"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>EXCEL SİPARİŞ</span>
          </Link>

          <Link
            href="/bayi/siparisler"
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs px-3 py-2.5 rounded-xl border border-slate-700 transition"
          >
            <ShoppingBag className="w-4 h-4 text-sky-400" />
            <span>SİPARİŞLERİM</span>
          </Link>

          <Link
            href="/bayi/cari"
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 font-bold text-xs px-3 py-2.5 rounded-xl border border-slate-700 transition"
          >
            <span>₺ CARİ HESAP</span>
          </Link>
        </div>
      </div>

      {/* 2. CLEAR FINANCIAL HIERARCHY CARDS (100% Live DB Metrics) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Cari Net Bakiye */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between space-y-3 relative overflow-hidden group hover:border-emerald-500/40 transition">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Cari Net Bakiye</span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
              (finance?.currentBalance || 0) > 0
                ? 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
            }`}>
              {finance?.balanceType === 'A' ? 'ALACAKLI' : 'BORÇLU'}
            </span>
          </div>
          <div>
            <h2 className="text-2xl sm:text-3xl font-black font-mono text-emerald-400 tracking-tight">
              {loading ? '...' : formatCurrency(finance?.currentBalance || 0)}
            </h2>
            <p className="text-[11px] text-slate-400 mt-1">
              Toplam Faturalaşma: <span className="text-slate-200 font-mono">{loading ? '...' : formatCurrency(finance?.totalInvoiced || 0)}</span>
            </p>
          </div>
          <Link
            href="/bayi/cari"
            className="text-xs font-bold text-sky-400 hover:text-sky-300 flex items-center justify-between pt-2 border-t border-slate-800/80"
          >
            <span>Ekstre & Detay Görüntüle</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Card 2: Kredi & Risk Limiti */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between space-y-3 hover:border-sky-500/40 transition">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Kredi & Risk Limiti</span>
            <span className="text-[10px] font-bold text-sky-400 font-mono">
              %{finance?.creditUsagePercent || 0} Doluluk
            </span>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-baseline">
              <span className="text-xl sm:text-2xl font-black font-mono text-white">
                {loading ? '...' : formatCurrency(finance?.creditLimit || 0)}
              </span>
            </div>
            <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
              <div
                className="bg-gradient-to-r from-sky-500 to-emerald-400 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.max(5, finance?.creditUsagePercent || 0)}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>Kullanılabilir: <strong className="text-emerald-400 font-mono">{loading ? '...' : formatCurrency(finance?.availableCredit || 0)}</strong></span>
            </div>
          </div>
          <Link
            href="/bayi/finans/online-odeme"
            className="text-xs font-bold text-sky-400 hover:text-sky-300 flex items-center justify-between pt-2 border-t border-slate-800/80"
          >
            <span>Limit Ödemesi Yap (POS)</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Card 3: Ortalama Vade / Valör */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between space-y-3 hover:border-amber-500/40 transition">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Vade & Ödeme Durumu</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-mono">
              {finance?.averageMaturityDays ? `${finance.averageMaturityDays} Gün` : 'Açık Hesap'}
            </span>
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-200">
              {finance?.averageMaturityDays ? `${finance.averageMaturityDays} Gün Ortalama` : 'Vade bilgisi bulunmuyor'}
            </h2>
            <p className="text-[11px] text-slate-400 mt-1">
              Yaklaşan Ödeme: <span className="text-slate-300 font-mono">{finance?.upcomingPaymentDate || 'Yaklaşan ödeme bulunmuyor'}</span>
            </p>
          </div>
          <Link
            href="/bayi/finans/valor-vade"
            className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center justify-between pt-2 border-t border-slate-800/80"
          >
            <span>Vade & Çek Dağılımı</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Card 4: Aktif Siparişler & Sevkiyat */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between space-y-3 hover:border-cyan-500/40 transition">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Sipariş & Sevkiyat</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              {loading ? '...' : (orders?.pendingCount || 0) + (orders?.inTransitCount || 0)} Aktif
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl sm:text-3xl font-black font-mono text-white">
                {loading ? '...' : orders?.totalCount || 0} <span className="text-xs text-slate-400 font-normal">Sipariş</span>
              </h2>
            </div>
            <div className="flex items-center gap-3 text-[11px] mt-1">
              <span className="text-amber-400 font-medium">⏳ {orders?.pendingCount || 0} Bekleyen</span>
              <span className="text-slate-600">•</span>
              <span className="text-sky-400 font-medium">🚚 {orders?.inTransitCount || 0} Yolda</span>
            </div>
          </div>
          <Link
            href="/bayi/siparisler"
            className="text-xs font-bold text-sky-400 hover:text-sky-300 flex items-center justify-between pt-2 border-t border-slate-800/80"
          >
            <span>Sipariş Takibi & Detay</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

      </div>

      {/* 3. RECENT ORDERS TABLE (100% Live DB Orders) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-sky-400" />
            <h3 className="text-sm font-bold text-white">Son Siparişleriniz</h3>
          </div>
          <Link href="/bayi/siparisler" className="text-xs text-sky-400 hover:text-sky-300 font-bold">
            Tümünü Gör ({orders?.totalCount || 0}) &rarr;
          </Link>
        </div>

        {loading ? (
          <div className="py-12 text-center text-slate-400 flex items-center justify-center gap-2 text-xs">
            <Loader2 className="w-4 h-4 animate-spin text-sky-400" />
            <span>Siparişleriniz yükleniyor...</span>
          </div>
        ) : !orders?.recent || orders.recent.length === 0 ? (
          <div className="py-8 text-center text-slate-500 text-xs">
            Henüz verilmiş bir siparişiniz bulunmuyor.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 font-bold border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Sipariş No</th>
                  <th className="py-3 px-4">Tarih</th>
                  <th className="py-3 px-4">Kalemler</th>
                  <th className="py-3 px-4">Ödeme Türü</th>
                  <th className="py-3 px-4 text-right">Tutar</th>
                  <th className="py-3 px-4 text-center">Durum</th>
                  <th className="py-3 px-4 text-right">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {orders.recent.map((ord) => {
                  const badge = getStatusBadge(ord.status);
                  return (
                    <tr key={ord.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3 px-4 font-mono font-bold text-sky-400">
                        #{ord.orderNumber}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-400 text-[11px]">
                        {ord.date}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-white line-clamp-1">
                          {ord.items.map((i) => i.name).join(', ')}
                        </div>
                        <span className="text-[10px] text-slate-400">{ord.itemCount} Kalem Ürün</span>
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px]">
                        {ord.paymentMethod === 'SANAL_POS' ? (
                          <span className="text-emerald-400 font-bold">Sanal POS</span>
                        ) : (
                          <span className="text-sky-400 font-bold">Cari Hesap</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-emerald-400">
                        {formatCurrency(ord.totalTRY)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${badge.color}`}>
                          {badge.icon}
                          <span>{badge.text}</span>
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Link
                          href={`/bayi/siparisler/${ord.orderNumber}`}
                          className="bg-slate-800 hover:bg-slate-700 text-sky-400 hover:text-white px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition"
                        >
                          Detay
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
