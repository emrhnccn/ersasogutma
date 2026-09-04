'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  Package,
  Zap,
  FileSpreadsheet,
  ShoppingBag,
  ShoppingCart,
  FileText,
  CreditCard,
  Receipt,
  Calculator,
  Building2,
  ShieldCheck,
  Mail,
  Phone,
  MessageSquarePlus,
  StickyNote,
  Bell,
  ShieldAlert,
  ChevronDown,
  ChevronRight,
  Sparkles,
  Layers,
  FolderTree,
  Search,
  X,
  Snowflake,
  Sun,
  Moon
} from 'lucide-react';
import { useStore } from '@/context/StoreContext';

interface SidebarProps {
  isOpen: boolean;
  onClose?: () => void;
  onCloseAction?: () => void;
}

export function Sidebar({ isOpen, onClose, onCloseAction }: SidebarProps) {
  const handleClose = () => {
    if (onCloseAction) onCloseAction();
    if (onClose) onClose();
  };

  const pathname = usePathname();
  const { unreadCount, orders, profile, cart, quotes, theme, toggleTheme } = useStore();

  const [openSales, setOpenSales] = useState(true);
  const [openFinance, setOpenFinance] = useState(true);
  const [openSupport, setOpenSupport] = useState(true);
  const [openTools, setOpenTools] = useState(false);

  // Category flyout panel state
  const [isCategoryFlyoutOpen, setIsCategoryFlyoutOpen] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [categorySearch, setCategorySearch] = useState('');

  React.useEffect(() => {
    fetch('/api/categories')
      .then((res) => res.json())
      .then((res) => {
        if (res.success && Array.isArray(res.data)) {
          setCategories(res.data);
        }
      })
      .catch(() => {});
  }, []);

  const filteredCategories = categories.filter((c) =>
    c.name.toLowerCase().includes(categorySearch.toLowerCase())
  );

  const pendingOrdersCount = orders.filter((o) => o.status === 'bekliyor').length;
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const isActive = (path: string) => pathname === path || pathname === `/bayi${path}` || pathname.startsWith(`/bayi${path}/`);

  return (
    <>
      {/* Backdrop for Mobile */}
      {isOpen && (
        <div
          onClick={() => {
            handleClose();
            setIsCategoryFlyoutOpen(false);
          }}
          className="fixed inset-0 bg-slate-950/80 z-40 lg:hidden backdrop-blur-sm transition-opacity"
        />
      )}

      {/* Category Flyout Bar (Opens right next to Sidebar) */}
      {isCategoryFlyoutOpen && (
        <>
          {/* Backdrop for Flyout on Desktop if clicked outside */}
          <div
            onClick={() => setIsCategoryFlyoutOpen(false)}
            className="fixed inset-0 z-40 bg-slate-950/30 backdrop-blur-[2px]"
          />

          <aside className="fixed top-0 bottom-0 left-0 lg:left-72 z-50 w-72 bg-[#111827] border-r border-slate-800 shadow-2xl flex flex-col transition-all duration-200 animate-in slide-in-from-left-4">
            {/* Header */}
            <div className="p-3.5 border-b border-slate-800 bg-[#0D1424] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-blue-600/20 text-blue-400">
                  <FolderTree className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white">Kategoriler</h3>
                  <p className="text-[10px] text-slate-400 font-medium">Toplam {categories.length} kategori</p>
                </div>
              </div>
              <button
                onClick={() => setIsCategoryFlyoutOpen(false)}
                className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
                title="Kapat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Search Input */}
            <div className="p-2.5 border-b border-slate-800">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  placeholder="Kategori ara..."
                  value={categorySearch}
                  onChange={(e) => setCategorySearch(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* Scrollable Category List */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1 select-none scrollbar-thin scrollbar-thumb-slate-700">
              {/* All Categories Button */}
              <Link
                href="/bayi/urunler"
                onClick={() => {
                  setIsCategoryFlyoutOpen(false);
                  handleClose();
                }}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold bg-blue-600/20 text-blue-400 border border-blue-500/30 hover:bg-blue-600 hover:text-white transition"
              >
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Tüm Ürün Kataloğu</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>

              {filteredCategories.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-500">
                  Kategori bulunamadı.
                </div>
              ) : (
                filteredCategories.map((cat) => (
                  <Link
                    key={cat.id}
                    href={`/bayi/urunler?category=${encodeURIComponent(cat.name)}`}
                    onClick={() => {
                      setIsCategoryFlyoutOpen(false);
                      handleClose();
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs text-slate-300 hover:text-white hover:bg-slate-800/80 transition group border border-transparent hover:border-slate-800"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500 group-hover:scale-125 transition-transform" />
                      <span className="truncate font-medium">{cat.name}</span>
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {cat.discountPercent > 0 && (
                        <span className="text-[9px] font-bold bg-rose-500/20 text-rose-300 px-1.5 py-0.5 rounded border border-rose-500/30">
                          %{cat.discountPercent}
                        </span>
                      )}
                      {cat._count?.products !== undefined && (
                        <span className="text-[10px] font-mono text-slate-500 group-hover:text-blue-300">
                          {cat._count.products}
                        </span>
                      )}
                      <ChevronRight className="w-3 h-3 text-slate-600 group-hover:text-slate-300" />
                    </div>
                  </Link>
                ))
              )}
            </div>
          </aside>
        </>
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-72 bg-[#111827] border-r border-slate-800 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="p-4 border-b border-slate-800 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-xs">
            <Snowflake className="w-5 h-5 text-white" />
          </div>
          <div className="overflow-hidden flex-1">
            <div className="text-sm font-black text-white tracking-tight uppercase">
              ERSA SOĞUTMA
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-[10px] font-bold text-blue-400 bg-blue-500/10 px-1.5 py-0.2 rounded border border-blue-500/20">
                Bayi Portalı
              </span>
            </div>
          </div>
        </div>

        {/* Scrollable Categorized Navigation */}
        <div className="flex-1 overflow-y-auto py-3 px-3 space-y-4 text-xs select-none scrollbar-thin scrollbar-thumb-slate-800">
          
          {/* ========================================================= */}
          {/* GENEL */}
          {/* ========================================================= */}
          <div>
            <div className="px-3 py-1 text-[10px] uppercase font-bold tracking-wider text-slate-500">
              GENEL
            </div>
            <div className="mt-1 space-y-0.5">
              <Link
                href="/bayi"
                onClick={onClose}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-semibold transition ${
                  isActive('/')
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Home className="w-4 h-4" />
                <span>Genel Bakış</span>
              </Link>
            </div>
          </div>

          {/* ========================================================= */}
          {/* SATIŞ */}
          {/* ========================================================= */}
          <div>
            <div className="px-3 py-1 text-[10px] uppercase font-bold tracking-wider text-slate-500">
              SATIŞ
            </div>
            <div className="mt-1 space-y-0.5">
              <div className="flex items-center justify-between gap-1 group">
                <Link
                  href="/bayi/urunler"
                  onClick={onClose}
                  className={`flex-1 flex items-center gap-2.5 px-3 py-2 rounded-xl font-medium transition ${
                    isActive('/urunler')
                      ? 'bg-blue-600 text-white font-semibold shadow-xs'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Package className="w-4 h-4" />
                  <span>Ürün Kataloğu</span>
                </Link>
                <button
                  onClick={() => setIsCategoryFlyoutOpen(!isCategoryFlyoutOpen)}
                  title="Kategoriler Barını Aç"
                  className={`p-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                    isCategoryFlyoutOpen
                      ? 'bg-blue-600 text-white shadow'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <FolderTree className="w-3.5 h-3.5" />
                  <ChevronRight className={`w-3 h-3 transition-transform ${isCategoryFlyoutOpen ? 'rotate-180' : ''}`} />
                </button>
              </div>

              <Link
                href="/bayi/siparisler/hizli"
                onClick={onClose}
                className={`flex items-center justify-between px-3 py-2 rounded-xl font-medium transition ${
                  isActive('/siparisler/hizli')
                    ? 'bg-blue-600 text-white font-semibold shadow-xs'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Zap className="w-4 h-4" />
                  <span>Hızlı Sipariş</span>
                </div>
              </Link>

              <Link
                href="/bayi/siparisler/toplu-excel"
                onClick={onClose}
                className={`flex items-center justify-between px-3 py-2 rounded-xl font-medium transition ${
                  isActive('/siparisler/toplu-excel')
                    ? 'bg-blue-600 text-white font-semibold shadow-xs'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Excel Toplu Sipariş</span>
                </div>
              </Link>

              <Link
                href="/bayi/siparisler/sepet"
                onClick={onClose}
                className={`flex items-center justify-between px-3 py-2 rounded-xl font-medium transition ${
                  isActive('/siparisler/sepet')
                    ? 'bg-blue-600 text-white font-semibold shadow-xs'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <ShoppingCart className="w-4 h-4" />
                  <span>Sepet</span>
                </div>
                {cartItemCount > 0 && (
                  <span className="bg-blue-500/30 text-blue-300 font-mono font-bold text-[10px] px-2 py-0.5 rounded-full border border-blue-400/30">
                    {cartItemCount}
                  </span>
                )}
              </Link>

              <Link
                href="/bayi/siparisler"
                onClick={onClose}
                className={`flex items-center justify-between px-3 py-2 rounded-xl font-medium transition ${
                  isActive('/siparisler')
                    ? 'bg-blue-600 text-white font-semibold shadow-xs'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <ShoppingBag className="w-4 h-4" />
                  <span>Siparişlerim</span>
                </div>
                {pendingOrdersCount > 0 && (
                  <span className="bg-amber-500/20 text-amber-300 font-mono font-bold text-[10px] px-1.5 py-0.5 rounded">
                    {pendingOrdersCount}
                  </span>
                )}
              </Link>

              <Link
                href="/bayi/teklifler"
                onClick={onClose}
                className={`flex items-center justify-between px-3 py-2 rounded-xl font-medium transition ${
                  isActive('/teklifler')
                    ? 'bg-blue-600 text-white font-semibold shadow-xs'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <FileText className="w-4 h-4" />
                  <span>Tekliflerim</span>
                </div>
                {quotes.length > 0 && (
                  <span className="text-[10px] text-slate-400 font-mono">
                    {quotes.length}
                  </span>
                )}
              </Link>
            </div>
          </div>

          {/* ========================================================= */}
          {/* FİNANS */}
          {/* ========================================================= */}
          <div>
            <div className="px-3 py-1 text-[10px] uppercase font-bold tracking-wider text-slate-500">
              FİNANS
            </div>
            <div className="mt-1 space-y-0.5">
              <Link
                href="/bayi/cari"
                onClick={onClose}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-xl font-medium transition ${
                  isActive('/cari')
                    ? 'bg-blue-600 text-white font-semibold shadow-xs'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Receipt className="w-4 h-4" />
                <span>Cari Hesap & Ekstre</span>
              </Link>

              <Link
                href="/bayi/finans/online-odeme"
                onClick={onClose}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-xl font-medium transition ${
                  isActive('/finans/online-odeme')
                    ? 'bg-blue-600 text-white font-semibold shadow-xs'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <CreditCard className="w-4 h-4" />
                <span>Sanal POS ile Ödeme</span>
              </Link>

              <Link
                href="/bayi/finans/slipler"
                onClick={onClose}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-xl font-medium transition ${
                  isActive('/finans/slipler')
                    ? 'bg-blue-600 text-white font-semibold shadow-xs'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Receipt className="w-4 h-4" />
                <span>POS Slipleri</span>
              </Link>

              <Link
                href="/bayi/finans/valor-vade"
                onClick={onClose}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-xl font-medium transition ${
                  isActive('/finans/valor-vade')
                    ? 'bg-blue-600 text-white font-semibold shadow-xs'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Calculator className="w-4 h-4" />
                <span>Vade / Valör Analizi</span>
              </Link>

              <Link
                href="/bayi/iletisim/banka-hesaplari"
                onClick={onClose}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-xl font-medium transition ${
                  isActive('/iletisim/banka-hesaplari')
                    ? 'bg-blue-600 text-white font-semibold shadow-xs'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Building2 className="w-4 h-4" />
                <span>Banka Hesapları</span>
              </Link>
            </div>
          </div>

          {/* ========================================================= */}
          {/* DESTEK */}
          {/* ========================================================= */}
          <div>
            <div className="px-3 py-1 text-[10px] uppercase font-bold tracking-wider text-slate-500">
              DESTEK
            </div>
            <div className="mt-1 space-y-0.5">
              <Link
                href="/bayi/garanti"
                onClick={onClose}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-xl font-medium transition ${
                  isActive('/garanti')
                    ? 'bg-blue-600 text-white font-semibold shadow-xs'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Garanti Sorgula</span>
              </Link>

              <Link
                href="/bayi/iletisim/oneri-talep"
                onClick={onClose}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-xl font-medium transition ${
                  isActive('/iletisim/oneri-talep')
                    ? 'bg-blue-600 text-white font-semibold shadow-xs'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <MessageSquarePlus className="w-4 h-4" />
                <span>Talepler</span>
              </Link>

              <Link
                href="/bayi/iletisim/mesajlar"
                onClick={onClose}
                className={`flex items-center justify-between px-3 py-2 rounded-xl font-medium transition ${
                  isActive('/iletisim/mesajlar')
                    ? 'bg-blue-600 text-white font-semibold shadow-xs'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Mail className="w-4 h-4" />
                  <span>Departman Mesajları</span>
                </div>
                {unreadCount > 0 && (
                  <span className="bg-blue-500/30 text-blue-300 font-mono font-bold text-[10px] px-1.5 py-0.5 rounded-full border border-blue-400/30">
                    {unreadCount}
                  </span>
                )}
              </Link>

              <Link
                href="/bayi/iletisim/bize-ulasin"
                onClick={onClose}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-xl font-medium transition ${
                  isActive('/iletisim/bize-ulasin')
                    ? 'bg-blue-600 text-white font-semibold shadow-xs'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Phone className="w-4 h-4" />
                <span>İletişim</span>
              </Link>
            </div>
          </div>

          {/* ========================================================= */}
          {/* YÖNETİM */}
          {/* ========================================================= */}
          <div className="pt-2 border-t border-slate-800">
            <div className="px-3 py-1 text-[10px] uppercase font-bold tracking-wider text-slate-500">
              YÖNETİM
            </div>
            <div className="mt-1">
              <Link
                href="/admin"
                onClick={onClose}
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl font-bold transition ${
                  isActive('/admin')
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : 'text-slate-400 hover:text-amber-300 hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <ShieldAlert className="w-4 h-4 text-amber-400" />
                  <span>Yönetici Portalı</span>
                </div>
                <span className="text-[9px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded font-mono font-bold">
                  ADMIN
                </span>
              </Link>
            </div>
          </div>

        </div>

        {/* Dealer Mini Profile Footer Box */}
        <div className="p-3 border-t border-slate-800 bg-[#0B1120] flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-xs font-bold text-blue-400 flex-shrink-0">
              {profile.companyName ? profile.companyName.substring(0, 2).toUpperCase() : 'ES'}
            </div>
            <div className="truncate">
              <div className="text-xs font-bold text-white truncate">{profile.companyName}</div>
              <div className="text-[10px] text-slate-400 font-mono">Bayi • {profile.dealerCode}</div>
            </div>
          </div>
          
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={toggleTheme}
              className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-amber-400 border border-slate-700/60 transition"
              title={theme === 'dark' ? 'Açık Temaya Geç' : 'Karanlık Temaya Geç'}
              aria-label="Temayı Değiştir"
            >
              {theme === 'dark' ? (
                <Sun className="w-3.5 h-3.5 text-amber-400 animate-in spin-in-180 duration-300" />
              ) : (
                <Moon className="w-3.5 h-3.5 text-slate-400 animate-in spin-in-180 duration-300" />
              )}
            </button>
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400" title="Sistem Aktif" />
          </div>
        </div>
      </aside>
    </>
  );
}
