'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useStore } from '@/context/StoreContext';
import { logoutAction } from '@/lib/actions';
import {
  Search,
  ShoppingCart,
  Star,
  Mail,
  Bell,
  User,
  ShieldAlert,
  Snowflake,
  LogOut,
  ChevronDown,
  Menu,
  X,
  FileSpreadsheet,
  CheckCircle,
  Clock,
  AlertTriangle,
  Layers,
  ArrowRight
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { Currency } from '@/types';

interface HeaderProps {
  onToggleSidebar?: () => void;
  isSidebarOpen?: boolean;
}

export function Header({ onToggleSidebar }: HeaderProps) {
  const router = useRouter();
  const {
    products,
    cart,
    cartTotals,
    favorites,
    unreadCount,
    messages,
    profile,
    isAdminView,
    setIsAdminView,
    currency,
    setCurrency,
    notifications,
    markNotificationRead,
    markAllNotificationsRead,
    unreadNotificationCount
  } = useStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMessagesDropdown, setShowMessagesDropdown] = useState(false);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);

  // Search filter across name, code, brand, barcode
  const searchFiltered = searchQuery.trim() === ''
    ? []
    : products
        .filter(
          (p) =>
            p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (p.barcode && p.barcode.toLowerCase().includes(searchQuery.toLowerCase()))
        )
        .slice(0, 6);

  const handleSelectProduct = (code: string) => {
    setSearchQuery('');
    setShowSearchResults(false);
    router.push(`/bayi/urunler?q=${encodeURIComponent(code)}`);
  };

  return (
    <header className="bg-white text-slate-800 sticky top-0 z-30 shadow-xs border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-between gap-4">
        
        {/* Left: Mobile Toggle & Brand Logo */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="lg:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus:outline-none transition"
            aria-label="Menüyü Aç/Kapat"
          >
            <Menu className="w-5 h-5" />
          </button>

          <Link href="/bayi" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center shadow-xs group-hover:bg-blue-700 transition">
              <Snowflake className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-base font-black tracking-tight text-slate-900 uppercase">
                  ERSA <span className="text-blue-600">SOĞUTMA</span>
                </span>
                <span className="text-[9px] font-bold bg-blue-50 text-blue-700 border border-blue-200 px-1.5 py-0.2 rounded-md">
                  BAYİ PORTALI
                </span>
              </div>
              <span className="text-[10px] text-slate-500 block -mt-0.5 font-medium font-mono">
                bayi.ersasogutma.com.tr
              </span>
            </div>
          </Link>
        </div>

        {/* Center: Global Instant Search */}
        <div className="hidden md:flex flex-1 max-w-lg relative">
          <div className="relative w-full">
            <input
              type="text"
              placeholder="Ürün adı, parça kodu (SKU) veya marka ara..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSearchResults(true);
              }}
              onFocus={() => setShowSearchResults(true)}
              className="w-full bg-slate-50 text-slate-900 placeholder-slate-400 text-xs rounded-xl pl-9 pr-9 py-2 border border-slate-200 focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none transition"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Autocomplete Results Dropdown */}
          {showSearchResults && searchFiltered.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden z-50">
              <div className="p-2.5 border-b border-slate-100 text-[10px] font-bold text-slate-500 uppercase tracking-wider flex justify-between bg-slate-50">
                <span>Eşleşen Ürünler ({searchFiltered.length})</span>
                <span className="text-blue-600 font-semibold">Hızlı Seçim</span>
              </div>
              <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
                {searchFiltered.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => handleSelectProduct(p.code)}
                    className="p-2.5 hover:bg-slate-50 cursor-pointer flex items-center justify-between gap-3 transition"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={p.image}
                        alt={p.name}
                        className="w-9 h-9 object-cover rounded-lg border border-slate-200 bg-white p-0.5"
                      />
                      <div>
                        <div className="text-xs font-bold text-slate-800 line-clamp-1">{p.name}</div>
                        <div className="text-[10px] text-slate-500 flex items-center gap-2 mt-0.5">
                          <span className="font-mono text-blue-600 font-semibold">{p.code}</span>
                          <span>•</span>
                          <span>{p.brand}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-bold text-emerald-600 font-mono">
                        {formatCurrency(p.priceTRY * (1 - profile.discountRate))}
                      </div>
                      <div className="text-[9px] text-slate-400 line-through">
                        {formatCurrency(p.priceTRY)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-2.5 bg-slate-50 border-t border-slate-100 text-center">
                <Link
                  href={`/bayi/urunler?q=${encodeURIComponent(searchQuery)}`}
                  onClick={() => setShowSearchResults(false)}
                  className="text-xs text-blue-600 hover:text-blue-700 font-bold"
                >
                  Tüm sonuçları katalogda gör →
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Right: Actions, Currency, Notifications & Profile */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          
          {/* Notifications Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setShowNotifDropdown(!showNotifDropdown);
                setShowMessagesDropdown(false);
              }}
              className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 relative transition"
              title="Sistem Bildirimleri"
            >
              <Bell className="w-4 h-4" />
              {unreadNotificationCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                  {unreadNotificationCount}
                </span>
              )}
            </button>

            {showNotifDropdown && (
              <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden z-50 animate-in fade-in zoom-in-95">
                <div className="p-3 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                  <div className="flex items-center gap-1.5">
                    <Bell className="w-4 h-4 text-amber-500" />
                    <span className="text-xs font-bold text-slate-800">Bildirimler ({unreadNotificationCount})</span>
                  </div>
                  {unreadNotificationCount > 0 && (
                    <button
                      onClick={markAllNotificationsRead}
                      className="text-[10px] text-blue-600 hover:text-blue-700 font-bold"
                    >
                      Tümünü Okundu Say
                    </button>
                  )}
                </div>

                <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto">
                  {notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => markNotificationRead(n.id)}
                      className={`p-3 text-xs space-y-1 transition cursor-pointer hover:bg-slate-50 ${
                        !n.isRead ? 'bg-blue-50/50 border-l-2 border-blue-500' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800 text-[11px]">{n.title}</span>
                        <span className="text-[9px] text-slate-400">{n.date}</span>
                      </div>
                      <p className="text-[11px] text-slate-600">{n.message}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Messages Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setShowMessagesDropdown(!showMessagesDropdown);
                setShowNotifDropdown(false);
              }}
              className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 relative transition"
              title="Mesajlar"
            >
              <Mail className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>

            {showMessagesDropdown && (
              <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden z-50 animate-in fade-in zoom-in-95">
                <div className="p-3 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                  <span className="text-xs font-bold text-slate-800">Gelen Mesajlar</span>
                  <Link
                    href="/bayi/iletisim/mesajlar"
                    onClick={() => setShowMessagesDropdown(false)}
                    className="text-[11px] text-blue-600 hover:text-blue-700 font-bold"
                  >
                    Tümünü Gör
                  </Link>
                </div>
                <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto">
                  {messages.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-400">Gelen kutunuz boş.</div>
                  ) : (
                    messages.slice(0, 3).map((m) => (
                      <Link
                        key={m.id}
                        href="/bayi/iletisim/mesajlar"
                        onClick={() => setShowMessagesDropdown(false)}
                        className="p-3 block hover:bg-slate-50 transition"
                      >
                        <div className="flex justify-between items-start text-xs font-medium text-slate-800 mb-0.5">
                          <span className="line-clamp-1">{m.sender}</span>
                          <span className="text-[10px] text-slate-400">{m.date.split(' ')[0]}</span>
                        </div>
                        <div className="text-[11px] text-slate-600 line-clamp-1">{m.subject}</div>
                      </Link>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Cart Button */}
          <Link
            href="/bayi/siparisler/sepet"
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-xl font-bold text-xs shadow-xs transition"
          >
            <div className="relative">
              <ShoppingCart className="w-4 h-4" />
              {cartTotals.itemCount > 0 && (
                <span className="absolute -top-2 -right-2.5 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-black flex items-center justify-center border border-white">
                  {cartTotals.itemCount}
                </span>
              )}
            </div>
            <div className="hidden sm:block text-left">
              <span className="font-mono text-xs font-bold leading-tight">
                {formatCurrency(cartTotals.grandTotalTRY)}
              </span>
            </div>
          </Link>

          {/* User Profile / Dealer Menu */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left transition"
            >
              <div className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 font-bold text-[11px]">
                ES
              </div>
              <div className="hidden xl:block">
                <div className="text-xs font-bold text-slate-800 leading-tight truncate max-w-[120px]">
                  {profile.companyName}
                </div>
                <div className="text-[9px] text-slate-500 font-medium leading-none">
                  Bayi Hesabı
                </div>
              </div>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-2xl shadow-xl p-2.5 z-50 animate-in fade-in zoom-in-95">
                <div className="p-2 border-b border-slate-100 mb-1.5">
                  <div className="text-xs font-bold text-slate-800">{profile.companyName}</div>
                  <div className="text-[10px] text-slate-500 font-mono mt-0.5">{profile.dealerCode}</div>
                  <div className="mt-2 flex items-center justify-between text-[11px] bg-slate-50 p-1.5 rounded-lg border border-slate-200">
                    <span className="text-slate-500">Cari Bakiye:</span>
                    <span className="font-mono font-bold text-emerald-600">
                      {formatCurrency(profile.currentBalance)} ({profile.balanceType})
                    </span>
                  </div>
                </div>

                <div className="space-y-0.5 text-xs">
                  <Link
                    href="/bayi/profil"
                    onClick={() => setShowUserMenu(false)}
                    className="flex items-center gap-2 px-2.5 py-2 rounded-lg text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition"
                  >
                    <User className="w-4 h-4 text-blue-600" />
                    <span>Firma Bilgileri & Şifre</span>
                  </Link>

                  <Link
                    href="/admin"
                    onClick={() => setShowUserMenu(false)}
                    className="flex items-center gap-2 px-2.5 py-2 rounded-lg text-amber-700 hover:bg-amber-50 transition"
                  >
                    <ShieldAlert className="w-4 h-4 text-amber-600" />
                    <span>Yönetici Paneli (Admin)</span>
                  </Link>

                  <div className="border-t border-slate-100 my-1"></div>

                  <button
                    onClick={async () => {
                      setShowUserMenu(false);
                      await logoutAction();
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-red-600 hover:bg-red-50 transition text-left"
                  >
                    <LogOut className="w-4 h-4 text-red-600" />
                    <span>Güvenli Çıkış Yap</span>
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>

      </div>
    </header>
  );
}
