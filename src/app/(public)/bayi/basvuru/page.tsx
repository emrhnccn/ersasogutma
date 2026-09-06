'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Building2,
  FileCheck2,
  Phone,
  Mail,
  User,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Send,
  ArrowLeft,
  Lock,
  BadgeCheck,
  Percent,
  CreditCard,
  Truck
} from 'lucide-react';
import { ProvinceSelect } from '@/components/common/ProvinceSelect';

export default function BayiBasvuruPage() {
  const [formData, setFormData] = useState({
    companyName: '',
    taxOffice: '',
    taxNumber: '',
    idNumber: '',
    contactPerson: '',
    city: '',
    address: '',
    email: '',
    phone: '',
    notes: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const validate = () => {
    const errs: Record<string, string> = {};

    if (!formData.companyName.trim()) {
      errs.companyName = 'Firma resmi ünvanı zorunludur.';
    }

    if (!formData.taxOffice.trim()) {
      errs.taxOffice = 'Vergi dairesi zorunludur.';
    }

    const cleanTaxNo = formData.taxNumber.trim().replace(/\D/g, '');
    if (!cleanTaxNo || cleanTaxNo.length < 10) {
      errs.taxNumber = 'Vergi numarası en az 10 haneli olmalıdır.';
    }

    if (formData.idNumber.trim()) {
      const cleanTc = formData.idNumber.trim().replace(/\D/g, '');
      if (cleanTc.length !== 11) {
        errs.idNumber = 'T.C. Kimlik Numarası 11 haneli rakam olmalıdır.';
      }
    }

    if (!formData.contactPerson.trim()) {
      errs.contactPerson = 'Yetkili isim ve soyisim zorunludur.';
    }

    if (!formData.city.trim()) {
      errs.city = 'Lütfen Türkiye\'nin 81 ilinden birini seçiniz.';
    }

    if (!formData.address.trim()) {
      errs.address = 'Açık adres bilgisi zorunludur.';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim() || !emailRegex.test(formData.email.trim())) {
      errs.email = 'Geçerli bir kurumsal e-posta adresi giriniz.';
    }

    const cleanPhone = formData.phone.trim().replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      errs.phone = 'Geçerli bir telefon numarası giriniz (Örn: 05XX XXX XX XX).';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch('/api/dealer-applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName: formData.companyName.trim(),
          taxOffice: formData.taxOffice.trim(),
          taxNumber: formData.taxNumber.trim(),
          idNumber: formData.idNumber.trim() || undefined,
          contactPerson: formData.contactPerson.trim(),
          city: formData.city.trim(),
          address: formData.address.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim(),
          notes: formData.notes.trim()
        })
      });

      const json = await res.json();

      if (json.success) {
        setSubmitted(true);
      } else {
        setServerError(json.error || 'Başvuru gönderilirken bir hata oluştu.');
      }
    } catch {
      setServerError('Sunucuya bağlanılamadı. Lütfen internet bağlantınızı kontrol edip tekrar deneyiniz.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#090D16] py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-200">
      <div className="max-w-4xl mx-auto">
        
        {/* Navigation Breadcrumb */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/bayi/login"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Bayi Giriş Sayfasına Dön</span>
          </Link>
          <span className="text-xs text-slate-400">Ersa Soğutma B2B Bayilik Başvurusu</span>
        </div>

        {/* Header Hero Banner */}
        <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-10 shadow-xl mb-8 relative overflow-hidden">
          <div className="relative z-10">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800/60">
              <BadgeCheck className="w-4 h-4" />
              <span>Yetkili B2B Bayilik Ağı</span>
            </span>

            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white mt-4 tracking-tight">
              Ersa Soğutma Bayilik Başvuru Formu
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-2 text-sm sm:text-base max-w-2xl leading-relaxed">
              HVAC, soğutma sistemleri, kompresör ve toptan gaz ihtiyaçlarınız için özel iskonto oranları, cari hesap ve vadeli alım avantajlarıyla B2B bayimiz olun.
            </p>

            {/* Benefit Highlights */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <Percent className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-xs text-slate-900 dark:text-white">%40&apos;a Varan Özel İskonto</h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Toptan bayi fiyatları</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-xs text-slate-900 dark:text-white">Açık Hesap & Cari Limit</h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Onaylı cari limit desteği</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-xs text-slate-900 dark:text-white">Aynı Gün Hızlı Sevkiyat</h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Darıca & Kocaeli depo çıkışlı</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Form or Success State */}
        <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-10 shadow-xl">
          {submitted ? (
            <div className="text-center py-12 space-y-4">
              <div className="w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto ring-8 ring-emerald-50 dark:ring-emerald-950/30">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <h2 className="text-2xl font-black text-slate-900 dark:text-white">
                Bayilik Başvurunuz Başarıyla Alındı!
              </h2>

              <p className="text-slate-600 dark:text-slate-400 text-sm max-w-lg mx-auto leading-relaxed">
                <strong className="text-slate-900 dark:text-white">&ldquo;{formData.companyName}&rdquo;</strong> için başvurunuz yönetim panelimize iletilmiştir. Bilgileriniz incelendikten sonra bayi kodunuz ve geçici şifreniz SMS/E-posta ile tarafınıza iletilecektir.
              </p>

              <div className="pt-6 flex flex-wrap justify-center gap-3">
                <Link
                  href="/bayi/login"
                  className="px-6 py-3 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-xl shadow-lg transition"
                >
                  Bayi Giriş Ekranına Git
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setSubmitted(false);
                    setFormData({
                      companyName: '',
                      taxOffice: '',
                      taxNumber: '',
                      idNumber: '',
                      contactPerson: '',
                      city: '',
                      address: '',
                      email: '',
                      phone: '',
                      notes: ''
                    });
                  }}
                  className="px-6 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl transition"
                >
                  Yeni Başvuru Yap
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-8">
              {serverError && (
                <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex items-start gap-3 text-rose-800 dark:text-rose-200 text-xs">
                  <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="font-bold block">Başvuru Gönderilemedi</strong>
                    <span>{serverError}</span>
                  </div>
                </div>
              )}

              {/* 1. Kurumsal & Vergi Bilgileri */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                  <Building2 className="w-5 h-5 text-sky-500" />
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">
                    1. Firma ve Vergi Bilgileri
                  </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {/* Firma Ünvanı */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Firma Resmi Ünvanı <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.companyName}
                      onChange={(e) => {
                        setFormData({ ...formData, companyName: e.target.value });
                        if (errors.companyName) setErrors({ ...errors, companyName: '' });
                      }}
                      placeholder="Örn: Ersa Soğutma Isıtma San. ve Tic. Ltd. Şti."
                      className={`w-full px-4 py-3 rounded-xl border text-sm transition ${
                        errors.companyName
                          ? 'border-rose-400 bg-rose-50/50 dark:bg-rose-950/20'
                          : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#0B1120]'
                      } text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500`}
                    />
                    {errors.companyName && (
                      <p className="text-[11px] text-rose-600 dark:text-rose-400 font-semibold mt-1">
                        {errors.companyName}
                      </p>
                    )}
                  </div>

                  {/* Vergi Dairesi */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Vergi Dairesi <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.taxOffice}
                      onChange={(e) => {
                        setFormData({ ...formData, taxOffice: e.target.value });
                        if (errors.taxOffice) setErrors({ ...errors, taxOffice: '' });
                      }}
                      placeholder="Örn: Uluçınar Vergi Dairesi"
                      className={`w-full px-4 py-3 rounded-xl border text-sm transition ${
                        errors.taxOffice
                          ? 'border-rose-400 bg-rose-50/50 dark:bg-rose-950/20'
                          : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#0B1120]'
                      } text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500`}
                    />
                    {errors.taxOffice && (
                      <p className="text-[11px] text-rose-600 dark:text-rose-400 font-semibold mt-1">
                        {errors.taxOffice}
                      </p>
                    )}
                  </div>

                  {/* Vergi Numarası */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Vergi Numarası <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      maxLength={11}
                      value={formData.taxNumber}
                      onChange={(e) => {
                        setFormData({ ...formData, taxNumber: e.target.value });
                        if (errors.taxNumber) setErrors({ ...errors, taxNumber: '' });
                      }}
                      placeholder="10 Haneli Vergi Numarası"
                      className={`w-full px-4 py-3 rounded-xl border text-sm font-mono transition ${
                        errors.taxNumber
                          ? 'border-rose-400 bg-rose-50/50 dark:bg-rose-950/20'
                          : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#0B1120]'
                      } text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500`}
                    />
                    {errors.taxNumber && (
                      <p className="text-[11px] text-rose-600 dark:text-rose-400 font-semibold mt-1">
                        {errors.taxNumber}
                      </p>
                    )}
                  </div>

                  {/* T.C. Kimlik No (Şahıs Firmaları için Ek Alan) */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      T.C. Kimlik Numarası <span className="text-slate-400 font-normal">(Şahıs Şirketleri / Opsiyonel)</span>
                    </label>
                    <input
                      type="text"
                      maxLength={11}
                      value={formData.idNumber}
                      onChange={(e) => {
                        setFormData({ ...formData, idNumber: e.target.value });
                        if (errors.idNumber) setErrors({ ...errors, idNumber: '' });
                      }}
                      placeholder="11 Haneli T.C. Kimlik No"
                      className={`w-full px-4 py-3 rounded-xl border text-sm font-mono transition ${
                        errors.idNumber
                          ? 'border-rose-400 bg-rose-50/50 dark:bg-rose-950/20'
                          : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#0B1120]'
                      } text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500`}
                    />
                    {errors.idNumber && (
                      <p className="text-[11px] text-rose-600 dark:text-rose-400 font-semibold mt-1">
                        {errors.idNumber}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* 2. Yetkili & İletişim Bilgileri */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                  <User className="w-5 h-5 text-sky-500" />
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">
                    2. Yetkili ve İletişim Bilgileri
                  </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {/* İsim Soyisim */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Yetkili İsim ve Soyisim <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.contactPerson}
                      onChange={(e) => {
                        setFormData({ ...formData, contactPerson: e.target.value });
                        if (errors.contactPerson) setErrors({ ...errors, contactPerson: '' });
                      }}
                      placeholder="Adınız Soyadınız"
                      className={`w-full px-4 py-3 rounded-xl border text-sm transition ${
                        errors.contactPerson
                          ? 'border-rose-400 bg-rose-50/50 dark:bg-rose-950/20'
                          : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#0B1120]'
                      } text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500`}
                    />
                    {errors.contactPerson && (
                      <p className="text-[11px] text-rose-600 dark:text-rose-400 font-semibold mt-1">
                        {errors.contactPerson}
                      </p>
                    )}
                  </div>

                  {/* Telefon */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Telefon Numarası (Giriş & SMS) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => {
                        setFormData({ ...formData, phone: e.target.value });
                        if (errors.phone) setErrors({ ...errors, phone: '' });
                      }}
                      placeholder="05XX XXX XX XX"
                      className={`w-full px-4 py-3 rounded-xl border text-sm font-mono transition ${
                        errors.phone
                          ? 'border-rose-400 bg-rose-50/50 dark:bg-rose-950/20'
                          : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#0B1120]'
                      } text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500`}
                    />
                    {errors.phone && (
                      <p className="text-[11px] text-rose-600 dark:text-rose-400 font-semibold mt-1">
                        {errors.phone}
                      </p>
                    )}
                  </div>

                  {/* E-posta Adresi */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Kurumsal E-posta Adresi <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => {
                        setFormData({ ...formData, email: e.target.value });
                        if (errors.email) setErrors({ ...errors, email: '' });
                      }}
                      placeholder="ornek@firma.com"
                      className={`w-full px-4 py-3 rounded-xl border text-sm transition ${
                        errors.email
                          ? 'border-rose-400 bg-rose-50/50 dark:bg-rose-950/20'
                          : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#0B1120]'
                      } text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500`}
                    />
                    {errors.email && (
                      <p className="text-[11px] text-rose-600 dark:text-rose-400 font-semibold mt-1">
                        {errors.email}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* 3. Konum & Açık Adres (81 İl Searchable Dropdown) */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                  <MapPin className="w-5 h-5 text-sky-500" />
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">
                    3. Konum ve Açık Adres Bilgileri
                  </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {/* İl Seçimi (81 İl Dropdown) */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Faaliyet İli (81 İl) <span className="text-rose-500">*</span>
                    </label>
                    <ProvinceSelect
                      value={formData.city}
                      onChange={(city) => {
                        setFormData({ ...formData, city });
                        if (errors.city) setErrors({ ...errors, city: '' });
                      }}
                      error={errors.city}
                      required
                    />
                    {errors.city && (
                      <p className="text-[11px] text-rose-600 dark:text-rose-400 font-semibold mt-1">
                        {errors.city}
                      </p>
                    )}
                  </div>

                  {/* Açık Adres */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Firma / Sevkiyat Açık Adresi <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      rows={3}
                      value={formData.address}
                      onChange={(e) => {
                        setFormData({ ...formData, address: e.target.value });
                        if (errors.address) setErrors({ ...errors, address: '' });
                      }}
                      placeholder="Mahalle, cadde, sokak, bina ve kapı no, ilçe/posta kodu..."
                      className={`w-full px-4 py-3 rounded-xl border text-sm transition ${
                        errors.address
                          ? 'border-rose-400 bg-rose-50/50 dark:bg-rose-950/20'
                          : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#0B1120]'
                      } text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500`}
                    />
                    {errors.address && (
                      <p className="text-[11px] text-rose-600 dark:text-rose-400 font-semibold mt-1">
                        {errors.address}
                      </p>
                    )}
                  </div>

                  {/* Başvuru Notu / Mesaj */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Faaliyet Alanınız & Ek Notlar <span className="text-slate-400 font-normal">(Opsiyonel)</span>
                    </label>
                    <textarea
                      rows={2}
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="Servis, montaj, yedek parça satışı vb. faaliyet alanınızı veya ek taleplerinizi belirtebilirsiniz..."
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#0B1120] text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Bilgileriniz 256-bit SSL güvencesiyle korunmaktadır.</span>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full sm:w-auto px-8 py-3.5 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white font-bold text-sm rounded-xl shadow-lg shadow-sky-600/20 transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>{isSubmitting ? 'Başvuru Gönderiliyor...' : 'Bayilik Başvurusunu Tamamla'}</span>
                </button>
              </div>
            </form>
          )}
        </div>

      </div>
    </div>
  );
}
