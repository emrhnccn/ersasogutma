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
  X
} from 'lucide-react';
import { useStore } from '@/context/StoreContext';
import { logoutAction } from '@/lib/actions';

export function AdminShell({ children }: { children: React.ReactNode }) {
  const { exchangeRates } = useStore();

  const handleSignOut = async () => {
    await logoutAction();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Admin Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 shadow-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Logo & System Badge */}
          <div className="flex items-center gap-3">
            <Link href="/admin" className="flex items-center gap-2.5 group">
              <div className="w-10 h-10 rounded-xl bg-red-600/20 border border-red-500/40 text-red-500 flex items-center justify-center font-black text-lg shadow-lg shadow-red-500/10 group-hover:scale-105 transition-transform">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-black text-white tracking-tight text-base">ERSA SOĞUTMA</span>
                  <span className="px-2 py-0.5 bg-red-500/10 border border-red-500/30 text-red-400 font-extrabold text-[10px] rounded-md tracking-wider">
                    YÖNETİCİ PANELİ
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 font-mono">Master Control & Automation</div>
              </div>
            </Link>
          </div>

          {/* Center: Live Status Badges */}
          <div className="hidden md:flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800/80 border border-slate-700/60 rounded-xl text-slate-300">
              <Database className="w-3.5 h-3.5 text-sky-400" />
              <span>DB: <strong className="text-white">PostgreSQL (Neon)</strong></span>
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800/80 border border-slate-700/60 rounded-xl text-slate-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>USD: <strong className="text-emerald-400 font-mono">{exchangeRates?.USD_TRY || '38.45'}₺</strong></span>
              <span className="text-slate-600">|</span>
              <span>EUR: <strong className="text-emerald-400 font-mono">{exchangeRates?.EUR_TRY || '42.10'}₺</strong></span>
            </div>
          </div>

          {/* Right Actions: Quick site links & Admin profile */}
          <div className="flex items-center gap-3">
            <Link
              href="/"
              target="_blank"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-semibold border border-slate-700 transition"
              title="Ziyaretçi Anasayfasını Yeni Sekmede Aç"
            >
              <Globe className="w-3.5 h-3.5 text-sky-400" />
              <span>Vitrin</span>
              <ExternalLink className="w-3 h-3 text-slate-500" />
            </Link>

            <Link
              href="/bayi"
              target="_blank"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-semibold border border-slate-700 transition"
              title="Bayi Portalını Yeni Sekmede Aç"
            >
              <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Bayi Portalı</span>
              <ExternalLink className="w-3 h-3 text-slate-500" />
            </Link>

            {/* Admin User Badge */}
            <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
              <div className="hidden lg:block text-right">
                <div className="text-xs font-bold text-white leading-tight">ersaticaret</div>
                <div className="text-[10px] text-red-400 font-mono">Süper Yönetici</div>
              </div>
              <button
                onClick={handleSignOut}
                className="p-2 bg-slate-800 hover:bg-red-900/30 text-slate-400 hover:text-red-400 border border-slate-700 hover:border-red-500/40 rounded-xl transition"
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
