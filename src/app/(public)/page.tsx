import React from 'react';
import Link from 'next/link';
import { ArrowRight, ShieldCheck, Truck, Clock } from 'lucide-react';

export default function PublicHomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-slate-900 text-white overflow-hidden py-32 lg:py-48">
        <div className="absolute inset-0 z-0 opacity-40">
          <div className="absolute inset-0 bg-gradient-to-br from-sky-900 via-slate-900 to-black"></div>
          {/* Abstract cooling graphic / decorative */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-sky-500/20 rounded-full blur-[120px]"></div>
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-6xl font-black mb-6 tracking-tight">
            Profesyonel Soğutma Sistemlerinde <br />
            <span className="text-sky-400">Güvenilir Çözüm Ortağınız</span>
          </h1>
          <p className="text-lg md:text-xl text-slate-300 max-w-2xl mx-auto mb-10">
            Kompresörler, soğutucu gazlar, yedek parçalar ve servis ekipmanlarında geniş ürün yelpazesi ile B2B toptan satış platformu.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/urunler" 
              className="px-8 py-4 bg-sky-500 hover:bg-sky-400 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition"
            >
              Ürünleri İncele <ArrowRight className="w-5 h-5" />
            </Link>
            <Link 
              href="/bayi/login" 
              className="px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition backdrop-blur-sm border border-white/10"
            >
              Bayi Girişi Yap
            </Link>
          </div>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="py-12 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="flex flex-col items-center p-6">
              <div className="w-16 h-16 bg-sky-50 text-sky-600 rounded-2xl flex items-center justify-center mb-4">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">%100 Orijinal Ürünler</h3>
              <p className="text-slate-600">Dünyanın önde gelen markalarının resmi distribütör garantili ürünleri.</p>
            </div>
            <div className="flex flex-col items-center p-6">
              <div className="w-16 h-16 bg-sky-50 text-sky-600 rounded-2xl flex items-center justify-center mb-4">
                <Truck className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Hızlı Sevkiyat</h3>
              <p className="text-slate-600">Güçlü stok altyapısı ile siparişleriniz aynı gün kargoya teslim.</p>
            </div>
            <div className="flex flex-col items-center p-6">
              <div className="w-16 h-16 bg-sky-50 text-sky-600 rounded-2xl flex items-center justify-center mb-4">
                <Clock className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">7/24 B2B Sipariş</h3>
              <p className="text-slate-600">Gelişmiş bayi portalı üzerinden kesintisiz sipariş ve cari takibi.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Placeholder */}
      <section className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-black text-slate-900 mb-4">Ürün Kategorileri</h2>
            <p className="text-slate-600 max-w-2xl mx-auto">İhtiyacınız olan soğutma ve iklimlendirme ürünlerini kategorilerimizden kolayca bulun.</p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {['Kompresörler', 'Soğutucu Gazlar', 'Fan Motorları', 'Servis Ekipmanları'].map((cat, i) => (
              <Link href="/urunler" key={i} className="group relative bg-white rounded-2xl p-8 border border-slate-200 hover:border-sky-300 hover:shadow-xl transition-all duration-300 overflow-hidden">
                <div className="relative z-10">
                  <h3 className="text-xl font-bold text-slate-900 group-hover:text-sky-600 transition-colors">{cat}</h3>
                  <div className="mt-4 flex items-center text-sky-600 font-semibold text-sm">
                    İncele <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
                {/* Decorative background shape */}
                <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-sky-50 rounded-full group-hover:scale-150 transition-transform duration-500 z-0"></div>
              </Link>
            ))}
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-24 bg-sky-600 text-white text-center">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-black mb-6">Bayimiz Olun, Avantajları Yakalayın</h2>
          <p className="text-lg text-sky-100 mb-10">
            Size özel iskontolar, vadeli ödeme seçenekleri ve B2B portalının tüm imkanlarından yararlanmak için hemen başvurun.
          </p>
          <Link href="/iletisim" className="inline-flex bg-slate-900 hover:bg-slate-800 text-white font-bold px-8 py-4 rounded-xl transition shadow-lg">
            Bayilik Başvurusu Yap
          </Link>
        </div>
      </section>
    </div>
  );
}
