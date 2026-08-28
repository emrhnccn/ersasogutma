import React from 'react';
import Link from 'next/link';
import { Phone, Mail, MapPin, ShieldCheck, Truck, Wrench } from 'lucide-react';

export function PublicFooter() {
  return (
    <footer className="bg-slate-900 text-slate-400 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand Info */}
          <div className="space-y-4 md:col-span-1">
            <Link href="/" className="text-2xl font-black text-white tracking-tighter">
              ERSA <span className="text-sky-400">SOĞUTMA</span>
            </Link>
            <p className="text-sm text-slate-400 leading-relaxed">
              Darıca ve Kocaeli merkezli; Türkiye geneli soğutma sistemleri, kompresör ve toptan yedek parça tedarik merkezi.
            </p>
            <div className="space-y-2 pt-2 text-xs font-semibold text-slate-300">
              <div className="flex items-center gap-2 text-emerald-400">
                <ShieldCheck className="w-4 h-4" /> %100 Orijinal Distribütör Parçalar
              </div>
              <div className="flex items-center gap-2 text-sky-400">
                <Truck className="w-4 h-4" /> Stoktan Aynı Gün Hızlı Sevkiyat
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Hızlı Menü</h3>
            <ul className="space-y-2.5 text-sm">
              <li><Link href="/urunler" className="hover:text-sky-400 transition">Ürün Kataloğu</Link></li>
              <li><Link href="/kategoriler" className="hover:text-sky-400 transition">Kategoriler</Link></li>
              <li><Link href="/markalar" className="hover:text-sky-400 transition">Markalarımız</Link></li>
              <li><Link href="/kurumsal/hakkimizda" className="hover:text-sky-400 transition">Hakkımızda</Link></li>
              <li><Link href="/bayi/login" className="hover:text-sky-400 font-bold text-sky-400 transition">Bayi Portalı Girişi</Link></li>
            </ul>
          </div>

          {/* Corporate / Legal */}
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Kurumsal</h3>
            <ul className="space-y-2.5 text-sm">
              <li><Link href="/kurumsal/gizlilik" className="hover:text-sky-400 transition">Gizlilik Politikası</Link></li>
              <li><Link href="/kurumsal/sozlesme" className="hover:text-sky-400 transition">Kullanıcı Sözleşmesi</Link></li>
              <li><Link href="/kurumsal/iade" className="hover:text-sky-400 transition">İade ve İptal Koşulları</Link></li>
              <li><Link href="/iletisim" className="hover:text-sky-400 transition">Bayilik Başvurusu</Link></li>
              <li><Link href="/admin/login" className="hover:text-red-400 text-xs text-slate-600 transition">Yönetici Girişi</Link></li>
            </ul>
          </div>

          {/* Contact Details */}
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">İletişim & Konum</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-sky-500 shrink-0 mt-0.5" />
                <span>Nenehatun Mah. Battal Gazi Cd. No:139/A<br />41700 Darıca / KOCAELİ</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-emerald-500 shrink-0" />
                <a href="tel:05525843073" className="hover:text-white font-mono font-bold">
                  0552 584 30 73
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-amber-500 shrink-0" />
                <a href="mailto:info@ersaticaret.com" className="hover:text-white">
                  info@ersaticaret.com
                </a>
              </li>
              <li className="text-xs text-slate-500 pt-2">
                Pzt - Cmt: 08:30 - 19:00 | Pazar: 13:00 - 17:00
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-slate-800 text-xs text-slate-500 flex flex-col md:flex-row justify-between items-center gap-4">
          <p>© {new Date().getFullYear()} Ersa Ticaret & Soğutma Sistemleri. Tüm hakları saklıdır.</p>
          <div className="flex items-center gap-4">
            <span>B2B E-Ticaret & Tedarik Altyapısı</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
