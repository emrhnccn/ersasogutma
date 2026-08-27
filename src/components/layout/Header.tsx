'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useStore } from '@/context/StoreContext';
import {
  Search,
  ShoppingCart,
  Star,
  Mail,
  User,
  ShieldAlert,
  Snowflake,
  LogOut,
  ChevronDown,
  Menu,
  X,
  FileSpreadsheet
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

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
    setIsAdminView
  } = useStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMessagesDropdown, setShowMessagesDropdown] = useState(false);

  // Search filter
  const searchFiltered = searchQuery.trim() === ''
    ? []
    : products
        .filter(
          (p) =>
            p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.brand.toLowerCase().includes(searchQuery.toLowerCase())
        )
        .slice(0, 6);

  const handleSelectProduct = (code: string) => {
    setSearchQuery('');
    setShowSearchResults(false);
    router.push(`/urunler?q=${encodeURIComponent(code)}`);
  };

  return (
    <header className="bg-slate-900 text-white sticky top-[33px] z-30 shadow-lg border-b border-slate-800 backdrop-blur-md bg-opacity-95">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        
        {/* Left: Mobile Toggle & Brand Logo */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="lg:hidden p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 focus:outline-none"
            aria-label="Menüyü Aç/Kapat"
          >
            <Menu className="w-6 h-6" />
          </button>

          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 via-cyan-500 to-sky-400 flex items-center justify-center shadow-lg shadow-sky-500/20 group-hover:scale-105 transition transform">
              <Snowflake className="w-6 h-6 text-white animate-spin-slow" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xl font-black tracking-tight text-white uppercase">
                  ERSA <span className="text-sky-400">SOĞUTMA</span>
                </span>
                <span className="text-[10px] font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30 px-1.5 py-0.5 rounded">
                  B2B
                </span>
              </div>
              <span className="text-[11px] text-slate-400 block -mt-1 font-medium">
                Endüstriyel Soğutma & Bayi Portalı
              </span>
            </div>
          </Link>
        </div>

        {/* Center: Global Instant Search */}
        <div className="hidden md:flex flex-1 max-w-lg relative">
          <div className="relative w-full">
            <input
              type="text"
              placeholder="Ürün adı, parça kodu veya marka arayın (Örn: R134a, Embraco, 70101...)"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSearchResults(true);
              }}
              onFocus={() => setShowSearchResults(true)}
              className="w-full bg-slate-800 text-slate-100 placeholder-slate-400 text-xs rounded-xl pl-10 pr-10 py-2.5 border border-slate-700 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 outline-none transition"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-3 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Autocomplete Results Dropdown */}
          {showSearchResults && searchFiltered.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden z-50">
              <div className="p-2 border-b border-slate-800 text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex justify-between">
                <span>Eşleşen Ürünler ({searchFiltered.length})</span>
                <span className="text-sky-400">Hızlı Seçim</span>
              </div>
              <div className="divide-y divide-slate-800 max-h-72 overflow-y-auto">
                {searchFiltered.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => handleSelectProduct(p.code)}
                    className="p-2.5 hover:bg-slate-800/80 cursor-pointer flex items-center justify-between gap-3 transition"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={p.image}
                        alt={p.name}
                        className="w-10 h-10 object-cover rounded bg-slate-800"
                      />
                      <div>
                        <div className="text-xs font-semibold text-white line-clamp-1">{p.name}</div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-2">
                          <span className="font-mono text-sky-400">Kod: {p.code}</span>
                          <span>•</span>
                          <span>{p.brand}</span>
                          <span>•</span>
                          <span>PİM: {p.pim}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-bold text-emerald-400 font-mono">
                        {formatCurrency(p.priceTRY)}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {p.inStock ? 'Stokta Var' : 'Tükendi'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-2 bg-slate-950 text-center">
                <Link
                  href={`/urunler?q=${encodeURIComponent(searchQuery)}`}
                  onClick={() => setShowSearchResults(false)}
                  className="text-xs text-sky-400 hover:text-sky-300 font-medium"
                >
                  Tüm sonuçları katalogda gör →
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Right: Quick Action Buttons & Profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* Quick Excel Order Button */}
          <Link
            href="/urunler/toplu"
            className="hidden xl:flex items-center gap-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 px-3 py-1.5 rounded-xl text-xs font-semibold transition"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Hızlı Excel/Toplu Sipariş</span>
          </Link>

          {/* Messages Dropdown Button */}
          <div className="relative">
            <button
              onClick={() => setShowMessagesDropdown(!showMessagesDropdown)}
              className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 relative transition"
              title="Mesajlar ve Bildirimler"
            >
              <Mail className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>

            {showMessagesDropdown && (
              <div className="absolute right-0 mt-2 w-80 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden z-50 animate-in fade-in zoom-in-95">
                <div className="p-3 border-b border-slate-800 flex justify-between items-center">
                  <span className="text-xs font-bold text-white">Gelen Mesajlarınız</span>
                  <Link
                    href="/iletisim/mesajlar"
                    onClick={() => setShowMessagesDropdown(false)}
                    className="text-[11px] text-sky-400 hover:text-sky-300 font-medium"
                  >
                    Tümünü Gör
                  </Link>
                </div>
                <div className="divide-y divide-slate-800 max-h-64 overflow-y-auto">
                  {messages.slice(0, 3).map((m) => (
                    <Link
                      key={m.id}
                      href="/iletisim/mesajlar"
                      onClick={() => setShowMessagesDropdown(false)}
                      className={`p-3 block hover:bg-slate-800/80 transition ${
                        !m.isRead ? 'bg-sky-950/30' : ''
                      }`}
                    >
                      <div className="flex justify-between items-start text-xs font-medium text-white mb-0.5">
                        <span className="line-clamp-1">{m.sender}</span>
                        <span className="text-[10px] text-slate-400">{m.date.split(' ')[0]}</span>
                      </div>
                      <div className="text-[11px] text-slate-300 line-clamp-1">{m.subject}</div>
                    </Link>
                  ))}
                </div>
                <div className="p-2 bg-slate-950 border-t border-slate-800">
                  <Link
                    href="/iletisim/mesajlar"
                    onClick={() => setShowMessagesDropdown(false)}
                    className="block text-center text-xs text-slate-300 hover:text-white py-1"
                  >
                    Yeni Mesaj Gönder
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Favorites Button */}
          <Link
            href="/urunler?favori=1"
            className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 relative transition"
            title="Favori Ürünleriniz"
          >
            <Star className="w-5 h-5" />
            {favorites.length > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-amber-500 text-slate-950 text-[10px] font-black flex items-center justify-center">
                {favorites.length}
              </span>
            )}
          </Link>

          {/* Cart Button */}
          <Link
            href="/siparisler/sepet"
            className="flex items-center gap-2 bg-gradient-to-r from-sky-600 to-cyan-600 hover:from-sky-500 hover:to-cyan-500 text-white px-3.5 py-2 rounded-xl font-bold text-xs shadow-md shadow-sky-500/20 transition group"
          >
            <div className="relative">
              <ShoppingCart className="w-4 h-4" />
              {cartTotals.itemCount > 0 && (
                <span className="absolute -top-2 -right-2.5 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center border-2 border-slate-900">
                  {cartTotals.itemCount}
                </span>
              )}
            </div>
            <div className="hidden sm:block text-left">
              <span className="block text-[10px] text-sky-100 font-normal leading-none">Sepetim</span>
              <span className="font-mono text-xs font-bold leading-tight">
                {formatCurrency(cartTotals.grandTotalTRY)}
              </span>
            </div>
          </Link>

          {/* User Profile / Dealer Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-left transition"
            >
              <div className="w-7 h-7 rounded-lg bg-sky-500/20 border border-sky-400/30 flex items-center justify-center text-sky-400 font-bold text-xs">
                ET
              </div>
              <div className="hidden lg:block">
                <div className="text-xs font-bold text-white leading-tight">
                  {profile.companyName.split(' ')[0]} {profile.companyName.split(' ')[1]}
                </div>
                <div className="text-[10px] text-emerald-400 font-medium leading-none">
                  {profile.tier} Bayi • {profile.contactPerson}
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-64 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95">
                <div className="p-2.5 border-b border-slate-800 mb-1">
                  <div className="text-xs font-bold text-white">{profile.companyName}</div>
                  <div className="text-[11px] text-slate-400">{profile.email}</div>
                  <div className="mt-1.5 flex items-center justify-between text-[11px] bg-slate-800 px-2 py-1 rounded">
                    <span className="text-slate-400">Bayi Kodu:</span>
                    <span className="font-mono font-bold text-sky-400">{profile.dealerCode}</span>
                  </div>
                  <div className="mt-1 flex items-center justify-between text-[11px] bg-slate-800 px-2 py-1 rounded">
                    <span className="text-slate-400">Cari Bakiye:</span>
                    <span className="font-mono font-bold text-emerald-400">
                      {formatCurrency(profile.currentBalance)} ({profile.balanceType})
                    </span>
                  </div>
                </div>

                <div className="space-y-0.5">
                  <Link
                    href="/profil"
                    onClick={() => setShowUserMenu(false)}
                    className="flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs text-slate-300 hover:text-white hover:bg-slate-800 transition"
                  >
                    <User className="w-4 h-4 text-sky-400" />
                    <span>Profil ve Firma Bilgileri</span>
                  </Link>

                  <button
                    onClick={() => {
                      setIsAdminView(!isAdminView);
                      setShowUserMenu(false);
                      router.push(isAdminView ? '/' : '/admin');
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs text-amber-300 hover:bg-amber-950/40 transition text-left"
                  >
                    <ShieldAlert className="w-4 h-4 text-amber-400" />
                    <span>{isAdminView ? 'Bayi Moduna Dön' : 'Ersa Yönetici Paneli'}</span>
                  </button>

                  <div className="border-t border-slate-800 my-1"></div>

                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      alert('Bayi oturumunuz başarıyla kapatıldı.');
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs text-rose-400 hover:bg-rose-950/30 transition text-left"
                  >
                    <LogOut className="w-4 h-4 text-rose-400" />
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
