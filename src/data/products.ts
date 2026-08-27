import { Product } from '@/types';

// Products are now fetched from MongoDB via API
export const PRODUCTS: Product[] = [];

export const INITIAL_EXCHANGE_RATES = {
  USD_TRY: 38.45,
  EUR_TRY: 42.10,
  GBP_TRY: 48.90,
  lastUpdated: new Date().toISOString()
};
