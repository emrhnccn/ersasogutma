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
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#090D16] py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-200">
      <div className="max-w-md w-full bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden transition-colors duration-200">
        <div className="bg-slate-50 dark:bg-[#0B1120] p-8 text-center border-b border-slate-200 dark:border-slate-800">
          <h2 className="text-3xl font-black text-sky-600 dark:text-sky-400">ERSA SOĞUTMA</h2>
          <p className="mt-2 text-slate-600 dark:text-slate-400 text-sm font-medium">B2B Bayi Portalı Girişi</p>
        </div>
        
        <div className="p-8">
          <form className="space-y-6" action={formAction}>
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Kullanıcı Adı veya Bayi Kodu
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-slate-400 dark:text-slate-500" />
                </div>
                <input
                  type="text"
                  name="username"
                  required
                  className="block w-full pl-10 pr-3 py-3 border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition"
                  placeholder="Bayi kodunuzu girin"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Şifre
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400 dark:text-slate-500" />
                </div>
                <input
                  type="password"
                  name="password"
                  required
                  className="block w-full pl-10 pr-3 py-3 border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition"
                  placeholder="Şifrenizi girin"
                />
              </div>
            </div>

            {errorMessage && (
              <div className="text-red-600 dark:text-red-400 text-sm font-semibold text-center bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 py-2.5 rounded-xl">
                {errorMessage}
              </div>
            )}

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-sky-600 focus:ring-sky-500 border-slate-300 dark:border-slate-700 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-slate-700 dark:text-slate-300 cursor-pointer">
                  Beni Hatırla
                </label>
              </div>

              <div className="text-sm">
                <Link href="/bayi/sifremi-unuttum" className="font-semibold text-sky-600 dark:text-sky-400 hover:text-sky-500">
                  Şifremi Unuttum
                </Link>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isPending}
                className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 transition disabled:opacity-50 cursor-pointer"
              >
                {isPending ? 'Giriş Yapılıyor...' : 'Giriş Yap'} <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
          
          <div className="mt-8 text-center text-sm text-slate-500 dark:text-slate-400">
            Henüz bayi değil misiniz?{' '}
            <Link href="/iletisim" className="font-bold text-sky-600 dark:text-sky-400 hover:text-sky-500">
              Bayilik Başvurusu Yapın
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
