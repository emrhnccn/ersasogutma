import React from 'react';
import Link from 'next/link';
import { Search, ShoppingCart, User, Menu } from 'lucide-react';

export function PublicHeader() {
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
            <button className="text-slate-500 hover:text-sky-600 p-2">
              <Search className="w-5 h-5" />
            </button>
            <button className="text-slate-500 hover:text-sky-600 p-2 relative">
              <ShoppingCart className="w-5 h-5" />
              <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-bold leading-none text-white bg-amber-500 rounded-full">
                0
              </span>
            </button>
            <Link 
              href="/bayi/login" 
              className="hidden sm:flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-xl font-bold transition shadow-md"
            >
              <User className="w-4 h-4" />
              <span>Bayi Girişi</span>
            </Link>
            <button className="md:hidden text-slate-500 p-2">
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
