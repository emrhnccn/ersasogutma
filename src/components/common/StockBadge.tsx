'use client';

import React from 'react';
import { getStockStatus } from '@/lib/stockHelper';
import { CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';

interface StockBadgeProps {
  stock: number | null | undefined;
  unit?: string;
  showIcon?: boolean;
  size?: 'sm' | 'md';
  className?: string;
}

export function StockBadge({
  stock,
  unit = 'Adet',
  showIcon = true,
  size = 'sm',
  className = ''
}: StockBadgeProps) {
  const info = getStockStatus(stock, unit);

  const getIcon = () => {
    if (!showIcon) return null;
    const iconSize = size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5';

    switch (info.status) {
      case 'OUT_OF_STOCK':
        return <XCircle className={iconSize} />;
      case 'WARNING':
        return <AlertTriangle className={iconSize} />;
      case 'NORMAL':
      default:
        return <CheckCircle2 className={iconSize} />;
    }
  };

  const padSize = size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-bold transition select-none ${padSize} ${info.badgeClass} ${className}`}
      title={`Mevcut Stok: ${info.stockCount} ${unit}`}
    >
      {getIcon()}
      <span>{info.label}</span>
    </span>
  );
}
