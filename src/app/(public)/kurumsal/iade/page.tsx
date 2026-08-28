'use client';

import React from 'react';
import { RotateCcw, AlertTriangle, CheckCircle2 } from 'lucide-react';

export default function ReturnPolicyPage() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto text-xs">
      <div>
        <div className="flex items-center gap-2 text-rose-400 font-bold uppercase tracking-wider mb-1">
          <RotateCcw className="w-4 h-4" />
          <span>Garanti & İade Prosedürü</span>
        </div>
        <h1 className="text-2xl font-black text-white">İade ve Değişim Şartları</h1>
        <p className="text-slate-400 mt-0.5">
          Toptan B2B parça alımlarında iade ve servis değişim süreçleri
        </p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl space-y-6 text-slate-300 leading-relaxed">
        
        <div className="p-4 bg-amber-950/30 rounded-xl border border-amber-800/40 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <div className="font-bold text-white text-xs">Önemli İade Kuralı:</div>
            <div className="text-[11px] text-slate-300 mt-0.5">
              İade edilecek ürünlerin orijinal ambalajının bozulmamış, montaj lehim / gaz bağlantısı yapılmamış ve yeniden satılabilir durumda olması şarttır.
            </div>
          </div>
        </div>

        <section className="space-y-2">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider text-rose-400">
            1. İADE SÜRESİ VE BİLDİRİM
          </h2>
          <p>
            Bayilerimiz, teslim aldıkları tarihten itibaren <strong>7 (yedi) iş günü</strong> içerisinde hasarlı, eksik veya hatalı sipariş edilen ürünler için sistem üzerinden veya müşteri temsilcisine iade talebi oluşturmalıdır.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider text-rose-400">
            2. İADE FATURASI ZORUNLULUĞU
          </h2>
          <p>
            Kurumsal bayiler, iade edilecek malzemeler için Ersa Soğutma adına düzenlenmiş resmi <strong>E-İade Faturası</strong> veya <strong>E-Arşiv İade Faturası</strong> kesmek zorundadır. Faturasız gelen kargolar kabul edilmemektedir.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider text-rose-400">
            3. KOMPRESÖR VE ELEKTRONİK KART GARANTİ İADESİ
          </h2>
          <p>
            Hermetik kompresörlerde fabrika kaynaklı sargı arızası durumlarında, kompresör tüp giriş-çıkışları hava almayacak şekilde kapalı olarak servis formumuzla birlikte incelenmek üzere fabrikaya sevk edilir. Test raporu onaylandığında cari hesaba anında alacak kaydı açılır.
          </p>
        </section>

      </div>
    </div>
  );
}
