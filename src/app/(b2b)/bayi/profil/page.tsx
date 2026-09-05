'use client';

import React, { useState } from 'react';
import { useStore } from '@/context/StoreContext';
import { formatCurrency } from '@/lib/utils';
import { User, Building, Phone, Mail, ShieldCheck, Sparkles, CheckCircle2 } from 'lucide-react';

export default function ProfilePage() {
  const { profile, updateProfile, setDealerTier, showToast } = useStore();

  const [companyName, setCompanyName] = useState(profile.companyName);
  const [contactPerson, setContactPerson] = useState(profile.contactPerson);
  const [phoneGsm, setPhoneGsm] = useState(profile.phoneGsm);
  const [phoneLandline, setPhoneLandline] = useState(profile.phoneLandline);
  const [email, setEmail] = useState(profile.email);
  const [eArchiveEmail, setEArchiveEmail] = useState(profile.eArchiveEmail);
  const [taxOffice, setTaxOffice] = useState(profile.taxOffice);
  const [taxNumber, setTaxNumber] = useState(profile.taxNumber);
  const [address, setAddress] = useState(profile.address);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({
      companyName,
      contactPerson,
      phoneGsm,
      phoneLandline,
      email,
      eArchiveEmail,
      taxOffice,
      taxNumber,
      address
    });
    showToast('Profil ve bayi firma bilgileriniz başarıyla güncellendi.', 'success');
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-sky-400 text-xs font-bold uppercase tracking-wider mb-1">
          <User className="w-4 h-4" />
          <span>Bayi Yetkili & Kurumsal Hesap Bilgileri</span>
        </div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white">Profilini ve Firma Bilgilerini Düzenle</h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Fatura, sevkiyat ve iletişim bilgilerinizi güncel tutunuz
        </p>
      </div>

      {/* Profile Overview Card */}
      <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-xs rounded-2xl p-6 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-sky-600 to-cyan-500 flex items-center justify-center text-white text-xl font-black shadow-lg shadow-sky-600/30">
            ET
          </div>
          <div>
            <h2 className="text-base font-black text-white">{profile.companyName}</h2>
            <div className="text-xs text-slate-400">Bayi Kodu: <strong className="font-mono text-sky-400">{profile.dealerCode}</strong></div>
            <div className="text-xs text-slate-400 mt-0.5">Tanımlı Kredi Limiti: <strong className="font-mono text-emerald-400">{formatCurrency(profile.creditLimit)}</strong></div>
          </div>
        </div>

        {/* Read-Only Tier Badge */}
        <div className="bg-slate-50 dark:bg-slate-950 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 text-left sm:text-right space-y-1">
          <div className="text-[10px] uppercase font-bold text-slate-400">Tanımlı İskonto Kademesi</div>
          <div className="flex items-center gap-2 sm:justify-end">
            <span className={`px-3 py-1 rounded-lg text-xs font-black tracking-wide ${
              profile.tier === 'Gold'
                ? 'bg-amber-500/20 border border-amber-500/40 text-amber-300'
                : profile.tier === 'Silver'
                ? 'bg-slate-300/20 border border-slate-300/40 text-slate-200'
                : 'bg-sky-500/20 border border-sky-500/40 text-sky-300'
            }`}>
              {profile.tier} Bayi ({profile.tier === 'Gold' ? '%40' : profile.tier === 'Silver' ? '%30' : '%20'} İskonto)
            </span>
          </div>
          <div className="text-[10px] text-slate-500">
            * İskonto kademeniz merkez yönetimi tarafından belirlenir.
          </div>
        </div>
      </div>

      {/* Main Edit Form */}
      <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-xs rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
        <form onSubmit={handleSubmit} className="space-y-6 text-xs">
          
          {/* Section 1: Contact Person & Phones */}
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3 border-b border-slate-200 dark:border-slate-800 pb-2 flex items-center gap-2">
              <User className="w-4 h-4 text-sky-400" />
              <span>Yetkili İletişim Bilgileri</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Yetkili Ad Soyad:</label>
                <input
                  type="text"
                  required
                  value={contactPerson}
                  onChange={(e) => setContactPerson(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Cep Telefonu (GSM):</label>
                <input
                  type="text"
                  required
                  value={phoneGsm}
                  onChange={(e) => setPhoneGsm(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 font-mono text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Sabit Telefon:</label>
                <input
                  type="text"
                  value={phoneLandline}
                  onChange={(e) => setPhoneLandline(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 font-mono text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">İletişim E-Posta:</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-sky-500"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Invoice & Corporate Data */}
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3 border-b border-slate-200 dark:border-slate-800 pb-2 flex items-center gap-2">
              <Building className="w-4 h-4 text-emerald-400" />
              <span>Firma & Fatura Bilgileri</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-slate-300 font-semibold mb-1">Şirket Resmi Unvanı:</label>
                <input
                  type="text"
                  required
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-white font-semibold focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Vergi Dairesi:</label>
                <input
                  type="text"
                  required
                  value={taxOffice}
                  onChange={(e) => setTaxOffice(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Vergi Numarası / VKN:</label>
                <input
                  type="text"
                  required
                  value={taxNumber}
                  onChange={(e) => setTaxNumber(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 font-mono text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-slate-300 font-semibold mb-1">E-Arşiv / E-Fatura Gönderim E-Postası:</label>
                <input
                  type="email"
                  required
                  value={eArchiveEmail}
                  onChange={(e) => setEArchiveEmail(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-slate-300 font-semibold mb-1">Sevkiyat ve Tebligat Adresi:</label>
                <textarea
                  rows={3}
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-white focus:outline-none focus:border-emerald-500 resize-none leading-relaxed"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end">
            <button
              type="submit"
              className="bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs px-6 py-3 rounded-xl shadow-lg shadow-sky-600/30 transition flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Değişiklikleri Kaydet</span>
            </button>
          </div>

        </form>
      </div>

    </div>
  );
}
