import React from 'react';
import { StoreProvider } from '@/context/StoreContext';
import { AdminShell } from '@/components/layout/AdminShell';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <StoreProvider>
      <AdminShell>
        {children}
      </AdminShell>
    </StoreProvider>
  );
}
