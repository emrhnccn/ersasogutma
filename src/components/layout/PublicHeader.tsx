'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Search, User, Menu, X } from 'lucide-react';

export function PublicHeader() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center">
            <Link href="/" className="text-2xl font-black text-sky-700 tracking-tighter">
              ERSA SOĞUTMA
            </Link>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex space-x-8">
            <Link href="/urunler" className="text-slate-600 hover:text-sky-600 font-semibold transition">Ürünler</Link>
            <Link href="/kategoriler" className="text-slate-600 hover:text-sky-600 font-semibold transition">Kategoriler</Link>
            <Link href="/markalar" className="text-slate-600 hover:text-sky-600 font-semibold transition">Markalar</Link>
            <Link href="/kurumsal/hakkimizda" className="text-slate-600 hover:text-sky-600 font-semibold transition">Hakkımızda</Link>
            <Link href="/iletisim" className="text-slate-600 hover:text-sky-600 font-semibold transition">İletişim</Link>
          </nav>

          {/* Right Actions */}
          <div className="flex items-center space-x-4">
            <Link 
              href="/bayi/login" 
              className="hidden sm:flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-xl font-bold transition shadow-md"
            >
              <User className="w-4 h-4" />
              <span>Bayi Girişi</span>
            </Link>
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden text-slate-500 hover:text-sky-600 p-2 transition"
              aria-label="Menüyü aç/kapat"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white shadow-lg">
          <nav className="flex flex-col px-4 py-4 space-y-1">
            <Link
              href="/urunler"
              onClick={() => setIsMobileMenuOpen(false)}
              className="px-4 py-3 text-slate-700 hover:bg-sky-50 hover:text-sky-600 font-semibold rounded-xl transition"
            >
              Ürünler
            </Link>
            <Link
              href="/kategoriler"
              onClick={() => setIsMobileMenuOpen(false)}
              className="px-4 py-3 text-slate-700 hover:bg-sky-50 hover:text-sky-600 font-semibold rounded-xl transition"
            >
              Kategoriler
            </Link>
            <Link
              href="/markalar"
              onClick={() => setIsMobileMenuOpen(false)}
              className="px-4 py-3 text-slate-700 hover:bg-sky-50 hover:text-sky-600 font-semibold rounded-xl transition"
            >
              Markalar
            </Link>
            <Link
              href="/kurumsal/hakkimizda"
              onClick={() => setIsMobileMenuOpen(false)}
              className="px-4 py-3 text-slate-700 hover:bg-sky-50 hover:text-sky-600 font-semibold rounded-xl transition"
            >
              Hakkımızda
            </Link>
            <Link
              href="/iletisim"
              onClick={() => setIsMobileMenuOpen(false)}
              className="px-4 py-3 text-slate-700 hover:bg-sky-50 hover:text-sky-600 font-semibold rounded-xl transition"
            >
              İletişim
            </Link>
            <div className="pt-2 border-t border-slate-100 mt-2">
              <Link
                href="/bayi/login"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-2 px-4 py-3 bg-slate-900 text-white font-bold rounded-xl transition"
              >
                <User className="w-4 h-4" />
                <span>Bayi Girişi</span>
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
