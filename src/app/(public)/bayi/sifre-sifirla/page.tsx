'use client';

import React, { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Lock, CheckCircle, AlertCircle, Eye, EyeOff, ShieldCheck, ArrowLeft } from 'lucide-react';

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token') || '';

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [success, setSuccess] = useState(false);

  // Password requirements calculation
  const hasMinLength = newPassword.length >= 8;
  const hasUppercase = /[A-Z]/.test(newPassword);
  const hasLowercase = /[a-z]/.test(newPassword);
  const hasNumberOrSymbol = /[0-9\W_]/.test(newPassword);
  const isPasswordMatch = newPassword.length > 0 && newPassword === confirmPassword;
  const isFormValid = hasMinLength && hasUppercase && hasLowercase && hasNumberOrSymbol && isPasswordMatch;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token) {
      setErrorMessage('Şifre sıfırlama bağlantısı geçersiz veya eksik.');
      return;
    }

    if (!isFormValid) {
      setErrorMessage('Lütfen tüm şifre güvenliği kriterlerini karşılayınız.');
      return;
    }

    setLoading(true);
    setErrorMessage('');

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setErrorMessage(data.error || 'Şifre güncellenemedi.');
      } else {
        setSuccess(true);
        setTimeout(() => {
          router.push('/bayi/login');
        }, 3000);
      }
    } catch (err) {
      setErrorMessage('Sunucuya bağlanılamadı. Lütfen internet bağlantınızı kontrol edin.');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="text-center space-y-4">
        <div className="w-14 h-14 bg-rose-500/10 text-rose-400 rounded-2xl flex items-center justify-center mx-auto border border-rose-500/20">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-white">Geçersiz Bağlantı</h3>
        <p className="text-sm text-slate-400">
          Şifre sıfırlama kodu bulunamadı. Lütfen e-postanızdaki bağlantıyı kontrol ediniz.
        </p>
        <Link
          href="/bayi/sifremi-unuttum"
          className="inline-flex items-center gap-2 text-sm font-semibold text-sky-400 hover:text-sky-300"
        >
          <ArrowLeft className="w-4 h-4" /> Yeni Bağlantı Talep Et
        </Link>
      </div>
    );
  }

  if (success) {
    return (
      <div className="text-center space-y-6">
        <div className="w-16 h-16 bg-emerald-500/10 text-emerald-400 rounded-2xl flex items-center justify-center mx-auto border border-emerald-500/20">
          <CheckCircle className="w-10 h-10" />
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-bold text-white">Şifreniz Güncellendi</h3>
          <p className="text-sm text-slate-300">
            Yeni şifreniz başarıyla kaydedildi. Giriş ekranına yönlendiriliyorsunuz...
          </p>
        </div>
        <Link
          href="/bayi/login"
          className="inline-flex items-center justify-center w-full py-3 px-4 rounded-xl bg-sky-600 hover:bg-sky-500 font-bold text-sm text-white transition shadow-lg shadow-sky-600/20"
        >
          Giriş Ekranına Git
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1">
          Yeni Şifre
        </label>
        <div className="relative">
          <Lock className="w-5 h-5 text-slate-500 absolute left-3.5 top-3.5" />
          <input
            type={showPassword ? 'text' : 'password'}
            required
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Yeni güçlü şifreniz"
            className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-11 pr-11 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3.5 top-3.5 text-slate-500 hover:text-slate-300"
          >
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1">
          Yeni Şifre (Tekrar)
        </label>
        <div className="relative">
          <Lock className="w-5 h-5 text-slate-500 absolute left-3.5 top-3.5" />
          <input
            type={showPassword ? 'text' : 'password'}
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Şifreyi tekrar giriniz"
            className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-11 pr-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition"
          />
        </div>
      </div>

      {/* Password criteria indicator */}
      <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl space-y-2 text-xs">
        <div className="font-semibold text-slate-400 flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-sky-400" /> Şifre Güvenlik Kriterleri:
        </div>
        <div className="grid grid-cols-2 gap-1.5 pt-1">
          <span className={hasMinLength ? 'text-emerald-400' : 'text-slate-500'}>
            ✓ En az 8 karakter
          </span>
          <span className={hasUppercase ? 'text-emerald-400' : 'text-slate-500'}>
            ✓ Büyük harf (A-Z)
          </span>
          <span className={hasLowercase ? 'text-emerald-400' : 'text-slate-500'}>
            ✓ Küçük harf (a-z)
          </span>
          <span className={hasNumberOrSymbol ? 'text-emerald-400' : 'text-slate-500'}>
            ✓ Sayı veya sembol
          </span>
        </div>
        {newPassword && confirmPassword && (
          <div className={`pt-1 border-t border-slate-800/80 font-medium ${isPasswordMatch ? 'text-emerald-400' : 'text-rose-400'}`}>
            {isPasswordMatch ? '✓ Şifreler birbiriyle eşleşiyor' : '✕ Şifreler eşleşmiyor'}
          </div>
        )}
      </div>

      {errorMessage && (
        <div className="flex items-center gap-2 p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-xs font-medium">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <button
        type="submit"
        disabled={loading || !isFormValid}
        className="w-full flex justify-center items-center gap-2 py-3 px-4 rounded-xl font-bold text-sm text-white bg-sky-600 hover:bg-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500 transition disabled:opacity-50"
      >
        {loading ? 'Şifre Güncelleniyor...' : 'Şifreyi Güncelle ve Kaydet'}
      </button>

      <div className="text-center">
        <Link
          href="/bayi/login"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-slate-200 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Giriş Ekranına Dön
        </Link>
      </div>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center px-4">
        <div className="w-16 h-16 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-sky-500/5">
          <Lock className="w-8 h-8" />
        </div>
        <h2 className="text-3xl font-extrabold text-white tracking-tight">
          Yeni Şifre Belirleyin
        </h2>
        <p className="mt-2 text-sm text-slate-400">
          Lütfen hesabınız için güçlü bir şifre oluşturun.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-slate-900/80 backdrop-blur-xl py-8 px-6 shadow-2xl border border-slate-800 rounded-3xl sm:px-10">
          <Suspense fallback={<div className="text-center text-slate-400 py-6">Yükleniyor...</div>}>
            <ResetPasswordForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
