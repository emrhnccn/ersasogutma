'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Mail, CheckCircle, AlertCircle, KeyRound, ArrowRight } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [identifier, setIdentifier] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successInfo, setSuccessInfo] = useState<{ message: string; resetUrl?: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) {
      setErrorMessage('Lütfen kullanıcı adı veya e-posta adresinizi giriniz.');
      return;
    }

    setLoading(true);
    setErrorMessage('');
    setSuccessInfo(null);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: identifier.trim() })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setErrorMessage(data.error || 'İşlem gerçekleştirilemedi. Lütfen tekrar deneyin.');
      } else {
        setSuccessInfo({
          message: data.message,
          resetUrl: data.resetUrl
        });
      }
    } catch (err) {
      setErrorMessage('Sunucuya bağlanılamadı. Lütfen internet bağlantınızı kontrol edin.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#090D16] flex flex-col justify-center py-12 sm:px-6 lg:px-8 transition-colors duration-200">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center px-4">
        <div className="w-16 h-16 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-sky-600 dark:text-sky-400 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-sky-500/5">
          <KeyRound className="w-8 h-8" />
        </div>
        <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Şifremi Unuttum
        </h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 font-medium">
          Bayi hesabınıza ait kullanıcı adı veya kayıtlı e-posta adresinizi girin.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white dark:bg-[#111827] py-8 px-6 shadow-xl border border-slate-200 dark:border-slate-800 rounded-3xl sm:px-10 transition-colors duration-200">
          {successInfo ? (
            <div className="space-y-6 text-center">
              <div className="w-14 h-14 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center mx-auto">
                <CheckCircle className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Talep Alındı</h3>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  {successInfo.message}
                </p>
              </div>

              {successInfo.resetUrl && (
                <div className="p-4 bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800/40 rounded-2xl text-left space-y-2">
                  <div className="text-xs font-semibold text-sky-700 dark:text-sky-400 uppercase tracking-wider">
                    Test / Doğrulama Bağlantısı
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Sistem tarafından oluşturulan güvenli sıfırlama linki:
                  </p>
                  <Link
                    href={successInfo.resetUrl}
                    className="inline-flex items-center gap-2 text-xs font-bold text-sky-600 dark:text-sky-300 hover:text-sky-800 dark:hover:text-sky-200 underline break-all"
                  >
                    Şifreyi Şimdi Sıfırla <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              )}

              <div className="pt-2">
                <Link
                  href="/bayi/login"
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-sm font-semibold text-slate-800 dark:text-white transition"
                >
                  <ArrowLeft className="w-4 h-4" /> Giriş Ekranına Dön
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="identifier" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Kullanıcı Adı veya E-Posta
                </label>
                <div className="relative">
                  <Mail className="w-5 h-5 text-slate-400 dark:text-slate-500 absolute left-3.5 top-3.5" />
                  <input
                    id="identifier"
                    type="text"
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="bayi123456 veya info@firma.com"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl pl-11 pr-4 py-3 text-sm placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition"
                  />
                </div>
              </div>

              {errorMessage && (
                <div className="flex items-center gap-2 p-3 bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 rounded-xl text-xs font-medium">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center gap-2 py-3 px-4 rounded-xl font-bold text-sm text-white bg-sky-600 hover:bg-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 transition disabled:opacity-50 cursor-pointer"
              >
                {loading ? 'Bağlantı Gönderiliyor...' : 'Sıfırlama Bağlantısı Gönder'}
              </button>

              <div className="text-center">
                <Link
                  href="/bayi/login"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Giriş Ekranına Dön
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
