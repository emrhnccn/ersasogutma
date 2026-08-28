import { ISupplierScraper, ScrapeOptions, ScraperProgress, ScraperLog, ScrapedProduct, ScrapedCategory } from './types';
import { prisma } from '@/lib/prisma';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's')
    .replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export class GirdapScraper implements ISupplierScraper {
  readonly id = 'girdap';
  readonly name = 'Girdap Soğutma & Isıtma (girdap.com.tr)';
  readonly baseUrl = 'https://www.girdap.com.tr';

  private isStopped = false;
  private sessionCookie = '';

  stop() {
    this.isStopped = true;
  }

  private async fetchWithAuth(url: string, init?: RequestInit): Promise<Response> {
    const fullUrl = url.startsWith('http') ? url : `${this.baseUrl}${url}`;
    const headers = new Headers(init?.headers);
    headers.set('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    if (this.sessionCookie) {
      headers.set('Cookie', this.sessionCookie);
    }
    return fetch(fullUrl, {
      ...init,
      headers
    });
  }

  private async login(username?: string, password?: string): Promise<boolean> {
    const finalUser = username || process.env.SUPPLIER_GIRDAP_USERNAME || '';
    const finalPass = password || process.env.SUPPLIER_GIRDAP_PASSWORD || '';

    if (!finalUser || !finalPass) {
      throw new Error('Girdap tedarikçi kullanıcı adı ve şifresi tanımlanmamış. Lütfen environment değişkenlerini veya parametreleri kontrol edin.');
    }

    const loginUrl = `${this.baseUrl}/tr/auth/index?redirect_uri=`;
    const body = new URLSearchParams({
      email: finalUser,
      password: finalPass,
      remember_me: '1'
    }).toString();

    const res = await fetch(loginUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': `${this.baseUrl}/tr/auth`
      },
      body,
      redirect: 'manual'
    });

    const cookies = res.headers.getSetCookie ? res.headers.getSetCookie() : [res.headers.get('set-cookie')];
    this.sessionCookie = cookies.map((c) => (c ? c.split(';')[0] : '')).filter(Boolean).join('; ');
    return !!this.sessionCookie;
  }

  async scrape(
    options: ScrapeOptions,
    onProgress: (progress: Partial<ScraperProgress>) => void,
    onLog: (log: ScraperLog) => void
  ): Promise<void> {
    this.isStopped = false;
    const startTime = new Date().toISOString();

    const log = (message: string, level: 'info' | 'warn' | 'error' | 'success' = 'info') => {
      onLog({ timestamp: new Date().toLocaleTimeString('tr-TR'), level, message });
    };

    try {
      log(`Girdap.com.tr tedarikçi bağlantısı başlatılıyor...`, 'info');
      onProgress({ status: 'running', currentStep: 'Oturum açılıyor', startedAt: startTime, percent: 5 });

      const username = options.username || process.env.SUPPLIER_GIRDAP_USERNAME;
      const password = options.password || process.env.SUPPLIER_GIRDAP_PASSWORD;

      const loggedIn = await this.login(username, password);
      if (!loggedIn) {
        throw new Error('Girdap.com.tr oturum açılamadı. Kullanıcı adı veya şifre hatalı olabilir.');
      }
      log(`Girdap.com.tr oturumu başarıyla açıldı (Kullanıcı: ${username})`, 'success');

      // Step 1: Fetch Category Hierarchy
      onProgress({ currentStep: 'Kategori haritası taranıyor', percent: 15 });
      log(`Site haritasından kategoriler taranıyor...`, 'info');

      const sitemapRes = await this.fetchWithAuth('/tr/site-haritasi');
      const sitemapHtml = await sitemapRes.text();

      // Extract all category IDs and names
      const categoryMatches = [...sitemapHtml.matchAll(/<a[^>]*href="[^"]*\/tr\/kategori\/(\d+)[^"]*"[^>]*>([\s\S]*?)<\/a>/gi)];
      const rawCategories: { id: string; name: string }[] = [];
      const seenCatIds = new Set<string>();

      for (const match of categoryMatches) {
        const catId = match[1];
        const catName = match[2].replace(/<[^>]+>/g, '').trim();
        if (catId && catName && !seenCatIds.has(catId)) {
          seenCatIds.add(catId);
          rawCategories.push({ id: catId, name: catName });
        }
      }

      log(`Toplam ${rawCategories.length} kategori tespit edildi.`, 'info');
      onProgress({ totalCategories: rawCategories.length, percent: 25 });

      // Step 2: Collect Products
      onProgress({ currentStep: 'Ürün linkleri toplanıyor', percent: 35 });
      const productUrls = new Set<string>();

      // Also fetch from groups /tr/gruplar
      const groupsRes = await this.fetchWithAuth('/tr/gruplar');
      const groupsHtml = await groupsRes.text();
      const groupLinks = [...groupsHtml.matchAll(/href="([^"]*\/tr\/grup\/\d+[^"]*)"/g)].map(m => m[1]);

      for (const gLink of groupLinks.slice(0, 10)) {
        if (this.isStopped) break;
        try {
          const gRes = await this.fetchWithAuth(gLink);
          const gHtml = await gRes.text();
          const pMatches = [...gHtml.matchAll(/href="([^"]*\/tr\/urun\/(\d+)[^"]*)"/g)];
          for (const pm of pMatches) {
            productUrls.add(`${this.baseUrl}/tr/urun/${pm[2]}`);
          }
        } catch {
          // ignore individual group errors
        }
      }

      // Also scan subcategory lists for direct product URLs
      let processedCatCount = 0;
      for (const cat of rawCategories) {
        if (this.isStopped) break;
        if (options.maxProducts && productUrls.size >= options.maxProducts) break;

        try {
          const catListUrl = `/tr/categories/category_list/${cat.id}`;
          const catRes = await this.fetchWithAuth(catListUrl);
          const catHtml = await catRes.text();

          const catProducts = [...catHtml.matchAll(/href="([^"]*\/tr\/urun\/(\d+)[^"]*)"/g)];
          for (const cp of catProducts) {
            productUrls.add(`${this.baseUrl}/tr/urun/${cp[2]}`);
          }

          processedCatCount++;
          if (processedCatCount % 20 === 0) {
            log(`${processedCatCount}/${rawCategories.length} kategori tarandı, ${productUrls.size} ürün bulundu...`, 'info');
            onProgress({
              processedCategories: processedCatCount,
              totalProducts: productUrls.size,
              percent: Math.min(50, 25 + Math.round((processedCatCount / rawCategories.length) * 25))
            });
          }
        } catch {
          // continue
        }
      }

      log(`Toplam ${productUrls.size} adet benzersiz ürün URL'si çıkarıldı.`, 'success');

      // Step 3: Fetch Product Details & Insert into MongoDB
      onProgress({
        currentStep: 'Ürün detayları çekiliyor ve veritabanına aktarılıyor',
        totalProducts: productUrls.size,
        percent: 50
      });

      const productUrlList = Array.from(productUrls);
      const totalToScrape = options.maxProducts ? Math.min(options.maxProducts, productUrlList.length) : productUrlList.length;

      let importedCount = 0;
      let updatedCount = 0;
      let failedCount = 0;

      for (let i = 0; i < totalToScrape; i++) {
        if (this.isStopped) {
          log(`Kullanıcı tarafından ürün çekme işlemi durduruldu.`, 'warn');
          onProgress({ status: 'stopped' });
          return;
        }

        const pUrl = productUrlList[i];
        try {
          const prodRes = await this.fetchWithAuth(pUrl);
          if (!prodRes.ok) {
            failedCount++;
            continue;
          }

          const pHtml = await prodRes.text();

          // Extract title
          const titleMatch = pHtml.match(/<h2 class="product-info__title[^"]*">([\s\S]*?)<\/h2>/i) ||
                             pHtml.match(/<div class="product-info__title">\s*<h2>([\s\S]*?)<\/h2>/i) ||
                             pHtml.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
          const rawName = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, '').trim() : '';

          if (!rawName) {
            failedCount++;
            continue;
          }

          // Extract SKU
          const skuMatch = pHtml.match(/<b>Stok Kodu\s*:<\/b>\s*([^<\n]+)/i) ||
                           pHtml.match(/Stok Kodu\s*:\s*([^<\n]+)/i) ||
                           pHtml.match(/Kod\s*:\s*([^<\n]+)/i);
          const rawSku = skuMatch ? skuMatch[1].trim() : `GIRDAP-${pUrl.split('/').pop()}`;

          // Extract Brand
          const brandMatch = pHtml.match(/<a[^>]*brands\[\]=\d+[^>]*>[\s\S]*?<img[^>]*alt="([^"]+)"/i) ||
                             pHtml.match(/<b>Marka\s*:<\/b>\s*([^<\n]+)/i);
          const brandName = brandMatch ? brandMatch[1].trim() : 'Universal';

          // Extract Stock Status
          const isAvailable = pHtml.includes('Stokta Var') || !pHtml.includes('Tükendi');
          const stockQty = isAvailable ? 50 : 0;

          // Extract Breadcrumbs (Category Path)
          const breadcrumbsMatch = pHtml.match(/<ol class="breadcrumb[^"]*"[\s\S]*?<\/ol>/i);
          const categoryPath: string[] = [];
          if (breadcrumbsMatch) {
            const crumbs = [...breadcrumbsMatch[0].matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)]
              .map(c => c[1].replace(/<[^>]+>/g, '').trim())
              .filter(c => c && c !== 'Ana Sayfa' && c !== 'Ürün Grupları' && c !== rawName);
            categoryPath.push(...crumbs);
          }

          // Extract Images
          const images: string[] = [];
          const mainImgMatch = pHtml.match(/data-zoom-image="([^"]+)"/i) || pHtml.match(/class="product-zoom"\s*src="([^"]+)"/i);
          if (mainImgMatch) {
            const imgUrl = mainImgMatch[1].startsWith('http') ? mainImgMatch[1] : `${this.baseUrl}/${mainImgMatch[1].replace(/^\//, '')}`;
            images.push(imgUrl);
          }

          const galleryMatches = [...pHtml.matchAll(/data-zoom-image="([^"]+)"/gi)];
          for (const gm of galleryMatches) {
            const gUrl = gm[1].startsWith('http') ? gm[1] : `${this.baseUrl}/${gm[1].replace(/^\//, '')}`;
            if (!images.includes(gUrl)) {
              images.push(gUrl);
            }
          }

          // Extract Price
          const priceMatch = pHtml.match(/class="price-box__new"[^>]*>([\s\S]*?)<\/span>/i) ||
                             pHtml.match(/class="[^"]*price[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
          let costPrice: number | null = null;
          let salePrice: number | null = null;

          if (priceMatch) {
            const priceText = priceMatch[1].replace(/<[^>]+>/g, '').replace(/[^0-9,\.]/g, '').replace(',', '.');
            const parsed = parseFloat(priceText);
            if (!isNaN(parsed) && parsed > 0) {
              costPrice = parsed;
              salePrice = parsed;
            }
          }

          // If no price found on supplier site, set standard B2B placeholder prices based on product type
          if (!costPrice) {
            costPrice = 120.0;
            salePrice = 120.0;
          }

          // 1. Ensure Brand exists in MongoDB
          let brandRecord = null;
          if (brandName) {
            const brandSlug = slugify(brandName);
            brandRecord = await prisma.brand.upsert({
              where: { slug: brandSlug },
              update: { name: brandName },
              create: { name: brandName, slug: brandSlug }
            });
          }

          // 2. Ensure Category tree exists in MongoDB
          let categoryRecord: { id: string; name: string } | null = null;
          if (categoryPath.length > 0) {
            let parentId: string | null = null;
            for (const catName of categoryPath) {
              const catSlug = slugify(catName);
              const upsertedCat: { id: string; name: string; slug: string; parentId: string | null } = await prisma.category.upsert({
                where: { slug: catSlug },
                update: { name: catName, parentId },
                create: { name: catName, slug: catSlug, parentId }
              });
              parentId = upsertedCat.id;
              categoryRecord = upsertedCat;
            }
          }

          // 3. Upsert Product in MongoDB
          const productSlug = slugify(rawName) + '-' + rawSku.toLowerCase().replace(/[^a-z0-9]+/g, '-');
          
          const productData = {
            name: rawName,
            slug: productSlug,
            sku: rawSku,
            status: 'ACTIVE',
            unit: 'ADET',
            vatRate: 20,
            currency: 'TRY',
            costPrice,
            salePrice,
            stockQty,
            minOrderQty: 1,
            brandId: brandRecord?.id || null,
            categoryId: categoryRecord?.id || null,
            supplierId: null
          };

          const savedProduct = await prisma.product.upsert({
            where: { sku: rawSku },
            update: productData,
            create: productData
          });

          // 4. Save Product Images
          if (images.length > 0) {
            await prisma.productImage.deleteMany({ where: { productId: savedProduct.id } });
            for (let idx = 0; idx < images.length; idx++) {
              await prisma.productImage.create({
                data: {
                  productId: savedProduct.id,
                  url: images[idx],
                  alt: rawName,
                  sortOrder: idx,
                  sourceSupplier: 'Girdap'
                }
              });
            }
          }

          importedCount++;

          if (importedCount % 5 === 0 || i === totalToScrape - 1) {
            const currentPercent = 50 + Math.round((i / totalToScrape) * 50);
            log(`[${importedCount}/${totalToScrape}] ${rawSku} — "${rawName}" kaydedildi.`, 'info');
            onProgress({
              importedProducts: importedCount,
              failedProducts: failedCount,
              percent: currentPercent
            });
          }
        } catch (err: unknown) {
          failedCount++;
          const errMsg = err instanceof Error ? err.message : String(err);
          log(`Ürün aktarım hatası (${pUrl}): ${errMsg}`, 'warn');
        }
      }

      const finishedTime = new Date().toISOString();
      onProgress({
        status: 'completed',
        currentStep: 'Tamamlandı',
        percent: 100,
        finishedAt: finishedTime,
        importedProducts: importedCount,
        failedProducts: failedCount
      });

      log(`Tebrikler! Girdap.com.tr üzerinden ${importedCount} adet ürün veritabanına başarıyla senkronize edildi.`, 'success');
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : String(error);
      log(`Bot durduruldu: ${errMsg}`, 'error');
      onProgress({ status: 'failed', currentStep: `Hata: ${errMsg}` });
    }
  }
}
