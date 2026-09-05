'use client';

import React from 'react';
import { FileText, ShieldCheck } from 'lucide-react';

export default function ServiceTermsPage() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto text-xs">
      <div>
        <div className="flex items-center gap-2 text-sky-400 font-bold uppercase tracking-wider mb-1">
          <FileText className="w-4 h-4" />
          <span>Kurumsal & Hukuki Metinler</span>
        </div>
        <h1 className="text-2xl font-black text-white">Bayi Hizmet ve Satış Sözleşmesi</h1>
        <p className="text-slate-400 mt-0.5">
          Ersa Soğutma B2B Bayi Portalı Kullanım ve Ticari Satış Şartları
        </p>
      </div>

      <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-xs rounded-2xl p-6 sm:p-8 shadow-xl space-y-6 text-slate-300 leading-relaxed">
        
        <section className="space-y-2">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider text-sky-400">
            1. TARAFLAR VE AMAÇ
          </h2>
          <p>
            İşbu sözleşme, bir tarafta <strong>Ersa Soğutma Isıtma San. ve Tic. Ltd. Şti.</strong> (bundan böyle &quot;ERSA SOĞUTMA&quot; olarak anılacaktır) ile diğer tarafta bu B2B bayi portalına kaydolan ve sipariş veren ticari işletme (bundan böyle &quot;BAYİ&quot; olarak anılacaktır) arasında akdedilmiştir.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider text-sky-400">
            2. SİPARİŞ VE FİYATLANDIRMA
          </h2>
          <p>
            Portaldaki ürün fiyatları toptan B2B satış fiyatları olup KDV hariç veya dahil olarak açıkça belirtilmiştir. Döviz cinsinden fiyatlandırılan ürünlerin fatura tarihindeki TCMB / Ersa serbest piyasa kuru esas alınarak TL karşılığı fatura edilir.
          </p>
          <p>
            Bayi kademesine göre tanımlanan iskonto oranları (Standart, Silver, Gold) Ersa Soğutma yönetiminin dönemsel değerlendirmelerine ve ciro hedeflerine bağlıdır.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider text-sky-400">
            3. ÖDEME, VADE VE CARİ HESAP İŞLEYİŞİ
          </h2>
          <p>
            Bayi, onayladığı siparişlerin bedelini belirlenen vadede (nakit, havale/EFT, müşteri çeki veya Sanal POS kredi kartı ile) ödemekle yükümlüdür. Vadesi geçen borç bakiyelerine ticari faiz ve iskonto iptali uygulama hakkı ERSA SOĞUTMA&apos;da saklıdır.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider text-sky-400">
            4. SEVKİYAT VE TESLİMAT
          </h2>
          <p>
            Siparişler, stok durumuna göre anlaşmalı kargo firmaları, ambar veya ERSA SOĞUTMA araç filosu ile bayinin sistemde kayıtlı teslimat adresine sevk edilir. Kargo esnasında oluşan hasarlar için teslim anında tutanak tutulması zorunludur.
          </p>
        </section>

        <div className="pt-4 border-t border-slate-800 text-[11px] text-slate-500 flex items-center justify-between">
          <span>Yürürlük Tarihi: 01.01.2026</span>
          <span>Ersa Soğutma Hukuk Müşavirliği</span>
        </div>

      </div>
    </div>
  );
}
