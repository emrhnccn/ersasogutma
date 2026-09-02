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
 * - stock >= 10: NORMAL (Green / Active)
 * - stock >= 1 && stock < 10 (1 to 9): WARNING (Orange / Critical)
 * - stock <= 0: OUT_OF_STOCK (Red / Depleted)
 */
export function getStockStatus(stock: number | null | undefined, unit: string = 'Adet'): StockStatusInfo {
  const count = Number(stock) || 0;

  if (count <= 0) {
    return {
      status: 'OUT_OF_STOCK',
      label: 'Tükendi',
      badgeClass: 'bg-rose-500/20 text-rose-400 border border-rose-500/30',
      dotClass: 'bg-rose-500',
      textClass: 'text-rose-400',
      isAvailable: false,
      stockCount: 0
    };
  }

  // 1 to 9 items
  if (count < 10) {
    return {
      status: 'WARNING',
      label: `Son ${count} ${unit}`,
      badgeClass: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
      dotClass: 'bg-amber-400',
      textClass: 'text-amber-400',
      isAvailable: true,
      stockCount: count
    };
  }

  // 10 and above
  return {
    status: 'NORMAL',
    label: `Stokta: ${count} ${unit}`,
    badgeClass: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
    dotClass: 'bg-emerald-400',
    textClass: 'text-emerald-400',
    isAvailable: true,
    stockCount: count
  };
}
