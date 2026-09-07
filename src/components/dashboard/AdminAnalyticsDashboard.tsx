'use client';

import React, { useState, useMemo } from 'react';
import { formatCurrency } from '@/lib/utils';
import {
  Sparkles,
  ArrowUpRight,
  TrendingUp,
  Package,
  UserCheck,
  CheckCircle2,
  Clock,
  Layers
} from 'lucide-react';

interface AdminAnalyticsProps {
  orders?: any[];
  dealersCount?: number;
  dealers?: any[];
  products?: any[];
  categories?: any[];
  productsCount?: number;
  categoriesCount?: number;
  className?: string;
}

export const AdminAnalyticsDashboard: React.FC<AdminAnalyticsProps> = ({
  orders = [],
  dealersCount = 0,
  dealers = [],
  products = [],
  categories = [],
  productsCount = 0,
  categoriesCount = 0,
  className = ''
}) => {
  const [activeChartMilestone, setActiveChartMilestone] = useState<number>(5);
  const [activeSegmentIndex, setActiveSegmentIndex] = useState<number | null>(null);
  const [topPerformerTab, setTopPerformerTab] = useState<'products' | 'dealers'>('products');

  // Real Total Revenue from Database Orders
  const totalRevenue = useMemo(() => {
    return orders.reduce((sum, o) => sum + (Number(o.grandTotal) || 0), 0);
  }, [orders]);

  // Real Active/In-fulfillment Orders Count
  const activeOrdersCount = useMemo(() => {
    return orders.filter(
      (o) => o.status === 'PENDING_APPROVAL' || o.status === 'SHIPPED' || o.status === 'PREPARING'
    ).length;
  }, [orders]);

  // Real Delivered / Completed Orders Percentage
  const completionRate = useMemo(() => {
    if (orders.length === 0) return 0;
    const completed = orders.filter(
      (o) => o.status === 'COMPLETED' || o.status === 'DELIVERED' || o.status === 'APPROVED'
    ).length;
    return Math.round((completed / orders.length) * 100);
  }, [orders]);

  // Real Registered Dealers Count
  const totalDealers = dealersCount || dealers.length || 0;

  // Real Monthly Revenue Trend Data (Calculated dynamically for the last 6 months from orders)
  const monthlyData = useMemo(() => {
    const now = new Date();
    const result = [];

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const targetMonth = d.getMonth();
      const targetYear = d.getFullYear();
      const monthName = d.toLocaleDateString('tr-TR', { month: 'long' });
      const shortName = d.toLocaleDateString('tr-TR', { month: 'short' });

      const monthOrders = orders.filter((o) => {
        if (!o.createdAt) return false;
        const od = new Date(o.createdAt);
        return od.getMonth() === targetMonth && od.getFullYear() === targetYear;
      });

      const rev = monthOrders.reduce((sum, o) => sum + (Number(o.grandTotal) || 0), 0);

      result.push({
        month: `${monthName.charAt(0).toUpperCase() + monthName.slice(1)} ${targetYear}`,
        short: shortName,
        revenue: rev,
        orders: monthOrders.length
      });
    }

    const maxRev = Math.max(...result.map((r) => r.revenue), 1);

    return result.map((item, idx) => {
      const x = 50 + idx * 100;
      // If maxRev > 1 and revenue > 0, scale y from 50 (max) to 150 (min), otherwise baseline 160
      const y = item.revenue > 0 ? Math.round(155 - (item.revenue / maxRev) * 105) : 155;
      return { ...item, x, y };
    });
  }, [orders]);

  // Real Category Distribution from Database Categories & Products
  const categorySegments = useMemo(() => {
    const mainCats = categories.filter((c) => !c.parentId);
    const topCats = (mainCats.length > 0 ? mainCats : categories).slice(0, 4);

    const totalProductSum =
      topCats.reduce((sum, c) => sum + (Number(c._count?.products) || 0), 0) || 1;

    const palette = ['#06B6D4', '#8B5CF6', '#EC4899', '#3B82F6'];

    return topCats.map((cat, idx) => {
      const count = Number(cat._count?.products) || 0;
      const percent = totalProductSum > 0 ? Math.round((count / totalProductSum) * 100) : 0;
      return {
        id: cat.id,
        name: cat.name,
        count,
        percent,
        color: palette[idx % palette.length]
      };
    });
  }, [categories]);

  // Real Weekly Order Activity (Past 7 calendar days)
  const weeklyActivity = useMemo(() => {
    const now = new Date();
    const dayLabels = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];
    const result = [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const dayIndex = d.getDay();
      const dateString = d.toISOString().split('T')[0];

      const dayOrders = orders.filter((o) => {
        if (!o.createdAt) return false;
        return new Date(o.createdAt).toISOString().split('T')[0] === dateString;
      });

      const dayRevenue = dayOrders.reduce((sum, o) => sum + (Number(o.grandTotal) || 0), 0);

      result.push({
        day: dayLabels[dayIndex],
        date: dateString,
        count: dayOrders.length,
        amount: formatCurrency(dayRevenue)
      });
    }

    const maxCount = Math.max(...result.map((r) => r.count), 1);

    return result.map((r) => ({
      ...r,
      height: r.count > 0 ? Math.max(12, Math.round((r.count / maxCount) * 90)) : 6
    }));
  }, [orders]);

  // Real Top Products (Aggregated from Order Items or Database Products)
  const realTopProducts = useMemo(() => {
    const productSalesMap = new Map<string, { name: string; sku: string; category: string; revenue: number; qty: number }>();

    orders.forEach((o) => {
      const items = Array.isArray(o.items) ? o.items : [];
      items.forEach((item: any) => {
        const key = item.productId || item.product?.id || item.id;
        if (!key) return;
        const current = productSalesMap.get(key) || {
          name: item.product?.name || item.name || 'Ürün',
          sku: item.product?.sku || item.sku || '-',
          category: item.product?.category?.name || 'Genel',
          revenue: 0,
          qty: 0
        };
        current.revenue += Number(item.totalPrice || item.totalTRY || 0);
        current.qty += Number(item.quantity || 1);
        productSalesMap.set(key, current);
      });
    });

    if (productSalesMap.size > 0) {
      return Array.from(productSalesMap.entries())
        .map(([id, val]) => ({
          id,
          name: val.name,
          code: val.sku,
          category: val.category,
          revenue: val.revenue,
          qty: val.qty,
          status: 'Sipariş Alındı'
        }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);
    }

    // Fallback to real products from catalog if no orders yet
    return products.slice(0, 5).map((p) => ({
      id: p.id,
      name: p.name,
      code: p.sku || '-',
      category: p.category?.name || 'Katalog',
      revenue: Number(p.salePrice) || 0,
      qty: Number(p.stockQty) || 0,
      status: 'Katalogda'
    }));
  }, [orders, products]);

  // Real Top Dealers (Aggregated from Orders or Real Dealers List)
  const realTopDealers = useMemo(() => {
    const dealerMap = new Map<string, { name: string; city: string; orders: number; revenue: number }>();

    orders.forEach((o) => {
      const company = o.company || {};
      const key = company.id || o.companyId || 'bilinmeyen';
      const current = dealerMap.get(key) || {
        name: company.legalName || 'B2B Bayi',
        city: company.taxOffice || 'Türkiye',
        orders: 0,
        revenue: 0
      };
      current.orders += 1;
      current.revenue += Number(o.grandTotal || 0);
      dealerMap.set(key, current);
    });

    if (dealerMap.size > 0) {
      return Array.from(dealerMap.entries())
        .map(([id, val]) => ({
          id,
          name: val.name,
          city: val.city,
          orders: val.orders,
          revenue: val.revenue,
          status: 'Aktif Bayi'
        }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);
    }

    // Fallback to real dealers list
    return dealers.slice(0, 5).map((d) => ({
      id: d.id,
      name: d.legalName || d.companyName || 'Bayi',
      city: d.taxOffice || 'Kayıtlı',
      orders: 0,
      revenue: 0,
      status: d.status === 'ACTIVE' ? 'Kayıtlı Bayi' : 'Onay Bekliyor'
    }));
  }, [orders, dealers]);

  const activeMilestone = monthlyData[activeChartMilestone] || monthlyData[monthlyData.length - 1];

  // SVG Area path generation
  const areaPath = useMemo(() => {
    if (monthlyData.length === 0) return '';
    const points = monthlyData.map((d) => `${d.x},${d.y}`);
    return `M50,155 L${points.join(' L')} L550,175 L50,175 Z`;
  }, [monthlyData]);

  const linePath = useMemo(() => {
    if (monthlyData.length === 0) return '';
    return `M${monthlyData.map((d) => `${d.x},${d.y}`).join(' L')}`;
  }, [monthlyData]);

  // Donut Arc calculation (Circumference ~251.2 for radius 40)
  const donutSegments = useMemo(() => {
    let accumulatedOffset = 0;
    const circumference = 251.2;

    return categorySegments.map((seg) => {
      const strokeDash = (seg.percent / 100) * circumference;
      const strokeSpace = circumference - strokeDash;
      const offset = -accumulatedOffset;
      accumulatedOffset += strokeDash;

      return {
        ...seg,
        strokeDasharray: `${strokeDash.toFixed(1)} ${strokeSpace.toFixed(1)}`,
        strokeDashoffset: offset.toFixed(1)
      };
    });
  }, [categorySegments]);

  return (
    <div className={`space-y-6 ${className}`}>
      
      {/* 1. TOP SUBTLE HEADER (CCNCORE) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-xs">
        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-mono font-bold tracking-widest text-slate-500 uppercase">
              ccncore • operasyon analitiği
            </span>
          </div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight mt-0.5">
            Canlı B2B Finans & Sipariş Analizi
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Tüm grafikler ve istatistikler veritabanındaki gerçek kayıtlarla anlık olarak hesaplanmaktadır.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-slate-500">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Veritabanı Canlı Senkronizasyon</span>
        </div>
      </div>

      {/* 2. TOP 4 KPI CARDS WITH REAL METRICS (NexaCore Style) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Toplam Ciro (Real Orders Sum) */}
        <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800/80 rounded-2xl p-5 shadow-xs relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Toplam Gerçek Ciro
              </span>
              <div className="text-2xl font-black font-mono text-slate-900 dark:text-white mt-1 tracking-tight">
                {formatCurrency(totalRevenue)}
              </div>
            </div>
            <span className="text-[10px] font-mono font-bold text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
              Gerçek Ciro
            </span>
          </div>

          <div className="mt-4 pt-2">
            <svg className="w-full h-8 overflow-visible" viewBox="0 0 160 32">
              <defs>
                <linearGradient id="waveRealGrad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#8B5CF6" />
                  <stop offset="100%" stopColor="#06B6D4" />
                </linearGradient>
              </defs>
              <path
                d={totalRevenue > 0 ? "M0,24 Q40,8 80,18 T160,6" : "M0,24 L160,24"}
                fill="none"
                stroke="url(#waveRealGrad)"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>

        {/* Card 2: Kayıtlı Bayiler (Real Dealers Count) */}
        <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800/80 rounded-2xl p-5 shadow-xs relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Kayıtlı Bayi Sayısı
              </span>
              <div className="text-2xl font-black font-mono text-slate-900 dark:text-white mt-1 tracking-tight">
                {totalDealers} Bayi
              </div>
            </div>
            <span className="text-[10px] font-mono font-bold text-sky-500 bg-sky-500/10 border border-sky-500/20 px-2 py-0.5 rounded-full">
              PostgreSQL
            </span>
          </div>

          <div className="mt-4 pt-2">
            <svg className="w-full h-8 overflow-visible" viewBox="0 0 160 32">
              <path
                d={totalDealers > 0 ? "M0,20 Q45,26 90,12 T160,8" : "M0,24 L160,24"}
                fill="none"
                stroke="#06B6D4"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>

        {/* Card 3: Tamamlanan Sipariş Oranı */}
        <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800/80 rounded-2xl p-5 shadow-xs relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Sipariş Teslim Oranı
              </span>
              <div className="text-2xl font-black font-mono text-slate-900 dark:text-white mt-1 tracking-tight">
                %{completionRate}
              </div>
            </div>
            <span className="text-[10px] font-mono font-bold text-purple-500 bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded-full">
              {orders.length} Toplam
            </span>
          </div>

          <div className="mt-4 pt-2">
            <svg className="w-full h-8 overflow-visible" viewBox="0 0 160 32">
              <path
                d={completionRate > 0 ? "M0,18 Q40,28 80,14 T160,8" : "M0,24 L160,24"}
                fill="none"
                stroke="#8B5CF6"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>

        {/* Card 4: Aktif / Bekleyen İşlemler */}
        <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800/80 rounded-2xl p-5 shadow-xs relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Aktif / Bekleyen Sipariş
              </span>
              <div className="text-2xl font-black font-mono text-slate-900 dark:text-white mt-1 tracking-tight">
                {activeOrdersCount} Sipariş
              </div>
            </div>
            <span className="text-[10px] font-mono font-bold text-amber-500 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
              Bekleyen
            </span>
          </div>

          <div className="mt-4 pt-2 flex items-end justify-between gap-1.5 h-8 px-1">
            {[20, 35, 60, 45, 80, 50, 65, 30, 90, activeOrdersCount > 0 ? 100 : 15].map((h, i) => (
              <div
                key={i}
                style={{ height: `${h}%` }}
                className="w-2 rounded-t-sm bg-gradient-to-t from-purple-600 to-cyan-400 opacity-75 transition"
              />
            ))}
          </div>
        </div>

      </div>

      {/* 3. CENTER ROW: REVENUE GROWTH (REAL DATA) & CATEGORY DISTRIBUTION */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* REVENUE GROWTH / AYLIK CİRO GRAFİĞİ (8 Cols) */}
        <div className="lg:col-span-8 bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>Gerçek Ciro Büyüme Trendi</span>
                  <span className="text-[10px] font-mono font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2 py-0.5 rounded-full">
                    Son 6 Ay
                  </span>
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Veritabanındaki sipariş tarihlerine göre hesaplanır. Noktaların üzerine gelerek ay detayını görebilirsiniz.
                </p>
              </div>

              {/* Active Month Info Badge */}
              <div className="bg-slate-900 border border-purple-500/40 rounded-xl px-3 py-1.5 shadow-md flex items-center gap-2.5 self-start sm:self-auto">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
                <div className="text-left">
                  <div className="text-[9px] text-slate-400 font-bold uppercase">{activeMilestone.month}</div>
                  <div className="text-xs font-black font-mono text-cyan-300">
                    {formatCurrency(activeMilestone.revenue)}
                  </div>
                </div>
                <span className="text-[10px] font-mono text-purple-300 bg-purple-500/20 px-1.5 py-0.5 rounded font-bold">
                  {activeMilestone.orders} Sipariş
                </span>
              </div>
            </div>

            {/* Glowing Bezier Area Chart */}
            <div className="mt-6 relative h-64 sm:h-72 w-full">
              <svg className="w-full h-full overflow-visible" viewBox="0 0 600 200" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="realAreaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#06B6D4" stopOpacity="0.0" />
                  </linearGradient>

                  <linearGradient id="realCurveGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#A855F7" />
                    <stop offset="50%" stopColor="#8B5CF6" />
                    <stop offset="100%" stopColor="#06B6D4" />
                  </linearGradient>

                  <filter id="realGlowFilter" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#8B5CF6" floodOpacity="0.6" />
                  </filter>
                </defs>

                {/* Grid Lines */}
                {[45, 85, 125, 160].map((y) => (
                  <line
                    key={y}
                    x1="30"
                    y1={y}
                    x2="570"
                    y2={y}
                    stroke="currentColor"
                    className="text-slate-100 dark:text-slate-800"
                    strokeDasharray="4 4"
                    strokeWidth="1"
                  />
                ))}

                {/* Area Fill */}
                <path d={areaPath} fill="url(#realAreaGrad)" />

                {/* Stroke Line */}
                <path
                  d={linePath}
                  fill="none"
                  stroke="url(#realCurveGrad)"
                  strokeWidth="3"
                  strokeLinecap="round"
                  filter="url(#realGlowFilter)"
                />

                {/* Interactive Points */}
                {monthlyData.map((item, idx) => {
                  const isSelected = idx === activeChartMilestone;
                  return (
                    <g
                      key={item.month}
                      className="cursor-pointer"
                      onClick={() => setActiveChartMilestone(idx)}
                      onMouseEnter={() => setActiveChartMilestone(idx)}
                    >
                      {isSelected && (
                        <circle cx={item.x} cy={item.y} r="10" fill="#06B6D4" fillOpacity="0.3" className="animate-ping" />
                      )}
                      {isSelected && (
                        <line x1={item.x} y1={item.y} x2={item.x} y2="160" stroke="#06B6D4" strokeWidth="1.5" strokeDasharray="2 2" />
                      )}
                      <circle
                        cx={item.x}
                        cy={item.y}
                        r={isSelected ? 5.5 : 4}
                        fill={isSelected ? '#38BDF8' : '#8B5CF6'}
                        stroke="#0F172A"
                        strokeWidth="2"
                        className="transition-all"
                      />
                    </g>
                  );
                })}
              </svg>
            </div>

            {/* X-Axis Month Labels */}
            <div className="flex items-center justify-between px-6 pt-2 text-xs font-mono font-bold text-slate-400">
              {monthlyData.map((m, idx) => (
                <button
                  key={m.month}
                  type="button"
                  onClick={() => setActiveChartMilestone(idx)}
                  className={`transition cursor-pointer ${
                    idx === activeChartMilestone ? 'text-cyan-400 font-bold underline' : 'hover:text-white'
                  }`}
                >
                  {m.short}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* DONUT CHART: REAL CATEGORY DISTRIBUTION (4 Cols) */}
        <div className="lg:col-span-4 bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Katalog & Kategori Hacimleri
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Kayıtlı kategorilerin ürün sayılarına göre dağılımı
              </p>
            </div>

            {/* SVG Donut Chart */}
            <div className="my-6 relative flex items-center justify-center">
              <svg className="w-48 h-48 transform -rotate-90" viewBox="0 0 100 100">
                {donutSegments.map((seg, idx) => (
                  <circle
                    key={seg.name}
                    cx="50"
                    cy="50"
                    r="40"
                    fill="transparent"
                    stroke={seg.color}
                    strokeWidth="11"
                    strokeDasharray={seg.strokeDasharray}
                    strokeDashoffset={seg.strokeDashoffset}
                    className="transition-all hover:stroke-width-12 cursor-pointer"
                    onMouseEnter={() => setActiveSegmentIndex(idx)}
                    onMouseLeave={() => setActiveSegmentIndex(null)}
                  />
                ))}
              </svg>

              <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  {activeSegmentIndex !== null ? 'Kategori Payı' : 'Toplam Dağılım'}
                </span>
                <span className="text-2xl font-black font-mono text-slate-900 dark:text-white">
                  {activeSegmentIndex !== null ? `%${categorySegments[activeSegmentIndex]?.percent || 0}` : '100%'}
                </span>
                <span className="text-[10px] text-purple-400 font-semibold truncate max-w-[120px]">
                  {activeSegmentIndex !== null ? categorySegments[activeSegmentIndex]?.name : `${categories.length} Kategori`}
                </span>
              </div>
            </div>

            {/* Legend List */}
            <div className="space-y-2 text-xs">
              {categorySegments.map((seg, idx) => (
                <div
                  key={seg.name}
                  onMouseEnter={() => setActiveSegmentIndex(idx)}
                  onMouseLeave={() => setActiveSegmentIndex(null)}
                  className={`flex items-center justify-between p-1.5 rounded-lg transition cursor-pointer ${
                    activeSegmentIndex === idx ? 'bg-slate-100 dark:bg-slate-800' : ''
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: seg.color }} />
                    <span className="font-semibold text-slate-700 dark:text-slate-300 truncate">{seg.name}</span>
                  </div>
                  <div className="flex items-center gap-2 font-mono font-bold text-slate-900 dark:text-white flex-shrink-0 ml-2">
                    <span className="text-[10px] text-slate-400">({seg.count} Ürün)</span>
                    <span>%{seg.percent}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* 4. BOTTOM ROW: REAL WEEKLY ACTIVITY & REAL TOP PERFORMERS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* WEEKLY ACTIVITY / GÜNLÜK SİPARİŞ YOĞUNLUĞU (5 Cols) */}
        <div className="lg:col-span-5 bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Haftalık Gerçek Sipariş Akışı
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Son 7 günün sipariş dağılımı</p>
              </div>
              <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-full">
                7 Gün
              </span>
            </div>

            <div className="mt-8 flex items-end justify-between gap-3 h-48 px-2">
              {weeklyActivity.map((item) => (
                <div key={item.date} className="flex-1 flex flex-col items-center gap-2 group cursor-pointer">
                  <span className="text-[9px] font-mono font-bold text-cyan-300 opacity-0 group-hover:opacity-100 transition whitespace-nowrap">
                    {item.count} Sipariş
                  </span>

                  <div className="w-full bg-slate-100 dark:bg-slate-800/80 rounded-t-xl overflow-hidden h-36 flex items-end p-0.5">
                    <div
                      style={{ height: `${item.height}%` }}
                      className="w-full rounded-t-lg bg-gradient-to-t from-purple-600 via-indigo-500 to-cyan-400 group-hover:from-purple-500 group-hover:to-cyan-300 transition-all duration-300 relative shadow-sm"
                    >
                      <div className="w-full h-1 bg-cyan-200 rounded-t-lg" />
                    </div>
                  </div>

                  <span className="text-[11px] font-bold text-slate-500 group-hover:text-white transition">
                    {item.day}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 mt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <span>Toplam 7 Günlük Sipariş: <strong className="text-cyan-400">{weeklyActivity.reduce((s, d) => s + d.count, 0)} Adet</strong></span>
            <span className="font-mono text-[11px]">{orders.length} Genel Sipariş</span>
          </div>
        </div>

        {/* TOP PERFORMERS / GERÇEK LİDERLER (7 Cols) */}
        <div className="lg:col-span-7 bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Lider Performans Sıralaması
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Sistem veritabanındaki gerçek ürün ve bayiler</p>
              </div>

              {/* Tab Switcher */}
              <div className="flex items-center p-0.5 bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-[11px] font-bold">
                <button
                  type="button"
                  onClick={() => setTopPerformerTab('products')}
                  className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                    topPerformerTab === 'products'
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'text-slate-500 hover:text-white'
                  }`}
                >
                  Ürünler ({products.length})
                </button>
                <button
                  type="button"
                  onClick={() => setTopPerformerTab('dealers')}
                  className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                    topPerformerTab === 'dealers'
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'text-slate-500 hover:text-white'
                  }`}
                >
                  Bayiler ({totalDealers})
                </button>
              </div>
            </div>

            {/* Content Table */}
            <div className="mt-4 overflow-x-auto">
              {topPerformerTab === 'products' ? (
                <table className="w-full text-left text-xs">
                  <thead className="text-slate-400 border-b border-slate-100 dark:border-slate-800 text-[11px]">
                    <tr>
                      <th className="py-2.5 px-2 font-bold">Ürün / SKU</th>
                      <th className="py-2.5 px-2 font-bold text-right">Birim Fiyat / Hacim</th>
                      <th className="py-2.5 px-2 font-bold text-center">Stok / Satış</th>
                      <th className="py-2.5 px-2 font-bold text-center">Durum</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {realTopProducts.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-6 text-center text-slate-500 text-xs">
                          Henüz ürün kaydı bulunmuyor.
                        </td>
                      </tr>
                    ) : (
                      realTopProducts.map((p, idx) => (
                        <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                          <td className="py-3 px-2">
                            <div className="flex items-center gap-2.5">
                              <span className="w-6 h-6 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center justify-center font-mono font-black text-xs">
                                #{idx + 1}
                              </span>
                              <div className="min-w-0">
                                <div className="font-bold text-slate-900 dark:text-white truncate max-w-[240px]">{p.name}</div>
                                <div className="text-[10px] text-slate-400 font-mono">{p.code} • {p.category}</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-2 text-right font-mono font-bold text-slate-900 dark:text-white">
                            {formatCurrency(p.revenue)}
                          </td>
                          <td className="py-3 px-2 text-center font-mono text-slate-600 dark:text-slate-300">
                            {p.qty} Adet
                          </td>
                          <td className="py-3 px-2 text-center">
                            <span className="text-[10px] font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-2 py-0.5 rounded-full">
                              {p.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              ) : (
                <table className="w-full text-left text-xs">
                  <thead className="text-slate-400 border-b border-slate-100 dark:border-slate-800 text-[11px]">
                    <tr>
                      <th className="py-2.5 px-2 font-bold">Bayi Ünvanı</th>
                      <th className="py-2.5 px-2 font-bold text-center">Sipariş</th>
                      <th className="py-2.5 px-2 font-bold text-right">Toplam Alım</th>
                      <th className="py-2.5 px-2 font-bold text-center">Durum</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {realTopDealers.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-6 text-center text-slate-500 text-xs">
                          Henüz kayıtlı bayi bulunmuyor.
                        </td>
                      </tr>
                    ) : (
                      realTopDealers.map((d, idx) => (
                        <tr key={d.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                          <td className="py-3 px-2">
                            <div className="flex items-center gap-2.5">
                              <span className="w-6 h-6 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20 flex items-center justify-center font-mono font-black text-xs">
                                #{idx + 1}
                              </span>
                              <div className="min-w-0">
                                <div className="font-bold text-slate-900 dark:text-white truncate max-w-[240px]">{d.name}</div>
                                <div className="text-[10px] text-slate-400">{d.city}</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-2 text-center font-mono font-bold text-slate-700 dark:text-slate-300">
                            {d.orders} Sipariş
                          </td>
                          <td className="py-3 px-2 text-right font-mono font-bold text-emerald-400">
                            {formatCurrency(d.revenue)}
                          </td>
                          <td className="py-3 px-2 text-center">
                            <span className="text-[10px] font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2 py-0.5 rounded-full">
                              {d.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
