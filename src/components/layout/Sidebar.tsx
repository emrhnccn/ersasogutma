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
  Sparkles
} from 'lucide-react';
import { useStore } from '@/context/StoreContext';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { unreadCount, orders, profile, cart, quotes } = useStore();

  const [openSales, setOpenSales] = useState(true);
  const [openFinance, setOpenFinance] = useState(true);
  const [openSupport, setOpenSupport] = useState(true);
  const [openTools, setOpenTools] = useState(false);

  const pendingOrdersCount = orders.filter((o) => o.status === 'bekliyor').length;
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const isActive = (path: string) => pathname === path;

  return (
    <>
      {/* Backdrop for Mobile */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/80 z-40 lg:hidden backdrop-blur-sm transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-[33px] bottom-0 left-0 z-40 w-72 bg-slate-900 border-r border-slate-800 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Dealer Mini Profile Box */}
        <div className="p-4 border-b border-slate-800/80 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-600 to-sky-800 flex items-center justify-center text-white font-black text-sm shadow-md shadow-sky-600/30">
              ES
            </div>
            <div className="overflow-hidden flex-1">
              <div className="text-xs font-black text-white truncate">{profile.companyName}</div>
              <div className="text-[10px] text-slate-400 font-mono mt-0.5">{profile.dealerCode}</div>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="text-[10px] text-emerald-400 font-bold">
                  {profile.tier} Bayi (%{profile.discountRate * 100})
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Scrollable Categorized Navigation */}
        <div className="flex-1 overflow-y-auto py-3 px-3 space-y-4 text-xs select-none scrollbar-thin scrollbar-thumb-slate-700">
          
          {/* Anasayfa / Dashboard */}
          <Link
            href="/bayi"
            onClick={onClose}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-bold transition ${
              isActive('/')
                ? 'bg-sky-600 text-white shadow-lg shadow-sky-600/30'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
            }`}
          >
            <Home className="w-4 h-4 text-sky-400" />
            <span>Genel Bakış (ERP)</span>
          </Link>

          {/* ========================================================= */}
          {/* 1. SATIŞ GRUBU */}
          {/* ========================================================= */}
          <div>
            <button
              onClick={() => setOpenSales(!openSales)}
              className="w-full flex items-center justify-between px-3 py-1.5 text-[10px] uppercase font-black tracking-wider text-slate-400 hover:text-white transition"
            >
              <span>🛒 Satış & Sipariş</span>
              {openSales ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            </button>

            {openSales && (
              <div className="mt-1 space-y-0.5">
                <Link
                  href="/bayi/urunler"
                  onClick={onClose}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-lg font-medium transition ${
                    isActive('/urunler')
                      ? 'bg-sky-500/20 text-sky-300 font-bold border-l-2 border-sky-400'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Package className="w-4 h-4 text-sky-400" />
                  <span>Ürün Kataloğu</span>
                </Link>

                <Link
                  href="/bayi/siparisler/hizli"
                  onClick={onClose}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg font-medium transition ${
                    isActive('/siparisler/hizli')
                      ? 'bg-amber-500/20 text-amber-300 font-bold border-l-2 border-amber-400'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Zap className="w-4 h-4 text-amber-400" />
                    <span>Hızlı Sipariş (SKU)</span>
                  </div>
                  <span className="text-[9px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded font-mono font-bold">
                    ENTER
                  </span>
                </Link>

                <Link
                  href="/bayi/siparisler/toplu-excel"
                  onClick={onClose}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg font-medium transition ${
                    isActive('/siparisler/toplu-excel')
                      ? 'bg-emerald-500/20 text-emerald-300 font-bold border-l-2 border-emerald-400'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                    <span>Excel Toplu Sipariş</span>
                  </div>
                  <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-mono font-bold">
                    XLSX
                  </span>
                </Link>

                <Link
                  href="/bayi/siparisler/sepet"
                  onClick={onClose}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg font-medium transition ${
                    isActive('/siparisler/sepet')
                      ? 'bg-sky-500/20 text-sky-300 font-bold border-l-2 border-sky-400'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <ShoppingCart className="w-4 h-4 text-cyan-400" />
                    <span>Sepetim</span>
                  </div>
                  {cartItemCount > 0 && (
                    <span className="bg-sky-500 text-white font-mono font-bold text-[10px] px-2 py-0.5 rounded-full">
                      {cartItemCount}
                    </span>
                  )}
                </Link>

                <Link
                  href="/bayi/siparisler"
                  onClick={onClose}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg font-medium transition ${
                    isActive('/siparisler')
                      ? 'bg-sky-500/20 text-sky-300 font-bold border-l-2 border-sky-400'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <ShoppingBag className="w-4 h-4 text-sky-400" />
                    <span>Siparişlerim</span>
                  </div>
                  {pendingOrdersCount > 0 && (
                    <span className="bg-amber-500/20 text-amber-400 font-mono font-bold text-[10px] px-1.5 py-0.5 rounded">
                      {pendingOrdersCount}
                    </span>
                  )}
                </Link>

                <Link
                  href="/bayi/teklifler"
                  onClick={onClose}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg font-medium transition ${
                    isActive('/teklifler')
                      ? 'bg-purple-500/20 text-purple-300 font-bold border-l-2 border-purple-400'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <FileText className="w-4 h-4 text-purple-400" />
                    <span>Tekliflerim</span>
                  </div>
                  {quotes.length > 0 && (
                    <span className="text-[10px] text-purple-300 font-mono">
                      {quotes.length}
                    </span>
                  )}
                </Link>
              </div>
            )}
          </div>

          {/* ========================================================= */}
          {/* 2. FİNANS GRUBU */}
          {/* ========================================================= */}
          <div>
            <button
              onClick={() => setOpenFinance(!openFinance)}
              className="w-full flex items-center justify-between px-3 py-1.5 text-[10px] uppercase font-black tracking-wider text-slate-400 hover:text-white transition"
            >
              <span>💳 Finans & Cari</span>
              {openFinance ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            </button>

            {openFinance && (
              <div className="mt-1 space-y-0.5">
                <Link
                  href="/bayi/cari"
                  onClick={onClose}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-lg font-medium transition ${
                    isActive('/cari')
                      ? 'bg-emerald-500/20 text-emerald-300 font-bold border-l-2 border-emerald-400'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Receipt className="w-4 h-4 text-emerald-400" />
                  <span>Cari Hesap & Ekstre</span>
                </Link>

                <Link
                  href="/bayi/finans/online-odeme"
                  onClick={onClose}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-lg font-medium transition ${
                    isActive('/finans/online-odeme')
                      ? 'bg-sky-500/20 text-sky-300 font-bold border-l-2 border-sky-400'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <CreditCard className="w-4 h-4 text-sky-400" />
                  <span>Sanal POS ile Ödeme</span>
                </Link>

                <Link
                  href="/bayi/finans/slipler"
                  onClick={onClose}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-lg font-medium transition ${
                    isActive('/finans/slipler')
                      ? 'bg-slate-800 text-white font-bold'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Receipt className="w-4 h-4 text-slate-400" />
                  <span>POS Slipleri</span>
                </Link>

                <Link
                  href="/bayi/finans/valor-vade"
                  onClick={onClose}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-lg font-medium transition ${
                    isActive('/finans/valor-vade')
                      ? 'bg-amber-500/20 text-amber-300 font-bold border-l-2 border-amber-400'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Calculator className="w-4 h-4 text-amber-400" />
                  <span>Vade / Valör Analizi</span>
                </Link>

                <Link
                  href="/bayi/iletisim/banka-hesaplari"
                  onClick={onClose}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-lg font-medium transition ${
                    isActive('/iletisim/banka-hesaplari')
                      ? 'bg-slate-800 text-white font-bold'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Building2 className="w-4 h-4 text-slate-400" />
                  <span>Banka Hesapları</span>
                </Link>
              </div>
            )}
          </div>

          {/* ========================================================= */}
          {/* 3. DESTEK GRUBU */}
          {/* ========================================================= */}
          <div>
            <button
              onClick={() => setOpenSupport(!openSupport)}
              className="w-full flex items-center justify-between px-3 py-1.5 text-[10px] uppercase font-black tracking-wider text-slate-400 hover:text-white transition"
            >
              <span>🛡️ Destek & Servis</span>
              {openSupport ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            </button>

            {openSupport && (
              <div className="mt-1 space-y-0.5">
                <Link
                  href="/bayi/garanti"
                  onClick={onClose}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-lg font-medium transition ${
                    isActive('/garanti')
                      ? 'bg-sky-500/20 text-sky-300 font-bold border-l-2 border-sky-400'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4 text-sky-400" />
                  <span>Garanti Sorgula & Talep</span>
                </Link>

                <Link
                  href="/bayi/iletisim/mesajlar"
                  onClick={onClose}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg font-medium transition ${
                    isActive('/iletisim/mesajlar')
                      ? 'bg-sky-500/20 text-sky-300 font-bold border-l-2 border-sky-400'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Mail className="w-4 h-4 text-sky-400" />
                    <span>Departman Mesajları</span>
                  </div>
                  {unreadCount > 0 && (
                    <span className="bg-sky-500 text-white font-mono font-bold text-[10px] px-1.5 py-0.5 rounded-full">
                      {unreadCount}
                    </span>
                  )}
                </Link>

                <Link
                  href="/bayi/iletisim/bize-ulasin"
                  onClick={onClose}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-lg font-medium transition ${
                    isActive('/iletisim/bize-ulasin')
                      ? 'bg-slate-800 text-white font-bold'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Phone className="w-4 h-4 text-slate-400" />
                  <span>İletişim & Lokasyon</span>
                </Link>

                <Link
                  href="/bayi/iletisim/oneri-talep"
                  onClick={onClose}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-lg font-medium transition ${
                    isActive('/iletisim/oneri-talep')
                      ? 'bg-slate-800 text-white font-bold'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <MessageSquarePlus className="w-4 h-4 text-slate-400" />
                  <span>Öneri & Talep Formu</span>
                </Link>
              </div>
            )}
          </div>

          {/* ========================================================= */}
          {/* 4. ARAÇLAR GRUBU */}
          {/* ========================================================= */}
          <div>
            <button
              onClick={() => setOpenTools(!openTools)}
              className="w-full flex items-center justify-between px-3 py-1.5 text-[10px] uppercase font-black tracking-wider text-slate-400 hover:text-white transition"
            >
              <span>🔧 Araçlar</span>
              {openTools ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            </button>

            {openTools && (
              <div className="mt-1 space-y-0.5">
                <Link
                  href="/bayi/notlar"
                  onClick={onClose}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-lg font-medium transition ${
                    isActive('/notlar')
                      ? 'bg-slate-800 text-white font-bold'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <StickyNote className="w-4 h-4 text-amber-400" />
                  <span>Notlar & Görevler</span>
                </Link>

                <Link
                  href="/bayi/hatirlatmalar"
                  onClick={onClose}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-lg font-medium transition ${
                    isActive('/hatirlatmalar')
                      ? 'bg-slate-800 text-white font-bold'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Bell className="w-4 h-4 text-purple-400" />
                  <span>Hatırlatmalar</span>
                </Link>
              </div>
            )}
          </div>

          {/* ========================================================= */}
          {/* 5. YÖNETİCİ GİRİŞİ */}
          {/* ========================================================= */}
          <div className="pt-2 border-t border-slate-800/80">
            <Link
              href="/admin"
              onClick={onClose}
              className={`flex items-center justify-between px-3 py-2.5 rounded-xl font-bold transition ${
                isActive('/admin')
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'text-slate-400 hover:text-amber-300 hover:bg-slate-800/80'
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

        {/* Footer info */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/40 text-[10px] text-slate-500 flex items-center justify-between">
          <span>ERSA B2B v2.4</span>
          <span className="font-mono text-slate-400">bayi.ersasogutma.com.tr</span>
        </div>
      </aside>
    </>
  );
}
