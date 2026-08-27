'use client';

import React, { useState } from 'react';
import { CurrencyTicker } from './CurrencyTicker';
import { Header } from './Header';
import { Sidebar } from './Sidebar';

export function MainLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 selection:bg-sky-500 selection:text-white">
      {/* 1. Top Real-Time Exchange Rate & Ticker Bar */}
      <CurrencyTicker />

      {/* 2. Main Sticky Header */}
      <Header
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        isSidebarOpen={sidebarOpen}
      />

      {/* 3. Main Body Structure (Sidebar + Content) */}
      <div className="flex-1 flex">
        {/* Left Vertical Navigation */}
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        {/* Dynamic Page Content */}
        <main className="flex-1 w-full lg:pl-72 transition-all duration-300 min-h-[calc(100vh-100px)]">
          <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
