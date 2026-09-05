'use client';

import React, { useActionState } from 'react';
import Link from 'next/link';
import { Lock, User, ArrowRight } from 'lucide-react';
import { authenticateBayi } from '@/lib/actions';

export default function BayiLoginPage() {
  const [errorMessage, formAction, isPending] = useActionState(
    authenticateBayi,
    undefined,
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-slate-900 p-8 text-center">
          <h2 className="text-3xl font-black text-sky-400">ERSA SOĞUTMA</h2>
          <p className="mt-2 text-slate-300">B2B Bayi Portalı Girişi</p>
        </div>
        
        <div className="p-8">
          <form className="space-y-6" action={formAction}>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Kullanıcı Adı veya Bayi Kodu
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="text"
                  name="username"
                  required
                  className="block w-full pl-10 pr-3 py-3 border border-slate-300 rounded-xl bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition"
                  placeholder="Bayi kodunuzu girin"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Şifre
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="password"
                  name="password"
                  required
                  className="block w-full pl-10 pr-3 py-3 border border-slate-300 rounded-xl bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition"
                  placeholder="Şifrenizi girin"
                />
              </div>
            </div>

            {errorMessage && (
              <div className="text-red-500 text-sm font-semibold text-center bg-red-50 py-2 rounded-lg">
                {errorMessage}
              </div>
            )}

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-sky-600 focus:ring-sky-500 border-slate-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-slate-700">
                  Beni Hatırla
                </label>
              </div>

              <div className="text-sm">
                <Link href="/bayi/sifremi-unuttum" className="font-medium text-sky-600 hover:text-sky-500">
                  Şifremi Unuttum
                </Link>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isPending}
                className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 transition disabled:opacity-50"
              >
                {isPending ? 'Giriş Yapılıyor...' : 'Giriş Yap'} <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
          
          <div className="mt-8 text-center text-sm text-slate-500">
            Henüz bayi değil misiniz?{' '}
            <Link href="/iletisim" className="font-bold text-sky-600 hover:text-sky-500">
              Bayilik Başvurusu Yapın
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
