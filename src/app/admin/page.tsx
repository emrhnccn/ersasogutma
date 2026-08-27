'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useStore } from '@/context/StoreContext';
import { formatCurrency } from '@/lib/utils';
import {
  ShieldAlert,
  TrendingUp,
  ShoppingBag,
  CheckCircle2,
  Clock,
  Truck,
  Layers,
  UserCheck,
  RefreshCw,
  Plus,
  ArrowLeft,
  DollarSign
} from 'lucide-react';
import { OrderStatus } from '@/types';

export default function AdminControlPanel() {
  const {
    exchangeRates,
    updateExchangeRate,
    orders,
    updateOrderStatus,
    profile,
    updateProfile,
    setDealerTier,
    addCariTransaction,
    showToast
  } = useStore();

  // Exchange rate inputs
  const [usdRate, setUsdRate] = useState(exchangeRates.USD_TRY.toString());
  const [eurRate, setEurRate] = useState(exchangeRates.EUR_TRY.toString());

  // Dealer credit limit input
  const [creditLimitInput, setCreditLimitInput] = useState(profile.creditLimit.toString());

  // New Transaction injection
  const [manualDocNo, setManualDocNo] = useState('');
  const [manualDocType, setManualDocType] = useState<'Satış Faturası' | 'Tahsilat Makbuzu' | 'Havale/EFT'>('Satış Faturası');
  const [manualDebt, setManualDebt] = useState('');
  const [manualCredit, setManualCredit] = useState('');
  const [manualDesc, setManualDesc] = useState('');

  const handleUpdateRates = (e: React.FormEvent) => {
    e.preventDefault();
    const usd = parseFloat(usdRate);
    const eur = parseFloat(eurRate);
    if (isNaN(usd) || isNaN(eur)) {
      showToast('Geçersiz kur değeri!', 'error');
      return;
    }
    updateExchangeRate({ USD_TRY: usd, EUR_TRY: eur });
  };

  const handleUpdateCreditLimit = (e: React.FormEvent) => {
    e.preventDefault();
    const lim = parseFloat(creditLimitInput);
    if (isNaN(lim) || lim <= 0) return;
    updateProfile({ creditLimit: lim });
    showToast(`Bayi kredi limiti ${formatCurrency(lim)} olarak güncellendi!`);
  };

  const handleAddManualTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    const d = parseFloat(manualDebt) || 0;
    const c = parseFloat(manualCredit) || 0;
    if (!manualDocNo) {
      showToast('Evrak numarası gereklidir.', 'warning');
      return;
    }

    const now = new Date();
    const dateFormatted = `${String(now.getDate()).padStart(2, '0')}.${String(now.getMonth() + 1).padStart(2, '0')}.${now.getFullYear()}`;

    addCariTransaction({
      date: dateFormatted,
      documentNo: manualDocNo,
      documentType: manualDocType,
      debt: d,
      credit: c,
      balance: profile.currentBalance + (c - d),
      balanceType: (profile.currentBalance + (c - d)) >= 0 ? 'A' : 'B',
      description: manualDesc || 'Admin Manuel Girişi'
    });

    setManualDocNo('');
    setManualDebt('');
    setManualCredit('');
    setManualDesc('');
    showToast('Cari hareketi başarıyla işlendi!');
  };

  return (
    <div className="space-y-6">
      
      {/* Admin Banner */}
      <div className="bg-gradient-to-r from-amber-950 via-slate-900 to-slate-950 border border-amber-500/50 rounded-2xl p-6 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider mb-1">
            <ShieldAlert className="w-4 h-4" />
            <span>Ersa Soğutma Şirket İçi Yönetim Paneli</span>
          </div>
          <h1 className="text-2xl font-black text-white">Yönetici Kontrol Merkezi</h1>
          <p className="text-slate-300 text-xs mt-1">
            Döviz kurlarını güncelleyin, bayi siparişlerini onaylayıp sevk edin ve cari limitleri yönetin.
          </p>
        </div>

        <Link
          href="/"
          className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold px-4 py-2.5 rounded-xl border border-slate-700 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Bayi Görünümüne Dön</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Fast Live Rates & Dealer Limits (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Rate Management */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <h2 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span>Canlı B2B Döviz Kurları Yönetimi</span>
            </h2>

            <form onSubmit={handleUpdateRates} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">USD / TRY Kuru:</label>
                <input
                  type="number"
                  step="0.0001"
                  value={usdRate}
                  onChange={(e) => setUsdRate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 font-mono text-emerald-400 font-bold focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">EUR / TRY Kuru:</label>
                <input
                  type="number"
                  step="0.0001"
                  value={eurRate}
                  onChange={(e) => setEurRate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 font-mono text-sky-400 font-bold focus:outline-none focus:border-sky-500"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-2 rounded-xl transition flex items-center justify-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Kurları Sisteme Uygula</span>
              </button>
            </form>
          </div>

          {/* Dealer Tier & Limit Management */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <h2 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-2">
              <UserCheck className="w-4 h-4 text-amber-400" />
              <span>Bayi İskonto & Risk Limiti</span>
            </h2>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Bayi İskonto Sınıfı:</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Standart', 'Silver', 'Gold'] as const).map((tier) => (
                    <button
                      key={tier}
                      type="button"
                      onClick={() => setDealerTier(tier)}
                      className={`py-2 rounded-xl font-bold transition text-center ${
                        profile.tier === tier
                          ? 'bg-amber-500 text-slate-950 shadow-md'
                          : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {tier}
                    </button>
                  ))}
                </div>
              </div>

              <form onSubmit={handleUpdateCreditLimit} className="space-y-2 pt-2">
                <label className="block text-slate-400 font-semibold">Tanımlı Kredi Limiti (TL):</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={creditLimitInput}
                    onChange={(e) => setCreditLimitInput(e.target.value)}
                    className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 font-mono text-white focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="bg-sky-600 hover:bg-sky-500 text-white font-bold px-3 py-2 rounded-xl text-xs"
                  >
                    Güncelle
                  </button>
                </div>
              </form>
            </div>
          </div>

        </div>

        {/* Right Column: Order Approval & Workflow Control (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <h2 className="text-sm font-bold text-white flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-sky-400" />
                <span>Bayi Sipariş Onay & Süreç Yönetimi</span>
              </span>
              <span className="text-xs text-slate-400">Toplam {orders.length} Sipariş</span>
            </h2>

            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-mono font-bold text-sky-400 text-sm">#{order.orderNumber}</span>
                      <span className="text-slate-400 text-[11px] ml-2">({order.date})</span>
                    </div>
                    <span className="font-mono font-bold text-emerald-400">
                      {formatCurrency(order.totalTRY)}
                    </span>
                  </div>

                  <div className="text-slate-300">
                    <strong>{order.items.length} Kalem Ürün:</strong> {order.items.map((i) => `${i.productName} (${i.quantity}x)`).join(', ')}
                  </div>

                  {/* Status Changer Actions */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-900 gap-2 flex-wrap">
                    <span className="text-[11px] text-slate-400">Durumu Değiştir:</span>
                    <div className="flex gap-1.5 flex-wrap">
                      <button
                        onClick={() => updateOrderStatus(order.id, 'bekliyor')}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition ${
                          order.status === 'bekliyor' ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        Bekliyor
                      </button>

                      <button
                        onClick={() => updateOrderStatus(order.id, 'sevkiyatta')}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition ${
                          order.status === 'sevkiyatta' ? 'bg-sky-500 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        Sevkiyatta (Yolda)
                      </button>

                      <button
                        onClick={() => updateOrderStatus(order.id, 'tamamlandi')}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition ${
                          order.status === 'tamamlandi' ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        Teslim Edildi
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Manual Cari Transaction Injector */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <h2 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
              <Layers className="w-4 h-4 text-purple-400" />
              <span>Cari Hesaba Manuel Fatura / Tahsilat Ekle</span>
            </h2>

            <form onSubmit={handleAddManualTransaction} className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Evrak No:</label>
                <input
                  type="text"
                  required
                  placeholder="Örn: ERS-202600210"
                  value={manualDocNo}
                  onChange={(e) => setManualDocNo(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Evrak Türü:</label>
                <select
                  value={manualDocType}
                  onChange={(e) => setManualDocType(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none"
                >
                  <option value="Satış Faturası">Satış Faturası (Borç Ekle)</option>
                  <option value="Tahsilat Makbuzu">Tahsilat Makbuzu (Alacak Ekle)</option>
                  <option value="Havale/EFT">Havale/EFT (Alacak Ekle)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Borç Tutarı (TL):</label>
                <input
                  type="number"
                  placeholder="0"
                  value={manualDebt}
                  onChange={(e) => setManualDebt(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 font-mono text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Alacak Tutarı (TL):</label>
                <input
                  type="number"
                  placeholder="0"
                  value={manualCredit}
                  onChange={(e) => setManualCredit(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 font-mono text-white focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-slate-400 mb-1">Açıklama:</label>
                <input
                  type="text"
                  placeholder="Örn: Manuel fatura virmanı"
                  value={manualDesc}
                  onChange={(e) => setManualDesc(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2 flex justify-end">
                <button
                  type="submit"
                  className="bg-purple-600 hover:bg-purple-500 text-white font-bold px-5 py-2 rounded-xl shadow-md transition"
                >
                  Cariye Ekle
                </button>
              </div>
            </form>
          </div>

        </div>

      </div>

    </div>
  );
}
