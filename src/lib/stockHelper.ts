export type StockStatus = 'NORMAL' | 'WARNING' | 'OUT_OF_STOCK';

export interface StockStatusInfo {
  status: StockStatus;
  label: string;
  badgeClass: string;
  dotClass: string;
  textClass: string;
  isAvailable: boolean;
  stockCount: number;
}

/**
 * Centralized stock status and color rules:
 * - stock > 10: NORMAL (Green / Yeşıl)
 * - stock <= 10 && stock > 0: WARNING (Orange / Turuncu)
 * - stock <= 0: OUT_OF_STOCK (Red / Kırmızı)
 */
export function getStockStatus(stock: number | null | undefined, unit: string = 'Adet'): StockStatusInfo {
  const count = Number(stock) || 0;

  if (count <= 0) {
    return {
      status: 'OUT_OF_STOCK',
      label: 'Tükendi',
      badgeClass: 'bg-red-50 dark:bg-rose-950/50 text-red-700 dark:text-rose-400 border border-red-200 dark:border-rose-900/60',
      dotClass: 'bg-red-500',
      textClass: 'text-red-600 dark:text-rose-400',
      isAvailable: false,
      stockCount: 0
    };
  }

  // 1 to 9 items (Kritik Stok < 10)
  if (count < 10) {
    return {
      status: 'WARNING',
      label: `Kritik: ${count} ${unit}`,
      badgeClass: 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900/60',
      dotClass: 'bg-amber-500',
      textClass: 'text-amber-600 dark:text-amber-400',
      isAvailable: true,
      stockCount: count
    };
  }

  // Above 10 items (Stok > 10)
  return {
    status: 'NORMAL',
    label: `Stokta: ${count} ${unit}`,
    badgeClass: 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/60',
    dotClass: 'bg-emerald-500',
    textClass: 'text-emerald-600 dark:text-emerald-400',
    isAvailable: true,
    stockCount: count
  };
}
