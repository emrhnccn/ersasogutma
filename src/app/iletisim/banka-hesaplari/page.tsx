'use client';

import React, { useState } from 'react';
import { BANK_ACCOUNTS } from '@/data/bankAccounts';
import { useStore } from '@/context/StoreContext';
import {
  Building2,
  Copy,
  Check,
  CreditCard,
  PhoneCall,
  ShieldCheck
} from 'lucide-react';

export default function BankAccountsPage() {
  const { showToast } = useStore();
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [currencyFilter, setCurrencyFilter] = useState<'all' | 'TRY' | 'USD' | 'EUR'>('all');

  const filteredBanks = BANK_ACCOUNTS.filter((b) => {
    if (currencyFilter !== 'all' && b.currency !== currencyFilter) return false;
    return true;
  });

  const copyToClipboard = (iban: string, id: string) => {
    navigator.clipboard.writeText(iban.replace(/\s+/g, ''));
    setCopiedId(id);
    showToast('IBAN numarası panoya kopyalandı!');
    setTimeout(() => setCopiedId(null), 2500);
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider mb-1">
            <Building2 className="w-4 h-4" />
            <span>Firma Finans & Havale Bilgileri</span>
          </div>
          <h1 className="text-2xl font-black text-white">Banka Hesap Bilgileri</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Havale ve EFT ödemeleriniz için Ersa Soğutma resmi banka hesapları
          </p>
        </div>

        {/* Currency Filter Tabs */}
        <div className="flex bg-slate-900 border border-slate-800 p-1 rounded-xl text-xs font-bold self-start">
          <button
            onClick={() => setCurrencyFilter('all')}
            className={`px-3 py-1.5 rounded-lg transition ${currencyFilter === 'all' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'}`}
          >
            Tüm Hesaplar
          </button>
          <button
            onClick={() => setCurrencyFilter('TRY')}
            className={`px-3 py-1.5 rounded-lg transition ${currencyFilter === 'TRY' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'}`}
          >
            TL (₺)
          </button>
          <button
            onClick={() => setCurrencyFilter('USD')}
            className={`px-3 py-1.5 rounded-lg transition ${currencyFilter === 'USD' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'}`}
          >
            USD ($)
          </button>
          <button
            onClick={() => setCurrencyFilter('EUR')}
            className={`px-3 py-1.5 rounded-lg transition ${currencyFilter === 'EUR' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'}`}
          >
            EUR (€)
          </button>
        </div>
      </div>

      {/* Notice Box */}
      <div className="bg-sky-950/40 border border-sky-800/40 rounded-2xl p-4 text-xs text-sky-200 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-sky-400 flex-shrink-0 mt-0.5" />
        <div>
          <strong>Havale Açıklaması Hatırlatması:</strong> Lütfen banka transferi yaparken açıklama kısmına <strong>Bayi Kodunuzu (BAYI-41008)</strong> veya <strong>Sipariş Numaranızı</strong> yazınız. Bu sayede ödemeniz anında cari hesabınıza işlenir.
        </div>
      </div>

      {/* Bank Account Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredBanks.map((bank) => (
          <div
            key={bank.id}
            className="bg-slate-900 border border-slate-800 hover:border-amber-500/40 rounded-2xl p-5 shadow-xl transition flex flex-col justify-between space-y-4"
          >
            <div>
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{bank.bankLogo}</span>
                  <div>
                    <h3 className="font-bold text-white text-sm leading-tight">{bank.bankName}</h3>
                    <span className="text-[10px] text-slate-400">{bank.branchName} ({bank.branchCode})</span>
                  </div>
                </div>
                <span className="font-mono font-bold text-xs bg-slate-800 px-2 py-0.5 rounded border border-slate-700 text-emerald-400">
                  {bank.currency}
                </span>
              </div>

              <div className="space-y-1.5 text-xs text-slate-300">
                <div>
                  <span className="text-slate-500 text-[10px] uppercase font-bold block">Hesap Sahibi</span>
                  <span className="font-bold text-white line-clamp-1">{bank.accountHolder}</span>
                </div>
                <div className="flex justify-between pt-1">
                  <div>
                    <span className="text-slate-500 text-[10px] uppercase font-bold block">Hesap No</span>
                    <span className="font-mono text-slate-200">{bank.accountNumber}</span>
                  </div>
                  {bank.swiftCode && (
                    <div className="text-right">
                      <span className="text-slate-500 text-[10px] uppercase font-bold block">SWIFT</span>
                      <span className="font-mono text-sky-400 font-bold">{bank.swiftCode}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* IBAN Box with Copy Button */}
            <div className="pt-2 border-t border-slate-800">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                IBAN Numarası:
              </div>
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-2.5 flex items-center justify-between gap-2">
                <span className="font-mono font-bold text-xs text-sky-300 truncate select-all">
                  {bank.iban}
                </span>
                <button
                  onClick={() => copyToClipboard(bank.iban, bank.id)}
                  className={`p-1.5 rounded-lg border transition flex items-center gap-1 text-[11px] font-bold ${
                    copiedId === bank.id
                      ? 'bg-emerald-600 border-emerald-500 text-white'
                      : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300 hover:text-white'
                  }`}
                  title="IBAN Kopyala"
                >
                  {copiedId === bank.id ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Kopyalandı</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Kopyala</span>
                    </>
                  )}
                </button>
              </div>
            </div>

          </div>
        ))}
      </div>

    </div>
  );
}
