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
  ShieldCheck
} from 'lucide-react';

export default function ContactPage() {
  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-1">
          <Building2 className="w-4 h-4" />
          <span>Ersa Soğutma Genel Merkez & Dağıtım Deposu</span>
        </div>
        <h1 className="text-2xl font-black text-white">İletişim Bilgileri</h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Merkez ofisimiz, fabrika depomuz ve bölge satış müdürlerimizle iletişim kurun
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
              <h3 className="font-bold text-white text-sm">Merkez Ofis & Depo Adresi</h3>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                Kazım Karabekir Mah. İstasyon Cad. No:84<br />
                Darıca / Gebze / KOCAELİ
              </p>
              <span className="text-[11px] text-sky-400 font-medium block mt-2">
                Gebze E-5 & Marmaray İstasyonuna 5 dk mesafede
              </span>
            </div>
          </div>

          {/* Card 2: Phone & WhatsApp */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center flex-shrink-0">
              <Phone className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-white text-sm">Telefon & WhatsApp Destek</h3>
              <div className="text-xs text-slate-300">
                <span>Santral / Ofis: </span>
                <a href="tel:02626534100" className="font-mono font-bold text-white hover:text-sky-400">
                  0 (262) 653 41 00
                </a>
              </div>
              <div className="text-xs text-slate-300">
                <span>B2B WhatsApp Sipariş: </span>
                <a href="https://wa.me/905325554141" target="_blank" rel="noreferrer" className="font-mono font-bold text-emerald-400 hover:underline">
                  0 (532) 555 41 41
                </a>
              </div>
              <div className="text-xs text-slate-300">
                <span>Faks: </span>
                <span className="font-mono text-slate-400">0 (262) 653 41 05</span>
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
                <span>Genel & Satış: </span>
                <a href="mailto:info@ersasogutma.com.tr" className="font-mono text-sky-400 hover:underline">
                  info@ersasogutma.com.tr
                </a>
              </div>
              <div className="text-xs text-slate-300">
                <span>E-Fatura & Muhasebe: </span>
                <a href="mailto:fatura@ersasogutma.com.tr" className="font-mono text-sky-400 hover:underline">
                  fatura@ersasogutma.com.tr
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
                <strong>Hafta İçi (Pazartesi - Cuma):</strong> 08:30 - 18:30<br />
                <strong>Cumartesi:</strong> 09:00 - 14:00 (Sevkiyat & Acil Nöbetçi Depo)<br />
                <strong>Pazar:</strong> Kapalı
              </p>
            </div>
          </div>

        </div>

        {/* Right Column: Key Reps & Quick Message Callout (5 cols) */}
        <div className="md:col-span-5 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-white border-b border-slate-800 pb-3">
              Bölge Sorumluları & Temsilciler
            </h3>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-0.5">
                <div className="font-bold text-white">Emin KARGI</div>
                <div className="text-sky-400 text-[11px]">Genel Müdür & Kurucu</div>
                <div className="text-slate-400 font-mono text-[11px]">emin@ersasogutma.com.tr</div>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-0.5">
                <div className="font-bold text-white">Emre KARGI</div>
                <div className="text-emerald-400 text-[11px]">Satış & Pazarlama Müdürü</div>
                <div className="text-slate-400 font-mono text-[11px]">0532 555 41 41</div>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-0.5">
                <div className="font-bold text-white">Şevki GÜRDAL</div>
                <div className="text-amber-400 text-[11px]">Mali İşler & Finans Müdürü</div>
                <div className="text-slate-400 font-mono text-[11px]">sevki@ersasogutma.com.tr</div>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-0.5">
                <div className="font-bold text-white">Halis TOSUN</div>
                <div className="text-purple-400 text-[11px]">Lojistik & Depo Amiri</div>
                <div className="text-slate-400 font-mono text-[11px]">depo@ersasogutma.com.tr</div>
              </div>
            </div>
          </div>

          {/* Quick WhatsApp Action Box */}
          <div className="bg-gradient-to-br from-emerald-900 via-slate-900 to-slate-900 border border-emerald-500/40 rounded-2xl p-5 shadow-xl text-center space-y-3">
            <h4 className="font-black text-white text-sm">Hızlı WhatsApp Destek Hattı</h4>
            <p className="text-xs text-slate-300">
              Sipariş durumu veya acil stok teyidi için doğrudan WhatsApp temsilcimize yazabilirsiniz.
            </p>
            <a
              href="https://wa.me/905325554141"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-lg shadow-emerald-950/40 transition"
            >
              <PhoneCall className="w-4 h-4" />
              <span>WhatsApp Sohbeti Başlat</span>
            </a>
          </div>
        </div>

      </div>

    </div>
  );
}
