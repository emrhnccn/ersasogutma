import https from 'https';
import dns from 'dns';
import { ISupplierScraper, ScrapeOptions, ScraperProgress, ScraperLog, ScrapedProduct } from './types';
import { prisma } from '../prisma';

function slugify(text: string): string {
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

interface HttpResponse {
  statusCode: number;
  headers: Record<string, string | string[] | undefined>;
  body: string;
  responseUrl: string;
  redirectUrl?: string;
}

export class TurkuazScraper implements ISupplierScraper {
  readonly id = 'turkuaz';
  readonly name = 'Turkuaz Teknik (bayi.turkuazteknik.com.tr)';
  readonly baseUrl = 'https://bayi.turkuazteknik.com.tr';
  readonly fixedHostname = 'bayi.turkuazteknik.com.tr';

  private httpsAgent = new https.Agent({
    ALPNProtocols: ['http/1.1'],
    keepAlive: false
  });

  private isStopped = false;
  private cookieJar: Record<string, string> = {};

  stop(): void {
    this.isStopped = true;
  }

  /**
   * Cleans any hostname to ensure www. is never prepended to bayi.turkuazteknik.com.tr
   */
  private sanitizeUrl(inputUrl?: string): URL {
    const raw = inputUrl || this.baseUrl;
    try {
      const parsed = new URL(raw.startsWith('http') ? raw : `https://${raw}`);
      // Strictly prevent www.bayi.turkuazteknik.com.tr
      if (parsed.hostname.toLowerCase() === 'www.bayi.turkuazteknik.com.tr' || parsed.hostname.toLowerCase() === 'bayi.turkuazteknik.com.tr') {
        parsed.hostname = this.fixedHostname;
      }
      return parsed;
    } catch {
      return new URL(this.baseUrl);
    }
  }

  /**
   * Updates cookie jar from Set-Cookie headers
   */
  private updateCookies(setCookieHeader?: string | string[]): void {
    if (!setCookieHeader) return;
    const cookies = Array.isArray(setCookieHeader) ? setCookieHeader : [setCookieHeader];
    for (const cookieStr of cookies) {
      if (!cookieStr) continue;
      const firstPart = cookieStr.split(';')[0].trim();
      const eqIdx = firstPart.indexOf('=');
      if (eqIdx > 0) {
        const key = firstPart.slice(0, eqIdx).trim();
        const value = firstPart.slice(eqIdx + 1).trim();
        if (key && value) {
          this.cookieJar[key] = value;
        }
      }
    }
  }

  /**
   * Generates Cookie header string from current jar
   */
  private getCookieHeader(): string {
    return Object.entries(this.cookieJar)
      .map(([k, v]) => `${k}=${v}`)
      .join('; ');
  }

  /**
   * Performs an HTTPS request with cookie handling, redirect following, and browser headers
   */
  private makeRequest(
    targetUrl: string,
    options: {
      method?: 'GET' | 'POST';
      body?: string;
      headers?: Record<string, string>;
      maxRedirects?: number;
    } = {}
  ): Promise<HttpResponse> {
    const { method = 'GET', body, headers = {}, maxRedirects = 5 } = options;

    return new Promise((resolve, reject) => {
      try {
        const url = this.sanitizeUrl(targetUrl);
        const cookieHeader = this.getCookieHeader();

        const reqHeaders: Record<string, string | number> = {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
          'Accept-Language': 'tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7',
          'Connection': 'close',
          'Referer': `${this.baseUrl}/Login.ASP`,
          ...headers
        };

        if (cookieHeader) {
          reqHeaders['Cookie'] = cookieHeader;
        }

        if (body) {
          reqHeaders['Content-Type'] = reqHeaders['Content-Type'] || 'application/x-www-form-urlencoded';
          reqHeaders['Content-Length'] = Buffer.byteLength(body);
        }

        const req = https.request(
          url,
          {
            method,
            headers: reqHeaders,
            agent: this.httpsAgent,
            family: 4,
            timeout: 15000
          },
          (res) => {
            this.updateCookies(res.headers['set-cookie']);

            const statusCode = res.statusCode || 0;
            const location = res.headers.location;

            // Follow HTTP redirects (301, 302, 303, 307, 308)
            if (statusCode >= 300 && statusCode < 400 && location && maxRedirects > 0) {
              const redirectTarget = new URL(location, url.href).href;
              // Clean up redirect target if it somehow contained www.
              const cleanRedirect = this.sanitizeUrl(redirectTarget).href;

              this.makeRequest(cleanRedirect, {
                method: 'GET',
                headers,
                maxRedirects: maxRedirects - 1
              })
                .then((subRes) => {
                  resolve({
                    ...subRes,
                    redirectUrl: cleanRedirect
                  });
                })
                .catch(reject);
              return;
            }

            let data = '';
            res.on('data', (chunk) => (data += chunk));
            res.on('end', () => {
              resolve({
                statusCode,
                headers: res.headers as Record<string, string | string[] | undefined>,
                body: data,
                responseUrl: url.href,
                redirectUrl: location ? new URL(location, url.href).href : undefined
              });
            });
          }
        );

        req.on('timeout', () => {
          req.destroy();
          reject(new Error(`İstek zaman aşımına uğradı (${url.href}, 15sn)`));
        });

        req.on('error', (err) => reject(err));

        if (body) {
          req.write(body);
        }
        req.end();
      } catch (err) {
        reject(err);
      }
    });
  }

  /**
   * Diagnostic DNS & Connectivity Check
   */
  private async diagnoseNetwork(
    log: (msg: string, level?: ScraperLog['level']) => void
  ): Promise<{ resolvedIp: string }> {
    const target = this.sanitizeUrl();
    const hostname = target.hostname;
    const protocol = target.protocol;

    log(`🔍 [DNS Teşhisi] Target URL: ${target.href}`, 'info');
    log(`🔍 [DNS Teşhisi] Hostname: ${hostname}`, 'info');
    log(`🔍 [DNS Teşhisi] Protocol: ${protocol}`, 'info');

    // 1. Resolve DNS explicitly
    const resolvedIp = await new Promise<string>((resolve, reject) => {
      dns.lookup(hostname, { family: 4 }, (err, address) => {
        if (err) return reject(err);
        resolve(address);
      });
    }).catch((err) => {
      log(`❌ [DNS Teşhisi] DNS Çözümleme Hatası: ${err.message}`, 'error');
      throw new Error(`DNS çözümlenemedi (${hostname}): ${err.message}`);
    });

    log(`✅ [DNS Teşhisi] Resolved IP: ${resolvedIp}`, 'success');

    // 2. Test initial GET on Login.ASP for diagnostic report
    try {
      const testRes = await this.makeRequest(`${this.baseUrl}/Login.ASP`);
      log(`🔍 [DNS Teşhisi] HTTP Status: ${testRes.statusCode}`, 'info');
      log(`🔍 [DNS Teşhisi] Response URL: ${testRes.responseUrl}`, 'info');
      if (testRes.redirectUrl) {
        log(`🔍 [DNS Teşhisi] Redirect URL: ${testRes.redirectUrl}`, 'info');
      }
    } catch (err: any) {
      log(
        `⚠️ [DNS Teşhisi Uyarısı] DNS (${resolvedIp}) çözümlendi fakat HTTPS bağlantısı kurulamadı: ${err.message}. Bu durum bir DNS sorunu değil; Vercel/sunucu giden bağlantı (egress) veya hedef sunucu güvenlik duvarı kısıtlamasıdır.`,
        'warn'
      );
      throw err;
    }

    return { resolvedIp };
  }

  /**
   * Classic ASP Login flow with Session Cookie maintenance
   */
  private async login(
    username?: string,
    password?: string,
    log?: (msg: string, level?: ScraperLog['level']) => void
  ): Promise<boolean> {
    const user = username || process.env.TURKUAZ_USERNAME || '';
    const pass = password || process.env.TURKUAZ_PASSWORD || '';

    if (!user || !pass) {
      const msg = 'Turkuaz Teknik kullanıcı adı veya şifresi tanımlanmamış. Lütfen TURKUAZ_USERNAME ve TURKUAZ_PASSWORD environment değişkenlerini veya admin panelindeki giriş alanlarını doldurun.';
      if (log) log(msg, 'error');
      throw new Error(msg);
    }

    if (log) log(`🔑 Turkuaz Teknik B2B oturumu başlatılıyor (Kullanıcı: ${user})...`, 'info');

    // Step 1: GET Login.ASP to initialize ASPSESSIONID
    const getRes = await this.makeRequest(`${this.baseUrl}/Login.ASP`);
    if (getRes.statusCode !== 200) {
      throw new Error(`Login.ASP sayfası açılamadı: HTTP ${getRes.statusCode}`);
    }

    const sessionCookieKey = Object.keys(this.cookieJar).find((k) => k.startsWith('ASPSESSIONID'));
    if (sessionCookieKey && log) {
      log(`🍪 Oturum çerezi alındı: ${sessionCookieKey}`, 'info');
    }

    // Step 2: POST login.asp with form payload
    const postData = new URLSearchParams({
      username: user,
      password: pass,
      logintype: 'Giriş',
      Submit: 'Giriş',
      hatirla: '1'
    }).toString();

    const postRes = await this.makeRequest(`${this.baseUrl}/login.asp`, {
      method: 'POST',
      body: postData,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Referer': `${this.baseUrl}/Login.ASP`
      }
    });

    // Step 3: Verify credentials and authentication state
    // When credentials fail, page contains "Hatalı Kullanıcı adı ve/veya Şifre"
    if (
      postRes.body.includes('Hatalı Kullanıcı adı ve/veya Şifre') ||
      postRes.body.includes('Hatal Kullanc') ||
      (postRes.body.includes('hatali') && postRes.body.includes('kullanici'))
    ) {
      const errorMsg = 'Turkuaz Teknik giriş başarısız: Hatalı kullanıcı adı ve/veya şifre.';
      if (log) log(errorMsg, 'error');
      throw new Error(errorMsg);
    }

    if (log) log(`🎉 Turkuaz Teknik oturumu başarıyla açıldı!`, 'success');
    return true;
  }

  /**
   * Main scrape execution
   */
  async scrape(
    options: ScrapeOptions,
    onProgress: (progress: Partial<ScraperProgress>) => void,
    onLog: (log: ScraperLog) => void
  ): Promise<void> {
    this.isStopped = false;
    this.cookieJar = {};
    const startTime = new Date().toISOString();

    const log = (message: string, level: ScraperLog['level'] = 'info') => {
      onLog({ timestamp: new Date().toLocaleTimeString('tr-TR'), level, message });
    };

    try {
      log(`🚀 Turkuaz Teknik (${this.fixedHostname}) ürün çekme botu başlatıldı...`, 'info');
      onProgress({ status: 'running', currentStep: 'Ağ & DNS Teşhisi Yapılıyor', startedAt: startTime, percent: 5 });

      // 1. Mandatory DNS & Connectivity Diagnostics (per item 9 & 10)
      await this.diagnoseNetwork(log);

      // 2. Authentication Flow
      onProgress({ currentStep: 'Turkuaz B2B Oturumu Açılıyor', percent: 15 });
      const username = options.username || process.env.TURKUAZ_USERNAME;
      const password = options.password || process.env.TURKUAZ_PASSWORD;

      await this.login(username, password, log);

      // 3. Scan Catalog & Products
      onProgress({ currentStep: 'Ürün kataloğu taranıyor', percent: 30 });
      log(`📂 Ürün kataloğu ve sayfalar taranıyor...`, 'info');

      // Fetch index or urunler.asp to get category tree or product links
      const catalogRes = await this.makeRequest(`${this.baseUrl}/urunler.asp`);
      const catalogHtml = catalogRes.body;

      // Extract category links from Superfish menu / nav links: href="urunler.asp?kat=..." or "?p=..."
      const catLinks = new Set<string>();
      const catRegex = /href="([^"]*urunler\.asp[^"]*)"/gi;
      let catMatch;
      while ((catMatch = catRegex.exec(catalogHtml)) !== null) {
        const fullCatUrl = new URL(catMatch[1], this.baseUrl).href;
        catLinks.add(this.sanitizeUrl(fullCatUrl).href);
      }

      // If no category links found, add default urunler.asp
      if (catLinks.size === 0) {
        catLinks.add(`${this.baseUrl}/urunler.asp`);
      }

      log(`📋 Toplam ${catLinks.size} kategori sayfası tespit edildi.`, 'info');
      onProgress({ totalCategories: catLinks.size, percent: 45 });

      // 4. Collect Product URLs or Product Elements
      onProgress({ currentStep: 'Ürün linkleri toplanıyor', percent: 55 });
      const collectedProducts: ScrapedProduct[] = [];
      const seenSkus = new Set<string>();

      for (const catUrl of Array.from(catLinks).slice(0, 15)) {
        if (this.isStopped) break;
        if (options.maxProducts && collectedProducts.length >= options.maxProducts) break;

        try {
          const pageRes = await this.makeRequest(catUrl);
          const pageHtml = pageRes.body;

          const parsedProducts = this.parseProductCards(pageHtml, catUrl);
          for (const prod of parsedProducts) {
            if (!seenSkus.has(prod.sku)) {
              seenSkus.add(prod.sku);
              collectedProducts.push(prod);
              if (options.maxProducts && collectedProducts.length >= options.maxProducts) break;
            }
          }
        } catch {
          // ignore individual page crawl errors
        }
      }

      log(`📦 Toplam ${collectedProducts.length} adet ürün ayrıştırıldı.`, 'info');

      if (collectedProducts.length === 0) {
        log(`ℹ️ Oturum açıldı ancak ürün listesinde gösterilecek ürün bulunamadı.`, 'warn');
      }

      // 5. Save Products to Database via Prisma
      onProgress({
        currentStep: 'Ürünler veritabanına aktarılıyor',
        totalProducts: collectedProducts.length,
        percent: 70
      });

      let importedCount = 0;
      let failedCount = 0;

      for (let i = 0; i < collectedProducts.length; i++) {
        if (this.isStopped) {
          log(`🛑 Kullanıcı tarafından ürün çekme işlemi durduruldu.`, 'warn');
          onProgress({ status: 'stopped' });
          return;
        }

        const prod = collectedProducts[i];
        try {
          // Ensure Brand
          let brandRecord = null;
          if (prod.brandName) {
            const brandSlug = slugify(prod.brandName);
            brandRecord = await prisma.brand.upsert({
              where: { slug: brandSlug },
              update: { name: prod.brandName },
              create: { name: prod.brandName, slug: brandSlug }
            });
          }

          // Ensure Category
          let categoryRecord = null;
          if (prod.categoryName) {
            const catSlug = slugify(prod.categoryName);
            categoryRecord = await prisma.category.upsert({
              where: { slug: catSlug },
              update: { name: prod.categoryName },
              create: { name: prod.categoryName, slug: catSlug }
            });
          }

          // Upsert Product
          const productSlug = slugify(prod.name) + '-' + prod.sku.toLowerCase().replace(/[^a-z0-9]+/g, '-');
          const savedProduct = await prisma.product.upsert({
            where: { sku: prod.sku },
            update: {
              name: prod.name,
              salePrice: prod.salePrice || 0,
              costPrice: prod.costPrice || 0,
              stockQty: prod.stockQty,
              brandId: brandRecord?.id || null,
              categoryId: categoryRecord?.id || null,
              description: prod.description,
              status: 'PUBLISHED',
              specsJson: prod.specsJson ? JSON.stringify(prod.specsJson) : undefined
            },
            create: {
              name: prod.name,
              slug: productSlug,
              sku: prod.sku,
              barcode: prod.barcode,
              salePrice: prod.salePrice || 0,
              costPrice: prod.costPrice || 0,
              stockQty: prod.stockQty,
              brandId: brandRecord?.id || null,
              categoryId: categoryRecord?.id || null,
              description: prod.description,
              status: 'PUBLISHED',
              unit: 'ADET',
              specsJson: prod.specsJson ? JSON.stringify(prod.specsJson) : undefined
            }
          });

          // Save Product Images
          if (prod.images && prod.images.length > 0) {
            await prisma.productImage.deleteMany({ where: { productId: savedProduct.id } });
            for (let idx = 0; idx < prod.images.length; idx++) {
              await prisma.productImage.create({
                data: {
                  productId: savedProduct.id,
                  url: prod.images[idx].url,
                  alt: prod.name,
                  sortOrder: idx,
                  sourceSupplier: 'Turkuaz Teknik'
                }
              });
            }
          }

          importedCount++;

          if (importedCount % 5 === 0 || i === collectedProducts.length - 1) {
            const currentPercent = 70 + Math.round((i / collectedProducts.length) * 28);
            log(`[${importedCount}/${collectedProducts.length}] Aktarıldı: ${prod.name.slice(0, 35)}... (SKU: ${prod.sku})`);
            onProgress({
              importedProducts: importedCount,
              failedProducts: failedCount,
              percent: currentPercent
            });
          }
        } catch (err: any) {
          failedCount++;
          log(`Ürün kayıt hatası (${prod.sku}): ${err.message}`, 'warn');
        }
      }

      onProgress({
        status: this.isStopped ? 'stopped' : 'completed',
        currentStep: 'Tamamlandı',
        percent: 100,
        finishedAt: new Date().toISOString(),
        importedProducts: importedCount,
        failedProducts: failedCount
      });

      log(`🎉 Turkuaz Teknik üzerinden ${importedCount} adet ürün başarıyla aktarıldı! (${failedCount} hata)`, 'success');
    } catch (error: any) {
      log(`❌ Kritik Hata: ${error.message}`, 'error');
      onProgress({
        status: 'failed',
        currentStep: `Hata: ${error.message}`
      });
    }
  }

  /**
   * Parses product cards from Classic ASP HTML
   */
  public parseProductCards(html: string, sourceUrl: string): ScrapedProduct[] {
    const products: ScrapedProduct[] = [];

    // Search for product containers (.box2, .box, or table rows)
    const boxRegex = /<div[^>]*class=["'][^"']*\bbox2\b[^"']*["'][^>]*>([\s\S]*?)<\/div>\s*<\/div>/gi;
    const matches = [...html.matchAll(boxRegex)];

    for (const match of matches) {
      const cardHtml = match[1];

      // Title & Link
      const titleMatch = cardHtml.match(/<h[234][^>]*>[\s\S]*?<a[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/i) ||
                         cardHtml.match(/<a[^>]*class=["'](?:title|urun_baslik)[^"']*["'][^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/i);
      const name = titleMatch ? titleMatch[2].replace(/<[^>]+>/g, '').trim() : '';
      const prodHref = titleMatch ? titleMatch[1] : sourceUrl;
      const detailUrl = new URL(prodHref, this.baseUrl).href;

      if (!name) continue;

      // SKU / Product Code
      const skuMatch = cardHtml.match(/(?:Kod|Stok Kodu|OEM)\s*:\s*<[^>]+>([^<]+)<\/[^>]+>/i) ||
                       cardHtml.match(/(?:Kod|Stok Kodu|OEM)\s*:\s*([^<\n&]+)/i);
      const sku = skuMatch ? skuMatch[1].trim() : `TURKUAZ-${Math.abs(this.hashCode(name))}`;

      // Price
      const priceMatch = cardHtml.match(/class=["'][^"']*(?:fiyat|price)[^"']*["'][^>]*>([\s\S]*?)<\/[^>]+>/i) ||
                         cardHtml.match(/(\d[\d.,]*\d|\d)\s*(?:TL|₺|USD|\$|EUR|€)/i);
      let salePrice = 0;
      if (priceMatch) {
        let rawP = (priceMatch[1] || priceMatch[0]).replace(/<[^>]+>/g, '').trim();
        rawP = rawP.replace(/[^\d.,]/g, '');
        if (rawP.includes('.') && rawP.includes(',')) {
          rawP = rawP.replace(/\./g, '').replace(',', '.');
        } else if (rawP.includes(',')) {
          rawP = rawP.replace(',', '.');
        }
        const parsed = parseFloat(rawP);
        if (!isNaN(parsed) && parsed > 0) salePrice = parsed;
      }

      // Stock
      const hasStock = !cardHtml.includes('Tükendi') && !cardHtml.includes('Stokta Yok');
      const stockQty = hasStock ? 50 : 0;

      // Image
      const imgMatch = cardHtml.match(/<img[^>]+src=["']([^"']+)["']/i);
      const images: { url: string; sortOrder: number }[] = [];
      if (imgMatch) {
        const imgUrl = new URL(imgMatch[1], this.baseUrl).href;
        images.push({ url: imgUrl, sortOrder: 0 });
      }

      // Brand
      const brandMatch = cardHtml.match(/(?:Marka)\s*:\s*([^<\n&]+)/i);
      const brandName = brandMatch ? brandMatch[1].trim() : 'Turkuaz';

      products.push({
        externalId: sku,
        name,
        slug: slugify(name),
        sku,
        description: `${name} - Turkuaz Teknik Yedek Parça`,
        brandName,
        categoryName: 'Klima & Soğutma Yedek Parçaları',
        costPrice: salePrice,
        salePrice,
        stockStatus: hasStock ? 'IN_STOCK' : 'OUT_OF_STOCK',
        stockQty,
        images,
        sourceSupplier: 'turkuaz',
        sourceUrl: detailUrl,
        specsJson: {
          'Ürün Kodu': sku,
          'Marka': brandName,
          'Tedarikçi': 'Turkuaz Teknik (bayi.turkuazteknik.com.tr)'
        }
      });
    }

    return products;
  }

  private hashCode(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    return hash;
  }
}
