import React from 'react';
import { StoreProvider } from '@/context/StoreContext';
import { MainLayout } from '@/components/layout/MainLayout';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <StoreProvider>
      <MainLayout>
        {children}
      </MainLayout>
    </StoreProvider>
  );
}
