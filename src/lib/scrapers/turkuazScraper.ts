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
    } else if (byte >= 0x80 && byte <= 0x9F) {
      if (byte === 0x80) str += '€';
      else if (byte === 0x91) str += '‘';
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
            timeout: 15000
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
   * Classic ASP Login flow with Session Cookie maintenance and validation
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

    // Step 2: POST login.asp with exact Classic ASP form payload
    const postData = [
      `username=${encodeURIComponent(user)}`,
      `password=${encodeURIComponent(pass)}`,
      'logintype=Giri%FE', // 'Giriş' in ISO-8859-9
      'hatirla=1',
      'Submit=Giri%FE',
      'Submit.x=50',
      'Submit.y=20'
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
      verifyRes.redirectUrl?.toLowerCase().includes('login.asp');

    if (isLoginFailed) {
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
      onProgress({ currentStep: 'Ürün kataloğu taranıyor', percent: 25 });
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

        log(`📄 Sayfa ${currentPage} yükleniyor...`, 'info');
        onProgress({
          currentStep: `Sayfa ${currentPage} taranıyor (${collectedProducts.length} ürün toplandı)`,
          processedCategories: currentPage,
          totalCategories: Math.max(maxPages, currentPage),
          percent: 25 + Math.min(45, Math.round((currentPage / Math.max(maxPages, 10)) * 45))
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

        // Detect max pages from pagination links (?p=15&pu=N)
        const puRegex = /[?&]pu=(\d+)/gi;
        let puMatch;
        let highestPageOnThisPage = 1;
        while ((puMatch = puRegex.exec(pageHtml)) !== null) {
          const pVal = parseInt(puMatch[1], 10);
          if (pVal > highestPageOnThisPage) highestPageOnThisPage = pVal;
        }
        if (highestPageOnThisPage > maxPages) {
          maxPages = highestPageOnThisPage;
          log(`📑 Toplam ${maxPages} sayfa tespit edildi.`, 'info');
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
          log(`✅ Sayfa ${currentPage}'den ${newCount} adet ürün alındı. (Toplam: ${collectedProducts.length})`, 'info');
        }

        currentPage++;

        // Polite delay between pages
        if (!this.isStopped && (!options.maxProducts || collectedProducts.length < options.maxProducts)) {
          await new Promise((r) => setTimeout(r, 350));
        }
      }

      log(`📦 Toplam ${collectedProducts.length} adet ürün başarıyla ayrıştırıldı.`, 'info');
      onProgress({
        totalProducts: collectedProducts.length,
        processedCategories: maxPages,
        totalCategories: maxPages,
        percent: 70
      });

      if (collectedProducts.length === 0) {
        log(`ℹ️ Oturum açıldı ancak ürün tablosunda gösterilecek ürün bulunamadı.`, 'warn');
      }

      // 4. Save Products to Database via Prisma
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
              currency: prod.currency || 'TRY',
              minOrderQty: (prod as any).minOrderQty || 1,
              stockQty: prod.stockQty,
              brandId: brandRecord?.id || null,
              categoryId: categoryRecord?.id || null,
              description: prod.description,
              status: 'ACTIVE',
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
              description: prod.description,
              status: 'ACTIVE',
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
            log(`[${importedCount}/${collectedProducts.length}] Aktarıldı: ${prod.name.slice(0, 35)}... (SKU: ${prod.sku}, Fiyat: ${prod.salePrice} ${prod.currency || 'TRY'})`);
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
   * Parses product cards from Classic ASP HTML table structure
   */
  public parseProductCards(html: string, sourceUrl: string): ScrapedProduct[] {
    const products: ScrapedProduct[] = [];

    // 1. Match Table Rows (<tr>...</tr>)
    const trRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
    const rows = [...html.matchAll(trRegex)].map((m) => m[1]);

    const headerIndices = {
      img: -1,
      code: -1,
      desc: -1,
      brand: -1,
      moq: -1,
      price: -1,
      stock: -1
    };

    for (const rowHtml of rows) {
      const cellRegex = /<(?:td|th)[^>]*>([\s\S]*?)<\/(?:td|th)>/gi;
      const cells = [...rowHtml.matchAll(cellRegex)].map((m) => m[1]);

      if (cells.length < 5) continue;

      const rowCleanText = cells.map((c) => c.replace(/<[^>]+>/g, '').trim()).join(' ').toLowerCase();

      // Check if this row is the table header
      if (
        (rowCleanText.includes('kod') || rowCleanText.includes('rn kodu')) &&
        (rowCleanText.includes('fiyat') || rowCleanText.includes('tutar'))
      ) {
        cells.forEach((c, idx) => {
          const text = c.replace(/<[^>]+>/g, '').trim().toLowerCase();
          if (text.includes('resim') || text.includes('resmi') || text.includes('gorsel')) headerIndices.img = idx;
          else if (text.includes('kod')) headerIndices.code = idx;
          else if (text.includes('aklamas') || text.includes('aciklama') || text.includes('tanm') || text.includes('tanim') || text.includes('ad')) headerIndices.desc = idx;
          else if (text.includes('retici') || text.includes('uretici') || text.includes('marka')) headerIndices.brand = idx;
          else if (text.includes('miktar') || text.includes('moq') || text.includes('min')) headerIndices.moq = idx;
          else if (text.includes('fiyat') || text.includes('tutar')) headerIndices.price = idx;
          else if (text.includes('stok')) headerIndices.stock = idx;
        });
        continue;
      }

      // Default indices if no explicit header mapped (Classic ASP Turkuaz table: 0:Image, 1:Code, 2:Desc, 3:Brand, 4:MOQ, 5:Price, 6:Stock)
      const imgIdx = headerIndices.img !== -1 ? headerIndices.img : 0;
      const codeIdx = headerIndices.code !== -1 ? headerIndices.code : 1;
      const descIdx = headerIndices.desc !== -1 ? headerIndices.desc : 2;
      const brandIdx = headerIndices.brand !== -1 ? headerIndices.brand : 3;
      const moqIdx = headerIndices.moq !== -1 ? headerIndices.moq : 4;
      const priceIdx = headerIndices.price !== -1 ? headerIndices.price : 5;
      const stockIdx = headerIndices.stock !== -1 ? headerIndices.stock : 6;

      // Extract SKU / Code
      const rawCodeCell = cells[codeIdx] || '';
      const code = rawCodeCell.replace(/<[^>]+>/g, '').trim();
      if (!code || code.toLowerCase().includes('kod') || code.length < 2) continue;

      // Extract Description / Name
      const rawDescCell = cells[descIdx] || '';
      const desc = rawDescCell.replace(/<[^>]+>/g, '').trim();

      // Extract Brand
      const rawBrandCell = cells[brandIdx] || '';
      let brand = rawBrandCell.replace(/<[^>]+>/g, '').trim();
      if (!brand || brand === '-' || brand === '&nbsp;') {
        const knownBrands = ['VESTEL', 'ARÇELİK', 'BEKO', 'BOSCH', 'SIEMENS', 'TEKA', 'TIBON', 'ARGESON', 'AN-EL', 'GOTTAK', 'EMBRACO', 'DANFOSS'];
        const found = knownBrands.find((b) => desc.toUpperCase().includes(b));
        brand = found || 'Turkuaz';
      }

      // Extract MOQ
      const rawMoqCell = cells[moqIdx] || '';
      const moqMatch = rawMoqCell.replace(/<[^>]+>/g, '').match(/\d+/);
      const minOrderQty = moqMatch ? parseInt(moqMatch[0], 10) : 1;

      // Extract Price & Currency
      const rawPriceCell = cells[priceIdx] || '';
      const priceText = rawPriceCell.replace(/<[^>]+>/g, '').trim();
      let currency = 'TRY';
      if (/EUR|€/i.test(priceText)) currency = 'EUR';
      else if (/USD|\$/i.test(priceText)) currency = 'USD';
      else if (/TL|₺|TRY/i.test(priceText)) currency = 'TRY';

      let salePrice = 0;
      const cleanP = priceText.replace(/[^\d.,]/g, '');
      if (cleanP.includes('.') && cleanP.includes(',')) {
        salePrice = parseFloat(cleanP.replace(/\./g, '').replace(',', '.'));
      } else if (cleanP.includes(',')) {
        salePrice = parseFloat(cleanP.replace(',', '.'));
      } else if (cleanP) {
        salePrice = parseFloat(cleanP);
      }
      if (isNaN(salePrice)) salePrice = 0;

      // Extract Stock
      const rawStockCell = cells[stockIdx] || '';
      const stockLower = rawStockCell.toLowerCase();
      const isOutOfStock =
        stockLower.includes('cross') ||
        stockLower.includes('yok') ||
        stockLower.includes('kirmizi') ||
        stockLower.includes('sipari') ||
        stockLower.includes('girdi');
      const stockStatus = isOutOfStock ? 'OUT_OF_STOCK' : 'IN_STOCK';
      const stockQty = isOutOfStock ? 0 : 50;

      // Extract Image
      const rawImgCell = cells[imgIdx] || '';
      const imgMatch = rawImgCell.match(/<img[^>]+src=["']([^"']+)["']/i);
      const images: { url: string; sortOrder: number }[] = [];
      if (imgMatch) {
        try {
          const fullImgUrl = new URL(imgMatch[1], this.baseUrl).href;
          images.push({ url: fullImgUrl, sortOrder: 0 });
        } catch {
          // ignore
        }
      }

      const name = desc || `Turkuaz ${code}`;
      const detailUrl = `${this.baseUrl}/index.asp?p=15&bul=${encodeURIComponent(code)}`;

      products.push({
        externalId: code,
        name,
        slug: slugify(name),
        sku: code,
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
          'Ürün Kodu': code,
          'Marka': brand,
          'Minimum Sipariş Miktarı': `${minOrderQty} Adet`,
          'Fiyat': `${salePrice} ${currency}`,
          'Tedarikçi': 'Turkuaz Teknik (bayi.turkuazteknik.com.tr)'
        }
      });
    }

    // Fallback: If table rows didn't match (e.g. if site returned cards/box2), try box regex
    if (products.length === 0) {
      const boxRegex = /<div[^>]*class=["'][^"']*\bbox2\b[^"']*["'][^>]*>([\s\S]*?)<\/div>\s*<\/div>/gi;
      const matches = [...html.matchAll(boxRegex)];
      for (const match of matches) {
        const cardHtml = match[1];
        const titleMatch = cardHtml.match(/<h[234][^>]*>[\s\S]*?<a[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/i) ||
                           cardHtml.match(/<a[^>]*class=["'](?:title|urun_baslik)[^"']*["'][^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/i);
        const name = titleMatch ? titleMatch[2].replace(/<[^>]+>/g, '').trim() : '';
        if (!name) continue;
        const skuMatch = cardHtml.match(/(?:Kod|Stok Kodu|OEM)\s*:\s*<[^>]+>([^<]+)<\/[^>]+>/i) ||
                         cardHtml.match(/(?:Kod|Stok Kodu|OEM)\s*:\s*([^<\n&]+)/i);
        const sku = skuMatch ? skuMatch[1].trim() : `TURKUAZ-${Math.abs(this.hashCode(name))}`;
        const priceMatch = cardHtml.match(/class=["'][^"']*(?:fiyat|price)[^"']*["'][^>]*>([\s\S]*?)<\/[^>]+>/i) ||
                           cardHtml.match(/(\d[\d.,]*\d|\d)\s*(?:TL|₺|USD|\$|EUR|€)/i);
        let salePrice = 0;
        let currency = 'TRY';
        if (priceMatch) {
          const rawPStr = priceMatch[0];
          if (/EUR|€/i.test(rawPStr)) currency = 'EUR';
          else if (/USD|\$/i.test(rawPStr)) currency = 'USD';
          let clean = (priceMatch[1] || priceMatch[0]).replace(/<[^>]+>/g, '').replace(/[^\d.,]/g, '').trim();
          if (clean.includes('.') && clean.includes(',')) clean = clean.replace(/\./g, '').replace(',', '.');
          else if (clean.includes(',')) clean = clean.replace(',', '.');
          const p = parseFloat(clean);
          if (!isNaN(p)) salePrice = p;
        }

        const hasStock = !cardHtml.includes('Tükendi') && !cardHtml.includes('Stokta Yok');
        const imgMatch = cardHtml.match(/<img[^>]+src=["']([^"']+)["']/i);
        const images: { url: string; sortOrder: number }[] = [];
        if (imgMatch) {
          try {
            images.push({ url: new URL(imgMatch[1], this.baseUrl).href, sortOrder: 0 });
          } catch {}
        }

        products.push({
          externalId: sku,
          name,
          slug: slugify(name),
          sku,
          description: `${name} - Turkuaz Teknik Yedek Parça`,
          brandName: 'Turkuaz',
          categoryName: 'Klima & Soğutma Yedek Parçaları',
          costPrice: salePrice,
          salePrice,
          currency,
          stockStatus: hasStock ? 'IN_STOCK' : 'OUT_OF_STOCK',
          stockQty: hasStock ? 50 : 0,
          images,
          sourceSupplier: 'turkuaz',
          sourceUrl: sourceUrl,
          specsJson: {
            'Ürün Kodu': sku,
            'Tedarikçi': 'Turkuaz Teknik (bayi.turkuazteknik.com.tr)'
          }
        });
      }
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
