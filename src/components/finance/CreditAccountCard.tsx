'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { formatCurrency } from '@/lib/utils';
import { useStore } from '@/context/StoreContext';
import {
  CreditCard,
  ArrowUpRight,
  Clock,
  Send,
  X,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface CreditAccountCardProps {
  creditLimit: number;
  currentBalance: number;
  availableCredit?: number;
  companyName?: string;
  dealerCode?: string;
  onRequestIncrease?: () => void;
  className?: string;
}

export const CreditAccountCard: React.FC<CreditAccountCardProps> = ({
  creditLimit,
  currentBalance,
  availableCredit: propAvailableCredit,
  companyName,
  dealerCode,
  onRequestIncrease,
  className = ''
}) => {
  const { showToast } = useStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [requestedAmount, setRequestedAmount] = useState('');
  const [requestReason, setRequestReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Available limit calculation
  const totalLimit = Math.max(0, creditLimit || 0);
  const usedBalance = Math.max(0, currentBalance || 0);
  const available = propAvailableCredit !== undefined 
    ? Math.max(0, propAvailableCredit)
    : Math.max(0, totalLimit - usedBalance);

  // Calculate percentage (based on available limit as seen in Image 1: 125k / 200k = %62)
  const availablePercent = totalLimit > 0
    ? Math.min(100, Math.max(0, Math.round((available / totalLimit) * 100)))
    : 0;

  // SVG Circle parameters
  const radius = 38;
  const strokeWidth = 7;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (availablePercent / 100) * circumference;

  const handleOpenModal = () => {
    if (onRequestIncrease) {
      onRequestIncrease();
    } else {
      setModalOpen(true);
    }
  };

  const handleSubmitRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestedAmount || parseFloat(requestedAmount) <= 0) {
      showToast('Lütfen geçerli bir limit tutarı giriniz.', 'warning');
      return;
    }
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      setModalOpen(false);
      setRequestedAmount('');
      setRequestReason('');
      showToast('Kredi limiti artırım talebiniz başarıyla merkeze iletildi.', 'success');
    }, 600);
  };

  return (
    <>
      <div
        className={`relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0B1D45] via-[#081534] to-[#040C20] border border-blue-500/30 text-white p-6 sm:p-7 shadow-2xl shadow-blue-950/60 transition hover:border-blue-400/50 ${className}`}
      >
        {/* Ambient Specular Background Glow */}
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-sky-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-16 -bottom-16 w-56 h-56 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-blue-400/5 via-transparent to-transparent pointer-events-none" />

        <div className="relative z-10 flex flex-col justify-between h-full gap-6">
          {/* Top Row: Title, Available Amount & Circular Progress Ring */}
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-blue-200/80 uppercase tracking-wider">
                  Kullanılabilir Limit
                </span>
                {dealerCode && (
                  <span className="text-[10px] font-mono text-sky-400 bg-sky-500/10 border border-sky-500/20 px-1.5 py-0.5 rounded">
                    {dealerCode}
                  </span>
                )}
              </div>

              {/* Huge Bold Value (Image 1 Style) */}
              <div className="text-3xl sm:text-4xl lg:text-[40px] font-black font-mono tracking-tight text-white flex items-baseline gap-1">
                <span>{formatCurrency(available)}</span>
              </div>
            </div>

            {/* Circular Progress Ring (Exact Image 1 Replica) */}
            <div className="flex-shrink-0 flex flex-col items-center justify-center relative">
              <div className="relative w-24 h-24 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <defs>
                    <linearGradient id="creditRingGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#38BDF8" />
                      <stop offset="100%" stopColor="#2563EB" />
                    </linearGradient>
                    <filter id="creditGlow" x="-20%" y="-20%" width="140%" height="140%">
                      <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#38BDF8" floodOpacity="0.6" />
                    </filter>
                  </defs>

                  {/* Track Background Ring */}
                  <circle
                    cx="50"
                    cy="50"
                    r={radius}
                    stroke="rgba(255, 255, 255, 0.12)"
                    strokeWidth={strokeWidth}
                    fill="transparent"
                  />

                  {/* Active Gradient Ring */}
                  <circle
                    cx="50"
                    cy="50"
                    r={radius}
                    stroke="url(#creditRingGradient)"
                    strokeWidth={strokeWidth}
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    fill="transparent"
                    filter="url(#creditGlow)"
                    className="transition-all duration-1000 ease-out"
                  />
                </svg>

                {/* Center Percentage Display */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-xl sm:text-2xl font-black font-mono text-white tracking-tight leading-none">
                    %{availablePercent}
                  </span>
                  <span className="text-[9px] font-medium text-blue-200/70 mt-0.5">
                    Kalan
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Middle Row: Sub-Limits (Toplam Limit & Kullanılan Tutar) */}
          <div className="pt-2 border-t border-blue-400/15 flex items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-blue-300/70 font-medium">Toplam Limit:</span>
              <span className="font-mono font-bold text-white">
                {formatCurrency(totalLimit)}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-blue-300/70 font-medium">Kullanılan:</span>
              <span className="font-mono font-bold text-sky-400">
                {formatCurrency(usedBalance)}
              </span>
              {usedBalance > 0 && (
                <Link
                  href="/bayi/finans/online-odeme"
                  className="text-[10px] bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-400/30 px-2 py-0.5 rounded-md font-bold transition ml-1"
                  title="Sanal POS ile ödeme yap"
                >
                  Öde
                </Link>
              )}
            </div>
          </div>

          {/* Bottom Row: Dual Action Buttons (Image 1 Style) */}
          <div className="flex items-center gap-2.5 pt-1">
            {/* Harcama Geçmişi (Dark Translucent Glass Button) */}
            <Link
              href="/bayi/cari"
              className="flex-1 bg-white/10 hover:bg-white/20 active:bg-white/25 text-white font-bold text-xs py-2.5 px-4 rounded-xl border border-white/15 backdrop-blur-md transition flex items-center justify-center gap-1.5 shadow-sm"
            >
              <Clock className="w-3.5 h-3.5 text-blue-200" />
              <span>Harcama Geçmişi</span>
            </Link>

            {/* Limit Artırımı Talep Et (Bright Accent Gradient Button) */}
            <button
              type="button"
              onClick={handleOpenModal}
              className="flex-1 bg-gradient-to-r from-sky-400 via-blue-500 to-blue-600 hover:from-sky-300 hover:to-blue-500 active:scale-[0.98] text-slate-950 font-black text-xs py-2.5 px-4 rounded-xl shadow-lg shadow-sky-500/25 transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 fill-slate-950 text-slate-950" />
              <span>Limit Artırımı Talep Et</span>
            </button>
          </div>
        </div>
      </div>

      {/* MODAL: Limit Increase Request Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">Limit Artırım Talebi</h3>
                  <p className="text-[10px] text-slate-500">Cari açık hesap limitinizi yükseltmek için talep oluşturun</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/50 rounded-2xl flex items-center justify-between text-xs">
              <span className="text-slate-600 dark:text-slate-300">Mevcut Toplam Limit:</span>
              <span className="font-mono font-bold text-blue-600 dark:text-blue-400 text-sm">
                {formatCurrency(totalLimit)}
              </span>
            </div>

            <form onSubmit={handleSubmitRequest} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                  Talep Edilen Yeni Limit Tutarı (TL): <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-mono font-bold text-slate-400">₺</span>
                  <input
                    type="number"
                    required
                    min={totalLimit + 1000}
                    step={5000}
                    placeholder={`Örn: ${(totalLimit + 50000).toLocaleString('tr-TR')}`}
                    value={requestedAmount}
                    onChange={(e) => setRequestedAmount(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-700 rounded-xl pl-8 pr-3 py-2.5 font-mono font-bold text-slate-900 dark:text-white text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                  Gerekçe / Talep Açıklaması:
                </label>
                <textarea
                  rows={3}
                  placeholder="Sezonluk artan klima/kompresör siparişleri için limit artırımı rica ediyoruz..."
                  value={requestReason}
                  onChange={(e) => setRequestReason(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 resize-none text-xs"
                />
              </div>

              <div className="pt-2 flex gap-2.5">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs py-2.5 rounded-xl transition"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs py-2.5 rounded-xl shadow-lg shadow-blue-600/30 transition flex items-center justify-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{submitting ? 'Gönderiliyor...' : 'Talebi İlet'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
