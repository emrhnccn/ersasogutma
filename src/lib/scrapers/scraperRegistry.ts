import { ISupplierScraper, ScraperProgress, ScraperLog, ScrapeOptions } from './types';
import { GirdapScraper } from './girdapScraper';

class ScraperRegistry {
  private scrapers: Map<string, ISupplierScraper> = new Map();
  private currentProgress: ScraperProgress = {
    providerId: 'girdap',
    status: 'idle',
    totalCategories: 0,
    processedCategories: 0,
    totalProducts: 0,
    importedProducts: 0,
    updatedProducts: 0,
    failedProducts: 0,
    currentStep: 'Beklemede',
    percent: 0,
    logs: []
  };
  private isScraping = false;

  constructor() {
    this.register(new GirdapScraper());
  }

  register(scraper: ISupplierScraper) {
    this.scrapers.set(scraper.id, scraper);
  }

  getScraper(id: string): ISupplierScraper | undefined {
    return this.scrapers.get(id);
  }

  getAllScrapers(): { id: string; name: string; baseUrl: string }[] {
    return Array.from(this.scrapers.values()).map((s) => ({
      id: s.id,
      name: s.name,
      baseUrl: s.baseUrl
    }));
  }

  getProgress(): ScraperProgress {
    return this.currentProgress;
  }

  async startScrape(providerId: string, options: ScrapeOptions = {}): Promise<boolean> {
    if (this.isScraping) {
      return false; // Already running
    }

    const scraper = this.scrapers.get(providerId);
    if (!scraper) {
      throw new Error(`Tedarikçi bulunamadı: ${providerId}`);
    }

    this.isScraping = true;
    this.currentProgress = {
      providerId,
      status: 'running',
      totalCategories: 0,
      processedCategories: 0,
      totalProducts: 0,
      importedProducts: 0,
      updatedProducts: 0,
      failedProducts: 0,
      currentStep: 'Başlatılıyor',
      percent: 0,
      startedAt: new Date().toISOString(),
      logs: []
    };

    // Run in background
    (async () => {
      try {
        await scraper.scrape(
          options,
          (partial) => {
            this.currentProgress = { ...this.currentProgress, ...partial };
          },
          (log: ScraperLog) => {
            this.currentProgress.logs = [log, ...this.currentProgress.logs.slice(0, 100)];
          }
        );
      } finally {
        this.isScraping = false;
      }
    })();

    return true;
  }

  stopScrape(providerId: string) {
    const scraper = this.scrapers.get(providerId);
    if (scraper) {
      scraper.stop();
      this.isScraping = false;
      this.currentProgress.status = 'stopped';
      this.currentProgress.currentStep = 'Durduruldu';
    }
  }
}

// Global singleton registry
const globalForScrapers = globalThis as unknown as {
  scraperRegistry: ScraperRegistry | undefined;
};

export const scraperRegistry = globalForScrapers.scraperRegistry ?? new ScraperRegistry();

if (process.env.NODE_ENV !== 'production') {
  globalForScrapers.scraperRegistry = scraperRegistry;
}
