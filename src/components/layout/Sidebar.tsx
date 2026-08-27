'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  Package,
  Layers,
  ShoppingBag,
  CreditCard,
  Calculator,
  ShieldCheck,
  Building2,
  Mail,
  Phone,
  MessageSquarePlus,
  FileText,
  Lock,
  RotateCcw,
  StickyNote,
  Bell,
  ChevronDown,
  ChevronRight,
  ShieldAlert,
  HelpCircle,
  Truck,
  Clock,
  Receipt
} from 'lucide-react';
import { useStore } from '@/context/StoreContext';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { unreadCount, orders, profile, isAdminView, setIsAdminView } = useStore();

  // Accordion submenus
  const [openProducts, setOpenProducts] = useState(true);
  const [openOrders, setOpenOrders] = useState(pathname.startsWith('/siparisler'));
  const [openPayment, setOpenPayment] = useState(pathname.startsWith('/finans/online-odeme') || pathname.startsWith('/finans/slipler'));
  const [openLegal, setOpenLegal] = useState(false);

  const pendingOrdersCount = orders.filter((o) => o.status === 'bekliyor').length;
  const inTransitCount = orders.filter((o) => o.status === 'sevkiyatta' || o.status === 'parcali').length;

  const isActive = (path: string) => pathname === path;

  return (
    <>
      {/* Backdrop for Mobile */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/70 z-40 lg:hidden backdrop-blur-sm transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-[33px] bottom-0 left-0 z-40 w-72 bg-slate-900 border-r border-slate-800 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Dealer Mini Profile Box */}
        <div className="p-4 border-b border-slate-800/80 bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-sky-700 flex items-center justify-center text-white font-black text-sm shadow-md shadow-sky-600/30">
              ES
            </div>
            <div className="overflow-hidden">
              <div className="text-xs font-black text-white truncate">{profile.companyName}</div>
              <div className="text-[11px] text-slate-400">Son Giriş: {profile.lastLogin}</div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-[10px] text-emerald-400 font-semibold">{profile.tier} Bayi Aktif</span>
              </div>
            </div>
          </div>
        </div>

        {/* Scrollable Navigation Menu */}
        <div className="flex-1 overflow-y-auto py-3 px-3 space-y-1 text-xs select-none scrollbar-thin scrollbar-thumb-slate-700">
          
          {/* Anasayfa */}
          <Link
            href="/"
            onClick={onClose}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition ${
              isActive('/')
                ? 'bg-sky-600 text-white font-bold shadow-lg shadow-sky-600/30'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Home className="w-4 h-4 text-sky-400" />
            <span>Anasayfa</span>
          </Link>

          {/* Ürünler Menu (Accordion) */}
          <div>
            <button
              onClick={() => setOpenProducts(!openProducts)}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition font-medium"
            >
              <div className="flex items-center gap-3">
                <Package className="w-4 h-4 text-cyan-400" />
                <span>Ürünler</span>
              </div>
              {openProducts ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            </button>

            {openProducts && (
              <div className="pl-9 pr-2 py-1 space-y-1">
                <Link
                  href="/urunler"
                  onClick={onClose}
                  className={`block px-3 py-2 rounded-lg transition ${
                    isActive('/urunler')
                      ? 'bg-sky-500/20 text-sky-300 font-bold border-l-2 border-sky-400'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  Ürün Kataloğu
                </Link>
                <Link
                  href="/urunler/toplu"
                  onClick={onClose}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg transition ${
                    isActive('/urunler/toplu')
                      ? 'bg-emerald-500/20 text-emerald-300 font-bold border-l-2 border-emerald-400'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <span>Toplu Liste (Hızlı Sipariş)</span>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded font-bold">
                    Hızlı
                  </span>
                </Link>
              </div>
            )}
          </div>

          {/* Siparişler Menu (Accordion) */}
          <div>
            <button
              onClick={() => setOpenOrders(!openOrders)}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition font-medium"
            >
              <div className="flex items-center gap-3">
                <ShoppingBag className="w-4 h-4 text-amber-400" />
                <span>Siparişler</span>
              </div>
              <div className="flex items-center gap-1.5">
                {pendingOrdersCount > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold text-[10px]">
                    {pendingOrdersCount}
                  </span>
                )}
                {openOrders ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
              </div>
            </button>

            {openOrders && (
              <div className="pl-9 pr-2 py-1 space-y-1">
                <Link
                  href="/siparisler"
                  onClick={onClose}
                  className={`block px-3 py-2 rounded-lg transition ${
                    isActive('/siparisler')
                      ? 'bg-sky-500/20 text-sky-300 font-bold border-l-2 border-sky-400'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  Tüm Siparişler
                </Link>
                <Link
                  href="/siparisler/sepet"
                  onClick={onClose}
                  className={`block px-3 py-2 rounded-lg transition ${
                    isActive('/siparisler/sepet')
                      ? 'bg-sky-500/20 text-sky-300 font-bold border-l-2 border-sky-400'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  Sepetim
                </Link>
                <Link
                  href="/siparisler/bekleyen"
                  onClick={onClose}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg transition ${
                    isActive('/siparisler/bekleyen')
                      ? 'bg-sky-500/20 text-sky-300 font-bold border-l-2 border-sky-400'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <span>Bekleyen Siparişler</span>
                  {pendingOrdersCount > 0 && (
                    <span className="text-[10px] bg-amber-500 text-slate-950 font-bold px-1.5 rounded-full">
                      {pendingOrdersCount}
                    </span>
                  )}
                </Link>
                <Link
                  href="/siparisler/yoldaki"
                  onClick={onClose}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg transition ${
                    isActive('/siparisler/yoldaki')
                      ? 'bg-sky-500/20 text-sky-300 font-bold border-l-2 border-sky-400'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <span>Yoldaki / Parçalı</span>
                  {inTransitCount > 0 && (
                    <span className="text-[10px] bg-sky-500 text-white font-bold px-1.5 rounded-full">
                      {inTransitCount}
                    </span>
                  )}
                </Link>
              </div>
            )}
          </div>

          {/* Cari Hareketler */}
          <Link
            href="/cari"
            onClick={onClose}
            className={`flex items-center justify-between px-3 py-2.5 rounded-xl font-medium transition ${
              isActive('/cari')
                ? 'bg-sky-600 text-white font-bold shadow-lg shadow-sky-600/30'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <div className="flex items-center gap-3">
              <Layers className="w-4 h-4 text-emerald-400" />
              <span>Cari Hareketler & Ekstre</span>
            </div>
            <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.5 rounded font-mono">
              26.233 TL (A)
            </span>
          </Link>

          {/* Online Ödeme / Sanal POS (Accordion) */}
          <div>
            <button
              onClick={() => setOpenPayment(!openPayment)}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition font-medium"
            >
              <div className="flex items-center gap-3">
                <CreditCard className="w-4 h-4 text-indigo-400" />
                <span>Online Ödeme (POS)</span>
              </div>
              {openPayment ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            </button>

            {openPayment && (
              <div className="pl-9 pr-2 py-1 space-y-1">
                <Link
                  href="/finans/online-odeme"
                  onClick={onClose}
                  className={`block px-3 py-2 rounded-lg transition ${
                    isActive('/finans/online-odeme')
                      ? 'bg-sky-500/20 text-sky-300 font-bold border-l-2 border-sky-400'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  Kredi Kartı ile Ödeme
                </Link>
                <Link
                  href="/finans/slipler"
                  onClick={onClose}
                  className={`block px-3 py-2 rounded-lg transition ${
                    isActive('/finans/slipler')
                      ? 'bg-sky-500/20 text-sky-300 font-bold border-l-2 border-sky-400'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  Kredi Kartı Slipleri & Dekont
                </Link>
              </div>
            )}
          </div>

          {/* Ortalama Vade & Valör Hesapla */}
          <Link
            href="/finans/valor-vade"
            onClick={onClose}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition ${
              isActive('/finans/valor-vade')
                ? 'bg-sky-600 text-white font-bold shadow-lg shadow-sky-600/30'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Calculator className="w-4 h-4 text-rose-400" />
            <span>Ortalama Vade & Valör Hesapla</span>
          </Link>

          {/* Garanti Sorgula */}
          <Link
            href="/garanti"
            onClick={onClose}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition ${
              isActive('/garanti')
                ? 'bg-sky-600 text-white font-bold shadow-lg shadow-sky-600/30'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Garanti & Seri No Sorgula</span>
          </Link>

          {/* Mesajlar */}
          <Link
            href="/iletisim/mesajlar"
            onClick={onClose}
            className={`flex items-center justify-between px-3 py-2.5 rounded-xl font-medium transition ${
              isActive('/iletisim/mesajlar')
                ? 'bg-sky-600 text-white font-bold shadow-lg shadow-sky-600/30'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <div className="flex items-center gap-3">
              <Mail className="w-4 h-4 text-sky-400" />
              <span>Mesajlar</span>
            </div>
            {unreadCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-rose-500 text-white font-bold text-[10px]">
                {unreadCount}
              </span>
            )}
          </Link>

          {/* Banka Hesap Bilgileri */}
          <Link
            href="/iletisim/banka-hesaplari"
            onClick={onClose}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition ${
              isActive('/iletisim/banka-hesaplari')
                ? 'bg-sky-600 text-white font-bold shadow-lg shadow-sky-600/30'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Building2 className="w-4 h-4 text-amber-400" />
            <span>Banka Hesap Bilgileri</span>
          </Link>

          {/* İletişim Bilgileri */}
          <Link
            href="/iletisim/bize-ulasin"
            onClick={onClose}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition ${
              isActive('/iletisim/bize-ulasin')
                ? 'bg-sky-600 text-white font-bold shadow-lg shadow-sky-600/30'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Phone className="w-4 h-4 text-green-400" />
            <span>İletişim Bilgileri</span>
          </Link>

          {/* Öneri / İstek / Şikayet */}
          <Link
            href="/iletisim/oneri-talep"
            onClick={onClose}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition ${
              isActive('/iletisim/oneri-talep')
                ? 'bg-sky-600 text-white font-bold shadow-lg shadow-sky-600/30'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <MessageSquarePlus className="w-4 h-4 text-purple-400" />
            <span>Öneri / İstek / Şikayet</span>
          </Link>

          {/* Notlar & Hatırlatmalar */}
          <div className="pt-2 border-t border-slate-800/80">
            <div className="px-3 py-1 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Kişisel Bayi Araçları
            </div>

            <Link
              href="/notlar"
              onClick={onClose}
              className={`flex items-center gap-3 px-3 py-2 rounded-xl font-medium transition ${
                isActive('/notlar')
                  ? 'bg-sky-600 text-white font-bold shadow-md shadow-sky-600/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <StickyNote className="w-4 h-4 text-yellow-400" />
              <span>Notlarım</span>
            </Link>

            <Link
              href="/hatirlatmalar"
              onClick={onClose}
              className={`flex items-center gap-3 px-3 py-2 rounded-xl font-medium transition ${
                isActive('/hatirlatmalar')
                  ? 'bg-sky-600 text-white font-bold shadow-md shadow-sky-600/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Bell className="w-4 h-4 text-cyan-400" />
              <span>Hatırlatmalar</span>
            </Link>
          </div>

          {/* Kurumsal Bilgiler / Sözleşmeler (Accordion) */}
          <div className="pt-2 border-t border-slate-800/80">
            <button
              onClick={() => setOpenLegal(!openLegal)}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60 transition"
            >
              <span className="text-[11px] font-semibold text-slate-400">Sözleşmeler & Şartlar</span>
              {openLegal ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            </button>

            {openLegal && (
              <div className="pl-6 pr-2 py-1 space-y-1 text-[11px]">
                <Link
                  href="/kurumsal/sozlesme"
                  onClick={onClose}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded text-slate-400 hover:text-white hover:bg-slate-800/50"
                >
                  <FileText className="w-3.5 h-3.5 text-slate-500" />
                  <span>Hizmet Sözleşmesi</span>
                </Link>
                <Link
                  href="/kurumsal/gizlilik"
                  onClick={onClose}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded text-slate-400 hover:text-white hover:bg-slate-800/50"
                >
                  <Lock className="w-3.5 h-3.5 text-slate-500" />
                  <span>Güvenlik ve Gizlilik</span>
                </Link>
                <Link
                  href="/kurumsal/iade"
                  onClick={onClose}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded text-slate-400 hover:text-white hover:bg-slate-800/50"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                  <span>İade Şartları & Prosedürü</span>
                </Link>
              </div>
            )}
          </div>

          {/* Admin Panel Switcher */}
          <div className="pt-3 pb-6">
            <button
              onClick={() => {
                setIsAdminView(!isAdminView);
                onClose();
              }}
              className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-amber-500/40 text-amber-400 font-semibold text-xs transition"
            >
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              <span>{isAdminView ? '← Bayi Portalı Görünümü' : 'Ersa Yönetici Paneli →'}</span>
            </button>
          </div>

        </div>

        {/* Footer info */}
        <div className="p-3 border-t border-slate-800 text-[11px] text-slate-500 bg-slate-950/60 text-center">
          <div>Copyright © 2026 Ersa Soğutma Ltd.</div>
          <div className="text-[10px] text-slate-600">ersasogutma.com.tr • V2.4</div>
        </div>
      </aside>
    </>
  );
}
