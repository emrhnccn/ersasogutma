import https from 'https';
import http from 'http';
import { ISupplierScraper, ScrapedProduct, ScrapeOptions, ScraperLog, ScraperProgress } from './types';
import { prisma } from '../prisma';

export class ErsaTicaretScraper implements ISupplierScraper {
  readonly id = 'ersaticaret';
  readonly name = 'Ersa Ticaret (ersaticaret.com)';
  readonly baseUrl = 'https://www.ersaticaret.com';

  private isRunning = false;
  private shouldStop = false;

  private fetchText(urlStr: string): Promise<string> {
    return new Promise((resolve, reject) => {
      try {
        const url = new URL(urlStr);
        const client = url.protocol === 'http:' ? http : https;
        const req = client.get(
          urlStr,
          {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
              'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
            },
            timeout: 12000
          },
          (res) => {
            if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
              const redirectUrl = res.headers.location.startsWith('http')
                ? res.headers.location
                : `${url.protocol}//${url.host}${res.headers.location}`;
              return this.fetchText(redirectUrl).then(resolve).catch(reject);
            }

            if (res.statusCode && res.statusCode !== 200) {
              return reject(new Error(`HTTP ${res.statusCode}`));
            }

            let data = '';
            res.on('data', (chunk) => (data += chunk));
            res.on('end', () => resolve(data));
          }
        );

        req.on('timeout', () => {
          req.destroy();
          reject(new Error('Request timeout'));
        });

        req.on('error', (err) => reject(err));
      } catch (err) {
        reject(err);
      }
    });
  }

  async scrape(
    options: ScrapeOptions,
    onProgress: (progress: Partial<ScraperProgress>) => void,
    onLog: (log: ScraperLog) => void
  ): Promise<void> {
    this.isRunning = true;
    this.shouldStop = false;

    const targetUrl = (options.targetUrl || this.baseUrl).replace(/\/+$/, '');
    const now = () => new Date().toLocaleTimeString('tr-TR');

    const log = (message: string, level: ScraperLog['level'] = 'info') => {
      onLog({ timestamp: now(), level, message });
    };

    log(`🚀 ${targetUrl} üzerinden ürün çekme işlemi başlatıldı...`, 'info');
    onProgress({ currentStep: 'Site Haritası Alınıyor...', percent: 5 });

    try {
      // 1. Fetch Sitemap
      const sitemapUrl = `${targetUrl}/sitemap.xml`;
      log(`📄 Site haritası taranıyor: ${sitemapUrl}`, 'info');

      let sitemapXml = '';
      try {
        sitemapXml = await this.fetchText(sitemapUrl);
      } catch {
        // Fallback to www or non-www
        const fallbackUrl = targetUrl.includes('www.')
          ? targetUrl.replace('www.', '') + '/sitemap.xml'
          : targetUrl.replace('://', '://www.') + '/sitemap.xml';
        log(`Tekrar deneniyor: ${fallbackUrl}`, 'warn');
        sitemapXml = await this.fetchText(fallbackUrl);
      }

      // Extract all product URLs
      const productUrls: string[] = [];
      const regex = /<loc>(https?:\/\/[^<]+\/urunler\/[^<]+)<\/loc>/g;
      let match;
      while ((match = regex.exec(sitemapXml)) !== null) {
        const url = match[1];
        if (url && !url.endsWith('/urunler') && !productUrls.includes(url)) {
          productUrls.push(url);
        }
      }

      const totalFound = productUrls.length;
      log(`✅ Toplam ${totalFound} adet ürün linki tespit edildi!`, 'success');

      if (totalFound === 0) {
        throw new Error('Sitemap üzerinde /urunler/ linki bulunamadı.');
      }

      const limit = options.maxProducts ? Math.min(options.maxProducts, totalFound) : totalFound;
      const urlsToProcess = productUrls.slice(0, limit);

      onProgress({
        totalProducts: urlsToProcess.length,
        processedCategories: 1,
        totalCategories: 1,
        currentStep: `0 / ${urlsToProcess.length} ürün işleniyor...`,
        percent: 10
      });

      let imported = 0;
      let updated = 0;
      let failed = 0;

      // Category and Brand caching
      const categoryCache = new Map<string, string>();
      const brandCache = new Map<string, string>();

      // Batch crawler (chunks of 5 concurrent requests)
      const chunkSize = 5;
      for (let i = 0; i < urlsToProcess.length; i += chunkSize) {
        if (this.shouldStop) {
          log('🛑 Kullanıcı tarafından çekme işlemi durduruldu.', 'warn');
          break;
        }

        const chunk = urlsToProcess.slice(i, i + chunkSize);
        await Promise.all(
          chunk.map(async (prodUrl, chunkIdx) => {
            const overallIndex = i + chunkIdx + 1;
            try {
              const html = await this.fetchText(prodUrl);
              const scraped = this.parseProductPage(prodUrl, html);

              if (!scraped || !scraped.name) {
                failed++;
                return;
              }

              // 1. Ensure Brand in DB
              const brandName = scraped.brandName || 'Genel';
              let brandId = brandCache.get(brandName);
              if (!brandId) {
                const brandSlug = this.slugify(brandName);
                const upsertedBrand = await prisma.brand.upsert({
                  where: { slug: brandSlug },
                  create: { name: brandName, slug: brandSlug },
                  update: { name: brandName }
                });
                brandId = upsertedBrand.id;
                brandCache.set(brandName, brandId);
              }

              // 2. Ensure Category in DB
              const categoryName = scraped.categoryName || 'Kombi & Soğutma Parçaları';
              let categoryId = categoryCache.get(categoryName);
              if (!categoryId) {
                const catSlug = this.slugify(categoryName);
                const upsertedCat = await prisma.category.upsert({
                  where: { slug: catSlug },
                  create: { name: categoryName, slug: catSlug },
                  update: { name: categoryName }
                });
                categoryId = upsertedCat.id;
                categoryCache.set(categoryName, categoryId);
              }

              // 3. Upsert Product (NO MARGIN: exact raw price)
              const existingProd = await prisma.product.findUnique({
                where: { sku: scraped.sku }
              });

              if (existingProd) {
                await prisma.product.update({
                  where: { id: existingProd.id },
                  data: {
                    name: scraped.name,
                    salePrice: scraped.salePrice || 0,
                    costPrice: scraped.costPrice || 0,
                    brandId,
                    categoryId,
                    description: scraped.description,
                    stockQty: scraped.stockQty,
                    status: 'PUBLISHED',
                    specsJson: scraped.specsJson ? JSON.stringify(scraped.specsJson) : undefined
                  }
                });
                updated++;
              } else {
                const newProd = await prisma.product.create({
                  data: {
                    name: scraped.name,
                    slug: scraped.slug + '-' + Math.random().toString(36).substring(2, 6),
                    sku: scraped.sku,
                    barcode: scraped.barcode,
                    description: scraped.description,
                    salePrice: scraped.salePrice || 0,
                    costPrice: scraped.costPrice || 0,
                    brandId,
                    categoryId,
                    stockQty: scraped.stockQty,
                    status: 'PUBLISHED',
                    specsJson: scraped.specsJson ? JSON.stringify(scraped.specsJson) : undefined
                  }
                });

                // Add Images
                if (scraped.images && scraped.images.length > 0) {
                  await prisma.productImage.createMany({
                    data: scraped.images.map((img, idx) => ({
                      productId: newProd.id,
                      url: img.url,
                      alt: scraped.name,
                      sortOrder: idx
                    }))
                  });
                }

                imported++;
              }

              if (overallIndex % 25 === 0 || overallIndex === urlsToProcess.length) {
                log(`[${overallIndex}/${urlsToProcess.length}] Aktarıldı: ${scraped.name.slice(0, 35)}... (SKU: ${scraped.sku})`);
              }
            } catch (err: any) {
              failed++;
              log(`Hata (${prodUrl}): ${err.message}`, 'warn');
            }
          })
        );

        const currentDone = Math.min(i + chunkSize, urlsToProcess.length);
        const percent = Math.round(10 + (currentDone / urlsToProcess.length) * 88);
        onProgress({
          importedProducts: imported,
          updatedProducts: updated,
          failedProducts: failed,
          currentStep: `${currentDone} / ${urlsToProcess.length} ürün işlendi (%${percent})`,
          percent
        });
      }

      onProgress({
        status: this.shouldStop ? 'stopped' : 'completed',
        importedProducts: imported,
        updatedProducts: updated,
        failedProducts: failed,
        currentStep: 'Tamamlandı',
        percent: 100
      });

      log(
        `🎉 Çekme tamamlandı! ${imported} yeni ürün eklendi, ${updated} ürün güncellendi, ${failed} hata.`,
        'success'
      );
    } catch (error: any) {
      log(`❌ Kritik Hata: ${error.message}`, 'error');
      onProgress({
        status: 'failed',
        currentStep: `Hata: ${error.message}`
      });
    } finally {
      this.isRunning = false;
      this.shouldStop = false;
    }
  }

  stop(): void {
    if (this.isRunning) {
      this.shouldStop = true;
    }
  }

  private parseProductPage(url: string, html: string): ScrapedProduct | null {
    try {
      // 1. JSON-LD Schema
      const jsonLdMatch = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
      let schema: any = null;
      if (jsonLdMatch) {
        try {
          const parsed = JSON.parse(jsonLdMatch[1]);
          if (parsed['@type'] === 'Product') {
            schema = parsed;
          }
        } catch {
          // ignore
        }
      }

      // 2. Title / Name
      const titleMatch = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
      const name = (titleMatch ? titleMatch[1].replace(/<[^>]+>/g, '').trim() : schema?.name) || '';
      if (!name) return null;

      // 3. Price (Raw 1:1 price without margin)
      const priceMatch = html.match(/"price":\s*([0-9.]+)/i);
      const rawPrice = priceMatch ? parseFloat(priceMatch[1]) : (schema?.offers?.price || 150);

      // 4. SKU
      const skuMatch = html.match(/OEM KOD:[^>]*<strong[^>]*>([^<]+)<\/strong>/i) || html.match(/"sku":\s*"([^"]+)"/i);
      const sku = (skuMatch ? skuMatch[1].trim() : schema?.sku) || this.generateSku(url);

      // 5. Image
      const imgMatch = html.match(/<img[^>]+alt="[^"]*"[^>]+src="([^"]+)"/i) || html.match(/"image":\s*\["([^"]+)"\]/i);
      const imgUrl = (imgMatch ? imgMatch[1] : schema?.image?.[0]) || 'https://via.placeholder.com/600x600?text=Ersa+Parca';

      // 6. Brand & Category
      const brand = schema?.brand?.name || 'Genel';
      const category = schema?.category || 'Kombi & Soğutma Parçaları';

      // 7. Stock quantity
      const stockMatch = html.match(/Stokta Var\s*<!--\s*-->\s*\(([0-9]+)\s*ADET\)/i);
      const stockQty = stockMatch ? parseInt(stockMatch[1], 10) : 50;

      const slug = this.slugify(name);

      return {
        externalId: sku,
        name,
        slug,
        sku,
        description: schema?.description || `${name} - Orijinal / Yüksek Kaliteli Yedek Parça`,
        brandName: brand,
        categoryName: category,
        costPrice: rawPrice,
        salePrice: rawPrice, // EXACT 1:1 price, no margin added
        stockStatus: 'IN_STOCK',
        stockQty,
        images: [{ url: imgUrl, sortOrder: 0 }],
        sourceSupplier: 'ersaticaret',
        sourceUrl: url,
        specsJson: {
          'OEM Parça Kodu': sku,
          'Marka': brand,
          'Kategori': category,
          'Tedarikçi': 'ersaticaret.com'
        }
      };
    } catch {
      return null;
    }
  }

  private slugify(text: string): string {
    const trMap: Record<string, string> = {
      ç: 'c', Ç: 'c', ğ: 'g', Ğ: 'g', ı: 'i', I: 'i', İ: 'i',
      ö: 'o', Ö: 'o', ş: 's', Ş: 's', ü: 'u', Ü: 'u'
    };
    return text
      .split('')
      .map((c) => trMap[c] || c)
      .join('')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  private generateSku(url: string): string {
    const parts = url.split('/');
    const last = parts[parts.length - 1] || Date.now().toString();
    return 'ERS-' + last.slice(-8).toUpperCase();
  }
}
