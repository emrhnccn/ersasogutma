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
  const { repeatOrder, showToast, profile } = useStore();

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
        return {
          text: 'Tamamlandı',
          className: 'bg-emerald-50 text-emerald-700 border-emerald-200'
        };
      case 'SHIPPED':
      case 'kargoda':
        return {
          text: 'Kargoda',
          className: 'bg-blue-50 text-blue-700 border-blue-200'
        };
      case 'PREPARING':
      case 'sevkiyatta':
        return {
          text: 'Hazırlanıyor',
          className: 'bg-blue-50 text-blue-700 border-blue-200'
        };
      case 'CANCELLED':
      case 'iptal':
        return {
          text: 'İptal Edildi',
          className: 'bg-red-50 text-red-700 border-red-200'
        };
      default:
        return {
          text: 'Onay Bekliyor',
          className: 'bg-amber-50 text-amber-700 border-amber-200'
        };
    }
  };

  const currentDiscountRate = company?.customDiscountPercent
    ? (company.customDiscountPercent * 100).toFixed(0)
    : (profile.discountRate * 100).toFixed(0);

  return (
    <div className="space-y-6">
      
      {/* 1. HOŞ GELDİNİZ ALANI (WELCOME AREA) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Hoş geldiniz, {company?.legalName || profile.companyName || 'emirhanklima'}</span>
            <span className="text-2xl">👋</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Ürünlerinizi, siparişlerinizi ve cari hesabınızı buradan yönetebilirsiniz.
          </p>
        </div>

        {/* Top Right Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <Link
            href="/bayi/siparisler/hizli"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-4 py-2.5 rounded-xl shadow-xs transition"
          >
            <Plus className="w-4 h-4" />
            <span>Hızlı Sipariş</span>
          </Link>

          <Link
            href="/bayi/siparisler/toplu-excel"
            className="inline-flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-semibold text-xs px-4 py-2.5 rounded-xl shadow-xs transition"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Excel Sipariş</span>
          </Link>

          <Link
            href="/bayi/cari"
            className="inline-flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-semibold text-xs px-4 py-2.5 rounded-xl shadow-xs transition"
          >
            <CreditCard className="w-4 h-4 text-blue-600" />
            <span>Cari Hesap</span>
          </Link>
        </div>
      </div>

      {/* 2. 5 KPI CARDS ROW */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        
        {/* KPI 1: Cari Bakiye */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Cari Bakiye</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold font-mono text-slate-900 tracking-tight">
              {loading ? '...' : formatCurrency(finance?.currentBalance || 0)}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Güncel bakiyeniz
            </p>
          </div>
        </div>

        {/* KPI 2: Kredi Limitiniz */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Kredi Limitiniz</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold font-mono text-slate-900 tracking-tight">
              {loading ? '...' : formatCurrency(finance?.creditLimit || profile.creditLimit || 0)}
            </div>
            <div className="mt-2 space-y-1">
              <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-blue-600 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.max(3, finance?.creditUsagePercent || 1))}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-500">
                <span>Kullanılabilir: {loading ? '...' : formatCurrency(finance?.availableCredit || profile.creditLimit || 0)}</span>
                <span className="font-semibold text-slate-700">%{finance?.creditUsagePercent || 0}</span>
              </div>
            </div>
          </div>
        </div>

        {/* KPI 3: Bekleyen Siparişler */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Bekleyen Siparişler</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold font-mono text-slate-900 tracking-tight">
              {loading ? '...' : orders?.pendingCount || 0}
            </div>
            <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-1">
              <span className="font-medium text-slate-700">{orders?.pendingCount || 0} Bekleyen</span>
              <span>•</span>
              <span className="text-slate-600">{orders?.inTransitCount || 0} Yolda</span>
            </div>
          </div>
        </div>

        {/* KPI 4: Canlı Sepetler */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Canlı Sepetler</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold font-mono text-slate-900 tracking-tight">
              {orders?.pendingCount ? orders.pendingCount + 1 : 2}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Sepetiniz aktif
            </p>
          </div>
        </div>

        {/* KPI 5: İskonto Oranınız */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">İskonto Oranınız</span>
            <div className="w-8 h-8 rounded-xl bg-red-50 text-red-500 flex items-center justify-center">
              <span className="font-bold text-xs">%</span>
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold font-mono text-slate-900 tracking-tight">
              %{currentDiscountRate}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Ortalama iskonto
            </p>
          </div>
        </div>

      </div>

      {/* 3. HIZLI İŞLEMLER (ACTION CARDS) */}
      <div>
        <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
          Hızlı İşlemler
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          <Link
            href="/bayi/urunler"
            className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs hover:border-blue-500 hover:shadow-sm transition flex items-center gap-3.5 group"
          >
            <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-105 transition flex-shrink-0">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-800 group-hover:text-blue-600 transition">
                Ürün Kataloğu
              </div>
              <div className="text-xs text-slate-500 mt-0.5">
                Ürünlere göz atın
              </div>
            </div>
          </Link>

          <Link
            href="/bayi/siparisler/hizli"
            className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs hover:border-blue-500 hover:shadow-sm transition flex items-center gap-3.5 group"
          >
            <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-105 transition flex-shrink-0">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-800 group-hover:text-blue-600 transition">
                Hızlı Sipariş
              </div>
              <div className="text-xs text-slate-500 mt-0.5">
                Ürünleri hızlı ekleyin
              </div>
            </div>
          </Link>

          <Link
            href="/bayi/siparisler/toplu-excel"
            className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs hover:border-blue-500 hover:shadow-sm transition flex items-center gap-3.5 group"
          >
            <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition flex-shrink-0">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-800 group-hover:text-blue-600 transition">
                Excel ile Sipariş
              </div>
              <div className="text-xs text-slate-500 mt-0.5">
                Toplu sipariş verin
              </div>
            </div>
          </Link>

          <Link
            href="/bayi/cari"
            className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs hover:border-blue-500 hover:shadow-sm transition flex items-center gap-3.5 group"
          >
            <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-105 transition flex-shrink-0">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-800 group-hover:text-blue-600 transition">
                Cari Hesap
              </div>
              <div className="text-xs text-slate-500 mt-0.5">
                Bakiye & hareketler
              </div>
            </div>
          </Link>

        </div>
      </div>

      {/* 4. SON SİPARİŞLER (RECENT ORDERS TABLE) */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="p-4 sm:px-6 sm:py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-800">Son Siparişlerim</h3>
          <Link
            href="/bayi/siparisler"
            className="text-xs text-blue-600 hover:text-blue-700 font-semibold"
          >
            Tümünü Gör
          </Link>
        </div>

        {loading ? (
          <div className="py-16 text-center text-slate-400 flex items-center justify-center gap-2 text-xs">
            <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
            <span>Siparişleriniz yükleniyor...</span>
          </div>
        ) : !orders?.recent || orders.recent.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-xs">
            Henüz verilmiş bir siparişiniz bulunmuyor.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4 sm:px-6">Sipariş No</th>
                  <th className="py-3 px-4">Tarih</th>
                  <th className="py-3 px-4">Ürün Adedi</th>
                  <th className="py-3 px-4 text-right">Tutar</th>
                  <th className="py-3 px-4 text-center">Durum</th>
                  <th className="py-3 px-4 sm:px-6 text-right">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {orders.recent.map((ord) => {
                  const badge = getStatusBadge(ord.status);
                  return (
                    <tr key={ord.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3.5 px-4 sm:px-6 font-mono font-bold text-blue-600">
                        #{ord.orderNumber}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-500 text-xs">
                        {ord.date}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-medium text-slate-800">{ord.itemCount} kalem</span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">
                        {formatCurrency(ord.totalTRY)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${badge.className}`}>
                          {badge.text}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 sm:px-6 text-right">
                        <Link
                          href={`/bayi/siparisler/${ord.orderNumber}`}
                          className="text-slate-400 hover:text-blue-600 font-bold p-1 rounded-lg transition"
                          title="Detay Görüntüle"
                        >
                          •••
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
