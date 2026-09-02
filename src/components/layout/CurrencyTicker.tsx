'use client';

import React from 'react';
import { useStore } from '@/context/StoreContext';
import { TrendingUp, RefreshCw, PhoneCall, ShieldCheck, Sparkles } from 'lucide-react';
import { Currency } from '@/types';

export function CurrencyTicker() {
  const { exchangeRates, isFetchingRates, fetchLiveRates, currency, setCurrency, profile, setDealerTier } = useStore();

  const handleRefresh = () => {
    fetchLiveRates(true);
  };

  return (
    <div className="bg-slate-900 text-slate-200 text-xs border-b border-slate-800 py-1.5 px-4 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        
        {/* Left: Live Currency Ticker */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 text-sky-400 font-semibold tracking-wider">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="flex items-center gap-1">
              <span>TCMB Canlı Kur</span>
              <span className="text-[10px] bg-sky-950 text-sky-300 px-1 py-0.2 rounded border border-sky-800 font-mono font-normal">30sn</span>
            </span>
          </div>

          <div className="flex items-center gap-2 bg-slate-800/80 px-2.5 py-0.5 rounded border border-slate-700 hover:border-emerald-500/50 transition">
            <span className="text-slate-400 font-medium">USD:</span>
            <span className="font-mono font-bold text-emerald-400">
              {exchangeRates.USD_TRY ? exchangeRates.USD_TRY.toFixed(4) : '...'} TL
            </span>
            <TrendingUp className="w-3 h-3 text-emerald-400" />
          </div>

          <div className="flex items-center gap-2 bg-slate-800/80 px-2.5 py-0.5 rounded border border-slate-700 hover:border-sky-500/50 transition">
            <span className="text-slate-400 font-medium">EUR:</span>
            <span className="font-mono font-bold text-sky-400">
              {exchangeRates.EUR_TRY ? exchangeRates.EUR_TRY.toFixed(4) : '...'} TL
            </span>
            <TrendingUp className="w-3 h-3 text-sky-400" />
          </div>

          <div className="hidden lg:flex items-center gap-2 bg-slate-800/80 px-2.5 py-0.5 rounded border border-slate-700">
            <span className="text-slate-400 font-medium">GBP:</span>
            <span className="font-mono font-bold text-amber-400">
              {exchangeRates.GBP_TRY ? exchangeRates.GBP_TRY.toFixed(4) : '...'} TL
            </span>
          </div>

          <button
            onClick={handleRefresh}
            disabled={isFetchingRates}
            title={exchangeRates.lastUpdated ? `Son güncelleme: ${exchangeRates.lastUpdated} (Yenile)` : 'Kurları Yenile'}
            className="flex items-center gap-1 px-1.5 py-0.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition disabled:opacity-50"
          >
            <RefreshCw className={`w-3 h-3 ${isFetchingRates ? 'animate-spin text-sky-400' : ''}`} />
            {exchangeRates.lastUpdated && (
              <span className="hidden xl:inline text-[10px] text-slate-400 font-mono">{exchangeRates.lastUpdated}</span>
            )}
          </button>
        </div>

        {/* Right: Currency Selector + Dealer Tier Switcher + WhatsApp Support */}
        <div className="flex items-center gap-4 flex-wrap">
          {/* Active Display Currency */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 hidden sm:inline">Görüntüleme:</span>
            <div className="flex bg-slate-800 rounded p-0.5 border border-slate-700 font-medium">
              {(['TRY', 'USD', 'EUR'] as Currency[]).map((c) => (
                <button
                  key={c}
                  onClick={() => setCurrency(c)}
                  className={`px-2 py-0.5 rounded transition text-[11px] ${
                    currency === c ? 'bg-sky-600 text-white font-bold' : 'text-slate-300 hover:text-white'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>


          {/* Direct WhatsApp B2B Order Desk */}
          <a
            href="https://wa.me/905325554141?text=Merhaba%2C%20Ersa%20So%C4%9Futma%20B2B%20Sipari%C5%9Fi%20Vermek%20%C4%B0stiyorum"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-emerald-400 hover:text-emerald-300 transition font-semibold"
          >
            <PhoneCall className="w-3 h-3" />
            <span className="hidden sm:inline">B2B WhatsApp Sipariş: 0532 555 41 41</span>
          </a>

          <div className="hidden xl:flex items-center gap-1 text-slate-400">
            <ShieldCheck className="w-3 h-3 text-sky-400" />
            <span>256-Bit SSL Güvenli B2B</span>
          </div>
        </div>

      </div>
    </div>
  );
}
