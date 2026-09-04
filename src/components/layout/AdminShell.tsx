'use client';

import React from 'react';
import Link from 'next/link';
import {
  ShieldAlert,
  ExternalLink,
  LogOut,
  Sparkles,
  Server,
  Database,
  Globe,
  UserCheck,
  CheckCircle2,
  AlertTriangle,
  Info,
  X,
  Sun,
  Moon
} from 'lucide-react';
import { useStore } from '@/context/StoreContext';
import { logoutAction } from '@/lib/actions';

export function AdminShell({ children }: { children: React.ReactNode }) {
  const { exchangeRates, theme, toggleTheme } = useStore();

  const handleSignOut = async () => {
    await logoutAction();
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#111827] flex flex-col font-sans">
      {/* Admin Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Logo & System Badge */}
          <div className="flex items-center gap-3">
            <Link href="/admin" className="flex items-center gap-2.5 group">
              <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center font-black text-lg shadow-xs group-hover:scale-105 transition-transform">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-black text-slate-900 tracking-tight text-base">ERSA SOĞUTMA</span>
                  <span className="px-2 py-0.5 bg-blue-50 border border-blue-200 text-blue-700 font-bold text-[10px] rounded-md tracking-wider">
                    YÖNETİCİ PANELİ
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 font-medium">B2B Yönetim ve Denetim Merkezi</div>
              </div>
            </Link>
          </div>

          {/* Center: Live Status Badges */}
          <div className="hidden md:flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-600 font-medium">
              <Database className="w-3.5 h-3.5 text-blue-600" />
              <span>Veritabanı: <strong className="text-slate-800">PostgreSQL</strong></span>
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-600 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>USD: <strong className="text-slate-800 font-mono">{exchangeRates?.USD_TRY || '38.45'}₺</strong></span>
              <span className="text-slate-300">|</span>
              <span>EUR: <strong className="text-slate-800 font-mono">{exchangeRates?.EUR_TRY || '42.10'}₺</strong></span>
            </div>
          </div>

          {/* Right Actions: Quick site links & Admin profile */}
          <div className="flex items-center gap-3">
            <Link
              href="/"
              target="_blank"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 rounded-xl text-xs font-semibold border border-slate-200 shadow-xs transition"
              title="Ziyaretçi Anasayfasını Yeni Sekmede Aç"
            >
              <Globe className="w-3.5 h-3.5 text-blue-600" />
              <span>Vitrin</span>
              <ExternalLink className="w-3 h-3 text-slate-400" />
            </Link>

            <Link
              href="/bayi"
              target="_blank"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-semibold border border-blue-200 transition"
              title="Bayi Portalını Yeni Sekmede Aç"
            >
              <UserCheck className="w-3.5 h-3.5 text-blue-600" />
              <span>Bayi Portalı</span>
              <ExternalLink className="w-3 h-3 text-blue-400" />
            </Link>

            {/* Theme Toggle (Light / Dark) */}
            <button
              onClick={toggleTheme}
              className="p-2 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 border border-slate-200 rounded-xl shadow-xs transition"
              title={theme === 'dark' ? 'Açık Temaya Geç' : 'Karanlık Temaya Geç'}
              aria-label="Temayı Değiştir"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-500 animate-in spin-in-180 duration-300" />
              ) : (
                <Moon className="w-4 h-4 text-slate-600 animate-in spin-in-180 duration-300" />
              )}
            </button>

            {/* Admin User Badge */}
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              <div className="hidden lg:block text-right">
                <div className="text-xs font-bold text-slate-900 leading-tight">ersaticaret</div>
                <div className="text-[10px] text-blue-600 font-semibold">Süper Yönetici</div>
              </div>
              <button
                onClick={handleSignOut}
                className="p-2 bg-white hover:bg-red-50 text-slate-500 hover:text-red-600 border border-slate-200 hover:border-red-200 rounded-xl shadow-xs transition"
                title="Güvenli Çıkış Yap"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Admin Content Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
