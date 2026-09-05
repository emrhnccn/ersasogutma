'use client';

import React from 'react';
import { Lock, ShieldCheck, CheckCircle2 } from 'lucide-react';

export default function PrivacyPolicyPage() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto text-xs">
      <div>
        <div className="flex items-center gap-2 text-emerald-400 font-bold uppercase tracking-wider mb-1">
          <Lock className="w-4 h-4" />
          <span>Veri Güvenliği & KVKK</span>
        </div>
        <h1 className="text-2xl font-black text-white">Güvenlik ve Gizlilik Politikası</h1>
        <p className="text-slate-400 mt-0.5">
          256-Bit SSL Şifreleme, Kredi Kartı Güvenliği ve KVKK Aydınlatma Metni
        </p>
      </div>

      <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-xs rounded-2xl p-6 sm:p-8 shadow-xl space-y-6 text-slate-300 leading-relaxed">
        
        <div className="p-4 bg-slate-50 dark:bg-[#0B1120] rounded-xl border border-slate-200 dark:border-slate-800 flex items-center gap-3">
          <ShieldCheck className="w-8 h-8 text-emerald-400 flex-shrink-0" />
          <div>
            <div className="font-bold text-white text-sm">256-Bit SSL Sertifikalı Güvenli Altyapı</div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Bayi portalımızdaki tüm veri transferi uluslararası bankacılık standardı olan SHA-256 bit SSL sertifikasıyla korunmaktadır.
            </div>
          </div>
        </div>

        <section className="space-y-2">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider text-emerald-400">
            1. KREDİ KARTI VE SANAL POS GÜVENLİĞİ
          </h2>
          <p>
            Ersa Soğutma B2B Sanal POS sisteminde kart bilgileriniz sunucularımızda kesinlikle <strong>saklanmaz ve kaydedilmez</strong>. Ödeme anında girilen kart verileri doğrudan bankanın güvenli 3D Secure sistemine iletilir ve bankadan SMS onay kodu gelmeden tahsilat gerçekleştirilmez.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider text-emerald-400">
            2. BAYİ VERİLERİNİN KORUNMASI (KVKK)
          </h2>
          <p>
            6698 sayılı Kişisel Verilerin Korunması Kanunu uyarınca, bayilerimize ait şirket unvanı, yetkili iletişim bilgileri ve ticari hareketler yalnızca sipariş karşılama, sevkiyat, faturalama ve cari hesap mutabakatı amaçlarıyla işlenir ve üçüncü taraflarla paylaşılmaz.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider text-emerald-400">
            3. ÇEREZ (COOKIE) POLİTİKASI
          </h2>
          <p>
            Sistemde bayi oturumunuzun aktif kalması, sepetinizin korunması ve hızlandırılmış filtreleme yapılabilmesi amacıyla zorunlu oturum çerezleri kullanılmaktadır.
          </p>
        </section>

      </div>
    </div>
  );
}
