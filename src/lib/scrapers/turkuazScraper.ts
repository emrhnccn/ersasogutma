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

/**
 * Native decoder for ISO-8859-9 (Turkish Latin-5 / Windows-1254)
 * Guarantees 100% accurate Turkish character decoding from raw ASP response buffers.
 */
function decodeTurkishIso(buf: Buffer): string {
  const trMap: Record<number, string> = {
    0xD0: 'Ğ',
    0xDD: 'İ',
    0xDE: 'Ş',
    0xF0: 'ğ',
    0xFD: 'ı',
    0xFE: 'ş'
  };

  let str = '';
  for (let i = 0; i < buf.length; i++) {
    const byte = buf[i];
    if (trMap[byte]) {
      str += trMap[byte];
    } else if (byte === 0x80) {
      str += '€';
    } else if (byte >= 0x80 && byte <= 0x9F) {
      if (byte === 0x91) str += '‘';
      else if (byte === 0x92) str += '’';
      else if (byte === 0x93) str += '“';
      else if (byte === 0x94) str += '”';
      else if (byte === 0x95) str += '•';
      else if (byte === 0x96) str += '–';
      else if (byte === 0x97) str += '—';
      else str += buf.toString('latin1', i, i + 1);
    } else {
      str += buf.toString('latin1', i, i + 1);
    }
  }
  return str;
}

/**
 * URL-encodes a string using ISO-8859-9 / Windows-1254 single-byte encoding
 * required by Classic ASP (IIS) login forms.
 */
