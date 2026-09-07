'use client';

import React, { useState, useMemo } from 'react';
import { formatCurrency } from '@/lib/utils';
import {
  TrendingUp,
  DollarSign,
  Users,
  ShoppingBag,
  Activity,
  Layers,
  ChevronDown,
  Sparkles,
  Calendar,
  Building2,
  Package,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Search,
  Download,
  Edit,
  Filter,
  CheckCircle2,
  Check
} from 'lucide-react';

interface AdminAnalyticsProps {
  orders?: any[];
  dealersCount?: number;
  productsCount?: number;
  categoriesCount?: number;
  className?: string;
}

export const AdminAnalyticsDashboard: React.FC<AdminAnalyticsProps> = ({
  orders = [],
  dealersCount = 12,
  productsCount = 180,
  categoriesCount = 48,
  className = ''
}) => {
  // Mode switcher: NexaCore (Image 2) vs NovaPulse (Image 3)
  const [dashboardStyle, setDashboardStyle] = useState<'nexacore' | 'novapulse'>('nexacore');
  const [dateRange, setDateRange] = useState<'month' | 'quarter' | 'year'>('month');
  const [activeChartMilestone, setActiveChartMilestone] = useState<number>(4); // default Sep/current
  const [activeSegmentIndex, setActiveSegmentIndex] = useState<number | null>(null);
  const [topPerformerTab, setTopPerformerTab] = useState<'products' | 'dealers'>('products');
  const [novaSearchQuery, setNovaSearchQuery] = useState('');
  const [novaStatusFilter, setNovaStatusFilter] = useState('ALL');

  // Compute real totals from orders
  const totalRevenue = useMemo(() => {
    return orders.reduce((sum, o) => sum + (Number(o.grandTotal) || 0), 0) || 348510.8;
  }, [orders]);

  const activeOrdersCount = useMemo(() => {
    return orders.filter((o) => o.status === 'PENDING_APPROVAL' || o.status === 'SHIPPED' || o.status === 'PREPARING').length || 7;
  }, [orders]);

  // Monthly Revenue Trend Data (NexaCore Style)
  const monthlyData = useMemo(() => [
    { month: 'Mayıs', short: 'May', revenue: 142000, orders: 11, x: 50, y: 130 },
    { month: 'Haziran', short: 'Haz', revenue: 185500, orders: 14, x: 150, y: 110 },
    { month: 'Temmuz', short: 'Tem', revenue: 160200, orders: 12, x: 250, y: 120 },
    { month: 'Ağustos', short: 'Ağu', revenue: 215400, orders: 17, x: 350, y: 95 },
    { month: 'Eylül', short: 'Eyl', revenue: 248510.8, orders: 21, x: 450, y: 70 },
    { month: 'Ekim (Tahmin)', short: 'Eki', revenue: 290000, orders: 25, x: 550, y: 50 }
  ], []);

  // Category Distribution (Donut Chart Data for NexaCore)
  const categorySegments = useMemo(() => [
    { name: 'Soğutma Kompresörleri', percent: 35, count: 182, color: '#06B6D4' },
    { name: 'Soğutma Gazları & Kimya', percent: 30, count: 156, color: '#8B5CF6' },
    { name: 'Klimalar & Isı Pompası', percent: 20, count: 104, color: '#EC4899' },
    { name: 'Yedek Parça & Valfler', percent: 15, count: 78, color: '#3B82F6' }
  ], []);

  // Weekly Activity (Daily Bar Chart for NexaCore)
  const weeklyActivity = useMemo(() => [
    { day: 'Pzt', height: 65, count: 18, amount: '₺42.500' },
    { day: 'Sal', height: 80, count: 24, amount: '₺58.200' },
    { day: 'Çar', height: 45, count: 12, amount: '₺28.400' },
    { day: 'Per', height: 95, count: 29, amount: '₺71.300' },
    { day: 'Cum', height: 85, count: 26, amount: '₺64.000' },
    { day: 'Cmt', height: 40, count: 9, amount: '₺21.100' },
    { day: 'Paz', height: 25, count: 5, amount: '₺11.800' }
  ], []);

  // Top Products List (NexaCore)
  const topProducts = useMemo(() => [
    { id: '1', name: 'Embraco Aspera NEK6214GK Kompresör', code: 'EMB-6214', category: 'Kompresör', revenue: 84500, growth: '+14.2%', status: 'Lider' },
    { id: '2', name: 'R410A Soğutucu Gaz Tüp 11.3 KG', code: 'GAZ-R410A', category: 'Soğutma Gazı', revenue: 62400, growth: '+9.8%', status: 'Büyüme' },
    { id: '3', name: 'Danfoss DCL 163 Filtre Kurutucu', code: 'DNF-DCL163', category: 'Yedek Parça', revenue: 41200, growth: '+5.4%', status: 'Yüksek Talep' },
    { id: '4', name: 'Copeland Scroll ZB21KCE Kompresör', code: 'CPL-ZB21', category: 'Kompresör', revenue: 38900, growth: '+12.1%', status: 'Büyüme' }
  ], []);

  // Top Dealers List (NexaCore)
  const topDealers = useMemo(() => [
    { id: '1', name: 'Akdeniz Soğutma Sistemleri Ltd.', city: 'Antalya', orders: 18, revenue: 112450, growth: '+18.5%', status: 'Platin Bayi' },
    { id: '2', name: 'Marmara İklimlendirme A.Ş.', city: 'İstanbul', orders: 14, revenue: 94800, growth: '+11.2%', status: 'Altın Bayi' },
    { id: '3', name: 'Ege Teknik Soğutma & Servis', city: 'İzmir', orders: 11, revenue: 67200, growth: '+8.4%', status: 'Altın Bayi' },
    { id: '4', name: 'Başkent Endüstriyel Soğutma', city: 'Ankara', orders: 9, revenue: 53100, growth: '+6.9%', status: 'Gümüş Bayi' }
  ], []);

  // NovaPulse Customer Segments (Image 3)
  const customerSegmentsNova = useMemo(() => [
    { name: 'Sadık / Tekrar Eden Bayiler', percent: 45, color: '#06B6D4' },
    { name: 'Yeni Bayi Kayıtları', percent: 30, color: '#10B981' },
    { name: 'Kurumsal Taahhüt Projeleri', percent: 15, color: '#F59E0B' },
    { name: 'Standart / Serbest Alıcılar', percent: 10, color: '#8B5CF6' }
  ], []);

  // NovaPulse Recent Orders (Image 3)
  const novaPulseOrders = useMemo(() => [
    { id: '1', customer: 'Ronald Richards', email: 'ronaldr@email.com', product: 'Embraco NEK6214GK Kompresör', orderId: '#74508320', date: '5 dk önce', status: 'PAID', amount: 12408.20 },
    { id: '2', customer: 'Darrell Steward', email: 'darrells@email.com', product: 'R410A Soğutucu Gaz Tüp 11.3 KG', orderId: '#23348355', date: '10 dk önce', status: 'PENDING', amount: 201.50 },
    { id: '3', customer: 'Marvin McKinney', email: 'marvinm@email.com', product: 'Danfoss DCL 163 Filtre Kurutucu', orderId: '#54948137', date: '15 dk önce', status: 'SHIPPED', amount: 2856.03 },
    { id: '4', customer: 'Brooklyn Simmons', email: 'brooklyn@email.com', product: 'Copeland Scroll ZB21 Kompresör', orderId: '#84129402', date: '22 dk önce', status: 'PAID', amount: 9240.00 }
  ], []);

  const activeMilestone = monthlyData[activeChartMilestone] || monthlyData[4];

  return (
    <div className={`space-y-6 ${className}`}>
      
      {/* 1. TOP HEADER WITH STYLE SWITCHER (IMAGE 2 vs IMAGE 3) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 dark:bg-[#0c1222] border border-slate-800 p-5 rounded-3xl backdrop-blur-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-cyan-400 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Gelişmiş Yönetici Analitik Paneli</span>
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-0.5">
            {dashboardStyle === 'nexacore' ? 'NexaCore B2B Operasyon Paneli' : 'NovaPulse Yönetici & Müşteri Akışı'}
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {dashboardStyle === 'nexacore' 
              ? 'Ciro büyüme trendleri, kategori hacimleri ve haftalık sipariş frekansı (Görsel 2 Stili)' 
              : 'Canlı sipariş akışı, bayi segmentleri ve dinamik kazanç eğrisi (Görsel 3 Stili)'}
          </p>
        </div>

        {/* Action Controls: Style Switcher & Period Selector */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Style Switcher Toggle */}
          <div className="flex items-center p-1 bg-[#111827] border border-slate-800 rounded-2xl text-xs font-bold shadow-inner">
            <button
              type="button"
              onClick={() => setDashboardStyle('nexacore')}
              className={`px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
                dashboardStyle === 'nexacore'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30 font-black'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>NexaCore (Görsel 2)</span>
            </button>
            <button
              type="button"
              onClick={() => setDashboardStyle('novapulse')}
              className={`px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
                dashboardStyle === 'novapulse'
                  ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30 font-black'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>NovaPulse (Görsel 3)</span>
            </button>
          </div>

          {/* Period Selector Filter */}
          <div className="flex items-center p-1 bg-[#111827] border border-slate-800 rounded-2xl text-xs font-semibold">
            <button
              type="button"
              onClick={() => setDateRange('month')}
              className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${
                dateRange === 'month'
                  ? 'bg-slate-800 text-white shadow-xs font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Son 30 Gün
            </button>
            <button
              type="button"
              onClick={() => setDateRange('quarter')}
              className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${
                dateRange === 'quarter'
                  ? 'bg-slate-800 text-white shadow-xs font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Son 3 Ay
            </button>
            <button
              type="button"
              onClick={() => setDateRange('year')}
              className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${
                dateRange === 'year'
                  ? 'bg-slate-800 text-white shadow-xs font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Yıllık
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. STYLE A: NEXACORE DASHBOARD (EXACT IMAGE 2 REPLICA)                   */}
      {/* ========================================================================= */}
      {dashboardStyle === 'nexacore' && (
        <div className="space-y-6 animate-in fade-in-50 duration-300">
          {/* Top 4 KPI Cards with Sparkline Waves */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Card 1: Toplam Ciro */}
            <div className="bg-[#111827] border border-slate-800 rounded-2xl p-5 shadow-xl relative overflow-hidden group hover:border-purple-500/40 transition flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Toplam Ciro (Total Revenue)
                  </span>
                  <div className="text-2xl font-black font-mono text-white mt-1 tracking-tight">
                    {formatCurrency(totalRevenue)}
                  </div>
                </div>
                <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                  <ArrowUpRight className="w-3 h-3" />
                  <span>+14.8%</span>
                </span>
              </div>

              {/* SVG Wave Sparkline */}
              <div className="mt-4 pt-2">
                <svg className="w-full h-10 overflow-visible" viewBox="0 0 160 40">
                  <defs>
                    <linearGradient id="waveGrad1" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#8B5CF6" />
                      <stop offset="100%" stopColor="#06B6D4" />
                    </linearGradient>
                  </defs>
                  <path
                    d="M0,32 Q25,8 50,22 T100,12 T160,5"
                    fill="none"
                    stroke="url(#waveGrad1)"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
            </div>

            {/* Card 2: Aktif Bayiler */}
            <div className="bg-[#111827] border border-slate-800 rounded-2xl p-5 shadow-xl relative overflow-hidden group hover:border-sky-500/40 transition flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Kayıtlı & Aktif Bayiler
                  </span>
                  <div className="text-2xl font-black font-mono text-white mt-1 tracking-tight">
                    {dealersCount} Bayi
                  </div>
                </div>
                <span className="text-[10px] font-mono font-bold text-sky-400 bg-sky-500/10 border border-sky-500/20 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                  <ArrowUpRight className="w-3 h-3" />
                  <span>+8.2%</span>
                </span>
              </div>

              <div className="mt-4 pt-2">
                <svg className="w-full h-10 overflow-visible" viewBox="0 0 160 40">
                  <path
                    d="M0,28 Q30,35 60,15 T120,22 T160,8"
                    fill="none"
                    stroke="#06B6D4"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
            </div>

            {/* Card 3: Sipariş Teslim Oranı */}
            <div className="bg-[#111827] border border-slate-800 rounded-2xl p-5 shadow-xl relative overflow-hidden group hover:border-purple-500/40 transition flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Sipariş Teslim Oranı
                  </span>
                  <div className="text-2xl font-black font-mono text-white mt-1 tracking-tight">
                    %94.6
                  </div>
                </div>
                <span className="text-[10px] font-mono font-bold text-purple-400 bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                  <ArrowUpRight className="w-3 h-3" />
                  <span>+3.8%</span>
                </span>
              </div>

              <div className="mt-4 pt-2">
                <svg className="w-full h-10 overflow-visible" viewBox="0 0 160 40">
                  <path
                    d="M0,22 Q35,38 70,18 T130,26 T160,10"
                    fill="none"
                    stroke="#8B5CF6"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
            </div>

            {/* Card 4: Aktif Sevkiyat & Mini Barlar */}
            <div className="bg-[#111827] border border-slate-800 rounded-2xl p-5 shadow-xl relative overflow-hidden group hover:border-amber-500/40 transition flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Aktif Sevkiyat & İşlem
                  </span>
                  <div className="text-2xl font-black font-mono text-white mt-1 tracking-tight">
                    {activeOrdersCount} Sipariş
                  </div>
                </div>
                <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
                  Hızlı İşlem
                </span>
              </div>

              <div className="mt-4 pt-2 flex items-end justify-between gap-1.5 h-10 px-1">
                {[40, 65, 80, 50, 75, 95, 60, 85, 100, 70].map((h, i) => (
                  <div
                    key={i}
                    style={{ height: `${h}%` }}
                    className="w-2 rounded-t-sm bg-gradient-to-t from-purple-600 to-cyan-400 opacity-80 group-hover:opacity-100 transition"
                  />
                ))}
              </div>
            </div>

          </div>

          {/* Center Row: Bezier Area Curve & Category Donut */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Revenue Growth Bezier Area Chart */}
            <div className="lg:col-span-8 bg-[#111827] border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden flex flex-col justify-between">
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-4">
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <span>Ciro Büyüme Trendi (Revenue Growth)</span>
                      <span className="text-[10px] font-mono font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2 py-0.5 rounded-full">
                        Aylık Ciro
                      </span>
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Noktaların üzerine gelerek ilgili ayın ciro ve sipariş detayını inceleyin.
                    </p>
                  </div>

                  {/* Tooltip Badge */}
                  <div className="bg-slate-900 border border-purple-500/40 rounded-xl px-3 py-1.5 shadow-lg flex items-center gap-2.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse shadow-md shadow-cyan-400/50" />
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

                {/* Glowing Bezier Area SVG */}
                <div className="mt-6 relative h-64 sm:h-72 w-full">
                  <svg className="w-full h-full overflow-visible" viewBox="0 0 600 200" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.45" />
                        <stop offset="60%" stopColor="#06B6D4" stopOpacity="0.15" />
                        <stop offset="100%" stopColor="#06B6D4" stopOpacity="0" />
                      </linearGradient>

                      <linearGradient id="curveGradient" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#A855F7" />
                        <stop offset="50%" stopColor="#8B5CF6" />
                        <stop offset="100%" stopColor="#06B6D4" />
                      </linearGradient>

                      <filter id="neonCurveGlow" x="-20%" y="-20%" width="140%" height="140%">
                        <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#8B5CF6" floodOpacity="0.7" />
                      </filter>
                    </defs>

                    {[40, 80, 120, 160].map((y) => (
                      <line
                        key={y}
                        x1="30"
                        y1={y}
                        x2="570"
                        y2={y}
                        stroke="currentColor"
                        className="text-slate-800"
                        strokeDasharray="4 4"
                        strokeWidth="1"
                      />
                    ))}

                    <path
                      d="M50,130 C100,115 120,110 150,110 C180,110 220,125 250,120 C280,115 320,100 350,95 C380,90 420,75 450,70 C480,65 520,55 550,50 L550,180 L50,180 Z"
                      fill="url(#areaGradient)"
                    />

                    <path
                      d="M50,130 C100,115 120,110 150,110 C180,110 220,125 250,120 C280,115 320,100 350,95 C380,90 420,75 450,70 C480,65 520,55 550,50"
                      fill="none"
                      stroke="url(#curveGradient)"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      filter="url(#neonCurveGlow)"
                    />

                    <path
                      d="M50,150 C110,135 140,140 180,130 C220,120 280,145 320,135 C360,125 410,115 450,105 C490,95 520,80 550,75"
                      fill="none"
                      stroke="#F59E0B"
                      strokeWidth="1.5"
                      strokeDasharray="3 3"
                      strokeOpacity="0.6"
                    />

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
                            <circle
                              cx={item.x}
                              cy={item.y}
                              r="12"
                              fill="#06B6D4"
                              fillOpacity="0.25"
                              className="animate-ping"
                            />
                          )}

                          {isSelected && (
                            <line
                              x1={item.x}
                              y1={item.y}
                              x2={item.x}
                              y2="180"
                              stroke="#06B6D4"
                              strokeWidth="1.5"
                              strokeDasharray="2 2"
                            />
                          )}

                          <circle
                            cx={item.x}
                            cy={item.y}
                            r={isSelected ? 6 : 4}
                            fill={isSelected ? '#38BDF8' : '#8B5CF6'}
                            stroke="#0F172A"
                            strokeWidth="2.5"
                            className="transition-all"
                          />
                        </g>
                      );
                    })}
                  </svg>
                </div>

                <div className="flex items-center justify-between px-6 pt-2 text-xs font-mono font-bold text-slate-400">
                  {monthlyData.map((m, idx) => (
                    <button
                      key={m.month}
                      type="button"
                      onClick={() => setActiveChartMilestone(idx)}
                      className={`transition cursor-pointer ${
                        idx === activeChartMilestone
                          ? 'text-cyan-400 font-bold underline'
                          : 'hover:text-white'
                      }`}
                    >
                      {m.short}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Donut Chart: Kategori Dağılımı */}
            <div className="lg:col-span-4 bg-[#111827] border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col justify-between">
              <div>
                <div className="border-b border-slate-800 pb-3">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <span>Katalog & Kategori Dağılımı</span>
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Siparişlerin kategorilere göre oransal kırılımı
                  </p>
                </div>

                <div className="my-6 relative flex items-center justify-center">
                  <svg className="w-48 h-48 transform -rotate-90" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="transparent"
                      stroke="#06B6D4"
                      strokeWidth="11"
                      strokeDasharray="87.9 163.3"
                      strokeDashoffset="0"
                      className="transition-all hover:stroke-width-12 cursor-pointer"
                      onMouseEnter={() => setActiveSegmentIndex(0)}
                      onMouseLeave={() => setActiveSegmentIndex(null)}
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="transparent"
                      stroke="#8B5CF6"
                      strokeWidth="11"
                      strokeDasharray="75.3 175.9"
                      strokeDashoffset="-87.9"
                      className="transition-all hover:stroke-width-12 cursor-pointer"
                      onMouseEnter={() => setActiveSegmentIndex(1)}
                      onMouseLeave={() => setActiveSegmentIndex(null)}
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="transparent"
                      stroke="#EC4899"
                      strokeWidth="11"
                      strokeDasharray="50.2 201"
                      strokeDashoffset="-163.2"
                      className="transition-all hover:stroke-width-12 cursor-pointer"
                      onMouseEnter={() => setActiveSegmentIndex(2)}
                      onMouseLeave={() => setActiveSegmentIndex(null)}
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="transparent"
                      stroke="#3B82F6"
                      strokeWidth="11"
                      strokeDasharray="37.7 213.5"
                      strokeDashoffset="-213.4"
                      className="transition-all hover:stroke-width-12 cursor-pointer"
                      onMouseEnter={() => setActiveSegmentIndex(3)}
                      onMouseLeave={() => setActiveSegmentIndex(null)}
                    />
                  </svg>

                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      {activeSegmentIndex !== null ? 'Kategori Payı' : 'Toplam Dağılım'}
                    </span>
                    <span className="text-2xl font-black font-mono text-white">
                      {activeSegmentIndex !== null ? `%${categorySegments[activeSegmentIndex].percent}` : '100%'}
                    </span>
                    <span className="text-[10px] text-purple-400 font-semibold">
                      {activeSegmentIndex !== null ? categorySegments[activeSegmentIndex].name.split(' ')[0] : `${categoriesCount} Kategori`}
                    </span>
                  </div>
                </div>

                <div className="space-y-2 text-xs">
                  {categorySegments.map((seg, idx) => (
                    <div
                      key={seg.name}
                      onMouseEnter={() => setActiveSegmentIndex(idx)}
                      onMouseLeave={() => setActiveSegmentIndex(null)}
                      className={`flex items-center justify-between p-1.5 rounded-lg transition cursor-pointer ${
                        activeSegmentIndex === idx ? 'bg-slate-800' : ''
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: seg.color }} />
                        <span className="font-semibold text-slate-300 truncate">{seg.name}</span>
                      </div>
                      <span className="font-mono font-bold text-white flex-shrink-0 ml-2">
                        %{seg.percent}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>

          {/* Bottom Row: Weekly Bars & Top Performers */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Weekly Activity */}
            <div className="lg:col-span-5 bg-[#111827] border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <span>Haftalık Sipariş Aktivitesi</span>
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">Günlük B2B sipariş akış sıklığı</p>
                  </div>
                  <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-full">
                    7 Gün
                  </span>
                </div>

                <div className="mt-8 flex items-end justify-between gap-3 h-48 px-2">
                  {weeklyActivity.map((item) => (
                    <div key={item.day} className="flex-1 flex flex-col items-center gap-2 group cursor-pointer">
                      <span className="text-[9px] font-mono font-bold text-cyan-300 opacity-0 group-hover:opacity-100 transition whitespace-nowrap">
                        {item.count} Adet
                      </span>

                      <div className="w-full bg-slate-800/80 rounded-t-xl overflow-hidden h-36 flex items-end p-0.5">
                        <div
                          style={{ height: `${item.height}%` }}
                          className="w-full rounded-t-lg bg-gradient-to-t from-purple-600 via-indigo-500 to-cyan-400 group-hover:from-purple-500 group-hover:to-cyan-300 transition-all duration-500 relative shadow-lg shadow-cyan-500/20"
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

              <div className="pt-4 mt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                <span>En yoğun gün: <strong className="text-cyan-400">Perşembe (29 Sipariş)</strong></span>
                <span className="font-mono text-[11px]">Toplam 119 Sipariş/Hafta</span>
              </div>
            </div>

            {/* Top Performers */}
            <div className="lg:col-span-7 bg-[#111827] border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col justify-between">
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                  <div>
                    <h3 className="text-base font-bold text-white">
                      Lider Performans Sıralaması (Top Performers)
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">En yüksek ciro üreten ürün ve bayiler</p>
                  </div>

                  <div className="flex items-center p-0.5 bg-slate-900 rounded-xl border border-slate-800 text-[11px] font-bold">
                    <button
                      type="button"
                      onClick={() => setTopPerformerTab('products')}
                      className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                        topPerformerTab === 'products'
                          ? 'bg-purple-600 text-white shadow-xs'
                          : 'text-slate-500 hover:text-white'
                      }`}
                    >
                      Çok Satan Ürünler
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
                      Lider Bayiler
                    </button>
                  </div>
                </div>

                <div className="mt-4 overflow-x-auto">
                  {topPerformerTab === 'products' ? (
                    <table className="w-full text-left text-xs">
                      <thead className="text-slate-400 border-b border-slate-800 text-[11px]">
                        <tr>
                          <th className="py-2.5 px-2 font-bold">Ürün / SKU</th>
                          <th className="py-2.5 px-2 font-bold text-right">Toplam Hacim</th>
                          <th className="py-2.5 px-2 font-bold text-right">Büyüme</th>
                          <th className="py-2.5 px-2 font-bold text-center">Durum</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {topProducts.map((p, idx) => (
                          <tr key={p.id} className="hover:bg-slate-800/40 transition">
                            <td className="py-3 px-2">
                              <div className="flex items-center gap-2.5">
                                <span className="w-6 h-6 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center justify-center font-mono font-black text-xs">
                                  #{idx + 1}
                                </span>
                                <div className="min-w-0">
                                  <div className="font-bold text-white truncate max-w-[240px]">{p.name}</div>
                                  <div className="text-[10px] text-slate-400 font-mono">{p.code} • {p.category}</div>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-2 text-right font-mono font-bold text-white">
                              {formatCurrency(p.revenue)}
                            </td>
                            <td className="py-3 px-2 text-right font-mono font-bold text-emerald-400">
                              {p.growth}
                            </td>
                            <td className="py-3 px-2 text-center">
                              <span className="text-[10px] font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-2 py-0.5 rounded-full">
                                {p.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <table className="w-full text-left text-xs">
                      <thead className="text-slate-400 border-b border-slate-800 text-[11px]">
                        <tr>
                          <th className="py-2.5 px-2 font-bold">Bayi Ünvanı / Şehir</th>
                          <th className="py-2.5 px-2 font-bold text-center">Sipariş</th>
                          <th className="py-2.5 px-2 font-bold text-right">Toplam Alım</th>
                          <th className="py-2.5 px-2 font-bold text-center">Seviye</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {topDealers.map((d, idx) => (
                          <tr key={d.id} className="hover:bg-slate-800/40 transition">
                            <td className="py-3 px-2">
                              <div className="flex items-center gap-2.5">
                                <span className="w-6 h-6 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20 flex items-center justify-center font-mono font-black text-xs">
                                  #{idx + 1}
                                </span>
                                <div className="min-w-0">
                                  <div className="font-bold text-white truncate max-w-[240px]">{d.name}</div>
                                  <div className="text-[10px] text-slate-400">{d.city}</div>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-2 text-center font-mono font-bold text-slate-300">
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
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. STYLE B: NOVAPULSE DASHBOARD (EXACT IMAGE 3 REPLICA)                   */}
      {/* ========================================================================= */}
      {dashboardStyle === 'novapulse' && (
        <div className="space-y-6 animate-in fade-in-50 duration-300">
          
          {/* NovaPulse Welcome Header */}
          <div className="border-b border-slate-800 pb-4">
            <h3 className="text-2xl font-black text-white flex items-center gap-2 tracking-tight">
              <span>İyi Akşamlar, Yönetici</span>
              <span>👋</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Bugünkü B2B operasyon ve müşteri performansınızın canlı dökümü.
            </p>
          </div>

          {/* NovaPulse Top Row: 4 Clean Minimal Glowing Border KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Card 1: Total Revenue (Glowing Cyan Highlight Border as in Image 3) */}
            <div className="bg-[#0f172a]/90 border-2 border-cyan-500/70 shadow-lg shadow-cyan-500/10 rounded-2xl p-5 relative overflow-hidden flex flex-col justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-300">
                  Toplam Ciro (Total Revenue)
                </span>
                <div className="text-3xl font-black font-mono text-white mt-2 tracking-tight">
                  {formatCurrency(totalRevenue)}
                </div>
              </div>
              <div className="mt-4 flex items-center gap-1 text-xs font-mono font-bold text-cyan-400">
                <ArrowUpRight className="w-3.5 h-3.5" />
                <span>+12.3% bu ay</span>
              </div>
            </div>

            {/* Card 2: Active Users */}
            <div className="bg-[#0f172a]/90 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between hover:border-slate-700 transition">
              <div>
                <span className="text-xs font-semibold text-slate-400">
                  Aktif Bayiler (Active Users)
                </span>
                <div className="text-3xl font-black font-mono text-white mt-2 tracking-tight">
                  {dealersCount.toLocaleString('tr-TR')} Bayi
                </div>
              </div>
              <div className="mt-4 flex items-center gap-1 text-xs font-mono font-bold text-emerald-400">
                <ArrowUpRight className="w-3.5 h-3.5" />
                <span>+8.7% büyüme</span>
              </div>
            </div>

            {/* Card 3: Conversion Rate */}
            <div className="bg-[#0f172a]/90 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between hover:border-slate-700 transition">
              <div>
                <span className="text-xs font-semibold text-slate-400">
                  Dönüşüm / Teslim (Conversion Rate)
                </span>
                <div className="text-3xl font-black font-mono text-white mt-2 tracking-tight">
                  4.26%
                </div>
              </div>
              <div className="mt-4 flex items-center gap-1 text-xs font-mono font-bold text-emerald-400">
                <ArrowUpRight className="w-3.5 h-3.5" />
                <span>+0.8% geçen haftadan</span>
              </div>
            </div>

            {/* Card 4: Growth Rate */}
            <div className="bg-[#0f172a]/90 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between hover:border-slate-700 transition">
              <div>
                <span className="text-xs font-semibold text-slate-400">
                  Genel Büyüme (Growth Rate)
                </span>
                <div className="text-3xl font-black font-mono text-white mt-2 tracking-tight">
                  23.4%
                </div>
              </div>
              <div className="mt-4 flex items-center gap-1 text-xs font-mono font-bold text-cyan-400">
                <span className="bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded text-[10px]">Q1'den beri en yüksek</span>
              </div>
            </div>

          </div>

          {/* NovaPulse Center Row: Monthly Earnings Flow & Customer Segments */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Monthly Earnings Flow (Cyan Wave Flow) */}
            <div className="lg:col-span-8 bg-[#0f172a]/90 border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div>
                    <h4 className="text-base font-bold text-white flex items-center gap-2">
                      <span>Aylık Kazanç & Ciro Akışı (Monthly Earnings Flow)</span>
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">Yıl içi sipariş ve nakit akış eğrisi</p>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-slate-400" />
                </div>

                {/* SVG Glowing Curve Chart */}
                <div className="mt-6 relative h-64 w-full">
                  <svg className="w-full h-full overflow-visible" viewBox="0 0 600 200" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="novaCyanGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#06B6D4" stopOpacity="0.45" />
                        <stop offset="100%" stopColor="#06B6D4" stopOpacity="0.0" />
                      </linearGradient>
                      <filter id="novaCyanGlow" x="-20%" y="-20%" width="140%" height="140%">
                        <feDropShadow dx="0" dy="0" stdDeviation="5" floodColor="#06B6D4" floodOpacity="0.8" />
                      </filter>
                    </defs>

                    {/* Dotted Grid Lines */}
                    {[40, 80, 120, 160].map((y) => (
                      <line
                        key={y}
                        x1="20"
                        y1={y}
                        x2="580"
                        y2={y}
                        stroke="rgba(255, 255, 255, 0.05)"
                        strokeDasharray="3 3"
                        strokeWidth="1"
                      />
                    ))}

                    {/* Secondary Amber Wave (Image 3 Upper line) */}
                    <path
                      d="M20,130 C80,100 150,70 230,90 C310,110 380,60 460,85 C520,105 560,40 580,30"
                      fill="none"
                      stroke="#F59E0B"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />

                    {/* Main Area Fill (Cyan) */}
                    <path
                      d="M20,165 C80,155 140,140 200,120 C260,95 320,135 380,110 C440,85 500,140 550,115 C565,105 575,95 580,85 L580,195 L20,195 Z"
                      fill="url(#novaCyanGrad)"
                    />

                    {/* Main Cyan Glowing Curve */}
                    <path
                      d="M20,165 C80,155 140,140 200,120 C260,95 320,135 380,110 C440,85 500,140 550,115 C565,105 575,95 580,85"
                      fill="none"
                      stroke="#06B6D4"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      filter="url(#novaCyanGlow)"
                    />

                    {/* Pinpoint Indicator (Image 3 Replica: October 2025: $51,567) */}
                    <g transform="translate(380, 110)">
                      <circle cx="0" cy="0" r="5" fill="#38BDF8" stroke="#0B1120" strokeWidth="2" />
                      <line x1="0" y1="0" x2="0" y2="85" stroke="#38BDF8" strokeWidth="1" strokeDasharray="2 2" />
                      {/* Tooltip Box */}
                      <rect x="-65" y="-45" width="130" height="36" rx="8" fill="#111827" stroke="#38BDF8" strokeWidth="1" />
                      <text x="0" y="-30" textAnchor="middle" fill="#94A3B8" fontSize="9" fontWeight="bold">Ekim 2026</text>
                      <text x="0" y="-16" textAnchor="middle" fill="#38BDF8" fontSize="11" fontWeight="bold" fontFamily="monospace">₺248.510,80</text>
                    </g>
                  </svg>
                </div>

                {/* Months labels */}
                <div className="flex items-center justify-between px-4 pt-3 text-[11px] font-mono text-slate-500 font-bold">
                  {['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'].map((m) => (
                    <span key={m} className={m === 'Eki' ? 'text-cyan-400 font-black' : ''}>{m}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* Customer Segments (Donut Ring from Image 3) */}
            <div className="lg:col-span-4 bg-[#0f172a]/90 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div>
                    <h4 className="text-base font-bold text-white">Müşteri Segmentleri (Customer Segments)</h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">Bayi portföyü dağılımı</p>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-slate-400" />
                </div>

                <div className="my-6 relative flex items-center justify-center">
                  <svg className="w-44 h-44 transform -rotate-90" viewBox="0 0 100 100">
                    {/* Ring Segments: 45%, 30%, 15%, 10% */}
                    <circle
                      cx="50"
                      cy="50"
                      r="38"
                      fill="transparent"
                      stroke="#06B6D4"
                      strokeWidth="12"
                      strokeDasharray="107.4 131.3"
                      strokeDashoffset="0"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="38"
                      fill="transparent"
                      stroke="#10B981"
                      strokeWidth="12"
                      strokeDasharray="71.6 167.1"
                      strokeDashoffset="-107.4"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="38"
                      fill="transparent"
                      stroke="#F59E0B"
                      strokeWidth="12"
                      strokeDasharray="35.8 202.9"
                      strokeDashoffset="-179"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="38"
                      fill="transparent"
                      stroke="#8B5CF6"
                      strokeWidth="12"
                      strokeDasharray="23.9 214.8"
                      strokeDashoffset="-214.8"
                    />
                  </svg>

                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Toplam</span>
                    <span className="text-xl font-black font-mono text-white">100%</span>
                  </div>
                </div>

                <div className="space-y-2 text-xs">
                  {customerSegmentsNova.map((seg) => (
                    <div key={seg.name} className="flex items-center justify-between p-1.5 rounded-lg">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: seg.color }} />
                        <span className="font-semibold text-slate-300 truncate">{seg.name}</span>
                      </div>
                      <span className="font-mono font-bold text-white flex-shrink-0 ml-2">
                        %{seg.percent}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>

          {/* NovaPulse Bottom Section: Recent Customer Orders Table */}
          <div className="bg-[#0f172a]/90 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <h4 className="text-base font-bold text-white">Son Müşteri & Bayi Siparişleri (Recent Customer Orders)</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">Canlı sipariş durumları ve ödeme onayları</p>
              </div>

              {/* Action Toolbar (Search, Date, Status, Download) */}
              <div className="flex items-center gap-2.5 flex-wrap">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Search..."
                    value={novaSearchQuery}
                    onChange={(e) => setNovaSearchQuery(e.target.value)}
                    className="bg-[#111827] border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 w-36 sm:w-44"
                  />
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    className="px-3 py-1.5 bg-[#111827] border border-slate-800 rounded-xl text-xs text-slate-300 hover:text-white flex items-center gap-1 font-medium"
                  >
                    <span>Date</span>
                    <ChevronDown className="w-3 h-3" />
                  </button>

                  <button
                    type="button"
                    className="px-3 py-1.5 bg-[#111827] border border-slate-800 rounded-xl text-xs text-slate-300 hover:text-white flex items-center gap-1 font-medium"
                  >
                    <span>Status</span>
                    <ChevronDown className="w-3 h-3" />
                  </button>

                  <button
                    type="button"
                    className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow transition flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download</span>
                  </button>

                  <button
                    type="button"
                    className="px-3 py-1.5 bg-[#111827] border border-slate-800 rounded-xl text-xs text-slate-300 hover:text-white flex items-center gap-1 font-medium"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="text-slate-400 border-b border-slate-800 text-[11px]">
                  <tr>
                    <th className="py-2.5 px-3 font-bold">Customer</th>
                    <th className="py-2.5 px-3 font-bold">Email</th>
                    <th className="py-2.5 px-3 font-bold">Product</th>
                    <th className="py-2.5 px-3 font-bold font-mono">Order ID</th>
                    <th className="py-2.5 px-3 font-bold">Date</th>
                    <th className="py-2.5 px-3 font-bold text-center">Status</th>
                    <th className="py-2.5 px-3 font-bold text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {novaPulseOrders.map((o) => (
                    <tr key={o.id} className="hover:bg-slate-800/30 transition">
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-slate-300 text-[11px]">
                            {o.customer.charAt(0)}
                          </div>
                          <span className="font-bold text-white">{o.customer}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-slate-400">{o.email}</td>
                      <td className="py-3 px-3 text-slate-200 font-medium">{o.product}</td>
                      <td className="py-3 px-3 font-mono text-slate-400">{o.orderId}</td>
                      <td className="py-3 px-3 text-slate-400">{o.date}</td>
                      <td className="py-3 px-3 text-center">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          o.status === 'PAID'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : o.status === 'PENDING'
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                            : 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30'
                        }`}>
                          <span className="w-1.5 h-1.5 rounded-full bg-current" />
                          <span>{o.status === 'PAID' ? 'Paid' : o.status === 'PENDING' ? 'Pending' : 'Shipped'}</span>
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-white">
                        {formatCurrency(o.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

    </div>
  );
};
