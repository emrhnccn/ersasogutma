'use client';

import React from 'react';

export function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-[#070B14] dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      {children}
    </div>
  );
}