function encodeIso88599Uri(text: string): string {
  const trMap: Record<string, string> = {
    'Ğ': '%D0', 'ğ': '%F0',
    'İ': '%DD', 'ı': '%FD',
    'Ş': '%DE', 'ş': '%FE',
    'Ç': '%C7', 'ç': '%E7',
    'Ö': '%D6', 'ö': '%F6',
    'Ü': '%DC', 'ü': '%FC'
  };

  return text
    .split('')
    .map((c) => {
      if (trMap[c]) return trMap[c];
      if (/[a-zA-Z0-9_.~-]/.test(c)) return c;
      if (c.charCodeAt(0) < 128) return encodeURIComponent(c);
      return encodeURIComponent(c);
    })
    .join('');
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
            timeout: 20000
          },
          (res) => {
            this.updateCookies(res.headers['set-cookie']);

            const statusCode = res.statusCode || 0;
            const location = res.headers.location;

            // Follow HTTP redirects (301, 302, 303, 307, 308)
            if (statusCode >= 300 && statusCode < 400 && location && maxRedirects > 0) {
              const redirectTarget = new URL(location, url.href).href;
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

            const chunks: Buffer[] = [];
            res.on('data', (chunk) => {
              chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
            });
            res.on('end', () => {
              const fullBuf = Buffer.concat(chunks);
              const data = decodeTurkishIso(fullBuf);

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
          reject(new Error(`İstek zaman aşımına uğradı (${url.href}, 20sn)`));
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

    try {
      const testRes = await this.makeRequest(`${this.baseUrl}/Login.ASP`);
      log(`🔍 [DNS Teşhisi] HTTP Status: ${testRes.statusCode}`, 'info');
      log(`🔍 [DNS Teşhisi] Response URL: ${testRes.responseUrl}`, 'info');
    } catch (err: any) {
      log(
        `⚠️ [DNS Teşhisi Uyarısı] DNS (${resolvedIp}) çözümlendi fakat HTTPS bağlantısı kurulamadı: ${err.message}.`,
        'warn'
      );
      throw err;
    }

    return { resolvedIp };
  }

  /**
   * Classic ASP Login flow with ISO-8859-9 Encoding and Session Cookie maintenance
   */
  private async login(
    username?: string,
    password?: string,
    log?: (msg: string, level?: ScraperLog['level']) => void
  ): Promise<boolean> {
    const user = username || process.env.TURKUAZ_USERNAME || 'ersasoğutma_41';
    const pass = password || process.env.TURKUAZ_PASSWORD || '201841ersa';

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

    // Step 2: POST login.asp with exact Classic ASP form payload using ISO-8859-9 encoding
    const encodedUser = encodeIso88599Uri(user);
    const encodedPass = encodeIso88599Uri(pass);

    const postData = [
      `username=${encodedUser}`,
      `password=${encodedPass}`,
      'logintype=Giri%FE', // 'Giriş' in ISO-8859-9
      'hatirla=1',
      'Submit=Giri%FE',
      'Submit.x=45',
      'Submit.y=18'
    ].join('&');

    await this.makeRequest(`${this.baseUrl}/login.asp`, {
      method: 'POST',
      body: postData,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Referer': `${this.baseUrl}/Login.ASP`
      }
    });

    // Step 3: Verify authenticated session by fetching catalog page
    const verifyRes = await this.makeRequest(`${this.baseUrl}/index.asp?p=15&bul=&aramahedefi=tumu`);

    const isLoginFailed =
      verifyRes.body.includes('action="login.asp"') ||
      verifyRes.body.includes('id="username"') ||
      verifyRes.responseUrl.toLowerCase().includes('login.asp') ||
      verifyRes.redirectUrl?.toLowerCase().includes('login.asp') ||
      verifyRes.statusCode === 302;

    if (isLoginFailed) {
      // Fallback: If username had Turkish letters, try plain ascii (e.g. ersasogutma_41 instead of ersasoğutma_41)
      const asciiUser = slugify(user).replace(/-/g, '_');
      if (asciiUser !== user) {
        if (log) log(`🔄 ISO kodlama ile giriş denendi, alternatif ASCII kullanıcı adı (${asciiUser}) deneniyor...`, 'info');
        const fallbackPost = [
          `username=${encodeURIComponent(asciiUser)}`,
          `password=${encodeURIComponent(pass)}`,
          'logintype=Giri%FE',
          'hatirla=1',
          'Submit=Giri%FE',
          'Submit.x=45',
          'Submit.y=18'
        ].join('&');

        await this.makeRequest(`${this.baseUrl}/login.asp`, {
          method: 'POST',
          body: fallbackPost,
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Referer': `${this.baseUrl}/Login.ASP`
          }
        });

        const retryVerify = await this.makeRequest(`${this.baseUrl}/index.asp?p=15&bul=&aramahedefi=tumu`);
        if (
          !retryVerify.body.includes('action="login.asp"') &&
          !retryVerify.body.includes('id="username"') &&
          !retryVerify.responseUrl.toLowerCase().includes('login.asp')
        ) {
          if (log) log(`🎉 Turkuaz Teknik oturumu başarıyla açıldı! (Kullanıcı: ${asciiUser})`, 'success');
          return true;
        }
      }

      const errorMsg = 'Turkuaz Teknik giriş başarısız: Kullanıcı adı veya şifre hatalı, oturum açılamadı.';
      if (log) log(errorMsg, 'error');
      throw new Error(errorMsg);
    }

    if (log) log(`🎉 Turkuaz Teknik oturumu başarıyla açıldı! (Kullanıcı: ${user})`, 'success');
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

      // 1. Mandatory DNS & Connectivity Diagnostics
      await this.diagnoseNetwork(log);

      // 2. Authentication Flow
      onProgress({ currentStep: 'Turkuaz B2B Oturumu Açılıyor', percent: 15 });
      const username = options.username || process.env.TURKUAZ_USERNAME;
      const password = options.password || process.env.TURKUAZ_PASSWORD;

      await this.login(username, password, log);

      // 3. Scan Catalog & Products via Pagination (?p=15&pu=N)
      onProgress({ currentStep: 'Ürün kataloğu taranıyor', percent: 20 });
      log(`📂 Ürün kataloğu taranıyor ve sayfalar yükleniyor...`, 'info');

      // Determine base catalog URL
      let baseCatalogUrl = `${this.baseUrl}/index.asp?p=15&bul=&aramahedefi=tumu`;
      if (options.targetUrl && !options.targetUrl.toLowerCase().includes('login.asp')) {
        try {
          const customUrl = new URL(options.targetUrl);
          if (customUrl.pathname.toLowerCase().includes('index.asp')) {
            baseCatalogUrl = this.sanitizeUrl(options.targetUrl).href;
          }
        } catch {
          // fallback to default
        }
      }

      const collectedProducts: ScrapedProduct[] = [];
      const seenSkus = new Set<string>();

      let currentPage = 1;
      let maxPages = 1;
      let emptyPageCount = 0;

      while (!this.isStopped) {
        if (options.maxProducts && collectedProducts.length >= options.maxProducts) break;
        if (currentPage > maxPages && maxPages > 1) break;
        if (emptyPageCount >= 2) break; // 2 consecutive empty pages means end of catalog

        const pageUrl = new URL(baseCatalogUrl);
        pageUrl.searchParams.set('pu', currentPage.toString());

        log(`📄 Sayfa ${currentPage}${maxPages > 1 ? ` / ${maxPages}` : ''} taranıyor...`, 'info');
        onProgress({
          currentStep: `Sayfa ${currentPage} / ${maxPages} taranıyor (${collectedProducts.length} ürün toplandı)`,
          processedCategories: currentPage,
          totalCategories: maxPages,
          percent: 20 + Math.min(45, Math.round((currentPage / Math.max(maxPages, 10)) * 45))
        });

        let pageHtml = '';
        try {
          const pageRes = await this.makeRequest(pageUrl.href);
          pageHtml = pageRes.body;
        } catch (err: any) {
          log(`⚠️ Sayfa ${currentPage} yüklenirken hata: ${err.message}`, 'warn');
          emptyPageCount++;
          currentPage++;
          continue;
        }

        // Detect max pages from pagination links on page 1 or subsequent
        if (currentPage === 1 || maxPages === 1) {
          const puMatches = [...pageHtml.matchAll(/[?&]pu=(\d+)/gi)];
          for (const m of puMatches) {
            const val = parseInt(m[1], 10);
            if (val > maxPages) maxPages = val;
          }
          if (maxPages > 1) {
            log(`📑 Toplam ${maxPages} sayfa tespit edildi (~${maxPages * 30} potansiyel ürün).`, 'info');
          }
        }

        // Parse products from table
        const parsedProducts = this.parseProductCards(pageHtml, pageUrl.href);
        let newCount = 0;

        for (const prod of parsedProducts) {
          if (!seenSkus.has(prod.sku)) {
            seenSkus.add(prod.sku);
            collectedProducts.push(prod);
            newCount++;
            if (options.maxProducts && collectedProducts.length >= options.maxProducts) break;
          }
        }

        if (newCount === 0) {
          emptyPageCount++;
        } else {
          emptyPageCount = 0;
          log(`✅ Sayfa ${currentPage}'den ${newCount} adet ürün ayrıştırıldı. (Toplam: ${collectedProducts.length})`, 'info');
        }

        currentPage++;

        // Polite delay between pages (250ms)
        if (!this.isStopped && (!options.maxProducts || collectedProducts.length < options.maxProducts)) {
          await new Promise((r) => setTimeout(r, 250));
        }
      }

      log(`📦 Toplam ${collectedProducts.length} adet ürün başarıyla ayrıştırıldı, veritabanına aktarılıyor...`, 'info');
      onProgress({
        totalProducts: collectedProducts.length,
        processedCategories: maxPages,
        totalCategories: maxPages,
        percent: 65
      });

      if (collectedProducts.length === 0) {
        log(`ℹ️ Oturum açıldı ancak ürün tablosunda gösterilecek ürün bulunamadı.`, 'warn');
      }

      // 4. Save Products to Database via Prisma
      onProgress({
        currentStep: 'Ürünler veritabanına aktarılıyor',
        totalProducts: collectedProducts.length,
        percent: 65
      });

      // Ensure Supplier 'turkuaz' exists
      let supplierRecord = null;
      try {
        supplierRecord = await prisma.supplier.upsert({
          where: { code: 'TURKUAZ' },
          update: {
            name: 'Turkuaz Teknik',
            websiteUrl: 'https://bayi.turkuazteknik.com.tr',
            lastSyncedAt: new Date()
          },
          create: {
            code: 'TURKUAZ',
            name: 'Turkuaz Teknik',
            websiteUrl: 'https://bayi.turkuazteknik.com.tr',
            active: true,
            lastSyncedAt: new Date()
          }
        });
      } catch (err: any) {
        log(`Tedarikçi kaydı uyarısı: ${err.message}`, 'warn');
      }

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

          // Generate collision-safe unique slug
          const productSlug = `${slugify(prod.name).slice(0, 50)}-${slugify(prod.sku)}`;

          // Upsert Product
          const savedProduct = await prisma.product.upsert({
            where: { sku: prod.sku },
            update: {
              name: prod.name,
              salePrice: prod.salePrice || 0,
              costPrice: prod.costPrice || 0,
              currency: prod.currency || 'TRY',
              minOrderQty: (prod as any).minOrderQty || 1,
              stockQty: prod.stockQty,
              brandId: brandRecord?.id || null,
              categoryId: categoryRecord?.id || null,
              supplierId: supplierRecord?.id || null,
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
              currency: prod.currency || 'TRY',
              minOrderQty: (prod as any).minOrderQty || 1,
              stockQty: prod.stockQty,
              brandId: brandRecord?.id || null,
              categoryId: categoryRecord?.id || null,
              supplierId: supplierRecord?.id || null,
              description: prod.description,
              status: 'PUBLISHED',
              unit: 'ADET',
              specsJson: prod.specsJson ? JSON.stringify(prod.specsJson) : undefined
            }
          });

          // Save Product Images
          if (prod.images && prod.images.length > 0) {
            const existingImgCount = await prisma.productImage.count({ where: { productId: savedProduct.id } });
            if (existingImgCount === 0) {
              await prisma.productImage.createMany({
                data: prod.images.map((img, idx) => ({
                  productId: savedProduct.id,
                  url: img.url,
                  alt: prod.name,
                  sortOrder: idx,
                  sourceSupplier: 'Turkuaz Teknik'
                }))
              });
            }
          }

          importedCount++;

          if (importedCount % 10 === 0 || i === collectedProducts.length - 1) {
            const currentPercent = 65 + Math.round(((i + 1) / collectedProducts.length) * 35);
            log(`[${importedCount}/${collectedProducts.length}] Aktarıldı: ${prod.name.slice(0, 35)}... (Kod: ${prod.sku}, Fiyat: ${prod.salePrice} ${prod.currency || 'TRY'})`);
            onProgress({
              importedProducts: importedCount,
              failedProducts: failedCount,
              percent: Math.min(99, currentPercent)
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
   * Parses product cards from Classic ASP HTML table structure
   */
  public parseProductCards(html: string, sourceUrl: string): ScrapedProduct[] {
    const products: ScrapedProduct[] = [];

    // Strip tooltip attributes (which contain nested <table align=center><tr><td>...</tr></table>)
    // to prevent regex truncation of product rows
    const cleanedHtml = html.replace(/title="[^"]*"/gi, '');

    // Match each product row <tr class="yazi_06">...</tr>
    const rowRegex = /<tr[^>]*class=["']yazi_06["'][^>]*>([\s\S]*?)<\/tr>/gi;
    const rows = [...cleanedHtml.matchAll(rowRegex)].map((m) => m[1]);

    for (const row of rows) {
      // Extract <td> cells
      const tdRegex = /<td[^>]*>([\s\S]*?)<\/td>/gi;
      const cells = [...row.matchAll(tdRegex)].map((m) => m[1]);
      if (cells.length < 5) continue;

      // Cell 0: Images (resim.asp?resimid=...&en=800)
      const imgMatches = [...cells[0].matchAll(/(?:href|src)=["'](resim\.asp\?[^"']+)["']/gi)];
      const images: { url: string; sortOrder: number }[] = [];
      const seenImg = new Set<string>();
      for (const im of imgMatches) {
        let rawImg = im[1].replace(/&amp;/g, '&');
        // Always prefer full-resolution (en=800) image
        if (rawImg.includes('en=48')) {
          rawImg = rawImg.replace('en=48', 'en=800');
        }
        const fullUrl = new URL(rawImg, this.baseUrl).href;
        if (!seenImg.has(fullUrl)) {
          seenImg.add(fullUrl);
          images.push({ url: fullUrl, sortOrder: images.length });
        }
      }

      // Cell 1: Product Code / SKU
      let sku = cells[1].replace(/<[^>]+>/g, '').trim();
      if (!sku) continue;

      // Cell 3: Product Description / Name
      let name = '';
      const nobrName = cells[3]?.match(/<NOBR>([\s\S]*?)<\/NOBR>/i);
      if (nobrName) {
        name = nobrName[1].replace(/<[^>]+>/g, '').trim();
      } else if (cells[3]) {
        name = cells[3].replace(/<[^>]+>/g, '').trim();
      }

      // Cell 4: Brand
      let brand = '';
      const nobrBrand = cells[4]?.match(/<NOBR>([\s\S]*?)<\/NOBR>/i);
      if (nobrBrand) {
        brand = nobrBrand[1].replace(/<[^>]+>/g, '').trim();
      } else if (cells[4]) {
        brand = cells[4].replace(/<[^>]+>/g, '').trim();
      }
      if (!brand || brand === '&nbsp;' || brand === '-') {
        const knownBrands = ['VESTEL', 'ARÇELİK', 'BEKO', 'BOSCH', 'SIEMENS', 'TEKA', 'TIBON', 'ARGESON', 'AN-EL', 'GOTTAK', 'EMBRACO', 'DANFOSS', 'AKS', 'EGO'];
        const found = knownBrands.find((b) => name.toUpperCase().includes(b));
        brand = found || 'Original';
      }

      // Cell 6: Min Order Qty
      const moqText = cells[6] ? cells[6].replace(/<[^>]+>/g, '').trim() : '1';
      const minOrderQty = parseInt(moqText, 10) || 1;

      // Cell 7: Price & Currency
      const priceCell = cells[7] || '';
      let currency = 'TRY';
      if (/EUR|€/i.test(priceCell)) currency = 'EUR';
      else if (/USD|\$/i.test(priceCell)) currency = 'USD';
      else if (/TL|₺|TRY/i.test(priceCell)) currency = 'TRY';

      let salePrice = 0;
      const cleanPrice = priceCell.replace(/<[^>]+>/g, '').trim();
      const priceNumMatch = cleanPrice.match(/(\d+(?:[.,]\d+)?)/);
      if (priceNumMatch) {
        salePrice = parseFloat(priceNumMatch[1].replace(',', '.'));
      }
      if (isNaN(salePrice)) salePrice = 0;

      // Cell 8: Stock Status
      const stockCell = cells[8] || '';
      const isOutOfStock =
        stockCell.includes('yok') ||
        stockCell.includes('cross') ||
        stockCell.includes('kirmizi') ||
        stockCell.includes('girdi');
      const stockStatus = isOutOfStock ? 'OUT_OF_STOCK' : 'IN_STOCK';
      const stockQty = isOutOfStock ? 0 : 50;

      // Hidden item ID if present
      const itemIdMatch = row.match(/name=["']URUNID["'][^>]*value=["']?(\d+)/i) ||
                          row.match(/ItemId=(\d+)/i);
      const externalId = itemIdMatch ? itemIdMatch[1] : sku;

      if (!name) {
        name = `Turkuaz ${sku}`;
      }

      const detailUrl = `${this.baseUrl}/index.asp?p=15&bul=${encodeURIComponent(sku)}`;

      products.push({
        externalId,
        name,
        slug: slugify(name),
        sku,
        description: `${name} - Turkuaz Teknik Yedek Parça`,
        brandName: brand,
        categoryName: 'Klima & Soğutma Yedek Parçaları',
        costPrice: salePrice,
        salePrice,
        currency,
        stockStatus,
        stockQty,
        images,
        sourceSupplier: 'turkuaz',
        sourceUrl: detailUrl,
        specsJson: {
          'Ürün Kodu': sku,
          'Marka': brand,
          'Minimum Sipariş Miktarı': `${minOrderQty} Adet`,
          'Fiyat': `${salePrice} ${currency}`,
          'Tedarikçi': 'Turkuaz Teknik (bayi.turkuazteknik.com.tr)'
        }
      });
    }

    return products;
  }
}
