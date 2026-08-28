'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldCheck, ArrowRight } from 'lucide-react';

const POPULAR_BRANDS = [
  { name: 'Embraco', desc: 'Ticari ve ev tipi hermetik soğutma kompresörleri lideri' },
  { name: 'Secop (Danfoss)', desc: 'Yüksek verimli soğutma kompresörleri ve çözümleri' },
  { name: 'Cubigel', desc: 'Ticari soğutma üniteleri ve kompresör grupları' },
  { name: 'Copeland (Emerson)', desc: 'Scroll ve yarı hermetik kompresör teknolojileri' },
  { name: 'Eliwell', desc: 'Elektronik sıcaklık ve soğutma kontrolörleri' },
  { name: 'Dixell', desc: 'Gelişmiş dijital termostatlar ve soğutma sistemleri' },
  { name: 'Castel', desc: 'Soğutma vanaları, filtre drayerler ve emniyet ventilleri' },
  { name: 'DuPont / Chemours', desc: 'Orijinal Freon ve R-serisi soğutucu gazlar' },
  { name: 'Honeywell', desc: 'Çevre dostu soğutucu akışkanlar ve soğutma ekipmanları' },
  { name: 'Wigam', desc: 'Profesyonel servis manometreleri, vakum pompaları' },
  { name: 'Value', desc: 'Vakum pompaları, kaçak dedektörleri ve servis setleri' },
  { name: 'Ebm-papst', desc: 'Endüstriyel aksiyel ve radyal fan motorları' }
];

export default function PublicBrandsPage() {
  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-4">Distribütörü Olduğumuz Markalar</h1>
          <p className="text-slate-600 text-lg">
            Dünya çapında kalitesi ve güvenilirliği kanıtlanmış lider soğutma markalarının orijinal ürünlerini sunuyoruz.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {POPULAR_BRANDS.map((brand, i) => (
            <Link
              key={i}
              href="/urunler"
              className="group bg-white p-6 rounded-2xl border border-slate-200 hover:border-sky-300 hover:shadow-xl transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <ShieldCheck className="w-5 h-5 text-sky-600" />
                  <span className="text-xs font-bold text-sky-600 uppercase tracking-wider">Orijinal Distribütör</span>
                </div>
                <h3 className="font-black text-slate-900 text-xl group-hover:text-sky-600 transition-colors">
                  {brand.name}
                </h3>
                <p className="text-slate-500 text-xs mt-2 leading-relaxed">
                  {brand.desc}
                </p>
              </div>
              <div className="mt-6 flex items-center justify-between text-xs font-bold text-sky-600 pt-4 border-t border-slate-100">
                <span>Ürünlerini Gör</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
