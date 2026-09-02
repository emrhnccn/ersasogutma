'use client';

import React, { useState } from 'react';
import {
  Mail,
  Phone,
  MapPin,
  Send,
  CheckCircle2,
  Clock,
  User,
  MessageCircle,
  ShieldCheck,
  Navigation
} from 'lucide-react';

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [fullName, setFullName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('Yeni B2B Bayilik Başvurusu');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/dealer-applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contactPerson: fullName,
          companyName: companyName || fullName,
          phone,
          email,
          notes: `[Konu: ${subject}] ${message}`
        })
      });

      const json = await res.json();
      if (json.success) {
        setSubmitted(true);
      } else {
        setErrorMsg(json.error || 'Başvuru gönderilirken bir hata oluştu.');
      }
    } catch {
      setErrorMsg('Sunucuya bağlanılamadı. Lütfen telefon ile bizimle iletişime geçiniz.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="px-3.5 py-1 bg-sky-100 text-sky-800 font-bold text-xs rounded-full uppercase tracking-wider">
            İletişim & Konum
          </span>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 mt-4 tracking-tight">
            Bizimle İletişime Geçin
          </h1>
          <p className="text-slate-600 mt-3 text-lg">
            Darıca mağazamız, WhatsApp fiyat hattımız ve bölge temsilcilerimizle haftanın 7 günü hizmetinizdeyiz.
          </p>
        </div>

        {/* Bölge Sorumluları & Temsilciler (Highlight Banner) */}
        <div className="mb-12 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-6 mb-6">
            <div>
              <div className="flex items-center gap-2 text-sky-600 text-xs font-bold uppercase tracking-wider">
                <User className="w-4 h-4" />
                <span>Doğrudan İletişim</span>
              </div>
              <h2 className="text-2xl font-black text-slate-900 mt-1">Bölge Sorumluları & Temsilcilerimiz</h2>
            </div>
            <span className="text-xs text-slate-500 bg-slate-100 px-3 py-1.5 rounded-xl font-medium">
              Toptan Sipariş & Bayilik Görüşmeleri
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Sadık Akgümüş */}
            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 hover:border-sky-300 transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="font-black text-slate-900 text-lg">Sadık AKGÜMÜŞ</h3>
                  <span className="px-2.5 py-1 bg-sky-100 text-sky-800 text-xs font-bold rounded-lg">
                    Genel Koordinatör & Satış
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">Ersa Ticaret & Soğutma Sistemleri</p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
                <a
                  href="tel:05525843073"
                  className="flex items-center gap-2 font-mono font-bold text-slate-900 hover:text-sky-600 text-sm transition"
                >
                  <Phone className="w-4 h-4 text-sky-600" />
                  0552 584 30 73
                </a>
                <a
                  href="https://wa.me/905525843073?text=Merhaba%20Sadık%20Bey,%20bilgi%20almak%20istiyorum."
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#25D366] hover:bg-[#1ea952] text-white text-xs font-bold rounded-xl shadow-sm transition"
                >
                  <MessageCircle className="w-4 h-4" /> WhatsApp
                </a>
              </div>
            </div>

            {/* Erhan Akgümüş */}
            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 hover:border-emerald-300 transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="font-black text-slate-900 text-lg">Erhan AKGÜMÜŞ</h3>
                  <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-lg">
                    Bölge Satış Temsilcisi
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">Ersa Ticaret & Soğutma Sistemleri</p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
                <a
                  href="tel:05325554141"
                  className="flex items-center gap-2 font-mono font-bold text-slate-900 hover:text-emerald-600 text-sm transition"
                >
                  <Phone className="w-4 h-4 text-emerald-600" />
                  0532 555 41 41
                </a>
                <a
                  href="https://wa.me/905325554141?text=Merhaba%20Erhan%20Bey,%20bilgi%20almak%20istiyorum."
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#25D366] hover:bg-[#1ea952] text-white text-xs font-bold rounded-xl shadow-sm transition"
                >
                  <MessageCircle className="w-4 h-4" /> WhatsApp
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Form & Info Split */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          
          {/* Info Side */}
          <div className="space-y-6">
            <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm space-y-6">
              <h2 className="text-2xl font-black text-slate-900 border-b border-slate-100 pb-4">
                İletişim Bilgileri
              </h2>

              <div className="space-y-4 text-sm">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">Merkez Mağaza & Depo</h3>
                    <p className="text-slate-500 text-xs mt-1">
                      Nenehatun Mah. Battal Gazi Cad. No:139/A<br />
                      41700 Darıca / KOCAELİ
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">Sabit Hat & Fax</h3>
                    <p className="font-mono text-slate-700 text-xs mt-1">0262 653 41 00</p>
                    <p className="font-mono text-slate-500 text-xs">0262 653 41 01 (Fax)</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">Kurumsal E-Posta</h3>
                    <p className="text-slate-700 text-xs mt-1 font-mono">info@ersasogutma.com.tr</p>
                    <p className="text-slate-500 text-xs font-mono">siparis@ersasogutma.com.tr</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">Çalışma Saatleri</h3>
                    <p className="text-slate-500 text-xs mt-1">
                      Pazartesi - Cumartesi: 08:00 - 19:30<br />
                      Pazar: Nöbetçi Servis & WhatsApp Hattı
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Support Card */}
            <div className="bg-sky-900 text-white rounded-3xl p-8 shadow-xl relative overflow-hidden">
              <div className="relative z-10 space-y-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                  <ShieldCheck className="w-6 h-6 text-sky-300" />
                </div>
                <h3 className="text-xl font-bold">Acil Parça & Gaz İhtiyacı</h3>
                <p className="text-sky-200 text-xs">
                  Soğuk hava deposu veya chiller arızalarında nöbetçi ekibimiz ile aynı gün hızlı teslimat.
                </p>
                <div className="pt-2">
                  <a
                    href="tel:05525843073"
                    className="inline-flex items-center gap-2 bg-white text-slate-900 px-4 py-2 rounded-xl text-xs font-bold hover:bg-sky-50 transition"
                  >
                    <Phone className="w-3.5 h-3.5" /> 0552 584 30 73
                  </a>
                </div>
              </div>
              <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-sky-500/20 rounded-full blur-2xl"></div>
            </div>
          </div>

          {/* Form */}
          <div className="lg:col-span-2 bg-white rounded-3xl p-8 sm:p-10 border border-slate-200 shadow-sm">
            {submitted ? (
              <div className="text-center py-12">
                <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-slate-900">Başvurunuz Alındı!</h3>
                <p className="text-slate-500 mt-2">Bayilik ve talep kaydınız başarıyla yönetim panelimize ulaştı. En kısa sürede sizinle iletişime geçilecektir.</p>
                <button
                  onClick={() => {
                    setSubmitted(false);
                    setFullName('');
                    setCompanyName('');
                    setPhone('');
                    setEmail('');
                    setMessage('');
                  }}
                  className="mt-6 px-6 py-2.5 bg-sky-600 text-white rounded-xl font-bold text-sm hover:bg-sky-700 transition"
                >
                  Yeni Başvuru / Mesaj Gönder
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <h3 className="text-xl font-bold text-slate-900 border-b border-slate-100 pb-3">
                  Online Talep & Bayilik Başvuru Formu
                </h3>

                {errorMsg && (
                  <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold">
                    {errorMsg}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Adınız Soyadınız *</label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Ad Soyad"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white transition"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Firma / Servis Adı</label>
                    <input
                      type="text"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="Firma Ünvanı"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white transition"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Telefon Numaranız *</label>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="05XX XXX XX XX"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white transition"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">E-Posta Adresiniz</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="ornek@firma.com"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Konu / Talep Türü</label>
                  <select
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500 transition"
                  >
                    <option>Yeni B2B Bayilik Başvurusu</option>
                    <option>Toplu Ürün / Fiyat Teklifi Talebi</option>
                    <option>Teknik Destek / Parça Sorgulama</option>
                    <option>Diğer</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Mesajınız *</label>
                  <textarea
                    rows={4}
                    required
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Talebinizi veya sorularınızı buraya yazınız..."
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white transition"
                  ></textarea>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-4 bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white font-bold rounded-xl shadow-lg shadow-sky-600/20 transition flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" /> {isSubmitting ? 'Gönderiliyor...' : 'Talebi Gönder'}
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Map Section */}
        <div className="mt-16 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Mağazamızı Ziyaret Edin</h2>
              <p className="text-slate-500 text-sm mt-1">
                Darıca dükkanımıza gelerek ürünlerimizi yerinde inceleyebilir, hemen teslim alabilirsiniz.
              </p>
            </div>
            <a
              href="https://maps.google.com/?q=Nenehatun,+Battal+Gazi+Cd.+No:139/A,+41700+Darıca/Kocaeli"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition shadow-md"
            >
              <Navigation className="w-4 h-4" /> Google Maps&#39;te Yol Tarifi Al
            </a>
          </div>
          
          <div className="w-full h-80 rounded-2xl overflow-hidden border border-slate-200">
            <iframe
              src="https://maps.google.com/maps?q=Nenehatun,+Battal+Gazi+Cd.+No:139/A,+41700+Darıca/Kocaeli&t=&z=15&ie=UTF8&iwloc=&output=embed"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            ></iframe>
          </div>
        </div>

      </div>
    </div>
  );
}
