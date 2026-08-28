'use client';

import React from 'react';
import {
  Phone,
  Mail,
  MapPin,
  Clock,
  Building2,
  PhoneCall,
  Globe,
  Truck,
  ShieldCheck,
  User,
  MessageCircle
} from 'lucide-react';

export default function ContactPage() {
  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-1">
          <Building2 className="w-4 h-4" />
          <span>Ersa Soğutma & Ticaret Genel Merkez & Dağıtım Deposu</span>
        </div>
        <h1 className="text-2xl font-black text-white">İletişim & Bölge Sorumluları</h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Merkez ofisimiz, mağazamız ve bölge satış temsilcilerimizle doğrudan iletişim kurun
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Left Column: Contact Cards (7 cols) */}
        <div className="md:col-span-7 space-y-4">
          
          {/* Card 1: Address & Location */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-sky-600/20 text-sky-400 border border-sky-500/30 flex items-center justify-center flex-shrink-0">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">Mağaza & Depo Adresimiz</h3>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                Nenehatun Mah. Battal Gazi Cd. No:139/A<br />
                41700 Darıca / KOCAELİ
              </p>
              <span className="text-[11px] text-sky-400 font-medium block mt-2">
                Darıca Merkez & Gebze Marmaray / E-5 bağlantı noktasına yakın
              </span>
            </div>
          </div>

          {/* Card 2: Phone & WhatsApp */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center flex-shrink-0">
              <Phone className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-white text-sm">Telefon & WhatsApp Fiyat / Sipariş Hattı</h3>
              <div className="text-xs text-slate-300">
                <span>Santral & Sipariş: </span>
                <a href="tel:05525843073" className="font-mono font-bold text-white hover:text-sky-400">
                  0552 584 30 73
                </a>
              </div>
              <div className="text-xs text-slate-300">
                <span>WhatsApp Hızlı Destek: </span>
                <a href="https://wa.me/905525843073" target="_blank" rel="noreferrer" className="font-mono font-bold text-emerald-400 hover:underline">
                  0552 584 30 73
                </a>
              </div>
            </div>
          </div>

          {/* Card 3: Email */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center flex-shrink-0">
              <Mail className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-white text-sm">E-Posta Adresleri</h3>
              <div className="text-xs text-slate-300">
                <span>Genel Bilgi & Sipariş: </span>
                <a href="mailto:info@ersaticaret.com" className="font-mono text-sky-400 hover:underline">
                  info@ersaticaret.com
                </a>
              </div>
              <div className="text-xs text-slate-300">
                <span>Kurumsal İletişim: </span>
                <a href="mailto:info@ersasogutma.com.tr" className="font-mono text-sky-400 hover:underline">
                  info@ersasogutma.com.tr
                </a>
              </div>
            </div>
          </div>

          {/* Card 4: Working Hours */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-amber-600/20 text-amber-400 border border-amber-500/30 flex items-center justify-center flex-shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">Çalışma Saatleri</h3>
              <p className="text-xs text-slate-300 mt-1">
                <strong>Pazartesi - Cumartesi:</strong> 08:30 - 19:00<br />
                <strong>Pazar:</strong> 13:00 - 17:00 (Nöbetçi Mağaza & Acil Parça)
              </p>
            </div>
          </div>

        </div>

        {/* Right Column: Key Reps & Quick Message Callout (5 cols) */}
        <div className="md:col-span-5 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <User className="w-4 h-4 text-sky-400" />
                Bölge Sorumluları & Temsilciler
              </h3>
              <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 text-[10px] font-bold rounded-full">
                Doğrudan İletişim
              </span>
            </div>

            <div className="space-y-3 text-xs">
              {/* Sadık Akgümüş */}
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 hover:border-sky-500/40 transition-colors space-y-2">
                <div className="flex items-center justify-between">
                  <div className="font-black text-white text-sm">Sadık AKGÜMÜŞ</div>
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-sky-500/10 text-sky-400 rounded-md">Yönetim & Satış</span>
                </div>
                <div className="flex items-center justify-between pt-1">
                  <a
                    href="tel:05525843073"
                    className="flex items-center gap-1.5 font-mono text-xs font-bold text-white hover:text-sky-400"
                  >
                    <Phone className="w-3.5 h-3.5 text-sky-400" />
                    0552 584 30 73
                  </a>
                  <a
                    href="https://wa.me/905525843073"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded-lg font-bold text-[11px] hover:bg-emerald-500/30 transition"
                  >
                    <MessageCircle className="w-3 h-3" /> WhatsApp
                  </a>
                </div>
              </div>

              {/* Erhan Akgümüş */}
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 hover:border-sky-500/40 transition-colors space-y-2">
                <div className="flex items-center justify-between">
                  <div className="font-black text-white text-sm">Erhan AKGÜMÜŞ</div>
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-500/10 text-emerald-400 rounded-md">Bölge Temsilcisi</span>
                </div>
                <div className="flex items-center justify-between pt-1">
                  <a
                    href="tel:05316066451"
                    className="flex items-center gap-1.5 font-mono text-xs font-bold text-white hover:text-emerald-400"
                  >
                    <Phone className="w-3.5 h-3.5 text-emerald-400" />
                    0531 606 64 51
                  </a>
                  <a
                    href="https://wa.me/905316066451"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded-lg font-bold text-[11px] hover:bg-emerald-500/30 transition"
                  >
                    <MessageCircle className="w-3 h-3" /> WhatsApp
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Quick WhatsApp Action Box */}
          <div className="bg-gradient-to-br from-emerald-950 via-slate-900 to-slate-900 border border-emerald-500/40 rounded-2xl p-5 shadow-xl text-center space-y-3">
            <h4 className="font-black text-white text-sm">WhatsApp Hızlı Parça & Fiyat Hattı</h4>
            <p className="text-xs text-slate-300">
              Aradığınız ürün kodu, stok sorgusu ve anlık fiyat teyidi için doğrudan yazabilirsiniz.
            </p>
            <a
              href="https://wa.me/905525843073?text=Merhaba,%20B2B%20bayi%20hakkında%20bilgi%20almak%20istiyorum."
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-2 w-full py-3 bg-[#25D366] hover:bg-[#1ea952] text-white font-bold rounded-xl text-xs shadow-lg shadow-emerald-500/20 transition active:scale-95"
            >
              <MessageCircle className="w-4 h-4" /> 0552 584 30 73 ile WhatsApp Sohbeti Başlat
            </a>
          </div>

        </div>

      </div>

    </div>
  );
}
