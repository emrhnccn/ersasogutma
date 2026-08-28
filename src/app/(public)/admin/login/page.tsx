import React from 'react';
import Link from 'next/link';
import { Lock, Shield, ArrowRight } from 'lucide-react';

export default function AdminLoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
        <div className="bg-slate-950 p-8 text-center border-b border-slate-800">
          <div className="mx-auto w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mb-4">
            <Shield className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black text-white">YÖNETİM PANELİ</h2>
          <p className="mt-2 text-slate-400 text-sm">Sadece yetkili personel erişebilir</p>
        </div>
        
        <div className="p-8">
          <form className="space-y-6" action="/admin">
            {/* Note: Action is purely mock for Phase 1 to redirect to /admin */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Yönetici Kullanıcı Adı
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  className="block w-full px-4 py-3 border border-slate-700 rounded-xl bg-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition"
                  placeholder="Kullanıcı adınızı girin"
                  defaultValue="ersaticaret"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Şifre
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  className="block w-full px-4 py-3 border border-slate-700 rounded-xl bg-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition"
                  placeholder="Şifrenizi girin"
                  defaultValue="admin123"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition"
              >
                Giriş Yap <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
          
          <div className="mt-8 text-center text-sm text-slate-500">
            <Link href="/" className="font-bold hover:text-white transition">
              &larr; Siteye Dön
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
