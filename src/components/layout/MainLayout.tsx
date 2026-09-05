'use client';

import React, { useState } from 'react';
import { CurrencyTicker } from './CurrencyTicker';
import { Header } from './Header';
import { Sidebar } from './Sidebar';

export function MainLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-900 dark:bg-[#090D16] dark:text-slate-100 selection:bg-blue-600 selection:text-white transition-colors duration-200">
      {/* 1. Left Vertical Navigation (Full height) */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* 2. Main Content Column */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-72 transition-all duration-300">
        <CurrencyTicker />
        <Header
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          isSidebarOpen={sidebarOpen}
        />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
