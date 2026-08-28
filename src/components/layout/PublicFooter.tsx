import React from 'react';
import Link from 'next/link';
import { Mail, Phone, MapPin } from 'lucide-react';

export function PublicFooter() {
  return (
    <footer className="bg-slate-950 border-t border-slate-800 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          {/* Brand */}
          <div className="space-y-4">
            <h3 className="text-xl font-black text-sky-400">ERSA SOĞUTMA</h3>
            <p className="text-sm text-slate-400">
              Soğutma sistemleri, kompresörler, soğutucu gazlar ve yedek parça tedariğinde güvenilir kurumsal çözüm ortağınız.
            </p>
          </div>
          
          {/* Quick Links */}
          <div>
            <h4 className="text-white font-bold mb-4">Hızlı Bağlantılar</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li><Link href="/urunler" className="hover:text-sky-400 transition">Ürün Kataloğu</Link></li>
              <li><Link href="/markalar" className="hover:text-sky-400 transition">Markalarımız</Link></li>
              <li><Link href="/kurumsal/hakkimizda" className="hover:text-sky-400 transition">Hakkımızda</Link></li>
              <li><Link href="/bayi/login" className="hover:text-sky-400 transition">Bayi Girişi</Link></li>
            </ul>
          </div>
          
          {/* Corporate */}
          <div>
            <h4 className="text-white font-bold mb-4">Kurumsal</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li><Link href="/kurumsal/gizlilik" className="hover:text-sky-400 transition">Gizlilik Sözleşmesi</Link></li>
              <li><Link href="/kurumsal/kvkk" className="hover:text-sky-400 transition">KVKK Aydınlatma Metni</Link></li>
              <li><Link href="/kurumsal/iade" className="hover:text-sky-400 transition">İade ve İptal Koşulları</Link></li>
              <li><Link href="/iletisim" className="hover:text-sky-400 transition">İletişim</Link></li>
            </ul>
          </div>
          
          {/* Contact */}
          <div>
            <h4 className="text-white font-bold mb-4">İletişim</h4>
            <ul className="space-y-3 text-sm text-slate-400">
              <li className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-sky-400 shrink-0" />
                <span>Sanayi Mah. Teknopark Bulvarı No:1 Pendik / İSTANBUL</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-sky-400 shrink-0" />
                <span>0850 123 45 67</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-sky-400 shrink-0" />
                <span>info@ersasogutma.com.tr</span>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-slate-500">
            &copy; {new Date().getFullYear()} Ersa Soğutma Sanayi ve Tic. Ltd. Şti. Tüm hakları saklıdır.
          </p>
          <div className="text-xs text-slate-600">
            Powered by B2B E-Commerce System
          </div>
        </div>
      </div>
    </footer>
  );
}
