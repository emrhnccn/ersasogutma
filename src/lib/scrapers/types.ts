export interface ScrapedImage {
  url: string;
  originalUrl?: string;
  alt?: string;
  sortOrder: number;
}

export interface ScrapedCategory {
  externalId: string;
  name: string;
  slug: string;
  parentExternalId?: string;
  parentName?: string;
  imageUrl?: string;
}

export interface ScrapedProduct {
  externalId: string;
  name: string;
  slug: string;
  sku: string;
  barcode?: string;
  description?: string;
  specsJson?: Record<string, string>;
  brandName?: string;
  categoryName?: string;
  categoryExternalId?: string;
  categoryPath?: string[];
  unit?: string;
  vatRate?: number;
  currency?: string;
  costPrice?: number;
  salePrice?: number;
  stockStatus: 'IN_STOCK' | 'OUT_OF_STOCK';
  stockQty: number;
  images: ScrapedImage[];
  sourceSupplier: string;
  sourceUrl: string;
}

export interface ScraperLog {
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'success';
  message: string;
}

export interface ScraperProgress {
  providerId: string;
  status: 'idle' | 'running' | 'completed' | 'failed' | 'stopped';
  totalCategories: number;
  processedCategories: number;
  totalProducts: number;
  importedProducts: number;
  updatedProducts: number;
  failedProducts: number;
  currentStep: string;
  percent: number;
  startedAt?: string;
  finishedAt?: string;
  logs: ScraperLog[];
}

export interface ScrapeOptions {
  targetUrl?: string; // e.g. "https://www.ersaticaret.com" or custom supplier URL
  username?: string;
  password?: string;
  maxProducts?: number;
  autoPublish?: boolean;
}

export interface ISupplierScraper {
  readonly id: string;
  readonly name: string;
  readonly baseUrl: string;
  
  scrape(
    options: ScrapeOptions,
    onProgress: (progress: Partial<ScraperProgress>) => void,
    onLog: (log: ScraperLog) => void
  ): Promise<void>;

  stop(): void;
}
