'use client';

import React from 'react';
import { useStore } from '@/context/StoreContext';
import { TrendingUp, RefreshCw, PhoneCall, ShieldCheck, Sparkles } from 'lucide-react';
import { Currency } from '@/types';

export function CurrencyTicker() {
  const { exchangeRates, currency, setCurrency, updateExchangeRate, profile, setDealerTier } = useStore();

  const handleRefresh = () => {
    // Simulate real-time micro fluctuations
    const deltaUSD = (Math.random() - 0.5) * 0.05;
    const deltaEUR = (Math.random() - 0.5) * 0.06;
    updateExchangeRate({
      USD_TRY: Number((exchangeRates.USD_TRY + deltaUSD).toFixed(4)),
      EUR_TRY: Number((exchangeRates.EUR_TRY + deltaEUR).toFixed(4)),
    });
  };

  return (
    <div className="bg-slate-900 text-slate-200 text-xs border-b border-slate-800 py-1.5 px-4 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        
        {/* Left: Live Currency Ticker */}
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-1.5 text-sky-400 font-semibold uppercase tracking-wider">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-500"></span>
            </span>
            <span>Canlı B2B Kurları:</span>
          </div>

          <div className="flex items-center gap-3 bg-slate-800/80 px-2.5 py-0.5 rounded border border-slate-700">
            <span className="text-slate-400">USD:</span>
            <span className="font-mono font-bold text-emerald-400">{exchangeRates.USD_TRY.toFixed(4)} TL</span>
            <TrendingUp className="w-3 h-3 text-emerald-400" />
          </div>

          <div className="flex items-center gap-3 bg-slate-800/80 px-2.5 py-0.5 rounded border border-slate-700">
            <span className="text-slate-400">EUR:</span>
            <span className="font-mono font-bold text-sky-400">{exchangeRates.EUR_TRY.toFixed(4)} TL</span>
            <TrendingUp className="w-3 h-3 text-sky-400" />
          </div>

          <div className="hidden lg:flex items-center gap-3 bg-slate-800/80 px-2.5 py-0.5 rounded border border-slate-700">
            <span className="text-slate-400">GBP:</span>
            <span className="font-mono font-bold text-amber-400">{exchangeRates.GBP_TRY.toFixed(4)} TL</span>
          </div>

          <button
            onClick={handleRefresh}
            title="Kurları Yenile"
            className="p-1 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition"
          >
            <RefreshCw className="w-3 h-3" />
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

          {/* Quick Dealer Tier Indicator & Selector */}
          <div className="hidden md:flex items-center gap-1.5 bg-sky-950/60 border border-sky-800/60 px-2 py-0.5 rounded text-sky-300">
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span>Kademe:</span>
            <select
              value={profile.tier}
              onChange={(e) => setDealerTier(e.target.value as 'Standart' | 'Silver' | 'Gold')}
              className="bg-transparent text-amber-300 font-bold border-none text-xs focus:outline-none cursor-pointer"
            >
              <option value="Standart" className="bg-slate-900 text-white">Standart (%20 İskonto)</option>
              <option value="Silver" className="bg-slate-900 text-white">Silver (%30 İskonto)</option>
              <option value="Gold" className="bg-slate-900 text-white">Gold (%40 İskonto)</option>
            </select>
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
