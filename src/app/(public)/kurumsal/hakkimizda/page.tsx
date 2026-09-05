import React from 'react';
import Link from 'next/link';
import { Building2, ShieldCheck, Users, Truck, ArrowRight } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-slate-50 py-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <span className="px-3 py-1 bg-sky-100 text-sky-800 font-bold text-xs rounded-full uppercase tracking-wider">
            Kurumsal
          </span>
          <h1 className="text-4xl font-black text-slate-900 mt-4 tracking-tight">Hakkımızda</h1>
          <p className="text-slate-600 mt-3 text-lg max-w-2xl mx-auto">
            Ersa Soğutma, endüstriyel ve ticari soğutma sistemlerinde toptan yedek parça ve ekipman tedariğinde sektörün öncüsüdür.
          </p>
        </div>

        {/* Story Section */}
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200 shadow-sm space-y-6 text-slate-700 leading-relaxed mb-12">
          <h2 className="text-2xl font-black text-slate-900">Güvenilir Soğutma Çözüm Ortağınız</h2>
          <p>
            Kurulduğumuz günden bu yana, soğutma ve iklimlendirme sektöründeki teknik servisler, bayiler ve endüstriyel işletmeler için en yüksek kalitede kompresör, soğutucu gaz, kontrol ünitesi ve sarf malzemelerini kesintisiz olarak sunmaktayız.
          </p>
          <p>
            Geniş ürün stoğumuz, hızlı lojistik ağımız ve uzman teknik kadromuz ile Türkiye genelinde yüzlerce yetkili servisin ve bayinin 1 numaralı tedarikçisi konumundayız.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-slate-100">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900">%100 Orijinallik</h3>
                <p className="text-xs text-slate-500 mt-1">Resmi distribütör garantili ürünler</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
                <Truck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900">Hızlı Sevkiyat</h3>
                <p className="text-xs text-slate-500 mt-1">Aynı gün kargolama imkanı</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900">Geniş Bayi Ağı</h3>
                <p className="text-xs text-slate-500 mt-1">Türkiye geneli B2B servis altyapısı</p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 text-center text-slate-900 dark:text-white shadow-xs">
          <h2 className="text-2xl font-bold">Ersa Soğutma Bayisi Olun</h2>
          <p className="text-slate-400 mt-2 text-sm max-w-xl mx-auto">
            Özel iskonto oranları, cari ve vadeli çalışma koşulları için hemen bayilik başvurusu yapın.
          </p>
          <Link
            href="/iletisim"
            className="inline-flex items-center gap-2 mt-6 px-6 py-3 bg-sky-500 hover:bg-sky-400 text-white rounded-xl font-bold text-sm transition"
          >
            İletişime Geçin <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
