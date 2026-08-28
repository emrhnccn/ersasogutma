'use client';

import React from 'react';
import Link from 'next/link';
import { useStore } from '@/context/StoreContext';
import {
  ShoppingBag,
  CreditCard,
  Layers,
  ArrowRight,
  Plus,
  Zap,
  FileSpreadsheet,
  CheckCircle2,
  Clock,
  Truck,
  Building2,
  Calculator,
  ShieldCheck,
  Snowflake,
  AlertCircle,
  FileText,
  TrendingUp,
  RefreshCw,
  Eye,
  ChevronRight,
  Sparkles,
  Search
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

export default function DashboardPage() {
  const {
    orders,
    profile,
    cariSummary,
    cariTransactions,
    products,
    repeatOrder,
    exchangeRates,
    isFetchingRates,
    fetchLiveRates
  } = useStore();

  const pendingOrders = orders.filter((o) => o.status === 'bekliyor');
  const inTransitOrders = orders.filter((o) => o.status === 'sevkiyatta' || o.status === 'parcali');

  // Used credit limit calculation
  const usedCredit = Math.max(0, profile.riskLimit - profile.currentBalance);
  const availableCredit = Math.max(0, profile.creditLimit - usedCredit);
  const creditUsagePercent = Math.min(100, Math.round((usedCredit / profile.creditLimit) * 100));

  return (
    <div className="space-y-6">
      
      {/* 1. TOP ERP QUICK ACTIONS BAR */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-600 to-cyan-600 flex items-center justify-center text-white shadow-md shadow-sky-600/30">
            <Snowflake className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-black text-white flex items-center gap-2">
              <span>{profile.companyName}</span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-400 font-mono px-2 py-0.2 rounded-full">
                {profile.dealerCode}
              </span>
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Tanımlı Bayi İskontosu: <strong className="text-emerald-400">%{profile.discountRate * 100} ({profile.tier})</strong>
            </div>
          </div>
        </div>

        {/* Quick Action Button Group */}
        <div className="flex items-center gap-2 flex-wrap">
          <Link
            href="/urunler"
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs px-3.5 py-2.5 rounded-xl shadow-lg shadow-sky-900/30 transition"
          >
            <Plus className="w-4 h-4" />
            <span>+ YENİ SİPARİŞ</span>
          </Link>

          <Link
            href="/siparisler/hizli"
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs px-3.5 py-2.5 rounded-xl shadow-lg shadow-amber-950/30 transition"
          >
            <Zap className="w-4 h-4 fill-slate-950" />
            <span>⚡ HIZLI SİPARİŞ</span>
          </Link>

          <Link
            href="/siparisler/toplu-excel"
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-3.5 py-2.5 rounded-xl shadow-lg shadow-emerald-950/30 transition"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>EXCEL SİPARİŞ</span>
          </Link>

          <Link
            href="/siparisler"
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs px-3 py-2.5 rounded-xl border border-slate-700 transition"
          >
            <ShoppingBag className="w-4 h-4 text-sky-400" />
            <span>SİPARİŞLERİM</span>
          </Link>

          <Link
            href="/cari"
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 font-bold text-xs px-3 py-2.5 rounded-xl border border-slate-700 transition"
          >
            <span>₺ CARİ HESAP</span>
          </Link>
        </div>
      </div>

      {/* 2. CLEAR FINANCIAL HIERARCHY CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Cari Net Bakiye */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between space-y-3 relative overflow-hidden group hover:border-emerald-500/40 transition">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Cari Net Bakiye</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              {profile.balanceType === 'A' ? 'ALACAKLI' : 'BORÇLU'}
            </span>
          </div>
          <div>
            <h2 className="text-2xl sm:text-3xl font-black font-mono text-emerald-400 tracking-tight">
              {formatCurrency(profile.currentBalance)}
            </h2>
            <p className="text-[11px] text-slate-400 mt-1">
              Toplam Faturalaşma: <span className="text-slate-200 font-mono">{formatCurrency(cariSummary.totalOrders)}</span>
            </p>
          </div>
          <Link
            href="/cari"
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
              %{creditUsagePercent} Doluluk
            </span>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-baseline">
              <span className="text-xl sm:text-2xl font-black font-mono text-white">
                {formatCurrency(profile.creditLimit)}
              </span>
            </div>
            <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
              <div
                className="bg-gradient-to-r from-sky-500 to-emerald-400 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.max(5, creditUsagePercent)}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>Kullanılabilir: <strong className="text-emerald-400 font-mono">{formatCurrency(availableCredit)}</strong></span>
            </div>
          </div>
          <Link
            href="/finans/online-odeme"
            className="text-xs font-bold text-sky-400 hover:text-sky-300 flex items-center justify-between pt-2 border-t border-slate-800/80"
          >
            <span>Limit Ödemesi Yap (POS)</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Card 3: Ortalama Vade / Valör */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between space-y-3 hover:border-amber-500/40 transition">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Ortalama Vade</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 font-mono">
              60 GÜN
            </span>
          </div>
          <div>
            <h2 className="text-2xl sm:text-3xl font-black font-mono text-amber-400">
              58 Gün <span className="text-xs text-slate-400 font-normal">kalan</span>
            </h2>
            <p className="text-[11px] text-slate-400 mt-1">
              Yaklaşan Ödeme: <span className="text-white font-mono font-bold">15 Eylül 2026</span>
            </p>
          </div>
          <Link
            href="/finans/valor-vade"
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
              {pendingOrders.length + inTransitOrders.length} Aktif
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl sm:text-3xl font-black font-mono text-white">
                {orders.length} <span className="text-xs text-slate-400 font-normal">Sipariş</span>
              </h2>
            </div>
            <div className="flex items-center gap-3 text-[11px] mt-1">
              <span className="text-amber-400 font-medium">⏳ {pendingOrders.length} Bekleyen</span>
              <span className="text-slate-600">•</span>
              <span className="text-sky-400 font-medium">🚚 {inTransitOrders.length} Yolda</span>
            </div>
          </div>
          <Link
            href="/siparisler"
            className="text-xs font-bold text-sky-400 hover:text-sky-300 flex items-center justify-between pt-2 border-t border-slate-800/80"
          >
            <span>Sipariş Takibi & Detay</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

      </div>

      {/* 3. RECENT ORDERS & CARI SUMMARY SPLIT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Recent Orders Table (7 cols) */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-sky-400" />
              <h3 className="text-sm font-bold text-white">Son Siparişleriniz</h3>
            </div>
            <Link href="/siparisler" className="text-xs text-sky-400 hover:text-sky-300 font-bold">
              Tümünü Gör ({orders.length}) &rarr;
            </Link>
          </div>

          {orders.length === 0 ? (
            <div className="py-12 text-center text-slate-500 space-y-2">
              <ShoppingBag className="w-10 h-10 text-slate-700 mx-auto" />
              <p className="text-xs">Henüz verilmiş bir siparişiniz bulunmamaktadır.</p>
              <Link
                href="/urunler"
                className="inline-block mt-2 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs px-4 py-2 rounded-xl"
              >
                İlk Siparişinizi Oluşturun
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-slate-800/80">
              {orders.slice(0, 4).map((order) => (
                <div key={order.id} className="py-3 flex items-center justify-between text-xs gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-sky-400">#{order.orderNumber}</span>
                      <span className="text-[10px] text-slate-500">{order.date}</span>
                    </div>
                    <div className="text-[11px] text-slate-300 mt-0.5 line-clamp-1">
                      {order.items.map((i) => `${i.productName} (${i.quantity}x)`).join(', ')}
                    </div>
                  </div>

                  <div className="text-right flex items-center gap-3">
                    <div>
                      <div className="font-mono font-bold text-white">{formatCurrency(order.totalTRY)}</div>
                      <span className={`text-[10px] font-bold px-2 py-0.2 rounded-full ${
                        order.status === 'bekliyor' ? 'bg-amber-500/20 text-amber-400' :
                        order.status === 'sevkiyatta' ? 'bg-sky-500/20 text-sky-400' :
                        order.status === 'tamamlandi' ? 'bg-emerald-500/20 text-emerald-400' :
                        'bg-slate-800 text-slate-400'
                      }`}>
                        {order.statusText}
                      </span>
                    </div>

                    <button
                      onClick={() => repeatOrder(order.id)}
                      className="hidden sm:inline-flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-bold px-2.5 py-1.5 rounded-lg border border-slate-700 transition"
                      title="Bu siparişteki ürünleri sepete tekrar ekle"
                    >
                      <RefreshCw className="w-3 h-3 text-emerald-400" />
                      <span>Tekrarla</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: TCMB Live Rates & Fast SKU Lookup (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* TCMB Live Currency Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">TCMB Canlı Döviz Kurları</h3>
              </div>
              <button
                onClick={() => fetchLiveRates(true)}
                disabled={isFetchingRates}
                className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 font-mono"
              >
                <RefreshCw className={`w-3 h-3 ${isFetchingRates ? 'animate-spin text-sky-400' : ''}`} />
                <span>{exchangeRates.lastUpdated || 'Canlı'}</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-950 border border-slate-800 p-3.5 rounded-xl text-center">
                <span className="text-[10px] text-slate-500 uppercase font-bold block">USD / TRY</span>
                <span className="text-xl font-black font-mono text-emerald-400 mt-0.5 block">
                  {exchangeRates.USD_TRY ? `${exchangeRates.USD_TRY.toFixed(4)} ₺` : '...'}
                </span>
                <span className="text-[9px] text-slate-400">Merkez Bankası Efektif Satış</span>
              </div>

              <div className="bg-slate-950 border border-slate-800 p-3.5 rounded-xl text-center">
                <span className="text-[10px] text-slate-500 uppercase font-bold block">EUR / TRY</span>
                <span className="text-xl font-black font-mono text-sky-400 mt-0.5 block">
                  {exchangeRates.EUR_TRY ? `${exchangeRates.EUR_TRY.toFixed(4)} ₺` : '...'}
                </span>
                <span className="text-[9px] text-slate-400">Merkez Bankası Efektif Satış</span>
              </div>
            </div>

            <p className="text-[10px] text-slate-500 text-center">
              Döviz bazlı soğutma kompresörü ve gaz fiyatları anlık TCMB kuru üzerinden TL'ye çevrilir.
            </p>
          </div>

          {/* Quick SKU Action Banner */}
          <div className="bg-gradient-to-br from-amber-950/40 via-slate-900 to-slate-900 border border-amber-500/30 rounded-2xl p-5 shadow-xl space-y-3">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
              <Zap className="w-4 h-4 fill-amber-400" />
              <span>Yüksek Hızlı B2B Sipariş Girişi</span>
            </div>
            <p className="text-xs text-slate-300">
              Yüzlerce ürün arasında arama yapmadan sadece parça kodunu (SKU) girerek Enter tuşu ile anında sipariş oluşturun.
            </p>
            <Link
              href="/siparisler/hizli"
              className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs py-2.5 rounded-xl transition flex items-center justify-center gap-2"
            >
              <span>Hızlı Sipariş Ekranını Aç</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

        </div>

      </div>

    </div>
  );
}
